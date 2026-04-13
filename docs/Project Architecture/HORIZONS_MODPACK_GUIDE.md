# Project Horizons — Modpack Guide

**The master document. Read this first.**

> This is the navigation hub for Project Horizons. It tells you what the pack is, why it exists, where to find information, how to build it, and how to ship it. Every other document in this project supports this one.

---

## 1. What Is Project Horizons?

**Project Horizons** is an anime-adventure Minecraft modpack built on **NeoForge 1.21.1**. It combines Cobblemon, Create, Stellaris, deep farming, Solo Leveling–inspired infinite dungeons, and a Stardew-style life sim into one cohesive 200+ hour SMP experience.

**Tone:** Star Trek meets Pokémon meets Stardew, with a Ghibli / Frieren visual and emotional aesthetic.

**Target audience:** Small-to-medium SMP communities (4-16 players) who want a modpack with genuine depth in both combat and peaceful play. Not a kitchen-sink pack. Not a skyblock. A handcrafted world with two equally deep pillars of content and a player-driven economy that ties them together.

**Core promise:** Every player should be able to pick any path through this pack and find 200+ hours of meaningful, non-repetitive gameplay that feels personal.

### The One-Paragraph Pitch

You arrive in Aetheria, a world built by a civilization that vanished into the stars. Your first days are spent learning to eat, drink, and survive. Your first months are spent choosing a path: will you descend into the ancient Gates beneath the earth, or tend a vineyard on a hillside? Will you battle trainers and gym leaders, or make friends with a Bulbasaur who helps you farm? Will you build a rocket and reach the Moon, or build a manor and raise a kingdom? The world doesn't care which you choose. It rewards depth in all directions. Your companions — some caught in tall grass, some hired as farmhands — grow with you. Your reputation spreads. Eventually you'll hear travelers in distant kingdoms telling stories about your wines, or your battles, or your rocket, or all three.

---

## 2. Document Index

This project contains several documents. Read them in this order depending on your role.

### For Orientation (read first)

| Document | Purpose | When to read |
|---|---|---|
| **`HORIZONS_MODPACK_GUIDE.md`** *(this file)* | Master navigation, philosophy, roadmap | **First. Always.** |
| **`PROJECT_HORIZONS_v3_GDD.md`** | Full game design document — 5 acts, all systems, narrative | After this guide, to understand the vision |

### For Building

| Document | Purpose | When to read |
|---|---|---|
| **`HORIZONS_SERVER_MODS.md`** | Complete server-side mod list, ~110 mods + 27 custom systems | Before installing anything |
| **`HORIZONS_CLIENT_MODS.md`** | Client enhancement mods, rendering pipeline, shader packs | Before configuring client profiles |
| **`HORIZONS_INTEGRATIONS.md`** | All 57 custom KubeJS/datapack/resource pack systems | When building the pack itself |
| **`HORIZONS_LIVING_WORLD.md`** | The Peaceful Pillar — farming, nutrition, colonies, villagers | Before designing Phase 3+ content |
| **`HORIZONS_QUEST_SYSTEM.md`** | Full quest system — main quest, side chains, tutorials, branching, crime/bounty | Before building any quest content |
| **`HORIZONS_ASCENSION_SYSTEM.md`** | Late-game reclass system — 10 Ascended Classes, 10 Shadow Variants, trials, lore | Before designing endgame content |
| **`HORIZONS_WORLD_SYSTEM.md`** | Custom structures, Famous Locations, Aetheria calendar, events, encounters | Before building any structures or events |

### For Reference

| Document | Purpose | When to read |
|---|---|---|
| **`PROJECT_HORIZONS_INTEGRATION_BIBLE.md`** | Deep integration philosophy | When stuck on how two systems should talk |
| **`PROJECT_HORIZONS_GDD.md`** / **`v2_GDD.md`** | Earlier GDD iterations | Historical reference only |

### Stretch Goal (not yet built)

- **`HORIZONS_LORE.md`** — Precursor civilization backstory, cultural details, NPC bios
- **`HORIZONS_PLAYER_GUIDE.md`** — Shippable player-facing manual for the launched pack
- **`HORIZONS_ADMIN_GUIDE.md`** — Server operator setup and maintenance guide

---

## 3. Core Philosophy

### The Two Pillars

Project Horizons is built on two equally deep pillars:

