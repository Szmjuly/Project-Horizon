# Project Horizons — The Living World

**The Peaceful Path.**

> A companion to the core GDD. This document designs the complete life-sim / farming / village pillar — the side of Project Horizons where a player can spend 200+ hours without ever entering a dungeon. Nutrition, water, farming skills, hired farmhands, living villagers, Cobblemon as agricultural partners, and the systems that tie them together into a warm, lived-in world.

---

## Vision

Project Horizons has two equally deep pillars:

- **The Adventure Pillar** — Gates, combat, space exploration, Pokémon battles. Solo Leveling energy.
- **The Living Pillar** — Farming, brewing, nutrition, villages, colonies, peaceful companionship. Stardew meets Frieren.

A player should be able to pick either pillar and have 200+ hours of meaningful content. Neither is a "side activity" of the other. They're parallel paths through the same world, occasionally crossing (a legendary wine sold to a gym leader, a dungeon drop used to fertilize a rare crop, a trainer who wanders through your farm and asks for tea).

**The peaceful path's emotional arc:** Arrival → First harvest → First sale → First friend → First farmhand → First wine vintage → First named village → First kingdom → A place you belong.

---

## 1. Nutrition & Diet System

### The Concept

Hunger bar tells you *how much* you've eaten. Nutrition tells you *what* you've eaten. Eating the same food repeatedly gives diminishing returns. Eating a varied, balanced diet unlocks passive buffs that stack over time.

### Food Groups

Every food is tagged into one or more of these groups:

- **Grains** — bread, pastries, pasta, rice dishes
- **Fruits** — fresh, dried, juiced, fermented
- **Vegetables** — cooked, raw, pickled
- **Proteins** — meat, fish, eggs, legumes
- **Dairy** — milk, cheese, yogurt, butter
- **Sugars** — honey, sweets, desserts
- **Herbs & Spices** — teas, seasonings, garnishes
- **Beverages** — water, juice, wine, beer, spirits, tea (tracked separately)

### Nutritional Tracking

Each food group has a **saturation score** (0-100) tracked per-player:

- Eating a food from a group raises its score by 5-20 (depends on quality and portion)
- Scores decay by 1 per MC day
- **Diminishing returns:** eating the same food type when its group is already saturated gives less hunger restored
- **Variety bonus:** maintaining 3+ groups above 50 gives a passive "Well Fed" buff
- **Balanced Diet buff:** maintaining all 8 groups above 30 gives strong buffs (regen, damage resist, XP gain)

### Nutrition Buffs

| State | Condition | Effect |
|---|---|---|
| **Malnourished** | Any group at 0 for 2+ MC days | -15% max HP, -10% speed |
| **Undernourished** | 3+ groups below 20 | -5% HP regen |
| **Well Fed** | 3+ groups above 50 | +10% XP gain, faster regen |
| **Balanced Diet** | All 8 groups above 30 | +15% max HP, +10% XP, +5% Cultivator perk XP |
| **Gourmet** | All 8 groups above 70, including at least 1 Legendary-quality food in the last day | Unique particle aura, +25% XP, rare drop chance boost |

### Food Quality Synergy

The existing Food Quality Tiers system (Table → Fine → Grand Cru → Legendary) multiplies nutrition score gains. A Legendary wine gives 5x the Beverages score of a Table wine. This ties the brewing/cooking depth directly into the nutrition system.

### Implementation

- **Primary mod:** **Diet** (Scorpioneer) — if available on NeoForge 1.21.1
- **Fallback:** Custom KubeJS system using player NBT to track group scores and attribute modifiers for buffs
- **UI:** JEI integration showing food group tags on tooltip hover
- **Hook into Legendary Tooltips** (client-side) for colored nutrition indicators

---

## 2. Water & Thirst System

### Core: Tough As Nails

**Tough As Nails** handles the foundation — thirst bar, canteens, water purifiers, temperature, water cleansing enchantment. Available and active on NeoForge 1.21.1.

### The Horizons Layer

We layer custom behaviors on top of Tough As Nails to integrate it with every other system.

### Water Sources (by quality)

