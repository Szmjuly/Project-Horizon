# Project Horizons — Custom Integrations

**The work that makes this pack more than a mod list.**

> Every system marked 🔵 in the server/client mod lists is built here. Most of this is KubeJS + datapacks + resource packs. A small number of things may need actual Java mods.

---

## Overview

Custom work falls into five categories:

| Category | What It Is | Examples |
|---|---|---|
| **KubeJS Server Scripts** | Runtime behavior, recipes, events | Cobblemon world interactions, kingdom economy, Gate floor scaling, crime detection |
| **KubeJS Startup Scripts** | Custom items, blocks, fluids registered at boot | Kingdom currencies, farming tools, crime system items |
| **Datapacks** | Static data — recipes, loot, dimensions, structures | Custom planets, spawn tables, quest trees, jail dimension |
| **Resource Packs** | Textures, models, sounds, UI | Ancient Forms, space skyboxes, custom music, HUD theming |
| **Java Mods** *(if needed)* | Things KubeJS can't do | Complex block rendering, advanced AI, custom dimension gen |

**Reality check:** 90% of this is KubeJS + datapacks. Maybe 1-2 things need actual Java mods. Start with KubeJS and escalate only when blocked.

**Total custom systems: 40.** Grouped by which pillar or system they primarily serve.

---

# 1. KubeJS Server Scripts

Scripts in `kubejs/server_scripts/`. Runtime behavior, events, recipes, system logic.

## Adventure Pillar Systems

### 1.1 Cross-Mod Recipe Bridge

`server_scripts/recipes/cross_mod_bridges.js`

The core recipe integration layer.

- **Rocket Components** — Create pressed hull panels + IE arc furnace alloys = Stellaris rocket parts
- **Warp Propellant fluid** — Create distillation of IE crude oil + blaze powder + soul sand
- **Navigation Core (Path A)** — Psychic Resonance Crystal + Redstone + Precursor Artifact
- **Navigation Core (Path B)** — Ender Pearl ×16 + Diamond ×4 + Precursor Artifact ×2 *(no Cobblemon path)*
- **Power Conversion** — Create SU → FE at 256:80 (inefficient), FE → SU at 120:128
- **Coin Minting** — Create press + gold → Lightman's coins (admin-gated at Guild Hall)
- **Precursor Recipes** — unlocked only after finding Precursor Blueprints in deep dungeons

### 1.2 Horizons Companion System

`server_scripts/cobblemon/companion_interactions.js`

Cobblemon world integration. Type-based behaviors that fire on entity tick, block interaction, or proximity.

- **Fire-type heating** — Fire-type within 3 blocks of Create blaze burner = "fueled" state
- **Electric-type power generation** — Electric-type near IE connector = FE injection based on Sp.Atk
- **Grass-type crop boost** — Grass-type in loaded chunks = random tick boost in 5-block radius
- **Water-type irrigation** — Right-click Water-type on cauldron/farmland = water/moisture
- **Psychic-type telekinesis** — Link two Psychic Relay blocks
- **Fighting-type heavy lifting** — Right-click heavy blocks to move at reduced tool req
- **Steel-type gear augmentation** — Klink/Klang adjacent to Create shaft = +25% SU
- **Ghost-type dungeon scouting** — In Gate dimension = particle trail to hidden rooms
- **Ground/Rock-type prospecting** — On surface = ore-finding particles in 8 blocks
- **Ice-type preservation** — Near food storage = "Preserved" tag, 4x despawn timer
- **Poison-type fermentation** — Near brewery barrel = quality tier boost
- **Dragon-type Gate detection** — In party reveals Gate tier before entry
- **Flying-type courier** — Configurable inventory delivery waypoints

### 1.3 Trust & Fatigue System

`server_scripts/cobblemon/trust_fatigue.js`

Per-Pokémon relationship depth beyond vanilla friendship.

- Trust score stored on Pokémon NBT: `horizons_trust` (0-1000)
- Gains: world interactions (+1), long battles (+5), prevented deaths (+20)
- Tiers: Wary (0-199), Familiar (200-499), Bonded (500-799), Soulbound (800-1000)
- Fatigue counter: `horizons_fatigue` (0-100)
- Fatigued Pokémon (>80) refuse to work
- Rest reduces fatigue: Poké Ball (1/sec), preferred biome (2/sec), favorite berry (-30 instant)
- Soulbound Pokémon get visible particle effect and custom title

### 1.4 Cobblemon Duel System 🆕

`server_scripts/cobblemon/duel_system.js`

The PvP-alternative challenge mechanic from the crime system.

- Right-click another player with Duel Challenge token to issue challenge
- Target sees popup: accept / decline / counter-challenge
- On accept: full Cobblemon battle with optional wager (coins, items, or labor)
- Battle outcome resolves wager automatically
- Duel results logged to a server scoreboard for leaderboards
- Special bounty-capture mode: criminal accepts duel to be captured peacefully
- Spectator mode: nearby players notified of active duels
- Anti-griefing: 5-minute cooldown between duel challenges per pair

### 1.5 Gate Dungeon System

`server_scripts/dungeons/gate_system.js`

Floor-based infinite dungeon mechanic.

- Gate entrance portal blocks teleport players to dedicated dimensions
- Per-player instance tracking (floor, tier, entry time, party)
- Floor descent via Descent Pad blocks
- Floor generation: select theme template, place at fixed Y per floor
- Mob scaling on floor change: HP, damage, speed modifiers
- Loot scaling via LootJS hooks
- Respawn anchors every 10 floors
- Boss floors (every 10th) spawn hand-designed NPCs
- Server-wide leaderboard via scoreboard
- Floor 100 drops one-per-clear legendaries

### 1.6 Scaling Difficulty

`server_scripts/dungeons/difficulty_scaling.js`

- Mob HP multiplier = 1 + (floor × 0.08)
- Mob damage multiplier = 1 + (floor × 0.05)
- Mob speed bonus on floors 26+
- Elite variants on floors divisible by 5
- Loot quality tier rolls based on floor band

### 1.7 Death Penalty System

`server_scripts/player/death_penalty.js`

