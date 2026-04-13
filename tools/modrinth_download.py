#!/usr/bin/env python3
"""
Project Horizons — Modrinth Mod Downloader
Downloads mods from Modrinth API for NeoForge 1.21.1
No API key required — Modrinth's API is public.
"""

import json
import sys
import os
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROJECT_ROOT = Path(__file__).parent.parent
MODS_DIR = PROJECT_ROOT / "server" / "mods"
MANIFEST_PATH = PROJECT_ROOT / "tools" / "mod-manifest.json"

MODRINTH_API = "https://api.modrinth.com/v2"
USER_AGENT = "ProjectHorizons/1.0 (modpack-builder)"
GAME_VERSION = "1.21.1"
LOADER = "neoforge"

def api_get(endpoint):
    """Make a GET request to Modrinth API."""
    url = f"{MODRINTH_API}{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"    HTTP {e.code} for {url}")
        return None
    except Exception as e:
        print(f"    Error: {e}")
        return None

def search_mod(name):
    """Search for a mod on Modrinth by name."""
    query = urllib.parse.quote(name)
    facets = urllib.parse.quote(json.dumps([
        [f"versions:{GAME_VERSION}"],
        [f"categories:{LOADER}"]
    ]))
    data = api_get(f"/search?query={query}&facets={facets}&limit=5")
    if not data or not data.get("hits"):
        # Try without loader filter
        facets2 = urllib.parse.quote(json.dumps([
            [f"versions:{GAME_VERSION}"]
        ]))
        data = api_get(f"/search?query={query}&facets={facets2}&limit=5")
    if data and data.get("hits"):
        return data["hits"]
    return []

def get_version(project_id_or_slug, loader=LOADER, game_version=GAME_VERSION):
    """Get the latest version of a mod for our loader and game version."""
    loaders = urllib.parse.quote(json.dumps([loader]))
    versions = urllib.parse.quote(json.dumps([game_version]))
    data = api_get(f"/project/{project_id_or_slug}/version?loaders={loaders}&game_versions={versions}")
    if not data:
        # Try with "forge" loader as fallback (some mods list as forge not neoforge)
        loaders2 = urllib.parse.quote(json.dumps(["forge"]))
        data = api_get(f"/project/{project_id_or_slug}/version?loaders={loaders2}&game_versions={versions}")
    if data and len(data) > 0:
        return data[0]  # Latest version
    return None

