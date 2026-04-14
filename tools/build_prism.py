#!/usr/bin/env python3
"""
Project Horizons — Prism Launcher / Modrinth (.mrpack) Builder

Builds a .mrpack modpack by:
  1. Scanning server/mods/ for JAR files
  2. Computing SHA1 + SHA512 hashes
  3. Resolving download URLs via Modrinth hash-lookup API (no API key needed!)
  4. Packaging modrinth.index.json + overrides/ into a .mrpack zip

Requires: Python 3.10+ (no external dependencies)

Usage:
    python build_prism.py
    python build_prism.py --version 1.0.0-beta.1
    python build_prism.py --skip-api   (offline mode — all mods in overrides)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
import zipfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
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
CACHE_FILE = PROJECT_ROOT / "tools" / "modrinth_hash_cache.json"

MINECRAFT_VERSION = "1.21.1"
NEOFORGE_VERSION = "21.1.224"
MODPACK_NAME = "Project Horizons"
MODPACK_SUMMARY = (
    "A civilization-building Minecraft modpack with Cobblemon, kingdoms, "
    "factions, economy, crime, farming, space exploration, and a branching "
    "5-act narrative. 189 mods, 431 quests, 25,000+ lines of custom scripts."
)

MODRINTH_API = "https://api.modrinth.com/v2"

# Mods that are custom/private — always go in overrides/mods/
OVERRIDE_MODS = {
    "depsort-fix-1.0.0.jar",  # Custom mixin mod
}

# Server directories to copy into overrides/
OVERRIDE_DIRS = [
    "config",
    "kubejs",
    "defaultconfigs",
    "customnpcs",
]


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

def compute_hashes(path: Path) -> tuple[str, str, int]:
    """Compute SHA1 and SHA512 hex digests + file size."""
    data = path.read_bytes()
    sha1 = hashlib.sha1(data).hexdigest()
    sha512 = hashlib.sha512(data).hexdigest()
    return sha1, sha512, len(data)


# ---------------------------------------------------------------------------
# Modrinth API
# ---------------------------------------------------------------------------

def modrinth_request(endpoint: str, method: str = "GET",
                     body: dict | None = None) -> dict | list | None:
    """Make a Modrinth API request (no API key needed)."""
    url = f"{MODRINTH_API}{endpoint}"
    headers = {
        "Accept": "application/json",
        "User-Agent": "ProjectHorizons/1.0 (modpack-builder)",
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
        if e.code == 404:
            return None
        body_text = e.read().decode("utf-8", errors="replace")[:200]
        print(f"    [API ERROR] {e.code}: {body_text}")
        return None
    except URLError as e:
        print(f"    [NETWORK ERROR] {e.reason}")
        return None


def resolve_hashes_batch(hash_map: dict[str, tuple[str, Path, int]]) -> dict[str, dict]:
    """
    Batch-resolve SHA512 hashes via Modrinth API.

    hash_map: {sha512: (sha1, jar_path, file_size)}
    Returns: {jar_name: {path, hashes, downloads, fileSize, env, project_name}}
    """
    results: dict[str, dict] = {}
    hashes = list(hash_map.keys())

    # Modrinth batch endpoint: POST /v2/version_files
    # Accepts up to ~1000 hashes
    batch_size = 300
    for i in range(0, len(hashes), batch_size):
        batch = hashes[i:i + batch_size]
        print(f"    Batch {i // batch_size + 1}: resolving {len(batch)} hashes...")

        resp = modrinth_request("/version_files", body={
            "hashes": batch,
            "algorithm": "sha512",
        })

        if not resp or not isinstance(resp, dict):
            continue

        for sha512_hash, version_data in resp.items():
            if sha512_hash not in hash_map:
                continue

            sha1, jar_path, file_size = hash_map[sha512_hash]
            jar_name = jar_path.name

            # Find the matching file in the version's files array
            files = version_data.get("files", [])
            download_url = None
            for f in files:
                f_hashes = f.get("hashes", {})
                if f_hashes.get("sha512") == sha512_hash:
                    download_url = f.get("url")
                    # Use the file's own size if available
                    file_size = f.get("size", file_size)
                    break

            if not download_url:
                # Fallback: use primary file URL
                for f in files:
                    if f.get("primary", False):
                        download_url = f.get("url")
                        break

            if download_url:
                project_id = version_data.get("project_id", "")
                results[jar_name] = {
                    "path": f"mods/{jar_name}",
                    "hashes": {
                        "sha1": sha1,
                        "sha512": sha512_hash,
                    },
                    "downloads": [download_url],
                    "fileSize": file_size,
                    "env": {
                        "client": "required",
                        "server": "required",
                    },
                    "_project_id": project_id,
                    "_project_name": version_data.get("name", jar_name),
                }

        # Rate limit courtesy
        if i + batch_size < len(hashes):
            time.sleep(0.5)

    return results


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

def load_cache() -> dict:
    if CACHE_FILE.is_file():
        with CACHE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE_FILE.open("w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


# ---------------------------------------------------------------------------
# Packaging Helpers
# ---------------------------------------------------------------------------

def zip_directory(source: Path, dest_zip: Path) -> int:
    """Zip a directory. Returns file count."""
    count = 0
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(source.rglob("*")):
            if f.is_file():
                zf.write(f, str(f.relative_to(source)))
                count += 1
    return count


# ---------------------------------------------------------------------------
# Main Build
# ---------------------------------------------------------------------------

def build_mrpack(version: str, skip_api: bool = False) -> Path:
    """Build the .mrpack modpack."""
    start = time.monotonic()
    staging = BUILD_DIR / "mrpack-staging"

    # Clean
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True, exist_ok=True)

    print(f"{'=' * 60}")
    print(f"  {MODPACK_NAME} — Prism / Modrinth Build (v{version})")
    print(f"{'=' * 60}")
    print(f"  Minecraft: {MINECRAFT_VERSION}")
    print(f"  NeoForge:  {NEOFORGE_VERSION}")
    print(f"  Format:    .mrpack (Modrinth modpack)")
    print()

    # ------------------------------------------------------------------
    # 1. Scan & hash mods
    # ------------------------------------------------------------------
    print("[1/6] Scanning and hashing mods ...")
    jar_files = sorted(MODS_DIR.glob("*.jar"))
    override_jars = [j for j in jar_files if j.name in OVERRIDE_MODS]
    api_jars = [j for j in jar_files if j.name not in OVERRIDE_MODS]

    # Compute hashes: {sha512: (sha1, path, size)}
    hash_map: dict[str, tuple[str, Path, int]] = {}
    jar_hashes: dict[str, tuple[str, str, int]] = {}  # {jar_name: (sha1, sha512, size)}

    for jar in api_jars:
        sha1, sha512, size = compute_hashes(jar)
        hash_map[sha512] = (sha1, jar, size)
        jar_hashes[jar.name] = (sha1, sha512, size)

    print(f"       {len(jar_files)} total JARs ({len(api_jars)} to resolve, {len(override_jars)} custom)")
    print()

    # ------------------------------------------------------------------
    # 2. Resolve via Modrinth API
    # ------------------------------------------------------------------
    print("[2/6] Resolving mods via Modrinth API ...")
    cache = load_cache()
    resolved: dict[str, dict] = {}
    unresolved: list[str] = []

    # Check cache
    cached_count = 0
    uncached: dict[str, tuple[str, Path, int]] = {}
    for sha512, (sha1, jar, size) in hash_map.items():
        if jar.name in cache:
            resolved[jar.name] = cache[jar.name]
            cached_count += 1
        else:
            uncached[sha512] = (sha1, jar, size)
    print(f"       {cached_count} found in cache")

    if skip_api:
        print("       --skip-api: Skipping Modrinth API")
        for sha512, (sha1, jar, size) in uncached.items():
            unresolved.append(jar.name)
    else:
        if uncached:
            api_results = resolve_hashes_batch(uncached)
            resolved.update(api_results)

            # Cache new results
            for jar_name, info in api_results.items():
                cache[jar_name] = info

            # Find unresolved
            resolved_names = set(resolved.keys())
            for sha512, (sha1, jar, size) in uncached.items():
                if jar.name not in resolved_names:
                    unresolved.append(jar.name)

            save_cache(cache)

    print(f"       Resolved: {len(resolved)} (Modrinth CDN)")
    print(f"       Unresolved: {len(unresolved)} (will go in overrides)")
    print()

    # ------------------------------------------------------------------
    # 3. Build modrinth.index.json
    # ------------------------------------------------------------------
    print("[3/6] Generating modrinth.index.json ...")

    # Build files array (only resolved mods with CDN URLs)
    index_files = []
    for jar_name in sorted(resolved.keys()):
        info = resolved[jar_name]
        entry = {
            "path": info["path"],
            "hashes": info["hashes"],
            "downloads": info["downloads"],
            "fileSize": info["fileSize"],
        }
        if "env" in info:
            entry["env"] = info["env"]
        index_files.append(entry)

    index = {
        "formatVersion": 1,
        "game": "minecraft",
        "versionId": version,
        "name": MODPACK_NAME,
        "summary": MODPACK_SUMMARY,
        "files": index_files,
        "dependencies": {
            "minecraft": MINECRAFT_VERSION,
            "neoforge": NEOFORGE_VERSION,
        },
    }

    index_path = staging / "modrinth.index.json"
    with index_path.open("w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)

    print(f"       {len(index_files)} mods via Modrinth CDN")
    print()

    # ------------------------------------------------------------------
    # 4. Build overrides
    # ------------------------------------------------------------------
    print("[4/6] Building overrides ...")
    overrides = staging / "overrides"
    overrides.mkdir(parents=True, exist_ok=True)

    file_count = 0

    # Copy config dirs
    for dirname in OVERRIDE_DIRS:
        src = SERVER_DIR / dirname
        dst = overrides / dirname
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
            count = sum(1 for _ in dst.rglob("*") if _.is_file())
            file_count += count
            print(f"       {dirname}/: {count} files")

    # Custom override mods
    mods_override = overrides / "mods"
    mods_override.mkdir(parents=True, exist_ok=True)
    for jar in override_jars:
        shutil.copy2(jar, mods_override / jar.name)
        print(f"       mods/{jar.name} (custom)")

    # Unresolved mods go in overrides too
    for jar_name in unresolved:
        jar_path = MODS_DIR / jar_name
        if jar_path.is_file():
            shutil.copy2(jar_path, mods_override / jar_name)
    if unresolved:
        print(f"       mods/: +{len(unresolved)} unresolved mods bundled")

    # Datapacks
    dp_dir = overrides / "datapacks"
    dp_dir.mkdir(parents=True, exist_ok=True)
    if DATAPACK_SRC.is_dir():
        dp_zip = dp_dir / "horizons-core.zip"
        dp_count = zip_directory(DATAPACK_SRC, dp_zip)
        print(f"       datapacks/horizons-core.zip: {dp_count} files")

    extra_dp = PROJECT_ROOT / "datapacks"
    for dp in extra_dp.glob("*.zip"):
        shutil.copy2(dp, dp_dir / dp.name)
        print(f"       datapacks/{dp.name}")

    hq_dir = extra_dp / "horizons-quests"
    if hq_dir.is_dir():
        zip_directory(hq_dir, dp_dir / "horizons-quests.zip")
        print(f"       datapacks/horizons-quests.zip")

    # Resource packs
    rp_dir = overrides / "resourcepacks"
    rp_dir.mkdir(parents=True, exist_ok=True)
    if RESOURCEPACK_SRC.is_dir():
        rp_zip = rp_dir / "Project_Horizons_Resources.zip"
        rp_count = zip_directory(RESOURCEPACK_SRC, rp_zip)
        print(f"       resourcepacks/Project_Horizons_Resources.zip: {rp_count} files")

    for rp in RESOURCEPACK_SRC.glob("*.zip"):
        shutil.copy2(rp, rp_dir / rp.name)
        print(f"       resourcepacks/{rp.name}")

    print()

    # ------------------------------------------------------------------
    # 5. Package .mrpack
    # ------------------------------------------------------------------
    print("[5/6] Packaging .mrpack ...")
    mrpack_name = f"Project_Horizons-{version}.mrpack"
    mrpack_path = BUILD_DIR / mrpack_name

    with zipfile.ZipFile(mrpack_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # modrinth.index.json at root
        zf.write(index_path, "modrinth.index.json")

        # All overrides
        for f in sorted(overrides.rglob("*")):
            if f.is_file():
                arcname = f"overrides/{f.relative_to(overrides)}"
                zf.write(f, arcname)

    mrpack_size = mrpack_path.stat().st_size / (1024 * 1024)
    print(f"       -> {mrpack_path}")
    print(f"       Size: {mrpack_size:.1f} MB")
    print()

    # ------------------------------------------------------------------
    # 6. Summary
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - start
    override_mod_count = len(override_jars) + len(unresolved)

    print(f"{'=' * 60}")
    print("  BUILD COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Version:            {version}")
    print(f"  Minecraft:          {MINECRAFT_VERSION}")
    print(f"  NeoForge:           {NEOFORGE_VERSION}")
    print(f"  Modrinth CDN mods:  {len(resolved)}")
    print(f"  Override mods:      {override_mod_count}")
    print(f"  Total mods:         {len(jar_files)}")
    print(f"  Override files:     {file_count}")
    print(f"  Package size:       {mrpack_size:.1f} MB")
    print(f"  Elapsed:            {elapsed:.1f}s")
    print()

    if resolved and not skip_api:
        cdn_size = sum(info["fileSize"] for info in resolved.values()) / (1024 * 1024)
        print(f"  Modrinth will auto-download {cdn_size:.0f} MB of mods on install.")
        print()

    if unresolved:
        print(f"  [{len(unresolved)} mods not on Modrinth — bundled in overrides/mods/]:")
        for name in sorted(unresolved)[:15]:
            print(f"    - {name}")
        if len(unresolved) > 15:
            print(f"    ... and {len(unresolved) - 15} more")
        print()

    print(f"  To install: Prism Launcher -> Add Instance -> Import")
    print(f"  -> select {mrpack_name}")
    print()
    print(f"  Output: {mrpack_path}")

    # Resolution report
    report_path = BUILD_DIR / "modrinth_resolution_report.txt"
    with report_path.open("w", encoding="utf-8") as f:
        f.write(f"Modrinth Resolution Report — {MODPACK_NAME} v{version}\n")
        f.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'=' * 60}\n\n")
        f.write(f"RESOLVED via Modrinth CDN ({len(resolved)}):\n")
        for jar_name in sorted(resolved.keys()):
            info = resolved[jar_name]
            f.write(f"  {jar_name}\n")
            f.write(f"    URL: {info['downloads'][0]}\n")
            f.write(f"    Size: {info['fileSize']:,} bytes\n\n")
        f.write(f"\nBUNDLED in overrides ({len(unresolved) + len(override_jars)}):\n")
        for name in sorted(unresolved):
            f.write(f"  {name} (not on Modrinth)\n")
        for jar in override_jars:
            f.write(f"  {jar.name} (custom mod)\n")

    print(f"  Report: {report_path}")

    # Cleanup staging
    shutil.rmtree(staging, ignore_errors=True)

    return mrpack_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build Project Horizons .mrpack for Prism Launcher / Modrinth.",
    )
    parser.add_argument(
        "--version", type=str, default="1.0.0-beta.1",
        help="Modpack version (default: 1.0.0-beta.1)",
    )
    parser.add_argument(
        "--skip-api", action="store_true",
        help="Skip Modrinth API (offline mode — all mods in overrides)",
    )
    args = parser.parse_args()

    build_mrpack(version=args.version, skip_api=args.skip_api)


if __name__ == "__main__":
    main()