| Source | Quality | Risk | Notes |
|---|---|---|---|
| **Puddles / murky swamps** | Dirty | High disease chance | Last resort — will cause Thirst debuff |
| **Rivers / lakes** | Unfiltered | Medium | Boil or purify before drinking |
| **Rain collection barrels** | Clean | None | Free with basic infrastructure |
| **Village wells** | Clean | None | Every Village+ has one, free access |
| **Kingdom aqueducts** | Purified | None | Kingdom-tier infrastructure, high quality |
| **Water-type Cobblemon produced water** | Purified | None | Infinite, requires companion |
| **Bottled spring water (shop)** | Premium | None | Costs currency, convenient |
| **Space station recyclers** | Reclaimed | None | Always available on planets |

### Dehydration Stages

- **Hydrated** (100-75%) — normal
- **Thirsty** (74-50%) — hunger bar fills slower
- **Parched** (49-25%) — -10% movement speed, mining fatigue chance
- **Dehydrated** (24-1%) — damage over time, no regen
- **Dying of thirst** (0%) — rapid HP loss

### Beverage Integration

Wine, beer, and spirits from the brewing system **partially hydrate** you, but with tradeoffs:

| Beverage | Hydration | Side Effect |
|---|---|---|
| Water / Juice / Tea | +40% thirst | None |
| Beer (light) | +25% thirst | Mild Tipsy buff |
| Wine (any quality) | +30% thirst | Tipsy + temporary Stat boost based on quality |
| Spirits | +10% thirst | Strong Tipsy, stronger stat boost |
| Legendary wine/spirit | +35% thirst | Stat boost, no tipsy, unique effect |

**This makes the brewing system genuinely useful for hydration**, not just decorative.

### Cobblemon Water Integration

- **Water-type companions generate clean water** — right-click with empty canteen on a Water-type = fills canteen with Purified water
- **Ice-type companions preserve water quality** — canteens in inventory with Ice-type active don't spoil over time (Tough As Nails canteens can spoil)
- **Dehydration in space/desert biomes** — Water-type companions become strategically essential for long expeditions

### Dungeon Dehydration

Deep floors (26+) apply a slow thirst drain on top of normal consumption. Floor 50+ reduces water source availability. Floor 76+ may have hostile fluid (unfiltered only, with disease risk). This creates a *logistical* layer to deep dungeon diving — pack canteens, bring a Water-type, or turn back.

### Kingdom Well Infrastructure

- Village Evolution stages unlock water infrastructure:
  - **Hamlet:** no well, players must travel or bring water
  - **Village:** single well, free access
  - **Town:** multiple wells, Thirst potion vendor
  - **City:** public aqueduct system, canteen refill stations
  - **Kingdom:** premium spring water sales, imported bottled water from distant sources as luxury goods

---

## 3. Farming Skills, Tools & Progression

### Skill Tree Integration

Farming is a **sub-specialization** within the existing **Cultivator** perk tree. Not a separate leveling system — it extends what's already there.

### Farming Skill Tiers

Within the Cultivator tree, players can invest specifically in farming:

**Novice Farmer** (0-25 perk points)
- +5% harvest yield per point
- Unlocks basic tiered tools (copper hoe → iron hoe)
- Can identify soil quality visually

**Experienced Farmer** (26-50 points)
- +10% crop growth speed
- Can craft composters with bonus output
- Unlocks named crop varieties (regional grape strains, heirloom tomatoes)
- Weather prediction ability (see next rain/storm)

**Master Farmer** (51-75 points)
- +25% Legendary quality chance on harvests
- Unlocks greenhouse multiblock structure
- Can graft fruit trees for hybrid varieties
- Soil restoration ability (regenerate depleted soil)

**Verdant Soul** (Capstone, 100 points)
- Cobblemon companions gain passive regen in 10-block radius
- Crops near you grow 50% faster
- Unique tool: "Heartwood Hoe" — every harvest has 5% chance for Legendary quality regardless of other factors
- Prestige effect: butterflies, petals, and particles follow you through farmland

### Farming Tools Progression

Tiered tools gated behind skill progression:

| Tool | Tier | Unlock | Benefit |
|---|---|---|---|
| **Copper Hoe** | Starter | Default | Basic tilling |
| **Iron Hoe** | Novice | 10 Cultivator points | 20% faster tilling, durability bonus |
| **Steel Hoe** | Novice | 25 Cultivator points | Multi-block tilling (3x1) |
| **Create Brass Hoe** | Experienced | 35 Cultivator points + Create progression | Multi-block tilling (3x3), right-click plants seeds |
| **Enchanted Hoe** | Experienced | 50 Cultivator points + enchanting unlock | Auto-replant on harvest |
| **Precursor Hoe** | Master | 75 Cultivator points + Precursor Blueprint | 5x5 tilling, auto-fertilize, harvest quality boost |
| **Heartwood Hoe** | Capstone | Verdant Soul capstone | Described above — the endgame gardener's tool |

Similar progression for:
- Watering cans (manual → copper → brass → enchanted auto-watering)
- Pruning shears (for fruit trees and vineyards)
- Harvesting scythes (wheat/grain harvesting — single-click row)
- Seed bags (auto-planting with configured contents)

### Farming-Specific Advancements

Tied to FTB Quests side chain "The Cultivator's Path":

- First Harvest → Diverse Farmer (grow 5 crop types) → Master Brewer (10 Fine wines) → Legendary Vintner (1 Legendary wine) → Verdant Soul (capstone unlock)

### Specialized Farming Structures

Unlocked through Cultivator progression or Create/Precursor tech:

- **Greenhouse multiblock** — heated, controlled climate, grows any crop regardless of biome
- **Fermentation cellar** — specialized room buff for wine/beer aging (quality tier bonus)
- **Compost tower** — multiblock for mass compost production from crop waste
- **Beehive apiary** — mass honey production, bee-type Cobblemon synergy
- **Hydroponic bay** — space-farming for planetary bases
- **Aging cellar** — underground room that applies quality bonus to barrels over time

---

## 4. Farmhands via MineColonies

### The Concept

A player can hire NPC workers to tend their farm. Rather than build a custom system, we use **MineColonies** — the most mature, well-maintained colony mod on NeoForge 1.21.1. We customize it to fit the Horizons aesthetic and economy.

### What MineColonies Provides

Out of the box: builder, farmer, fisher, forester, guard, miner, smelter, baker, cook, courier, animal herders, composter, and dozens more. Workers live in their own huts, have needs, level up, and perform autonomous tasks. Perfect fit for a farmer-manor system.

### Horizons-Specific MineColonies Integration

We don't use MineColonies as a full village replacement — we use it as a **farmhand/manor system** for the individual player.

**Boundaries:**

- MineColonies colonies = **player-owned manor and farmhand staff**
- NPC villages = **independent settlements** that go through our Village Evolution system
- The two systems coexist. Your player-owned colony can trade with nearby NPC villages.

**Workers we actively use:**

- **Farmer** — tends player fields, plants and harvests configured crops
- **Composter** — turns crop waste into fertilizer
- **Fisher** — works nearby water sources
- **Baker / Cook** — processes harvest into food (ties into nutrition system)
- **Herder (cow/sheep/pig/chicken/rabbit)** — livestock management
- **Beekeeper** — honey production
- **Florist** — flower and herb farming (feeds the brewing system)
- **Courier** — moves goods between colony buildings

**Workers we reskin or integrate:**

- **Guard** → "Farmhand Guard" — defends the colony from raids, tied into kingdom reputation
- **Builder** → "Wayfinder's Hand" — builds from custom Horizons schematics
- **Concrete Mixer / Smelter** — tied into Create bridge recipes

**Workers we add via KubeJS / datapacks:**

- **Vintner** — operates the fermentation cellar, produces wine autonomously (custom Horizons job)
- **Trainer's Aide** — cares for Cobblemon, feeds/heals them, grooms them for breeding
- **Brewer** — runs the Let's Do: Brewery production line

### The Colony Boost Token

Currency integration: instead of MineColonies' default emerald-based economy, Horizons colonies run on **Lightman's Currency** for wages. Each worker needs a daily wage from your account. Higher wages = happier workers = higher productivity.

This adds a **money sink** to the economy — operating a large colony is expensive and requires steady income from farming, trading, or other activities.

### Pokémon Farmhand Pairing

The killer integration: **assign a Cobblemon partner to a MineColonies worker.**

- Right-click a worker NPC with a Poké Ball containing a suitable Pokémon
- The Pokémon follows the worker during their work shift
- Type synergy provides efficiency bonuses:

| Worker | Best Pokémon Partner | Bonus |
|---|---|---|
| Farmer | Grass-type (Bulbasaur, Tangela, Bellossom) | +25% crop yield, +15% growth speed |
| Beekeeper | Bug-type (Ledian, Vespiquen) | +40% honey production |
| Fisher | Water-type (Poliwhirl, Goldeen) | +30% fish rate, rare catches |
| Forester | Grass-type or Bug-type (Scyther) | +20% wood, faster regrowth |
| Herder | Normal-type (Miltank, Bouffalant) | Livestock happier, more offspring |
| Composter | Poison-type (Muk, Garbodor) | 2x compost speed, higher quality |
| Cook | Fire-type (Magmar, Darmanitan) | Faster cooking, food quality boost |
| Smelter | Fire-type or Steel-type | Faster smelting, Create SU savings |
| Guard | Any combat-oriented | Colony defense bonus |
| Vintner | Poison-type (Foongus, Amoonguss) | Fermentation quality boost |
| Trainer's Aide | Psychic-type (Alakazam, Gardevoir) | Cobblemon healing, faster breeding |

### Multi-Colony Kingdoms

Players can eventually own multiple colonies in different biomes — a vineyard estate in the plains, a fishing village on the coast, a forge-colony in the mountains. These link via Create train caravans (existing trade route system) and trade goods between themselves.

A large enough network of player-owned colonies can be **petitioned to become a Player Kingdom** — formal recognition from the NPC kingdoms with unique privileges (mint your own currency, be included in diplomatic events, host NPC delegations).

---

## 5. Living Villagers

### The Problem with Vanilla Villagers

Vanilla villagers are inventory machines. They stand in place, trade, and have zero personality. The Tango Tek "What If Villagers Were..." concept explored the idea of villagers with needs, personality, and lives.

### The Horizons Approach

We combine multiple systems to create truly alive villagers:

**Three layers:**

1. **Background villagers (ambient life)** — Easy NPC mod provides simple, customizable NPCs that fill kingdoms with color and movement
2. **Story villagers (personality & quests)** — Custom NPCs Unofficial provides deep NPCs with dialogue trees, schedules, and branching questlines
3. **Wandering trainers (encounters)** — **Radical Cobblemon Trainers** provides 1500+ auto-spawning trainer NPCs with pre-built Pokémon teams

### Radical Cobblemon Trainers Integration

RCT is the secret weapon here. It adds 1500+ trainers from Pokemon Radical Red, Unbound, and main series games. They spawn naturally, follow progression, and can be battled. Actively maintained on NeoForge 1.21.1.

**How we use it:**

- **World population** — trainers wander the overworld, camp near villages, travel between kingdoms
- **Progression gated** — difficulty scales with player progression; Gym Leaders act as milestone walls
- **Kingdom integration** — stronger trainers cluster near kingdoms with Cobblemon gyms; weaker trainers near Hamlets
- **Loot and rewards** — defeating rare trainers drops kingdom currency, rare items, and TMs
- **Questgiver hook** — Custom NPCs can reference nearby RCT trainers in dialogue ("Have you fought the trainer by the river? She's tough.")

### Custom NPC Story Villagers

Each village has 2-5 named story villagers with:

- **Schedule** — wakes, works, eats, sleeps (custom NPCs scheduling)
- **Personality** — dialogue reflects their role and relationship with the player
- **Needs** — requests food, water, supplies from players (quest hooks)
- **Memory** — remembers player actions through Custom NPCs faction/relationship system
- **Offerings** — unique shops, unique quests, unique recipes

**Examples per village tier:**

- **Hamlet:** 1 innkeeper, 1 general store owner
- **Village:** + 1 farmer NPC (tutorial for farming), 1 blacksmith
- **Town:** + 1 gym leader (if Cobblemon path), 1 mayor, 1 herbalist
- **City:** + full NPC cast — librarian, trainer, guard captain, merchant prince, temple keeper
- **Kingdom:** + royalty, court wizards, royal guards, diplomatic envoys

### Villager Needs System (Custom, KubeJS)

Villagers in settlements have a **Needs** stat tracked via scoreboard:

- **Food** — decays daily, replenished by player deliveries or farm proximity
- **Water** — decays daily, replenished by well proximity or player deliveries
- **Safety** — decays during mob attacks, replenished by guard presence
- **Comfort** — tied to village infrastructure level

Low needs reduce Prosperity score. High needs boost Prosperity. This creates an ongoing gameplay loop: players supply villages, villages grow, growing villages provide better services.

### Wandering Villagers

Custom NPCs can be scripted to **travel between villages** on schedules. A baker from Willowmere might visit Sundale twice a week. Players who intercept them en route can trade directly or offer protection from mobs.

This creates emergent encounters — the world feels populated not just with static NPCs but with *lives in motion*.

### Famous Villagers

A handful of NPCs across the map are **Famous** — the best blacksmith, the best vintner, the most powerful trainer. Famous villagers offer unique services and have their own questlines. Their reputation grows as players interact with them (they might gain apprentices, move to larger cities, get recruited by kingdoms).

---

## 6. Cobblemon on the Farm

### Beyond Generic Type Behaviors

The core Cobblemon Integration handles type-based behaviors (Fire heats, Grass grows, etc.). The Farming Companion System goes deeper — specific Pokémon families with specific farming jobs.

### Cobblemon Farming Roles

| Pokémon Line | Role | Effect |
|---|---|---|
| **Bulbasaur / Ivysaur / Venusaur** | **Fertilizer** | AOE bone-meal effect every 30 seconds in 5-block radius |
| **Oddish / Gloom / Vileplume** | **Seed Propagator** | Harvested crops have 15% chance to drop 2x seeds |
| **Bellsprout / Weepinbell / Victreebel** | **Tall Crop Specialist** | Sugarcane, bamboo, cactus grow 2x speed |
| **Paras / Parasect** | **Fungal Farmer** | Mushrooms spread in adjacent dark blocks, rare variants possible |
| **Exeggcute / Exeggutor** | **Tree Guardian** | Fruit trees yield +50% within range |
| **Tangela / Tangrowth** | **Vine Master** | Hanging crops (grapes, hops, beans) grow faster and higher quality |
| **Ledyba / Ledian** | **Pollinator** | +40% honey production, +20% yield on bee-pollinated crops |
| **Sunkern / Sunflora** | **Sun Farmer** | Crops in direct sunlight grow 3x faster, water drain 2x faster |
| **Hoppip / Skiploom / Jumpluff** | **Seed Carrier** | Occasionally plants new grass blocks, spreads crop seeds to nearby farmland |
| **Snover / Abomasnow** | **Cold Farmer** | Preserves harvested crops from spoiling, ice-farms frost lotus |
| **Cherubi / Cherrim** | **Weather Farmer** | Boost depends on weather (sunny = 2x, rain = 1x, snow = reduced) |
| **Maractus** | **Desert Farmer** | Cactus and dry crops thrive, soil quality restoration bonus |
| **Foongus / Amoonguss** | **Brewer's Assistant** | Fermentation speed and quality boost in adjacent barrels |
| **Shroomish / Breloom** | **Soil Enricher** | Passive soil quality regeneration |
| **Lotad / Lombre / Ludicolo** | **Rice Farmer** | Water crops grow faster, lily pads spread |
| **Combee / Vespiquen** | **Queen Bee** | Unlocks rare honey types, boosts entire apiary |

### Farm-Bound Companion Behaviors

Players can designate a Pokémon as **"Farm-Bound"** — it stays on the farm even when the player leaves, continues working, and doesn't require being in the active party.

- Requires a **Companion Hut** block (custom, built from Create materials + Cobblemon items)
- One Pokémon per hut
- Working Farm-Bound Pokémon consume small amounts of berries per day (upkeep)
- Earns Trust passively from time spent working
- If neglected (no berries available), Pokémon becomes Wary and may leave

This lets farming players maintain large operations without constantly swapping their party.

### Breeding for the Farm

Certain IVs and abilities matter for farming:

- **Speed stat** affects work tick rate
- **Attack stat** (for harvesting types) affects yield bonus
- **Special Attack** (for elemental types) affects elemental effect strength
- **Abilities** — "Harvest" (Tropius), "Chlorophyll", "Flower Veil" all have custom farm bonuses
- Farming-optimized breeding becomes a valuable economy niche (players breed farm Pokémon to sell)

