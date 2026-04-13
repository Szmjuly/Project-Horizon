# Project Horizons — The Complete Overview

**Everything in one place. The definitive single-source document.**

> Read this first. It tells you what Project Horizons is, what files exist, what world you're building, what systems run it, what the player experiences, and what the roadmap looks like. Every other document in this project supports this one.

---

## 1. The Vision

**Project Horizons** is an anime-adventure Minecraft modpack on **NeoForge 1.21.1**. It combines Cobblemon, Create, Stellaris, deep farming, Solo Leveling–style infinite dungeons, MineColonies-driven settlements, a Star Citizen–inspired crime/bounty system, a 5-act branching main quest with 5 endings, and a Path of Exile–style ascension reclass mechanic — all woven into one cohesive **200-600 hour SMP experience**.

**Tone:** Star Trek meets Pokémon meets Stardew, with a Ghibli / Frieren visual and emotional aesthetic.

**Target audience:** Small-to-medium SMP communities (4-16 players) who want a modpack with genuine depth in both combat and peaceful play.

**The promise:** Every player should be able to pick any path through this pack and find 200+ hours of meaningful, non-repetitive gameplay that feels personal.

### The One-Paragraph Pitch

You arrive in Aetheria, a world built by a civilization that vanished into the stars. Your first days are spent learning to eat, drink, and survive. Your first months are spent choosing a path: descend the ancient Gates beneath the earth, or tend a vineyard on a hillside. Battle trainers and gym leaders, or befriend a Bulbasaur who helps you farm. Build a rocket and reach the Moon, or build a manor and raise a kingdom. The world doesn't care which you choose — it rewards depth in all directions. Eventually you'll hear travelers in distant kingdoms telling stories about your wines, your battles, your rocket, or all three. And when you're ready, the Watchers will offer you the Trial of Ascension — and you'll become something more than what you were.

---

## 2. The Project at a Glance

| | |
|---|---:|
| **Platform** | NeoForge 1.21.1 |
| **Total mods** | ~113 |
| **Custom systems** | ~57 |
| **Combined scope** | ~170 components |
| **Quests** | ~430 |
| **Endings** | 5 |
| **Ascended classes** | 20 (10 lawful + 10 shadow) |
| **Famous Locations** | 130+ |
| **Custom structures** | ~280 (across 5 quality tiers) |
| **Factions** | 6 |
| **Custom dimensions** | 13+ |
| **Estimated dev time to MVP** | 16 weeks part-time |
| **Estimated dev time to full** | ~12 months part-time |
| **Target player count** | 4-16 SMP |
| **Server RAM** | 16 GB |
| **Java** | 21 |

---

## 3. File Manifest

The complete project documentation. **Read in this order** depending on your role.

### 🟢 Core Documents (read these to understand the project)

| # | File | Purpose | Length |
|---|---|---|---:|
| 1 | **`HORIZONS_PROJECT_OVERVIEW.md`** *(this file)* | Master index, single-source overview, the TL;DR | ~12k words |
| 2 | **`HORIZONS_MODPACK_GUIDE.md`** | Master navigation, philosophy, design principles, dev setup, distribution strategy, decision log | ~8k words |
| 3 | **`PROJECT_HORIZONS_v3_GDD.md`** | The full game design document — 5-act narrative, all systems, complete vision | ~10k words |

### 🔵 System Design Documents (read when building specific systems)

| # | File | Purpose | Length |
|---|---|---|---:|
| 4 | **`HORIZONS_SERVER_MODS.md`** | Complete server-side mod list, ~113 mods organized by category | ~3k words |
| 5 | **`HORIZONS_CLIENT_MODS.md`** | Client enhancement mods, rendering pipeline, shader packs, hardware presets | ~3k words |
| 6 | **`HORIZONS_INTEGRATIONS.md`** | All ~57 custom KubeJS/datapack/resource pack systems | ~14k words |
| 7 | **`HORIZONS_LIVING_WORLD.md`** | The Peaceful Pillar — farming, nutrition, water, MineColonies, villagers, Cobblemon farming | ~10k words |
| 8 | **`HORIZONS_QUEST_SYSTEM.md`** | Full quest system — 5-act main, side chains, mod tutorials, branching, crime/bounty, 5 endings | ~18k words |
| 9 | **`HORIZONS_ASCENSION_SYSTEM.md`** | Late-game reclass system — 10 Ascended Classes, 10 Shadow Variants, trials, lore, multi-ascension | ~10k words |
| 10 | **`HORIZONS_WORLD_SYSTEM.md`** | Custom structures, Famous Locations Registry, Aetheria calendar, events, encounters | ~14k words |

### ⚪ Historical Reference (older versions, kept for context)

