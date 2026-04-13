# Project Horizons

A Minecraft NeoForge 1.21.1 modpack blending adventure, life simulation, and deep progression into a 200-600 hour experience for 4-16 player SMP communities.

**Tone:** Star Trek meets Pokemon meets Stardew Valley — with a Ghibli aesthetic.

## Core Pillars

- **Adventure:** Gate dungeons (Solo Leveling-style), space exploration (Stellaris), Cobblemon companion system, combat with dodge rolls and magic
- **Living:** Deep farming with quality tiers, brewing (wine/beer/spirits), MineColonies settlements, nutrition system, NPC villages that evolve

## Key Systems

- ~113 server mods, ~54 client mods
- 53 custom KubeJS server scripts + 7 startup scripts
- 430+ quests across a 5-act narrative with 5 endings
- Dual-stage progression (AStages + ProgressiveStages)
- Custom economy (Lightman's coins + kingdom currencies + Precursor tokens)
- Crime and bounty system with PvP captures
- 20 Ascended Classes with unique trial dungeons

## Project Structure

```
Project Horizons/
├── docs/                    # Architecture documentation (10 design docs)
├── server/                  # NeoForge server files
│   ├── config/              # Mod configurations
│   ├── kubejs/              # KubeJS scripts (custom systems)
│   ├── mods/                # Mod JARs (gitignored, use mod-manifest.json)
│   └── defaultconfigs/      # First-join configs
├── datapacks/               # Custom datapacks
│   ├── horizons-core/       # Main datapack (tags, structures, dimensions)
│   └── horizons-quests/     # FTB Quests supplementary data
├── resourcepack/            # Custom textures, UI, sounds, music
├── schematics/              # Structure NBT files
└── tools/                   # Build scripts and utilities
```

## Getting Started

### Prerequisites
- Java 21+
- Minecraft 1.21.1
- NeoForge (latest for 1.21.1)
- Python 3.10+ (for build tools)

### Setup
1. Clone this repository
2. Run `python tools/download_mods.py` to download all mod JARs
3. Copy `server/` contents to your NeoForge server directory
4. Copy `datapacks/horizons-core/` into `server/world/datapacks/`
5. Copy `resourcepack/` or package it as a zip for client distribution
6. Start the server

### Hardware Requirements

| Preset | GPU | RAM | Description |
|--------|-----|-----|-------------|
| Survivor | GTX 1050 | 8GB | Low settings, no shaders |
| Pathfinder | GTX 1660 | 12GB | Medium settings, basic shaders |
| Explorer | RTX 3080+ | 16GB+ | High settings, full shaders + Distant Horizons |

## Development Phases

1. **Foundation** (Weeks 1-2): Core mods, basic recipes, Act 1 quests
2. **Core Systems** (Weeks 3-5): Companion system, dungeons, economy, nutrition
3. **World Building** (Weeks 5-8): Structures, NPCs, colonies, planets
4. **Deep Content** (Weeks 8-12): Full quest content, crime system, ascension
5. **Polish** (Weeks 12-16): Resource pack, music, optimization, testing

## Documentation

See `docs/Project Architecture/` for complete design documents:
- `HORIZONS_PROJECT_OVERVIEW.md` — Master index and roadmap
- `PROJECT_HORIZONS_v3_GDD.md` — Full game design document
- `HORIZONS_MODPACK_GUIDE.md` — Development guide and philosophy
- `HORIZONS_INTEGRATIONS.md` — All custom KubeJS/datapack systems
- `HORIZONS_QUEST_SYSTEM.md` — Quest structure and narrative
- And 5 more specialized documents

## License

Private project — not for public distribution without permission.