**🗡️ The Adventure Pillar**
- Solo Leveling–inspired infinite Gates
- Cobblemon battles, gym challenges, Elite Four
- Space exploration via Stellaris (Moon, Mars, custom planets)
- Combat progression through Better Combat + magic + artifacts
- Boss encounters and raid content

**🌾 The Living Pillar**
- Deep farming with 8-group nutrition system
- Wine, beer, and spirit brewing with quality tiers
- MineColonies farmhands paired with Cobblemon partners
- Village Evolution from Hamlet → Kingdom
- Kingdom currencies, trade routes, diplomatic relations
- Water/thirst system with Tough As Nails

Both pillars use the same world, the same economy, the same Cobblemon system, and the same kingdoms. They simply interact with these systems differently. **A player can ignore either pillar entirely and still have 200+ hours of content.**

### Design Principles

These govern every decision. When in doubt, return here.

**1. Behavioral integration over surface integration.**
The gold standard is emergent behavior across systems, not just crafting recipes. A Klink that becomes a Create gear is better than a recipe that uses Klink parts. An Alakazam that links two storage nodes is better than a "teleport scroll" recipe. If two mods can share *behavior*, make them.

**2. Every path has a non-Cobblemon alternative.**
Cobblemon is optional. A player should be able to complete the entire main quest without ever catching a Pokémon. Every gate locked behind Cobblemon must have a mechanical alternative (maybe slower, maybe costlier, but never blocked).

**3. Depth over breadth.**
Fewer mods, used deeply, is always better than more mods used shallowly. We reject mods that overlap without integrating. Mekanism, Thermal, and Tinkers don't make the cut because Create + IE + Better Combat already cover their ground with better story integration.

**4. Never feel artificial.**
If a system feels like "a number going up," it's failed. Nutrition shouldn't be "eat different foods to not die" — it should be "eat variety because it feels right and the buffs reflect what you actually ate." Kingdoms shouldn't be "scoreboard ticks to level 5" — they should feel like they grew because you invested in them.

**5. The world persists.**
Villages remember players. Famous Villagers gain reputation. Trade routes develop history. When you leave an area, it shouldn't reset. This is an SMP pack — the world should feel lived-in across player sessions.

**6. Peaceful is not easy.**
Farming, brewing, colony management, and diplomacy should be as demanding and rewarding as combat. Don't build the peaceful pillar as "the easy mode." Build it as "a parallel mastery."

**7. Pure NeoForge, no hybrid.**
No Arclight, no Mohist, no Sinytra in production. If a mod is Fabric-only, we don't use it. This keeps the stack stable and predictable.

### Non-Goals

Things Project Horizons explicitly *will not* do:

- ❌ Not a kitchen-sink pack (no "1000 mods for the sake of it")
- ❌ Not skyblock, not hardcore, not lootbox
- ❌ Not 100% vanilla-friendly — mods WILL reshape the game
- ❌ Not for pure solo players who want quick completion
- ❌ Not compatible with OptiFine or any legacy rendering stack
- ❌ Not on Minecraft versions other than 1.21.1 (for now)

---

## 4. Development Roadmap

Six phases from zero to shippable pack. Estimated 16 weeks of focused part-time work, more if solo.

### Phase 1 — Foundation (Weeks 1-2)

**Goal:** Mod list boots cleanly, basic custom scripts running, Act 1 playable.

- Install all 110+ mods, verify clean boot
- Spark profiling baseline
- Basic KubeJS scripts: recipe bridges, food quality stubs, nutrition tags
- Cobblemon spawn datapacks for starter biomes
- FTB Quests Act 1 skeleton (10 quests)
- Lightman's Currency baseline configuration
- Tough As Nails thirst values
- **Exit criteria:** New player can log in, survive their first night, eat and drink, complete the first quest

### Phase 2 — Core Systems (Weeks 3-5)

**Goal:** Signature systems playable in prototype form.

- Companion interactions v1 (5 types)
- Trust/Fatigue baseline
- Gate System with 10 floor templates and 1 boss
- Kingdom currency items
- Pathfinder leveling with perk tree stubs
- Full nutrition system (all 8 groups + buffs)
- Thirst integration (beverages, Cobblemon water)
- **Exit criteria:** Player can descend into a Gate, fight on a scaled floor, exit, cook a varied meal, and see Well Fed apply

### Phase 3 — World Building (Weeks 5-8)

**Goal:** The world feels handcrafted and alive.

