# Project Horizons — Quest System

**The narrative spine of the pack.**

> Built on FTB Quests + KubeJS, woven into NPCs, locations, factions, and the crime system. The quest system is what turns "a bunch of cool mods" into a story you actually live through. Multiple paths, real choices, five endings, and 400+ total quests across main, side, and tutorial chains.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Quest Architecture](#2-quest-architecture)
3. [The Main Quest](#3-the-main-quest)
4. [The Five Endings](#4-the-five-endings)
5. [Side Quest Webs](#5-side-quest-webs)
6. [Mod Tutorial Chapters](#6-mod-tutorial-chapters)
7. [Branching, Choices & Reputation](#7-branching-choices--reputation)
8. [Crime System & Bounty Hunting](#8-crime-system--bounty-hunting)
9. [NPC & Location Integration](#9-npc--location-integration)
10. [Implementation Notes](#10-implementation-notes)
11. [Production Pipeline](#11-production-pipeline)

---

## 1. Philosophy

### Quests Are the World, Not Tasks

In most modpacks, quests are a sidebar — a checklist that hands out items to nudge progression. In Project Horizons, **quests ARE how the world tells its story**. Every quest is given by an NPC who lives somewhere, with a reason for asking. Every reward changes something. Every choice closes some doors and opens others.

**Three rules every quest follows:**

1. **A quest comes from a place.** Every quest is given by an NPC at a specific location, with a reason that fits their character and circumstances. No "mysterious quest book pings."
2. **A quest changes something.** Completing a quest moves the world forward — a village grows, a road opens, an NPC remembers you, a faction's opinion shifts. The world is not a set dressing.
3. **A quest is optional except when it isn't.** Most quests can be skipped. The few that can't are the ones that mark transitions between Acts. Even then, there are usually 2-3 ways to satisfy the requirement.

### Infinite Paths

The phrase "infinite paths" doesn't mean literally infinite. It means the quest architecture is designed so that **no two playthroughs feel identical**. This is achieved by:

- **10 side quest chains** the player can pursue in any order, depth, or combination
- **14 mod tutorial chapters** that double as gameplay introductions
- **5 endings** with different prerequisites and lead-up arcs
- **Reputation system** with 6 factions creating different access
- **Crime/honest fork** opening an entire alternative lifestyle
- **Branching choices** in main quest that change downstream quests
- **NG+ system** that lets you replay with a different ending in mind
- **Game Stages** that lock content based on prior choices, not just progression

A combat-focused dungeon-runner with neutral faction relations and a Vanguard build will see a wildly different game than a peaceful Cultivator-vintner who befriended the Coastal Kingdom and never set foot in a Gate.

### Quests Are Curriculum

Many of the mod tutorial chapters double as quests. This serves two purposes:

- New players learn complex mods through guided steps with narrative wrapper
- Quest rewards make learning *worth doing*, instead of "watch a YouTube tutorial"

Every major mod gets a "Surface" tutorial chapter (4-6 quests) and a "Deep" tutorial chapter (4-8 quests). Surface teaches the basics. Deep teaches mastery within the Horizons context.

---

## 2. Quest Architecture

### Mod Stack

The questing system runs on:

- **FTB Quests (NeoForge)** — quest definition, dependency trees, rewards
- **FTB Library** — shared infrastructure
- **FTB XMod Compat** — KubeJS / Game Stages / Item Filters bridge *(new dependency)*
- **KubeJS** — custom quest events, conditions, reward handlers
- **Game Stages** — gating content behind progression and choices
- **Custom NPCs Unofficial** — quest givers, dialogue trees, story characters
- **Easy NPC** — ambient NPCs for quest contexts
- **Radical Cobblemon Trainers** — wandering trainer encounters tied to quests

### Quest Types

FTB Quests supports several task types we'll use heavily:

| Task Type | Used For |
|---|---|
| **Item Task** | Collect/deliver items (most common) |
| **Kill Task** | Defeat mobs (gym battles, Gate bosses) |
| **Location Task** | Reach specific coordinates (travel quests) |
| **Stat Task** | Reach a stat threshold (level, XP, kills) |
| **Custom Task (KubeJS)** | Anything else — speak to NPC X, defeat trainer Y, complete dungeon floor Z, win a Cobblemon battle, brew a Legendary wine, etc. |

We will lean heavily on **Custom Tasks via KubeJS** because they let us hook into anything in the modpack — Cobblemon events, MineColonies milestones, Custom NPC interactions, crime stat changes.

### Quest Reward Types

Standard FTB Quest rewards plus custom KubeJS handlers:

- **Item rewards** — gear, currency, materials
- **Command rewards** — spawn structures, advance NPC dialogue, trigger events
- **Custom rewards (KubeJS)** — perk points, kingdom currency, Game Stage unlocks, NPC reputation, crime stat changes, faction allegiance shifts, Precursor Tokens
- **Loot table rewards** — randomized drops from a defined pool
- **Quest book unlocks** — opening new chapters or side chains

### Quest Visibility Rules

Quests are not always visible. Visibility depends on:

- **Game Stages** — `horizons:act_2_unlocked` makes Act 2 visible
- **NPC interactions** — talking to a specific NPC unlocks their quest line
- **Discovery** — reaching a location unlocks quests tied to that location
- **Reputation thresholds** — high reputation with a faction unlocks elite quests
- **Faction allegiance** — quests can be hidden from rival factions
- **Crime stat** — outlaw quests appear at Crime Stat 2+, lawful quests hide

This means the quest book is **never overwhelming**. Players see what's relevant to where they are and who they've befriended.

### Quest Chapter Structure

Quests are organized into chapters in the FTB Quests book:

```
Chapter 0: Welcome to Horizons (mandatory tutorial wrapper)
Chapter 1: Act 1 — Arrival
Chapter 2: Act 2 — The First Steps
Chapter 3: Act 3 — The Wider World
Chapter 4: Act 4 — The Stars
Chapter 5: Act 5 — Convergence
Chapter 6: Endings (5 sub-chapters, one per ending path)

Side Chains:
Chapter S1: Cobblemon Mastery
Chapter S2: Merchant Prince
Chapter S3: Master Crafter
Chapter S4: Cartographer
Chapter S5: Lorekeeper
Chapter S6: Cultivator's Path
Chapter S7: Colony Builder
Chapter S8: The Trainer's Way
Chapter S9: The Bounty Hunter
Chapter S10: The Outlaw

Mod Tutorial Chapters:
Chapter T1: Create Basics → Deep
Chapter T2: Cobblemon Basics → Mastery
Chapter T3: Stellaris Space Basics
Chapter T4: MineColonies Colony Basics → Management
Chapter T5: Brewing & Cooking
Chapter T6: Tough As Nails Survival
Chapter T7: FTB Chunks & Teams
Chapter T8: Lightman's Currency Economy
Chapter T9: Better Combat & Magic
Chapter T10: Farming & Cultivator Tools
Chapter T11: Immersive Engineering
Chapter T12: Applied Energistics 2
Chapter T13: Iron's Spells
Chapter T14: Curios & Equipment
```

That's roughly 30 chapters total. Most players will encounter 12-18 of them in any given playthrough.

---

## 3. The Main Quest

The 5-act story arc. ~80 quests total. Estimated 120-180 hours of play if a player focuses primarily on the main quest with light side activity.

### Act 1 — Arrival (Hours 0-15)

**Theme:** Awakening to a world that's been waiting

**Setting:** The shores of Aetheria, the Plains Kingdom, Anchor Town

**Player goal:** Survive your first days, orient yourself, choose your initial path

**Key NPCs:** Sera (welcoming guide), Town Crier Petra, Guild Master Aren, Master Vex (Vanguard), Master Lyra (Artificer), Master Tomo (Cultivator)

#### Main Quests

| # | Title | Giver | Tasks | Reward |
|---|---|---|---|---|
| A1.01 | **First Light** | Sera (auto) | Eat, drink, sleep one night | Wooden tools, starter rations, 50 Plains Crowns |
| A1.02 | **Roots in the Earth** | Sera | Plant 3 wheat, harvest 1 | Iron Hoe, 1 Cultivator perk point |
| A1.03 | **Wandering Souls** | Sera | Encounter 3 wild Cobblemon *(or alt: find 3 Precursor Fragments)* | Poké Ball ×5 *(or Precursor Compass)* |
| A1.04 | **The Path to Anchor Town** | Sera | Travel 500 blocks toward Anchor Town | Map of Aetheria, 100 Plains Crowns |
| A1.05 | **The Town Crier's Welcome** | Petra (Anchor Town) | Speak to Petra in the town square | Anchor Town residency badge (Curio) |
| A1.06 | **The Guild Hall** | Petra | Meet Guild Master Aren | Guild Membership Card |
| A1.07 | **Choose Your Path** ⚡ | Guild Master Aren | Speak to one of three Path Mentors | **Branching point** — class-specific kit + first perk point |
| A1.08 | **The Mentor's Test** | Selected Mentor | Complete a class-specific challenge | Pathfinder XP, Tier 1 class gear |
| A1.09 | **A Place to Call Home** | Petra | Build a shelter within 1km of Anchor Town | Foundation Stone (decorative landmark), home waypoint |
| A1.10 | **The Old Map** | Master Lyra | Collect 5 paper, craft a map | Wider area unlocked, 200 Plains Crowns |
| A1.11 | **First Trial** | Master Vex | Defeat the Cave Spider Matron in the nearby cave system | Iron sword variant, +50 Vanguard XP |
| A1.12 | **The Stranger at the Gate** | Mysterious Stranger (random encounter) | Speak with the stranger | Precursor Fragment, lore entry |
| A1.13 | **Whispers of Precursors** | Guild Master Aren | Bring the Precursor Fragment to Aren | Precursor Lorebook (Vol. I), Game Stage `act_1_complete` |

**Act 1 Climax:** Aren reveals that Aetheria was built by a vanished people called the Precursors, and that strange forces are stirring. He invites you to follow a deeper path. Game Stage `act_2_unlocked` activates.

#### Branching Note

**A1.07 "Choose Your Path"** is the first major branch. The choice influences:

- **Vanguard:** Unlocks combat tutorial chapter and Cobblemon Mastery side chain hint
- **Artificer:** Unlocks Create Basics chapter and Master Crafter side chain hint
- **Cultivator:** Unlocks Farming & Cultivator Tools chapter and Cultivator's Path hint

**The choice is not permanent.** Players can later invest in other perk trees. But their starter kit and the first NPC they bond with reflects this initial choice — and that NPC remembers being chosen first.

---

### Act 2 — The First Steps (Hours 15-50)

**Theme:** Discovering paths in the wider world

**Setting:** Wider Plains Kingdom, first Gate, Willowmere village

**Player goal:** Find your place in the world's systems, taste each major pillar

**Key NPCs:** Aren, the three Path Mentors, Vintner Mara (Willowmere), Trainer Kira (wandering), Mayor Theron (Willowmere), Brock (gym leader, Cobblemon path)

#### Main Quests

| # | Title | Giver | Tasks | Reward |
|---|---|---|---|---|
| A2.01 | **The Three Paths Diverge** | Aren | Hub quest — choose 1+ of three threads to pursue | Quest book chapter unlocks |
| A2.02 | **The First Gate** | Aren | Find the Gate Entrance Portal east of Anchor Town | Gate location waypoint |
| A2.03 | **Threshold Trial** | Aren | Descend to Floor 5 and return | First dungeon loot, +1 perk point |
| A2.04 | **Echoes Below** | Aren | Reach Floor 10 | Tier 2 gear, Precursor Fragment ×2 |
| A2.05 | **The First Boss** ⚡ | Aren | Defeat the Floor 10 Boss: **The Stoneheart Sentinel** | Ancient Core, Game Stage `gate_initiate` |
| A2.06 | **Word from Willowmere** | Petra | Travel to the village of Willowmere (1.5km) | Travel rations, Willowmere waypoint |
| A2.07 | **The Vintner's Apprentice** | Vintner Mara | Help Mara press grapes for one MC day | First Wine Bottle, brewing tutorial unlock |
| A2.08 | **A Friend Made** | Mayor Theron | Hire your first MineColonies Builder | Builder hut blueprint, MineColonies tutorial unlock |
| A2.09 | **The Trainer's Welcome** | Trainer Kira (random) | Battle Trainer Kira and her Eevee | Trainer Card, RCT integration unlock |
| A2.10 | **Brock's Challenge** *(Cobblemon path)* | Brock (Pewter equivalent) | Defeat Brock with a 3-Pokémon team | Boulder Badge, +1 Cobblemon level cap |
| A2.11 | **The Old Mine** | Master Lyra | Reach the abandoned mine 800 blocks south, recover Create blueprints | Create Andesite Alloy ×16, Create tutorial unlock |
| A2.12 | **The Caravan Job** | Mayor Theron | Set up your first Create train route between Anchor Town and Willowmere | Train schedule, Caravan Charter (item) |
| A2.13 | **Reading the Stars** | Master Lyra | Craft a Spyglass and observe the night sky from a hilltop | Star Chart fragment, Stellaris hint |
| A2.14 | **The Wandering Scholar** | Mysterious Stranger | Find the wandering scholar in the forest north | Precursor Lorebook (Vol. II) |
| A2.15 | **Choosing a Faction** ⚡ | Aren | Declare your initial faction allegiance | **Branching point** — first faction reputation lock |

**Act 2 Climax:** The world begins to feel real. You have a Gate cleared, a friend made, a trade route running, and a chosen faction. Aren tells you the deeper Gates and the wider kingdoms await. Game Stage `act_3_unlocked` activates.

#### Branching Note

**A2.15 "Choosing a Faction"** introduces the 6 factions:

- 🌾 **Plains Kingdom** — your starting faction, agricultural and trade-focused
- 🌲 **Forest Coalition** — druids, herbalists, Cobblemon-friendly
- 🏔️ **Mountain Forge** — Create-focused engineers, Master Crafter friendly
- 🏝️ **Coastal Republic** — merchants, sailors, economy-focused
- 🌌 **Skyborn Order** — a secretive faction interested in the Precursors and space
- ⚖️ **The Free Wanderers** — non-aligned, lone wolves, outlaw-friendly

You can have **positive standing with multiple factions** but only **one allegiance** at a time. Allegiance gates a few quests and a few NPC relationships, but doesn't lock you out of the others entirely.

---

### Act 3 — The Wider World (Hours 50-100)

**Theme:** Mastery, consequence, and politics

**Setting:** All 6 factions' major settlements, Gate floors 11-25, Sea of Grain, Hidden Library

**Player goal:** Become a known figure with real political weight

**Key NPCs:** Faction leaders, the Voice in the Stone, Famous Villagers, the Master of Each Path, the Bounty Master

#### Main Quests (selected highlights)

| # | Title | Giver | Tasks | Reward |
|---|---|---|---|---|
| A3.01 | **The Bounty Board** | Town Crier Petra | Inspect the Bounty Board at the Guild Hall (intro to crime system) | Bounty Hunter's License |
| A3.02 | **The Mayor's Plea** | Mayor Theron | A neighboring kingdom is encroaching — bring supplies | Plains Kingdom +200 reputation |
| A3.03 | **The Counter-Petition** | Mountain Forge envoy | The other side of the dispute — hear them out | Choice unlocks |
| A3.04 | **The Diplomatic Choice** ⚡ | Aren | Choose to side with one of the disputants, broker peace, or ignore | **Major branching point** |
| A3.05 | **Deeper into Darkness** | Aren | Reach Gate Floor 20 | Tier 3 gear, Precursor Tokens ×5 |
| A3.06 | **The Shifted Floor** | Aren | Survive an Outdoor Floor (Floors 11-25 band) | Surreal Compass (cosmetic Curio) |
| A3.07 | **The Voice in the Stone** | Voice in the Stone (lore NPC) | Bring the Stone Egg to the Hidden Library | Precursor Lorebook (Vol. III) |
| A3.08 | **A Famous Reputation** | Sera (returning) | Reach Famous Villager status with 3+ NPCs | Title: "Known Wanderer," reputation perk |
| A3.09 | **The Master's Test** | Class Mentor | Complete a class capstone trial | Tier 5 class gear, capstone perk |
| A3.10 | **The Sea of Grain** | Vintner Mara | Establish a 64-tile farm with 8+ crop types | Cultivator capstone unlock, Greenhouse Frame |
| A3.11 | **Three Kingdoms Meeting** | Aren | Attend the kingdoms council at the Sky Cathedral | Diplomatic standing in 3 factions |
| A3.12 | **The First Treaty** | Faction leaders | Choose to broker, betray, or witness the treaty | Faction reputation cascades |
| A3.13 | **The Hidden Library** | Voice in the Stone | Locate and enter the Library | Precursor Blueprints ×3 |
| A3.14 | **The Sky Above** | Master Lyra | Build a primitive observation telescope | Stellaris dimension hint |
| A3.15 | **Building the Foundation** | Master Lyra | Craft your first rocket frame | Stellaris questline unlock |
| A3.16 | **The Forge Awaits** | Mountain Forge envoy | Visit the Mountain Forge and meet the High Smith | Heat-resistant Alloy ×8 |

**Act 3 Climax:** You stand on the launchpad with a working rocket. The factions know your name. Your choices have rewritten the political map. Game Stage `act_4_unlocked` activates.

---

### Act 4 — The Stars (Hours 100-150)

**Theme:** The truth above

**Setting:** Moon, Mars, Europa, Titan, The Forge, Elysium, the Sky Archive (End)

**Player goal:** Discover what really happened to the Precursors, and meet the Watchers

**Key NPCs:** The Watcher (mysterious cosmic figure), Skyborn Order operatives, Ancient Cobblemon manifestations

#### Main Quests (highlights)

| # | Title | Giver | Tasks | Reward |
|---|---|---|---|---|
| A4.01 | **First Launch** | Master Lyra | Successfully launch and return from the Moon | Lunar Sample, Moonstone ×4 |
| A4.02 | **The Moon's Surface** | Skyborn Operative | Encounter and document 5 Lunar Cobblemon variants | Moon Outpost blueprint |
| A4.03 | **The Watching Eye** | Mysterious voice | Find the strange obelisk on the dark side of the Moon | First Watcher dialogue |
| A4.04 | **The Mars Settlement** | Skyborn Operative | Establish a base on Mars | Mars Outpost blueprint, Red Dust ×16 |
| A4.05 | **Deep Echo** | Aren (via comms) | Reach Gate Floor 35 | Tier 4 gear, Precursor Core (1 of 7) |
| A4.06 | **The Drowning World** | Skyborn Operative | Explore Europa's subsurface ocean | Cryo-Adapted Cobblemon spawn unlock |
| A4.07 | **The Methane Mystery** | Skyborn Operative | Solve the puzzle of the Titan crystals | Methane Catalyst, Precursor Core (2 of 7) |
| A4.08 | **The Forge of Souls** | Mountain Forge High Smith | Survive on the volcanic asteroid for 1 MC day | Soulforge Hammer (legendary tool) |
| A4.09 | **The Garden in the Void** | Vintner Mara (via comms) | Plant a seed on Elysium | Eternal Bloom (cosmetic), Cultivator capstone bonus |
| A4.10 | **Voices Across the Void** | Voice in the Stone | Decode the Precursor signal at the Sky Cathedral | Precursor Lorebook (Vol. IV) |
| A4.11 | **The Sky Archive Approaches** | Skyborn Order | Travel to The Archive (overhauled End) | End dimension entry |
| A4.12 | **The Watcher's Question** ⚡ | The Watcher | Answer their question | **Major branching point — affects ending eligibility** |
| A4.13 | **The Ancient Form** | Voice in the Stone | Encounter your first Ancient Cobblemon (Floor 76+) | Ancient Token (currency) |
| A4.14 | **The Truth of the Fall** | The Watcher | Witness the Memory of the Precursors | Precursor Lorebook (Vol. V — final) |
| A4.15 | **The Convergence Begins** | Aren | Return to Aetheria, all factions are gathering | Game Stage `act_5_unlocked` |

**Act 4 Climax:** You know what happened to the Precursors. You've met the Watchers. The Watchers have asked you something. The world is at an inflection point. Time to choose what kind of legacy you'll leave.

#### Branching Note

**A4.12 "The Watcher's Question"** is the most important choice in the game. Five possible answers, each pointing toward one of the five endings:

- *"I want to rebuild what was lost."* → **Restoration** path
- *"I want to leave and find what's beyond."* → **Pilgrim** path
- *"I want to protect what remains."* → **Steward** path
- *"I want to become part of this world's nature."* → **Awakened** path
- *"I want to build something new of my own."* → **Architect** path

The choice doesn't lock you in immediately — Act 5 is structured so the player can explore other endings before committing. But it does set Game Stage `ending_intent_X` which unlocks that ending's preliminary quests.

---

### Act 5 — Convergence (Hours 150-200+)

**Theme:** Choosing what kind of legacy

**Setting:** All five potential ending locales

**Player goal:** Make the choice that defines your world

**Key NPCs:** The Watcher, the entire cast (returning for farewells), the leaders of each faction

#### Pre-Ending Quests (shared across all paths)

| # | Title | Giver | Tasks | Reward |
|---|---|---|---|---|
| A5.01 | **The Final Trial** | Aren | Reach Gate Floor 75 | Tier 6 gear, Precursor Core (3 of 7) |
| A5.02 | **The Council of Kingdoms** | Sera (returning) | Speak with all 6 faction leaders | Diplomatic capstone, all faction reputation +500 |
| A5.03 | **The Gathering Storm** | The Watcher | Investigate the cosmic disturbance | Cosmic Resonance Crystal |
| A5.04 | **The Watchers' Decision** | The Watcher | The Watchers reveal the cost of each ending | All 5 ending paths unlock as quest sub-chapters |
| A5.05 | **The Five Paths** | Sera | Final quest hub — choose to commit to a path | Ending sub-chapter activates |

After A5.05, the player commits to a single ending path (4-6 quests each, detailed in the Endings section).

---

## 4. The Five Endings

Each ending is a distinct sub-chapter with its own questline and final reward. Choosing an ending **does not lock the world** — after completing an ending, the player enters NG+ mode and can pursue another ending in the same world while keeping their progression.

### Ending 1: The Restoration

**Concept:** Rebuild the Precursor civilization. You become the founder of a new age.

**Path:**
- **R.1 The Seven Cores** — Gather all 7 Precursor Cores (some from Gates, some from planets, some from Watchers)
- **R.2 Activate the Sky Archive** — Bring the Cores to The Archive
- **R.3 The Awakening Ceremony** — Lead the activation ritual at the Sky Cathedral
- **R.4 The First New Day** — Witness the rebirth (cinematic via cutscene cue + custom NPC dialogue)
- **R.5 Lead the Restoration** — Become the named Founder of the new Precursor era

**Reward:** Title "Founder of the New Age" · Restoration Crown (cosmetic Curio) · Sky Archive becomes a permanent base · NG+ unlocks with 50% bonus XP

**World effect:** The Sky Archive lights up permanently visible in the End sky from anywhere on Aetheria. Other players see your name when they visit.

---

### Ending 2: The Pilgrim

**Concept:** Leave Aetheria entirely. Sail beyond the stars to whatever lies past.

**Path:**
- **P.1 The Pilgrim's Ship** — Build the Pilgrim's Vessel (massive endgame Stellaris construction)
- **P.2 Final Words** — Visit every Famous Villager and say farewell (creates lasting NPC memory)
- **P.3 The Last Sunrise** — Witness one final dawn from your starting location
- **P.4 Cross the Veil** — Launch through the Edge of the Map dimension

**Reward:** Title "Pilgrim of the Far Stars" · Your name etched onto a star map block placed in every Sky Cathedral · NG+ unlocks with permanent travel speed bonus

**World effect:** Star map blocks appear in every cathedral with your name. Other players see them and learn the legend.

---

### Ending 3: The Steward

**Concept:** Protect Aetheria from external threats. Become its eternal guardian.

**Path:**
- **S.1 Found the Order of Stewards** — Recruit 5 NPCs as your initial Order members
- **S.2 The Outer Threat** — Defeat the Cosmic Anomaly that has been hinted at (massive boss encounter)
- **S.3 Establish the Watch** — Build the Steward's Citadel at a strategic location
- **S.4 Eternal Vigil** — Take the Steward's Oath at the citadel

**Reward:** Title "Steward of Aetheria" · Permanent +20% defensive stats · Steward's Citadel becomes a player-owned monument · NG+ unlocks with all defensive perks free

**World effect:** Steward's Citadel becomes a real protective building. NPCs from all factions occasionally pilgrimage there.

---

### Ending 4: The Awakened

**Concept:** Merge with the Cobblemon ecosystem. Become something new — neither fully human nor fully Pokémon, but a bridge.

**Path:**
- **A.1 Bond with All Eight Soulbound** — Reach Soulbound trust tier with 8 different Pokémon species
- **A.2 The Garden of First Light** — Find the hidden Garden dimension (deep Gate floors 90+)
- **A.3 The Bridge Between** — Undergo the Awakening Ritual with all 8 Soulbound present
- **A.4 The New Form** — Receive the Awakened transformation (cosmetic + permanent ability)

**Reward:** Title "The Awakened" · Permanent visible aura · Cobblemon companions follow you into all dimensions · NG+ unlocks with massively boosted Trust gain

**World effect:** The Garden dimension stays unlocked for all players who reach it after you. Your name appears as the first to walk it.

---

### Ending 5: The Architect

**Concept:** Build your own kingdom that surpasses the others. Become a peer to the Plains King and the Forge Master.

**Path:**
- **AR.1 Found the Capital** — Establish a player-built capital city (must meet structural and population requirements)
- **AR.2 Establish 5 Outposts** — Build outposts in 5 different biomes
- **AR.3 The Crown Vote** — Convince 3 of 6 factions to recognize your kingdom
- **AR.4 The Coronation** — Hold the coronation ceremony
- **AR.5 The Founder's Legacy** — Mint your own currency, write your kingdom's first laws

**Reward:** Title "Architect-King of [Kingdom Name]" · Your kingdom permanently appears on the world map · You can mint custom currency · NPCs occasionally pay tribute · NG+ unlocks with kingdom prosperity bonus

**World effect:** Your kingdom is a real, named, persistent place on the server. Other players visit it. Future playthroughs can encounter your kingdom as an established faction.

---

### NG+ Behavior

After completing any ending, the player enters New Game Plus:

- Keeps all gear, perk levels, Pokémon, and reputation
- Can replay any chapter for additional rewards
- Can pursue a different ending in the same world
- Gains a small cosmetic indicator showing how many endings they've completed
- Players who complete all 5 endings unlock the secret **"Walker of All Paths"** title and a unique item: the **Compass of Convergence**

---

## 5. Side Quest Webs

10 side chains, ~20-30 quests each, organized as woven webs (not strict linear progression). Players can pursue any in any order. Each chain has its own story arc that intersects the main quest at multiple points.

### S1: Cobblemon Mastery

**Theme:** The trainer's path — from first catch to Champion

**Hub NPC:** Trainer Kira (later: regional Gym Leaders)

**Arc:** Catch your first Pokémon → defeat 8 Gym Leaders → defeat the Elite Four → challenge the Champion

**Quest count:** ~30 quests

**Highlights:**
- 8 Gym Leader battles tied to specific town locations
- Elite Four arc unlocked after 8th badge
- Champion is a Famous Villager with a 6-Pokémon legendary team
- Side rewards: TMs, rare Pokémon, badges as Curio items
- Final reward: Title "Champion of Aetheria," unique Pokémon-themed gear set
- **Branching:** Can pursue Trainer Kira's friendship arc for romance/friendship subplot

---

### S2: Merchant Prince

**Theme:** Master the economy — become the richest figure in Aetheria

**Hub NPC:** Merchant Caelus (Coastal Republic)

**Arc:** First sale → trade route established → multi-kingdom merchant → economic baron

**Quest count:** ~20 quests

**Highlights:**
- Establish trade routes between all 6 factions
- Achieve net worth thresholds (10k, 100k, 1M Plains Crowns equivalent)
- Corner the market on a specific commodity (your choice: wine, ore, crops, art)
- Dynamic price fluctuation system rewards market awareness
- Final reward: Title "Merchant Prince," unique economy-boosting gear

---

### S3: Master Crafter

**Theme:** Create + IE mastery — automate the impossible

**Hub NPC:** Master Lyra (Artificer mentor)

**Arc:** First automation → Create train empire → fully automated factory → Precursor-tier engineering

**Quest count:** ~25 quests

**Highlights:**
- Tutorial chapter for Create progression
- Build a 10-machine automated factory
- Operate 5 simultaneous Create train routes
- Craft Precursor-tier Create components
- Final reward: Title "Master of the Forge," unique Brass Engineer gear set

---

### S4: Cartographer

**Theme:** See it all — explore every corner of Aetheria and beyond

**Hub NPC:** Wandering Scholar Vael

**Arc:** First map → discover all 6 factions → explore all planets → reach all custom dimensions

**Quest count:** ~15 quests

**Highlights:**
- Discover all 6 faction capitals
- Visit all custom planets
- Reach The Between, The Deep, and the Sky Archive
- Document 50+ named locations
- Final reward: Title "Walker of All Lands," unique map item that always shows your discoveries

---

### S5: Lorekeeper

**Theme:** Uncover the Precursor mystery — the deepest lore path

**Hub NPC:** Voice in the Stone

**Arc:** First Lorebook → all 5 volumes → unique lore-only encounters → secret final ending boss

**Quest count:** ~20 quests

**Highlights:**
- Find all 5 Precursor Lorebook volumes
- Decode all 13 Precursor language fragments
- Encounter the secret Lorekeeper Boss in the Hidden Library
- Unlock the Precursor Memory Hall (visitable by anyone after completion)
- Final reward: Title "Keeper of the Lost Voice," unique cosmetic effect, unlocks bonus Restoration ending content

---

### S6: Cultivator's Path

**Theme:** Farming, brewing, peaceful mastery

**Hub NPC:** Master Tomo (Cultivator mentor) → Vintner Mara

**Arc:** First harvest → first wine → Legendary vintage → Verdant Soul capstone

**Quest count:** ~30 quests

**Highlights:**
- Tutorial chapter for the deep farming system
- Brew Table, Fine, Grand Cru, and Legendary wines
- Reach Balanced Diet, then Gourmet nutrition state
- Bond with a Bulbasaur as a Soulbound farming partner
- Found a vineyard estate that becomes a Famous Location
- Final reward: Title "Verdant Soul," Heartwood Hoe, Eternal Garden cosmetic

---

### S7: Colony Builder

**Theme:** Master MineColonies — build a player-owned manor that becomes legendary

**Hub NPC:** Mayor Theron → expanded MineColonies questline

**Arc:** First worker hired → 5-worker colony → multi-colony empire → Player Kingdom recognition

**Quest count:** ~20 quests

**Highlights:**
- Hire your first MineColonies worker
- Pair workers with Cobblemon partners (ties into Cobblemon system)
- Reach colony tier thresholds
- Operate 3 colonies in different biomes
- Final reward: Title "Lord/Lady of [Manor Name]," unique manor schematic

---

### S8: The Trainer's Way

**Theme:** Defeat all Radical Cobblemon Trainers — the wandering challenge path

**Hub NPC:** None (RCT generates trainers automatically)

**Arc:** Defeat 10 trainers → 50 → 100 → 500 → 1000 → all 1500+

**Quest count:** ~15 quests (milestone-based)

**Highlights:**
- Each milestone grants reputation with the Free Wanderers faction
- Unique trainer-rewarded items (TMs, rare Pokéballs, themed badges)
- "First to defeat" entries in a server-wide leaderboard
- Final reward: Title "Trainer of the Endless Road," Pokéball with cosmetic effect

---

### S9: The Bounty Hunter *(new)*

**Theme:** Hunt criminals across Aetheria — lawful path through the crime system

**Hub NPC:** Bounty Master Lockhart

**Arc:** First bounty accepted → first capture → reputation as a hunter → legendary bounties

**Quest count:** ~20 quests

**Highlights:**
- Tutorial for the Bounty Board system
- Capture criminals at increasing Crime Stat tiers (1 → 5)
- Choice: bring them in alive (Pokémon Duel capture) or dead (PvP)
- Hunt named legendary outlaws (NPC bosses)
- Final reward: Title "The Iron Hand," unique Bounty Hunter gear, kingdom-wide reputation boost

*See [Section 8: Crime System & Bounty Hunting](#8-crime-system--bounty-hunting) for full mechanics.*

---

### S10: The Outlaw *(new)*

**Theme:** Embrace crime — the pirate king path

**Hub NPC:** Whisper (mysterious outlaw recruiter)

**Arc:** First crime committed → first hideout → criminal empire → outlaw legend

**Quest count:** ~20 quests

**Highlights:**
- Tutorial for stealth and crime mechanics
- Build a Hideout (off-grid base unaffiliated with kingdoms)
- Smuggle goods across kingdom borders
- Found an Outlaw Crew (player-led faction within Free Wanderers)
- Successfully evade bounty hunters for 7 MC days at Crime Stat 5
- Final reward: Title "The Whispered One," outlaw cloak (cosmetic), reputation reset option

**Mutually exclusive with parts of the Bounty Hunter chain** — but you can swap paths via reputation reset (at significant cost).

---

## 6. Mod Tutorial Chapters

14 chapters teaching the major mods. Each chapter has a **Surface tier** (basics) and a **Deep tier** (mastery). Surface tutorials are unlocked early; Deep tutorials unlock after the player demonstrates basic competency.

### T1: Create — Basics & Deep

**Surface (4 quests):** Andesite Alloy → first Mechanical Press → first water wheel → first contraption

**Deep (6 quests):** Train networks → fluid processing → Mechanical Crafter automation → Precursor-tier components

---

### T2: Cobblemon — Basics, Battles, Breeding

**Surface (5 quests):** Catch first Pokémon → first battle → first evolution → first heal at PC

**Mastery — Battles (5 quests):** Type effectiveness → status moves → strategic switching → Gym battle prep → first 6-Pokémon team

**Mastery — Breeding (4 quests):** First Day Care interaction → IV understanding → egg moves → competitive offspring

---

### T3: Stellaris Space Basics

**Surface (5 quests):** First rocket → suit up with oxygen → land on Moon → return safely → use space station

**Deep (6 quests):** Mars colony → Europa subsurface → Titan exploration → custom planet exploration → space station construction → orbital mechanics intro

---

### T4: MineColonies — Basics & Management

**Surface (5 quests):** Place Town Hall → hire first Builder → upgrade first hut → first worker payday → first quest from a colonist

**Deep (8 quests):** 5-worker colony → Pokémon-pairing for efficiency → multi-colony management → colony defense (Guard Villagers) → colony food production chain → automated tax collection → colony reputation → kingdom recognition

---

### T5: Brewing & Cooking

**Surface (4 quests):** Cooking Pot meal → bread baking → beer fermentation → wine pressing

**Deep (6 quests):** Quality tier system → soil quality affects flavor → brewing aging cellar → Legendary vintage attempt → restaurant/tavern building → selling food at premium

---

### T6: Tough As Nails Survival

**Surface (4 quests):** Fill canteen → boil water → eat to combat thirst → manage temperature

**Deep (4 quests):** Water purifier construction → climatology → desert/cold biome adaptation → space dehydration management

---

### T7: FTB Chunks & Teams

**Surface (3 quests):** Claim first chunk → form a team → invite another player

**Deep (3 quests):** Team chunk sharing → ally/enemy declarations → cross-team trade

---

### T8: Lightman's Currency Economy

**Surface (4 quests):** First coin earned → first ATM use → buy from NPC shop → set up own player shop

**Deep (6 quests):** Multi-currency exchange → trade terminal automation → player bank → kingdom currency management → fluid/energy trading

---

### T9: Better Combat & Magic

**Surface (4 quests):** Equip dual wield → first dodge roll → first weapon combo → first magic spell

**Deep (5 quests):** Master a weapon class → spell schools → combo attacks → boss strategies → magic-melee hybrid build

---

### T10: Farming & Cultivator Tools

**Surface (4 quests):** Till field → plant variety of crops → use Iron Hoe → first compost

**Deep (6 quests):** Soil quality awareness → crop rotation → tiered tool progression → Greenhouse construction → Heartwood Hoe quest → Verdant Soul capstone

---

### T11: Immersive Engineering

**Surface (4 quests):** First Coke Oven → first generator → first wire connection → first machine

**Deep (5 quests):** Multiblock machines → wire networks → fuel processing chain → Precursor power tier

---

### T12: Applied Energistics 2

**Surface (3 quests):** First ME Drive → first storage cell → first crafting terminal

**Deep (4 quests):** Network expansion → autocrafting → channel management → Precursor-integrated network

**Note:** AE2 is gated behind Act 3 to prevent it trivializing early-game storage.

---

### T13: Iron's Spells

**Surface (4 quests):** Find first scroll → cast first spell → equip spell → manage mana

**Deep (4 quests):** Spell school specialization → spellbook crafting → mage build optimization → ultimate spell unlock

---

### T14: Curios & Equipment

**Surface (3 quests):** First Curio item → equip in slot → understand stat effects

**Deep (3 quests):** Curio set bonuses → Artifact mod integration → endgame Curio combinations

---

## 7. Branching, Choices & Reputation

### How Branching Actually Works in FTB Quests

FTB Quests doesn't have native branching, but combined with KubeJS + Game Stages, we achieve full branching via:

1. **Decision quests** with multiple completion paths — each path triggers a different KubeJS reward handler
2. **Game Stage gates** — quests check `player.stages.has('horizons:chose_X')` for visibility
3. **Mutually exclusive quest sub-chapters** — only one of N sub-chapters becomes visible based on player stages
4. **Reputation gates** — quests check faction reputation thresholds for visibility

Example: A2.15 "Choosing a Faction" has 6 possible completions. Each grants a unique Game Stage. Other quests check those stages and become visible/invisible accordingly.

### Faction Reputation System

6 factions tracked via scoreboard, range -1000 to +1000:

| Reputation Level | Range | Effects |
|---|---|---|
| **Hated** | -1000 to -500 | Faction NPCs attack on sight, shops closed, bounties posted |
| **Hostile** | -499 to -100 | NPCs unfriendly, shop prices doubled, no quests offered |
| **Neutral** | -99 to +99 | Default — basic services available |
| **Friendly** | +100 to +499 | NPCs greet you warmly, 10% shop discount, side quests offered |
| **Trusted** | +500 to +999 | Insider quests offered, 25% discount, faction-exclusive gear |
| **Honored** | +1000 | Title and unique cosmetic, ending path bonus |

**Reputation actions:**

- Quest completion (faction-related): +50 to +200
- Trade purchases: +1 per significant transaction
- Helping a faction member: +10 to +50
- Killing a faction NPC: -200
- Theft from faction: -50 to -150
- Aiding rival faction: -25 to -100
- Crime in faction territory: -100 per Crime Stat tier

### Choice Consequences Matrix

The major choice points and what they affect:

| Choice | Where | Affects |
|---|---|---|
| **Initial Class** | A1.07 | Starter gear, first NPC bond, intro tutorial |
| **Cobblemon vs Mechanical** | Throughout | Path A vs Path B for Precursor crafting |
| **Faction Allegiance** | A2.15 | Faction headquarters access, allegiance-locked quests |
| **Diplomatic Choice** | A3.04 | Long-term faction reputation cascades |
| **Treaty Decision** | A3.12 | Permanent kingdom relationship state |
| **Watcher's Question** | A4.12 | Ending intent unlock |
| **Final Path Commitment** | A5.05 | Which ending you actually pursue |
| **Crime vs Lawful** | Ongoing | Bounty Hunter vs Outlaw side chains |

### Reputation-Locked Content

Some content requires high reputation:

- **Faction-exclusive gear** (Trusted+)
- **Kingdom inner sanctums** (Trusted+)
- **Honored-only ending bonus content**
- **Faction Champion quests** (Honored only)
- **Royal court events** (Trusted+)

This ensures players who specialize in factions get tangible rewards beyond just numbers going up.

---

## 8. Crime System & Bounty Hunting

> **The new addition.** A Star Citizen-inspired layer of risk and consequence that turns Project Horizons from "a co-op SMP" into a *real* world where actions have weight. Players can be honest, criminal, vigilante hunters, or anything in between.

### 8.1 Core Concept

Every player has a **Crime Stat** (0-5) tracked server-side. Committing crimes raises it. Crimes are detected by NPC witnesses. High Crime Stat triggers bounty postings that other players can hunt. Capture mechanics include both PvP and a peaceful alternative — challenging the target to a Cobblemon battle.

### 8.2 Crime Stat Tiers

| Tier | Title | How You Got Here | Consequences |
|---|---|---|---|
| **0** | **Clean Citizen** | Default | Full faction access, all shops open |
| **1** | **Petty Offender** | Witnessed petty theft, minor trespassing | Small fine when caught by guards, +1 Crime Stat lasts 1 day |
| **2** | **Wanted** | Witnessed major theft, assault on NPC, repeated petty crime | Bounty appears on local Bounty Boards (50-200 coins), guards in faction territory aggressive |
| **3** | **Felon** | Multiple offenses, NPC murder, or smuggling caught | Bounty raised (200-1000 coins), guards across all friendly factions hostile, trade restricted |
| **4** | **Most Wanted** | Mass murder, kingdom betrayal, or repeated felony | Bounty (1000-5000 coins), all friendly factions hostile, exclusive Outlaw quests unlock, kingdom-wide ban |
| **5** | **World Enemy** | Faction-level crimes, regicide, or persistent Most Wanted | Bounty (5000+ coins), every NPC except Free Wanderers attacks on sight, special hunter NPCs spawn to hunt you |

### 8.3 Crime Types & Detection

| Crime | Detection | Crime Stat Gain |
|---|---|---|
| **Theft from chest** (NPC home, kingdom storage) | NPC vision cone, motion-triggered | +1 |
| **Theft from shop** (Lightman's shop without paying) | Owner detection on transaction failure | +1 |
| **Assault** (attacking peaceful NPC) | Vision cone, screams alert nearby | +1 to +2 |
| **Murder** (killing peaceful NPC) | Vision cone, body discovery | +2 |
| **Trespassing** (entering restricted areas) | Boundary detection | +1 if caught |
| **Smuggling** (carrying forbidden goods through checkpoint) | Checkpoint inspection | +1 to +3 |
| **Sabotage** (destroying kingdom infrastructure) | Block break detection, witness | +2 |
| **Regicide** (killing a faction leader NPC) | Auto-detected | +5 (instant World Enemy) |

**Witness mechanics:**

- Each NPC has a vision cone (90° forward, 16 block range)
- Crimes inside the cone are witnessed
- Witnessed crimes auto-report after 30 seconds, OR when the NPC reaches a Guard NPC, whichever comes first
- Killing the witness within the 30-second window prevents the report — but is itself a crime
- Wearing a **Hood of Shadows** (custom Curio item) reduces vision cone to 8 blocks
- Stealth boots reduce sound detection
- Ghost-type Cobblemon companion: 50% chance to suppress witness report

### 8.4 The Bounty Board System

**Bounty Boards** (custom block) are placed in every Town+ tier settlement. They display:

- Active bounties on players (and NPC criminals)
- Bounty target name, last known location, Crime Stat, reward amount
- Time remaining on the bounty
- Hunter's signup interface

**Posting bounties:**

- Auto-posted by KubeJS when a player reaches Crime Stat 2+
- Bounty amount scales with Crime Stat tier
- Bounty location is the target's last known coordinates (updates daily)
- NPC criminals also appear on boards

**Accepting bounties:**

- Any player (or NPC bounty hunter) can interact with the board to accept
- Accepting grants a **Hunter's Compass** Curio that points toward the target
- Accepting locks the bounty for that hunter for 24 MC hours (preventing griefing)
- After 24 hours, the bounty becomes available to other hunters
- Multiple hunters can pursue the same target — first to capture wins

**Capturing bounties:**

Three legitimate methods:

1. **PvP Capture** — bring target to 0 HP via combat (target respawns at jail dimension)
2. **Cobblemon Duel Capture** — challenge target to a duel; if they accept and lose, peaceful capture
3. **Stealth Capture** — use a **Capture Net** item (consumable, single-use, requires being undetected)

**Bounty rewards:**

- Hunter receives the bounty value in Lightman's Currency
- Hunter gains reputation with the faction that posted the bounty
- Captured player goes to jail (see 8.6)

### 8.5 Cobblemon Duel as PvP Alternative

**The big idea:** Instead of resorting to PvP, players can challenge each other to a Cobblemon battle. Loser pays a wager. Wins respect. Settles disputes peacefully.

**The Duel Challenge item:**

- A throwable challenge token (similar to a glove slap)
- Right-click on a player to challenge them
- The target sees a popup: *"Player X has challenged you to a Cobblemon duel. Wager: Y coins. Accept?"*
- Target can:
  - **Accept** → full Cobblemon battle, loser pays wager
  - **Decline** → no penalty, but the challenger may escalate to PvP
  - **Counter-challenge** → propose a different wager or terms

**For bounty captures specifically:**

- A bounty hunter can issue a Duel Challenge instead of attacking
- If the criminal accepts and loses → peaceful capture, normal jail term
- If the criminal accepts and wins → criminal is freed from this bounty (the hunter has been outwitted)
- If the criminal declines → PvP begins (and the criminal is now also resisting arrest, +1 Crime Stat)

**For non-bounty disputes:**

- Two friendly players can duel for sport or to settle disagreements
- Wagers can be coins, items, or labor (winner gets to assign a 1-hour task to loser)
- Duels create a server-wide notification, drawing spectators
- Duel results logged to a leaderboard

This creates **a peaceful resolution mechanism** for conflicts that would otherwise become PvP battles. Most communities will use this constantly. It's also a great way to draw players together.

### 8.6 Punishment

When captured (by hunter or guards), players go to **Aetheria Penitentiary**, a custom jail dimension.

**Jail mechanics:**

- Player is teleported to Aetheria Penitentiary
- Sentence length scales with Crime Stat tier (5 minutes per tier in real time, capped at 30)
- Player keeps their inventory but is in a restricted area
- Multiple options to reduce sentence:
  - **Pay fine** — Lightman's Currency, scaled to Crime Stat
  - **Work it off** — complete farm tasks in the jail's prison garden (ties into farming system)
  - **Trade information** — give location of an NPC criminal for sentence reduction
  - **Escape attempt** — risky, usually fails, +2 Crime Stat if caught

After release:

- Crime Stat reduced by 1 (not all the way to 0)
- Faction reputation slowly recovers
- Player marked with "Released Convict" status (cosmetic, expires in 7 days)

### 8.7 The Outlaw Path

For players who *embrace* crime, the Outlaw side chain (S10) offers an alternative progression:

- **Outlaw Hideouts** — secret bases that don't appear on faction maps
- **Smuggling Routes** — alternative trade networks for forbidden goods
- **The Whispered Network** — outlaw NPCs who offer dark-market quests
- **Pirate Crews** — players can form Outlaw Crews (alternative to FTB Teams)
- **Outlaw-only gear** — unique equipment crafted from Most Wanted bounties
- **Counter-bounties** — outlaws can post bounties on lawful players who killed their crew members

**Outlaws CAN still complete the main quest** — the questline doesn't lock you out. But your route through it is harder (no friendly faction support) and more interesting (alternative NPCs, hidden quest paths).

### 8.8 NPC Bounty Hunters

To make the system feel alive, **NPC Bounty Hunters** spawn periodically and pursue active bounties:

- Spawn rate scales with the highest active Crime Stat on the server
- NPC Bounty Hunters are tough — Pathfinder Tier 4-5 equivalent
- They use the Cobblemon Duel mechanic by default, only resort to PvP if challenged
- They can be defeated, robbed, or befriended (high Charisma required)
- Famous NPC Bounty Hunters: **The Iron Crow**, **Steelclaw Maven**, **Old Marshal Hattori**

This means even solo players can experience the bounty system — you don't need other players to be hunted.

### 8.9 Crime System Summary Diagram

```
     PLAYER COMMITS CRIME
              ↓
    NPC WITNESS DETECTS?
       /            \
      No             Yes
      ↓               ↓
   No effect      30s window: kill witness?
                       /      \
                     Yes       No
                      ↓         ↓
                  +1 CRIME   REPORT FILED
                  STAT      → +1 to +5 Crime Stat
                              → Bounty Posted (if 2+)
                              → Guards Alerted
                                    ↓
                              HUNTER ACCEPTS?
                              /          \
                          NPC Hunter    Player Hunter
                              ↓            ↓
                          Cobblemon Duel Challenge
                              ↓
                       /              \
                    Accept            Decline
                    /    \              ↓
                 Win    Lose         Forced PvP
                  ↓      ↓              ↓
               Free   Captured ←---- Defeated
                          ↓
                  Aetheria Penitentiary
                          ↓
                  Pay / Work / Escape
                          ↓
                       Released
```

---

## 9. NPC & Location Integration

### Quest-Giver NPCs (key cast)

Beyond ambient NPCs, the quest system uses these named, persistent characters as primary quest givers:

#### Anchor Town
- **Sera** — the welcoming guide; appears in Acts 1, 3, and 5 as the player's mentor figure
- **Town Crier Petra** — gives early travel and reputation quests
- **Guild Master Aren** — main quest giver across all 5 acts
- **Master Vex** (Vanguard Path Mentor) — combat-focused quests
- **Master Lyra** (Artificer Path Mentor) — engineering/Create quests
- **Master Tomo** (Cultivator Path Mentor) — farming/peaceful quests

#### Willowmere
- **Mayor Theron** — kingdom diplomacy and trade
- **Vintner Mara** — brewing and Cultivator quests
- **Innkeeper Brenna** — gathering and hospitality quests

#### The Mountain Forge
- **High Smith Khael** — Create mastery, Stellaris construction
- **Gear Witch Veridia** — magical engineering, Iron's Spells

#### The Coastal Republic
- **Merchant Caelus** — Merchant Prince side chain hub
- **Sailor Taro** — exploration quests, sea routes

#### The Forest Coalition
- **Druid Yshara** — Cobblemon naturalist quests
- **Trainer Kira** — Cobblemon Mastery side chain hub

#### The Skyborn Order
- **Watcher's Voice** — mysterious figure who delivers cosmic quests
- **Operative Marek** — Stellaris and space exploration quests

#### Free Wanderers
- **Wandering Scholar Vael** — Lorekeeper + Cartographer hub
- **Whisper** — Outlaw side chain hub
- **Bounty Master Lockhart** — Bounty Hunter side chain hub

#### The Mysterious
- **Voice in the Stone** — Lorekeeper questline, the Hidden Library
- **The Watcher** — Act 4 cosmic figure, ending choices

That's roughly 20 named NPCs across all factions. Each has:

- A persistent location
- A schedule (when they're available)
- A dialogue tree (Custom NPCs Unofficial)
- A faction allegiance affecting their interactions
- Their own questline

### Quest-Triggered Locations

Quests unlock or reveal these key locations:

- **Anchor Town** — starting hub (Act 1)
- **Willowmere** — first foreign village (Act 2)
- **The First Gate** — first dungeon (Act 2)
- **Mountain Forge** — second faction (Act 2-3)
- **Coastal Republic** — third faction (Act 3)
- **Forest Coalition** — fourth faction (Act 3)
- **Sky Cathedral** — diplomatic center (Act 3)
- **Hidden Library** — Lorekeeper hub (Act 3)
- **Sea of Grain** — large farming biome (Act 3)
- **Moon, Mars, Venus, Europa, Titan, The Forge, Elysium** — planets (Act 4)
- **The Sky Archive** — Skyborn Order base in End (Act 4)
- **The Garden of First Light** — Awakened ending location (Act 5)
- **Aetheria Penitentiary** — jail dimension (crime system)
- **Outlaw Hideouts** — hidden, discoverable via Outlaw chain (any time)

### Location-Based Quest Triggers

Many quests trigger by being in a location, not just by talking to NPCs:

- **Discovery quests** — entering a new biome, finding a structure, reaching coordinates
- **Encounter quests** — random events when crossing roads (wandering trainer, traveling merchant, NPC in distress)
- **Time-of-day quests** — some quests only trigger at night, dawn, or during weather

This makes exploration genuinely rewarding — you find quests by *walking around*, not just by checking the quest book.

---

## 10. Implementation Notes

### Tools

- **FTB Quests in-game editor** — primary tool for writing quests; exports to JSON
- **VS Code with FTB Quests JSON schema** — for batch editing and version control
- **KubeJS** for custom tasks and rewards — single source of truth for complex logic
- **Custom NPCs editor** — for NPC dialogue trees that interface with quests

### Quest File Structure

```
config/ftbquests/quests/
├── chapters/
│   ├── 00_welcome.snbt
│   ├── 01_act1_arrival.snbt
│   ├── 02_act2_first_steps.snbt
│   ├── 03_act3_wider_world.snbt
│   ├── 04_act4_stars.snbt
│   ├── 05_act5_convergence.snbt
│   ├── 06a_ending_restoration.snbt
│   ├── 06b_ending_pilgrim.snbt
│   ├── 06c_ending_steward.snbt
│   ├── 06d_ending_awakened.snbt
│   ├── 06e_ending_architect.snbt
│   ├── s01_cobblemon_mastery.snbt
│   ├── s02_merchant_prince.snbt
│   ... (all side chains)
│   ├── t01_create.snbt
│   ├── t02_cobblemon.snbt
│   ... (all tutorials)
└── reward_tables/
    ├── act1_rewards.snbt
    ├── gate_loot.snbt
    └── faction_gear.snbt
```

### KubeJS Quest Hooks

Custom KubeJS scripts handle quest logic that FTB Quests can't:

```
kubejs/server_scripts/quests/
├── reward_handlers.js          # Custom reward types (perk points, kingdom currency, stages)
├── custom_tasks.js             # NPC interaction tasks, Cobblemon battle tasks
├── branching_logic.js          # Mutually exclusive quest unlocks
├── faction_reputation.js       # Reputation gain/loss from quest completion
└── quest_completion_events.js  # World effects when quests complete
```

### Game Stages Used

```
horizons:act_1_complete
horizons:act_2_complete
horizons:act_3_complete
horizons:act_4_complete
horizons:act_5_complete
horizons:chose_vanguard
horizons:chose_artificer
horizons:chose_cultivator
horizons:faction_plains
horizons:faction_forest
horizons:faction_mountain
horizons:faction_coastal
horizons:faction_skyborn
horizons:faction_wanderer
horizons:gate_initiate
horizons:gate_master
horizons:ending_intent_restoration
horizons:ending_intent_pilgrim
horizons:ending_intent_steward
horizons:ending_intent_awakened
horizons:ending_intent_architect
horizons:ending_complete_restoration
... (one per ending)
horizons:ng_plus
horizons:walker_of_all_paths
horizons:outlaw
horizons:bounty_hunter
horizons:crime_stat_1 .. crime_stat_5
```

### Quest Dependency Patterns

- **Linear** — A → B → C (most main quest progression)
- **Or-gate** — A or B unlocks C (skipping a quest line is valid)
- **And-gate** — A and B both required for C (climactic quests)
- **Stage-gate** — Game Stage X required for visibility (branching)
- **Reputation-gate** — Faction Y reputation ≥ Z (faction-locked content)
- **Anti-stage-gate** — Game Stage X must NOT be present (mutually exclusive paths)

---

## 11. Production Pipeline

### Phase A — Quest Skeleton (Weeks 1-2 of Phase 1)

- Set up FTB Quests + dependencies, verify boot
- Create Chapter 0 (Welcome) with 3 stub quests
- Create Chapter 1 (Act 1) with 5 stub quests, all working end-to-end
- Set up KubeJS reward handler for the first custom reward type (perk point)
- Confirm quest book renders, quest completion fires KubeJS events

### Phase B — Main Quest Build (Weeks 3-5 of Phase 2)

- Build out Chapters 1-3 (Acts 1, 2, 3) with full quest text
- Stub Chapters 4-5 with placeholder quests
- Build the 6 faction reputation system (KubeJS scoreboards)
- Build the first 2 side chains (Cobblemon Mastery, Cultivator's Path)
- Build the first 4 tutorial chapters (Create, Cobblemon, Brewing, Tough As Nails)

### Phase C — World Integration (Weeks 5-8 of Phase 3)

- Build out all 20 named NPC quest givers via Custom NPCs
- Hook NPCs into the quest system (talking to NPC X completes/starts quest Y)
- Place quest-triggered locations in the world (Anchor Town, Willowmere, Mountain Forge)
- Build the Bounty Board block and Crime System foundation
- Build remaining side chains and tutorials (S3-S10, T5-T14)

### Phase D — Endings & Polish (Weeks 8-12 of Phase 4)

- Build Chapters 4-5 (Acts 4 and 5) full
- Build all 5 ending sub-chapters
- Build NG+ logic and the "Walker of All Paths" achievement
- Full crime system implementation (witness scripts, jail dimension, NPC bounty hunters)
- Cobblemon Duel item and challenge mechanic

### Phase E — Quality Pass (Weeks 12-16 of Phase 5)

- Localization keys for all quest text
- Tooltip polish, reward pool tuning
- Quest book UI theming via FancyMenu
- Stress test: 4-8 players running quests in parallel
- Documentation pass for quest writers (so others can contribute later)

### Production Tips

- **Write quests in batches by giver**, not by act. It's faster to write all 12 of Aren's quests in one sitting than to jump between NPCs.
- **Lorebooks first** — write the Precursor lore before writing the quests that reveal it. The lore informs the quest text.
- **Test in a dev save** — never test quest progression in your main world; corrupted quest data is hard to undo.
- **Use placeholder rewards early** — get the quest structure working before tuning the rewards. Rewards are easy to change later.
- **Localize as you go** — adding `lang/en_us.json` keys at quest creation time saves a massive backlog later.

---

## Quest Counts

| Chapter | Quests | Hours |
|---|---:|---:|
| Chapter 0 — Welcome | 3 | 0.5 |
| Chapter 1 — Act 1 Arrival | 13 | 15 |
| Chapter 2 — Act 2 First Steps | 15 | 35 |
| Chapter 3 — Act 3 Wider World | 16 | 50 |
| Chapter 4 — Act 4 The Stars | 15 | 50 |
| Chapter 5 — Act 5 Convergence | 5 + 25 (endings) | 50+ |
| Side Chain — Cobblemon Mastery | 30 | 40 |
| Side Chain — Merchant Prince | 20 | 30 |
| Side Chain — Master Crafter | 25 | 30 |
| Side Chain — Cartographer | 15 | 25 |
| Side Chain — Lorekeeper | 20 | 25 |
| Side Chain — Cultivator's Path | 30 | 50 |
| Side Chain — Colony Builder | 20 | 35 |
| Side Chain — The Trainer's Way | 15 | 30 |
| Side Chain — The Bounty Hunter | 20 | 25 |
| Side Chain — The Outlaw | 20 | 25 |
| Tutorial — Create (S+D) | 10 | 8 |
| Tutorial — Cobblemon (S+D) | 14 | 10 |
| Tutorial — Stellaris | 11 | 8 |
| Tutorial — MineColonies | 13 | 10 |
| Tutorial — Brewing & Cooking | 10 | 6 |
| Tutorial — Tough As Nails | 8 | 4 |
| Tutorial — FTB Chunks/Teams | 6 | 2 |
| Tutorial — Lightman's Currency | 10 | 5 |
| Tutorial — Better Combat & Magic | 9 | 6 |
| Tutorial — Farming & Cultivator | 10 | 8 |
| Tutorial — Immersive Engineering | 9 | 6 |
| Tutorial — Applied Energistics 2 | 7 | 5 |
| Tutorial — Iron's Spells | 8 | 5 |
| Tutorial — Curios & Equipment | 6 | 3 |
| **Total Quests** | **~430** | **~600 hours** if you do everything |

A **focused playthrough** of just the main quest + 1-2 side chains is roughly **120-180 hours**. A **completionist run** is **400-600 hours**.

---

*Quest System v1 — companion to all other Horizons documents*
*FTB Quests + KubeJS + Custom NPCs · Branching · Multi-Ending · Crime System*
*~430 quests · 5 endings · 6 factions · Infinite paths*
