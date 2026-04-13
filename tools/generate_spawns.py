#!/usr/bin/env python3
"""
Project Horizons - Cobblemon Spawn Table Generator

Generates spawn_pool_world JSON files for Cobblemon, placing Pokemon
in biome-appropriate locations with correct rarity buckets, level ranges,
and spawn conditions.

Covers all 151 Gen 1 Pokemon plus key Pokemon from Gens 2-4 used by
gym leaders, Elite Four, and the companion system.

Output:
    datapacks/horizons-core/data/cobblemon/spawn_pool_world/horizons/

Usage:
    python generate_spawns.py              # Generate all spawn files
    python generate_spawns.py --dry-run    # Show what would be generated
    python generate_spawns.py --clean      # Remove existing files first

Requires Python 3.10+. No third-party packages.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = (
    PROJECT_ROOT
    / "datapacks"
    / "horizons-core"
    / "data"
    / "cobblemon"
    / "spawn_pool_world"
    / "horizons"
)

# ---------------------------------------------------------------------------
# Biome tag constants
# ---------------------------------------------------------------------------
PLAINS = "#cobblemon:is_plains"
GRASSLAND = "#cobblemon:is_grassland"
FOREST = "#cobblemon:is_forest"
JUNGLE = "#cobblemon:is_jungle"
MOUNTAIN = "#cobblemon:is_mountain"
ROCKY = "#cobblemon:is_rocky"
OCEAN = "#cobblemon:is_ocean"
COAST = "#cobblemon:is_coast"
RIVER = "#cobblemon:is_river"
SWAMP = "#cobblemon:is_swamp"
DESERT = "#cobblemon:is_desert"
ARID = "#cobblemon:is_arid"
CAVE = "#cobblemon:is_cave"
UNDERGROUND = "#cobblemon:is_underground"
TAIGA = "#cobblemon:is_taiga"
SNOWY = "#cobblemon:is_snowy"
NETHER = "#cobblemon:is_nether"
END = "#cobblemon:is_end"
VOLCANIC = "#cobblemon:is_volcanic"
MUSHROOM = "#cobblemon:is_mushroom"
TROPICAL = "#cobblemon:is_tropical_island"
TUNDRA = "#cobblemon:is_tundra"
FLORAL = "#cobblemon:is_floral"
SAVANNA = "#cobblemon:is_savanna"
BADLANDS = "#cobblemon:is_badlands"
DEEP_OCEAN = "#cobblemon:is_deep_ocean"
FREEZING = "#cobblemon:is_freezing"
CHERRY_BLOSSOM = "#cobblemon:is_cherry_blossom"
DRIPSTONE = "#cobblemon:is_dripstone"
LUSH = "#cobblemon:is_lush"
HILLS = "#cobblemon:is_hills"
PEAK = "#cobblemon:is_peak"
BEACH = "#cobblemon:is_beach"

# ---------------------------------------------------------------------------
# Bucket definitions (matching Cobbleverse)
# ---------------------------------------------------------------------------
COMMON = "common"          # base weight 88.5 in pool
UNCOMMON = "uncommon"      # base weight 10.0
RARE = "rare"              # base weight 1.2
ULTRA_RARE = "ultra-rare"  # base weight 0.3

# ---------------------------------------------------------------------------
# Spawn position types
# ---------------------------------------------------------------------------
GROUNDED = "grounded"
SUBMERGED = "submerged"
SURFACE = "surface"        # water surface
SEAFLOOR = "seafloor"

# ---------------------------------------------------------------------------
# Pokemon spawn definitions
# ---------------------------------------------------------------------------
# Each entry: (pokemon_name, bucket, weight, level_range, position_type,
#              biomes, condition_extras)
#
# condition_extras is a dict merged into the "condition" block.
# Use {"timeRange": "night"} for night-only, {"isThundering": True} for storms, etc.
# ---------------------------------------------------------------------------

POKEMON_SPAWNS: list[tuple[str, str, float, str, str, list[str], dict]] = [
    # -----------------------------------------------------------------------
    # GEN 1 - KANTO (001-151)
    # -----------------------------------------------------------------------

    # --- Bulbasaur line ---
    ("bulbasaur", UNCOMMON, 5.0, "5-20", GROUNDED,
     [JUNGLE, FOREST, TROPICAL], {}),
    ("ivysaur", RARE, 2.0, "16-36", GROUNDED,
     [JUNGLE, FOREST], {}),
    ("venusaur", ULTRA_RARE, 0.8, "32-55", GROUNDED,
     [JUNGLE], {}),

    # --- Charmander line ---
    ("charmander", UNCOMMON, 5.0, "5-20", GROUNDED,
     [VOLCANIC, ARID, DESERT], {}),
    ("charmeleon", RARE, 2.0, "16-36", GROUNDED,
     [VOLCANIC, ARID], {}),
    ("charizard", ULTRA_RARE, 0.8, "36-55", GROUNDED,
     [VOLCANIC], {}),

    # --- Squirtle line ---
    ("squirtle", UNCOMMON, 5.0, "5-20", GROUNDED,
     [COAST, BEACH, RIVER], {}),
    ("wartortle", RARE, 2.0, "16-36", GROUNDED,
     [COAST, RIVER], {}),
    ("blastoise", ULTRA_RARE, 0.8, "32-55", GROUNDED,
     [COAST, OCEAN], {}),

    # --- Caterpie line ---
    ("caterpie", COMMON, 10.0, "5-12", GROUNDED,
     [FOREST, PLAINS], {}),
    ("metapod", COMMON, 8.0, "7-14", GROUNDED,
     [FOREST], {}),
    ("butterfree", UNCOMMON, 4.0, "10-25", GROUNDED,
     [FOREST, PLAINS, FLORAL], {}),

    # --- Weedle line ---
    ("weedle", COMMON, 10.0, "5-12", GROUNDED,
     [FOREST, JUNGLE], {}),
    ("kakuna", COMMON, 8.0, "7-14", GROUNDED,
     [FOREST], {}),
    ("beedrill", UNCOMMON, 4.0, "10-25", GROUNDED,
     [FOREST, JUNGLE], {}),

    # --- Pidgey line ---
    ("pidgey", COMMON, 12.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, FOREST], {}),
    ("pidgeotto", UNCOMMON, 5.0, "18-36", GROUNDED,
     [PLAINS, FOREST, HILLS], {}),
    ("pidgeot", RARE, 2.0, "36-50", GROUNDED,
     [MOUNTAIN, HILLS], {}),

    # --- Rattata / Raticate ---
    ("rattata", COMMON, 12.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, FOREST], {}),
    ("raticate", UNCOMMON, 5.0, "20-35", GROUNDED,
     [PLAINS, FOREST], {}),

    # --- Spearow / Fearow ---
    ("spearow", COMMON, 10.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, SAVANNA], {}),
    ("fearow", UNCOMMON, 4.0, "20-40", GROUNDED,
     [PLAINS, MOUNTAIN, SAVANNA], {}),

    # --- Ekans / Arbok ---
    ("ekans", UNCOMMON, 5.0, "5-20", GROUNDED,
     [SWAMP, JUNGLE, DESERT], {}),
    ("arbok", RARE, 2.0, "22-40", GROUNDED,
     [SWAMP, JUNGLE], {}),

    # --- Pikachu line ---
    ("pichu", UNCOMMON, 4.0, "5-12", GROUNDED,
     [FOREST, PLAINS], {}),
    ("pikachu", UNCOMMON, 3.5, "10-25", GROUNDED,
     [FOREST, PLAINS, GRASSLAND], {"isThundering": True}),
    ("pikachu", COMMON, 8.0, "10-25", GROUNDED,
     [FOREST, PLAINS], {}),
    ("raichu", RARE, 1.5, "26-45", GROUNDED,
     [PLAINS, GRASSLAND], {}),

    # --- Sandshrew / Sandslash ---
    ("sandshrew", UNCOMMON, 6.0, "5-20", GROUNDED,
     [DESERT, ARID, BADLANDS], {}),
    ("sandslash", RARE, 2.5, "22-40", GROUNDED,
     [DESERT, ARID], {}),

    # --- Nidoran lines ---
    ("nidoran♀", COMMON, 9.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, SAVANNA], {}),
    ("nidorina", UNCOMMON, 4.0, "16-33", GROUNDED,
     [PLAINS, GRASSLAND], {}),
    ("nidoqueen", RARE, 1.5, "35-50", GROUNDED,
     [PLAINS, MOUNTAIN], {}),
    ("nidoran♂", COMMON, 9.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, SAVANNA], {}),
    ("nidorino", UNCOMMON, 4.0, "16-33", GROUNDED,
     [PLAINS, GRASSLAND], {}),
    ("nidoking", RARE, 1.5, "35-50", GROUNDED,
     [PLAINS, MOUNTAIN], {}),

    # --- Clefairy / Clefable ---
    ("clefairy", UNCOMMON, 4.0, "8-20", GROUNDED,
     [MOUNTAIN, ROCKY], {"timeRange": "night"}),
    ("clefable", RARE, 1.5, "25-45", GROUNDED,
     [MOUNTAIN], {"timeRange": "night"}),

    # --- Vulpix / Ninetales ---
    ("vulpix", UNCOMMON, 5.0, "8-22", GROUNDED,
     [DESERT, ARID, VOLCANIC], {}),
    ("ninetales", RARE, 1.5, "30-50", GROUNDED,
     [VOLCANIC, DESERT], {}),

    # --- Jigglypuff / Wigglytuff ---
    ("jigglypuff", UNCOMMON, 5.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, FLORAL], {}),
    ("wigglytuff", RARE, 2.0, "25-40", GROUNDED,
     [PLAINS, FLORAL], {}),

    # --- Zubat line ---
    ("zubat", COMMON, 12.0, "5-18", GROUNDED,
     [CAVE, UNDERGROUND], {}),
    ("golbat", UNCOMMON, 5.0, "22-40", GROUNDED,
     [CAVE, UNDERGROUND], {}),
    ("crobat", RARE, 1.5, "35-55", GROUNDED,
     [CAVE, UNDERGROUND], {"timeRange": "night"}),

    # --- Oddish line ---
    ("oddish", COMMON, 9.0, "5-18", GROUNDED,
     [FOREST, JUNGLE, SWAMP], {"timeRange": "night"}),
    ("gloom", UNCOMMON, 4.0, "21-35", GROUNDED,
     [FOREST, JUNGLE], {}),
    ("vileplume", RARE, 1.8, "35-50", GROUNDED,
     [JUNGLE, MUSHROOM], {}),

    # --- Paras / Parasect ---
    ("paras", COMMON, 9.0, "5-18", GROUNDED,
     [MUSHROOM, FOREST, JUNGLE], {}),
    ("parasect", UNCOMMON, 4.0, "24-40", GROUNDED,
     [MUSHROOM, FOREST], {}),

    # --- Venonat / Venomoth ---
    ("venonat", UNCOMMON, 5.0, "5-18", GROUNDED,
     [FOREST, JUNGLE, SWAMP], {"timeRange": "night"}),
    ("venomoth", RARE, 2.0, "31-45", GROUNDED,
     [FOREST, JUNGLE], {"timeRange": "night"}),

    # --- Diglett / Dugtrio ---
    ("diglett", COMMON, 10.0, "5-18", GROUNDED,
     [CAVE, UNDERGROUND, DESERT], {}),
    ("dugtrio", UNCOMMON, 4.0, "26-42", GROUNDED,
     [CAVE, UNDERGROUND], {}),

    # --- Meowth / Persian ---
    ("meowth", UNCOMMON, 6.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, FOREST], {}),
    ("persian", RARE, 2.0, "28-42", GROUNDED,
     [PLAINS, SAVANNA], {}),

    # --- Psyduck / Golduck ---
    ("psyduck", COMMON, 9.0, "5-18", GROUNDED,
     [RIVER, SWAMP, COAST], {}),
    ("golduck", UNCOMMON, 4.0, "33-48", GROUNDED,
     [RIVER, COAST], {}),

    # --- Mankey / Primeape ---
    ("mankey", UNCOMMON, 6.0, "5-20", GROUNDED,
     [MOUNTAIN, ROCKY, FOREST], {}),
    ("primeape", RARE, 2.0, "28-45", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Growlithe / Arcanine ---
    ("growlithe", UNCOMMON, 5.0, "5-20", GROUNDED,
     [VOLCANIC, ARID, SAVANNA], {}),
    ("arcanine", RARE, 1.5, "30-50", GROUNDED,
     [VOLCANIC, SAVANNA], {}),

    # --- Poliwag line ---
    ("poliwag", COMMON, 9.0, "5-18", SUBMERGED,
     [RIVER, SWAMP], {}),
    ("poliwhirl", UNCOMMON, 4.0, "25-40", SUBMERGED,
     [RIVER, SWAMP], {}),
    ("poliwrath", RARE, 1.5, "40-55", SUBMERGED,
     [RIVER], {}),

    # --- Abra line ---
    ("abra", UNCOMMON, 4.0, "5-16", GROUNDED,
     [PLAINS, FOREST], {}),
    ("kadabra", RARE, 2.0, "16-35", GROUNDED,
     [PLAINS, END], {}),
    ("alakazam", ULTRA_RARE, 0.8, "38-55", GROUNDED,
     [END], {}),

    # --- Machop line ---
    ("machop", UNCOMMON, 6.0, "5-20", GROUNDED,
     [MOUNTAIN, ROCKY, CAVE], {}),
    ("machoke", RARE, 2.5, "28-42", GROUNDED,
     [MOUNTAIN, ROCKY], {}),
    ("machamp", ULTRA_RARE, 1.0, "40-55", GROUNDED,
     [MOUNTAIN], {}),

    # --- Bellsprout line ---
    ("bellsprout", COMMON, 9.0, "5-18", GROUNDED,
     [FOREST, JUNGLE, SWAMP], {}),
    ("weepinbell", UNCOMMON, 4.0, "21-35", GROUNDED,
     [FOREST, JUNGLE], {}),
    ("victreebel", RARE, 1.5, "35-50", GROUNDED,
     [JUNGLE], {}),

    # --- Tentacool / Tentacruel ---
    ("tentacool", COMMON, 10.0, "5-20", SUBMERGED,
     [OCEAN, COAST, DEEP_OCEAN], {}),
    ("tentacruel", UNCOMMON, 4.0, "30-48", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),

    # --- Geodude line ---
    ("geodude", COMMON, 10.0, "5-20", GROUNDED,
     [CAVE, MOUNTAIN, ROCKY, UNDERGROUND], {}),
    ("graveler", UNCOMMON, 5.0, "25-40", GROUNDED,
     [CAVE, MOUNTAIN, ROCKY], {}),
    ("golem", RARE, 1.5, "38-55", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Ponyta / Rapidash ---
    ("ponyta", UNCOMMON, 5.0, "8-22", GROUNDED,
     [VOLCANIC, PLAINS, SAVANNA], {}),
    ("rapidash", RARE, 2.0, "40-55", GROUNDED,
     [VOLCANIC, SAVANNA], {}),

    # --- Slowpoke / Slowbro ---
    ("slowpoke", COMMON, 8.0, "5-18", GROUNDED,
     [RIVER, SWAMP, COAST], {}),
    ("slowbro", UNCOMMON, 3.0, "37-50", GROUNDED,
     [RIVER, COAST], {}),

    # --- Magnemite / Magneton ---
    ("magnemite", UNCOMMON, 5.0, "5-20", GROUNDED,
     [CAVE, MOUNTAIN, ROCKY], {}),
    ("magneton", RARE, 2.0, "30-45", GROUNDED,
     [CAVE, MOUNTAIN], {}),

    # --- Farfetch'd ---
    ("farfetchd", RARE, 2.0, "10-25", GROUNDED,
     [PLAINS, GRASSLAND], {}),

    # --- Doduo / Dodrio ---
    ("doduo", UNCOMMON, 6.0, "8-22", GROUNDED,
     [PLAINS, SAVANNA, GRASSLAND], {}),
    ("dodrio", RARE, 2.0, "31-48", GROUNDED,
     [PLAINS, SAVANNA], {}),

    # --- Seel / Dewgong ---
    ("seel", UNCOMMON, 5.0, "8-22", SUBMERGED,
     [TAIGA, SNOWY, FREEZING], {}),
    ("dewgong", RARE, 2.0, "34-50", SUBMERGED,
     [TAIGA, SNOWY], {}),

    # --- Grimer / Muk ---
    ("grimer", UNCOMMON, 5.0, "5-20", GROUNDED,
     [SWAMP, CAVE, UNDERGROUND], {}),
    ("muk", RARE, 2.0, "38-50", GROUNDED,
     [SWAMP, CAVE], {}),

    # --- Shellder / Cloyster ---
    ("shellder", UNCOMMON, 5.0, "5-20", SUBMERGED,
     [OCEAN, COAST, BEACH], {}),
    ("cloyster", RARE, 1.5, "35-50", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),

    # --- Gastly line ---
    ("gastly", UNCOMMON, 6.0, "5-20", GROUNDED,
     [CAVE, SWAMP, NETHER], {"timeRange": "night"}),
    ("haunter", RARE, 2.5, "25-40", GROUNDED,
     [CAVE, NETHER], {"timeRange": "night"}),
    ("gengar", ULTRA_RARE, 0.8, "38-55", GROUNDED,
     [NETHER], {"timeRange": "night"}),

    # --- Onix ---
    ("onix", UNCOMMON, 4.0, "10-30", GROUNDED,
     [CAVE, UNDERGROUND, MOUNTAIN, ROCKY], {}),

    # --- Drowzee / Hypno ---
    ("drowzee", UNCOMMON, 5.0, "5-20", GROUNDED,
     [PLAINS, FOREST], {"timeRange": "night"}),
    ("hypno", RARE, 2.0, "26-45", GROUNDED,
     [FOREST], {"timeRange": "night"}),

    # --- Krabby / Kingler ---
    ("krabby", COMMON, 9.0, "5-18", GROUNDED,
     [COAST, BEACH, RIVER], {}),
    ("kingler", UNCOMMON, 3.0, "28-45", GROUNDED,
     [COAST, BEACH], {}),

    # --- Voltorb / Electrode ---
    ("voltorb", UNCOMMON, 5.0, "5-20", GROUNDED,
     [CAVE, MOUNTAIN], {}),
    ("electrode", RARE, 2.0, "30-45", GROUNDED,
     [CAVE, MOUNTAIN], {}),

    # --- Exeggcute / Exeggutor ---
    ("exeggcute", UNCOMMON, 5.0, "5-18", GROUNDED,
     [JUNGLE, FOREST, TROPICAL], {}),
    ("exeggutor", RARE, 2.0, "35-50", GROUNDED,
     [JUNGLE, TROPICAL], {}),

    # --- Cubone / Marowak ---
    ("cubone", UNCOMMON, 5.0, "5-20", GROUNDED,
     [DESERT, ROCKY, BADLANDS], {}),
    ("marowak", RARE, 2.0, "28-45", GROUNDED,
     [DESERT, BADLANDS], {}),

    # --- Hitmonlee / Hitmonchan ---
    ("hitmonlee", RARE, 2.0, "15-35", GROUNDED,
     [MOUNTAIN, ROCKY], {}),
    ("hitmonchan", RARE, 2.0, "15-35", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Lickitung ---
    ("lickitung", RARE, 2.0, "10-25", GROUNDED,
     [JUNGLE, FOREST], {}),

    # --- Koffing / Weezing ---
    ("koffing", UNCOMMON, 5.0, "5-20", GROUNDED,
     [SWAMP, NETHER, CAVE], {}),
    ("weezing", RARE, 2.0, "35-50", GROUNDED,
     [SWAMP, NETHER], {}),

    # --- Rhyhorn / Rhydon ---
    ("rhyhorn", UNCOMMON, 5.0, "10-25", GROUNDED,
     [MOUNTAIN, ROCKY, BADLANDS], {}),
    ("rhydon", RARE, 2.0, "42-55", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Chansey ---
    ("chansey", ULTRA_RARE, 0.5, "10-35", GROUNDED,
     [PLAINS, FOREST, FLORAL], {}),

    # --- Tangela ---
    ("tangela", UNCOMMON, 4.0, "8-22", GROUNDED,
     [JUNGLE, FOREST, SWAMP], {}),

    # --- Kangaskhan ---
    ("kangaskhan", RARE, 1.5, "15-35", GROUNDED,
     [SAVANNA, PLAINS, GRASSLAND], {}),

    # --- Horsea / Seadra ---
    ("horsea", UNCOMMON, 5.0, "5-20", SUBMERGED,
     [OCEAN, COAST], {}),
    ("seadra", RARE, 2.0, "32-48", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),

    # --- Goldeen / Seaking ---
    ("goldeen", COMMON, 9.0, "5-18", SUBMERGED,
     [RIVER, SWAMP], {}),
    ("seaking", UNCOMMON, 4.0, "33-45", SUBMERGED,
     [RIVER], {}),

    # --- Staryu / Starmie ---
    ("staryu", UNCOMMON, 5.0, "5-20", SUBMERGED,
     [OCEAN, COAST, BEACH], {"timeRange": "night"}),
    ("starmie", RARE, 1.5, "35-50", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {"timeRange": "night"}),

    # --- Mr. Mime ---
    ("mr-mime", RARE, 1.5, "15-35", GROUNDED,
     [PLAINS, FOREST], {}),

    # --- Scyther ---
    ("scyther", RARE, 2.0, "15-30", GROUNDED,
     [FOREST, JUNGLE], {}),

    # --- Jynx ---
    ("jynx", RARE, 1.5, "20-40", GROUNDED,
     [TAIGA, SNOWY, FREEZING], {}),

    # --- Electabuzz ---
    ("electabuzz", RARE, 2.0, "20-40", GROUNDED,
     [PLAINS, MOUNTAIN], {"isThundering": True}),
    ("electabuzz", UNCOMMON, 3.0, "20-40", GROUNDED,
     [PLAINS, SAVANNA], {}),

    # --- Magmar ---
    ("magmar", RARE, 2.0, "20-40", GROUNDED,
     [VOLCANIC, NETHER], {}),

    # --- Pinsir ---
    ("pinsir", RARE, 2.0, "15-30", GROUNDED,
     [FOREST, JUNGLE], {}),

    # --- Tauros ---
    ("tauros", UNCOMMON, 4.0, "10-28", GROUNDED,
     [PLAINS, GRASSLAND, SAVANNA], {}),

    # --- Magikarp / Gyarados ---
    ("magikarp", COMMON, 12.0, "5-18", SUBMERGED,
     [OCEAN, RIVER, COAST, SWAMP], {}),
    ("gyarados", ULTRA_RARE, 0.8, "40-55", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),

    # --- Lapras ---
    ("lapras", ULTRA_RARE, 0.5, "25-50", SUBMERGED,
     [OCEAN, DEEP_OCEAN, FREEZING], {}),

    # --- Ditto ---
    ("ditto", RARE, 1.5, "10-30", GROUNDED,
     [CAVE, FOREST, PLAINS], {}),

    # --- Eevee ---
    ("eevee", UNCOMMON, 4.0, "5-20", GROUNDED,
     [PLAINS, GRASSLAND, FOREST], {}),

    # --- Eeveelutions ---
    ("vaporeon", RARE, 1.5, "25-45", GROUNDED,
     [RIVER, COAST, SWAMP], {}),
    ("jolteon", RARE, 1.5, "25-45", GROUNDED,
     [PLAINS, GRASSLAND], {"isThundering": True}),
    ("jolteon", UNCOMMON, 3.0, "25-45", GROUNDED,
     [PLAINS, SAVANNA], {}),
    ("flareon", RARE, 1.5, "25-45", GROUNDED,
     [VOLCANIC, DESERT, ARID], {}),

    # --- Porygon ---
    ("porygon", ULTRA_RARE, 0.5, "15-35", GROUNDED,
     [CAVE, MOUNTAIN], {}),

    # --- Omanyte / Omastar ---
    ("omanyte", RARE, 1.5, "10-25", SUBMERGED,
     [OCEAN, COAST, DEEP_OCEAN], {}),
    ("omastar", ULTRA_RARE, 0.8, "40-55", SUBMERGED,
     [DEEP_OCEAN], {}),

    # --- Kabuto / Kabutops ---
    ("kabuto", RARE, 1.5, "10-25", SUBMERGED,
     [OCEAN, COAST, DEEP_OCEAN], {}),
    ("kabutops", ULTRA_RARE, 0.8, "40-55", SUBMERGED,
     [DEEP_OCEAN], {}),

    # --- Aerodactyl ---
    ("aerodactyl", ULTRA_RARE, 0.5, "30-55", GROUNDED,
     [MOUNTAIN, PEAK, ROCKY], {}),

    # --- Snorlax ---
    ("snorlax", ULTRA_RARE, 0.5, "25-50", GROUNDED,
     [PLAINS, FOREST, MOUNTAIN], {}),

    # --- Legendary birds ---
    ("articuno", ULTRA_RARE, 0.3, "50-70", GROUNDED,
     [FREEZING, SNOWY, PEAK], {}),
    ("zapdos", ULTRA_RARE, 0.3, "50-70", GROUNDED,
     [MOUNTAIN, PEAK], {"isThundering": True}),
    ("moltres", ULTRA_RARE, 0.3, "50-70", GROUNDED,
     [VOLCANIC, NETHER], {}),

    # --- Dratini line ---
    ("dratini", RARE, 1.5, "10-25", SUBMERGED,
     [RIVER, OCEAN], {}),
    ("dragonair", ULTRA_RARE, 0.8, "30-45", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),
    ("dragonite", ULTRA_RARE, 0.3, "55-70", GROUNDED,
     [MOUNTAIN, PEAK, END], {}),

    # --- Mewtwo ---
    ("mewtwo", ULTRA_RARE, 0.3, "60-70", GROUNDED,
     [END], {}),

    # --- Mew ---
    ("mew", ULTRA_RARE, 0.3, "40-70", GROUNDED,
     [JUNGLE, TROPICAL, END], {}),

    # -----------------------------------------------------------------------
    # GEN 2+ KEY POKEMON (Gym leaders, E4, companions)
    # -----------------------------------------------------------------------

    # --- Chikorita line ---
    ("chikorita", UNCOMMON, 5.0, "5-20", GROUNDED,
     [JUNGLE, FOREST, TROPICAL], {}),
    ("bayleef", RARE, 2.0, "16-36", GROUNDED,
     [JUNGLE, FOREST], {}),
    ("meganium", ULTRA_RARE, 0.8, "32-55", GROUNDED,
     [JUNGLE], {}),

    # --- Cyndaquil line ---
    ("cyndaquil", UNCOMMON, 5.0, "5-20", GROUNDED,
     [VOLCANIC, ARID], {}),
    ("quilava", RARE, 2.0, "14-36", GROUNDED,
     [VOLCANIC, ARID], {}),
    ("typhlosion", ULTRA_RARE, 0.8, "36-55", GROUNDED,
     [VOLCANIC], {}),

    # --- Totodile line ---
    ("totodile", UNCOMMON, 5.0, "5-20", GROUNDED,
     [RIVER, SWAMP, COAST], {}),
    ("croconaw", RARE, 2.0, "18-36", GROUNDED,
     [RIVER, SWAMP], {}),
    ("feraligatr", ULTRA_RARE, 0.8, "30-55", SUBMERGED,
     [RIVER, OCEAN], {}),

    # --- Treecko line ---
    ("treecko", UNCOMMON, 5.0, "5-20", GROUNDED,
     [JUNGLE, FOREST, TROPICAL], {}),
    ("grovyle", RARE, 2.0, "16-36", GROUNDED,
     [JUNGLE, FOREST], {}),
    ("sceptile", ULTRA_RARE, 0.8, "36-55", GROUNDED,
     [JUNGLE, TROPICAL], {}),

    # --- Torchic line / Blaziken ---
    ("torchic", UNCOMMON, 5.0, "5-20", GROUNDED,
     [VOLCANIC, ARID, SAVANNA], {}),
    ("combusken", RARE, 2.0, "16-36", GROUNDED,
     [VOLCANIC, SAVANNA], {}),
    ("blaziken", ULTRA_RARE, 0.8, "36-55", GROUNDED,
     [VOLCANIC], {}),

    # --- Mudkip line / Swampert ---
    ("mudkip", UNCOMMON, 5.0, "5-20", GROUNDED,
     [RIVER, SWAMP], {}),
    ("marshtomp", RARE, 2.0, "16-36", GROUNDED,
     [RIVER, SWAMP], {}),
    ("swampert", ULTRA_RARE, 0.8, "36-55", SUBMERGED,
     [RIVER, SWAMP], {}),

    # --- Murkrow ---
    ("murkrow", UNCOMMON, 5.0, "10-28", GROUNDED,
     [FOREST, SWAMP, CAVE], {"timeRange": "night"}),

    # --- Umbreon ---
    ("umbreon", RARE, 1.5, "25-45", GROUNDED,
     [FOREST, PLAINS], {"timeRange": "night"}),

    # --- Espeon ---
    ("espeon", RARE, 1.5, "25-45", GROUNDED,
     [PLAINS, GRASSLAND], {"timeRange": "day"}),

    # --- Sneasel ---
    ("sneasel", UNCOMMON, 4.0, "15-30", GROUNDED,
     [TAIGA, SNOWY, CAVE], {"timeRange": "night"}),
    ("weavile", RARE, 1.5, "38-55", GROUNDED,
     [TAIGA, SNOWY], {"timeRange": "night"}),

    # --- Swinub line ---
    ("swinub", COMMON, 8.0, "5-18", GROUNDED,
     [TAIGA, SNOWY, TUNDRA, FREEZING], {}),
    ("piloswine", UNCOMMON, 3.5, "33-48", GROUNDED,
     [TAIGA, SNOWY], {}),
    ("mamoswine", RARE, 1.5, "40-55", GROUNDED,
     [SNOWY, FREEZING], {}),

    # --- Steelix ---
    ("steelix", RARE, 1.5, "30-50", GROUNDED,
     [CAVE, UNDERGROUND, MOUNTAIN], {}),

    # --- Scizor ---
    ("scizor", RARE, 1.5, "30-50", GROUNDED,
     [FOREST, JUNGLE], {}),

    # --- Houndour / Houndoom ---
    ("houndour", UNCOMMON, 5.0, "10-25", GROUNDED,
     [NETHER, VOLCANIC, DESERT], {"timeRange": "night"}),
    ("houndoom", RARE, 2.0, "30-50", GROUNDED,
     [NETHER, VOLCANIC], {"timeRange": "night"}),

    # --- Larvitar line ---
    ("larvitar", UNCOMMON, 4.0, "10-25", GROUNDED,
     [MOUNTAIN, ROCKY, CAVE], {}),
    ("pupitar", RARE, 2.0, "30-45", GROUNDED,
     [MOUNTAIN, CAVE], {}),
    ("tyranitar", ULTRA_RARE, 0.5, "50-65", GROUNDED,
     [MOUNTAIN, PEAK], {}),

    # --- Togepi line / Togekiss ---
    ("togepi", UNCOMMON, 4.0, "5-15", GROUNDED,
     [FLORAL, PLAINS, CHERRY_BLOSSOM], {}),
    ("togetic", RARE, 2.0, "25-40", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),
    ("togekiss", ULTRA_RARE, 0.5, "40-55", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM, PEAK], {}),

    # --- Ralts line / Gardevoir ---
    ("ralts", UNCOMMON, 4.0, "5-18", GROUNDED,
     [FOREST, PLAINS, FLORAL], {}),
    ("kirlia", RARE, 2.0, "20-35", GROUNDED,
     [FOREST, FLORAL], {}),
    ("gardevoir", ULTRA_RARE, 0.8, "30-55", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),
    ("gallade", ULTRA_RARE, 0.8, "30-55", GROUNDED,
     [MOUNTAIN, FOREST], {}),

    # --- Aron line / Aggron ---
    ("aron", UNCOMMON, 5.0, "5-20", GROUNDED,
     [CAVE, MOUNTAIN, ROCKY], {}),
    ("lairon", RARE, 2.0, "32-45", GROUNDED,
     [CAVE, MOUNTAIN], {}),
    ("aggron", ULTRA_RARE, 0.8, "42-60", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Roselia / Roserade ---
    ("budew", COMMON, 8.0, "5-15", GROUNDED,
     [FLORAL, FOREST, CHERRY_BLOSSOM], {}),
    ("roselia", UNCOMMON, 4.0, "15-30", GROUNDED,
     [FLORAL, FOREST, CHERRY_BLOSSOM], {}),
    ("roserade", RARE, 1.5, "30-50", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),

    # --- Feebas / Milotic ---
    ("feebas", RARE, 1.5, "10-25", SUBMERGED,
     [RIVER, OCEAN], {}),
    ("milotic", ULTRA_RARE, 0.3, "40-55", SUBMERGED,
     [OCEAN, DEEP_OCEAN], {}),

    # --- Bagon line / Salamence ---
    ("bagon", UNCOMMON, 3.5, "10-25", GROUNDED,
     [MOUNTAIN, ROCKY, CAVE], {}),
    ("shelgon", RARE, 1.5, "30-45", GROUNDED,
     [MOUNTAIN, CAVE], {}),
    ("salamence", ULTRA_RARE, 0.3, "50-65", GROUNDED,
     [MOUNTAIN, PEAK], {}),

    # --- Beldum line / Metagross ---
    ("beldum", UNCOMMON, 3.5, "10-25", GROUNDED,
     [CAVE, MOUNTAIN, END], {}),
    ("metang", RARE, 1.5, "30-45", GROUNDED,
     [CAVE, MOUNTAIN], {}),
    ("metagross", ULTRA_RARE, 0.5, "45-65", GROUNDED,
     [MOUNTAIN, END], {}),

    # --- Shinx line / Luxray ---
    ("shinx", COMMON, 8.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND, SAVANNA], {}),
    ("luxio", UNCOMMON, 4.0, "15-30", GROUNDED,
     [PLAINS, SAVANNA], {}),
    ("luxray", RARE, 1.5, "30-50", GROUNDED,
     [PLAINS, SAVANNA], {"isThundering": True}),
    ("luxray", UNCOMMON, 3.0, "30-50", GROUNDED,
     [PLAINS, SAVANNA], {}),

    # --- Gible line / Garchomp ---
    ("gible", UNCOMMON, 3.5, "10-25", GROUNDED,
     [CAVE, DESERT, UNDERGROUND], {}),
    ("gabite", RARE, 1.5, "24-40", GROUNDED,
     [CAVE, DESERT], {}),
    ("garchomp", ULTRA_RARE, 0.5, "48-65", GROUNDED,
     [DESERT, CAVE], {}),

    # --- Riolu / Lucario ---
    ("riolu", UNCOMMON, 3.5, "5-18", GROUNDED,
     [MOUNTAIN, FOREST, ROCKY], {}),
    ("lucario", RARE, 1.5, "30-50", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Electivire (pre-evo Elekid) ---
    ("elekid", UNCOMMON, 4.0, "5-15", GROUNDED,
     [PLAINS, MOUNTAIN], {}),
    ("electivire", RARE, 1.5, "35-55", GROUNDED,
     [MOUNTAIN, PLAINS], {"isThundering": True}),
    ("electivire", UNCOMMON, 2.5, "35-55", GROUNDED,
     [MOUNTAIN, SAVANNA], {}),

    # --- Magmortar (pre-evo Magby) ---
    ("magby", UNCOMMON, 4.0, "5-15", GROUNDED,
     [VOLCANIC, NETHER], {}),
    ("magmortar", RARE, 1.5, "35-55", GROUNDED,
     [VOLCANIC, NETHER], {}),

    # --- Timburr line / Conkeldurr ---
    ("timburr", UNCOMMON, 5.0, "5-18", GROUNDED,
     [MOUNTAIN, CAVE, ROCKY], {}),
    ("gurdurr", RARE, 2.0, "25-40", GROUNDED,
     [MOUNTAIN, CAVE], {}),
    ("conkeldurr", ULTRA_RARE, 0.8, "40-55", GROUNDED,
     [MOUNTAIN], {}),

    # --- Litwick line / Chandelure ---
    ("litwick", UNCOMMON, 5.0, "5-18", GROUNDED,
     [CAVE, NETHER], {"timeRange": "night"}),
    ("lampent", RARE, 2.0, "33-45", GROUNDED,
     [CAVE, NETHER], {"timeRange": "night"}),
    ("chandelure", ULTRA_RARE, 0.8, "41-55", GROUNDED,
     [NETHER], {"timeRange": "night"}),

    # --- Flabebe line / Florges ---
    ("flabebe", COMMON, 8.0, "5-15", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM, PLAINS], {}),
    ("floette", UNCOMMON, 4.0, "19-35", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),
    ("florges", RARE, 1.5, "35-50", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),

    # --- Shellos / Gastrodon ---
    ("shellos", COMMON, 8.0, "5-18", GROUNDED,
     [COAST, BEACH, SWAMP], {}),
    ("gastrodon", UNCOMMON, 3.0, "30-48", GROUNDED,
     [COAST, SWAMP, BEACH], {}),

    # --- Kingdra (evo of Seadra) ---
    ("kingdra", ULTRA_RARE, 0.5, "45-60", SUBMERGED,
     [DEEP_OCEAN, OCEAN], {}),

    # --- Shroomish / Breloom ---
    ("shroomish", COMMON, 8.0, "5-18", GROUNDED,
     [MUSHROOM, FOREST, JUNGLE], {}),
    ("breloom", UNCOMMON, 3.5, "23-40", GROUNDED,
     [MUSHROOM, FOREST], {}),

    # --- Morelull / Shiinotic ---
    ("morelull", UNCOMMON, 5.0, "5-18", GROUNDED,
     [MUSHROOM, FOREST, LUSH], {"timeRange": "night"}),
    ("shiinotic", RARE, 2.0, "24-40", GROUNDED,
     [MUSHROOM, LUSH], {"timeRange": "night"}),

    # --- Leafeon / Glaceon (more eeveelutions) ---
    ("leafeon", RARE, 1.5, "25-45", GROUNDED,
     [FOREST, JUNGLE], {}),
    ("glaceon", RARE, 1.5, "25-45", GROUNDED,
     [TAIGA, SNOWY, FREEZING], {}),
    ("sylveon", RARE, 1.5, "25-45", GROUNDED,
     [FLORAL, CHERRY_BLOSSOM], {}),

    # --- Mareep line / Ampharos ---
    ("mareep", COMMON, 8.0, "5-18", GROUNDED,
     [PLAINS, GRASSLAND], {}),
    ("flaaffy", UNCOMMON, 4.0, "15-30", GROUNDED,
     [PLAINS, GRASSLAND], {}),
    ("ampharos", RARE, 1.5, "30-50", GROUNDED,
     [PLAINS], {"isThundering": True}),
    ("ampharos", UNCOMMON, 2.5, "30-50", GROUNDED,
     [PLAINS, SAVANNA], {}),

    # --- Skarmory ---
    ("skarmory", RARE, 1.5, "20-40", GROUNDED,
     [MOUNTAIN, ROCKY, PEAK], {}),

    # --- Hoppip line ---
    ("hoppip", COMMON, 9.0, "5-15", GROUNDED,
     [PLAINS, GRASSLAND, FLORAL], {}),
    ("skiploom", UNCOMMON, 4.0, "18-30", GROUNDED,
     [PLAINS, FLORAL], {}),
    ("jumpluff", RARE, 2.0, "27-45", GROUNDED,
     [PLAINS, FLORAL], {}),

    # --- Misdreavus / Mismagius ---
    ("misdreavus", UNCOMMON, 4.0, "10-25", GROUNDED,
     [CAVE, FOREST], {"timeRange": "night"}),
    ("mismagius", RARE, 1.5, "35-50", GROUNDED,
     [CAVE], {"timeRange": "night"}),

    # --- Absol ---
    ("absol", RARE, 1.0, "25-45", GROUNDED,
     [MOUNTAIN, PEAK, TAIGA], {}),

    # --- Tropius ---
    ("tropius", UNCOMMON, 3.0, "25-40", GROUNDED,
     [JUNGLE, TROPICAL], {}),

    # --- Snorunt / Glalie / Froslass ---
    ("snorunt", UNCOMMON, 4.0, "10-25", GROUNDED,
     [TAIGA, SNOWY, FREEZING], {}),
    ("glalie", RARE, 1.5, "42-55", GROUNDED,
     [SNOWY, FREEZING], {}),
    ("froslass", RARE, 1.5, "42-55", GROUNDED,
     [SNOWY, FREEZING], {"timeRange": "night"}),

    # --- Spiritomb ---
    ("spiritomb", ULTRA_RARE, 0.3, "30-50", GROUNDED,
     [CAVE, NETHER], {"timeRange": "night"}),

    # --- Honedge line / Aegislash ---
    ("honedge", UNCOMMON, 4.0, "10-25", GROUNDED,
     [CAVE, UNDERGROUND], {}),
    ("doublade", RARE, 2.0, "35-48", GROUNDED,
     [CAVE, UNDERGROUND], {}),
    ("aegislash", ULTRA_RARE, 0.8, "45-60", GROUNDED,
     [CAVE], {}),

    # --- Phantump / Trevenant ---
    ("phantump", UNCOMMON, 4.0, "10-25", GROUNDED,
     [FOREST, TAIGA], {"timeRange": "night"}),
    ("trevenant", RARE, 1.5, "35-50", GROUNDED,
     [FOREST, TAIGA], {"timeRange": "night"}),

    # --- Deino line / Hydreigon ---
    ("deino", UNCOMMON, 3.0, "10-25", GROUNDED,
     [CAVE, NETHER, UNDERGROUND], {}),
    ("zweilous", RARE, 1.5, "50-60", GROUNDED,
     [CAVE, NETHER], {}),
    ("hydreigon", ULTRA_RARE, 0.3, "64-70", GROUNDED,
     [NETHER, END], {}),

    # --- Goomy line / Goodra ---
    ("goomy", UNCOMMON, 3.5, "10-25", GROUNDED,
     [SWAMP, JUNGLE, LUSH], {}),
    ("sliggoo", RARE, 1.5, "40-52", GROUNDED,
     [SWAMP, JUNGLE], {}),
    ("goodra", ULTRA_RARE, 0.5, "50-65", GROUNDED,
     [SWAMP], {}),

    # --- Noibat / Noivern ---
    ("noibat", UNCOMMON, 4.0, "10-25", GROUNDED,
     [CAVE, UNDERGROUND], {"timeRange": "night"}),
    ("noivern", RARE, 1.5, "48-60", GROUNDED,
     [CAVE], {"timeRange": "night"}),

    # --- Pawniard / Bisharp ---
    ("pawniard", UNCOMMON, 4.0, "10-25", GROUNDED,
     [CAVE, MOUNTAIN, ROCKY], {}),
    ("bisharp", RARE, 1.5, "52-60", GROUNDED,
     [MOUNTAIN, ROCKY], {}),

    # --- Duskull / Dusclops ---
    ("duskull", UNCOMMON, 4.0, "5-20", GROUNDED,
     [CAVE, SWAMP], {"timeRange": "night"}),
    ("dusclops", RARE, 2.0, "37-50", GROUNDED,
     [CAVE], {"timeRange": "night"}),

    # --- Sableye ---
    ("sableye", UNCOMMON, 3.0, "10-28", GROUNDED,
     [CAVE, UNDERGROUND, DRIPSTONE], {"timeRange": "night"}),

    # --- Mawile ---
    ("mawile", UNCOMMON, 3.0, "10-28", GROUNDED,
     [CAVE, UNDERGROUND], {}),

    # --- Snover / Abomasnow ---
    ("snover", UNCOMMON, 5.0, "10-25", GROUNDED,
     [TAIGA, SNOWY, FREEZING], {}),
    ("abomasnow", RARE, 1.5, "40-55", GROUNDED,
     [SNOWY, FREEZING], {}),

    # --- Hippopotas / Hippowdon ---
    ("hippopotas", UNCOMMON, 4.0, "10-25", GROUNDED,
     [DESERT, ARID, BADLANDS], {}),
    ("hippowdon", RARE, 1.5, "34-50", GROUNDED,
     [DESERT, BADLANDS], {}),

    # --- Rotom ---
    ("rotom", RARE, 1.0, "15-35", GROUNDED,
     [CAVE, MOUNTAIN], {"isThundering": True}),
    ("rotom", ULTRA_RARE, 0.5, "15-35", GROUNDED,
     [CAVE], {}),
]


# ---------------------------------------------------------------------------
# JSON generation
# ---------------------------------------------------------------------------

def _make_spawn_id(pokemon: str, index: int) -> str:
    """Create a unique spawn ID like 'bulbasaur-1'."""
    # Sanitize name for ID use (handle special chars)
    safe = pokemon.replace(" ", "-").replace("'", "").replace(".", "")
    # Replace unicode chars (nidoran symbols)
    safe = safe.replace("\u2640", "f").replace("\u2642", "m")
    return f"{safe}-{index}"


def _make_spawn_entry(
    pokemon: str,
    spawn_id: str,
    bucket: str,
    weight: float,
    level: str,
    position_type: str,
    biomes: list[str],
    condition_extras: dict,
) -> dict:
    """Build a single spawn entry dict."""
    condition: dict = {}

    # Sky light for grounded/surface spawns
    if position_type in (GROUNDED, SURFACE):
        condition["minSkyLight"] = 8
        condition["maxSkyLight"] = 15

    # Add biomes
    condition["biomes"] = list(biomes)

    # Merge extras (timeRange, isThundering, etc.)
    condition.update(condition_extras)

    entry = {
        "id": spawn_id,
        "pokemon": pokemon,
        "presets": ["natural"],
        "type": "pokemon",
        "spawnablePositionType": position_type,
        "bucket": bucket,
        "level": level,
        "weight": weight,
        "condition": condition,
    }
    return entry


def _make_spawn_file(spawns: list[dict]) -> dict:
    """Wrap spawn entries in the top-level file structure."""
    return {
        "enabled": True,
        "neededInstalledMods": [],
        "neededUninstalledMods": [],
        "spawns": spawns,
    }


def generate_spawn_files(
    output_dir: Path, dry_run: bool = False
) -> dict[str, dict]:
    """
    Group spawn definitions by pokemon name, build JSON files,
    and write them to disk.

    Returns a dict of {filename: json_data} for all generated files.
    """
    # Group spawns by pokemon name
    pokemon_groups: dict[str, list[tuple]] = {}
    for entry in POKEMON_SPAWNS:
        name = entry[0]
        pokemon_groups.setdefault(name, []).append(entry)

    # Track spawn IDs globally to ensure uniqueness
    global_id_counts: dict[str, int] = {}
    files: dict[str, dict] = {}

    for pokemon_name, entries in pokemon_groups.items():
        spawn_entries = []
        for pokemon, bucket, weight, level, pos_type, biomes, extras in entries:
            # Increment global counter for this pokemon
            global_id_counts.setdefault(pokemon, 0)
            global_id_counts[pokemon] += 1
            spawn_id = _make_spawn_id(pokemon, global_id_counts[pokemon])

            spawn_entries.append(
                _make_spawn_entry(
                    pokemon, spawn_id, bucket, weight,
                    level, pos_type, biomes, extras,
                )
            )

        file_data = _make_spawn_file(spawn_entries)
        # Sanitize filename
        safe_name = (
            pokemon_name.replace(" ", "_")
            .replace("'", "")
            .replace(".", "")
            .replace("\u2640", "f")
            .replace("\u2642", "m")
        )
        filename = f"{safe_name}.json"
        files[filename] = file_data

    if not dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
        for filename, data in files.items():
            filepath = output_dir / filename
            filepath.write_text(
                json.dumps(data, indent=4, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

    return files


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate Cobblemon spawn table JSONs for Project Horizons"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be generated without writing files",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove existing spawn files before generating",
    )
    args = parser.parse_args()

    if args.clean and OUTPUT_DIR.exists():
        import shutil
        count = len(list(OUTPUT_DIR.glob("*.json")))
        shutil.rmtree(OUTPUT_DIR)
        print(f"Cleaned {count} existing files from {OUTPUT_DIR}")

    files = generate_spawn_files(OUTPUT_DIR, dry_run=args.dry_run)

    # Stats
    total_files = len(files)
    total_entries = sum(len(f["spawns"]) for f in files.values())

    # Count by bucket
    bucket_counts: dict[str, int] = {}
    for f in files.values():
        for s in f["spawns"]:
            b = s["bucket"]
            bucket_counts[b] = bucket_counts.get(b, 0) + 1

    # Count unique pokemon
    unique_pokemon: set[str] = set()
    for f in files.values():
        for s in f["spawns"]:
            unique_pokemon.add(s["pokemon"])

    print(f"\n{'=' * 60}")
    print(f"  Project Horizons - Spawn Table Generation")
    print(f"{'=' * 60}")
    if args.dry_run:
        print(f"  [DRY RUN - no files written]")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"  Spawn files generated:  {total_files}")
    print(f"  Total spawn entries:    {total_entries}")
    print(f"  Unique Pokemon:         {len(unique_pokemon)}")
    print(f"\n  Bucket distribution:")
    for bucket in [COMMON, UNCOMMON, RARE, ULTRA_RARE]:
        c = bucket_counts.get(bucket, 0)
        pct = (c / total_entries * 100) if total_entries else 0
        print(f"    {bucket:12s}: {c:4d}  ({pct:5.1f}%)")
    print(f"{'=' * 60}\n")

    if not args.dry_run:
        # List a sample of files
        sample = sorted(files.keys())[:10]
        print(f"  Sample files:")
        for fn in sample:
            entries = len(files[fn]["spawns"])
            print(f"    {fn} ({entries} spawn{'s' if entries != 1 else ''})")
        if len(files) > 10:
            print(f"    ... and {len(files) - 10} more")
        print()


if __name__ == "__main__":
    main()
