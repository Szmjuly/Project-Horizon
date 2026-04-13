# PROJECT HORIZONS v3 — COMPLETE REBUILD
## NeoForge 1.21.1 Game Design Document
### *"Every floor deeper. Every star further. Every companion closer."*

---

# I. VISION

## What This Actually Is

Project Horizons is an **anime-adventure modpack** that transforms Minecraft into a living, layered world where every system breathes into every other system. It isn't a kitchen sink with a quest book stapled on. It's a handcrafted experience where a player can spend 200+ hours farming grapes on a hillside vineyard, breeding rare Pokémon for trade, delving into a 100-floor dungeon, launching rockets to custom planets, and establishing trade caravans between rival kingdoms — and none of those activities exist in isolation.

**The feeling:** You're watching Frieren walk through ancient ruins and feel the weight of centuries. You're watching Solo Leveling's Sung Jin-Woo descend another floor and feel the tension rise. You're watching Ash arrive in a new region and feel possibility everywhere. You're playing Stardew Valley's first spring morning and feel peace. **All of these feelings, in one world, at different moments.**

## The Emotional Spectrum

| Moment | Feeling | Inspiration |
|--------|---------|-------------|
| Tending your vineyard at sunset while your Leafeon rests nearby | Warm peace | Stardew Valley, Spice & Wolf |
| Floor 47 — the walls turn to glass and you see stars below you | Awe, vertigo | Solo Leveling gates, Made in Abyss |
| Your first rocket breaking atmosphere, music fading to silence | Earned wonder | Interstellar, Star Trek |
| Walking into a kingdom you helped grow from a nameless village | Pride, belonging | Frieren, Dr. Stone |
| Your Alakazam teleporting supplies across your trade route | Companionship | Pokémon journeys, Isekai party dynamics |
| A dungeon floor themed as a sunlit meadow... with something wrong | Beautiful unease | Hunter x Hunter, Elden Ring |

## Design Pillars

1. **The World Is Alive** — Villages grow into kingdoms. Dungeons shift. Pokémon migrate. NPCs remember you. Nothing is static.

2. **Depth Over Breadth** — Every system goes deep. Farming isn't "plant wheat, harvest wheat." It's soil quality, grape varietals, fermentation timing, barrel aging, vintage labeling, and selling wine to a kingdom that values it.

3. **Everything Integrates Through Behavior** — Not just recipes. A Machamp physically moves heavy blocks. An Alakazam links two points in space. A Klink literally becomes a gear mechanism. Mods don't coexist — they interlock.

4. **Earned Power** — Progression is vertical AND horizontal. You get stronger (levels, perks, gear) but also wider (new dimensions, new kingdoms, new dungeon types, new Pokémon).

5. **Consequences That Matter** — Death costs something real. Reputation shifts. Kingdom relationships change. Deep dungeon floors don't forgive. But failure is a setback, not an ending.

6. **The Anime Arc** — Every player unconsciously follows the hero's journey: humble beginnings → discovery → first real challenge → growth through adversity → mastery → legacy.

---

# II. SETTING & WORLD IDENTITY

## The Seed Story

Three generations ago, **The Dimming** severed the connection between Earth and its colony worlds. Communication arrays went dark. Warp gates collapsed. Your world — **Aetheria** (the Overworld) — survived, stabilized, and rebuilt. Life is good, if small.

Now: strange signals bleed through the old arrays. Alien creatures (**Cobblemon**) appear in biomes where they've never been. In deep caves, explorers find technology predating the colony by millennia. **You are a Pathfinder.** Explore. Build. Connect. Reignite the network that links the stars.

**This is not post-apocalyptic. It's post-golden age.** The sun is warm, fields are green, but there are doors underground that no one can open and signals from the sky that no one can read.

## Dimensional Identity

| Dimension | Lore Identity | Gameplay Role | Tone |
|-----------|--------------|---------------|------|
| **Overworld (Aetheria)** | Colony world, post-frontier | Home, farming, building, early-mid game | Warm, pastoral, Ghibli |
| **The Nether (The Breach)** | Failed warp experiment | Industrial resources, danger, mid-game | Tense, alien, industrial |
| **The End (The Archive)** | Precursor ruins | Lore discovery, endgame materials | Mysterious, serene, vast |
| **Moon (Luna Station)** | Abandoned relay station | First space destination | Quiet, awe, loneliness |
| **Mars (Ferros)** | Automated mining world | Industrial space resources | Red, harsh, productive |
| **Venus (Veyla)** | Overgrown greenhouse | Rare botanical/Cobblemon resources | Lush, dangerous, beautiful |
| **Europa (Thalassa)** | Ice moon, subsurface ocean | Underwater exploration | Deep, pressured, alien |
| **Titan (Murkmire)** | Methane swamp moon | Exotic chemicals, organic fuels | Low visibility, eerie |
| **The Forge (asteroid)** | Volcanic micro-world | Pure metals, magma crystals | Extreme heat, mining focus |
| **Elysium** | Precursor paradise | Endgame reward planet | Beautiful, peaceful, mythical |
| **The Between** | Warp space | Fast-travel dimension (traversal) | Void, geometric, liminal |
| **The Deep** | Below bedrock | Accessed from deepest dungeon floors | Inverse gravity, crystalline, bioluminescent |
| **Gate Dimensions** | Dungeon pocket worlds | Floor-based dungeon instances | Shifts per floor band |