- On death: 15% of carried Lightman's currency drops as physical coins
- Coins retrievable for 10 game minutes
- Weakened debuff on respawn (60 sec, -30% damage, -20% speed)
- In Gate dimensions: kick back 3-5 floors to last anchor
- Cobblemon set to 1 HP in Poké Balls
- Death waypoint via JourneyMap integration

## Economy & Kingdom Systems

### 1.8 Kingdom Currency System

`server_scripts/economy/kingdom_currency.js`

- 5+ kingdom currencies with NBT metadata
- Kingdom shop NPCs only accept own currency
- Exchange stations at major hubs with dynamic rates
- Weekly rate fluctuation based on Prosperity scores
- Counterfeit detection via mint ID

### 1.9 Faction Reputation System 🆕

`server_scripts/economy/faction_reputation.js`

Tracks player standing with 6 factions for quest gating and NPC behavior.

- 6 scoreboards: `horizons_rep_plains`, `horizons_rep_forest`, `horizons_rep_mountain`, `horizons_rep_coastal`, `horizons_rep_skyborn`, `horizons_rep_wanderer`
- Range: -1000 to +1000 per faction
- Tiers: Hated, Hostile, Neutral, Friendly, Trusted, Honored
- Quest completion grants reputation
- NPC kills, theft, betrayals reduce reputation
- Crime stat changes cascade reputation across friendly factions
- Faction-locked content checked via reputation thresholds
- Allegiance tracking (only one allegiance at a time, but multiple positive standings)

### 1.10 Village Evolution System

`server_scripts/kingdoms/village_evolution.js`

- Per-village scoreboards: Prosperity, Reputation, Development, Loyalty
- Player activities increment stats
- Threshold checks every 20 game minutes
- On threshold: place structure templates, spawn NPCs, grant village name at Town tier
- Kingdom coronation quest at City → Kingdom threshold
- Named villages persist in world data

### 1.11 Caravan & Trade Route System

`server_scripts/trade/caravan_routes.js`

- Trade routes registered with kingdom diplomacy active
- Create train stations in kingdom territories register as Kingdom Stations
- Auto-sell configured goods via Lightman's
- Profit split: 70% player, 15% origin, 15% destination
- Random raid events on trains
- Route reputation grows with successful deliveries

### 1.12 Dynamic Price Fluctuation

`server_scripts/economy/price_fluctuation.js`

- Runs every 7 MC days
- ±20% per item based on supply/demand tracking
- Global shop bulletin at Guild Hall

### 1.13 Jobs+ ↔ Lightman's Bridge

`server_scripts/economy/jobs_currency_bridge.js`

- On Jobs+ level-up: grant Lightman's coins
- Conversion scales with job tier
- Daily Job Payout via scheduled event

## Crime & Justice Systems 🆕

### 1.14 Crime Detection System 🆕

`server_scripts/crime/detection.js`

The witness and reporting layer.

- NPC vision cones (90° forward, 16 block range, configurable)
- Crimes detected: chest theft, shop theft, NPC assault, NPC murder, trespassing, sabotage
- Witnessed crimes auto-report after 30 seconds OR when NPC reaches a Guard NPC
- Killing witness within 30s suppresses report (but is itself a crime)
- Hood of Shadows reduces vision cone to 8 blocks
- Ghost-type Cobblemon companion: 50% chance to suppress witness report
- Stealth boots reduce sound detection
- Ground-truth event log for replays and audit

### 1.15 Crime Stat Tracking 🆕

`server_scripts/crime/crime_stat.js`

- Per-player scoreboard: `horizons_crime_stat` (0-5)
- Crime additions per offense type
- Tier transitions trigger consequences:
  - Tier 1: +1 Crime Stat lasts 1 day
  - Tier 2: Bounty posted (50-200 coins)
  - Tier 3: Bounty raised (200-1000), guards across friendly factions hostile, trade restricted
  - Tier 4: Bounty (1000-5000), all friendly factions hostile, Outlaw quests unlock, kingdom-wide ban
  - Tier 5: Bounty (5000+), all NPCs except Free Wanderers hostile, special hunter spawns activated
- Crime Stat decay over time (only at Tiers 1-2, never auto-decays from 3+)
- Tier reduction only via jail time, payment, or quest completion

### 1.16 Bounty Board System 🆕

`server_scripts/crime/bounty_board.js`

The active bounty management layer.

- Bounty Board blocks placed in every Town+ tier settlement
- Right-click to open Bounty Board GUI (KubeJS-driven, Custom NPCs for visual)
- Auto-posts bounties when Crime Stat hits 2+
- Bounty data: target name, last known location, Crime Stat, reward amount, time remaining
- Hunters can accept (locks bounty for 24 game hours, prevents griefing)
- Multi-hunter contention: first to capture wins
- NPC criminal bounties also posted (procedurally generated)
- Bounty Board can also display the Outlaw counter-bounties

### 1.17 Hunter's Compass 🆕

`server_scripts/crime/hunters_compass.js`

- Custom Curio item granted when accepting a bounty
- Points toward target's last known coordinates (updates every 5 minutes)
- Includes target name and Crime Stat tier
- Glows when target is within 100 blocks
- Vibrates when target is within 25 blocks (haptic-like feedback via particles)
- Disabled when target enters jail or Crime Stat drops below 2

### 1.18 Capture Mechanics 🆕

`server_scripts/crime/capture.js`

Three legitimate capture methods, all routed to the jail system.

- **PvP Capture** — defeat target in combat, target HP reaches 0, KubeJS death event teleports them to jail instead of normal respawn
- **Cobblemon Duel Capture** — issue Duel Challenge with bounty intent flag; if target accepts and loses, peaceful capture (jail)
- **Stealth Capture** — Capture Net item (consumable), use on undetected target while crouching, instant peaceful capture
- All captures pay the bounty to the hunter and grant faction reputation
- Captured target receives a brief "Captured by X" notification

### 1.19 Aetheria Penitentiary 🆕

`server_scripts/crime/jail.js`

The jail dimension management layer.