- Anchor Town spawn build with story NPCs
- 8 Gym structures with Custom NPC leaders
- Village evolution templates (5 biomes × 4 stages)
- Custom planet datapacks
- First Create train caravan route
- Ancient Form resource pack v1
- MineColonies worker integration + Pokémon pairing
- Radical Cobblemon Trainers configuration
- **Exit criteria:** Player can hire a MineColonies Farmer with a Bulbasaur, see them working, and visit a nearby Village that reacts to their presence

### Phase 4 — Deep Content (Weeks 8-12)

**Goal:** Full playthrough content ready.

- 50+ dungeon floor templates (all theme bands)
- Gate System complete (anchors, bosses, Floor 100)
- All companion interactions (remaining types)
- FTB Quests Acts 2-5 + all side chains
- Full caravan and trade route system
- Automated Village Evolution triggers
- Deep farming (soil quality, quality tiers in brewing)
- Farming skill tool tiers
- Villager Needs System
- Farm-Bound Cobblemon with Companion Huts
- Traveling NPC schedules
- Cultivator's Path quest chain
- **Exit criteria:** A player can complete the main questline end-to-end, and a peaceful player can go from Hour 1 to Hour 100 without combat

### Phase 5 — Polish (Weeks 12-16)

**Goal:** Shippable pack.

- Resource pack complete (UI, items, skyboxes, music)
- Price fluctuation economy
- Death penalty full implementation
- Spark profiling pass, TPS optimization
- Stress test with 4-8 players
- Player guide and admin docs
- CurseForge packaging (server + client variants)
- Greenhouse & Cellar multiblocks
- Nutrition HUD polish
- **Exit criteria:** The pack runs at 20 TPS with 8 players online for 4+ hours without memory leaks or crashes

### Phase 6 — Post-Launch (Ongoing)

**Goal:** Living pack. Grows with the community.

- S-Rank Gates infinite scaling
- Seasonal events (tournaments, festivals, harvest celebrations)
- Precursor lore expansion
- Optional Java mod extraction for complex blocks
- Additional planets and dimensions
- Community content integration

---

## 5. Build Order — Where to Start

You're sitting at a fresh NeoForge 1.21.1 dev environment. What do you do first?

**The correct first step is NOT installing mods.** It's setting up the project structure.

### Step 0: Project Structure

Create this directory layout on disk. Every file goes in a clear place.

```
project-horizons/
├── docs/                         # All .md files from this project
│   ├── HORIZONS_MODPACK_GUIDE.md
│   ├── HORIZONS_SERVER_MODS.md
│   ├── HORIZONS_CLIENT_MODS.md
│   ├── HORIZONS_INTEGRATIONS.md
│   ├── HORIZONS_LIVING_WORLD.md
│   └── PROJECT_HORIZONS_v3_GDD.md
├── server/                       # The dev server instance
│   ├── mods/                     # Server-side jars
│   ├── config/                   # All mod configs
│   ├── defaultconfigs/           # Per-world defaults
│   ├── kubejs/                   # Custom scripting
│   │   ├── startup_scripts/
│   │   ├── server_scripts/
│   │   └── client_scripts/
│   ├── world/                    # Dev world (gitignored)
│   └── logs/                     # Crash logs
├── datapacks/                    # Source datapacks (built to server/world/datapacks)
│   ├── horizons-dimensions/
│   ├── horizons-structures/
│   ├── horizons-cobblemon/
│   └── horizons-tags/
├── resourcepack/                 # Client-side resource pack source
│   ├── assets/
│   └── pack.mcmeta
├── schematics/                   # MineColonies custom blueprints
└── tools/                        # Helper scripts (structure exporters, etc.)
```

### Step 1: Minimum Viable Boot

1. Install NeoForge 1.21.1 server
2. Install only the libraries (15-20 mods from the Libraries section)
3. Boot the server, confirm no crashes
4. Add KubeJS alone
5. Boot again, confirm KubeJS is registering

### Step 2: Add the Foundation

In this exact order, to isolate any issues:

1. Create + Create addons
2. Cobblemon + its dependencies
3. Terralith + Tectonic
4. FTB Library, Quests, Teams, Chunks
5. Lightman's Currency
6. Tough As Nails
7. Farmer's Delight + the Let's Do suite

Boot after each addition. If something crashes, you know what caused it.

### Step 3: Add the Rest