---

## 7. The Integration Web — Updated

How these new systems connect to everything else:

```
                     ┌──────────────────────┐
                     │    NUTRITION &       │
                     │      DIET            │
                     └──────┬───────────────┘
                            │
            drives demand   │   rewards variety
                            │
                     ┌──────▼───────────────┐
                     │   DEEP FARMING       │
                     │   & BREWING          │
                     └──┬────────────┬──────┘
                        │            │
         Pokémon roles  │            │ Quality tiers
                        ▼            ▼
         ┌──────────────────┐   ┌─────────────────┐
         │   COBBLEMON      │   │    ECONOMY      │
         │   FARM PARTNERS  │   │    & KINGDOMS   │
         └──────┬───────────┘   └────┬────────────┘
                │                    │
                │   farmhand pairs   │ colony wages
                ▼                    ▼
         ┌────────────────────────────────┐
         │    MINECOLONIES FARMHANDS      │
         │    Player-owned manor/colony   │
         └────────────────┬───────────────┘
                          │
                trade routes via Create trains
                          │
                          ▼
         ┌────────────────────────────────┐
         │    LIVING VILLAGES & KINGDOMS  │
         │    (NPC Evolution System)      │
         └────────────────┬───────────────┘
                          │
          villager needs  │  reputation
                          ▼
         ┌────────────────────────────────┐
         │    RADICAL TRAINERS &          │
         │    STORY NPCS                  │
         └────────────────┬───────────────┘
                          │
                   dungeon rewards
                          │
                          ▼
         ┌────────────────────────────────┐
         │    WATER / THIRST SYSTEM       │
         │    Kingdom wells, canteens,    │
         │    Cobblemon water gen         │
         └────────────────────────────────┘
```

**Every edge is a real integration:**

- Nutrition creates demand for diverse crops → drives farming diversity
- Farming feeds the nutrition system → rewards variety with buffs
- Cobblemon partners boost farming → integration the player feels
- Farm output sold at village shops → feeds kingdom Prosperity
- Kingdom Prosperity grows villages → unlocks new services
- Village services include new farming tools, seeds, NPCs
- MineColonies workers paired with Pokémon → peak productivity
- Colony wages sink currency → balances the economy
- Water system creates logistical needs → Water-type Cobblemon become essential
- Wandering trainers wander through farms → peaceful encounters or battles
- Trainer rewards include rare seeds and farming tools → feeds back into farming
- Cultivator perk tree → boosts everything

---

## 8. New Mods Required

Additions to the existing server mod list. All confirmed available for NeoForge 1.21.1.

### Core Additions

- **Tough As Nails** — thirst, temperature, canteens, water purification
- **MineColonies** — farmhand/manor system (+ dependencies: Structurize, MultiPiston, BlockUI)
- **Radical Cobblemon Trainers** — wandering trainer NPCs (+ dependencies: RCTApi, Cobblemon Trainers)

### Nutrition Layer (pick one)

- **Diet** (Scorpioneer) — if NeoForge 1.21.1 port exists, use it
- **Spice of Life: Carrot Edition** — alternative food variety mod if Diet is unavailable
- **Custom KubeJS system** — fallback, build in our layer

### Farming Expansions (optional but recommended)

- **Farmer's Respite** — coffee, tea, dessert-focused Farmer's Delight addon
- **Brewin' and Chewin'** — additional brewing depth
- **Serene Seasons** — seasonal crop variation (if compatible with Terralith)
- **Create: Garnished** — Create + Farmer's Delight bridge

### Village / NPC Layer

- **Guard Villagers** — villagers that defend settlements (integrates with Village Evolution)
- **Villager Names** — named vanilla villagers (reduces the "Villager #1234" problem)

### Skills / Progression

- Our existing **Pathfinder Levels** (PlayerEx or LevelZ base) handles all leveling — no new mod needed
- **Farming skills live within Cultivator perk tree**, not as a separate mod

---

## 9. New Custom Systems Required

Additions to the Custom Integrations document.

### 9.1 Nutrition Tracking System

`server_scripts/player/nutrition.js` (if Diet mod unavailable)

- Track 8 food group scores in player NBT
- Apply buff effects based on group thresholds
- Integrate with food quality tier system
- Display nutrition state via Legendary Tooltips on held food