- On capture: teleport player to Penitentiary dimension
- Sentence length: 5 minutes per Crime Stat tier (capped at 30 minutes real time)
- Player keeps inventory, restricted to jail areas
- Sentence reduction options:
  - **Pay fine** — Lightman's Currency, scaled to Crime Stat
  - **Work it off** — complete farm tasks in prison garden (ties to farming system)
  - **Trade information** — give location of an NPC criminal for sentence reduction
  - **Escape attempt** — risky, usually fails, +2 Crime Stat if caught
- On release: Crime Stat reduced by 1, "Released Convict" status (cosmetic, 7 days)
- Faction reputation slowly recovers post-release

### 1.20 NPC Bounty Hunters 🆕

`server_scripts/crime/npc_hunters.js`

Hostile NPCs that hunt high-Crime-Stat players.

- Spawn rate scales with highest active Crime Stat on server
- Pathfinder Tier 4-5 difficulty
- Use Cobblemon Duel mechanic by default, escalate to PvP if challenged
- Can be defeated, robbed, or befriended (high Charisma required)
- Famous NPC Hunters: The Iron Crow, Steelclaw Maven, Old Marshal Hattori
- Each Famous Hunter has unique gear, dialogue, and a backstory
- Defeating a Famous Hunter is a Bounty Hunter side chain milestone

### 1.21 Counter-Bounty System 🆕

`server_scripts/crime/counter_bounties.js`

For Outlaw players to retaliate.

- Outlaws (Crime Stat 3+) can post bounties on lawful players who killed their crew
- Counter-bounties displayed on Outlaw Hideout boards (separate from kingdom Bounty Boards)
- Lawful players don't see counter-bounties unless they reach Trusted reputation with Free Wanderers
- Counter-bounty payouts come from the outlaw's own treasury
- Encourages organic player feuds and retaliation cycles

## Player Progression

### 1.22 Player Leveling & Perks

`server_scripts/progression/pathfinder_levels.js`

- XP from chunks, quests, floor descents, crafts, captures, harvests, trade, kingdom milestones
- Diminishing returns per session
- Perk points every 5 levels
- Four perk trees managed via FTB Quests rewards
- Capstones unlock Game Stages
- Level cap: 100 per tree

### 1.23 Custom Quest Rewards 🆕

`server_scripts/quests/reward_handlers.js`

FTB Quests reward types vanilla doesn't support. **Critical infrastructure for the quest system.**

- Grant perk points
- Grant kingdom currency (any of 5+)
- Unlock Game Stages
- Grant Precursor Tokens (bound-on-pickup)
- Teach Cobblemon moves via TM discs
- Unlock fast travel waypoints
- Modify faction reputation
- Trigger NPC dialogue advancement
- Spawn structures (kingdom growth, boss arenas)
- Modify Crime Stat (e.g., quest: "Turn Yourself In" reduces Crime Stat by 1)

### 1.24 Custom Quest Tasks 🆕

`server_scripts/quests/custom_tasks.js`

FTB Quest tasks that require KubeJS hooks.

- Speak to NPC X (Custom NPCs interaction event)
- Win a Cobblemon battle vs trainer Y
- Reach Gate Floor Z
- Brew a Legendary-quality wine
- Achieve Balanced Diet nutrition state
- Complete a Cobblemon Duel
- Hire a MineColonies worker of type X
- Capture a bounty target
- Earn N kingdom reputation
- Complete a trade route delivery

### 1.25 Quest Branching Logic 🆕

`server_scripts/quests/branching_logic.js`

Mutually exclusive quest unlocks via Game Stages.

- Decision quests fire KubeJS event on completion
- Event handler sets Game Stage(s) and clears mutually exclusive stages
- Downstream quest visibility checked via stages
- Examples: faction allegiance, ending intent, crime/lawful path
- Anti-stage-gate pattern: quest hidden if conflicting stage present

### 1.26 Quest Completion Events 🆕

`server_scripts/quests/quest_completion_events.js`

World effects when significant quests complete.

- Spawn structures (e.g., kingdom growth on village evolution quest)
- Trigger NPC dialogue advancement (NPC remembers you completed their quest)
- Grant titles displayed in chat (e.g., "Founder of the New Age")
- Server-wide announcements for ending completions
- Update reputation cascades

## Living Pillar Systems

### 1.27 Nutrition System

`server_scripts/player/nutrition.js`

- Track 8 food group scores in player NBT
- Group scores increase by 5-20 per food eaten
- Decay 1 per MC day
- Diminishing returns on saturation
- Apply attribute modifiers for states: Malnourished, Undernourished, Well Fed, Balanced Diet, Gourmet
- Quality tier multiplier: Legendary = 5x Table

### 1.28 Thirst Integration Layer

`server_scripts/player/thirst_integration.js`

- Beverage hydration: water/juice/tea +40%, beer +25% (Tipsy), wine +30% (Tipsy + stat boost)
- Legendary beverages: +35%, no Tipsy
- Dungeon thirst drain: +50% on floors 26+, +100% on 51+, disease risk on 76+
- Water-type Cobblemon: right-click with canteen = fill with Purified water
- Ice-type Cobblemon in party: canteens don't spoil

### 1.29 Food & Drink Quality Tiers

`server_scripts/farming/quality_tiers.js`

- Quality NBT tag (1-5) on craft
- Quality affects buff strength linearly (Q5 = 2.5x Q1)
- Factors: soil quality, Cobblemon proximity, fermentation, perks
- Display via Legendary Tooltips
- Kingdom NPCs pay 3x base price for Q5

### 1.30 Soil Quality System

`server_scripts/farming/soil_quality.js`

- Farmland blocks track soil_quality (0-100) in block entity data
- Degrades 5 per same-crop harvest
- Rotation bonus: different crop family resets degradation
- Compost: +20 quality
- Grass-type Cobblemon proximity: +1/day
- Below 50: reduced yield. Below 20: crop failure.

### 1.31 MineColonies Cobblemon Pairing

`server_scripts/colony/pokemon_workers.js`