## Visual Language

**Overworld:** Terralith lush biomes + Tectonic continental terrain. Golden light, long shadows, Studio Ghibli pastoral. Villages feel organic and lived-in.

**Dungeons (Gates):** Each floor is a self-contained biome. Early floors: mossy stone, torchlight. Mid floors: underwater corridors, frozen caverns, volcanic forges. Deep floors: floating islands in void, meadows with wrong-colored sky, crystalline labyrinths. Deepest floors: geometry warps, lighting inverts, reality fragments.

**Space:** Silence. HUD simplifies. Music drops to ambient drone. Each planet has a strong color identity and unique skybox.

**Kingdoms:** Visual identity based on biome specialization. Plains kingdom: stone walls, banners. Forest kingdom: elevated walkways, tree-integrated. Desert: sandstone, underground bazaars. Mountain: terraced walls, forge chimneys.

## Audio Direction

- Overworld: Acoustic guitar, flute, gentle piano — Stardew meets Ghibli
- Dungeons: Atmospheric → rhythmic as floors deepen → orchestral for bosses
- Space: Near-silence with distant radio static and occasional swelling strings
- Kingdoms: Cultural music per kingdom — market bustle, forge hammering, bells
- Combat: Tempo increase, percussion — anime battle energy without being jarring
- **Transitions between zones must be seamless, never jarring cuts**

---

# III. CORE SYSTEMS

## System 1: Player Leveling & Perks

Players gain **Pathfinder XP** through all activities — not just combat.

**XP Sources:** Exploring new chunks, completing quests, dungeon floor completion (scaling), crafting new recipes for the first time, Cobblemon captures/battles, farming harvests, trade volume, kingdom advancement milestones.

**Implementation:** PlayerEx or LevelZ + KubeJS + Game Stages hybrid

### Four Perk Trees (invest freely across all):

**🗡 Vanguard (Combat):** Damage bonuses, dungeon loot quality, boss resistance, deep floor endurance. Capstone: "Gate Breaker" — open Mythic-tier dungeon gates.

**⚙ Artificer (Crafting):** Faster Create processing, bonus output chance, reduced fuel consumption, multiblock efficiency. Capstone: "Master Engineer" — unlocks Precursor tech recipes.

**🌿 Cultivator (Nature):** Crop growth speed, Cobblemon friendship rate, brewing quality tiers, rare seed drops. Capstone: "Verdant Soul" — companions gain passive regen near you.

**🌐 Wayfinder (Exploration):** Movement speed, reduced fast-travel cost, better NPC prices, caravan bonuses. Capstone: "Star Cartographer" — reveals hidden planet coordinates.

### Death System

Death is meaningful but not crushing. Anime-inspired: the hero falls, loses something, gets back up.

- Drop 15% of carried currency (coins scatter as physical items — retrievable)
- Lose 3-5 floors of dungeon progress (kicked back, not reset)
- 60-second "Weakened" debuff on respawn
- Cobblemon return to Poké Balls at 1 HP (must heal, not lost)
- Inventory is NOT dropped (no corpse runs)
- **Lore:** You briefly see the Warp Anchor network — implying consciousness backup. Death is canon. You're a reconstituted copy. Never stated explicitly, just hinted.

---

## System 2: Gate Dungeons (Floor-Based Infinite Dungeons)

### Concept

Gates are **floor-based vertical dungeons** inspired by Solo Leveling's gates and Made in Abyss's descent. Shimmering portals in the overworld — some fixed (quest-tied), some spawning dynamically.

### Gate Tiers

