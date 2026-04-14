#!/usr/bin/env python3
"""
Project Horizons — CurseForge Modpack Builder

Builds a CurseForge-compatible modpack .zip by:
  1. Scanning server/mods/ for JAR files
  2. Computing CurseForge MurmurHash2 fingerprints
  3. Resolving projectID/fileID via CurseForge Fingerprint API
  4. Packaging manifest.json + overrides/ into a distributable zip

Requires:
  - Python 3.10+
  - CURSEFORGE_API_KEY environment variable (get free key at https://console.curseforge.com)

Usage:
    set CURSEFORGE_API_KEY=your_key_here
    python build_curseforge.py
    python build_curseforge.py --version 1.0.0-beta
    python build_curseforge.py --skip-api   (offline mode, uses cached/manual IDs)
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
import shutil
import struct
import sys
import time
import zipfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SERVER_DIR = PROJECT_ROOT / "server"
MODS_DIR = SERVER_DIR / "mods"
DATAPACK_SRC = PROJECT_ROOT / "datapacks" / "horizons-core"
RESOURCEPACK_SRC = PROJECT_ROOT / "resourcepack"
BUILD_DIR = PROJECT_ROOT / "build"
CACHE_FILE = PROJECT_ROOT / "tools" / "curseforge_id_cache.json"

MINECRAFT_VERSION = "1.21.1"
NEOFORGE_VERSION = "21.1.224"
MODPACK_NAME = "Project Horizons"
MODPACK_AUTHOR = "Project Horizons Team"

CF_API_BASE = "https://api.curseforge.com/v1"
GAME_ID_MINECRAFT = 432

# Mods that are custom/private and should go in overrides/mods/ instead of manifest
OVERRIDE_MODS = {
    "depsort-fix-1.0.0.jar",  # Custom mixin mod for AE2 StackOverflow fix
}

# Directories to copy into overrides/
OVERRIDE_DIRS = [
    ("config", "config"),
    ("kubejs", "kubejs"),
    ("defaultconfigs", "defaultconfigs"),
    ("customnpcs", "customnpcs"),
]


# ---------------------------------------------------------------------------
# MurmurHash2 — CurseForge Fingerprint Algorithm
# ---------------------------------------------------------------------------

def _murmur2(data: bytes, seed: int = 1) -> int:
    """
    Compute MurmurHash2 (32-bit) as used by CurseForge for file fingerprinting.

    CurseForge strips whitespace bytes (0x09, 0x0A, 0x0D, 0x20) before hashing.
    """
    length = len(data)
    m = 0x5BD1E995
    r = 24
    h = seed ^ length
    mask32 = 0xFFFFFFFF

    i = 0
    while length >= 4:
        k = struct.unpack_from("<I", data, i)[0]
        k = (k * m) & mask32
        k ^= (k >> r)
        k = (k * m) & mask32

        h = (h * m) & mask32
        h = (h ^ k) & mask32

        i += 4
        length -= 4

    if length == 3:
        h ^= data[i + 2] << 16
    if length >= 2:
        h ^= data[i + 1] << 8
    if length >= 1:
        h ^= data[i]
        h = (h * m) & mask32

    h ^= (h >> 13)
    h = (h * m) & mask32
    h ^= (h >> 15)

    return h


def compute_fingerprint(jar_path: Path) -> int:
    """Compute the CurseForge fingerprint for a JAR file."""
    raw = jar_path.read_bytes()
    # Strip whitespace bytes as CurseForge does
    stripped = bytes(b for b in raw if b not in (0x09, 0x0A, 0x0D, 0x20))
    return _murmur2(stripped)


# ---------------------------------------------------------------------------
# CurseForge API
# ---------------------------------------------------------------------------

def cf_request(endpoint: str, api_key: str, method: str = "GET",
               body: dict | None = None) -> dict:
    """Make a CurseForge API request."""
    url = f"{CF_API_BASE}{endpoint}"
    headers = {
        "Accept": "application/json",
        "x-api-key": api_key,
    }

    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
        method = "POST"

    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")[:200]
        print(f"    [API ERROR] {e.code}: {body_text}")
        return {}
    except URLError as e:
        print(f"    [NETWORK ERROR] {e.reason}")
        return {}


def resolve_fingerprints(fingerprints: dict[int, Path], api_key: str) -> dict[str, dict]:
    """
    Resolve JAR fingerprints to CurseForge project/file IDs.

    Returns dict of filename -> {"projectID": int, "fileID": int, "name": str}
    """
    results: dict[str, dict] = {}
    fp_list = list(fingerprints.keys())

    # API accepts max ~1000 fingerprints per batch
    batch_size = 500
    for i in range(0, len(fp_list), batch_size):
        batch = fp_list[i:i + batch_size]
        print(f"    Resolving batch {i // batch_size + 1} ({len(batch)} fingerprints)...")

        resp = cf_request("/fingerprints", api_key, body={"fingerprints": batch})
        if not resp:
            continue

        exact_matches = resp.get("data", {}).get("exactMatches", [])
        for match in exact_matches:
            file_info = match.get("file", {})
            file_id = file_info.get("id", 0)
            mod_id = file_info.get("modId", 0)
            display_name = file_info.get("displayName", "")
            fingerprint = match.get("file", {}).get("fileFingerprint", 0)

            if fingerprint in fingerprints:
                jar_name = fingerprints[fingerprint].name
                results[jar_name] = {
                    "projectID": mod_id,
                    "fileID": file_id,
                    "name": display_name,
                }

    return results


def search_mod_by_name(name: str, api_key: str) -> dict | None:
    """Fallback: search CurseForge for a mod by name."""
    from urllib.parse import quote
    endpoint = f"/mods/search?gameId={GAME_ID_MINECRAFT}&searchFilter={quote(name)}&gameVersion={MINECRAFT_VERSION}&modLoaderType=6&sortField=2&sortOrder=desc&pageSize=5"
    resp = cf_request(endpoint, api_key)
    if not resp:
        return None

    hits = resp.get("data", [])
    if not hits:
        return None

    # Try to find an exact-ish match
    name_lower = name.lower().replace(" ", "").replace("-", "").replace("_", "")
    for hit in hits:
        hit_name = hit.get("name", "").lower().replace(" ", "").replace("-", "").replace("_", "")
        if name_lower in hit_name or hit_name in name_lower:
            # Find the right file version
            mod_id = hit["id"]
            files_resp = cf_request(f"/mods/{mod_id}/files?gameVersion={MINECRAFT_VERSION}&modLoaderType=6&pageSize=1", api_key)
            if files_resp:
                files = files_resp.get("data", [])
                if files:
                    return {
                        "projectID": mod_id,
                        "fileID": files[0]["id"],
                        "name": hit["name"],
                    }
    return None


# ---------------------------------------------------------------------------
# Cache Management
# ---------------------------------------------------------------------------

def load_cache() -> dict:
    """Load the ID cache from disk."""
    if CACHE_FILE.is_file():
        with CACHE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict) -> None:
    """Save the ID cache to disk."""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE_FILE.open("w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


# ---------------------------------------------------------------------------
# Manifest & Modlist Generation
# ---------------------------------------------------------------------------

def generate_manifest(resolved: dict[str, dict], override_jars: list[str],
                      version: str) -> dict:
    """Generate the CurseForge manifest.json structure."""
    files = []
    for jar_name, info in sorted(resolved.items()):
        if jar_name in OVERRIDE_MODS:
            continue
        files.append({
            "projectID": info["projectID"],
            "fileID": info["fileID"],
            "required": True,
        })

    return {
        "minecraft": {
            "version": MINECRAFT_VERSION,
            "modLoaders": [
                {
                    "id": f"neoforge-{NEOFORGE_VERSION}",
                    "primary": True,
                }
            ],
        },
        "manifestType": "minecraftModpack",
        "manifestVersion": 1,
        "name": MODPACK_NAME,
        "version": version,
        "author": MODPACK_AUTHOR,
        "files": files,
        "overrides": "overrides",
    }


def generate_modlist_html(resolved: dict[str, dict],
                          unresolved: list[str]) -> str:
    """Generate the modlist.html file for CurseForge."""
    lines = [
        "<ul>",
    ]

    for jar_name in sorted(resolved.keys()):
        info = resolved[jar_name]
        pid = info["projectID"]
        name = info.get("name", jar_name)
        if pid > 0:
            url = f"https://www.curseforge.com/minecraft/mc-mods/{pid}"
            lines.append(f'  <li><a href="{url}">{name}</a></li>')
        else:
            lines.append(f"  <li>{name} (manual install)</li>")

    for jar_name in sorted(unresolved):
        lines.append(f"  <li>{jar_name} (included in overrides)</li>")

    lines.append("</ul>")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Packaging
# ---------------------------------------------------------------------------

def zip_directory(source: Path, dest_zip: Path,
                  arc_prefix: str = "") -> int:
    """Recursively zip a directory. Returns file count."""
    count = 0
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(source.rglob("*")):
            if f.is_file():
                arcname = f"{arc_prefix}/{f.relative_to(source)}" if arc_prefix else str(f.relative_to(source))
                zf.write(f, arcname)
                count += 1
    return count


def build_modpack(version: str, skip_api: bool = False) -> Path:
    """Build the full CurseForge modpack zip."""
    start = time.monotonic()
    output_dir = BUILD_DIR / "curseforge"

    # Clean previous build
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"{'=' * 60}")
    print(f"  {MODPACK_NAME} — CurseForge Build (v{version})")
    print(f"{'=' * 60}")
    print(f"  Minecraft: {MINECRAFT_VERSION}")
    print(f"  NeoForge:  {NEOFORGE_VERSION}")
    print()

    # ------------------------------------------------------------------
    # 1. Scan mods
    # ------------------------------------------------------------------
    print("[1/7] Scanning mods directory ...")
    jar_files = sorted(MODS_DIR.glob("*.jar"))
    override_jars = [j for j in jar_files if j.name in OVERRIDE_MODS]
    api_jars = [j for j in jar_files if j.name not in OVERRIDE_MODS]
    print(f"       {len(jar_files)} total JARs")
    print(f"       {len(api_jars)} for CurseForge manifest")
    print(f"       {len(override_jars)} custom (override)")
    print()

    # ------------------------------------------------------------------
    # 2. Compute fingerprints
    # ------------------------------------------------------------------
    print("[2/7] Computing CurseForge fingerprints ...")
    fingerprints: dict[int, Path] = {}
    for jar in api_jars:
        fp = compute_fingerprint(jar)
        fingerprints[fp] = jar
    print(f"       {len(fingerprints)} fingerprints computed")
    print()

    # ------------------------------------------------------------------
    # 3. Resolve IDs
    # ------------------------------------------------------------------
    print("[3/7] Resolving CurseForge project/file IDs ...")
    cache = load_cache()
    resolved: dict[str, dict] = {}
    unresolved: list[str] = []

    # Check cache first
    cached_count = 0
    uncached_fps: dict[int, Path] = {}
    for fp, jar in fingerprints.items():
        if jar.name in cache:
            resolved[jar.name] = cache[jar.name]
            cached_count += 1
        else:
            uncached_fps[fp] = jar
    print(f"       {cached_count} found in cache")

    api_key = os.environ.get("CURSEFORGE_API_KEY", "")
    if skip_api:
        print("       --skip-api: Skipping CurseForge API calls")
        for fp, jar in uncached_fps.items():
            unresolved.append(jar.name)
    elif not api_key:
        print("       [WARN] CURSEFORGE_API_KEY not set!")
        print("       Set it: set CURSEFORGE_API_KEY=your_key")
        print("       Get a free key: https://console.curseforge.com")
        print("       Falling back to cache + override mode")
        for fp, jar in uncached_fps.items():
            unresolved.append(jar.name)
    else:
        # Fingerprint batch resolve
        if uncached_fps:
            api_results = resolve_fingerprints(uncached_fps, api_key)
            resolved.update(api_results)

            # Update cache with new results
            for jar_name, info in api_results.items():
                cache[jar_name] = info

            # Find still-unresolved mods
            resolved_names = set(resolved.keys())
            for fp, jar in uncached_fps.items():
                if jar.name not in resolved_names:
                    unresolved.append(jar.name)

            # Try name-based search for unresolved
            if unresolved:
                print(f"       {len(unresolved)} unresolved — trying name search...")
                still_unresolved = []
                for jar_name in unresolved:
                    # Extract mod name from filename
                    search_name = jar_name.replace(".jar", "").split("-")[0].replace("_", " ")
                    result = search_mod_by_name(search_name, api_key)
                    if result:
                        resolved[jar_name] = result
                        cache[jar_name] = result
                        print(f"         ✓ {jar_name} → {result['name']}")
                    else:
                        still_unresolved.append(jar_name)
                        print(f"         ✗ {jar_name} — not found on CurseForge")
                unresolved = still_unresolved

        save_cache(cache)

    print(f"       Resolved: {len(resolved)}")
    print(f"       Unresolved: {len(unresolved)}")
    print()

    # ------------------------------------------------------------------
    # 4. Build overrides directory
    # ------------------------------------------------------------------
    print("[4/7] Building overrides ...")
    overrides_dir = output_dir / "overrides"
    overrides_dir.mkdir(parents=True, exist_ok=True)

    # Copy server directories
    file_count = 0
    for src_name, dst_name in OVERRIDE_DIRS:
        src = SERVER_DIR / src_name
        dst = overrides_dir / dst_name
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
            count = sum(1 for _ in dst.rglob("*") if _.is_file())
            file_count += count
            print(f"       {dst_name}/: {count} files")
        else:
            print(f"       {dst_name}/: [not found, skipping]")

    # Copy custom/override mods
    override_mods_dir = overrides_dir / "mods"
    override_mods_dir.mkdir(parents=True, exist_ok=True)
    for jar in override_jars:
        shutil.copy2(jar, override_mods_dir / jar.name)
        print(f"       mods/{jar.name} (custom)")

    # Copy unresolved mods into overrides too
    for jar_name in unresolved:
        jar_path = MODS_DIR / jar_name
        if jar_path.is_file():
            shutil.copy2(jar_path, override_mods_dir / jar_name)

    if unresolved:
        print(f"       mods/: +{len(unresolved)} unresolved mods")

    # Package datapacks
    dp_dir = overrides_dir / "datapacks"
    dp_dir.mkdir(parents=True, exist_ok=True)
    if DATAPACK_SRC.is_dir():
        dp_zip = dp_dir / "horizons-core.zip"
        dp_count = zip_directory(DATAPACK_SRC, dp_zip)
        print(f"       datapacks/horizons-core.zip: {dp_count} files")

    # Copy additional datapacks
    extra_datapacks = PROJECT_ROOT / "datapacks"
    for dp in extra_datapacks.glob("*.zip"):
        shutil.copy2(dp, dp_dir / dp.name)
        print(f"       datapacks/{dp.name}")

    # Copy horizons-quests if it exists
    hq_dir = extra_datapacks / "horizons-quests"
    if hq_dir.is_dir():
        hq_zip = dp_dir / "horizons-quests.zip"
        zip_directory(hq_dir, hq_zip)
        print(f"       datapacks/horizons-quests.zip")

    # Package resource pack
    rp_dir = overrides_dir / "resourcepacks"
    rp_dir.mkdir(parents=True, exist_ok=True)
    if RESOURCEPACK_SRC.is_dir():
        rp_zip = rp_dir / "Project_Horizons_Resources.zip"
        rp_count = zip_directory(RESOURCEPACK_SRC, rp_zip)
        print(f"       resourcepacks/Project_Horizons_Resources.zip: {rp_count} files")

    # Copy additional resource packs
    for rp in RESOURCEPACK_SRC.glob("*.zip"):
        shutil.copy2(rp, rp_dir / rp.name)
        print(f"       resourcepacks/{rp.name}")

    print()

    # ------------------------------------------------------------------
    # 5. Generate manifest.json
    # ------------------------------------------------------------------
    print("[5/7] Generating manifest.json ...")
    manifest = generate_manifest(resolved, [j.name for j in override_jars], version)
    manifest_path = output_dir / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"       {len(manifest['files'])} mods in manifest")
    print()

    # ------------------------------------------------------------------
    # 6. Generate modlist.html
    # ------------------------------------------------------------------
    print("[6/7] Generating modlist.html ...")
    modlist_html = generate_modlist_html(resolved, unresolved + [j.name for j in override_jars])
    modlist_path = output_dir / "modlist.html"
    modlist_path.write_text(modlist_html, encoding="utf-8")
    print(f"       {modlist_path}")
    print()

    # ------------------------------------------------------------------
    # 7. Package final zip
    # ------------------------------------------------------------------
    print("[7/7] Packaging final zip ...")
    zip_name = f"Project_Horizons-{version}-CurseForge.zip"
    final_zip = BUILD_DIR / zip_name
    with zipfile.ZipFile(final_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add manifest.json at root
        zf.write(manifest_path, "manifest.json")

        # Add modlist.html at root
        zf.write(modlist_path, "modlist.html")

        # Add all overrides
        for f in sorted(overrides_dir.rglob("*")):
            if f.is_file():
                arcname = f"overrides/{f.relative_to(overrides_dir)}"
                zf.write(f, arcname)

    zip_size_mb = final_zip.stat().st_size / (1024 * 1024)
    print(f"       -> {final_zip}")
    print(f"       Size: {zip_size_mb:.1f} MB")
    print()

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - start
    print(f"{'=' * 60}")
    print("  BUILD COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Version:          {version}")
    print(f"  Minecraft:        {MINECRAFT_VERSION}")
    print(f"  NeoForge:         {NEOFORGE_VERSION}")
    print(f"  Manifest mods:    {len(manifest['files'])}")
    print(f"  Override mods:    {len(override_jars) + len(unresolved)}")
    print(f"  Total mods:       {len(jar_files)}")
    print(f"  Overrides files:  {file_count}")
    print(f"  Package size:     {zip_size_mb:.1f} MB")
    print(f"  Elapsed:          {elapsed:.1f}s")
    print()

    if unresolved:
        print(f"  [WARN] {len(unresolved)} mods not found on CurseForge:")
        for name in sorted(unresolved):
            print(f"    - {name}")
        print()
        print("  These mods are included in overrides/mods/.")
        print("  If they ARE on CurseForge, add them to")
        print(f"  {CACHE_FILE}")
        print("  with the format: {\"filename.jar\": {\"projectID\": N, \"fileID\": N}}")
        print()

    print(f"  Output: {final_zip}")
    print()

    # Also generate a resolution report
    report_path = BUILD_DIR / "curseforge_resolution_report.txt"
    with report_path.open("w", encoding="utf-8") as f:
        f.write(f"CurseForge Resolution Report — {MODPACK_NAME} v{version}\n")
        f.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'=' * 60}\n\n")

        f.write(f"RESOLVED ({len(resolved)}):\n")
        for jar_name in sorted(resolved.keys()):
            info = resolved[jar_name]
            f.write(f"  {jar_name}\n")
            f.write(f"    projectID: {info['projectID']}, fileID: {info['fileID']}\n")
            f.write(f"    name: {info.get('name', 'unknown')}\n\n")

        f.write(f"\nUNRESOLVED ({len(unresolved)}):\n")
        for name in sorted(unresolved):
            f.write(f"  {name}\n")

        f.write(f"\nOVERRIDE MODS ({len(override_jars)}):\n")
        for jar in override_jars:
            f.write(f"  {jar.name}\n")

    print(f"  Report: {report_path}")
    return final_zip


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build Project Horizons CurseForge modpack package.",
    )
    parser.add_argument(
        "--version", type=str, default="1.0.0-beta.1",
        help="Modpack version (default: 1.0.0-beta.1)",
    )
    parser.add_argument(
        "--skip-api", action="store_true",
        help="Skip CurseForge API calls (use cache/offline mode)",
    )
    args = parser.parse_args()

    build_modpack(version=args.version, skip_api=args.skip_api)


if __name__ == "__main__":
    main()