- Track worker ↔ Pokémon assignments in colony data
- Right-click worker NPC with Poké Ball to assign
- Apply efficiency bonuses per worker tick based on partner type
- 16 documented worker/type pairings with specific bonuses
- Pokémon on schedule: follows worker during shift
- Trust integration: colony partners gain passive Trust

### 1.32 Farmhand Wage System

`server_scripts/colony/wages.js`

- Replaces MineColonies happiness with Lightman's Currency wages
- Daily wage deduction from player/team account
- Unpaid workers stop working → leave
- Higher wages = productivity bonuses
- Multi-colony bulk discounts

### 1.33 Farm-Bound Cobblemon

`server_scripts/cobblemon/farm_bound.js`

- Companion Hut block tracks one Pokémon
- Pokémon persists when player offline
- Continues working (crop boost, soil regen)
- Daily berry consumption upkeep
- Passive Trust gain
- Neglect (3 days no berries) → leaves

### 1.34 Villager Needs System

`server_scripts/villages/needs.js`

- Per-village scoreboards: Food, Water, Safety, Comfort
- Decay per day, replenished by player or infrastructure
- Low needs reduce Prosperity, high needs boost it
- Auto-generated quests when needs drop below thresholds

### 1.35 Traveling NPC Scripts

`server_scripts/npcs/travelers.js`

- Custom NPCs with waypoint schedules
- Mob encounters mid-journey
- Player interception creates trade opportunities
- Famous Villagers have unique routes

## Ascension Systems 🆕

> **See `HORIZONS_ASCENSION_SYSTEM.md` for the full design.** These are the KubeJS hooks that make it work.

### 1.36 Ascension Eligibility Check 🆕

`server_scripts/ascension/eligibility.js`

- Checks all Section 3 requirements per player on game stage update
- Requirements: Act 4 reached, perk tree thresholds, side chain capstone, Gate Floor 30, Trusted faction reputation, Crime Stat 0 or 4+
- Triggers `horizons:ascension_unlocked` Game Stage when eligible
- Notifies player via Sera dialogue at Sky Cathedral

### 1.37 Trial Dimension Manager 🆕

`server_scripts/ascension/trial_manager.js`

- Handles trial entry per Ascended Class
- 10 trial dimensions, one per class
- Death-out logic: failure = 24 game hour cooldown
- Solo enforcement (no party members in trial)
- Progress tracking per player per trial
- Reward delivery on completion

### 1.38 Ascended Subtree Activation 🆕

`server_scripts/ascension/subtree_unlock.js`

- Opens new 50-point perk tree on ascension complete
- Hooks into PlayerEx/LevelZ to register the new tree
- Stores ascension state in player NBT
- Handles class-specific subtree perks

### 1.39 Class Sigil Effects 🆕

`server_scripts/ascension/sigil_effects.js`

- Passive bonuses applied while Class Sigil is equipped in Curio slot
- Stacking: multiple sigils stack (for Triple Crown players)
- Modifier registration per sigil type
- Visible chat title display

### 1.40 Signature Ability Handlers 🆕

`server_scripts/ascension/signature_abilities.js`

- Keybind-activated class powers (10 lawful + 10 shadow)
- Cooldown management per ability
- Custom particle and sound effects per activation
- Handles complex effects: teleports, AOE damage, summons, buffs

### 1.41 Shadow Variant Logic 🆕

`server_scripts/ascension/shadow_path.js`

- Crime Stat 4+ unlocks Whisper as alternative ascension giver
- Shadow Variant subtrees with darker mechanics
- Permanent reputation locks (friendly factions capped at Hostile)
- NPC Bounty Hunter spawn rate doubled for Shadow players
- Redemption quest path (massive cost to return to lawful)

### 1.42 Multiple Ascension Tracker 🆕

`server_scripts/ascension/multi_ascension.js`

- Tracks 1st/2nd/3rd ascension state per player
- Validates requirements for subsequent ascensions
- Handles Triple Crown reward
- Walker of All Paths title integration

## World Systems 🆕

> **See `HORIZONS_WORLD_SYSTEM.md` for the full design.** Structures, Famous Locations, and the Event System.

### 1.43 Famous Locations Registry 🆕

`server_scripts/world/locations_registry.js`

- Tracks all 130+ Famous Locations with metadata
- Per-player discovery state
- Location coordinates, lore, faction, status, tags
- Map integration for JourneyMap waypoints
- Lore unlocks tied to discovery
- Server statistics for "first to discover"

### 1.44 Discovery Event Handler 🆕

`server_scripts/world/discovery_handler.js`

- Fires when player enters Famous Location bounds for the first time
- Triggers cinematic moment (sound, particles, music swell)
- Adds entry to player's Lore Codex
- Grants discovery rewards (Lorekeeper XP, Wayfinder XP)
- Updates server-side registry

### 1.45 Random Encounter Scheduler 🆕

`server_scripts/world/encounter_scheduler.js`

- Periodic per-player rolls (every 5-10 minutes)
- Encounter weighting by biome, faction territory, time of day, weather, season, player level
- Cooldown to prevent encounter spam
- Skip rolls in safe zones (towns, player bases)

### 1.46 Encounter Spawner 🆕

`server_scripts/world/encounter_spawner.js`

- Handles encounter spawning per type
- 15+ encounter types (Wandering Merchant, Lost Child, Bandit Ambush, etc.)
- NPC placement, dialogue setup, cleanup on completion or timeout
- Reward delivery on successful encounter completion

### 1.47 Aetheria Calendar System 🆕

`server_scripts/world/calendar.js`

- 12 named months across 4 seasons
- Festival day detection
- Tied to Serene Seasons for season transitions
- Calendar display via /calendar command
- Player notification on festival eve

### 1.48 Festival Event Manager 🆕

`server_scripts/world/festivals.js`

- 12 calendar-based festivals (First Bloom, Grand Market, Harvest Festival, etc.)
- Auto-activation on calendar day
- Temporary structure placement (festival tents, decorations)
- NPC spawning for festival vendors and performers
- Limited-time quests and shop inventory
- Cleanup when festival ends
- Cosmetic item distribution

### 1.49 World Event Scheduler 🆕

`server_scripts/world/world_events.js`