Add remaining mods in logical groups (dungeons, combat, building, performance). Boot after each group.

### Step 4: First Custom Script

Your first KubeJS script should be the **simplest possible test**. Not a major system. Just proof the pipeline works:

```js
// kubejs/server_scripts/test.js
PlayerEvents.loggedIn(event => {
  event.player.tell('Welcome to Project Horizons!')
})
```

If this works, the scripting pipeline is alive. Build from there.

### Step 5: First Real System

The natural first real system is the **Cross-Mod Recipe Bridge** (`cross_mod_bridges.js`). Why?

- It surfaces mod compatibility issues early
- It validates the KubeJS recipe API
- It's foundational for everything else
- If it works, 80% of custom content work is unblocked

After the bridge works, build Nutrition next. It's the second-lowest-risk system and enables a huge amount of downstream content.

---

## 6. Dev Setup

### Required Tooling

- **JDK 21** (GraalVM CE recommended for performance)
- **Git** for version control
- **VS Code** or **IntelliJ IDEA** with the following extensions:
  - JavaScript / TypeScript support (for KubeJS autocomplete via generated `probe` output)
  - Minecraft JSON schema support
  - NBT viewer plugin
- **CurseForge App** or **Prism Launcher** for testing the client side
- **Spark** (the mod) for profiling
- A local server instance separate from the CurseForge install

### Recommended Hardware for Dev

- 16 GB RAM minimum (32 GB recommended if running client + server locally)
- SSD for world storage
- Dual monitors highly recommended — code on one, Minecraft on the other

### Git Strategy

- Initial commit: project structure + documentation
- Branch per Phase (`phase-1-foundation`, `phase-2-core-systems`, etc.)
- Commit after every working script addition
- Tag releases per Phase completion (`v0.1-foundation`, `v0.2-core`, etc.)
- **Gitignore:** `world/`, `logs/`, `crash-reports/`, `.fabric/`, `.mixin.out/`
- **Do commit:** `config/`, `defaultconfigs/`, `kubejs/`, `datapacks/`, `resourcepack/`, `schematics/`

---

## 7. Testing Strategy

You cannot ship this pack without testing. Testing is Phase 5, not "something you do at the end."

### Unit Testing (per system)

Every custom KubeJS system needs a **minimum test scenario** documented:

- Nutrition: "Eat a bread, score should rise, then decay by 1 per day"
- Thirst integration: "Drink a wine, thirst rises, Tipsy applies"
- Gate system: "Enter portal, arrive on floor 1, mobs scale, descent pad teleports"
- Cobblemon worker: "Assign Bulbasaur to Farmer, yield increases by 25%"

Write these down. Run them manually after each change.

### Integration Testing

Some tests require multiple systems working together:

- "Brew a Legendary wine → eat varied meals → achieve Gourmet state with the wine as beverage tag"
- "Descend Gate to floor 10 → boss drops rare seed → plant in Greenhouse → harvest Legendary crop"

These validate that systems talk to each other correctly.

### SMP Stress Testing

Before launch, run at least two full 4+ hour sessions with target player count (4-8 players). Watch for:

- TPS drops (Spark can identify culprits)
- Memory leaks (monitor server RAM over time)
- Chunk loading issues (pre-gen with Chunky before testing)
- Desync between players
- Custom NPC and MineColonies AI pathfinding lag

### Performance Targets

- **20 TPS** sustained with 8 players online
- **60+ FPS** on Pathfinder-preset hardware with shaders
- **< 20 GB server RAM** usage at steady state
- **< 10 second** chunk load when exploring new areas

---

## 8. Distribution Strategy

### Two-Pack Approach

Project Horizons ships as **two CurseForge packs**:

**1. Project Horizons (Server Pack)**
- Contains all server-side mods + custom systems
- Players download this to connect
- Includes minimal client-side assets
- The actual game experience

**2. Project Horizons: Enhanced Client *(optional)***
- Pure client-enhancement pack
- Rendering pipeline (Sodium + Iris)
- Performance mods (ModernFix, FerriteCore, etc.)
- Visual enhancements (Distant Horizons, Ambient Sounds, etc.)
- QoL mods (inventory management, JourneyMap, etc.)
- Includes documentation for hardware presets (Pathfinder / Explorer / Survivor)

**Why two packs?** This lets players run the pack on weaker hardware without forcing expensive client mods, while still offering the full experience to those who want it.

### Server Distribution

