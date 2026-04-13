#!/usr/bin/env python3
"""
Project Horizons - Validation Script

Walks the project tree and checks for:
  - Invalid JSON files
  - Incorrect pack.mcmeta pack_format values
  - Missing KubeJS script files
  - Missing datapack files (nutrition tags, faction tags, world events, encounters)
  - Mod-manifest.json structural integrity and mod counts

Requires Python 3.10+.

Usage:
    python validate.py
    python validate.py --verbose
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ANSI colour helpers (work on most modern terminals including Windows 10+)
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

PASS = f"{GREEN}[PASS]{RESET}"
FAIL = f"{RED}[FAIL]{RESET}"
WARN = f"{YELLOW}[WARN]{RESET}"
INFO = f"{CYAN}[INFO]{RESET}"

# ---------------------------------------------------------------------------
# Expected pack_format values (Minecraft 1.21.1)
# ---------------------------------------------------------------------------

# Data packs use pack_format 48 in 1.21.1
EXPECTED_DATA_PACK_FORMAT = 48
# Resource packs use pack_format 34 in 1.21.1
EXPECTED_RESOURCE_PACK_FORMAT = 34

# ---------------------------------------------------------------------------
# Expected KubeJS scripts
# ---------------------------------------------------------------------------

# 53 server scripts + 7 startup scripts + 1 client script = 61 total
EXPECTED_KUBEJS_SCRIPTS: list[str] = [
    # --- client_scripts (1) ---
    "client_scripts/horizons_client.js",
    # --- server_scripts (53) ---
    "server_scripts/ascension/eligibility.js",
    "server_scripts/ascension/multi_ascension.js",
    "server_scripts/ascension/shadow_path.js",
    "server_scripts/ascension/sigil_effects.js",
    "server_scripts/ascension/signature_abilities.js",
    "server_scripts/ascension/subtree_unlock.js",
    "server_scripts/ascension/trial_manager.js",
    "server_scripts/cobblemon/companion_interactions.js",
    "server_scripts/cobblemon/duel_system.js",
    "server_scripts/cobblemon/farm_bound.js",
    "server_scripts/cobblemon/trust_fatigue.js",
    "server_scripts/colony/pokemon_workers.js",
    "server_scripts/colony/wages.js",
    "server_scripts/crime/bounty_board.js",
    "server_scripts/crime/capture.js",
    "server_scripts/crime/counter_bounties.js",
    "server_scripts/crime/crime_stat.js",
    "server_scripts/crime/detection.js",
    "server_scripts/crime/hunters_compass.js",
    "server_scripts/crime/jail.js",
    "server_scripts/crime/npc_hunters.js",
    "server_scripts/dungeons/difficulty_scaling.js",
    "server_scripts/dungeons/gate_system.js",
    "server_scripts/economy/faction_reputation.js",
    "server_scripts/economy/jobs_currency_bridge.js",
    "server_scripts/economy/kingdom_currency.js",
    "server_scripts/economy/price_fluctuation.js",
    "server_scripts/farming/quality_tiers.js",
    "server_scripts/farming/soil_quality.js",
    "server_scripts/kingdoms/village_evolution.js",
    "server_scripts/npcs/travelers.js",
    "server_scripts/player/death_penalty.js",
    "server_scripts/player/nutrition.js",
    "server_scripts/player/thirst_integration.js",
    "server_scripts/progression/pathfinder_levels.js",
    "server_scripts/progression/stage_bridge.js",
    "server_scripts/quests/branching_logic.js",
    "server_scripts/quests/custom_tasks.js",
    "server_scripts/quests/quest_completion_events.js",
    "server_scripts/quests/reward_handlers.js",
    "server_scripts/recipes/cross_mod_bridges.js",
    "server_scripts/trade/caravan_routes.js",
    "server_scripts/villages/needs.js",
    "server_scripts/world/calendar.js",
    "server_scripts/world/crisis_events.js",
    "server_scripts/world/discovery_handler.js",
    "server_scripts/world/encounter_scheduler.js",
    "server_scripts/world/encounter_spawner.js",
    "server_scripts/world/festivals.js",
    "server_scripts/world/location_states.js",
    "server_scripts/world/locations_registry.js",
    "server_scripts/world/player_events.js",
    "server_scripts/world/world_events.js",
    # --- startup_scripts (7) ---
    "startup_scripts/blocks/horizons_blocks.js",
    "startup_scripts/fluids/horizons_fluids.js",
    "startup_scripts/items/ascension_items.js",
    "startup_scripts/items/crime_items.js",
    "startup_scripts/items/farming_tools.js",
    "startup_scripts/items/horizons_items.js",
    "startup_scripts/items/world_items.js",
]

# ---------------------------------------------------------------------------
# Expected datapack files (relative to datapacks/horizons-core/data/horizons/)
# ---------------------------------------------------------------------------

EXPECTED_DATAPACK_FILES: list[str] = [
    # Nutrition tags
    "tags/items/nutrition/beverages.json",
    "tags/items/nutrition/dairy.json",
    "tags/items/nutrition/fruits.json",
    "tags/items/nutrition/grains.json",
    "tags/items/nutrition/herbs_spices.json",
    "tags/items/nutrition/proteins.json",
    "tags/items/nutrition/sugars.json",
    "tags/items/nutrition/vegetables.json",
    # Faction NPC tags
    "tags/faction_npc_coastal.json",
    "tags/faction_npc_forest.json",
    "tags/faction_npc_mountain.json",
    "tags/faction_npc_plains.json",
    "tags/faction_npc_skyborn.json",
    "tags/faction_npc_wanderer.json",
    # Misc tags
    "tags/kingdom_currency.json",
    "tags/precursor_item.json",
    # World events
    "world_events/convergence.json",
    "world_events/eclipse.json",
    "world_events/faction_tournament.json",
    "world_events/gate_surge.json",
    "world_events/grand_market.json",
    "world_events/meteor_shower.json",
    "world_events/migration.json",
    "world_events/precursor_activation.json",
    "world_events/server_anniversary.json",
    "world_events/stranger_caravan.json",
    "world_events/watcher_visit.json",
    # Encounter pools
    "encounters/pools/bandit_ambush.json",
    "encounters/pools/lost_child.json",
    "encounters/pools/wandering_merchant.json",
    # Encounter weights
    "encounters/weights/biome_weights.json",
    "encounters/weights/time_weights.json",
]


# ---------------------------------------------------------------------------
# Validation checks
# ---------------------------------------------------------------------------

class ValidationResult:
    """Accumulates pass/fail/warning counts and messages."""

    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.passes: list[str] = []
        self.total_files: int = 0

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0

    def add_pass(self, msg: str) -> None:
        self.passes.append(msg)

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


def check_json_files(result: ValidationResult, verbose: bool) -> None:
    """Walk the project and validate every .json file."""
    print(f"\n{BOLD}--- JSON Validation ---{RESET}")
    invalid: list[str] = []
    valid_count = 0

    # Directories to skip (large vendored codebases, build outputs)
    skip_dirs = {"codebases", "codebase-zips", "build", "node_modules", ".git"}

    for json_file in sorted(PROJECT_ROOT.rglob("*.json")):
        # Skip vendored / build directories
        parts = json_file.relative_to(PROJECT_ROOT).parts
        if any(p in skip_dirs for p in parts):
            continue

        result.total_files += 1
        try:
            with json_file.open("r", encoding="utf-8") as fh:
                json.load(fh)
            valid_count += 1
            if verbose:
                print(f"  {PASS} {json_file.relative_to(PROJECT_ROOT)}")
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            invalid.append(str(json_file.relative_to(PROJECT_ROOT)))
            result.add_error(f"Invalid JSON: {json_file.relative_to(PROJECT_ROOT)} -- {exc}")
            print(f"  {FAIL} {json_file.relative_to(PROJECT_ROOT)}: {exc}")

    if not invalid:
        print(f"  {PASS} All {valid_count} JSON files are valid")
        result.add_pass(f"{valid_count} JSON files valid")
    else:
        print(f"  {FAIL} {len(invalid)} invalid JSON file(s)")


def check_pack_mcmeta(result: ValidationResult, verbose: bool) -> None:
    """Validate pack_format in project pack.mcmeta files."""
    print(f"\n{BOLD}--- pack.mcmeta Validation ---{RESET}")

    checks: list[tuple[Path, int, str]] = [
        (PROJECT_ROOT / "datapacks" / "horizons-core" / "pack.mcmeta", EXPECTED_DATA_PACK_FORMAT, "datapack"),
        (PROJECT_ROOT / "resourcepack" / "pack.mcmeta", EXPECTED_RESOURCE_PACK_FORMAT, "resourcepack"),
    ]

    # Also check horizons-quests if present
    quests_mcmeta = PROJECT_ROOT / "datapacks" / "horizons-quests" / "pack.mcmeta"
    if quests_mcmeta.is_file():
        checks.append((quests_mcmeta, EXPECTED_DATA_PACK_FORMAT, "quests datapack"))

    for path, expected_fmt, label in checks:
        if not path.is_file():
            result.add_warning(f"pack.mcmeta not found for {label}: {path.relative_to(PROJECT_ROOT)}")
            print(f"  {WARN} {label}: file not found ({path.relative_to(PROJECT_ROOT)})")
            continue

        try:
            with path.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
            fmt = data.get("pack", {}).get("pack_format")
            if fmt == expected_fmt:
                result.add_pass(f"{label} pack_format={fmt}")
                print(f"  {PASS} {label}: pack_format={fmt}")
            else:
                result.add_error(f"{label} pack_format is {fmt}, expected {expected_fmt}")
                print(f"  {FAIL} {label}: pack_format={fmt} (expected {expected_fmt})")
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            result.add_error(f"{label} pack.mcmeta is not valid JSON: {exc}")
            print(f"  {FAIL} {label}: invalid JSON -- {exc}")


def check_kubejs_scripts(result: ValidationResult, verbose: bool) -> None:
    """Verify all expected KubeJS scripts are present."""
    print(f"\n{BOLD}--- KubeJS Scripts ---{RESET}")

    kubejs_root = PROJECT_ROOT / "server" / "kubejs"
    missing: list[str] = []

    for rel in EXPECTED_KUBEJS_SCRIPTS:
        full = kubejs_root / rel
        if full.is_file():
            result.total_files += 1
            if verbose:
                print(f"  {PASS} {rel}")
        else:
            missing.append(rel)
            result.add_error(f"Missing KubeJS script: {rel}")
            print(f"  {FAIL} Missing: {rel}")

    found = len(EXPECTED_KUBEJS_SCRIPTS) - len(missing)
    if not missing:
        print(f"  {PASS} All {found} KubeJS scripts present")
        result.add_pass(f"{found} KubeJS scripts present")
    else:
        print(f"  {FAIL} {len(missing)}/{len(EXPECTED_KUBEJS_SCRIPTS)} scripts missing")


def check_datapack_files(result: ValidationResult, verbose: bool) -> None:
    """Verify all expected datapack data files are present."""
    print(f"\n{BOLD}--- Datapack Files ---{RESET}")

    data_root = PROJECT_ROOT / "datapacks" / "horizons-core" / "data" / "horizons"
    missing: list[str] = []

    for rel in EXPECTED_DATAPACK_FILES:
        full = data_root / rel
        if full.is_file():
            result.total_files += 1
            if verbose:
                print(f"  {PASS} {rel}")
        else:
            missing.append(rel)
            result.add_error(f"Missing datapack file: {rel}")
            print(f"  {FAIL} Missing: {rel}")

    found = len(EXPECTED_DATAPACK_FILES) - len(missing)
    if not missing:
        print(f"  {PASS} All {found} datapack files present")
        result.add_pass(f"{found} datapack files present")
    else:
        print(f"  {FAIL} {len(missing)}/{len(EXPECTED_DATAPACK_FILES)} datapack files missing")


def check_mod_manifest(result: ValidationResult, verbose: bool) -> None:
    """Validate the structure of mod-manifest.json and report mod counts."""
    print(f"\n{BOLD}--- Mod Manifest ---{RESET}")

    manifest_path = PROJECT_ROOT / "tools" / "mod-manifest.json"
    if not manifest_path.is_file():
        result.add_error("mod-manifest.json not found")
        print(f"  {FAIL} mod-manifest.json not found at {manifest_path.relative_to(PROJECT_ROOT)}")
        return

    try:
        with manifest_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        result.add_error(f"mod-manifest.json is invalid JSON: {exc}")
        print(f"  {FAIL} mod-manifest.json invalid JSON: {exc}")
        return

    # Check top-level keys
    required_keys = {"minecraft_version", "loader", "loader_version", "server_mods", "client_mods"}
    missing_keys = required_keys - set(data.keys())
    if missing_keys:
        result.add_error(f"mod-manifest.json missing keys: {missing_keys}")
        print(f"  {FAIL} Missing top-level keys: {', '.join(sorted(missing_keys))}")
    else:
        result.add_pass("mod-manifest.json has all required top-level keys")
        print(f"  {PASS} Top-level structure OK")

    # Count mods per category
    total_server = 0
    total_client = 0

    print(f"\n  {INFO} Server mod categories:")
    for cat, mods in data.get("server_mods", {}).items():
        if not isinstance(mods, list):
            result.add_error(f"server_mods.{cat} is not a list")
            print(f"    {FAIL} {cat}: not a list")
            continue
        count = len(mods)
        total_server += count
        print(f"    {PASS} {cat}: {count} mods")

        # Validate each mod entry has expected fields
        for i, mod in enumerate(mods):
            for field in ("name", "version", "required"):
                if field not in mod:
                    result.add_warning(f"server_mods.{cat}[{i}] missing field '{field}'")

    print(f"\n  {INFO} Client mod categories:")
    for cat, mods in data.get("client_mods", {}).items():
        if not isinstance(mods, list):
            result.add_error(f"client_mods.{cat} is not a list")
            print(f"    {FAIL} {cat}: not a list")
            continue
        count = len(mods)
        total_client += count
        print(f"    {PASS} {cat}: {count} mods")

    print(f"\n  {INFO} Total server mods: {total_server}")
    print(f"  {INFO} Total client mods: {total_client}")
    print(f"  {INFO} Grand total:       {total_server + total_client}")
    result.add_pass(f"Manifest: {total_server} server + {total_client} client mods")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_all_checks(verbose: bool) -> ValidationResult:
    """Execute every validation check and return the combined result."""
    result = ValidationResult()

    check_json_files(result, verbose)
    check_pack_mcmeta(result, verbose)
    check_kubejs_scripts(result, verbose)
    check_datapack_files(result, verbose)
    check_mod_manifest(result, verbose)

    return result


def print_summary(result: ValidationResult) -> None:
    """Print the final validation report."""
    print(f"\n{'=' * 50}")
    print(f"{BOLD}VALIDATION SUMMARY{RESET}")
    print(f"{'=' * 50}")
    print(f"  Total files scanned:  {result.total_files}")
    print(f"  Checks passed:        {GREEN}{len(result.passes)}{RESET}")
    print(f"  Errors:               {RED}{len(result.errors)}{RESET}")
    print(f"  Warnings:             {YELLOW}{len(result.warnings)}{RESET}")

    if result.errors:
        print(f"\n{RED}Errors:{RESET}")
        for err in result.errors:
            print(f"  {RED}x{RESET} {err}")

    if result.warnings:
        print(f"\n{YELLOW}Warnings:{RESET}")
        for w in result.warnings:
            print(f"  {YELLOW}!{RESET} {w}")

    if result.ok:
        print(f"\n{GREEN}{BOLD}All checks passed.{RESET}")
    else:
        print(f"\n{RED}{BOLD}Validation failed with {len(result.errors)} error(s).{RESET}")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate the Project Horizons modpack project for errors.",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show every individual file check, not just summaries.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)

    print(f"{BOLD}=== Project Horizons Validator ==={RESET}")
    print(f"Project root: {PROJECT_ROOT}\n")

    result = run_all_checks(verbose=args.verbose)
    print_summary(result)

    sys.exit(0 if result.ok else 1)


if __name__ == "__main__":
    main()