- Server-wide event triggers (timer + condition-based)
- 11 world events (Meteor Shower, Eclipse, Convergence, Migration, etc.)
- Server-wide announcements via title and chat
- Multi-player participation tracking
- Cosmic-scale rewards (Eclipse Shards, meteor materials)

### 1.50 Crisis Event Generator 🆕

`server_scripts/world/crisis_events.js`

- Random crisis spawns (Village Under Siege, Dungeon Overflow, Outlaw Raid, etc.)
- Time-limited response window
- Multi-player participation
- Success/failure consequences (faction reputation, location state changes)
- 8 crisis types

### 1.51 Player-Triggered Event Hooks 🆕

`server_scripts/world/player_events.js`

- Fires events on quest completion, milestone reach, location entry
- Examples: The Mentor's Notice, The Bandit's Revenge, The Champion's Challenge
- NPC follow-up generation (couriers, letters, surprise visits)

### 1.52 Location State Manager 🆕

`server_scripts/world/location_states.js`

- Tracks Pristine/Active/Ruined/Hidden/Contested/Restored states per location
- State transitions on world events (festival activates Active, raid causes Contested, restoration quest creates Restored)
- Persistent state across server restarts
- Visual changes per state via structure variants

---

# 2. KubeJS Startup Scripts

Scripts in `kubejs/startup_scripts/`. Register custom items, blocks, and fluids at boot.

## 2.1 Custom Items

`startup_scripts/items/horizons_items.js`

- **Kingdom Currencies** (5+) — Plains Crown, Forest Leaf, Desert Dinar, Mountain Mark, Coastal Pearl
- **Precursor Fragments** — quest item, dungeon drop
- **Precursor Artifacts** — Navigation, Energy, Communication
- **Precursor Tokens** — endgame currency, bound-on-pickup
- **Precursor Blueprints** — unlock endgame recipes
- **Psychic Resonance Crystal** — crafted via Psychic-type interaction
- **Warp Shards** — fast travel network component
- **Warp Gate Components** (5+) — endgame project materials
- **Quality-Tiered Food Variants** — programmatically generated
- **Ancient Encounter Tokens** — summon Ancient Form battles
- **Trainer Cards** — RCT visual variants

## 2.2 Crime System Items 🆕

`startup_scripts/items/crime_items.js`

- **Hood of Shadows** — Curio item, reduces NPC vision cone to 8 blocks
- **Hunter's Compass** — Curio item, points toward bounty target
- **Capture Net** — consumable item, single-use stealth capture tool
- **Duel Challenge Token** — throwable item, issues Cobblemon Duel challenge
- **Bounty Hunter's License** — Curio item, identifies as licensed hunter
- **Outlaw's Brand** — cosmetic item showing outlaw allegiance
- **Released Convict Token** — temporary cosmetic post-jail (auto-expires)
- **Prison Labor Voucher** — proof of jail work, redeemable for Crime Stat reduction

## 2.3 Farming Skill Tools

`startup_scripts/items/farming_tools.js`

- **Tiered Hoes** — Copper → Iron → Steel → Brass → Enchanted → Precursor → Heartwood
- **Watering Cans** — Manual → Copper → Brass → Enchanted auto-watering
- **Pruning Shears** — Basic → Sharp → Quality-boosting
- **Harvesting Scythes** — Row harvester, full-field harvester
- **Seed Bags** — Auto-planting with configured contents
- Multi-block tilling via block interact events
- Heartwood Hoe: 5% Legendary chance per harvest

## 2.4 Custom Blocks

`startup_scripts/blocks/horizons_blocks.js`

- **Psychic Relay** — linked-pair item transfer
- **Pokémon Treadmill** — Create SU generator
- **Route Marker** — caravan path waypoint
- **Descent Pad** — Gate floor transition
- **Warp Anchor** — fast travel node (multi-tier)
- **Coin Minting Press** — admin-only at Guild Hall
- **Exchange Terminal** — currency swap interface
- **Precursor Terminal** — endgame crafting GUI
- **Companion Hut** — Farm-Bound Cobblemon home
- **Greenhouse Frame** — climate zone multiblock detector
- **Fermentation Cellar Stone** — aging bonus multiblock detector
- **Aging Rack** — time-based quality boost for barrels
- **Bounty Board** 🆕 — bounty posting and acceptance interface
- **Outlaw Hideout Marker** 🆕 — designates a location as outlaw territory
- **Penitentiary Anchor** 🆕 — return point from jail dimension

**Note:** Some complex blocks may need actual Java mods. See Section 5.

## 2.5 Custom Fluids

`startup_scripts/fluids/horizons_fluids.js`

- **Warp Propellant** — rocket fuel
- **Quality Wine Variants** — programmatically generated quality-tagged wines
- **Refined Ether** — endgame fluid

## 2.6 Ascension System Items 🆕

`startup_scripts/items/ascension.js`

- **Class Sigils** (20 total) — 10 lawful + 10 shadow Curio items, one per Ascended Class
- **Ascension Crystals** — Bronze, Silver, Gold tiers (granted by completing trials)
- **Lore Codices** — 10 unique class lore books
- **Triple Crown** — endgame Curio for triple-ascended players
- **Ascension Altar** — block placed at Sky Cathedral, hosts the ritual

## 2.7 World System Items 🆕

`startup_scripts/items/world_items.js`

- **Festival Cosmetics** — 12+ limited-time wearables, foods, and decorations per festival
- **Eclipse Shards & Eclipse-Bound Gear** — crafted from Eclipse world event participation
- **Encounter NPC Templates** — definitions for 15+ random encounter NPC variants
- **Discovery Lore Books** — auto-generated entries when players discover Famous Locations
- **Meteor Fragments** — rare drops from Meteor Shower world events
- **Festival Anniversary Tokens** — server-anniversary commemoration items

---

# 3. Datapacks

Static content in `data/horizons/` and related namespaces.

## 3.1 Cobblemon Spawn Tables

`data/cobblemon/spawn_pool_world/horizons/`