| # | File | Status |
|---|---|---|
| 11 | `PROJECT_HORIZONS_GDD.md` | v1 GDD — superseded by v3 |
| 12 | `PROJECT_HORIZONS_v2_GDD.md` | v2 GDD — superseded by v3 |
| 13 | `PROJECT_HORIZONS_INTEGRATION_BIBLE.md` | Integration philosophy — partially absorbed into other docs |
| 14 | `HORIZONS_CUSTOM_CONTENT.md` | Older name of `HORIZONS_INTEGRATIONS.md` |

### Reading Order

**For project orientation (45 minutes):**
1. This file (overview)
2. `HORIZONS_MODPACK_GUIDE.md` (philosophy + decision log)

**For full system understanding (3-4 hours):**
1. This file
2. `HORIZONS_MODPACK_GUIDE.md`
3. `PROJECT_HORIZONS_v3_GDD.md`
4. The 7 system docs in order: Server Mods → Client Mods → Living World → Quest System → Ascension → World System → Integrations

**For building (reference as needed):**
- Open the system doc relevant to what you're building
- Cross-reference Integrations for KubeJS hooks
- Cross-reference Modpack Guide for design principles

---

## 4. The World of Aetheria

### Geography

Aetheria is a world built by the Precursors — an ancient civilization that vanished into the stars. The world they left behind is geographically diverse, hand-built, and full of hints of their lost legacy.

**Major regions:**

- **The Sea of Grain** — vast plains, breadbasket of the world, home of the Plains Kingdom
- **The Shattered Peaks** — towering mountain range in the north, Mountain Forge territory
- **The Endless Forest** — ancient woodland, Forest Coalition home
- **The Coastal Reach** — long coastlines, islands, Coastal Republic territory
- **The Glasslands** — crystal-floored desert with rare resources
- **The Whisper Marsh** — mysterious bog, Cobblemon-rich
- **The Cloudreach** — high-altitude monastic enclave, Skyborn Order home
- **The Lost Valley** — verdant hidden refuge, secret discovery
- **The Twilight Cliffs** — towering western cliffs overlooking unmapped sea

**Custom dimensions (13+):**

- **Overworld (Aetheria)** — Terralith + Tectonic enhanced, the main world
- **The Nether (The Breach)** — industrial-flavored Nether overhaul
- **The End (The Sky Archive)** — Skyborn Order's base, ancient Precursor library
- **The Moon, Mars, Venus, Mercury** — Stellaris stock planets
- **Europa, Titan, The Forge, Elysium** — Horizons custom planets
- **The Between** — fast-travel warp space
- **The Deep** — inverse-gravity crystalline world below bedrock
- **Aetheria Penitentiary** — jail dimension for the crime system
- **The Garden of First Light** — hidden Awakened ending location
- **10 Ascension Trial Dimensions** — one per Ascended class

### History (Lore Summary)

Long before the player arrived, **the Precursors** built Aetheria. They were an advanced civilization that had mastered Create-style engineering, deep Cobblemon partnership, and dimensional travel. They lived for centuries in harmony with the world.

Then they ascended. Not died — *transcended*. The Precursors reached a point where their understanding of reality let them shed their physical forms. They became the **Watchers**, seven cosmic beings who now observe Aetheria and judge those who walk the same paths the Precursors once walked.

The world they left behind is dotted with ruins, monuments, and hidden libraries. Their language can still be deciphered. Their technology can still be activated. Their final question echoes through Aetheria: *Will anyone follow us?*

The player arrives as one of many drifters — souls washed up on Aetheria's shores. Most live and die without reaching the truth. A few catch the Watchers' attention. Even fewer pass their trials. And one in a thousand transcends, becoming something new.

### The Six Factions

| Symbol | Faction | Style | Player Affinity |
|---|---|---|---|
| 🌾 | **Plains Kingdom** | Agricultural, trade-focused, friendly | Starter faction, all paths |
| 🌲 | **Forest Coalition** | Druidic, herbalist, Cobblemon-loving | Cultivator, Beastmaster paths |
| 🏔️ | **Mountain Forge** | Engineer, smith, craftsman | Artificer, Warlord paths |
| 🏝️ | **Coastal Republic** | Merchant, sailor, economist | Merchant Prince, Voyager paths |
| 🌌 | **Skyborn Order** | Mystic, scholar, secretive | Lorekeeper, Watcher-aligned paths |
| ⚖️ | **Free Wanderers** | Non-aligned, independent, outlaw-friendly | Outlaw, Bounty Hunter paths |

**Faction reputation** is tracked from -1000 (Hated) to +1000 (Honored), with 6 tiers in between. Players can hold positive standing with multiple factions but only **one allegiance** at a time.

### Capital Cities

| Capital | Faction | Notable Features |
|---|---|---|
| **Anchor Town** | Plains Kingdom | Starter hub, Guild Hall, three Path Mentors, the Aetheria Coliseum |
| **Willowmere** | Plains Kingdom | First foreign village, vineyards, Vintner Mara, trade route hub |
| **Iron Crown** | Mountain Forge | Forge-city built into a mountain, High Smith Khael |
| **Saltport** | Coastal Republic | Bustling port, Merchant Caelus, Floating Market hub |
| **Greengrove** | Forest Coalition | Druidic canopy village, Druid Yshara |
| **The Cloudreach** | Skyborn Order | High-altitude monastery, Watcher's Voice |

