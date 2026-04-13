# Project Horizons — Server Mods

**NeoForge 1.21.1** · Pure NeoForge (no hybrid) · ~140 mods · 16 GB RAM · Java 21

> Server-side mods. Custom systems marked 🔵 are built by us — see `HORIZONS_INTEGRATIONS.md` for the full breakdown. The quest system has its own document at `HORIZONS_QUEST_SYSTEM.md`.

---

## Libraries & APIs

Dependencies. Load first.

- **Architectury API** — cross-loader abstraction
- **Balm** — BlayMods abstraction layer
- **Cloth Config API** — configuration screens
- **Curios API** — equipment slots (wallets, badges, artifacts)
- **YUNG's API** — YUNG's structure mods dependency
- **Geckolib** — animation engine (Cobblemon dep)
- **Kotlin for Forge** — language adapter (Cobblemon dep)
- **playerAnimator** — animation library (Better Combat dep)
- **Collective** — Serilum's shared library
- **Bookshelf** — Darkhax's shared library
- **Moonlight Lib** — Supplementaries dep
- **Puzzles Lib** — multi-loader utility
- **CreativeCore** — Entity Culling / Ambient Sounds dep
- **FTB Library** — FTB suite shared library
- **FTB XMod Compat** — KubeJS / Game Stages / Item Filters bridge for FTB Quests *(new)*
- **Item Filters** — FTB Quests dependency
- **Structurize** — MineColonies dependency
- **MultiPiston** — MineColonies dependency
- **BlockUI** — MineColonies dependency
- **RCTApi** — Radical Cobblemon Trainers dependency
- **Cobblemon Trainers** — RCT battle backend
- **GlitchCore** — Tough As Nails dependency

---

## Core Engine

Scripting, progression, and integration backbone.

- **KubeJS** — THE integration backbone
- **KubeJS Create** — KubeJS ↔ Create bindings
- **LootJS** — KubeJS addon for loot table manipulation
- **MoreJS** — additional KubeJS events (villager trades, structures, enchantments)
- **FTB Quests (NeoForge)** — 5-act progression + side chains + tutorials
- **FTB Teams** — party system for SMP
- **FTB Chunks** — chunk claiming, kingdom territory
- **Game Stages** — gate content behind milestones and choices
- **Polymorph** — recipe conflict resolution
- **CraftTweaker** — backup recipe scripting

---

## Automation & Engineering

- **Create** — mechanical automation, trains, fluids
- **Create: Steam 'n Rails** — extended trains, caravan backbone
- **Create: Crafts & Additions** — Create SU ↔ FE bridge
- **Create: Enchantment Industry** — automated enchanting
- **Create: Slice & Dice** — Farmer's Delight automation
- **Create: Garnished** — Create + Farmer's Delight bridge
- **Create: Connected** — extended mechanical components
- **Immersive Engineering** — industrial power, wiring, multiblocks
- **Immersive Petroleum** — oil/fuel processing chain
- **Applied Energistics 2** — digital storage, autocrafting (gated Act 3+)

---

## Space & Dimensions

- **Stellaris** — rockets, planets, space stations, oxygen
- **Cobblemon/Stellaris Compatibility Patch** — Pokémon on planets
- 🔵 **Custom Planet Datapacks** — Europa, Titan, The Forge, Elysium
- 🔵 **Gate Dimension System** — floor-based dungeon instances
- 🔵 **Aetheria Penitentiary Dimension** — jail dimension for crime system

---

## Cobblemon Ecosystem

- **Cobblemon** — core Pokémon mod
- **AllTheMons datapack** — expanded roster
- **Cobblemon Loot Balls** — Poké Balls in dungeon loot
- **Cobblemon Outbreaks** — dynamic mass spawn events
- **CNPC-Cobblemon-Addon** — NPC-triggered battles
- 🔵 **Horizons Companion System** — full world integration (Klink gears, Alakazam relays, type behaviors)
- 🔵 **Per-Location Spawn Datapacks** — themed spawns per biome/dimension/planet
- 🔵 **Ancient Form Resource Pack** — deep dungeon variant textures
- 🔵 **Gym Leader NPC Configs** — 8 gyms + Elite Four + Champion
- 🔵 **Cobblemon Duel System** — PvP-alternative challenge mechanic

---

## Colonies & Workers