- Per Terralith biome — curated lists for 95+ biomes
- Per dimension — Overworld, Nether (Breach), End (Archive)
- Per planet — Moon, Mars, Venus, Europa, Titan, The Forge, Elysium
- Per dungeon tier — E/D/C/B/A/S-Rank floor bands
- Ancient Forms — deep dungeon (76+) exclusive
- Farm-Tuned Pokémon — enhanced spawns near villages

## 3.2 Custom Planet Dimensions

`data/stellaris/dimension/horizons/`

- Europa, Titan, The Forge, Elysium
- Each with dimension type, biome source, noise, sky, spawn rules

## 3.3 Custom Standalone Dimensions

`data/horizons/dimension/`

- **The Between** — fast-travel warp space
- **The Deep** — inverse-gravity below bedrock
- **Gate Template Dimension** — base for Gate instances
- **Aetheria Penitentiary** 🆕 — jail dimension with prison areas, work zones, return anchor
- **The Garden of First Light** 🆕 — Awakened ending location, hidden deep Gate floors

## 3.4 Dungeon Floor Templates

`data/horizons/structures/gate_floors/`

50-100 NBT files organized by theme band:

- `foundations/` (1-10) — stone corridors, halls
- `shift/` (11-25) — underwater, frozen, overgrown, desert
- `deep/` (26-50) — crystal, gravity-inverted, clockwork
- `abyss/` (51-75) — void islands, impossible geometry
- `core/` (76-100) — single-room, surreal
- `outdoor/` — large open-area "wow" floors
- `boss/` — hand-designed every-10-floor arenas

## 3.5 Village Evolution Templates

`data/horizons/structures/village_evolution/`

- Per biome × per stage (5 biomes × 4 stages)
- Walls, gates, towers, castles, marketplaces, inns, wells, fountains, aqueducts

## 3.6 Loot Tables

`data/horizons/loot_tables/`

- Dungeon floor drops per band/tier
- Boss drops per encounter
- Space planet drops
- Kingdom shop stock per kingdom
- Ancient Cobblemon drops
- RCT Trainer rewards
- Bounty target loot tables 🆕

## 3.7 FTB Quests Trees 🆕

`config/ftbquests/quests/`

The full quest system. **See `HORIZONS_QUEST_SYSTEM.md` for the complete design.**

- **Main Quest** — 5 acts, ~80 quests
- **Endings** — 5 sub-chapters, ~25 quests
- **Side Chains** (10) — Cobblemon Mastery, Merchant Prince, Master Crafter, Cartographer, Lorekeeper, Cultivator's Path, Colony Builder, The Trainer's Way, The Bounty Hunter, The Outlaw — ~215 quests
- **Tutorial Chapters** (14) — surface + deep tiers per major mod — ~110 quests
- **Reward Tables** — shared loot pools for tier-appropriate rewards
- **Total: ~430 quests**

## 3.8 Custom Jobs

`config/jobs_remastered/custom_jobs/`

- Pokémon Breeder, Rocketeer, Wayfinder, Vintner, Caravan Driver, Dungeon Delver
- Gardener, Colony Master, Bounty Hunter 🆕

## 3.9 Food Group Tags

`data/horizons/tags/items/nutrition/`

8 tag files for the Nutrition System food groups.

## 3.10 Faction & Crime Tags 🆕

`data/horizons/tags/`

