# Project Horizons — Complete Project Plan & Status

**Last Updated:** April 14, 2026
**Minecraft:** 1.21.1 | **Loader:** NeoForge 21.1.224 | **Java:** 21.0.10 (Adoptium, portable)

---

## Executive Summary

Project Horizons is a Minecraft NeoForge 1.21.1 modpack combining anime-adventure gameplay with life simulation. It features Cobblemon (Pokemon), Create (engineering), Stellaris (space), Solo Leveling-style gate dungeons, a 5-act narrative with 5 endings, and deep farming/brewing/economy systems for 4-16 player SMP communities targeting 200-600 hours of content.

**Current State: ~90% code-complete.** All systems are implemented. Remaining work is content creation (art, music, structures) and in-game testing.

---

## Build Statistics

| Category | Count |
|----------|------:|
| Mods installed | 190 |
| Server boot time | ~2.3 seconds (warm) / ~28 seconds (cold) |
| KubeJS scripts | 62 (25,000+ lines, zero stubs) |
| FTB Quests | 453 quests across 40 chapters |
| Cobblemon spawn files | 277 (Gen 1-4 mapped to Terralith biomes) |
| RCT trainer configs | 55 files (13 trainers with mobs/loot/advancements/dialogues) |
| Custom loot tables | 19 (gates, events, structures, crime) |
| NPC dialogue scripts | 20 (stage-gated, Custom NPCs Unofficial) |
| Patchouli guidebook | 61 files (12 categories, 48 entries, 116 pages) |
| Living Storybook | 82 files (10 categories, 71 entries, ~210 pages) |
| Storybook advancements | 71 (impossible trigger, granted via KubeJS) |
| Custom items/blocks/fluids | 87 registered via startup scripts |
| Placeholder textures | 81 PNGs (72 items + 9 blocks) |
| Datapack JSONs | 470+ total |
| Nutrition tag entries | 481 across 8 food groups |
| Stage definitions | 208 (1,300+ lines of TOML) |
| Pufferfish skill trees | 4 trees, 40 nodes |
| Python build tools | 7 scripts |
| JSON definition files | 4 (quests, trainers, NPCs, storybook) |
| Documentation | Player Guide + Admin Guide |
| Git commits | 5 |
| Tracked files | 8,867 |

---

## Architecture Overview

### Two Pillars

