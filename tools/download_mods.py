#!/usr/bin/env python3
"""
Project Horizons - Mod Downloader

Reads mod-manifest.json and downloads (or lists) mods for the modpack.

CurseForge and Modrinth both require API keys for automated downloads.
This script provides the full CLI scaffolding and placeholder download logic
so the pipeline is ready once API keys are configured.

Requires Python 3.10+.

Usage:
    python download_mods.py --dry-run
    python download_mods.py --side server
    python download_mods.py --side client --dry-run
    python download_mods.py --side both

Environment variables (set these to enable real downloads):
    CURSEFORGE_API_KEY  - Your CurseForge Core API key
    MODRINTH_API_KEY    - Your Modrinth API token (optional but recommended)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MOD_MANIFEST = PROJECT_ROOT / "tools" / "mod-manifest.json"
DEFAULT_MODS_DIR = PROJECT_ROOT / "server" / "mods"

# Base API URLs (for reference / future implementation)
CURSEFORGE_API_BASE = "https://api.curseforge.com/v1"
MODRINTH_API_BASE = "https://api.modrinth.com/v2"

# Minecraft game ID on CurseForge
CURSEFORGE_GAME_ID = 432

# ANSI colours
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ModEntry:
    """A single mod parsed from the manifest."""

    name: str
    curseforge_slug: str
    modrinth_slug: str
    version: str
    required: bool
    notes: str
    side: str          # "server" or "client"
    category: str      # category key from manifest (e.g. "farming", "visual")


@dataclass
class DownloadSummary:
    """Tracks download outcomes."""

    total: int = 0
    downloaded: int = 0
    skipped: int = 0
    failed: int = 0
    dry_run_listed: int = 0
    details: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Manifest loading
# ---------------------------------------------------------------------------

def load_manifest(path: Path) -> dict:
    """Load and return mod-manifest.json."""
    if not path.is_file():
        print(f"{RED}[ERROR]{RESET} Manifest not found: {path}")
        sys.exit(1)
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def extract_mods(manifest: dict, side_filter: str) -> list[ModEntry]:
    """
    Extract mod entries from the manifest, filtered by side.

    Parameters
    ----------
    side_filter : str
        One of "server", "client", or "both".
    """
    mods: list[ModEntry] = []

    if side_filter in ("server", "both"):
        for cat, entries in manifest.get("server_mods", {}).items():
            if isinstance(entries, list):
                for entry in entries:
                    mods.append(ModEntry(
                        name=entry.get("name", "Unknown"),
                        curseforge_slug=entry.get("curseforge_slug", ""),
                        modrinth_slug=entry.get("modrinth_slug", ""),
                        version=entry.get("version", "latest"),
                        required=entry.get("required", True),
                        notes=entry.get("notes", ""),
                        side="server",
                        category=cat,
                    ))

    if side_filter in ("client", "both"):
        for cat, entries in manifest.get("client_mods", {}).items():
            if isinstance(entries, list):
                for entry in entries:
                    mods.append(ModEntry(
                        name=entry.get("name", "Unknown"),
                        curseforge_slug=entry.get("curseforge_slug", ""),
                        modrinth_slug=entry.get("modrinth_slug", ""),
                        version=entry.get("version", "latest"),
                        required=entry.get("required", True),
                        notes=entry.get("notes", ""),
                        side="client",
                        category=cat,
                    ))

    return mods


# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------

def _slug_to_filename(mod: ModEntry) -> str:
    """Derive a jar filename from the mod name (placeholder)."""
    safe = mod.name.lower().replace(" ", "-").replace("'", "").replace(":", "")
    return f"{safe}-{mod.version}.jar"


def resolve_download_url(mod: ModEntry) -> str | None:
    """
    Resolve the download URL for a mod.

    -----------------------------------------------------------------------
    PLACEHOLDER IMPLEMENTATION
    -----------------------------------------------------------------------
    To enable real downloads, implement the CurseForge and/or Modrinth API
    calls below.  Both APIs require authentication:

      CurseForge:
        - Obtain an API key at https://console.curseforge.com/
        - Set the CURSEFORGE_API_KEY environment variable
        - Use GET /v1/mods/search?gameId=432&slug=<slug> to find the mod
        - Then GET /v1/mods/<modId>/files to find the latest file for the
          correct Minecraft version and loader
        - The response includes a downloadUrl field

      Modrinth:
        - Optionally set MODRINTH_API_KEY for higher rate limits
        - Use GET /v2/project/<slug>/version to list versions
        - Filter by game_versions and loaders
        - The response includes a files[].url field

    The function should return the direct download URL as a string, or None
    if the mod could not be resolved.
    -----------------------------------------------------------------------
    """
    cf_key = os.environ.get("CURSEFORGE_API_KEY", "")
    mr_key = os.environ.get("MODRINTH_API_KEY", "")

    # Try Modrinth first (no key required, just recommended)
    if mod.modrinth_slug:
        # TODO: Implement real Modrinth API call
        # url = f"{MODRINTH_API_BASE}/project/{mod.modrinth_slug}/version"
        # headers = {"User-Agent": "ProjectHorizons/1.0"}
        # if mr_key:
        #     headers["Authorization"] = mr_key
        # req = urllib.request.Request(url, headers=headers)
        # resp = urllib.request.urlopen(req)
        # versions = json.loads(resp.read())
        # ... filter for correct MC version / loader, return files[0].url
        return f"https://api.modrinth.com/v2/project/{mod.modrinth_slug}/version  [PLACEHOLDER]"

    # Fall back to CurseForge
    if mod.curseforge_slug:
        if not cf_key:
            return f"https://api.curseforge.com/v1/mods/search?slug={mod.curseforge_slug}  [NEEDS API KEY]"
        # TODO: Implement real CurseForge API call
        # url = f"{CURSEFORGE_API_BASE}/mods/search?gameId={CURSEFORGE_GAME_ID}&slug={mod.curseforge_slug}"
        # headers = {"x-api-key": cf_key, "Accept": "application/json"}
        # req = urllib.request.Request(url, headers=headers)
        # resp = urllib.request.urlopen(req)
        # data = json.loads(resp.read())
        # ... find matching file, return downloadUrl
        return f"https://api.curseforge.com/v1/mods/search?slug={mod.curseforge_slug}  [PLACEHOLDER]"

    return None


def download_file(url: str, dest: Path) -> bool:
    """
    Download a file from *url* to *dest*.

    Returns True on success, False on failure.

    NOTE: This will only work once resolve_download_url returns real direct
    download URLs instead of placeholders.
    """
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ProjectHorizons/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            dest.parent.mkdir(parents=True, exist_ok=True)
            with dest.open("wb") as fh:
                while True:
                    chunk = resp.read(8192)
                    if not chunk:
                        break
                    fh.write(chunk)
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
        print(f"    {RED}[ERROR]{RESET} Download failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# Main download loop
# ---------------------------------------------------------------------------

def process_mods(
    mods: list[ModEntry],
    mods_dir: Path,
    dry_run: bool,
    verbose: bool,
) -> DownloadSummary:
    """Process each mod: check if present, resolve URL, download or report."""
    summary = DownloadSummary(total=len(mods))

    for mod in mods:
        filename = _slug_to_filename(mod)
        dest = mods_dir / filename
        label = f"{mod.name} ({mod.side}/{mod.category})"

        # Check if already downloaded
        if dest.is_file():
            summary.skipped += 1
            if verbose:
                print(f"  {YELLOW}[SKIP]{RESET} {label} -- already exists: {filename}")
            continue

        # Resolve download URL
        url = resolve_download_url(mod)
        if url is None:
            summary.failed += 1
            print(f"  {RED}[FAIL]{RESET} {label} -- no slug configured, cannot resolve URL")
            summary.details.append(f"FAILED (no slug): {mod.name}")
            continue

        if dry_run:
            summary.dry_run_listed += 1
            req_label = "REQUIRED" if mod.required else "optional"
            print(f"  {CYAN}[DRY]{RESET}  {label} [{req_label}]")
            print(f"         URL: {url}")
            print(f"         Dest: {filename}")
            continue

        # Attempt actual download
        print(f"  {GREEN}[GET]{RESET}  {label} ...")
        print(f"         URL: {url}")

        if "[PLACEHOLDER]" in url or "[NEEDS API KEY]" in url:
            # Placeholder URL -- skip real download
            summary.failed += 1
            print(f"    {YELLOW}[WARN]{RESET} Skipping download: URL is a placeholder.")
            print(f"           Configure API keys and implement resolve_download_url() for real downloads.")
            summary.details.append(f"PLACEHOLDER: {mod.name}")
            continue

        if download_file(url, dest):
            summary.downloaded += 1
            print(f"    {GREEN}[OK]{RESET}   Saved to {filename}")
            summary.details.append(f"DOWNLOADED: {mod.name}")
        else:
            summary.failed += 1
            summary.details.append(f"FAILED: {mod.name}")

    return summary


def print_summary(summary: DownloadSummary, dry_run: bool) -> None:
    """Print the final download report."""
    print(f"\n{'=' * 50}")
    print(f"{BOLD}DOWNLOAD SUMMARY{RESET}")
    print(f"{'=' * 50}")
    print(f"  Total mods:       {summary.total}")

    if dry_run:
        print(f"  Would download:   {CYAN}{summary.dry_run_listed}{RESET}")
    else:
        print(f"  Downloaded:       {GREEN}{summary.downloaded}{RESET}")

    print(f"  Skipped (exist):  {YELLOW}{summary.skipped}{RESET}")
    print(f"  Failed:           {RED}{summary.failed}{RESET}")

    if summary.failed > 0 and not dry_run:
        print(f"\n{YELLOW}Note:{RESET} Most failures are expected until API keys are configured.")
        print("  Set CURSEFORGE_API_KEY and/or MODRINTH_API_KEY environment variables")
        print("  and fill in the slug fields in mod-manifest.json.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download mods for the Project Horizons modpack.",
    )
    parser.add_argument(
        "--side",
        choices=["server", "client", "both"],
        default="both",
        help="Which side's mods to download (default: both).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would be downloaded without actually downloading.",
    )
    parser.add_argument(
        "--mods-dir",
        type=Path,
        default=DEFAULT_MODS_DIR,
        help="Directory to download mods into (default: server/mods/).",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show skipped mods and extra detail.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    mods_dir: Path = args.mods_dir.resolve()

    print(f"{BOLD}=== Project Horizons Mod Downloader ==={RESET}")
    print(f"Manifest:  {MOD_MANIFEST}")
    print(f"Mods dir:  {mods_dir}")
    print(f"Side:      {args.side}")
    print(f"Dry run:   {args.dry_run}")
    print()

    manifest = load_manifest(MOD_MANIFEST)

    mc_version = manifest.get("minecraft_version", "unknown")
    loader = manifest.get("loader", "unknown")
    print(f"Minecraft {mc_version} / {loader}\n")

    mods = extract_mods(manifest, side_filter=args.side)

    if not mods:
        print("No mods matched the selected side filter.")
        sys.exit(0)

    print(f"Found {len(mods)} mod(s) to process.\n")

    mods_dir.mkdir(parents=True, exist_ok=True)
    summary = process_mods(mods, mods_dir, dry_run=args.dry_run, verbose=args.verbose)
    print_summary(summary, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