### The Aetheria Calendar

Time matters in Aetheria. The world has 12 named months across 4 seasons:

| Month | Season | Notable Day |
|---|---|---|
| **Sprouting** | Spring | Day 7: First Bloom Festival |
| **Verdant** | Spring | Day 14: Cobblemon Hatchling Day |
| **Brightwax** | Summer | Day 1: Solstice of Light |
| **Highsun** | Summer | Day 21: The Grand Market |
| **Goldfall** | Autumn | Day 7: First Harvest |
| **Reaping** | Autumn | Day 21: Harvest Festival |
| **Ashfall** | Autumn | Day 28: Day of Remembering |
| **Frostlock** | Winter | Day 14: Winter Solstice |
| **Deepwinter** | Winter | Day 1: The Long Night |
| **Stillborn** | Winter | (no festivals — the quiet month) |
| **Thawing** | Late Winter | Day 14: Awakening Day |
| **Newleaf** | Early Spring | Day 7: Festival of New Beginnings |

Each festival is a real event: temporary structures spawn, NPCs gather, limited-time quests open, exclusive cosmetics become available.

---

## 5. The Six Major Systems

Project Horizons is built on six interlocking systems. Each one is deep enough to support 100+ hours of solo focus.

### 🗡️ System 1: The Adventure Pillar

**The combat path. Solo Leveling energy.**

- **Gate Dungeons** — Floor-based infinite dungeons inspired by Solo Leveling. Theme bands (Foundations, Shift, Deep, Abyss, Core), boss arenas every 10 floors, Floor 100 legendary drops.
- **Better Combat + Combat Roll + Simply Swords** — animated melee, dodge rolling, 30+ unique weapon types
- **Iron's Spells** — full magic system as alternative or hybrid path
- **Cobblemon Battles** — 8 gym leaders + Elite Four + Champion (Cobblemon Mastery side chain)
- **Stellaris Space Combat** — boss encounters on planets and space stations
- **Ancient Form Cobblemon** — deep dungeon variants with unique drops

**The fantasy:** You descend deeper. You become stronger. You face the boss that no one has beaten. You return changed.

### 🌾 System 2: The Living Pillar

**The peaceful path. Stardew meets Frieren.**

- **8-group nutrition system** — eating variety unlocks Well Fed, Balanced Diet, Gourmet states
- **Tough As Nails water/thirst** — water sources, canteens, dehydration stages
- **Deep farming** — 5 quality tiers from Table to Legendary, soil quality system, Cobblemon farming partners
- **Brewing chains** — Let's Do Brewery, Vinery, Bakery, HerbalBrews, plus Brewin' and Chewin'
- **MineColonies farmhands** — hire NPC workers, pair them with Cobblemon for efficiency bonuses (Bulbasaur + Farmer = +25% yield)
- **Cultivator skill tree** — capstone Verdant Soul makes you a peaceful god
- **Heartwood Hoe** — endgame farming tool with 5% Legendary chance per harvest
- **Village Evolution** — Hamlet → Village → Town → City → Kingdom progression

**The fantasy:** You arrive with nothing. Your hands learn the soil. You make wine that travelers come from kingdoms to drink. Your farm becomes a place people remember.

### 🎒 System 3: Quests, Story & Choices

**The narrative spine. ~430 quests across the entire pack.**

- **Main Quest** — 5 acts, ~80 quests, branching at major decision points
- **5 Endings** — Restoration, Pilgrim, Steward, Awakened, Architect (each with its own questline + NG+ unlock)
- **10 Side Chains** — Cobblemon Mastery, Merchant Prince, Master Crafter, Cartographer, Lorekeeper, Cultivator's Path, Colony Builder, The Trainer's Way, The Bounty Hunter, The Outlaw
- **14 Mod Tutorial Chapters** — Surface (basics) + Deep (mastery) tiers per major mod
- **6 Faction Reputation System** — quests gated by reputation tiers
- **20 named NPCs** — each with persistent location, schedule, dialogue tree, faction allegiance, and questline
- **NG+ system** — keeps progression, lets you pursue different endings in the same world
- **Walker of All Paths** — secret title for completing all 5 endings, unlocks Compass of Convergence

**The fantasy:** Your choices matter. Your reputation precedes you. You can finish the game five different ways and each one feels like a different story.

### ⚖️ System 4: Crime & Justice

**The Star Citizen layer. Real consequences for actions.**