**Adventure Pillar:**
- Gate dungeons (E-S rank, 100 floors, Solo Leveling-inspired)
- Cobblemon companion system (5 types, trust/fatigue, 12 addon mods)
- 8 faction-themed gyms + Elite Four + Champion (RCT)
- Ascension system (20 classes, 10 trials, sigils, signature abilities)
- Space exploration (Stellaris — Moon, Mars, Europa, Titan, custom planets)
- Combat (Better Combat + Iron's Spells + Simply Swords)

**Living Pillar:**
- Nutrition system (8 food groups, 5 buff states)
- Food quality tiers (Q1 Common → Q5 Legendary)
- Deep farming (soil quality, crop rotation, tiered tools)
- Brewing (Vinery wines, Brewery beers, HerbalBrews teas)
- MineColonies settlements with Pokemon-worker pairings
- Village evolution (Hamlet → Kingdom, 5 tiers)

### Cross-Cutting Systems

- **Economy:** Lightman's Currency + 5 kingdom currencies + Jobs+ bridge
- **Factions:** 6 factions with -1000→+1000 reputation, tension system
- **Crime:** 6-tier crime stat, bounty board, capture mechanics, jail
- **Progression:** Pathfinder leveling (XP from all activities), 4 perk trees
- **Narrative:** 5-act story with 5 endings, 3 branch points, 10 side chains
- **World:** 20 locations, random encounters, calendar, festivals, events

---

## Mod Stack (169 mods)

### Core Systems
| Category | Mods | Key Mods |
|----------|-----:|----------|
| Libraries & APIs | 30+ | Architectury, GeckoLib, Kotlin for Forge, Rhino, Curios, YUNG's API |
| Core Engine | 12 | KubeJS, FTB Quests/Teams/Chunks, AStages, ProgressiveStages, EMI |
| Automation | 11 | Create + 7 addons, Immersive Engineering, Immersive Petroleum |

### Content
| Category | Mods | Key Mods |
|----------|-----:|----------|
| Cobblemon Suite | 17 | Cobblemon, Mega Showdown, Fight or Flight, CobbleNav, Raid Dens, Battle Extras, Cobbreeding, SimpleTMs, CaptureXP, SafePastures, PastureLoot, Create Industries, TBCS, RCT |
| Farming & Food | 12 | Farmer's Delight, Croptopia, Vinery, Brewery, Bakery, Candlelight, HerbalBrews, Farm and Charm, Brewin' and Chewin', Cooking for Blockheads, Serene Seasons |
| Combat | 5 | Better Combat, Combat Roll, Simply Swords, Artifacts, Iron's Spells |
| Dungeons & Structures | 18 | Dungeon Crawl, When Dungeons Arise, Cataclysm, Moog's (3), Radical Gyms, Farmer's Structures, YUNG's (8), Repurposed Structures |
| Worldgen | 7 | Terralith, Tectonic, Nullscape, CTOV, Towns & Towers, Tidal Towns, Sparse Structures |
| Building | 8 | Supplementaries, Chipped, Handcrafted, Macaw's (5) |

### Storage (tiered progression)
| Tier | Mod | Role |
|------|-----|------|
| Early | Tom's Simple Storage | Basic chest networking |
| Mid | Functional Storage + Titanium | Bulk drawer storage |
| Mid | Create: Storage | Create-native storage boxes |
| Mid-Late | Sophisticated Storage/Backpacks + Create Integration | Tiered chests on contraptions |
| Late | Refined Storage 2 + Extra Disks + ExtraStorage | Digital autocrafting |
| Industrial | TFMG + Diesel Generators + Power Grid + New Age | Steel, oil, electricity, nuclear |
| Endgame | AE2 + MEGA Cells (deferred) | Advanced digital storage |

### Social & Economy
| Category | Mods |
|----------|------|
| NPCs | Custom NPCs Unofficial, Easy NPC, MCA Reborn, Guard Villagers |
| Economy | Lightman's Currency + Tech, Jobs+ Remastered |
| Colonies | MineColonies, Structurize, Domum Ornamentum, MultiPiston, BlockUI |
| Space | Stellaris, Cobblemon/Stellaris Compatibility Patch |

### Skills & Progression
| Mod | Role |
|-----|------|
| Pufferfish Skills + Attributes | Skill tree UI framework (4 trees) |
| Reskillable Reimagined | Item/gear gating behind skill levels |
| Dimensional Dungeons | Procedural dungeon dimension |
| Patchouli | In-game guidebook (98 pages) |

### Performance
| Mod | Role |
|-----|------|
| ModernFix | Memory + load optimization |
| FerriteCore | Block state memory reduction |
| ServerCore | Async I/O, mob caps |
| Spark | Live profiling |
| Chunky | World pre-generation |
| Saturn, Clumps | Entity optimization |
| Lootr | Per-player loot |

### Utility
| Mod | Role |
|-----|------|
| Explorer's Compass | Find any structure |
| Ender Storage | Cross-dimension linked chests |
| JourneyMap + Jade | Map + block info |
| Polymorph, CraftTweaker, LootJS, MoreJS | Recipe management |

---

## KubeJS Systems (61 scripts, 23,442 lines)

### Server Scripts (53)

| System | Scripts | Lines | Key Features |
|--------|:-------:|------:|-------------|
| **Ascension** | 7 | 3,990 | 20 classes, 10 trials, sigils, abilities, shadow path, multi-ascension |
| **Crime** | 8 | 3,318 | Detection, 6-tier stat, bounties, compass, capture, jail, NPC hunters, counter-bounties |
| **World** | 10 | 2,950 | 20 locations, encounters, calendar, festivals, events, crises, milestones, location states |
| **Cobblemon** | 4 | 2,527 | 5 companion types, trust/fatigue, duels, farm-bound Pokemon |
| **Economy** | 4 | 1,668 | 5 kingdom currencies, 6-faction reputation, jobs bridge, price fluctuation |
| **Quests** | 4 | 1,540 | Custom tasks, branching (3 points), 15 completion triggers, rewards |
| **Player** | 3 | 1,158 | Nutrition (8 groups), thirst bridge, death penalty |
| **Colony** | 2 | 862 | 16 Pokemon-worker pairings, wage system |
| **Farming** | 2 | 860 | Q1-Q5 quality tiers, soil quality per chunk |
| **Trade** | 1 | 631 | 5 caravan routes (Steam 'n' Rails game layer) |
| **Villages** | 1 | 571 | 4-need system (Food/Water/Safety/Comfort) |
| **NPCs** | 1 | 495 | 6 traveling NPC types on schedules |
| **Kingdoms** | 1 | 465 | Hamlet→Kingdom 5-tier evolution |
| **Progression** | 2 | 409 | Pathfinder leveling + AStages↔ProgressiveStages bridge |
| **Dungeons** | 2 | 805 | E-S rank gates + mob HP/DMG/XP scaling |
| **Recipes** | 1 | 214 | 15 cross-mod bridges (Create+IE→Stellaris, coin minting) |

### Startup Scripts (7, 951 lines)
- 66 custom items (currencies, sigils, crime tools, farming tools, event items)
- 9 custom blocks (gate portal, bounty board, warp anchor, etc.)
- 3 custom fluids (warp propellant, refined ether, wine base)

### Client Scripts (1, 89 lines)
- Quality tier tooltips on all food items
- Custom item tooltips (exchange rates, sigil effects, lore text)

---

## Quest System (431 quests)

### Main Story (5 Acts, 67 quests)
| Act | Quests | Hours | Content |
|-----|-------:|------:|---------|
| Act 1: Arrival | 13 | 0-15 | Tutorial, first Pokemon, first Gate, choose path |
| Act 2: First Steps | 15 | 15-50 | Willowmere, first wine, first gym, faction allegiance |
| Act 3: Wider World | 16 | 50-100 | Diplomacy, deeper gates, rocket frame, all kingdoms |
| Act 4: The Stars | 15 | 100-150 | Moon/Mars/Europa, Precursor mystery, Watcher's Question |
| Act 5: Convergence | 5+25 | 150-200+ | Final trial, 5 ending paths |

### 5 Endings (25 quests)
- **Restoration** — Rebuild Precursor civilization, become Founder
- **Pilgrim** — Leave Aetheria, sail beyond the stars
- **Steward** — Protect Aetheria eternally, build Citadel
- **Awakened** — Merge with Cobblemon ecosystem
- **Architect** — Build your own kingdom, become King

### 12 Side Chains (223 quests)
| Chain | Quests | Hub NPC |
|-------|-------:|---------|
| Cobblemon Mastery | 30 | Trainer Kira |
| Cultivator's Path | 30 | Master Tomo / Vintner Mara |
| Master Crafter | 25 | Master Lyra |
| Merchant Prince | 20 | Merchant Caelus |
| Colony Builder | 20 | Mayor Theron |
| Bounty Hunter | 20 | Bounty Master Lockhart |
| Outlaw | 20 | Whisper |
| Lorekeeper | 20 | Wandering Scholar Vael |
| Gate Delver | 16 | Guild Master Aren |
| Cartographer | 15 | Scholar Vael |
| Trainer's Way | 15 | RCT trainers |
| Diplomat | 9 | Mayor Theron |

### 14 Tutorial Chapters (116 quests)
Create, Cobblemon (basic + advanced), Survival, Combat & Magic, MineColonies, Brewing, Lightman's, Farming, FTB Chunks, Immersive Engineering, Stellaris, Curios, Jobs

### Branching System (3 major choices)
- **Act 2:** Restoration vs Independence (Watcher alignment)
- **Act 3:** Tech vs Nature (specialization focus)
- **Act 4:** Conquer vs Diplomacy (conflict resolution)

### 8 Gym Leaders (RCT)
| # | Name | Faction | Type | Level | Pokemon |
|---|------|---------|------|------:|--------:|
| 1 | Terra | Plains | Normal/Grass | 15-20 | 3 |
| 2 | Sylva | Forest | Bug/Grass | 20-25 | 3 |
| 3 | Ferrum | Mountain | Rock/Steel | 25-30 | 4 |
| 4 | Marina | Coastal | Water/Ice | 30-35 | 4 |
| 5 | Ignis | Fire | Fire | 35-40 | 4 |
| 6 | Volt | Electric | Electric | 40-45 | 5 |
| 7 | Obscura | Psychic | Psychic/Dark | 45-50 | 5 |
| 8 | Draco | Dragon | Dragon | 50-55 | 6 |
| E4 | Kael/Ysha/Taro/Marek | Mixed | Various | 70-80 | 4 each |
| Champion | Aren | Mixed | Full team | 80-100 | 6 |

### 20 Named NPCs
| Location | NPCs |
|----------|------|
| Anchor Town | Sera (guide), Petra (crier), Aren (guild master), Vex/Lyra/Tomo (mentors) |
| Willowmere | Theron (mayor), Mara (vintner), Brenna (innkeeper) |
| Mountain Forge | Khael (smith), Veridia (gear witch) |
| Coastal Republic | Caelus (merchant), Taro (sailor) |
| Forest Coalition | Yshara (druid), Kira (trainer) |
| Skyborn Order | Marek (operative) |
| Free Wanderers | Vael (scholar), Whisper (outlaw), Lockhart (bounty master) |
| Cosmic | The Watcher |

---

## Content Generation Pipeline

### Tools
| Script | Purpose |
|--------|---------|
| `tools/generate_content.py` | Master generator: reads 3 JSON specs → outputs SNBT/JSON/JS |
| `tools/generate_spawns.py` | Cobblemon spawn table generator |
| `tools/generate_textures.py` | Placeholder PNG texture generator |
| `tools/build.py` | CurseForge/Modrinth packaging |
| `tools/validate.py` | Project-wide validation |
| `tools/download_mods.py` | Mod downloader (placeholder API) |
| `tools/modrinth_download.py` | Modrinth API mod downloader |

### Definition Files
| File | Content |
|------|---------|
| `tools/quest_definitions.json` | 431 quests, 37 chapters, 4 groups |
| `tools/trainer_definitions.json` | 13 trainers with full teams |
| `tools/npc_definitions.json` | 20 NPCs with dialogue trees |

---

## KubeJS Boundary Analysis

### What KubeJS Handles (state, events, cross-mod glue)
- Currency/economy systems (Lightman's bridges)
- Crime detection/bounties/jail (scoreboard + persistentData)
- Nutrition tracking, quality tiers, thirst integration
- Quest branching, custom tasks, reward handlers
- Gate entry/exit/floor tracking, difficulty scaling
- Companion interactions, trust/fatigue
- Stage synchronization (AStages ↔ ProgressiveStages)

### What Mods Handle (AI, GUI, structures, logistics)
- **Guard Villagers** — combat AI, patrols, equipment
- **Towns and Towers** — structure variety for village tiers
- **MCA Reborn** — named NPCs, relationships, mood
- **Steam 'n' Rails** — train schedules, cargo, signals
- **Pufferfish Skills** — skill tree UI rendering
- **Radical Gyms** — gym structures with RCT integration
- **Dimensional Dungeons** — procedural dungeon dimension

---

## Architecture Decisions Log

| Decision | Rationale |
|----------|-----------|
| Game Stages → AStages + ProgressiveStages | Game Stages has no 1.21.1 version. Dual system: AStages for KubeJS API, ProgressiveStages for FTB Quests gating |
| Item Filters → FTB Filter System | No 1.21.1 version of Item Filters |
| CNPC-Cobblemon-Addon → TBCS | Fabric-only for 1.21.1; TBCS is NeoForge alternative |
| AE2 + GuideMe + DependencySorter Fix | GuideMe is a REQUIRED dependency of AE2. Vanilla DependencySorter.isCyclic has no visited-set, causing StackOverflow on large mod graphs. Custom mixin mod (depsort-fix-1.0.0.jar) replaces recursive isCyclic with iterative BFS + visited set. All three JARs installed and boot-tested successfully. Stage gated behind diamond_age via ae2_age.toml |
| Cobblemon: Ride On! → Dropped | Incompatible with Cobblemon 1.7+ native riding |
| Every Compat → Dropped | Creative Tab crash with large mod sets |
| BWG → Deferred | Circular loot table deps with Railways. Terralith-only for now |
| Farmer's Respite → Dropped | No NeoForge 1.21.1 version |
| FastFurnace/FastWorkbench → Dropped | No 1.21.1 versions |
| SafariBanquet → Dropped | Unreleased mod (9 commits) |
| Villager Names → Dropped | MCA Reborn already provides unique names, genders, and identities to all villagers. Redundant |
| Better Third Person → Shoulder Surfing Reloaded | Shoulder Surfing has 30+ releases, GTA/Witcher-style camera config, adaptive crosshair, camera sway. Better Third Person has 1 release and is incompatible |
| Shoulder Surfing Reloaded | Cinematic third-person camera: close over-shoulder (x=0.85, z=3.2), smooth transitions, decoupled camera, adaptive crosshair, camera sway, sprint/aim/fly offsets. Config in defaultconfigs/shouldersurfing-client.toml |
| Controlling + Searchables | Keybind search and conflict detection. Essential QoL for 190-mod pack with hundreds of keybinds |
| Map Atlases | Item-based world map alternative. Works alongside existing map system |
| AllTheMons = datapack | NOT a mod JAR. Goes in datapacks/ |
| Railways loot tables | Stripped 276 broken entries referencing absent mods |
| Deterministic quest IDs | SHA-256 hash ensures regeneration preserves save data |
| Command-based quest rewards | All rewards use /horizons reward commands |
| Script-based NPC dialogue | Custom NPCs scripting API for stage-gated dialogue |

---

## Datapacks & Resource Pack

### Datapacks
| Pack | Content |
|------|---------|
| `horizons-core` | 399 JSONs: nutrition tags (8), faction tags (8), world events (11), encounters (5), skill trees (4), Patchouli guidebook (54), loot tables (19), Cobblemon spawns (277), RCT advancements (13) |
| `horizons-quests` | FTB Quests supplementary data |
| `AllTheMons-datapack.zip` | 150+ additional Pokemon species |
| `Cobblemon Stellaris Compatibility Patch.zip` | Pokemon on planets |

### Resource Pack
| Content | Files |
|---------|------:|
| Custom item textures (placeholder) | 72 |
| Custom block textures (placeholder) | 9 |
| Language file (en_us.json) | 1 |
| Sounds registration (sounds.json) | 12 music + ambient entries |
| AllTheMons resource pack | 1 zip |

---

## Reference Materials

| Reference | Size | Purpose |
|-----------|-----:|---------|
| Cobbleverse modpack | 226 MB | Cobblemon configs, gym structures, trainer data, 1000+ spawn entries |
| All the Mons 10 | 180 MB | Quest SNBT format, RCT trainer configs, 127 gym NBTs, KubeJS scripts |
| AllTheMons datapack | 32 MB | Pokemon species data, spawn presets, model references |
| Mod codebases | 33 repos | API study for KubeJS integration patterns |

---

## Command Reference

### Player Commands
```
/horizons quality check|set <tier>        — Food quality inspection
/horizons nutrition                        — View nutrition status (8 groups)
/horizons thirst info                      — Thirst modifiers
/horizons level                            — Pathfinder level + XP
/horizons gate status|enter|exit|advance   — Gate dungeon management
/horizons companion activate|deactivate|status — Pokemon companions
/horizons trust|trust feed|battle|faint    — Companion trust/fatigue
/horizons currency balance|exchange        — Kingdom currencies
/horizons reputation                       — Faction standings
/horizons reward status                    — All progression stats
/horizons task status                      — Quest task counters
/horizons branch status                    — Narrative branches
/horizons storybook status                 — Unlocked page count + completion %
/horizons crime status                     — Crime stat + tier
/horizons bounty list|accept|claim         — Bounty hunting
/horizons compass                          — Toggle bounty compass
/horizons jail status                      — Jail sentence
/horizons caravan routes|active            — Trade routes
/horizons village status|needs             — Village info
/horizons visitors                         — Traveling NPCs
/horizons calendar                         — Aetheria date
/horizons festival                         — Current/next festival
/horizons event status                     — Active world events
/horizons milestones                       — Personal achievements
/horizons discoveries                      — Location discoveries
/horizons ascension check                  — Ascension eligibility
/horizons subtree status                   — Ascension subtree
/horizons sigil equip|remove|info          — Class sigils
/horizons ability activate|cooldown        — Signature abilities
/horizons shadow status                    — Shadow path (outlaws)
/horizons duel challenge|accept|decline    — Cobblemon duels
/horizons farm bind|unbind|list            — Farm-bound Pokemon
/horizons soil check|compost               — Soil quality
/horizons prices                           — Exchange rate trends
/horizons encounter respond                — Random encounter
```

### Admin Commands (OP)
```
/horizons level grantxp <amount>
/horizons gate enter <floor>
/horizons reward perkpoints|stage|reputation|currency|crimestat <args>
/horizons quest trigger <stage>
/horizons branch reset <name>
/horizons village prosperity add <amount>
/horizons crime report <player>
/horizons jail send|release <player>
/horizons event trigger <name>
/horizons crisis trigger <type>
/horizons festival start <name>
/horizons encounter force <type>
/horizons location setstate <id> <state>
/horizons visitor spawn <type>
/horizons colony payday
/horizons trial complete
/horizons ascension force_eligible
/horizons scaling info
/horizons storybook sync                   — Re-grant all storybook advancements
/horizons storybook give                   — Give storybook item
```

---

## Completion Status

### DONE (code/data layer ~95%)

- [x] 169 mods installed + booting cleanly
- [x] 62 KubeJS scripts (24,000+ lines, zero stubs)
- [x] 87 custom items/blocks/fluids registered
- [x] 431 FTB Quests across 37 chapters (SNBT generated)
- [x] 13 RCT trainers + 55 config files
- [x] 20 NPC dialogue scripts (stage-gated)
- [x] 277 Cobblemon spawn files
- [x] 32 custom loot tables
- [x] 481 nutrition tag entries
- [x] 206 stage definitions (1,248 lines TOML)
- [x] 4 perk tree datapacks (40 nodes)
- [x] 54 Patchouli guidebook files (11 categories, 98 pages) + 1 AE2 guide entry
- [x] 81 placeholder textures
- [x] Content generator pipeline (7 Python scripts)
- [x] Player Guide + Admin Guide
- [x] Git repository (5 commits, 8,867 tracked files)
- [x] Build tooling (CurseForge/Modrinth packaging)
- [x] Storage tier progression (7 storage mods)

- [x] Living Storybook — 82 Patchouli files (10 categories, 71 entries, ~210 pages), 71 advancements, KubeJS bridge script
- [x] AE2 integration prepared — stage gating, cross-mod recipes, 7-quest chapter, guide entry, storybook entry
- [x] Create Suite expanded — 17 new mods (TFMG, Diesel Generators, Power Grid, New Age, Central Kitchen, Cobblemon Industries, Petrol's Parts, Create Fluid, Liquid Fuel, Mechanical Extruder, Teleporters, Structures Arise + 3 YUNG's + 2 libraries)
- [x] Create Industrial Age stage — gates TFMG/Diesel/PowerGrid/NewAge/Teleporters/CobblemonIndustries behind diamond_age
- [x] 16 cross-mod recipe bridges — TFMG↔IE, TFMG↔Diesel, PowerGrid↔CC&A, NewAge↔TFMG, CentralKitchen↔FD, TFMG→AE2
- [x] 2 new quest chapters — Industrial Revolution (8 quests), Energy & Automation (7 quests)
- [x] 5 new Patchouli guide entries — Industrial Revolution, Energy Systems, Kitchen Automation, Poké Ball Factory, Technology category

### IN PROGRESS

- [x] AE2 JAR installation — AE2 19.2.17 + GuideMe 21.1.15 + depsort-fix-1.0.0.jar mixin (fixes vanilla StackOverflow). Boot test passed

### REMAINING (in-game/creative work)

- [ ] Pixel art textures — replace 81 placeholders (needs artist)
- [ ] Custom music tracks — 12 contextual tracks (needs composer)
- [ ] Structure NBTs — Anchor Town, gym buildings, gate floors (in-game building)
- [ ] NPC skins — 20 character skins (needs artist)
- [ ] Pufferfish Skills visual editor — configure in-game
- [ ] FTB Quests layout polish — visual arrangement in-game
- [ ] Spark profiling baseline — in-game performance measurement
- [ ] Chunky pre-gen — 10k radius world pre-generation
- [ ] 4-8 player stress test — 4+ hours at 20 TPS target
- [ ] TPS optimization pass — based on profiling results
- [ ] All /horizons commands verified in-game
- [ ] Quest flow walkthrough — Act 1 start-to-finish playtest

### DEFERRED

- [x] GuideMe — installed (required by AE2). StackOverflow fixed via depsort-fix mixin mod
- [ ] BWG (Oh The Biomes We've Gone) — needs Railways compatibility patch
- [ ] MEGA Cells — AE2 addon, install after AE2 boot test passes
- [ ] Bounty Board custom GUI mod — Phase 5 polish
- [ ] Kingdom Dashboard GUI mod — Phase 5 polish

---

## Development Timeline

| Phase | Status | What Was Done |
|-------|--------|---------------|
| **Phase 0: Scaffolding** | COMPLETE | Directory structure, 112 files, pack.mcmeta, mod manifest, build tools |
| **Phase 1: Foundation** | COMPLETE | NeoForge install, 126→169 mods, first boot, cross-mod recipes, quality tiers, reward handlers, stage bridge |
| **Phase 2: Core Systems** | COMPLETE | Nutrition, thirst, leveling, gates, scaling, currency, reputation, companions, trust, quests |
| **Phase 3: World Building** | COMPLETE | Crime (8 scripts), world (10 scripts), colony, village evolution, jobs, duels, soil, travelers |
| **Phase 4: Deep Content** | COMPLETE | Ascension (7 scripts), farm-bound, death penalty, price fluctuation, caravan routes, village needs |
| **Phase 5: Content** | IN PROGRESS | 431 quests, 277 spawns, 55 RCT configs, 20 NPC scripts, Patchouli guidebook, storage stack |
| **Phase 6: Polish** | NOT STARTED | Textures, music, structures, profiling, stress testing, packaging |

---

## File Structure

```
Project Horizons/
├── .gitignore
├── README.md
├── CHANGELOG.md
├── PROJECT_STATUS.md              ← This file
├── docs/
│   ├── Project Architecture/      (10 design documents)
│   ├── PLAYER_GUIDE.md
│   └── ADMIN_GUIDE.md
├── server/
│   ├── mods/                      (169 JAR files)
│   ├── config/
│   │   ├── ftbquests/quests/      (37 chapters + 37 lang files + data.snbt)
│   │   ├── progressivestages/     (206 stage definitions)
│   │   └── (226 config files)
│   ├── kubejs/
│   │   ├── server_scripts/        (53 scripts, 22,559 lines)
│   │   │   ├── recipes/           (1 script: cross-mod bridges)
│   │   │   ├── cobblemon/         (4 scripts: companions, trust, duels, farm-bound)
│   │   │   ├── dungeons/          (2 scripts: gates, scaling)
│   │   │   ├── player/            (3 scripts: nutrition, thirst, death penalty)
│   │   │   ├── economy/           (4 scripts: currency, reputation, jobs, prices)
│   │   │   ├── crime/             (8 scripts: full crime system)
│   │   │   ├── kingdoms/          (1 script: village evolution)
│   │   │   ├── trade/             (1 script: caravan routes)
│   │   │   ├── progression/       (2 scripts: leveling, stage bridge)
│   │   │   ├── quests/            (4 scripts: rewards, tasks, branching, events)
│   │   │   ├── colony/            (2 scripts: pokemon workers, wages)
│   │   │   ├── farming/           (2 scripts: quality, soil)
│   │   │   ├── villages/          (1 script: needs system)
│   │   │   ├── npcs/              (1 script: travelers)
│   │   │   ├── ascension/         (7 scripts: full ascension system)
│   │   │   └── world/             (10 scripts: full world system)
│   │   ├── startup_scripts/       (7 scripts, 951 lines)
│   │   │   ├── items/             (5 scripts: 66 items)
│   │   │   ├── blocks/            (1 script: 9 blocks)
│   │   │   └── fluids/            (1 script: 3 fluids)
│   │   ├── client_scripts/        (1 script: tooltips)
│   │   └── data/rctmod/           (55 trainer config files)
│   ├── customnpcs/scripts/        (20 NPC dialogue scripts)
│   ├── eula.txt
│   ├── user_jvm_args.txt          (8GB RAM, G1GC, -Xss16M)
│   ├── run.bat / run.sh           (portable Java 21 launch)
│   └── libraries/                 (NeoForge libraries)
├── datapacks/
│   ├── horizons-core/
│   │   ├── data/horizons/         (tags, loot_tables, events, encounters, skill trees, Patchouli)
│   │   ├── data/cobblemon/        (277 spawn files)
│   │   ├── data/rctmod/           (13 advancement files)
│   │   └── pack.mcmeta
│   ├── horizons-quests/
│   ├── AllTheMons-datapack.zip
│   └── Cobblemon Stellaris Compatibility Patch.zip
├── resourcepack/
│   ├── assets/horizons/           (textures, lang, sounds)
│   ├── assets/minecraft/          (sound overrides)
│   ├── AllTheMons-resourcepack.zip
│   └── pack.mcmeta
├── schematics/                    (empty — for structure NBTs)
├── tools/
│   ├── generate_content.py        (quest/trainer/NPC generator)
│   ├── generate_spawns.py         (Cobblemon spawn generator)
│   ├── generate_textures.py       (placeholder PNG generator)
│   ├── build.py                   (distribution packager)
│   ├── validate.py                (project validator)
│   ├── download_mods.py           (mod downloader)
│   ├── modrinth_download.py       (Modrinth API downloader)
│   ├── quest_definitions.json     (431 quests)
│   ├── trainer_definitions.json   (13 trainers)
│   ├── npc_definitions.json       (20 NPCs)
│   └── mod-manifest.json          (mod list)
├── references/
│   ├── cobbleverse/               (226 MB reference modpack)
│   ├── allthemons10/              (180 MB reference modpack)
│   └── allthemons/                (32 MB datapack reference)
├── codebases/                     (33 mod source repos)
├── codebase-zips/                 (source zip downloads)
└── build/                         (distribution output)
```

---

## How to Run

### Prerequisites
- Java 21+ (portable JDK at `tools/java/jdk-21.0.10+7/` — download separately)
- Python 3.10+ (for build tools)
- 16 GB system RAM (8 GB allocated to server)

### Server Start
```bash
cd server
# Windows
run.bat
# Linux/Mac
./run.sh
```

### Regenerate Content
```bash
cd tools
python generate_content.py --all     # Regenerate quests, trainers, NPCs
python generate_spawns.py            # Regenerate Cobblemon spawns
python generate_textures.py          # Regenerate placeholder textures
python build.py --version 0.1.0      # Package for distribution
python validate.py --verbose          # Validate all files
```

---

*Project Horizons — Star Trek meets Pokemon meets Stardew Valley, with a Ghibli aesthetic.*