- `faction_npc_plains.json` — Plains Kingdom NPCs (for Crime detection)
- `faction_npc_forest.json` — Forest Coalition NPCs
- `faction_npc_mountain.json` — Mountain Forge NPCs
- `faction_npc_coastal.json` — Coastal Republic NPCs
- `faction_npc_skyborn.json` — Skyborn Order NPCs
- `faction_npc_wanderer.json` — Free Wanderers (don't trigger crime)
- `restricted_area.json` — block tag for trespassing detection
- `forbidden_goods.json` — items that trigger smuggling crime if carried through checkpoints

## 3.11 Tag Unifications

`data/horizons/tags/`

- Unify ores, woods, stones across mods
- `horizons:kingdom_currency`
- `horizons:precursor_item`
- `horizons:legendary_food`

## 3.12 Advancements

`data/horizons/advancements/`

- Tied to Game Stages
- Custom criteria for major milestones
- Hidden advancements for Ancient Forms, Soulbound, all-ending completion

## 3.13 MineColonies Custom Schematics

`data/minecolonies/blueprints/horizons/`

- Horizons Farmhand Cottage
- Horizons Vintner's Cellar
- Horizons Trainer's Center
- Horizons Manor
- Horizons Greenhouse

## 3.14 Ascension Trial Dimensions 🆕

`data/horizons/dimension/trials/`

10 hand-built trial dimensions, one per Ascended Class. Each has unique terrain, mob spawns, structures, and reward conditions.

- `iron_crucible/` — Warlord trial (mechanized colosseum)
- `bond_of_eight/` — Beastmaster trial (8 trainer battles)
- `mirror_maze/` — Pathwalker trial (stealth puzzle)
- `endless_field/` — Architect trial (timed farm build)
- `long_journey/` — Voyager trial (planet circuit)
- `caravan_tale/` — Shepherd trial (NPC escort)
- `hundred_floors/` — Avatar of War trial (Floor 100 single descent)
- `recipe_of_worlds/` — Mind of the Forge trial (Create puzzle)
- `first_garden/` — Verdant Sovereign trial (garden restoration)
- `edge_of_map/` — Eternal Walker trial (worldgen edge)

## 3.15 Ascension Quest Chapters 🆕

`config/ftbquests/quests/chapters/`

- `06_ascension.snbt` — Chapter A6, lawful path (~7-21 quests across three ascensions)
- `06b_shadow_ascension.snbt` — Chapter A6 alternative, Shadow path

## 3.16 Custom Structures Library 🆕

`data/horizons/worldgen/structure/` and `data/horizons/structures/`

The largest single content pile in the project. ~280 structures across 5 quality tiers.

- **T1 Quick** (~150) — random ruins, camps, hermit shrines, fishing docks
- **T2 Detailed** (~80) — themed encounter structures, mid-tier dungeons, small temples
- **T3 Crafted** (~30) — multi-floor named buildings (shops, towers, halls)
- **T4 Signature** (~15) — capital cities, the Heartwood Tree, the Sky Cathedral
- **T5 Mythic** (~5) — the Hidden Library, the Sky Archive, the Garden of First Light

Each structure has:
- NBT structure file in `data/horizons/structures/<category>/<n>.nbt`
- JSON definition in `data/horizons/worldgen/structure/<n>.json`
- Structure_set definition for placement frequency
- Biome tag references

## 3.17 World Event Definitions 🆕

`data/horizons/world_events/`

JSON definitions for the 11 world events.

- `meteor_shower.json`
- `eclipse.json`
- `convergence.json`
- `migration.json`
- `faction_tournament.json`
- `grand_market.json`
- `watcher_visit.json`
- `gate_surge.json`
- `server_anniversary.json`
- `stranger_caravan.json`
- `precursor_activation.json`

## 3.18 Encounter Pool Definitions 🆕

`data/horizons/encounters/`

JSON pools for random encounter weighting per biome, time, weather, and faction.

- `pools/wandering_merchant.json`
- `pools/lost_child.json`
- `pools/bandit_ambush.json`
- ... (one per encounter type)
- `weights/biome_weights.json`
- `weights/time_weights.json`

## 3.19 Festival Structure Templates 🆕

`data/horizons/structures/festivals/`

Temporary decorative structures placed during festivals.

- `first_bloom_decorations/`
- `grand_market_stalls/`
- `harvest_festival_tents/`
- `winter_solstice_lanterns/`
- ... (one folder per festival)

---

# 4. Resource Packs

Client-side visual and audio content. Ships alongside the pack.

## 4.1 Ancient Form Cobblemon Textures

`assets/cobblemon/textures/pokemon/horizons_ancient/`

30+ retextured species variants.

## 4.2 UI Theming

`assets/minecraft/textures/gui/`

- Quest book (teal/gold theme)
- Inventory background overlay
- Currency HUD elements
- Tooltip borders for rarity tiers
- FTB Quests chapter icons
- Custom advancement frames
- Nutrition HUD panel (8 indicators)
- MineColonies UI theming
- Bounty Board UI 🆕
- Crime Stat indicator HUD 🆕

## 4.3 Custom Item Textures

`assets/horizons/textures/item/`

- Kingdom currencies, Precursor items, crystals, shards
- Quality tier borders on food
- Tiered farming tools
- Heartwood Hoe (prestige)
- Crime system items 🆕 (Hood of Shadows, Hunter's Compass, Capture Net, Duel Token)

## 4.4 Space Skyboxes

`assets/minecraft/textures/environment/`

- Moon, Mars, Venus, Europa, Titan, The Forge, Elysium

## 4.5 Custom Music Resource Pack

`assets/minecraft/sounds/music/horizons/`

- Overworld (Ghibli pastoral)
- Nether (Breach industrial)
- End (Archive ethereal)
- Space (silence + strings)
- Gate Dungeons (atmospheric → rhythmic)
- Boss fights (orchestral)
- Kingdom themes (5 cultural styles)
- Farming themes (warm peaceful)
- Colony themes (managed area ambience)
- Penitentiary theme 🆕 (somber, reflective)

## 4.6 Ambient Sound Overrides

`assets/minecraft/sounds/ambient/horizons/`

- Dungeon ambience per band
- Space ambience per planet
- Kingdom ambience (markets, forges, bells)
- Farm ambience (chickens, bees, workers)
- Jail ambience 🆕

---

# 5. Custom Java Mods *(If Needed)*

## 5.1 Horizons Core Mod *(recommended)*

A lightweight Java mod for what KubeJS can't do cleanly:

- Psychic Relay block — cross-chunk networking
- Pokémon Treadmill block — Create SU integration with custom renderer
- Warp Anchor block — multi-tier fast travel with custom GUI
- Precursor Terminal block — endgame crafting GUI
- Gate Entrance Portal block
- Companion Hut block — Farm-Bound logic
- Bounty Board block 🆕 — complex GUI with target tracking
- Nutrition HUD overlay
- Crime Stat HUD overlay 🆕

**Why Java?** KubeJS is limited in rendering complexity, block entity networking, and custom GUIs. A small mod (~3000 lines) gives proper ownership over critical systems.

## 5.2 Horizons Worldgen Mod *(optional, later)*

- Dynamic Gate dimension instances per party
- Procedural floor selection with context-awareness
- Reality-fragmenting effects on deep floors

## 5.3 Horizons Companion API *(optional)*

- Register custom companion behaviors for non-Cobblemon mobs
- Hook into Trust/Fatigue from other mods
- Expose Horizons events to mod developers

---

# 6. Build Priority & Phasing

## Phase 1 — Foundation (Weeks 1-2)

- Install all mods, verify boot with Spark profiling
- `cross_mod_bridges.js` — basic rocket components, power bridge
- `quality_tiers.js` — food quality baseline
- Cobblemon spawn datapacks for Terralith biomes
- **FTB Quests + dependencies installed and verified**
- **Quest Chapter 0 (Welcome) + Chapter 1 (Act 1) stub quests**
- **Custom reward handler (perk point) working end-to-end**
- Lightman's Currency configuration
- Nutrition System stub — food group tags defined
- Tough As Nails configuration

## Phase 2 — Core Systems (Weeks 3-5)

- `companion_interactions.js` v1 — 5 types
- `trust_fatigue.js` — basic tracking
- `gate_system.js` — 10 floor templates, 1 boss
- Kingdom Currency items
- Jobs+ custom jobs
- `pathfinder_levels.js` — XP and perk tree structure
- `nutrition.js` full — all 8 groups, buff states
- `thirst_integration.js` — beverages, Water-type canteen
- **Faction Reputation System** 🆕
- **Quest reward handlers (all custom types)** 🆕
- **Quest Chapters 2-3 (Acts 2 and 3)** 🆕
- **First 2 side chains: Cobblemon Mastery, Cultivator's Path** 🆕

## Phase 3 — World Building (Weeks 5-8)

- Anchor Town spawn build
- 8 Gym structures with NPCs
- Village evolution templates (5 biomes × 4 stages)
- Custom planet datapacks
- First Create train trade route
- Ancient Form resource pack v1
- MineColonies configuration + custom schematics
- `pokemon_workers.js` — first 5 worker pairings
- Radical Cobblemon Trainers configuration
- **20 named NPC quest givers built via Custom NPCs** 🆕
- **NPCs hooked into quest system** 🆕
- **First 4 tutorial chapters** 🆕
- **Crime System foundation** 🆕
  - Crime Detection scripts (witness vision cones)
  - Crime Stat tracking
  - Bounty Board block (basic version)
  - Hood of Shadows + Capture Net items

## Phase 4 — Deep Content (Weeks 8-12)

- 50+ dungeon floor templates
- `gate_system.js` full — anchors, bosses, Floor 100
- All companion interactions
- **Quest Chapters 4-5 (Acts 4 and 5) full** 🆕
- **All 5 ending sub-chapters** 🆕
- **Remaining side chains and tutorials (S3-S10, T5-T14)** 🆕
- `caravan_routes.js` — full kingdom trade
- `village_evolution.js` — automated triggers
- `soil_quality.js` — deep farming
- Brewing quality integration
- Farming Skill Tools — full progression
- Villager Needs System
- Farm-Bound Cobblemon
- Traveling NPC Scripts
- **Crime System full** 🆕
  - Aetheria Penitentiary dimension
  - NPC Bounty Hunters with Cobblemon teams
  - Cobblemon Duel System
  - Counter-bounties for outlaws
  - Famous NPC Hunters (Iron Crow, Steelclaw Maven, Old Marshal Hattori)

## Phase 5 — Polish (Weeks 12-16)

- Resource pack complete (UI, items, skyboxes, music, jail theme)
- `price_fluctuation.js`
- `death_penalty.js` full
- Spark profiling and TPS optimization
- Stress test with 4-8 players
- Player guide and admin docs
- CurseForge packaging
- Greenhouse & Cellar multiblocks
- Nutrition HUD polish
- **Quest book UI theming via FancyMenu** 🆕
- **Crime Stat HUD overlay** 🆕
- **Bounty Board GUI polish** 🆕
- **Quest localization keys** 🆕

## Phase 6 — Post-Launch *(ongoing)*

- S-Rank Gates infinite scaling
- Seasonal events (tournaments, festivals, harvest celebrations)
- Precursor lore expansion
- Java mod extraction for complex blocks
- Additional planets, dimensions, side chains, ending content

---

# 7. What Goes Where (Cheat Sheet)

| I want to... | Build it as... |
|---|---|
| Change how a recipe works | KubeJS server script |
| Add a new item | KubeJS startup script |
| Add a simple new block | KubeJS startup script |
| Add a block with complex rendering or GUI | Custom Java mod (Section 5.1) |
| Add a new dimension | Datapack |
| Generate a dimension procedurally per-player | Custom Java mod |
| Add mobs to a specific biome | Datapack (biome modifier) |
| Add Cobblemon spawns | Datapack (Cobblemon spawn_pool_world) |
| Scale mob difficulty by Y-level | KubeJS server script (entity spawn event) |
| Modify a loot table | LootJS script |
| Add a quest | FTB Quests in-game editor → exports to config |
| Add a custom NPC with dialogue | Custom NPCs in-game editor → exports to world save |
| Change a texture | Resource pack |
| Add sound effects | Resource pack |
| Add music for a dimension | Resource pack (sounds.json override) |
| Hook into player death | KubeJS server script (player.death event) |
| Track per-player stats | KubeJS scoreboards or NBT data |
| Schedule recurring events | KubeJS scheduled tasks |
| Track food groups | KubeJS server script + item tags |
| Modify villager needs | KubeJS server script + scoreboard |
| Add a MineColonies worker variant | MineColonies schematic + KubeJS bonus script |
| Add a farming tool tier | KubeJS startup + server event for behavior |
| **Add a quest reward type** 🆕 | KubeJS server script (FTB XMod Compat event hook) |
| **Add a custom quest task** 🆕 | KubeJS server script (FTB XMod Compat event hook) |
| **Detect a crime** 🆕 | KubeJS server script (witness vision + tag check) |
| **Post a bounty** 🆕 | KubeJS server script (Crime Stat threshold trigger) |
| **Capture a player** 🆕 | KubeJS death event with Crime Stat check + jail dimension teleport |
| **Initiate a Cobblemon Duel** 🆕 | KubeJS player interact event + Cobblemon battle API |
| **Add an Ascended Class** 🆕 | KubeJS server script + custom Class Sigil item + new perk subtree + trial dimension datapack |
| **Build an Ascension Trial** 🆕 | NBT structure file + datapack dimension + KubeJS trial manager hooks |
| **Add a Famous Location** 🆕 | NBT structure (T1-T5) + JSON structure file + KubeJS registry entry |
| **Create a random encounter** 🆕 | KubeJS server script (encounter type) + encounter pool JSON + NPC template |
| **Schedule a festival** 🆕 | KubeJS calendar entry + festival structure templates + festival event manager hook |
| **Trigger a world event** 🆕 | KubeJS world event scheduler + event definition JSON + reward script |

---

## Counts by Category

| Type | Count |
|---|---:|
| KubeJS Server Scripts | 52 |
| KubeJS Startup Scripts | 7 |
| Datapack categories | 19 |
| Resource pack categories | 6 |
| Optional Java mods | 3 |
| **Total custom systems** | **~57 major** |

---

*Custom Integrations v5 — companion to `HORIZONS_SERVER_MODS.md`, `HORIZONS_CLIENT_MODS.md`, `HORIZONS_LIVING_WORLD.md`, `HORIZONS_QUEST_SYSTEM.md`, `HORIZONS_ASCENSION_SYSTEM.md`, and `HORIZONS_WORLD_SYSTEM.md`*
*Most of this is KubeJS. Escalate to Java mods only when blocked.*
*🆕 indicates additions from the Quest, Crime, Ascension, and World System expansions.*