def download_file(url, dest_path):
    """Download a file from URL to dest_path."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(dest_path, 'wb') as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"    Download failed: {e}")
        return False

def download_mod(name, slug_hint=""):
    """Search, find, and download a mod. Returns (success, filename)."""
    # Try slug hint first
    if slug_hint:
        version = get_version(slug_hint)
        if version:
            primary = version["files"][0]
            filename = primary["filename"]
            dest = MODS_DIR / filename
            if dest.exists():
                print(f"  [SKIP] {name} — already downloaded ({filename})")
                return True, filename
            print(f"  [DOWN] {name} → {filename}")
            if download_file(primary["url"], dest):
                return True, filename

    # Search by name
    hits = search_mod(name)
    if not hits:
        print(f"  [MISS] {name} — not found on Modrinth")
        return False, ""

    # Try each hit
    for hit in hits:
        slug = hit["slug"]
        version = get_version(slug)
        if version:
            primary = version["files"][0]
            filename = primary["filename"]
            dest = MODS_DIR / filename
            if dest.exists():
                print(f"  [SKIP] {name} — already downloaded ({filename})")
                return True, filename
            print(f"  [DOWN] {name} ({slug}) → {filename}")
            if download_file(primary["url"], dest):
                return True, filename

    print(f"  [MISS] {name} — found on Modrinth but no {GAME_VERSION}/{LOADER} version")
    return False, ""


# Mod slug mappings — Modrinth slugs for mods where the name doesn't match well
SLUG_MAP = {
    # Libraries
    "Architectury API": "architectury-api",
    "Balm": "balm",
    "Cloth Config API": "cloth-config",
    "Curios API": "curios",
    "YUNG's API": "yungs-api",
    "Geckolib": "geckolib",
    "Kotlin for Forge": "kotlin-for-forge",
    "playerAnimator": "playeranimator",
    "Collective": "collective",
    "Bookshelf": "bookshelf-lib",
    "Moonlight Lib": "moonlight",
    "Puzzles Lib": "puzzles-lib",
    "CreativeCore": "creativecore",
    "FTB Library": "ftb-library",
    "FTB XMod Compat": "ftb-xmod-compat",
    "Item Filters": "item-filters",
    "Structurize": "structurize",
    "MultiPiston": "multipiston",
    "BlockUI": "blockui",
    "GlitchCore": "glitchcore",
    # Core engine
    "KubeJS": "kubejs",
    "KubeJS Create": "kubejs-create",
    "LootJS": "lootjs",
    "MoreJS": "morejs",
    "FTB Quests": "ftb-quests",
    "FTB Teams": "ftb-teams",
    "FTB Chunks": "ftb-chunks",
    "AStages": "astages",
    "ProgressiveStages": "progressivestages",
    "Polymorph": "polymorph",
    "CraftTweaker": "crafttweaker",
    # Automation
    "Create": "create",
    "Create: Steam 'n Rails": "create-steam-n-rails",
    "Create: Crafts & Additions": "createaddition",
    "Create: Enchantment Industry": "create-enchantment-industry",
    "Create: Slice & Dice": "create-slice-and-dice",
    "Create: Garnished": "create-garnished",
    "Create: Connected": "create-connected",
    "Immersive Engineering": "immersive-engineering",
    "Immersive Petroleum": "immersivepetroleum",
    "Applied Energistics 2": "ae2",
    # Space
    "Stellaris": "stellaris",
    # Cobblemon
    "Cobblemon": "cobblemon",
    "Cobblemon Loot Balls": "cobblemon-loot-balls",
    "Cobblemon Outbreaks": "cobblemon-outbreaks",
    # Colonies
    "MineColonies": "minecolonies",
    # NPCs
    "Easy NPC": "easy-npc",
    "Radical Cobblemon Trainers": "radical-cobblemon-trainers",
    "Guard Villagers": "guard-villagers",
    "Villager Names": "villager-names-serilum",
    # Economy
    "Lightman's Currency": "lightmans-currency",
    "Lightman's Currency Tech": "lightmans-currency-tech",
    "Jobs+ Remastered": "jobs-remastered",
    # Survival
    "Tough As Nails": "tough-as-nails",
    # Farming
    "Farmer's Delight": "farmers-delight",
    "Farmer's Respite": "farmers-respite",
    "Croptopia": "croptopia",
    "Let's Do: Brewery": "lets-do-brewery",
    "Let's Do: Vinery": "lets-do-vinery",
    "Let's Do: Bakery": "lets-do-bakery",
    "Let's Do: Candlelight": "lets-do-candlelight",
    "Let's Do: HerbalBrews": "lets-do-herbalbrews",
    "Brewin' and Chewin'": "brewin-and-chewin",
    "Cooking for Blockheads": "cooking-for-blockheads",
    "Serene Seasons": "serene-seasons",
    # Combat
    "Better Combat": "better-combat",
    "Combat Roll": "combat-roll",
    "Simply Swords": "simply-swords",
    "Artifacts": "artifacts",
    "Iron's Spells 'n Spellbooks": "irons-spells-n-spellbooks",
    # Dungeons
    "Dungeon Crawl": "dungeon-crawl",
    "When Dungeons Arise": "when-dungeons-arise",
    "YUNG's Better Dungeons": "yungs-better-dungeons",
    "YUNG's Better Mineshafts": "yungs-better-mineshafts",
    "YUNG's Better Strongholds": "yungs-better-strongholds",
    "YUNG's Better Nether Fortresses": "yungs-better-nether-fortresses",
    "YUNG's Better End Island": "yungs-better-end-island",
    "YUNG's Better Desert Temples": "yungs-better-desert-temples",
    "YUNG's Better Ocean Monuments": "yungs-better-ocean-monuments",
    "YUNG's Better Witch Huts": "yungs-better-witch-huts",
    "Repurposed Structures": "repurposed-structures",
    # Worldgen
    "Terralith": "terralith",
    "Tectonic": "tectonic",
    "Nullscape": "nullscape",
    "ChoiceTheorem's Overhauled Village": "choicetheorems-overhauled-village",
    "Towns and Towers": "towns-and-towers",
    "Tidal Towns": "tidal-towns",
    # Building
    "Supplementaries": "supplementaries",
    "Chipped": "chipped",
    "Handcrafted": "handcrafted",
    "Macaw's Doors": "macaws-doors",
    "Macaw's Windows": "macaws-windows",
    "Macaw's Bridges": "macaws-bridges",
    "Macaw's Roofs": "macaws-roofs",
    "Macaw's Fences": "macaws-fences-and-walls",
    "Every Compat": "every-compat",
    # Performance
    "Chunky": "chunky",
    "Spark": "spark",
    "Clumps": "clumps",
    "Saturn": "saturn",
    "ModernFix": "modernfix",
    "FerriteCore": "ferrite-core",
    "ServerCore": "servercore",
    "FastSuite": "fastsuite",
    "FastFurnace": "fastfurnace",
    "FastWorkbench": "fastworkbench",
    "Jade": "jade",
    "JourneyMap": "journeymap",
}


def main():
    if len(sys.argv) < 2:
        print("Usage: python modrinth_download.py <group>")
        print("Groups: libraries, core_engine, automation, space, cobblemon,")
        print("        colonies, npcs, economy, survival, farming, combat,")
        print("        dungeons, worldgen, building, performance, ALL")
        sys.exit(1)

    group = sys.argv[1]
    MODS_DIR.mkdir(parents=True, exist_ok=True)

    # Load manifest
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    server_mods = manifest["server_mods"]

    if group == "ALL":
        groups = list(server_mods.keys())
    else:
        groups = [group]

    total = 0
    success = 0
    skipped = 0
    failed = []

    for g in groups:
        if g not in server_mods:
            print(f"Unknown group: {g}")
            continue

        mods = server_mods[g]
        print(f"\n{'='*60}")
        print(f"  {g.upper()} ({len(mods)} mods)")
        print(f"{'='*60}")

        for mod in mods:
            name = mod["name"]
            total += 1
            slug = SLUG_MAP.get(name, "")
            ok, filename = download_mod(name, slug)
            if ok:
                if "already downloaded" in str(filename):
                    skipped += 1
                success += 1
            else:
                failed.append(name)

            # Rate limiting — be nice to Modrinth API
            time.sleep(0.3)

    print(f"\n{'='*60}")
    print(f"  SUMMARY")
    print(f"{'='*60}")
    print(f"  Total:    {total}")
    print(f"  Success:  {success}")
    print(f"  Failed:   {len(failed)}")
    if failed:
        print(f"\n  Failed mods (need manual download):")
        for name in failed:
            print(f"    - {name}")
    print()


if __name__ == "__main__":
    main()