- **MineColonies** — player-owned farmhand/manor system
- 🔵 **Farmhand Wage System** — Lightman's Currency replaces happiness economy
- 🔵 **MineColonies Cobblemon Pairing** — worker/Pokémon efficiency bonuses
- 🔵 **Horizons Worker Types** — Vintner, Trainer's Aide, Brewer custom jobs
- 🔵 **Farm-Bound Cobblemon** — persistent companions via Companion Hut

---

## Living NPCs & Trainers

- **Custom NPCs Unofficial** — story NPCs with dialogue trees, schedules
- **Easy NPC** — ambient town population
- **Radical Cobblemon Trainers** — 1500+ wandering trainer NPCs
- **Guard Villagers** — villagers that defend settlements
- **Villager Names** — named vanilla villagers
- 🔵 **Villager Needs System** — Food/Water/Safety/Comfort tracking per village
- 🔵 **Traveling NPC Scripts** — village-to-village pathfinding
- 🔵 **Famous Villagers** — reputation-based unique NPCs
- 🔵 **NPC Bounty Hunters** — hostile NPCs that hunt players with high Crime Stat

---

## Crime & Justice *(new)*

The Star Citizen-inspired crime, bounty, and capture system.

- 🔵 **Crime Detection System** — NPC vision cones, witness reporting, theft detection
- 🔵 **Crime Stat Tracking** — 6-tier scoreboard with escalating consequences
- 🔵 **Bounty Board System** — physical posting boards in towns, hunter signup
- 🔵 **Hunter's Compass** — Curio item that points toward active bounty target
- 🔵 **Capture Mechanics** — PvP capture, Cobblemon Duel capture, Stealth Capture (Capture Net)
- 🔵 **Aetheria Penitentiary** — jail dimension with prison labor and escape mechanics
- 🔵 **Hood of Shadows** — Curio item that reduces NPC vision detection
- 🔵 **Outlaw Faction Layer** — alternative progression for criminal players
- 🔵 **Counter-Bounty System** — outlaws can post bounties on lawful players

---

## Economy & Social

- **Lightman's Currency** — coins, ATMs, wallets, shops, banks
- **Lightman's Currency Tech** — fluid/energy trading
- **Jobs+ Remastered** — professions with leveling
- 🔵 **Kingdom Currency System** — 5+ local currencies with exchange rates
- 🔵 **Faction Reputation System** — 6 factions, -1000 to +1000 scoreboard
- 🔵 **Village Evolution System** — Hamlet → Village → Town → City → Kingdom
- 🔵 **Caravan/Trade Route System** — Create trains as caravans
- 🔵 **Dynamic Price Fluctuation** — weekly kingdom economy shifts

---

## Survival & Nutrition

- **Tough As Nails** — thirst, temperature, canteens, water purification
- 🔵 **Nutrition System** — 8 food groups, variety tracking, buff effects
- 🔵 **Thirst Integration Layer** — beverage hydration, dungeon drain, Cobblemon water generation

---

## Farming, Food & Brewing

- **Farmer's Delight** — cooking foundation
- **Farmer's Respite** — coffee, tea, dessert expansion
- **Croptopia** — 250+ crops and foods
- **Let's Do: Brewery** — beer brewing with barrels
- **Let's Do: Vinery** — wine production
- **Let's Do: Bakery** — bread, pastries, ovens
- **Let's Do: Candlelight** — restaurant furniture
- **Let's Do: HerbalBrews** — teas, herbs
- **Brewin' and Chewin'** — additional brewing depth
- **Cooking for Blockheads** — kitchen blocks, recipe book
- **Serene Seasons** — seasonal crop variation
- 🔵 **Food Quality Tiers** — quality affects buff strength
- 🔵 **Soil Quality System** — biome bonuses, crop rotation
- 🔵 **Farming Skill Tools** — tiered hoes, watering cans, scythes, shears
- 🔵 **Greenhouse & Cellar Multiblocks** — climate control and fermentation bonus zones

---

## Combat

- **Better Combat** — animated melee, dual-wield, weapon swings
- **Combat Roll** — dodge rolling
- **Simply Swords** — 30+ unique weapon types
- **Artifacts** — equippable curios-slot trinkets (dungeon loot)
- **Iron's Spells 'n Spellbooks** — magic combat path

---

## Dungeons & Structures