| Tier | Floors | Entry Requirement | Loot Quality | Enemy Scaling |
|------|--------|-------------------|-------------|---------------|
| **E-Rank** | 1-10 | None | Common-Uncommon | Vanilla-equivalent |
| **D-Rank** | 1-25 | Level 5+ | Uncommon-Rare | 1.5x |
| **C-Rank** | 1-50 | Level 15+ | Rare-Epic | 2x-3x |
| **B-Rank** | 1-75 | Level 30+, Guild Rank 3 | Epic-Legendary | 3x-5x |
| **A-Rank** | 1-100 | Level 50+, quest chain | Legendary-Mythic | 5x-10x |
| **S-Rank** | 1-∞ | Capstone perk + server event | Mythic-Precursor | Infinite scaling |

### Floor Theming Bands

**Floors 1-10 (The Foundations):** Classic dungeon — stone, torchlight, basic mobs. Treasure rooms, simple puzzles. Onboarding.

**Floors 11-25 (The Shift):** Themes diverge — underwater, frozen, overgrown, desert. Environmental hazards (flooding, lava, debris). Mini-boss every 5 floors. **Floors 15-20: The "outdoor floor"** — one floor opens into a vast impossibly large area (sunny meadow, underground lake, starlit cavern). The first "wow."

**Floors 26-50 (The Deep):** Surreal themes — crystal caves, inverted gravity, clockwork machinery, living corridors. Cobblemon trainer NPCs appear as alternate-path guardians. Puzzle complexity increases (multi-room, Create-style contraptions). Major boss every 10 floors. **Respawn anchors every 10 floors** — death sends you back to the last anchor, not the surface.

**Floors 51-75 (The Abyss):** Reality fragments — floating islands in void, impossible geometry, time-dilated zones. Precursor ruins, ancient Cobblemon fossils. Enemies use coordinated AI (flanking, retreating, calling reinforcements). Loot shifts from gear to materials (rare alloys, Precursor components, dungeon-exclusive ingredients). **The Outdoor Floor here is WRONG:** Sunny field, wrong-colored sky, grass moves against the wind, "sunlight" comes from below. Beautiful unease.

**Floors 76-100 (The Core):** Pure surrealism — the dungeon aesthetic dissolves. Single-room boss arenas, vast empty spaces with one enemy, seemingly empty floors with hidden traps. **Floor 100: Precursor chamber** — lore revelation, unique legendary loot (one item per player per Gate clear, server-tracked). Ancient Form Cobblemon encounters.

**Floors 100+ (S-Rank only — The Beyond):** Infinite scaling. Every floor a unique challenge room. Leaderboard tracked (deepest floor per player). Loot quality keeps scaling. Death penalty increases. The competitive endgame for dungeon runners.

### Implementation: Hybrid Approach

- Gate entrance portal teleports to a dedicated dungeon dimension
- Standard floors use Dungeon Crawl generation with custom KubeJS loot tables and mob scaling
- Every 10th floor is a hand-built boss arena (NBT template)
- "Outdoor" floors are pre-built open areas loaded as separate structures
- KubeJS handles floor tracking, difficulty scaling, loot modification, respawn anchors
- 50-100 floor templates (NBT) needed across all theme bands

### Dungeon Loot Philosophy

Every item connects to another system:

**Common (Floors 1-25):** Vanilla materials (economy fuel), Cobblemon TM discs/Poké Balls, Create components, Lightman's coins, food ingredients, enchanted books.

**Rare (Floors 26-50):** Precursor Fragments (quest/crafting), unique named weapons (Simply Swords + custom), Stellaris components, kingdom trade goods (sealed crates worth high value at specific kingdoms), Cobblemon eggs (rare species).

**Epic/Legendary (Floors 51-100):** Precursor Artifacts (story + endgame crafting), dungeon-exclusive armor sets with set bonuses, Ancient Cobblemon encounter tokens, Warp Shards (fast travel network), unique tools with special abilities, Stellaris fuel components.

**Mythic (Floor 100 / S-Rank):** One-per-clear unique named legendaries, Precursor Blueprints (endgame multiblock recipes), Ancient Cobblemon capture tokens, Warp Gate components.

---

## System 3: Living Companions — Deep Cobblemon Integration

### Philosophy

Pokémon are **living tools, companions, and partners** woven into every system. A player who never catches one can complete everything — but a player who builds a team experiences a fundamentally richer version of every system. This is the anime party dynamic: companions aren't cosmetic, they have roles, they grow with you.

### World Interaction by Type

