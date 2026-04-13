#!/usr/bin/env python3
"""
Project Horizons - Modpack Build & Packaging Script

Packages the Project Horizons Minecraft modpack for distribution, producing
server-pack and client-pack output directories along with CurseForge and
Modrinth distribution manifests.

Requires Python 3.10+.

Usage:
    python build.py
    python build.py --version 0.5.0 --output-dir dist
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
import zipfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MOD_MANIFEST = PROJECT_ROOT / "tools" / "mod-manifest.json"
DATAPACK_SRC = PROJECT_ROOT / "datapacks" / "horizons-core"
RESOURCEPACK_SRC = PROJECT_ROOT / "resourcepack"
SERVER_DIR = PROJECT_ROOT / "server"

# Directories inside server/ that belong in the server pack
SERVER_PACK_DIRS = ["config", "kubejs", "defaultconfigs"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_manifest(path: Path) -> dict:
    """Load and return the mod-manifest.json data."""
    if not path.is_file():
        print(f"  [ERROR] Manifest not found: {path}")
        sys.exit(1)
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def zip_directory(source: Path, dest_zip: Path) -> int:
    """
    Recursively zip *source* into *dest_zip*.

    Returns the number of files added.
    """
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(source.rglob("*")):
            if file.is_file():
                arcname = file.relative_to(source)
                zf.write(file, arcname)
                count += 1
    return count


def copy_server_dirs(output: Path) -> int:
    """
    Copy server configuration directories into the server-pack output.

    Returns the total number of files copied.
    """
    total = 0
    for dirname in SERVER_PACK_DIRS:
        src = SERVER_DIR / dirname
        dst = output / dirname
        if src.is_dir():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            total += sum(1 for _ in dst.rglob("*") if _.is_file())
        else:
            print(f"  [WARN] Server directory not found, skipping: {src}")
    return total


def collect_mod_list(manifest: dict) -> list[dict]:
    """Flatten every mod entry from both server_mods and client_mods."""
    mods: list[dict] = []
    for section in ("server_mods", "client_mods"):
        categories = manifest.get(section, {})
        for _cat_name, entries in categories.items():
            if isinstance(entries, list):
                mods.extend(entries)
    return mods


# ---------------------------------------------------------------------------
# Distribution manifest generators
# ---------------------------------------------------------------------------

def generate_curseforge_manifest(
    manifest: dict,
    version: str,
    output: Path,
) -> Path:
    """
    Write a CurseForge-compatible ``manifest.json`` into *output*.

    The ``files`` list uses placeholder project/file IDs because the source
    manifest does not contain CurseForge numeric IDs.  Fill them in manually
    or via the CurseForge API before uploading.
    """
    mods = collect_mod_list(manifest)
    files = []
    for mod in mods:
        files.append({
            "projectID": 0,          # TODO: resolve from CurseForge API
            "fileID": 0,             # TODO: resolve from CurseForge API
            "required": mod.get("required", True),
            "_comment_name": mod["name"],
        })

    cf_manifest = {
        "minecraft": {
            "version": manifest.get("minecraft_version", "1.21.1"),
            "modLoaders": [
                {
                    "id": f"{manifest.get('loader', 'neoforge')}-{manifest.get('loader_version', 'latest')}",
                    "primary": True,
                }
            ],
        },
        "manifestType": "minecraftModpack",
        "manifestVersion": 1,
        "name": "Project Horizons",
        "version": version,
        "author": "Project Horizons Team",
        "files": files,
        "overrides": "overrides",
    }

    dest = output / "manifest.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as fh:
        json.dump(cf_manifest, fh, indent=2)
    return dest


def generate_modrinth_index(
    manifest: dict,
    version: str,
    output: Path,
) -> Path:
    """
    Write a Modrinth-compatible ``modrinth.index.json`` into *output*.

    Like the CurseForge manifest, download hashes and URLs are placeholders
    that must be filled in before publishing.
    """
    mods = collect_mod_list(manifest)
    files = []
    for mod in mods:
        slug = mod.get("modrinth_slug", "") or mod["name"].lower().replace(" ", "-")
        files.append({
            "path": f"mods/{slug}.jar",
            "hashes": {"sha1": "", "sha512": ""},   # TODO: compute after download
            "downloads": [],                         # TODO: add Modrinth CDN URLs
            "fileSize": 0,
            "_comment_name": mod["name"],
        })

    mr_index = {
        "formatVersion": 1,
        "game": "minecraft",
        "versionId": version,
        "name": "Project Horizons",
        "summary": "A civilization-building Minecraft modpack with Cobblemon, factions, economy, and more.",
        "files": files,
        "dependencies": {
            "minecraft": manifest.get("minecraft_version", "1.21.1"),
            manifest.get("loader", "neoforge"): manifest.get("loader_version", "latest"),
        },
    }

    dest = output / "modrinth.index.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as fh:
        json.dump(mr_index, fh, indent=2)
    return dest


# ---------------------------------------------------------------------------
# Main build pipeline
# ---------------------------------------------------------------------------

def build(output_dir: Path, version: str) -> None:
    """Run the full build pipeline."""
    start = time.monotonic()
    print(f"=== Project Horizons Build (v{version}) ===\n")

    # ------------------------------------------------------------------
    # 1. Load mod manifest
    # ------------------------------------------------------------------
    print("[1/7] Loading mod manifest ...")
    manifest = load_manifest(MOD_MANIFEST)
    mc_version = manifest.get("minecraft_version", "unknown")
    loader = manifest.get("loader", "unknown")
    all_mods = collect_mod_list(manifest)
    print(f"       Minecraft {mc_version} / {loader}")
    print(f"       {len(all_mods)} total mod entries\n")

    # ------------------------------------------------------------------
    # 2. Package datapack
    # ------------------------------------------------------------------
    print("[2/7] Packaging horizons-core datapack ...")
    dp_zip = output_dir / "datapacks" / "horizons-core.zip"
    dp_count = zip_directory(DATAPACK_SRC, dp_zip)
    print(f"       -> {dp_zip}  ({dp_count} files)\n")

    # ------------------------------------------------------------------
    # 3. Package resource pack
    # ------------------------------------------------------------------
    print("[3/7] Packaging resource pack ...")
    rp_zip = output_dir / "Project_Horizons_Resources.zip"
    rp_count = zip_directory(RESOURCEPACK_SRC, rp_zip)
    print(f"       -> {rp_zip}  ({rp_count} files)\n")

    # ------------------------------------------------------------------
    # 4. Generate CurseForge manifest
    # ------------------------------------------------------------------
    print("[4/7] Generating CurseForge manifest ...")
    cf_path = generate_curseforge_manifest(manifest, version, output_dir / "client-pack")
    print(f"       -> {cf_path}\n")

    # ------------------------------------------------------------------
    # 5. Generate Modrinth index
    # ------------------------------------------------------------------
    print("[5/7] Generating Modrinth index ...")
    mr_path = generate_modrinth_index(manifest, version, output_dir / "client-pack")
    print(f"       -> {mr_path}\n")

    # ------------------------------------------------------------------
    # 6. Build server pack
    # ------------------------------------------------------------------
    print("[6/7] Building server pack ...")
    server_out = output_dir / "server-pack"
    server_out.mkdir(parents=True, exist_ok=True)
    srv_files = copy_server_dirs(server_out)

    # Also include the datapack zip in the server pack
    dp_server_dest = server_out / "datapacks" / "horizons-core.zip"
    dp_server_dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(dp_zip, dp_server_dest)
    print(f"       -> {server_out}  ({srv_files} config files + datapack)\n")

    # ------------------------------------------------------------------
    # 7. Build client pack
    # ------------------------------------------------------------------
    print("[7/7] Building client pack ...")
    client_out = output_dir / "client-pack"
    client_out.mkdir(parents=True, exist_ok=True)

    # Copy resource pack zip into client pack
    rp_client_dest = client_out / "resourcepacks" / "Project_Horizons_Resources.zip"
    rp_client_dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(rp_zip, rp_client_dest)

    # Copy datapack zip into client pack overrides
    dp_client_dest = client_out / "overrides" / "datapacks" / "horizons-core.zip"
    dp_client_dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(dp_zip, dp_client_dest)
    print(f"       -> {client_out}\n")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - start
    print("=" * 50)
    print("BUILD SUMMARY")
    print("=" * 50)
    print(f"  Version:          {version}")
    print(f"  Minecraft:        {mc_version}")
    print(f"  Loader:           {loader}")
    print(f"  Total mods:       {len(all_mods)}")
    print(f"  Datapack files:   {dp_count}")
    print(f"  Resource files:   {rp_count}")
    print(f"  Server configs:   {srv_files}")
    print(f"  Output dir:       {output_dir}")
    print(f"  Elapsed:          {elapsed:.2f}s")
    print()
    print("Outputs:")
    print(f"  {output_dir / 'datapacks' / 'horizons-core.zip'}")
    print(f"  {output_dir / 'Project_Horizons_Resources.zip'}")
    print(f"  {output_dir / 'server-pack' / ''}")
    print(f"  {output_dir / 'client-pack' / ''}")
    print()
    print("Done.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build and package the Project Horizons modpack.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PROJECT_ROOT / "build",
        help="Root directory for build outputs (default: <project>/build).",
    )
    parser.add_argument(
        "--version",
        type=str,
        default="0.1.0-dev",
        help="Modpack version string embedded in distribution manifests (default: 0.1.0-dev).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    build(output_dir=args.output_dir.resolve(), version=args.version)


if __name__ == "__main__":
    main()