- **Dungeon Crawl** — procedural underground dungeons (Gate floor base)
- **When Dungeons Arise** — 30+ massive overworld structures (Gate entrances)
- **YUNG's Better Dungeons** — vanilla dungeon overhaul
- **YUNG's Better Mineshafts** — mineshaft overhaul
- **YUNG's Better Strongholds** — stronghold redesign
- **YUNG's Better Nether Fortresses** — Nether fortress overhaul
- **YUNG's Better End Island** — End main island overhaul
- **YUNG's Better Desert Temples** — desert temple overhaul
- **YUNG's Better Ocean Monuments** — ocean monument overhaul
- **YUNG's Better Witch Huts** — witch hut overhaul
- **Repurposed Structures** — biome-variant vanilla structures
- 🔵 **Gate System** — the dungeon pillar
- 🔵 **Floor Templates** — 50-100 NBT structures
- 🔵 **Boss Encounters** — hand-designed every-10-floor bosses
- 🔵 **Scaling Difficulty** — mob HP/damage/loot per floor depth

---

## World Generation

- **Terralith** — 95+ overworld biomes
- **Tectonic** — continental-scale terrain
- **Nullscape** — End overhaul (→ The Sky Archive)
- **ChoiceTheorem's Overhauled Village** — village visual overhaul (kingdom base)
- **Towns and Towers** — additional structures
- **Tidal Towns** — coastal village variants

---

## Building & Decoration

- **Supplementaries** — signs, ropes, jars, ambient details
- **Chipped** — hundreds of decorative block variants
- **Handcrafted** — furniture and interiors
- **Macaw's Doors / Windows / Bridges / Roofs / Fences** — architectural variety
- **Every Compat** — cross-mod wood/stone variants

---

## Server Performance & Utility

- **Chunky** — world pre-generation (CRITICAL — pre-gen 10k radius)
- **Spark** — live profiling, TPS monitoring
- **Clumps** — merge XP orbs
- **Saturn** — entity collision optimization
- **ModernFix** — memory/load optimization
- **FerriteCore** — block state memory reduction
- **ServerCore** — async I/O, mob caps, lag spike smoothing
- **FastSuite** — faster recipe lookups
- **FastFurnace / FastWorkbench** — cached recipe lookups
- **Jade** — block/entity info overlay
- **JourneyMap (server utilities)** — map data sync

---

## Not Included (Intentionally)

- Any purely client-side rendering mod (see client list)
- OptiFine or anything conflicting with the client pipeline
- Hybrid server software (Arclight, Mohist) — pure NeoForge only
- Fabric-only mods without a NeoForge port
- Mekanism / Thermal Series — overlaps Create/IE without story integration
- Tinkers' Construct — combat handled by Better Combat + Simply Swords
- Any standalone thirst mod — Tough As Nails covers this
- Pam's HarvestCraft — Croptopia is the modern equivalent
- Any standalone "wanted" or "bounty" mod — we build this custom for tight integration

---

## Counts

| Category | Mods | Custom |
|---|---:|---:|
| Libraries & APIs | 22 | — |
| Core Engine | 10 | — |
| Automation | 10 | — |
| Space | 2 | 3 |
| Cobblemon | 5 | 5 |
| Colonies & Workers | 1 | 4 |
| Living NPCs | 5 | 4 |
| **Crime & Justice** | **0** | **9** |
| Economy | 3 | 5 |
| Survival & Nutrition | 1 | 2 |
| Farming | 11 | 4 |
| Combat | 5 | — |
| Dungeons | 11 | 4 |
| Worldgen | 6 | — |
| Building | 9 | — |
| Performance | 12 | — |
| **Total** | **113** | **40** |

**Installed mods: ~113 · Custom systems: ~40 · Combined: 153**

---

## What's New in This Update

🆕 **FTB XMod Compat** — required for KubeJS / Game Stages / Item Filters integration with FTB Quests (the quest system depends on this)
🆕 **MoreJS** — additional KubeJS events used by the quest reward handlers
🆕 **Crime & Justice section** — entire new system, all custom-built
🆕 **Faction Reputation System** — 6 factions tracked via scoreboard for quest gating
🆕 **Cobblemon Duel System** — PvP-alternative challenge mechanic
🆕 **Aetheria Penitentiary Dimension** — jail dimension for the crime system
🆕 **NPC Bounty Hunters** — hostile NPCs that hunt high-Crime-Stat players
