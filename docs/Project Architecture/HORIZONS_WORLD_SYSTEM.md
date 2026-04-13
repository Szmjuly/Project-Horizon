# Project Horizons — The World System

**Structures, Locations, and Events.**

> The world-building infrastructure layer. This is what turns "a procedurally generated map with mods" into "Aetheria, a place with history, named landmarks, and a calendar of living events." Hand-built structures, persistent named locations, and a deep event system combine to create the sense that the world existed before you arrived and will continue after you leave.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [The Three Pillars](#2-the-three-pillars)
3. [Structure System](#3-structure-system)
4. [Location System](#4-location-system)
5. [Event System](#5-event-system)
6. [The Famous Locations Registry](#6-the-famous-locations-registry)
7. [Example Catalog](#7-example-catalog)
8. [Integration with Other Systems](#8-integration-with-other-systems)
9. [Implementation Notes](#9-implementation-notes)
10. [Build Priority](#10-build-priority)

---

## 1. Philosophy

### A World, Not a Map

Most modpacks generate a map. Project Horizons builds a **world**. The difference is intentionality. A map is something you explore once and forget. A world has places people remember, events that happened on dates, and stories that get retold.

### Three Rules

1. **Every place has a reason for being there.** No structure exists just because the worldgen rolled it. Every named location was placed (or generated) because someone in the lore lived, fought, prayed, or built there.
2. **The world has a calendar.** Time matters. Festivals happen on specific days. Markets meet on specific schedules. Seasonal events come and go. Players who pay attention to the calendar gain advantages over those who don't.
3. **The world reacts to the players.** Events trigger based on player actions, presence, and choices. Empty regions fill with life when explored. Quiet villages erupt with festivals when their patron NPC is befriended.

### What This Replaces

Without this system, you have:

- ❌ Random structures from mods that feel disconnected from each other
- ❌ Procedurally generated villages that all look the same
- ❌ A world that forgets you the second you leave a chunk
- ❌ "Content" that's just dungeons with loot

With this system, you get:

- ✅ Hand-built signature structures that anchor the world's identity
- ✅ Named, persistent locations players can give directions to
- ✅ A living calendar of events tied to seasons, days, and player actions
- ✅ Random encounters that make travel feel adventurous
- ✅ Server-wide events that bring players together

---

## 2. The Three Pillars

The World System has three layered components, each handling a different scale of "place" or "moment":

### Pillar A — Structures

**What:** Physical builds in the world. NBT files, schematics, placed via worldgen or commands.

**Scale:** From single-block points of interest to multi-chunk capital cities.

**Purpose:** The bones of the world. Where things are.

### Pillar B — Locations

**What:** Named, persistent, discoverable places with metadata. A location is a *meaningful* structure — one with a name, lore, and relationships.

**Scale:** Global registry. Every Famous Location is tracked server-side.

**Purpose:** The identity of the world. What things are called.

### Pillar C — Events

**What:** Time-based or trigger-based happenings. Random encounters, scheduled festivals, server-wide world events.

**Scale:** From single-player random encounters to server-wide cosmic events.

**Purpose:** The pulse of the world. When things happen.

These three pillars are related but distinct:

- A **Structure** without a Location is just decoration
- A **Location** without an Event has no life
- An **Event** without a Structure or Location has no anchor

The best content uses all three. Example: **The Heartwood Tree** is a structure (the tree itself, hand-built in NBT), a location (the Famous Location "Heartwood Grove" registered server-side), and an event source (every spring, the Festival of First Bloom happens here).

---

## 3. Structure System

### 3.1 Structure Categories

We organize custom structures into eight categories based on purpose:

| # | Category | Examples | Generation Method |
|---|---|---|---|
| 1 | **Settlement Structures** | Hamlets, villages, towns, cities, kingdom capitals | Worldgen + village evolution |
| 2 | **Lore Structures** | Precursor monuments, ancient libraries, fallen cathedrals | Hand-placed, rare worldgen |
| 3 | **Dungeon Structures** | Gate entrances, hidden tombs, sealed vaults | Worldgen, biome-specific |
| 4 | **Encounter Structures** | Bandit camps, caravan stops, hermit shrines, abandoned cottages | Common worldgen |
| 5 | **Functional Structures** | Bounty Boards, Warp Anchors, Ascension Altars, Trade Hubs | Hand-placed at fixed locations |
| 6 | **Trial Structures** | Ascension trial dimensions | Datapack dimensions |
| 7 | **Hidden Structures** | Class secrets, easter eggs, lore-only locations | Hidden, undocumented |
| 8 | **Player-Built Structures** | MineColonies schematics, kingdom upgrade pieces | Player or quest-triggered |

### 3.2 Generation Methods

How structures get into the world:

**Worldgen Placement** — Datapack-defined, automatic during chunk generation. Used for common structures (camps, ruins, small dungeons). Configurable spacing and biome restrictions.

**Hand-Placed at Spawn Build** — Anchor Town and the spawn area are built by hand using a creative-mode dev session. Exported via structure block to NBT, then re-placed at world generation as a fixed structure.

**Quest-Triggered Placement** — A quest completion event uses the `/place structure` command to spawn a structure at a calculated location near the player. Used for kingdom upgrades, MineColonies blueprints, and Ascension altars.

**Event-Triggered Placement** — A world event temporarily places a structure that despawns after the event ends. Festival tents, traveling circuses, meteor crash sites.

**Player-Built (Schematics)** — Players use MineColonies builders or creative copies of pre-made schematics to place structures themselves. Their colonies, custom hideouts, kingdom additions.

### 3.3 Structure Quality Tiers

We tag every structure with a quality tier so we can manage workload:

| Tier | Effort | Polish Level | Examples |
|---|---|---|---|
| **T1: Quick** | < 1 hour | Functional, minimal decoration | Random camp, small ruin, fishing dock |
| **T2: Detailed** | 1-4 hours | Decorated, themed, lore-appropriate | Forest hermit shrine, abandoned watchtower, small cathedral |
| **T3: Crafted** | 4-12 hours | Multi-floor, interactive elements, NPCs, secrets | Anchor Town shop district, Mountain Forge entrance, Floating Market |
| **T4: Signature** | 1-7 days | Anchor of the world's identity, unique, unforgettable | Anchor Town complete, Sky Cathedral, Heartwood Tree, Sunken Cathedral |
| **T5: Mythic** | 1-4 weeks | Reserved for Famous Locations and major story beats | The Hidden Library, the Sky Archive, the Garden of First Light |

**Target distribution:**
- ~150 T1 structures (random spice in worldgen)
- ~80 T2 structures (encounters, mid-tier dungeons)
- ~30 T3 structures (named buildings within larger locations)
- ~15 T4 structures (the world's signature builds)
- ~5 T5 structures (the truly mythic ones)

### 3.4 Structure Placement Pipeline

How a structure goes from idea to in-world:

1. **Concept** — write the structure's purpose, theme, and lore in a doc
2. **Schematic build** — build it in a creative test world using vanilla blocks + Horizons mods
3. **Structure block export** — use a structure block to export to NBT
4. **NBT processing** — run through our datapack tooling for tag replacement, decay, etc.
5. **Datapack registration** — create the structure JSON with biome restrictions and spacing
6. **Spawn data** — link Cobblemon spawns, mob spawners, loot tables
7. **NPC binding** — link any NPCs that should spawn inside via Custom NPCs
8. **Quest binding** — link any quest triggers that fire on entry
9. **Test** — verify in dev world that the structure generates correctly and all bindings fire
10. **Document** — add to the Famous Locations registry if applicable

This pipeline is ~30 minutes for a T1 structure and several days for a T5.

---

## 4. Location System

A **Location** is a structure with identity. A pile of stones in a forest is a structure. A pile of stones called *The Whispering Cairn* with a story, a quest, and a name on the world map is a location.

### 4.1 Location Properties

Every Famous Location has:

- **Name** — what people call it
- **Coordinates** — fixed or auto-generated, tracked in registry
- **Lore description** — 1-3 sentences of background
- **Discovery state** — has the player been there yet?
- **Faction allegiance** — which faction (if any) controls it
- **Status** — active, ruined, hidden, contested
- **Tags** — categorization (`peaceful`, `combat`, `lore`, `mercantile`, etc.)
- **Linked NPCs** — who lives here
- **Linked quests** — what stories happen here
- **Linked events** — what happens here on the calendar

### 4.2 Famous Locations Registry

Every named location is stored in a server-side registry (KubeJS scoreboard or NBT data). The registry powers:

- **Player discovery tracking** — each player has a personal "discovered locations" list
- **Map integration** — JourneyMap waypoints auto-generated for discovered locations
- **Quest references** — quests can name locations and the player can navigate to them
- **NPC dialogue** — NPCs can mention locations the player has discovered
- **Lore unlocks** — discovering certain locations grants Lorekeeper XP
- **Server statistics** — leaderboards for "first to discover" each location

### 4.3 Discovery Mechanics

Locations are discovered in three ways:

**Physical proximity** — entering a location's bounding box for the first time auto-discovers it. Triggers a "Location Discovered" notification, plays a sound, updates the registry.

**Quest reveal** — completing a quest that mentions a location auto-discovers it (you don't have to physically visit, the quest gave you the coordinates).

**NPC dialogue reveal** — talking to an NPC who mentions a location adds it to your map as "rumored" — you know it exists but haven't been there.

### 4.4 Location States

A location can be in different states:

- **Pristine** — original condition, untouched
- **Active** — currently inhabited or operational
- **Ruined** — broken down, abandoned, may contain loot or lore
- **Hidden** — exists but not findable without a clue
- **Contested** — subject of an active event (kingdom war, festival, raid)
- **Restored** — was ruined, has been rebuilt by player action

States can change over the course of the game. The Hollow King's Tomb starts Pristine, becomes Hidden after a player loots it, and could become Restored after a Lorekeeper quest. The Sky Cathedral starts Active and could become Contested during a faction war event.

### 4.5 Location Subtypes

Famous Locations are subdivided by purpose:

| Subtype | Description | Count Target |
|---|---|---|
| **Capitals** | Major faction capital cities | 6 (one per faction) |
| **Towns** | Mid-tier settlements with quest givers | ~12 |
| **Sacred Sites** | Religious, magical, lore-relevant places | ~15 |
| **Ruins** | Abandoned places with loot and lore | ~25 |
| **Landmarks** | Geographic features with names (mountains, lakes, trees) | ~20 |
| **Hubs** | Functional spots (Bounty Boards, trade posts) | ~10 |
| **Dungeons** | Named Gate entrances and overworld dungeons | ~15 |
| **Hidden** | Secret/easter egg locations | ~15 |
| **Trial Sites** | Ascension trial entrances | 10 |
| **Player Locations** | Player-founded places (auto-registered when significant) | unbounded |

**Total static Famous Locations: ~130**, plus an unbounded number of player-created ones.

---

## 5. Event System

The pulse of the world. Events make Aetheria feel alive.

### 5.1 Event Categories

Five categories of events, each with different mechanics:

| Category | Trigger | Scope | Example |
|---|---|---|---|
| **Random Encounters** | Player movement, time roll | Single-player local | Wandering merchant on a road |
| **Scheduled Events** | Calendar (game day) | Per-location, broadcast nearby | Spring Harvest Festival |
| **World Events** | Server timer, rare roll | Server-wide, broadcast to all | Meteor shower |
| **Player-Triggered Events** | Player action, quest completion | Local or server-wide | Boss invasion after killing X mobs |
| **Crisis Events** | Random roll, faction-state-based | Local | Bandits attacking a village |

### 5.2 Random Encounters

The most frequent event type. Quietly enriches travel and exploration.

**How they work:**
- A KubeJS scheduled task runs every 5-10 minutes per active player
- Rolls a chance based on biome, faction territory, time of day, weather, and player level
- If triggered, spawns an encounter from a pool appropriate to the conditions
- Encounters are ephemeral — they last as long as needed and despawn cleanly

**Encounter types:**

- **Wandering Merchant** — a Custom NPC offers rare items at fair prices for 5 minutes
- **Wandering Trainer** — a Cobblemon trainer challenges you to a battle (RCT integration)
- **Distressed NPC** — an NPC needs help (escort, defense, retrieval)
- **Lost Child** — a child NPC is lost in the woods, return them to a village for reputation
- **Refugee** — a fleeing villager asks for protection
- **Bandit Ambush** — hostile mobs spawn, player must fight or flee
- **Treasure Hint** — a wandering scholar gives you coordinates to a hidden cache
- **Cobblemon Outbreak** — local Cobblemon swarm event in this biome
- **Famous Pokémon Sighting** — a rare/legendary Cobblemon appears nearby for 10 minutes
- **Storm Refuge** — a small camp appears during rain that offers shelter and trade
- **Pilgrim's Procession** — a group of NPCs walks down a road toward a sacred site
- **Hunter's Camp** — a bounty hunter NPC offers to share information about active bounties
- **Lost Dog** — a wild Pokémon (or actual dog) follows you until you bring it home
- **Strange Stranger** — a mysterious figure offers a riddle or a deal
- **Caravan Convoy** — a merchant caravan needs guards for the next 500 blocks

**Encounter pool weighting:**
- Weight by biome (forests get more bandit ambushes, plains get more caravans)
- Weight by faction (Plains Kingdom territory gets more peaceful encounters, Free Wanderers territory gets more crime/outlaw flavor)
- Weight by time (night gets more bandits and ghosts, day gets more merchants and travelers)
- Weight by weather (storms get more refugees and shelters)
- Weight by player Crime Stat (high Crime Stat gets more bounty hunter encounters)

### 5.3 Scheduled Events

Calendar-based events tied to game days and seasons (via Serene Seasons).

**The Aetheria Calendar:**

We define a custom in-world calendar with named months and seasons. Day 1 of the world is Day 1 of Sprouting (spring). The year cycles through 12 named months, 4 seasons, with festivals on specific days.

| Month | Season | Notable Days |
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
| **Stillborn** | Winter | (no festivals — quiet month) |
| **Thawing** | Late Winter | Day 14: Awakening Day |
| **Newleaf** | Early Spring | Day 7: Festival of New Beginnings |

**Festivals as events:**

Each festival is an event that:
- Triggers automatically on the calendar day
- Lasts 1-3 game days
- Spawns festival decorations (temporary structures)
- Adds new NPCs to the host location
- Unlocks limited-time quests
- Offers exclusive shop inventory
- Plays unique music
- May grant cosmetic items only available during the festival

**Examples:**

- **First Bloom Festival** — held in Plains Kingdom, all crops grow 2x faster for the day, special grass-type Cobblemon spawn boost, rare seed shop opens
- **First Harvest** — Mountain Forge hosts a feast, players gain Cultivator XP for delivering crops, one-day-only Legendary recipes available
- **Winter Solstice** — Coastal Republic hosts a lantern festival, ice-type Cobblemon swarm, ice fishing minigame
- **Awakening Day** — Forest Coalition celebrates the rebirth of life, Cobblemon outbreaks across the world, all egg hatching speeds tripled

### 5.4 World Events

Server-wide, dramatic, rare. The events that get talked about days later.

**Triggered by:**
- Server uptime timer (every 4-8 real-time hours, weighted random)
- Aggregated player progression milestones (after the first player reaches Floor 50)
- Calendar dates (specific in-game days)
- Manual server admin trigger

**Examples:**

- **Meteor Shower** — falling stars across the sky, meteor crash structures spawn, players who reach them first get rare materials and Precursor Fragments
- **The Eclipse** — sun darkens for 30 minutes real-time, shadow Cobblemon spawn, dungeon mobs become elite, deep dungeons become more dangerous and more rewarding
- **The Convergence** — all Gate entrances simultaneously open and pour out reinforced enemies, players must defend nearby villages
- **The Migration** — a massive Cobblemon migration moves across the map, rare spawns visible to all players, shiny rate boosted
- **Faction Tournament** — a kingdom hosts a Cobblemon battle tournament, players sign up, brackets play out over real-time hours, winner gets faction reputation and trophies
- **The Great Market** — a one-day mega-market spawns at a random kingdom, every NPC merchant in the world appears with full stock, prices reduced 25%
- **The Watcher's Visit** — a Watcher physically descends to Aetheria for 1 hour real-time, players who find them get unique dialogue and a small permanent buff
- **The Gate Surge** — random Gate becomes "surging," all floors become 50% harder but loot is doubled
- **Server Anniversary** — celebrates the day the server launched, fireworks across all kingdoms, all players get a commemorative item
- **The Stranger's Caravan** — an unknown merchant visits with one-of-a-kind items for sale, only stays 1 game day, items never appear again
- **Precursor Activation** — a random Precursor monument activates, releasing rare item drops to nearby players, Lorekeeper XP boost

### 5.5 Player-Triggered Events

Events that fire because a specific player did something.

**Triggers:**
- Quest completion
- Reaching a milestone (level, kill count, build count)
- Entering a previously undiscovered location
- Defeating a Famous NPC
- Crossing a kingdom border with high reputation

**Examples:**

- **The Mentor's Notice** — completing your first dungeon floor causes your class mentor to send a courier with congratulations and a small gift
- **The Bandit's Revenge** — killing a famous bandit leader causes their lieutenant to spawn after 2 game days seeking revenge
- **The Champion's Challenge** — defeating the 8th Gym Leader causes the Elite Four to send a formal invitation
- **The Legend Spreads** — earning Famous Villager status with 5+ NPCs causes a wandering bard to find you and write a song about you (custom item: "Ballad of [Player Name]")
- **The Watcher Acknowledges** — completing your first ascension causes the Watcher to send you a personal message in the form of a dream cinematic

### 5.6 Crisis Events

Catastrophes that threaten the world. Players who respond gain reputation and rewards.

**Examples:**

- **Village Under Siege** — a hostile mob raid is attacking a village, players nearby get a notification to defend it
- **Dungeon Overflow** — a Gate has overflowed, mobs are pouring out into the overworld, must be cleared before reaching a major settlement
- **Wild Cobblemon Berserk** — a powerful wild Cobblemon has gone berserk in a populated area
- **The Plague** — a faction's villagers are getting sick, players must deliver herbs and potions
- **The Great Flood** — heavy rain causes flooding in a coastal town, players help evacuate NPCs
- **The Forge Fire** — Mountain Forge's main forge has gone out, players help relight it
- **The Lost Caravan** — a faction caravan has gone missing, players search and rescue
- **The Outlaw Raid** — outlaws have raided a kingdom, players hunt them down or help recover stolen goods

**Response mechanics:**

- Crisis events broadcast to all players within range (e.g., 1000 blocks)
- Players have a time limit to respond (15-30 real minutes)
- Multiple players can participate
- Resolution success grants faction reputation, rare loot, and may permanently improve the affected location
- Resolution failure has consequences (village ruined, NPC killed, faction reputation lost)
- Failed crises can sometimes be undone via follow-up reconstruction quests

### 5.7 Discovery Events

Magical moments when a player walks into a special place for the first time.

**Triggers:**
- Entering a Famous Location for the first time
- Reaching a hidden coordinate
- Witnessing a specific environmental condition (sunset on a specific hill, full moon in a specific cave)

**Effects:**
- Cinematic camera pause (brief)
- Custom soundtrack swells
- Custom dialogue from the world itself ("You feel a presence here...")
- Permanent location entry in the player's Lore Codex
- Sometimes a small reward (Precursor Fragment, perk XP, lore book)

**Examples:**

- **Standing on the Heartwood Tree** at sunrise — particles bloom, music swells, a Watcher's voice speaks
- **Reaching Floor 100** for the first time — the entire dungeon shakes and a hidden room opens
- **Watching a meteor land** — the player gains Wayfinder XP and a unique meteorite item
- **Finding the Sunken Cathedral** at low tide — the cathedral rises briefly from the water, allowing entry

---

## 6. The Famous Locations Registry

The full list of named locations in Aetheria. This is the world's "phone book" — what places exist and what they mean.

### 6.1 Capitals (6)

| # | Name | Faction | Description |
|---|---|---|---|
| 1 | **Anchor Town** | Plains Kingdom | The starter town. Center of the player's first acts. Home to Sera, Aren, and the three Path Mentors |
| 2 | **Willowmere** | Plains Kingdom | First foreign village. Home of Vintner Mara and Mayor Theron. Player's first trade route destination |
| 3 | **Iron Crown** | Mountain Forge | Massive forge-city built into a mountain. Home of High Smith Khael. Center of Create/IE engineering |
| 4 | **Saltport** | Coastal Republic | Bustling trade port. Home of Merchant Caelus. Floating Market hub during summer events |
| 5 | **Greengrove** | Forest Coalition | Druidic forest village built into the canopy. Home of Druid Yshara |
| 6 | **The Cloudreach** | Skyborn Order | High-altitude monastic enclave. Home of Watcher's Voice and Operative Marek |

### 6.2 Notable Towns (12)

| # | Name | Region | Notable Feature |
|---|---|---|---|
| 7 | **Sundale** | Plains | Vineyard town, secondary brewing hub |
| 8 | **Stoneford** | Plains/Mountain border | Trade crossroads |
| 9 | **Hollowdeep** | Mountain Forge territory | Mining outpost |
| 10 | **Tideholm** | Coastal | Fishing village, secondary Saltport ally |
| 11 | **Whisperwind** | Forest Coalition | Hidden grove village |
| 12 | **Brokenmast** | Coastal | Haunted shipwreck town |
| 13 | **Highdrift** | Skyborn territory | Mountaintop observatory |
| 14 | **Cinderpath** | Mountain Forge | Volcanic forge outpost |
| 15 | **Greenmarsh** | Plains/Forest border | Reedfolk village, herb farmers |
| 16 | **Southreach** | Free Wanderers | Outlaw-friendly trading post |
| 17 | **Sandwhisper** | Desert | Caravan stop oasis |
| 18 | **Windward** | Coastal | Pilgrim destination, lighthouse town |

### 6.3 Sacred Sites (15)

| # | Name | Faction | Description |
|---|---|---|---|
| 19 | **The Sky Cathedral** | Skyborn / All factions | Diplomatic center, Watcher communication site |
| 20 | **The Heartwood Tree** | Forest Coalition | Massive ancient tree, Verdant Sovereign trial entrance |
| 21 | **The Whispering Cairn** | Plains | Ancient stone circle, lore site |
| 22 | **The Sunken Cathedral** | Coastal | Underwater ruin, only accessible at low tide |
| 23 | **The Forge of First Fire** | Mountain Forge | Volcanic temple, Mountain Forge religious site |
| 24 | **The Star-Watcher's Tower** | Skyborn | Tallest mountain peak, observation site |
| 25 | **The Garden of First Light** | Hidden | Awakened ending location, deep Gate floors |
| 26 | **The Hidden Library** | All / Lorekeeper | Precursor knowledge repository |
| 27 | **The Last Lighthouse** | Coastal | Final lighthouse before unmapped sea, wayfinder shrine |
| 28 | **The Hollow King's Tomb** | Plains | Buried king's resting place, lore site |
| 29 | **The Floating Market** | Coastal | Seasonal mercantile sacred site |
| 30 | **The Whispering Grove** | Forest | Druid teaching site |
| 31 | **The Memory Spring** | Plains | Magical pool that grants minor lore visions |
| 32 | **The Ash Pillar** | Free Wanderers / outlaw | Outlaw shrine, Day of Remembering site |
| 33 | **The Watcher's Footstep** | Hidden | Crater where a Watcher physically descended once |

### 6.4 Ruins (25)

A selection — not all are listed. Players discover them through exploration.

| # | Name | Type | Description |
|---|---|---|---|
| 34-58 | Various Precursor ruins, fallen towers, abandoned monasteries, sunken temples, collapsed bridges, lost watchtowers, broken aqueducts, ancient battlefields, etc. | T1-T3 | Each tells a small story. Lorekeeper rewards. |

### 6.5 Landmarks (20)

Geographic features with names. Not structures per se — places.

| # | Name | Type | Description |
|---|---|---|---|
| 59 | **The Sea of Grain** | Biome | Massive plains, the breadbasket of Aetheria |
| 60 | **The Shattered Peaks** | Mountain range | Highest mountains, near Mountain Forge |
| 61 | **The Endless Forest** | Forest | Forest Coalition home territory |
| 62 | **The Glasslands** | Desert | Crystal-floored desert with rare resources |
| 63 | **The Twilight Cliffs** | Coast | Towering cliffs overlooking the western sea |
| 64 | **The Whisper Marsh** | Wetland | Mysterious bog, Cobblemon-rich |
| 65 | **The Lost Valley** | Hidden valley | Verdant hidden refuge |
| 66 | **The Endless Sky** | Atmosphere | The sky itself, named for Watcher proximity |
| 67 | **The Cradle Lake** | Lake | Massive freshwater lake, Coastal Republic origin |
| 68-78 | More named geographic features | Various | Mountains, rivers, islands, valleys |

### 6.6 Hubs (10)

Functional gathering points with no faction allegiance.

| # | Name | Function |
|---|---|---|
| 79 | **The Guild Hall** (Anchor Town) | Quest hub, faction meeting space |
| 80 | **The Bounty Master's Office** (every capital) | Bounty Board hub for that kingdom |
| 81 | **The Wayfinder's Compass** (Cloudreach) | Cartographer side chain hub |
| 82 | **The Black Market** (Free Wanderers territory) | Outlaw trading hub |
| 83 | **The Trade Crossroads** (Stoneford) | Multi-faction trade hub |
| 84 | **The Aetheria Coliseum** (Anchor Town) | PvP and Cobblemon Duel venue |
| 85-88 | More functional hubs | Various |

### 6.7 Dungeon Locations (15)

Named entrances to Gates and overworld dungeons.

| # | Name | Region |
|---|---|---|
| 89 | **The First Gate** | Near Anchor Town |
| 90 | **The Drowned Gate** | Coastal |
| 91 | **The Burning Gate** | Mountain Forge |
| 92 | **The Frozen Gate** | Northern wasteland |
| 93 | **The Verdant Gate** | Forest Coalition |
| 94 | **The Skyward Gate** | Cloudreach |
| 95 | **The Hollow Gate** | Free Wanderers |
| 96 | **The Whispering Gate** | Hidden |
| 97-103 | More gates | Various biomes |

### 6.8 Hidden Locations (15)

Discoverable through exploration or specific quests.

| # | Name | How to find |
|---|---|---|
| 104 | **The Forever Path** | Shepherd ascended only |
| 105 | **The Eighth Planet** | Voyager ascended only |
| 106 | **Floor 0** | Pathwalker ascended only |
| 107 | **The Iron Forge of the Watcher** | Warlord ascended only |
| 108 | **The First Bond Sanctuary** | Beastmaster ascended only |
| 109 | **The Living Workshop** | Architect ascended only |
| 110 | **The Codex of Building** | Mind of the Forge ascended only |
| 111 | **The True Garden of First Light** | Verdant Sovereign ascended only |
| 112 | **The Map of All Maps** | Eternal Walker ascended only |
| 113 | **The Boss of Bosses Arena** | Avatar of War ascended only |
| 114-118 | More easter egg locations | Various secrets |

### 6.9 Trial Sites (10)

Ascension trial dimension entrances.

Same as the 10 Ascended Class trials in `HORIZONS_ASCENSION_SYSTEM.md` Section 7.

### 6.10 Player-Founded Locations

Player creations that get auto-registered when they reach significance:

- A player's manor that reaches MineColonies tier 5 → registered as a Famous Location
- A player kingdom that achieves City status via Village Evolution → registered as a Famous Capital
- A player who completes the Architect ending → their kingdom becomes permanently Famous on the world map
- Any player-built structure that 5+ other players have visited → auto-registered as Notable

This means **the world grows over time**. Player legacies become part of Aetheria's geography.

---

## 7. Example Catalog

A few worked examples to show what hand-built content looks like.

### 7.1 Example T4 Structure: The Heartwood Tree

**Type:** Sacred Site
**Tier:** T4 Signature
**Faction:** Forest Coalition
**Location:** Center of The Endless Forest biome

**Description:**

A colossal tree, easily 80 blocks tall, with a 30-block-radius canopy. Its roots weave with the surrounding terrain. A spiral staircase climbs the trunk to a small wooden platform near the canopy where a hidden grove sits.

**Construction notes:**

- Trunk built from custom dark oak variants
- Foliage uses leaf blocks with custom particle emitters for the Falling Leaves mod
- A small natural pool at the base, fed by a hidden spring
- Hidden root tunnel leads to a Verdant Sovereign trial entrance
- A weathered stone shrine at the base bears Precursor inscriptions
- Built using YUNG's worldgen scaffolding for natural blending

**Linked NPCs:**

- **Druid Elder Maryn** — gives Cultivator side chain quests, lives at the base
- **Whisper of the Tree** — a magical being who only speaks to Verdant Sovereign ascended players

**Linked quests:**

- "First Bloom" (Cultivator side chain Q12)
- "The Tree Speaks" (Cultivator capstone)
- Verdant Sovereign trial (Ascension chapter)

**Linked events:**

- First Bloom Festival (Day 7 of Sprouting) — petals fall around the tree, Cobblemon swarm
- The Tree's Wakening (random world event) — once per real-time month, the tree glows for 1 hour, all peaceful Pokémon in the area become Bonded faster

**Discovery effect:**

- Standing within 20 blocks for the first time triggers Discovery Event
- Music swells, particles bloom, location added to player's registry

---

### 7.2 Example T2 Structure: Hermit's Shrine

**Type:** Encounter Structure
**Tier:** T2 Detailed
**Faction:** None
**Generation:** Worldgen, common in forests and mountains

**Description:**

A small wooden hut and stone shrine tucked into the woods or built against a cliff. A bronze bell hangs at the entrance. Inside: a single bed, a cooking pot, a barrel of berries, a bookshelf, and a sleeping NPC hermit.

**Linked NPCs:**

- **A wandering hermit** (random name from a pool, randomized appearance via Custom NPCs)
- The hermit will trade for rare items and offer a single random quest from a small pool

**Variations:**

- Standard hermit (peaceful, herbalist, gives Cultivator quest)
- Lapsed warrior (former adventurer, gives Vanguard quest)
- Dimensional researcher (gives Wayfinder quest)
- Outlaw informant (gives Bounty Hunter or Outlaw quest)

**Reward pool:**

- Rare crafting materials
- Lore book fragments
- Free meal (restores hunger and nutrition)
- A small permanent reputation boost with a random faction

This is the kind of structure that quietly enriches travel without overstaying its welcome.

---

### 7.3 Example Random Encounter: The Lost Child

**Encounter type:** Distressed NPC
**Trigger conditions:** Player walking through forest or plains biome at any time, ~5% chance per scheduled tick

**The encounter:**

A small NPC child runs up to the player crying. They've been separated from their family during a Cobblemon outbreak. Three options appear in dialogue:

1. **"Take you home"** — escort the child to the nearest village (dynamic — can be Anchor Town, Willowmere, or any nearby settlement)
2. **"What's your name?"** — get their backstory (no immediate effect, but unlocks a follow-up quest later)
3. **"I don't have time"** — abandon the child (costs faction reputation)

**Escort mechanics:**

- The child follows the player at walking speed
- If the player runs ahead, the child gets stuck and complains
- Wild Cobblemon may attack along the way, the player must defend
- Reaching the village triggers a reunion cutscene with a relieved parent NPC
- Reward: faction reputation, a small currency reward, and a permanent "Friend of [Family Name]" status that opens a future quest line

**Outcome variations:**

- Lost child can sometimes be a *trap* (1% chance) — the "child" is actually a shape-shifted Ghost-type Cobblemon, leading to a battle
- A successfully escorted child remembers the player and may appear as a teen NPC later in the game

This is the kind of encounter that makes the world feel real.

---

### 7.4 Example Scheduled Event: The Grand Market

**Date:** Day 21 of Highsun (mid-summer)
**Duration:** 3 game days
**Location:** Saltport (Coastal Republic capital)
**Scope:** Per-location with broadcast notification to nearby players

**The event:**

For 3 game days, every NPC merchant from every faction travels to Saltport for the largest market of the year. The Floating Market structure (a T4 hand-built market on stilts over the harbor) becomes accessible via a temporary causeway. The market features:

- **30+ NPC merchants** with combined inventories from all 6 factions
- **A tournament Bounty Board** with high-tier bounties available only during the event
- **Limited-time recipes** — Coastal-only Legendary dishes available
- **Performances** — wandering bards, fire jugglers, Cobblemon shows
- **The Marketmaster's Auction** — once per event, a unique item is auctioned (highest bidder wins, paid in any currency)
- **Special spawns** — Coastal Cobblemon variants, including a rare shiny chance

**During the event:**

- All shop prices in Saltport are reduced by 25%
- The Cobblemon Duel system has a tournament bracket with leaderboard
- Players who attend gain Coastal Republic reputation passively
- A unique cosmetic Curio ("Grand Market Goer") is available to all attendees

**After the event:**

- Saltport returns to normal
- Players who participated have a permanent Lorebook entry
- The auction winner's name is engraved on a plaque in the Marketmaster's hall

This is the kind of event players plan their schedule around.

---

### 7.5 Example World Event: The Eclipse

**Trigger:** Server timer, every 14 real-time days, weighted random ±2 days
**Duration:** 30 minutes real-time
**Scope:** Server-wide

**The event:**

A server-wide announcement plays: *"The sun darkens. The Watchers grow restless."*

For 30 minutes:

- The sky goes dark across all dimensions
- Wild Cobblemon spawns shift to dark/ghost types
- Existing dungeon mobs become **Eclipse Elite** variants with double HP and damage but triple loot
- Gate floors are 50% harder but grant 2x XP and rare loot
- **Eclipse Wraiths** spawn — temporary boss-tier mobs that drop Eclipse Shards
- Players who collect Eclipse Shards can craft unique cosmetic gear
- Lorekeepers receive bonus Lorebook XP for any reading during the eclipse
- The Watchers' presence is felt — Custom NPC dialogue references the eclipse if you talk to faction leaders

**End of event:**

- Sky returns to normal
- Eclipse Elite mobs despawn
- Eclipse Wraiths despawn (their drops persist)
- Players with Eclipse Shards can use them to craft "Eclipse-Bound" weapons, armor, and decorations

**Frequency design:**

- Every 14 real days = roughly twice per month
- Weighted random ±2 days = unpredictable but not surprising
- Players begin to anticipate "the eclipse is due soon"
- Server admin can manually trigger one for special server events

---

## 8. Integration with Other Systems

The World System touches every other system. Quick reference for how:

### Quest System Integration

- Quest givers live in named Locations
- Quests can require visiting a specific Location
- Quest completion can trigger Events
- Event participation can advance quests
- Famous Locations track Lorekeeper progress

### Crime System Integration

- Restricted areas are tagged Locations (e.g., "no entry" Royal Quarters)
- Bounty Boards exist in Hub locations
- Crisis Events can be caused by criminals (raids, attacks)
- Outlaw locations are Hidden until the player joins the Outlaw side chain

### Cobblemon Integration

- Random encounters spawn themed Cobblemon
- World events affect Cobblemon spawn pools
- Famous Locations have unique Cobblemon spawns
- Cobblemon Outbreak events are crisis-tier encounters

### MineColonies Integration

- Player colonies can become Famous Locations
- MineColonies blueprints are a structure subtype
- Colony events (raids, festivals) tie into the Event System

### Ascension Integration

- Trial sites are Famous Locations (Section 6.9)
- Hidden Locations include all 10 Ascended secret content sites
- Watchers physically appear at certain Famous Locations during ascension cinematics

### Faction Reputation Integration

- Faction territory determines event weighting
- Famous Locations have faction allegiances
- Crisis Events affect faction reputation
- Festival events are hosted by specific factions

### Calendar Integration

- The Aetheria Calendar drives all scheduled events
- Serene Seasons handles the underlying season logic
- Festival days are tied to calendar dates
- Some Cobblemon spawns shift by season

---

## 9. Implementation Notes

### Mod & Custom Components

The World System runs on:

- **Vanilla NeoForge structure system** — datapack-defined structures, JSON + NBT files
- **Custom NPCs Unofficial** — NPC placement and dialogue in structures
- **KubeJS** — event scheduling, encounter system, location registry, discovery tracking
- **Serene Seasons** — calendar foundation
- **Cobblemon Outbreaks** — Cobblemon-related world events
- **YUNG's API** — terrain blending for hand-built structures
- **Structurize** (MineColonies dep) — secondary structure tooling for player schematics

### New Custom Systems

These get added to `HORIZONS_INTEGRATIONS.md`. Marked 🔵 for custom builds.

#### KubeJS Server Scripts

- 🔵 **Famous Locations Registry** (`server_scripts/world/locations_registry.js`) — tracks all Famous Locations, discovery state per player, and metadata
- 🔵 **Discovery Event Handler** (`server_scripts/world/discovery_handler.js`) — fires when player enters new Famous Location bounds
- 🔵 **Random Encounter Scheduler** (`server_scripts/world/encounter_scheduler.js`) — periodic per-player rolls for encounters based on conditions
- 🔵 **Encounter Spawner** (`server_scripts/world/encounter_spawner.js`) — handles encounter spawning, NPC placement, cleanup
- 🔵 **Calendar System** (`server_scripts/world/calendar.js`) — Aetheria calendar tracking, festival day detection
- 🔵 **Festival Event Manager** (`server_scripts/world/festivals.js`) — handles festival activation, structure placement, NPC spawning, end cleanup
- 🔵 **World Event Scheduler** (`server_scripts/world/world_events.js`) — server-wide events with timer and condition-based triggers
- 🔵 **Crisis Event Generator** (`server_scripts/world/crisis_events.js`) — random crisis spawns with response tracking
- 🔵 **Player-Triggered Event Hooks** (`server_scripts/world/player_events.js`) — fires events on quest completion, milestone reach, location entry
- 🔵 **Location State Manager** (`server_scripts/world/location_states.js`) — tracks Pristine/Active/Ruined/Hidden/Contested/Restored states per location

#### KubeJS Startup Scripts

- 🔵 **Festival Items** (`startup_scripts/items/festival_items.js`) — limited-time cosmetics, festival foods, commemorative items
- 🔵 **Eclipse-Bound Items** (`startup_scripts/items/eclipse_items.js`) — Eclipse Shard and crafted gear
- 🔵 **Encounter NPC Templates** (`startup_scripts/npcs/encounter_templates.js`) — defining the random encounter NPC pools

#### Datapacks

- 🔵 **Custom Structure Files** (`data/horizons/worldgen/structure/`) — JSON definitions for all hand-built structures
- 🔵 **NBT Structure Library** (`data/horizons/structures/`) — the actual NBT files exported from creative
- 🔵 **Biome Tag Modifications** (`data/horizons/tags/worldgen/biome/`) — defining where structures can spawn
- 🔵 **Festival Structure Templates** (`data/horizons/structures/festivals/`) — temporary festival decorations
- 🔵 **Encounter Pool Definitions** (`data/horizons/encounters/`) — JSON pools for random encounter weighting
- 🔵 **World Event Definitions** (`data/horizons/world_events/`) — JSON for each server-wide event

### New Game Stages

```
horizons:location_discovered_<id>           # one per Famous Location
horizons:festival_active_<id>               # active festival flag
horizons:world_event_active_<id>            # active world event flag
horizons:encounter_cooldown                 # global per-player cooldown
horizons:famous_location_<id>_visited       # achievement-style discovery
horizons:hidden_location_unlocked_<id>      # Ascended-class secret unlocks
```

### NBT Structure Workflow

For hand-built structures, the workflow is:

1. **Build in creative test world** — set up a flat world with all Horizons mods, build the structure
2. **Add structure block** — place a structure block, set to Save mode, configure name and bounds
3. **Save** — the NBT file goes to `world/generated/<namespace>/structures/`
4. **Move to dev project** — copy the NBT to `data/horizons/structures/<category>/<name>.nbt`
5. **Create JSON definition** — write the structure JSON in `data/horizons/worldgen/structure/`
6. **Configure spacing** — write a structure_set JSON to control placement frequency
7. **Test in fresh world** — generate a new world, fly around, verify the structure spawns correctly
8. **Iterate** — adjust as needed

For T4 and T5 structures, this workflow is more involved, often requiring multiple structure blocks to handle large multi-piece builds.

### Estimated Build Effort

- **T1 structures (150):** ~30 minutes each = 75 hours
- **T2 structures (80):** ~2 hours each = 160 hours
- **T3 structures (30):** ~6 hours each = 180 hours
- **T4 structures (15):** ~3 days each = ~360 hours
- **T5 structures (5):** ~2 weeks each = ~400 hours
- **Total structure build:** ~1175 hours (significant — the biggest single time sink in the project)

For an MVP: build only T1-T3 (415 hours, ~3 months part-time) and treat T4-T5 as post-launch additions.

For events:
- Random encounter system: ~40 hours
- Calendar + festivals: ~20 hours per festival × 12 = 240 hours
- World events: ~10 hours per event × 11 = 110 hours
- Crisis events: ~15 hours per type × 8 = 120 hours
- **Total event build:** ~510 hours

For locations:
- Famous Locations registry: ~10 hours
- Discovery tracking: ~10 hours
- Per-location metadata: ~30 minutes per location × 130 = 65 hours
- **Total location build:** ~85 hours

**Grand total realistic effort:** ~1770 hours (~11 months part-time, ~5 months full-time)

This is the **largest single subsystem** in Project Horizons. Plan accordingly.

---

## 10. Build Priority

Spread across all phases of the main roadmap.

### Phase 1 — Foundation (Weeks 1-2)

- [ ] Build Anchor Town spawn area (T4 structure, ~7 days dedicated)
- [ ] Famous Locations registry KubeJS infrastructure
- [ ] Calendar system stub (Aetheria months and seasons defined)
- [ ] First random encounter type working (Wandering Merchant)
- [ ] Discovery event for Anchor Town

### Phase 2 — Core Systems (Weeks 3-5)

- [ ] Build first 10 T1 structures (random ruins, camps, hermit shrines)
- [ ] Build Willowmere (T3, ~2 days)
- [ ] Random encounter scheduler with 5 encounter types
- [ ] First scheduled festival (First Bloom Festival)
- [ ] First world event (Meteor Shower)
- [ ] Location state manager
- [ ] 20 Famous Locations entered in registry

### Phase 3 — World Building (Weeks 5-8)

- [ ] Build all 6 capital cities (4 T4 + 2 T3)
- [ ] Build 30+ T1-T2 structures across biomes
- [ ] All 12 festivals defined and triggering on calendar
- [ ] 15 random encounter types implemented
- [ ] 5 world events implemented
- [ ] Crisis event system working with 4 crisis types
- [ ] All Famous Locations registry entries (130+) populated

### Phase 4 — Deep Content (Weeks 8-12)

- [ ] Build all T4 signature structures (Heartwood Tree, Sky Cathedral, Sunken Cathedral, etc.)
- [ ] Build remaining T2 structures (target: 80 total)
- [ ] All 11 world events implemented
- [ ] Player-triggered event hooks complete
- [ ] Location state transitions working (Pristine → Ruined → Restored)
- [ ] Hidden Locations placed (15)
- [ ] All ascension trial sites built and accessible

### Phase 5 — Polish (Weeks 12-16)

- [ ] Build T5 mythic structures (Hidden Library, Sky Archive, Garden of First Light)
- [ ] Festival cosmetics polished
- [ ] Eclipse-Bound gear set complete
- [ ] Encounter pool weighting tuned for biome/faction/time
- [ ] Discovery cinematic effects polished
- [ ] World event balance pass

### Phase 6 — Post-Launch (Ongoing)

- [ ] Remaining T1 structures filling out worldgen variety
- [ ] New seasonal events for special occasions
- [ ] Anniversary world events
- [ ] Community-suggested locations and structures
- [ ] Player-founded location auto-registration system
- [ ] Server-specific events (admin tools)

---

## 11. Why This System Matters

The World System is what separates Project Horizons from a "really good modpack" and makes it a *place*.

**Without it:**
- Players experience random worldgen with cool dungeons
- They complete quests in a featureless landscape
- Events happen because something procedural rolled
- The world is forgotten the second they log off

**With it:**
- Players experience a hand-built world with named landmarks
- Quests happen at places players can give directions to
- Events follow a calendar everyone learns to anticipate
- The world is remembered, talked about, missed when they're away

The Famous Locations Registry alone — 130+ named places with lore, NPCs, and history — is what makes Aetheria feel **bigger than the player**. The Eclipse World Event is what makes it feel **alive**. The Heartwood Tree is what makes it feel **sacred**.

This is the system that gets players to log back in tomorrow, not because they want loot, but because they want to be in Aetheria again.

---

*World System v1 — companion to all other Horizons documents*
*~280 structures across 5 tiers · 130 Famous Locations · 50+ events · 1 living world*
*This is the system that makes Aetheria a place.*