### 9.2 Thirst Integration Layer

`server_scripts/player/thirst_integration.js`

- Link Tough As Nails thirst to nutrition beverages group
- Apply beverage buff effects (Tipsy, stat boosts)
- Scale thirst decay in dungeon dimensions (floors 26+)
- Hook Water-type Cobblemon interactions to fill canteens

### 9.3 MineColonies Cobblemon Pairing

`server_scripts/colony/pokemon_workers.js`

- Track worker ↔ Pokémon assignments in colony data
- Apply efficiency bonuses per worker tick based on partner type
- Feed/rest the Pokémon on worker schedule
- Trust/Fatigue integration — colony partners gain Trust over time

### 9.4 Farmhand Wage System

`server_scripts/colony/wages.js`

- Replace MineColonies default happiness system with Lightman's Currency wages
- Daily wage deduction from player/team account
- Wage amount per worker tier and skill level
- Unpaid workers become unhappy → stop working → may leave

### 9.5 Villager Needs System

`server_scripts/villages/needs.js`

- Track Food, Water, Safety, Comfort per village
- Decay per day, replenish via player delivery or infrastructure
- Affect Prosperity score (ties into Village Evolution)
- Needs-based quests auto-generate when villages fall below thresholds

### 9.6 Traveling NPC Scripts

`server_scripts/npcs/travelers.js`

- Custom NPCs with pathfinding between village waypoints
- Schedule-based travel (leave Monday, arrive Wednesday)
- Mob encounter handling mid-journey
- Player interception creates trade opportunities

### 9.7 Farm-Bound Cobblemon

`server_scripts/cobblemon/farm_bound.js`

- Companion Hut block tracking (custom KubeJS block)
- Persistent Pokémon entities that don't despawn
- Daily upkeep (berry consumption)
- Passive Trust gain from work hours
- Abandonment logic if neglected

### 9.8 Farming Skill Tools

`startup_scripts/items/farming_tools.js`

- Tiered hoes, watering cans, scythes, pruning shears
- Multi-block tilling behavior via KubeJS block interact events
- Auto-replant and auto-fertilize features
- Heartwood Hoe capstone with rare Legendary chance

### 9.9 Greenhouse & Cellar Multiblocks

Possibly a Java mod extension, or approximated with Create multiblocks + KubeJS buffs in a defined area.

- Greenhouse detects 3x3x3+ enclosed structure with glass roof = "climate controlled" area bonus
- Fermentation cellar detects enclosed underground room with barrels = quality bonus for contained brewing
- Aging cellar adds time-based quality buff to barrels over game days

---

## 10. The Peaceful Player Arc

Hour-by-hour journey for a player who never sets foot in a dungeon.

**Hour 1:** Sera welcomes you. You notice a Bulbasaur near a wildflower patch. The hunger and thirst bars surprise you — you're actually hungry, and the river water needs boiling. You light a fire and cook your first bread.

**Hour 5:** You caught the Bulbasaur. You planted your first grapes on a hillside plot. The soil quality indicator shows it's fair. You built a small house with a well.

**Hour 15:** Your vineyard has matured. You pressed your first grape must, started your first fermentation barrel. Your Bulbasaur's passive bonemeal effect is visible — your crops grow noticeably faster than the nearby wild plants. You visit Anchor Town and sell vegetables to the innkeeper for your first coins.

**Hour 30:** Your first bottle of Table Wine sits on the counter. You drink some — it hydrates you and gives you a gentle Tipsy buff with a stat boost. You feel like you've accomplished something small and real. You hire your first MineColonies Farmer — a shy NPC named Benn who you pair with your Bulbasaur. Benn's productivity doubles.

**Hour 50:** You have a Fine quality wine. An NPC merchant at Anchor Town buys it for triple the price of your Table variant. A wandering trainer with a Bellossom passes through your farm and compliments your vineyard. You have a short Cobblemon battle with them — you lose, but they give you a rare herb seed as consolation.

**Hour 75:** Your farm has grown. You have three MineColonies workers — Benn the Farmer, Mara the Vintner, and Thom the Beekeeper. All paired with Cobblemon. You operate a vineyard, a meadery, and a small apiary. You're paying weekly wages from your wine sales. Your nutrition bar reads "Balanced Diet" — you have a permanent +15% HP and +10% XP buff.