- Primary host: CurseForge (official modpack)
- Secondary: self-hosted `.zip` on project GitHub for people who prefer Prism
- Server software: vanilla NeoForge 1.21.1 server files bundled with mods + configs
- World save: ship with a pre-generated spawn area (Anchor Town pre-built)

### Update Cadence

- **Hotfixes:** within 48 hours of crash-level bugs
- **Minor updates:** every 2-4 weeks during live operation
- **Major updates:** every 3-6 months adding new content

Always ship with changelogs. Always test on a staging server before production.

### Documentation for Players

Ship the pack with:

- **`README.md`** — 1-page pack introduction
- **`CHANGELOG.md`** — all updates with dates
- **`KNOWN_ISSUES.md`** — current bugs and workarounds
- In-game: FTB Quest chapter zero that walks the player through core systems

---

## 9. Glossary

Terms used throughout this project's documentation.

| Term | Meaning |
|---|---|
| **Pack** | Project Horizons itself |
| **Server mods** | Mods installed on the server (mandatory for players) |
| **Client mods** | Optional player-installed mods for performance/visuals/QoL |
| **Adventure Pillar** | Combat, dungeons, space, Cobblemon battles |
| **Living Pillar** | Farming, brewing, colonies, life sim |
| **Gate** | A Solo Leveling-style infinite dungeon instance |
| **Floor** | A single level within a Gate |
| **Theme Band** | A group of floors sharing aesthetic theme (Foundations, Shift, Deep, Abyss, Core) |
| **Boss Floor** | Every 10th floor, hand-designed boss arena |
| **Respawn Anchor** | Gate checkpoint every 10 floors |
| **Companion** | A Cobblemon player has caught and uses for world interactions |
| **Farm-Bound** | A Cobblemon assigned to a Companion Hut, stays on the farm persistently |
| **Worker** | A MineColonies NPC hired by a player |
| **Farmhand** | Colloquial for Worker in Horizons context |
| **Trust** | Per-Pokémon relationship depth (0-1000, beyond vanilla friendship) |
| **Fatigue** | Per-Pokémon work exhaustion (0-100) |
| **Soulbound** | Trust tier 800+ Pokémon with visible prestige effects |
| **Quality Tier** | Food/drink quality level (Table / Fine / Grand Cru / Legendary) |
| **Nutrition Group** | One of 8 food categories tracked by the Nutrition System |
| **Gourmet State** | Highest nutrition tier — all 8 groups above 70 + Legendary in last day |
| **Kingdom** | Named NPC settlement at City+ evolution tier |
| **Prosperity** | Village scoreboard tracking economic health |
| **Caravan** | Create train configured as kingdom trade route |
| **Precursor** | The vanished civilization whose artifacts enable endgame tech |
| **Warp Anchor** | Fast-travel network block (multi-tier) |
| **Trainer** | RCT (Radical Cobblemon Trainers) NPC |
| **Famous Villager** | Named Custom NPC with reputation and unique questline |
| **Game Stage** | Progression gate tag that locks/unlocks content |
| **Pathfinder XP** | Player leveling system separate from vanilla XP |
| **Perk Tree** | Vanguard / Artificer / Cultivator / Wayfinder — four progression trees |
| **🔵 marker** | Custom-built system (not installed mod) |
| **🆕 marker** | Addition from the Living World expansion |
| **KubeJS** | JavaScript scripting mod — our primary custom content tool |
| **LootJS** | KubeJS addon for loot table manipulation |
| **SMP** | Survival Multiplayer (the target playstyle) |
| **Pure NeoForge** | No hybrid server software, Fabric bridges, or Sinytra |

---

## 10. Decision Log

Major decisions made during design, and why. Refer here before second-guessing.

### Why NeoForge 1.21.1?

- Most actively maintained version as of 2026
- Cobblemon, Create, MineColonies, Stellaris all have stable NeoForge 1.21.1 ports
- Iris shaders officially supported on NeoForge 1.21.1+
- 1.21.4+ versions have too few mods updated yet
- 1.20.1 is fading — too many mods moving forward

### Why Stellaris over Galacticraft or Ad Astra?

- Galacticraft is effectively dead on 1.21.1
- Ad Astra has no NeoForge 1.21.1 release
- Stellaris is the only actively maintained space mod with Cobblemon compatibility patches

### Why Sodium + Iris over Embeddium + Oculus?