- **Crime Stat 0-5** — Clean Citizen → World Enemy with escalating consequences
- **Witness mechanics** — NPCs have vision cones, crimes auto-report after 30 seconds, killing the witness suppresses the report (but is itself a crime)
- **Bounty Boards** — physical blocks in every Town+, auto-post bounties on Crime Stat 2+
- **Hunter's Compass** — Curio that points toward your active bounty target
- **Three capture methods** — PvP, Cobblemon Duel (peaceful), or Stealth Capture with a Capture Net
- **Cobblemon Duel** — challenge other players to a Pokémon battle instead of resorting to PvP. Most player conflicts can be resolved this way.
- **Aetheria Penitentiary** — jail dimension with sentence reduction via fines, prison labor, or escape attempts
- **NPC Bounty Hunters** — Famous Hunters like The Iron Crow, Steelclaw Maven, Old Marshal Hattori spawn to hunt high-Crime players
- **Outlaw Path** — alternative progression for criminal players with hideouts, smuggling routes, counter-bounties

**The fantasy:** Every action has weight. Steal a chest, get caught, run from hunters, fight or duel them, end up in jail or escape into legend.

### 🌟 System 5: Ascension & Mastery

**The endgame reclass. Solo Leveling second awakening.**

- **Trigger:** Act 4 reached, perk tree thresholds met, side chain capstone, Gate Floor 30, Trusted faction reputation
- **10 Ascended Classes** — 6 Hybrids (require 2 base trees) + 4 Transcendents (require 100/100 in one tree)
- **10 Shadow Variants** — alternative ascensions for outlaws via the Forgotten
- **Trial Dungeons** — 10 hand-built solo trials, one per class, with no respawn
- **Each Ascension grants:** new 50-point perk subtree + Class Sigil Curio + Signature Ability (keybind) + visible Passive Transformation
- **Multiple Ascensions** — up to 3 per character with escalating requirements
- **Triple Crown** — Curio for triple-ascended players showing all three ascension symbols
- **Lore integration** — each class has a patron Watcher who appears in a dream cinematic
- **Secret content per class** — hidden encounters only accessible to specific Ascended players (the Eighth Planet, Floor 0, Boss of Bosses, etc.)

**The Ten Lawful Classes:**
1. **Warlord** (Vanguard + Artificer) — mechanical war machine
2. **Beastmaster** (Vanguard + Cultivator) — Cobblemon battle god
3. **Pathwalker** (Vanguard + Wayfinder) — dimensional shadow assassin
4. **Architect** (Artificer + Cultivator) — automation farming overlord
5. **Voyager** (Artificer + Wayfinder) — space-faring engineer
6. **Shepherd** (Cultivator + Wayfinder) — wandering herbalist
7. **Avatar of War** (Vanguard 100) — pure combat god
8. **Mind of the Forge** (Artificer 100) — pure crafting god
9. **Verdant Sovereign** (Cultivator 100) — life embodied
10. **Eternal Walker** (Wayfinder 100) — distance bows to you

**The fantasy:** You hit 100 hours. You think you're done. The Watcher offers you the trial. You pass. You become *more*.

### 🌍 System 6: The World System

**The structures, locations, events, and calendar that make Aetheria a place.**

- **~280 custom structures** across 5 quality tiers (T1 Quick → T5 Mythic)
- **130+ Famous Locations** in a server-side registry with names, lore, faction, status, NPCs, quests, events
- **15+ random encounter types** — Wandering Merchants, Lost Children, Bandit Ambushes, Cobblemon Outbreaks, Storm Refuges, Pilgrim Processions, Hunter Camps, Strange Strangers
- **12 calendar festivals** — each with temporary structures, NPCs, quests, and exclusive cosmetics
- **11 world events** — Meteor Shower, Eclipse, The Convergence, The Migration, Faction Tournament, Grand Market, Watcher's Visit, Gate Surge, Server Anniversary, Stranger's Caravan, Precursor Activation
- **8 crisis events** — Village Under Siege, Dungeon Overflow, Wild Cobblemon Berserk, The Plague, The Great Flood, The Forge Fire, The Lost Caravan, The Outlaw Raid
- **Discovery cinematics** — entering Famous Locations triggers music swells, particles, and lore unlocks
- **Location states** — Pristine, Active, Ruined, Hidden, Contested, Restored
- **Player-founded locations** — auto-register when significant (manor reaches MineColonies tier 5, kingdom achieves City status)

**The fantasy:** The world has names. The world has dates. The world remembers what happened where. You can give other players directions to a place by name.

---

## 6. The Six Systems Map

How they all connect:

```
                  ┌──────────────────────┐
                  │   QUEST SYSTEM       │
                  │   ~430 quests        │
                  │   5 endings          │
                  │   Branching choices  │
                  └─┬────────────────────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
  ┌─────────┐  ┌─────────┐  ┌──────────┐
  │ADVENTURE│  │ LIVING  │  │  CRIME   │
  │ PILLAR  │  │ PILLAR  │  │ &JUSTICE │
  │ Combat  │  │ Farm    │  │ Bounties │
  │ Gates   │  │ Brew    │  │ Duels    │
  │ Space   │  │ Colony  │  │ Outlaws  │
  │ Magic   │  │ Cook    │  │ Jail     │
  └────┬────┘  └────┬────┘  └────┬─────┘
       │            │            │
       │   Reputation, currency, │
       │   trust, time all flow  │
       │   between systems       │
       └───────┬────┴──────┬─────┘
               │           │
               ▼           ▼
        ┌──────────────────────┐
        │   WORLD SYSTEM       │
        │   Structures         │
        │   Locations          │
        │   Calendar           │
        │   Events             │
        │   Encounters         │
        └─────────┬────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │  ASCENSION SYSTEM    │
        │  Endgame reclass     │
        │  10 lawful + 10      │
        │  shadow classes      │
        │  3 ascensions max    │
        └──────────────────────┘
```

**Every edge is a real integration.** Quests reference Locations. Locations spawn Events. Events change Reputation. Reputation gates Quests. Crime affects Reputation. Reputation gates Ascension. Ascension unlocks Hidden Locations. Hidden Locations contain Quests. The whole thing is a closed loop.

---

## 7. The Player Journey

### Hour 0-10: Arrival

You wake in a meadow. Sera greets you. You're hungry. You're thirsty. The river water needs boiling. You catch your first Cobblemon — a Bulbasaur, drawn to a wildflower patch. You make your first bread. You walk toward Anchor Town because Sera said to.

### Hour 10-25: Anchor Town

You meet Petra the Town Crier, Guild Master Aren, the three Path Mentors. You choose a path — Vanguard, Artificer, or Cultivator. Your starter kit reflects your choice. You find the First Gate. You descend to Floor 5 and survive. You return changed.

### Hour 25-50: First Steps Into the World

You travel to Willowmere. You meet Vintner Mara. You press your first grapes. You hire your first MineColonies Builder. You pair them with your Bulbasaur and the productivity doubles. A wandering RCT trainer challenges you to a Cobblemon battle. You lose, but you learn. You sell your first Table Wine to a passing merchant. Your nutrition state reads "Well Fed" for the first time.

### Hour 50-100: The Wider World Opens

You visit the Mountain Forge. You meet High Smith Khael. You start your first Create train route. You earn your first Gym Badge. You decide on a Faction allegiance. The choice matters — you can feel the world's politics shift. You discover your first Famous Location — the Whispering Cairn — and Lorekeeper XP rewards you. The Eclipse world event happens. Eclipse Wraiths spawn. You collect Eclipse Shards.

### Hour 100-150: The Stars

You meet Master Lyra. You build your first rocket. You land on the Moon. A strange obelisk stands on the dark side. You return. The Watcher's Voice begins to speak to you in dreams. You see the truth of the Precursors. You face the Watcher's Question. You choose your ending intent.

### Hour 150-175: The Trial of Ascension

You meet all the Ascension prerequisites. The Watcher invites you to the Sky Cathedral. You choose a class — perhaps Beastmaster, perhaps Avatar of War, perhaps Verdant Sovereign. You enter your trial dimension alone. You die once. You wait 24 game hours. You try again. You succeed. The Watcher of Bonds appears in your dream. You wake up changed. Your Class Sigil glows. Your Signature Ability is bound to a key. The world bows slightly differently to you now.

### Hour 175-200: The Ending

You commit to your ending path. Maybe you build the Pilgrim's Vessel and visit every Famous Villager to say farewell. Maybe you found your own kingdom and convince three factions to recognize it. Maybe you reach Floor 100 alone and witness the Garden of First Light. The cinematic plays. Your name is etched somewhere permanent — a star map block, a kingdom plaque, a Founder's monument.

### Hour 200-400: NG+ and Mastery

You start NG+. You keep your gear, your level, your Cobblemon, your reputation. You pursue a second ending. You attempt your second Ascension. You uncover hidden class secrets. You bond with all 8 Soulbound Pokémon. You discover that the Heartwood Tree blooms differently when you stand under it as a Verdant Sovereign. You begin to feel like a legend in your own world.

### Hour 400-600: The Walker

If you complete all 5 endings, you unlock **Walker of All Paths** and receive the **Compass of Convergence**. You attempt your third Ascension — the hardest trial of all. If you succeed, you wear the **Triple Crown**. Other players whisper your name. You become part of Aetheria's permanent lore.

### Hour 600+: The Legacy

A new player arrives in Aetheria. Sera welcomes them. Later that day, the new player wanders past your kingdom, sees your name on a Founder's plaque, and asks Sera who you were. Sera tells them. The story persists. The world remembers.

---

## 8. The Build Roadmap

Six phases. Each phase has clear exit criteria.

### Phase 1 — Foundation (Weeks 1-2)

**Goal:** Mod list boots cleanly, basic custom scripts running, Act 1 playable.