| Type | Interaction | How It Works |
|------|------------|-------------|
| **Fire** | Heat source | Fuel Create blaze burners, warm crops in cold biomes, light dark areas |
| **Water** | Irrigation | Boost crop growth, fill tanks, create water sources on command |
| **Grass** | Growth | Accelerate crop ticks, bonemeal-like effect on nearby plants |
| **Electric** | Power gen | Generate FE near IE machines, charge Stellaris batteries |
| **Psychic** | Telekinesis | Link "Psychic Relay" blocks — items transfer wirelessly between them |
| **Fighting** | Strength | Move heavy blocks (obsidian, reinforced stone), operate Create presses |
| **Steel** | Structural | Klink/Klang/Klinklang near Create shaft = bonus SU. Living gear mechanism |
| **Ghost** | Phase | Scout dungeon rooms through walls, reveal hidden passages (particle trails) |
| **Flying** | Transport | Large types: rideable mounts. Small types: item delivery couriers |
| **Ground/Rock** | Mining | Slow auto-mine adjacent ores, ore-finding particles (prospecting) |
| **Ice** | Preservation | Freeze perishable items (extended food freshness), slow mob spawns |
| **Poison** | Brewing | Boost potion/brew quality, accelerate fermentation |
| **Dragon** | Resonance | Detect nearby Gates, boost Warp Anchor range, enhance Precursor artifacts |

All interactions implemented via KubeJS entity-near-block events and right-click interactions.

### Trust System (beyond vanilla Cobblemon)

Trust tiers: **Wary → Familiar → Bonded → Soulbound**
- Trust grows through world interactions (not just battles)
- Higher trust = more efficient interactions, longer work duration, new abilities
- Soulbound Pokémon gain a unique particle effect and visible title
- Trust is separate from Cobblemon's native friendship/happiness

### Fatigue System

- Pokémon used for world interactions get tired (configurable timer)
- Fatigued Pokémon work at reduced efficiency, then refuse
- Rest requires: Poké Ball rest time, preferred biome proximity, or favorite berry
- Fire-types rest faster near lava. Water-types near water. Grass-types in sunlight.
- **Prevents infinite free labor — they're partners, not slaves**

### The Trainer's Path (Optional)

**8 Gyms** across biomes/kingdoms. Custom NPC gym leaders with dialogue, type-specialized scaling teams, badge rewards that unlock integration tiers:
- Badge 1: Basic interactions (heating, irrigation)
- Badge 3: Advanced interactions (psychic relays, power gen)
- Badge 5: Companion riding
- Badge 8: Ancient Form encounters, Soulbound bonding

**Elite Four + Champion:** Endgame NPC tournament. Rewards: legendary encounter tokens, Master Ball recipe, "Champion" title.

**Breeding as Economy:** Bred Pokémon with good IVs/natures are trade commodities. "Pokémon Breeder" custom job.

---

## System 4: Kingdom System

### Village Evolution

Villages are alive. They grow based on player interaction.

| Stage | NPCs | Features | Visuals |
|-------|------|----------|---------|
| **Hamlet** | 3-6 | Basic trades, 1-2 buildings | Default village |
| **Village** | 8-15 | General store, inn, job board, paths | Expanded structures, roads |
| **Town** | 16-30 | Partial walls, guards, specialty shops, NAME | Palisade walls, guard towers, market |
| **City** | 30-50 | Full walls, bank (ATM), guild halls, Cobblemon gym | Stone walls, districts, town hall |
| **Kingdom** | 50+ | King/Queen NPC, court, army, unique currency, diplomacy, taxes | Castle, banners, throne room |

### How Villages Evolve

Player-driven: Trading → Prosperity. Quests → Reputation. Building → Development. Defense → Loyalty. Thresholds trigger evolution via KubeJS scoreboards + structure template placement.

### Kingdom Currencies & Trade

**Each Kingdom mints its own currency** (custom KubeJS items: "Plains Crown," "Forest Leaf," "Desert Dinar," etc.). Kingdom shops ONLY accept their own currency. Players earn kingdom currency through kingdom trade, quests, and citizenship.

**Lightman's coins = universal adventurer currency** (works everywhere, player-to-player).
**Kingdom currencies = local specialty access** (kingdom shops, property, military contracts).
Exchange rates fluctuate weekly (KubeJS script).

### Caravan System via Create Trains

Players establish trade routes between kingdoms:

1. **Negotiate:** Complete quest chains for both kingdoms to establish diplomacy
2. **Build:** Lay Create rail line between the two kingdoms
3. **Equip:** Build a Create train with cargo cars
4. **Configure:** Set buy/sell orders at each station (Lightman's Currency + Create station integration)
5. **Run:** Train auto-navigates the scheduled route, selling/buying at stations
6. **Protect:** Route can be raided by mob events — player must defend or hire NPC guards
7. **Profit:** Successful deliveries generate profit and increase both kingdoms' Prosperity

The trade system IS the Create train system, contextualized with kingdom economics. Elegant, no new mechanics needed — just new purpose for existing mechanics.

---

## System 5: Deep Farming & Brewing

### Crop Ecosystem (Farmer's Delight + Croptopia + Let's Do suite)

| Category | Examples | Processing Chain |
|----------|----------|-----------------|
| **Grains** | Wheat, barley, rye, oats, rice | Milling → flour → baking (bread, pastries, noodles) |
| **Fruits** | Grapes, apples, peaches, berries | Pressing → juice → fermentation → wine/cider |
| **Vegetables** | Tomatoes, peppers, onions, garlic | Cooking → meals with stat buffs |
| **Herbs** | Basil, rosemary, mint, lavender | Drying → teas, potion ingredients, brewing adjuncts |
| **Industrial** | Cotton, flax, sugarcane | Processing → textiles, rope, paper, sugar |
| **Exotic** | Space-origin, dungeon seeds, Cobblemon berries | Special properties (glow, anti-gravity, warp-infused) |

### Soil Quality (KubeJS)

- Different crops prefer different biomes (grapes love hills, rice loves wetlands)
- Crop rotation matters: same crop repeatedly = degraded yield
- Compost (Create-processable) restores soil quality
- Grass-type Cobblemon boost soil quality passively
- Configurable bonuses, not hard gates

### Brewing & Winemaking

**Wine:** Grapes → Create press → Must → Fermentation barrel (1-3 MC days) → Aging barrel (optional, longer = better) → Bottled Wine. Quality tiers: Table → Fine → Grand Cru → Legendary. Affected by grape type, soil, fermentation time, Poison-type Cobblemon proximity, Cultivator perks.

**Beer:** Barley → Create heated mixing (malting) → Mashing + water → Boiling + hops → Fermentation → Beer varieties (Pale Ale, Stout, Wheat).

**Spirits:** Any fermented base → Create distillation → Spirit (Whiskey, Brandy, Rum) → Charred barrel aging (longest chain, highest value).

**Mead:** Honey + water → Fermentation → Mead (Bug-type Cobblemon boost hive production).

**Effects:** Temporary buffs scaled by quality. Legendary beverages grant unique effects. "Tipsy" overdrinking debuff (humorous, not punishing). **Beverages are premium trade goods** — kingdoms pay top price.

---

## System 6: Integrated Economy

### Currency Layers

**Layer 1 — Barter:** Direct item trading, Create vending machines, hamlet-level NPCs.
**Layer 2 — Lightman's Coins:** Universal. Earned through jobs, quests, dungeons, selling. Works everywhere.
**Layer 3 — Kingdom Currencies:** Local. Earned through kingdom trade/quests. Required for kingdom-specific goods and services.
**Layer 4 — Precursor Tokens:** Endgame. Found in deep dungeons, space, Archive. Bound on pickup — cannot be traded.

### Economic Balance

**Faucets:** Job activities, quest rewards, dungeon loot, NPC sales, caravan profits, dynamic events.

**Sinks:** Rocket fuel (expensive, consumable), kingdom property taxes, dungeon entry fees (higher tier = higher cost), caravan creation costs, fast travel fees (Warp Anchor network), death currency loss (15%), equipment repair costs, brewing ingredient imports, auction listing fees.

**Anti-Inflation:** NPC buy prices always below sell prices. KubeJS caps daily NPC purchase volume per player. Rare materials player-only trade. Space materials require ongoing fuel investment to acquire.

---

# IV. THE INTEGRATION WEB

Every mod connects to at least three others through **behavior**, not just recipes:

| Connection | Implementation |
|-----------|---------------|
| Cobblemon → Create | Fire-types fuel burners. Electric-types power alternators. Steel-types (Klink) augment shafts. Fighting-types operate presses. |
| Cobblemon → Farming | Grass-types boost crops. Bug-types boost hives. Water-types irrigate. Poison-types accelerate fermentation. |
| Cobblemon → Dungeons | Trainer NPCs on floors offer battle as combat alternative. Ancient Forms on deep floors. |
| Cobblemon → Economy | Bred Pokémon as trade goods. Breeder job. Gym badges unlock integration tiers. |
| Cobblemon → Space | Planet-exclusive species. Psychic crystals for navigation. Dragon-types detect Gates. |
| Create → Stellaris | Pressed hull panels. Distilled fuel. Mechanical launch pad. |
| Create → Kingdoms | Create trains ARE the caravan system. Deployers auto-stock shops. |
| Create → Farming | Pressing, milling, mixing, distillation for all food processing. |
| Create → Economy | Automated shops (deployer + Lightman's trader). Coin minting at Guild Hall. |
| IE → Stellaris | Arc furnace alloys for rocket frames. Diesel for backup fuel. Wiring for launch systems. |
| IE ↔ Create | Power conversion both directions (intentionally inefficient — cross-system tax). |
| Farming → Economy | Food/drink as trade goods. Player restaurants. Kingdom food quests. |
| Farming → Kingdoms | Kingdoms demand specific foods. Agricultural surplus drives Prosperity. Wine/beer as luxury goods. |
| Dungeons → Economy | Loot feeds economy. Entry fees as money sink. Deep-floor materials = most valuable trade goods. |
| Dungeons → Space | Deep floors yield Stellaris components and Precursor tech. Floor 100 rewards include space coordinates. |
| Dungeons → Leveling | Primary XP source. Floor completion drives perk acquisition. |
| Kingdoms → Economy | Kingdom currencies, exchange rates, property taxes, trade route profits. |
| Leveling → Everything | Perks make every system more efficient. |

### Key Custom Recipes (KubeJS Examples)

**Rocket Casing:** Create Brass Sheet × 4 + IE Steel Plate × 4 → Create Press → Hull Panel → 6 Panels + Stellaris Frame = Casing

**Rocket Fuel:** Create Distillation: Crude Oil (IE) + Blaze Powder + Soul Sand → "Warp Propellant" (custom fluid)

**Navigation Core Path A (Cobblemon):** Psychic Resonance Crystal + Redstone Block + Precursor Artifact
**Navigation Core Path B (Mechanical):** Ender Pearl × 16 + Diamond × 4 + Precursor Artifact × 2

**Power Bridge:** Create SU → FE at 256:80 (inefficient). FE → SU at 120:128 (also inefficient). Cross-system has a tax.

**Pokémon Treadmill:** Create Shaft + Oak Planks + Iron Bars + empty Poké Ball → Generates 32 base SU. Speed stat bonus. Electric 2x. Fatigue timer. Supplements, doesn't replace, proper Create setup.

---

# V. FULL MOD LIST (Server-Side Priority)

## CORE ENGINE
| Mod | Purpose | Status |
|-----|---------|--------|
| KubeJS | Recipe scripting, custom items, events, integration backbone | 🟢 |
| KubeJS Create | Create bindings | 🟢 |
| FTB Quests (NeoForge) | Quest trees, progression gating, rewards | 🟢 |
| FTB Teams | Team management | 🟢 |
| FTB Chunks | Chunk claiming/protection | 🟢 |
| Game Stages | Content gating behind milestones | 🟢 |
| Polymorph | Recipe conflict resolution | 🟢 |
| LootJS | Custom loot table scripting | 🟢 |
| PlayerEx / LevelZ | Player leveling and attributes | 🟡 Verify |

## AUTOMATION & ENGINEERING
| Mod | Purpose | Status |
|-----|---------|--------|
| Create | Mechanical automation, trains, fluids | 🟢 |
| Create: Steam 'n Rails | Extended trains — kingdom caravan backbone | 🟢 |
| Create: Crafts & Additions | Create ↔ FE power bridge | 🟢 |
| Create: Enchantment Industry | Automated enchanting | 🟢 |
| Create: Slice & Dice | Farmer's Delight + Create | 🟢 |
| Immersive Engineering | Industrial power, wiring, multiblocks | 🟢 |
| Immersive Petroleum | Oil/fuel processing | 🟡 |
| Applied Energistics 2 | Digital storage (mid-late game) | 🟢 |

## SPACE & DIMENSIONS
| Mod | Purpose | Status |
|-----|---------|--------|
| Stellaris | Rockets, planets, space stations, oxygen | 🟢 |
| Cobblemon/Stellaris Compat Patch | Pokémon on planets | 🟢 |
| 🔵 Custom planet datapacks | Europa, Titan, Forge, Elysium | We build |
| 🔵 Custom dimension datapacks | The Between, The Deep | We build |
| 🔵 Gate dimension system | Dungeon instances | We build (KubeJS) |

## COBBLEMON
| Mod | Purpose | Status |
|-----|---------|--------|
| Cobblemon | Core Pokémon | 🟢 |
| AllTheMons datapack | Expanded roster | 🟢 |
| Cobblemon Loot Balls | Poké Balls in dungeon loot | 🟢 |
| Cobblemon Outbreaks | Dynamic mass spawn events | 🟢 |
| CNPC-Cobblemon-Addon | NPC-triggered battles | 🟢 |
| 🔵 Horizons Companion System | Full world integration (KubeJS) | We build |
| 🔵 Per-biome/dimension/planet spawn datapacks | Themed spawns | We build |
| 🔵 Ancient Form resource pack | Deep dungeon variant textures | We build |
| 🔵 Gym Leader NPC configs | 8 gyms + E4 + Champion | We build |

## ECONOMY & SOCIAL
| Mod | Purpose | Status |
|-----|---------|--------|
| Lightman's Currency | Coins, ATMs, wallets, shops, banks | 🟢 |
| Lightman's Currency Tech | Fluid/energy trading | 🟢 |
| Jobs+ Remastered | Professions with leveling | 🟢 |
| Custom NPCs Unofficial | Story NPCs, dialogue, quest givers | 🟢 |
| Easy NPC | Ambient town NPCs, guards | 🟢 |
| 🔵 Kingdom Currency System | Custom items + KubeJS exchange | We build |
| 🔵 Caravan/Trade Route System | Create trains + kingdom economics | We build |
| 🔵 Village Evolution System | KubeJS scoreboards + structure templates | We build |
| 🔵 Dynamic Price Fluctuation | Weekly pricing scripts | We build |

## FARMING & FOOD
| Mod | Purpose | Status |
|-----|---------|--------|
| Farmer's Delight | Cooking, knives, meals with buffs | 🟢 |
| Croptopia | 250+ crops and foods | 🟢 |
| Let's Do: Brewery | Beer brewing | 🟡 |
| Let's Do: Vinery | Wine production | 🟡 |
| Let's Do: Bakery | Bread and pastries | 🟡 |
| Let's Do: Candlelight | Restaurant furniture | 🟡 |
| Let's Do: HerbalBrews | Tea and herbs | 🟡 |
| Cooking for Blockheads | Kitchen blocks | 🟢 |
| 🔵 Food quality tiers | KubeJS quality rating | We build |
| 🔵 Soil quality system | Biome/rotation bonuses | We build |

## COMBAT & DUNGEONS
| Mod | Purpose | Status |
|-----|---------|--------|
| Better Combat | Animated melee, dual-wield | 🟢 |
| Combat Roll | Dodge rolling | 🟢 |
| Simply Swords | Expanded weapons with abilities | 🟢 |
| Artifacts (mod) | Equippable curios trinkets | 🟢 |
| Iron's Spells 'n Spellbooks | Magic combat path | 🟡 |
| Dungeon Crawl | Procedural underground dungeons (Gate floor base) | 🟢 |
| When Dungeons Arise | Massive structures as Gate entrances | 🟢 |
| YUNG's Better suite (all) | Vanilla structure overhauls | 🟢 |
| 🔵 Gate System | Floor-based dungeons (KubeJS + structures) | We build |
| 🔵 Floor templates (50-100 NBTs) | Themed floor pool | We build |
| 🔵 Boss encounters | Hand-designed every-10-floor bosses | We build |
| 🔵 Scaling difficulty | KubeJS mob HP/damage/loot per depth | We build |

## WORLD GENERATION
| Mod | Purpose | Status |
|-----|---------|--------|
| Terralith | 95+ overworld biomes | 🟢 |
| Tectonic | Continental terrain | 🟢 |
| Nullscape | End → The Archive | 🟢 |
| Repurposed Structures | Biome-variant structures | 🟢 |
| ChoiceTheorem's Overhauled Village | Village overhaul (kingdom evolution base) | 🟡 |
| Towns and Towers | Additional structures | 🟡 |

## BUILDING & DECORATION
| Mod | Purpose | Status |
|-----|---------|--------|
| Supplementaries | Ambient details, signs, ropes | 🟢 |
| Chipped | Block variant explosion | 🟢 |
| Handcrafted | Furniture and interiors | 🟢 |
| Macaw's suite (Doors/Windows/Bridges/Roofs) | Architectural variety | 🟢 |
| Every Compat | Cross-mod wood/stone variants | 🟢 |

## PERFORMANCE & UTILITY
| Mod | Purpose | Status |
|-----|---------|--------|
| Chunky | Pre-generation | 🟢 |
| Spark | Server profiling | 🟢 |
| Clumps | XP optimization | 🟢 |
| Saturn | Entity optimization | 🟢 |
| ModernFix | Memory/load optimization | 🟢 |
| FerriteCore | RAM reduction | 🟢 |
| Jade | Block info overlay | 🟢 |
| Curios API | Equipment slots | 🟢 |

---

# VI. CUSTOM BUILD REQUIREMENTS (Priority Order)

### Phase 1: Foundation (Weeks 1-2)
- [ ] NeoForge 1.21.1 instance with all 🟢 mods verified bootable
- [ ] KubeJS recipe overhauls — unified cross-mod recipes, progression gates
- [ ] Cobblemon spawn datapacks for Terralith biomes
- [ ] Lightman's Currency configuration (pricing, inflation controls)
- [ ] FTB Quests Act 1 skeleton

### Phase 2: Core Custom Systems (Weeks 3-5)
- [ ] Gate Dungeon prototype — 10 floor templates, 1 boss arena, scaling script, loot tables
- [ ] Cobblemon World Integration v1 — Fire heating, Electric power, Grass farming (KubeJS)
- [ ] Kingdom Currency items — 5 currencies as KubeJS custom items
- [ ] Jobs+ custom jobs — Breeder, Rocketeer, Wayfinder, Vintner
- [ ] Player leveling integration with Game Stages

### Phase 3: World Building (Weeks 5-8)
- [ ] Anchor Town spawn build with NPCs and Guild Hall
- [ ] 8 Gym structures with Custom NPC leaders
- [ ] Village evolution templates (wall segments, buildings per biome per stage)
- [ ] Custom planet datapacks (Europa, Titan, Forge, Elysium)
- [ ] Create train stations at Anchor Town and first two villages

### Phase 4: Deep Content (Weeks 8-12)
- [ ] 50+ dungeon floor templates across all theme bands
- [ ] Full Gate System (tracking, anchors, bosses, loot scaling)
- [ ] Cobblemon Integration v2 (Psychic relays, Ghost scouting, Dragon detection)
- [ ] Complete quest trees Acts 2-5 + side chains
- [ ] Caravan/Trade Route + kingdom auto-trade
- [ ] Ancient Form resource pack
- [ ] Brewing quality tiers + soil quality system

### Phase 5: Polish (Weeks 12-16)
- [ ] Custom resource pack (UI theme, item textures, skyboxes)
- [ ] Music/ambient sound configuration
- [ ] Dynamic NPC price fluctuation scripts
- [ ] Performance profiling with Spark
- [ ] Stress test with target player count
- [ ] Player guide and server docs
- [ ] CurseForge modpack packaging

---

# VII. THE PLAYER EXPERIENCE

**Hour 1:** You wake near a glowing stone pillar. Sera welcomes you. The world is beautiful — enormous mountains, wildflower meadows. A Bulbasaur watches from behind a tree. Smoke rises on the horizon. "That's Anchor Town."

**Hour 10:** Small house, waterwheel, first Create millstone. Your Shinx follows you. The shop sells grape seeds, barley, exotic herbs. You plant your first vineyard.

**Hour 30:** You found your first Gate. E-Rank, 10 floors. Floor 7 opens into a cavern so large you see stars through the ceiling. Floor 10's boss drops a named sword: *"Forged before the Dimming. Still sharp."*

**Hour 60:** Your vineyard produces Table Wine. You opened a shop. A distant hamlet is now a Village called Willowmere — they mint Willow Marks. Your Luxio evolved and can power your IE machines since you earned Badge 3.

**Hour 100:** C-Rank Gate, floor 34 — underwater corridor, glass walls, something enormous swims past. Floor 40's boss: fight with swords OR challenge to a Cobblemon battle. You chose the battle. You won. Barely. Willowmere is a Town. You built a Create rail line connecting it to Anchor Town. Your first caravan train delivered wine and returned with Precursor Fragments.

**Hour 130:** You built a rocket from Create hull panels, IE alloys, distilled Warp Propellant, and a Navigation Core requiring your Alakazam's psychic resonance. Everyone watches. 3... 2... 1... The atmosphere falls away. Music fades. Aetheria below you — tiny, beautiful, fragile.

**Hour 170:** Floor 87 of an A-Rank Gate. Walls made of starlight. Your team: Luxray (Soulbound), Alakazam (teleporting supplies from 50 floors up), Garchomp (tanking hits). Precursor data logs tell of a civilization connecting a thousand worlds — and something that severed them in a single night.

**Hour 200:** The Warp Gate project. Server-wide. Everyone contributing — dungeon runners, farmers funding with wine profits, engineers building, trainers protecting construction. It opens to Elysium. The truth about the Dimming. Mythical Pokémon. The next chapter begins.

**Hour 200+:** You tend your vineyard. Your Leafeon rests beside you. Willowmere's bells ring. A new player arrives at the Warp Anchor. Sera welcomes them. You wave from your balcony. The stars are still there.

---

*Project Horizons v3 — Game Design Document*
*NeoForge 1.21.1 | Pure NeoForge (no hybrid)*
*Build Timeline: 12-16 weeks to playable alpha*
*The anime adventure modpack that treats Minecraft as a world engine.*