**Hour 100:** A distant hamlet is now a Village called Willowmere. You've been trading with them constantly. You set up a Create train line between your manor and their market. Willowmere mints Willow Marks now. You see Willowmere's baker travel to Anchor Town on a schedule you've learned — you started intercepting her en route to buy bread directly.

**Hour 130:** You achieved your first Grand Cru wine. The Anchor Town king wants three cases for a royal wedding. The quest rewards you with a rare Heartwood Sapling — a Precursor-tier tree that produces fruit with unique buffs. You plant it in the center of your farm.

**Hour 150:** Your colony has grown into a small village of NPCs — farmhands, builders, a cook, a guard, a trainer's aide. You've paired each with a Cobblemon partner. Your manor has a name now: Sunmeadow. Other players passing through call you "the Vintner of Sunmeadow."

**Hour 175:** Willowmere evolves into a Town. The mayor asks you to formally become a citizen and contribute to their growth. You agree. You receive the title "Founding Farmer of Willowmere" and unlock a unique shop. You develop three named grape varieties — each with unique flavor notes and stat effects when made into wine.

**Hour 200:** Your Heartwood Sapling has matured. Its fruit grants you permanent small stat boosts. Your manor exports wines, cheeses, breads, and honey across four kingdoms via three train routes. Your nutrition state is Gourmet — you're permanently well-fed on food you grew yourself. Willowmere is a City and you're in the running to become its first elected Mayor.

**Hour 200+:** A new player arrives in Aetheria. Sera welcomes them. Later that day, the new player wanders through Sunmeadow looking confused and thirsty. You wave them over to your well, offer them a meal and a cup of wine, and teach them how to plant their first grape vine. The world persists. Your legacy does too.

---

## 11. Updated Server Mod List Additions

Add these to `HORIZONS_SERVER_MODS.md`:

### Farming, Food & Brewing (expansions)

- **Tough As Nails** — thirst, temperature, canteens, water purification
- **Farmer's Respite** — coffee, tea, dessert Farmer's Delight addon
- **Brewin' and Chewin'** — additional brewing depth
- **Serene Seasons** — seasonal crop variation (test Terralith compat)
- **Create: Garnished** — Create + Farmer's Delight bridge
- 🔵 **Nutrition System** — food groups, variety tracking, buff effects
- 🔵 **Thirst Integration Layer** — beverage hydration, dungeon drain, Cobblemon water gen

### Colonies & Workers (new category)

- **MineColonies** — player farmhand colony system
- **Structurize** — MineColonies dependency
- **MultiPiston** — MineColonies dependency
- **BlockUI** — MineColonies dependency
- 🔵 **MineColonies Cobblemon Pairing** — worker/Pokémon efficiency bonuses
- 🔵 **Farmhand Wage System** — Lightman's Currency replaces happiness system
- 🔵 **Farm-Bound Cobblemon** — persistent working companions

### Living NPCs (new category)

- **Radical Cobblemon Trainers** — 1500+ wandering trainer NPCs
- **RCTApi** — RCT dependency
- **Cobblemon Trainers** — RCT battle backend
- **Guard Villagers** — villagers defend settlements
- **Villager Names** — named vanilla villagers
- 🔵 **Villager Needs System** — Food/Water/Safety/Comfort tracking
- 🔵 **Traveling NPC Scripts** — village-to-village pathfinding

---

## Summary

The Peaceful Pillar adds roughly 10 new mods and 9 new custom systems. Combined with the existing Adventure Pillar, Project Horizons becomes a genuine dual-path experience:

- **Adventure players** get Solo Leveling gates, space exploration, Pokemon battles, and combat mastery
- **Peaceful players** get Stardew farming, wine-making, colony management, village building, and life-sim depth
- **Hybrid players** — most will be this — get both, experienced at their own pace

Both paths use the same world, the same economy, the same Cobblemon system, and the same kingdoms. They just interact with them differently.

**The world is alive either way.**

---

*Living World Expansion v1 — companion to `PROJECT_HORIZONS_v3_GDD.md`*
*All new mods confirmed on NeoForge 1.21.1*
*The peaceful path is now 200+ hours of genuine depth.*