- Install all 113 mods, verify clean boot
- Spark profiling baseline
- Basic KubeJS scripts: recipe bridges, food quality stubs, nutrition tags
- Cobblemon spawn datapacks for starter biomes
- FTB Quests Act 1 skeleton (10 quests)
- Lightman's Currency baseline
- Tough As Nails configuration
- Anchor Town spawn area (T4 structure)
- Famous Locations registry infrastructure
- Calendar system stub

**Exit:** New player can log in, survive their first night, eat and drink, complete the first quest, discover Anchor Town as a Famous Location.

### Phase 2 — Core Systems (Weeks 3-5)

**Goal:** Signature systems playable in prototype form.

- Companion interactions v1 (5 types)
- Trust/Fatigue baseline
- Gate System (10 floor templates, 1 boss)
- Kingdom currency items
- Pathfinder leveling with perk tree stubs
- Full nutrition + thirst integration
- Faction Reputation System
- Quest reward handlers (all custom types)
- Quest Chapters 2-3 (Acts 2 and 3)
- First 2 side chains (Cobblemon Mastery, Cultivator's Path)
- First 10 T1 structures
- Willowmere built (T3)
- Random encounter scheduler with 5 types
- First scheduled festival (First Bloom)
- First world event (Meteor Shower)

**Exit:** Player can descend into a Gate, fight on a scaled floor, exit, cook a varied meal, hire a MineColonies worker with a Cobblemon partner, attend a festival.

### Phase 3 — World Building (Weeks 5-8)

**Goal:** The world feels handcrafted and alive.

- All 6 capital cities built (4 T4 + 2 T3)
- 30+ T1-T2 structures across biomes
- 8 Gym structures with NPCs
- Village evolution templates (5 biomes × 4 stages)
- Custom planet datapacks
- First Create train trade route
- Ancient Form resource pack v1
- MineColonies + custom schematics
- Pokémon worker pairings (first 5)
- Radical Cobblemon Trainers configuration
- 20 named NPC quest givers built
- NPCs hooked into quest system
- First 4 mod tutorial chapters
- Crime System foundation (witness, Crime Stat, Bounty Board, Hood of Shadows, Capture Net)
- All 12 festivals defined and triggering
- 15 random encounter types
- Crisis event system (4 types)
- All 130+ Famous Locations registered

**Exit:** A player can hire a MineColonies Farmer with a Bulbasaur, see them working, visit a nearby Village that reacts to their presence, attend a Festival, and witness their first random encounter on a road.

### Phase 4 — Deep Content (Weeks 8-12)

**Goal:** Full playthrough content ready.

- 50+ dungeon floor templates (all theme bands)
- Gate System complete (anchors, bosses, Floor 100)
- All companion interactions
- Quest Chapters 4-5 (Acts 4 and 5) full
- All 5 ending sub-chapters
- Remaining side chains (S3-S10)
- Remaining tutorials (T5-T14)
- Full caravan/trade system
- Automated Village Evolution
- Deep farming (soil quality, brewing tiers)
- Farming Skill Tools full progression
- Villager Needs System
- Farm-Bound Cobblemon
- Traveling NPC Scripts
- Crime System full (Penitentiary, NPC Hunters, Cobblemon Duel, Counter-Bounties)
- Famous NPC Hunters built (Iron Crow, Steelclaw Maven, Old Marshal Hattori)
- All T4 signature structures (Heartwood Tree, Sky Cathedral, Sunken Cathedral)
- T2 structures completing the world
- All 11 world events
- Player-triggered event hooks
- Hidden Locations placed
- All 10 ascension trial sites built
- Ascension foundation (eligibility check, Warlord class fully implemented)

**Exit:** A player can complete the main questline end-to-end, a peaceful player can go from Hour 1 to Hour 100 without combat, and a player can ascend for the first time.

### Phase 5 — Polish (Weeks 12-16)

**Goal:** Shippable pack.

- Resource pack complete (UI, items, skyboxes, music, jail theme, festival cosmetics)
- Price fluctuation economy
- Death penalty full
- All 9 remaining Ascended Classes implemented
- All 10 Shadow Variants implemented
- Multiple ascension logic
- Watcher NPCs and dialogue trees
- T5 mythic structures (Hidden Library, Sky Archive, Garden of First Light)
- Festival cosmetics polished
- Eclipse-Bound gear set complete
- Encounter pool tuning
- Discovery cinematic effects polished
- Spark profiling and TPS optimization
- Stress test with 4-8 players
- Player guide and admin docs
- CurseForge packaging
- Quest book UI theming
- Crime Stat HUD overlay
- Quest localization keys

**Exit:** The pack runs at 20 TPS with 8 players online for 4+ hours without memory leaks. All systems are functional. The pack is shippable.

### Phase 6 — Post-Launch (Ongoing)

- S-Rank Gates infinite scaling
- Seasonal events (tournaments, festivals, harvest celebrations)
- Precursor lore expansion
- Java mod extraction for complex blocks
- Additional planets, dimensions, side chains, ending content
- Hidden Location secrets placed
- Triple Crown achievements
- Community-suggested content
- Player-founded location auto-registration
- Server anniversary events

---

## 9. The Project at Final Scope

### Numbers

| Category | Count |
|---|---:|
| **Mods (installed)** | ~113 |
| **Custom systems** | ~57 |
| **KubeJS server scripts** | 52 |
| **KubeJS startup scripts** | 7 |
| **Datapack categories** | 19 |
| **Resource pack categories** | 6 |
| **Optional Java mods** | 3 |
| **Quests** | ~430 |
| **Quest chapters** | 30 (5 main acts + 5 endings + 10 side chains + 14 tutorials) |
| **Endings** | 5 |
| **Side quest chains** | 10 |
| **Mod tutorial chapters** | 14 |
| **Factions** | 6 |
| **Named NPC quest givers** | 20 |
| **Custom dimensions** | 13+ |
| **Custom planets** | 4 (Europa, Titan, The Forge, Elysium) plus stock Stellaris |
| **Ascended classes** | 20 (10 lawful + 10 shadow) |
| **Ascension trials** | 10 |
| **Maximum ascensions per character** | 3 |
| **Famous Locations** | ~130 |
| **Capital cities** | 6 |
| **Notable towns** | 12 |
| **Sacred sites** | 15 |
| **Custom structures** | ~280 (across 5 quality tiers) |
| **Random encounter types** | 15+ |
| **Calendar festivals** | 12 |
| **World events** | 11 |
| **Crisis event types** | 8 |
| **Total target playthrough hours** | 200-600 |

### Time Investment

| Phase | Duration | Effort |
|---|---|---|
| Phase 1 — Foundation | 2 weeks | ~40 hours |
| Phase 2 — Core Systems | 3 weeks | ~60 hours |
| Phase 3 — World Building | 4 weeks | ~120 hours |
| Phase 4 — Deep Content | 4 weeks | ~160 hours |
| Phase 5 — Polish | 4 weeks | ~120 hours |
| **MVP Total** | **17 weeks** | **~500 hours** |
| Phase 6 — Post-Launch | Ongoing | ~1000+ hours over 12 months |

**Realistic timelines:**
- **Solo dev part-time** (10 hr/week) — ~12 months to MVP, 2+ years to full
- **Solo dev full-time** (40 hr/week) — ~3-4 months to MVP, 8-12 months to full
- **Small team (2-3 people)** — ~2-3 months to MVP, 6-9 months to full

---

## 10. Where to Start

You've read this whole document. You're ready to begin. Here's the optimal first week.

### Day 1-2: Setup

- Install JDK 21 (GraalVM CE recommended)
- Set up project directory per `HORIZONS_MODPACK_GUIDE.md` Section 5
- Initialize git, set up `.gitignore`
- Install NeoForge 1.21.1 server
- Boot empty server, verify it works

### Day 3-4: Library Layer

- Install only the libraries from `HORIZONS_SERVER_MODS.md` Libraries section
- Boot, verify no crashes
- Add KubeJS alone, boot, verify scripting pipeline

### Day 5: First Custom Script

```js
// kubejs/server_scripts/test.js
PlayerEvents.loggedIn(event => {
  event.player.tell('§6Welcome to Project Horizons!')
})
```

If this fires when a player logs in, your scripting pipeline is alive.

### Day 6-7: First Foundation Mods

In order, with boots between each group:

1. Create + Create addons → boot
2. Cobblemon + dependencies → boot
3. Terralith + Tectonic → boot
4. FTB Library, Quests, Teams, Chunks → boot
5. Lightman's Currency → boot
6. Tough As Nails → boot
7. Farmer's Delight + Let's Do suite → boot

### Week 2: First Real Systems

- Build the **Cross-Mod Recipe Bridge** (`cross_mod_bridges.js`) — the foundation everything else builds on
- Build the **Famous Locations Registry** infrastructure — the foundation for the World System
- Build the **Quest Reward Handlers** — the foundation for the Quest System
- Write your first 5 quests in FTB Quests for Act 1
- Place a single test structure (a small Hermit's Shrine T1) and verify it generates

### Week 3+: Follow Phase 2 of the roadmap

By the end of week 3, you should have a working Anchor Town spawn build, the first Gate dungeon prototype, the first Famous Location (Anchor Town) registered, and the first scheduled festival firing.

### When You Get Stuck

- Check the relevant system doc for your current task
- Check the **Decision Log** in `HORIZONS_MODPACK_GUIDE.md` Section 10
- Check the **"What Goes Where" cheat sheet** in `HORIZONS_INTEGRATIONS.md` Section 7
- Check the **Build Priority** sections in each system doc

### When You're Done with a Phase

- Tag the git repo (`v0.1-foundation`, `v0.2-core`, etc.)
- Run a stress test in a fresh world
- Take screenshots and notes
- Update the Modpack Guide's Decision Log if any architectural decisions changed
- Plan the next phase by re-reading its goals and exit criteria

---

## 11. The Three Promises

If Project Horizons does only three things well, let it be these:

**1. Every player path is first-class.**
A combat player gets Solo Leveling. A peaceful player gets Stardew. An outlaw gets Star Citizen. A Cobblemon trainer gets a full Pokémon journey. A merchant gets a real economy. None of these is a "side activity." All are equally deep, equally rewarded, and equally celebrated.

**2. The world has memory.**
The villagers remember you. The kingdoms react to your reputation. Your manor becomes a Famous Location. Your wines become legendary. Your name appears on Founder's plaques. Other players talk about you. The world *is* the story of the players who have walked it.

**3. The Watchers were always there.**
From Hour 1, the Watchers are watching. The Precursor lore is hidden in plain sight. The Ascension trials are the same path the Precursors walked before vanishing into the stars. When a player ascends, they're not unlocking a new feature — they're answering a question that's been asked for thousands of years.

These three promises are what separate Project Horizons from "a really good modpack." Hold to them. Reject anything that violates them.

---

## 12. Final Thoughts

Project Horizons is enormous. ~113 mods, ~57 custom systems, ~430 quests, 5 endings, 20 Ascended classes, 130+ Famous Locations, 280 structures, 6 factions, 13 dimensions, a 200-600 hour playthrough.

It is also achievable. Every individual piece is proven. The complete pack is unprecedented in cohesion, but every system has a working reference somewhere. What makes Horizons unique is the **integration density** — every system talks to every other system, every player path is documented, every decision is logged.

The biggest risk is scope creep. Every phase will tempt you to add "just one more thing." Resist. Ship Phase 5 on time. Phase 6 is when you add more, not before.

The biggest reward is a world players will remember for years. A world they tell their friends about. A world that changes how they think about what a Minecraft modpack can be.

That's worth the work.

---

## Appendix A: Document Quick Reference

When you need information about X, open the document Y.

| You need to know about... | Open this file |
|---|---|
| The vision and design philosophy | `HORIZONS_MODPACK_GUIDE.md` |
| The full game design | `PROJECT_HORIZONS_v3_GDD.md` |
| Which mods to install | `HORIZONS_SERVER_MODS.md` + `HORIZONS_CLIENT_MODS.md` |
| How to build a custom system | `HORIZONS_INTEGRATIONS.md` |
| Farming, brewing, MineColonies, nutrition | `HORIZONS_LIVING_WORLD.md` |
| Quests, story, branching, endings, crime | `HORIZONS_QUEST_SYSTEM.md` |
| Endgame reclass and ascended classes | `HORIZONS_ASCENSION_SYSTEM.md` |
| Structures, locations, calendar, events | `HORIZONS_WORLD_SYSTEM.md` |
| Why a decision was made | `HORIZONS_MODPACK_GUIDE.md` Section 10 (Decision Log) |
| What's the project at a glance | This file |

---

## Appendix B: The Final File List

Everything in `/mnt/user-data/outputs/`:

### Active Documents (Current Build)

```
HORIZONS_PROJECT_OVERVIEW.md       ← THIS FILE — start here
HORIZONS_MODPACK_GUIDE.md          ← Master navigation, philosophy, decision log
PROJECT_HORIZONS_v3_GDD.md         ← Full game design document
HORIZONS_SERVER_MODS.md            ← ~113 server-side mods
HORIZONS_CLIENT_MODS.md            ← Client enhancements, shaders, presets
HORIZONS_INTEGRATIONS.md           ← ~57 custom KubeJS/datapack systems
HORIZONS_LIVING_WORLD.md           ← Peaceful pillar (farming, MineColonies, etc.)
HORIZONS_QUEST_SYSTEM.md           ← ~430 quests, 5 endings, crime system
HORIZONS_ASCENSION_SYSTEM.md       ← Endgame reclass with 20 classes
HORIZONS_WORLD_SYSTEM.md           ← Structures, locations, events, calendar
```

### Historical / Reference

```
PROJECT_HORIZONS_GDD.md            ← v1 GDD (superseded)
PROJECT_HORIZONS_v2_GDD.md         ← v2 GDD (superseded)
PROJECT_HORIZONS_INTEGRATION_BIBLE.md  ← Integration philosophy (partially absorbed)
HORIZONS_CUSTOM_CONTENT.md         ← Older name of HORIZONS_INTEGRATIONS.md
nova-frontier-design.md            ← Unrelated older project
```

**Total active documentation: 10 files, ~100,000 words.**

---

*Project Horizons — The Complete Overview v1*
*The single-source index. Read first. Refer often.*
*NeoForge 1.21.1 · Pure NeoForge · Two Pillars · Six Systems · Five Endings · Twenty Classes · One World*
*Aetheria awaits.*