- Iris now officially supports NeoForge 1.21.1+ (as of late 2024)
- Sodium/Iris pipeline gets faster updates
- Embeddium/Oculus still works but is one generation behind
- Embeddium pipeline remains listed as Path B for maximum compatibility

### Why Distant Horizons over Voxy?

- Voxy is Fabric-native; NeoForge port is alpha-quality
- Voxy has no server-side LOD streaming (critical for SMP)
- Voxy has severely limited shader compatibility (kills our Ghibli aesthetic)
- Voxy has problems with custom dimensions (we have 13+)
- DH works with Complementary Reimagined, our primary shader

### Why MineColonies instead of building farmhands from scratch?

- Mature, well-maintained, proven on NeoForge 1.21.1 (v1.1.1269)
- 81M+ downloads — community support
- Already has all the worker types we need
- Customizable via schematics and config
- The alternative (custom KubeJS farmhands) would take months

### Why Radical Cobblemon Trainers instead of only Custom NPCs?

- RCT ships with 1500+ trainers out of the box
- Progression-gated difficulty already built in
- Custom NPCs would require us to hand-build every trainer
- RCT is actively maintained on NeoForge 1.21.1 (v0.17.7)
- Custom NPCs still handles our story characters — RCT fills the wandering population

### Why two-pack distribution (Server + Enhanced Client)?

- Lets players on weak hardware join without mandatory client mods
- Separates "game experience" from "player preferences"
- Easier to update client-only things without pushing server restarts
- Precedent: successful packs like RLCraft and ATM10 use similar approaches

### Why 8 food groups for nutrition instead of 5 or 10?

- 5 felt too shallow (grains, proteins, fruits, dairy, junk — boring)
- 10 was too complex (food researchers use 10+, but that's overwhelming in gameplay)
- 8 hits the sweet spot: enough variety to matter, few enough to track
- Matches the classical "food pyramid" with beverages broken out

### Why KubeJS instead of a custom Java mod first?

- KubeJS covers 90% of our needs at 10% of the development time
- Iteration is faster (no compile cycle)
- Can be written and tested by non-Java developers
- Java mod can be built later for the 10% KubeJS can't handle
- Shipping an MVP in KubeJS lets us ship faster, iterate based on real play

### Why cap Pathfinder levels at 100 per tree?

- Specialization matters — forces meaningful choices
- 100 is a mentally satisfying round number
- Prevents infinite scaling that trivializes content
- 100 × 4 trees = 400 total possible levels, enough for long-term goals

### Why 15% currency drop on death, not inventory loss?

- Hardcore inventory loss kills SMP engagement
- Pure mechanics like XP loss are too abstract
- 15% currency is punishing enough to feel bad
- Physical coin drop retrievable = tension without total loss
- Ties directly into the economy pillar

---

## 11. Next Steps for This Project

If you're picking this up fresh, here's what to do this week:

1. **Read the full GDD** (`PROJECT_HORIZONS_v3_GDD.md`)
2. **Read the Living World doc** (`HORIZONS_LIVING_WORLD.md`)
3. **Set up the project directory** per Section 5, Step 0
4. **Install Phase 1 Foundation mods** per Section 4
5. **Write the "hello world" KubeJS script** per Section 5, Step 4
6. **Start on `cross_mod_bridges.js`** per Section 5, Step 5

If you're stuck:

- Check the **Decision Log** (Section 10) — you might find the answer
- Check **`HORIZONS_INTEGRATIONS.md`** for the specific custom system design
- Check the **"What Goes Where" cheat sheet** in Integrations Section 7
- If it's a design question, return to the **Design Principles** in Section 3

---

## 12. Final Thoughts

Project Horizons is ambitious. 110+ mods, 27 custom systems, 200+ hour playthrough, dual pillars, SMP stability, original music, custom dimensions, deep integration.

**It is also achievable.** None of the individual pieces are unprecedented — modpacks at this scale exist. What makes Horizons different is the cohesion: every system talks to every other system, every player path is first-class, every decision is documented.

**The risk is scope creep.** Every phase will tempt you to add "just one more thing." Resist. Ship Phase 5 on time. Post-launch is when you add more, not before.

**The reward is a world players will remember.** That's worth the work.

---

*Project Horizons Modpack Guide v1*
*Companion to all other Horizons documents*
*NeoForge 1.21.1 · Pure NeoForge · Two Pillars · One World*
