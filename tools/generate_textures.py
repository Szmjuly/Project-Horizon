#!/usr/bin/env python3
"""
Project Horizons - Placeholder Texture Generator

Generates 16x16 colored PNG placeholder textures for all custom items and blocks.
Uses only Python built-in libraries (no PIL/Pillow required).

Usage:
    python generate_textures.py
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ITEM_DIR = PROJECT_ROOT / "resourcepack" / "assets" / "horizons" / "textures" / "item"
BLOCK_DIR = PROJECT_ROOT / "resourcepack" / "assets" / "horizons" / "textures" / "block"

# ---------------------------------------------------------------------------
# Minimal PNG writer (no external dependencies)
# ---------------------------------------------------------------------------

def _make_png(width: int, height: int, r: int, g: int, b: int, a: int = 255,
              border: bool = False, border_color: tuple[int, int, int] = (40, 40, 40)) -> bytes:
    """Create a minimal RGBA PNG image with a solid fill and optional 1px border."""

    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    # Build raw scanlines (filter byte 0 = None, then RGBA per pixel)
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter byte
        for x in range(width):
            if border and (x == 0 or x == width - 1 or y == 0 or y == height - 1):
                raw.extend((*border_color, a))
            else:
                raw.extend((r, g, b, a))

    # PNG signature
    sig = b"\x89PNG\r\n\x1a\n"

    # IHDR: width, height, bit depth 8, color type 6 (RGBA)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = _chunk(b"IHDR", ihdr_data)

    # IDAT: compressed scanlines
    idat = _chunk(b"IDAT", zlib.compress(bytes(raw), 9))

    # IEND
    iend = _chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


def _make_gradient_png(width: int, height: int,
                       top_color: tuple[int, int, int],
                       bottom_color: tuple[int, int, int]) -> bytes:
    """Create a PNG with a vertical gradient from top_color to bottom_color."""

    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        t = y / max(height - 1, 1)
        cr = int(top_color[0] * (1 - t) + bottom_color[0] * t)
        cg = int(top_color[1] * (1 - t) + bottom_color[1] * t)
        cb = int(top_color[2] * (1 - t) + bottom_color[2] * t)
        for _ in range(width):
            raw.extend((cr, cg, cb, 255))

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    idat = _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = _chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


# ---------------------------------------------------------------------------
# Item and Block Definitions
# ---------------------------------------------------------------------------

# Color palette
GOLD       = (255, 215,   0)
PURPLE     = (139,   0, 139)
DARK_RED   = (139,   0,   0)
BROWN      = (139,  69,  19)
GREEN      = ( 34, 139,  34)
DARK_GOLD  = (218, 165,  32)
DARK_PURP  = ( 75,   0, 130)
CYAN       = (  0, 139, 139)
GRAY       = (128, 128, 128)

# Rainbow colors for festival tokens
RAINBOW = [
    (255,   0,   0),  # red
    (255, 127,   0),  # orange
    (255, 255,   0),  # yellow
    (  0, 255,   0),  # green
    (  0,   0, 255),  # blue
    ( 75,   0, 130),  # indigo
    (148,   0, 211),  # violet
    (255, 105, 180),  # pink
    (  0, 206, 209),  # turquoise
    (255, 215,   0),  # gold
    (124, 252,   0),  # lawn green
    (255,  20, 147),  # deep pink
]

# --- ITEMS ---
# (filename_without_extension, (r, g, b), category_label)

ITEMS: list[tuple[str, tuple[int, int, int], str]] = [
    # Kingdom Currencies (gold)
    ("plains_crown",              GOLD,      "currency"),
    ("forest_leaf",               GOLD,      "currency"),
    ("desert_dinar",              GOLD,      "currency"),
    ("mountain_mark",             GOLD,      "currency"),
    ("coastal_pearl",             GOLD,      "currency"),

    # Precursor items (purple)
    ("precursor_fragment",        PURPLE,    "precursor"),
    ("precursor_artifact",        PURPLE,    "precursor"),
    ("precursor_token",           PURPLE,    "precursor"),
    ("precursor_blueprint",       PURPLE,    "precursor"),
    ("psychic_resonance_crystal", PURPLE,    "precursor"),
    ("warp_shard",                PURPLE,    "precursor"),
    ("warp_gate_frame",           PURPLE,    "precursor"),
    ("warp_gate_controller",      PURPLE,    "precursor"),
    ("warp_gate_lens",            PURPLE,    "precursor"),
    ("warp_gate_stabilizer",      PURPLE,    "precursor"),
    ("warp_gate_capacitor",       PURPLE,    "precursor"),
    ("navigation_core",           PURPLE,    "precursor"),
    ("ancient_encounter_token",   PURPLE,    "precursor"),

    # Crime system items (dark red)
    ("hood_of_shadows",           DARK_RED,  "crime"),
    ("hunters_compass",           DARK_RED,  "crime"),
    ("capture_net",               DARK_RED,  "crime"),
    ("duel_challenge_token",      DARK_RED,  "crime"),
    ("bounty_hunters_license",    DARK_RED,  "crime"),
    ("outlaws_brand",             DARK_RED,  "crime"),
    ("released_convict_token",    DARK_RED,  "crime"),
    ("prison_labor_voucher",      DARK_RED,  "crime"),

    # Farming tools (brown)
    ("copper_hoe",                BROWN,     "farming"),
    ("steel_hoe",                 BROWN,     "farming"),
    ("brass_hoe",                 BROWN,     "farming"),
    ("enchanted_hoe",             BROWN,     "farming"),
    ("precursor_hoe",             BROWN,     "farming"),
    ("heartwood_hoe",             BROWN,     "farming"),
    ("copper_watering_can",       BROWN,     "farming"),
    ("brass_watering_can",        BROWN,     "farming"),
    ("enchanted_watering_can",    BROWN,     "farming"),
    ("pruning_shears",            BROWN,     "farming"),
    ("quality_pruning_shears",    BROWN,     "farming"),
    ("row_harvesting_scythe",     BROWN,     "farming"),
    ("field_harvesting_scythe",   BROWN,     "farming"),
    ("seed_bag",                  BROWN,     "farming"),

    # Trainer items (cyan / world)
    ("trainer_card",              CYAN,      "world"),

    # Trade items (gold / economy)
    ("merchants_ledger",          DARK_GOLD, "economy"),

    # Sigils - hybrid (green)
    ("sigil_verdant",             GREEN,     "sigil_hybrid"),
    ("sigil_tempest",             GREEN,     "sigil_hybrid"),
    ("sigil_warden",              GREEN,     "sigil_hybrid"),
    ("sigil_artificer",           GREEN,     "sigil_hybrid"),
    ("sigil_sage",                GREEN,     "sigil_hybrid"),

    # Sigils - transcendent (gold)
    ("sigil_starcaller",          DARK_GOLD, "sigil_transcendent"),
    ("sigil_soulbinder",          DARK_GOLD, "sigil_transcendent"),
    ("sigil_chronomancer",        DARK_GOLD, "sigil_transcendent"),
    ("sigil_worldshaper",         DARK_GOLD, "sigil_transcendent"),
    ("sigil_archon",              DARK_GOLD, "sigil_transcendent"),

    # Sigils - shadow (dark purple)
    ("sigil_phantom",             DARK_PURP, "sigil_shadow"),
    ("sigil_voidwalker",          DARK_PURP, "sigil_shadow"),
    ("sigil_hexblade",            DARK_PURP, "sigil_shadow"),
    ("sigil_plaguebringer",       DARK_PURP, "sigil_shadow"),
    ("sigil_tyrant",              DARK_PURP, "sigil_shadow"),

    # Ascension items (purple)
    ("ascension_crystal_bronze",  PURPLE,    "precursor"),
    ("ascension_crystal_silver",  PURPLE,    "precursor"),
    ("ascension_crystal_gold",    PURPLE,    "precursor"),
    ("triple_crown",              PURPLE,    "precursor"),
    ("soul_forged_blade",         PURPLE,    "precursor"),

    # Festival tokens (rainbow - each gets a different color)
    ("festival_token_spring",     RAINBOW[0],  "festival"),
    ("festival_token_summer",     RAINBOW[1],  "festival"),
    ("festival_token_autumn",     RAINBOW[2],  "festival"),
    ("festival_token_winter",     RAINBOW[3],  "festival"),
    ("festival_token_eclipse",    RAINBOW[4],  "festival"),
    ("festival_token_harvest",    RAINBOW[5],  "festival"),
    ("festival_token_starfall",   RAINBOW[6],  "festival"),
    ("festival_token_anniversary",RAINBOW[7],  "festival"),
    ("eclipse_shard",             RAINBOW[8],  "festival"),
    ("meteor_fragment",           RAINBOW[9],  "festival"),

    # World items (cyan)
    ("discovery_lore_book",       CYAN,      "world"),
]

# --- BLOCKS ---

BLOCKS: list[tuple[str, tuple[int, int, int]]] = [
    ("psychic_relay",       GRAY),
    ("pokemon_treadmill",   GRAY),
    ("route_marker",        GRAY),
    ("descent_pad",         GRAY),
    ("warp_anchor",         GRAY),
    ("precursor_terminal",  GRAY),
    ("gate_portal",         GRAY),
    ("companion_hut",       GRAY),
    ("bounty_board",        GRAY),
]


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def generate_item_textures() -> int:
    """Generate placeholder item textures. Returns count of files written."""
    ITEM_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for name, color, _category in ITEMS:
        path = ITEM_DIR / f"{name}.png"
        png_data = _make_png(16, 16, *color, border=True)
        path.write_bytes(png_data)
        count += 1
    return count


def generate_block_textures() -> int:
    """Generate placeholder block textures. Returns count of files written."""
    BLOCK_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for name, color in BLOCKS:
        path = BLOCK_DIR / f"{name}.png"
        # Blocks get a gradient effect for visual distinction
        lighter = tuple(min(c + 40, 255) for c in color)
        png_data = _make_gradient_png(16, 16, lighter, color)
        path.write_bytes(png_data)
        count += 1
    return count


def main() -> None:
    print("=" * 60)
    print("  Project Horizons - Placeholder Texture Generator")
    print("=" * 60)
    print()

    item_count = generate_item_textures()
    print(f"  Items:  {item_count} textures -> {ITEM_DIR}")

    block_count = generate_block_textures()
    print(f"  Blocks: {block_count} textures -> {BLOCK_DIR}")

    print(f"\n  Total:  {item_count + block_count} placeholder textures generated.")
    print("  Done.")


if __name__ == "__main__":
    main()
