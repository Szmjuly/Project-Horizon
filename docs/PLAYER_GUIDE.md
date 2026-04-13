# Project Horizons - Player Guide

**Your companion for surviving and thriving in Aetheria.**

NeoForge 1.21.1 | Cobblemon + Create + Stellaris + MineColonies + 100 more mods

---

## Quick Start: Your First 30 Minutes

### Minute 0-5: Arrive and Survive

You spawn in the world of Aetheria. Open your quest book (default key: **L**) and check the Welcome chapter.

1. Look around. Find a tree. Punch it.
2. Craft a crafting table and basic wooden tools.
3. Your **hunger** bar works normally, but you also have a **thirst** bar (top-right HUD). You will dehydrate if you ignore it.

### Minute 5-10: Water and Shelter

1. Craft a **Leather Canteen** (leather + string in a crafting table). Fill it by right-clicking any water source.
2. **Purify water** before drinking if possible. Use a charcoal filter or boil water in a furnace. Unpurified water can cause sickness.
3. Build a basic shelter before nightfall. Place a bed.

### Minute 10-20: Food and Farming

1. Kill animals or find berries for immediate food.
2. Till soil with a hoe near water. Plant wheat seeds.
3. Pay attention to the **nutrition system**. You need to eat from multiple food groups (proteins, grains, fruits, vegetables, dairy) to stay healthy. A balanced diet gives permanent stat buffs.

### Minute 20-30: First Quest and First Pokemon

1. Follow the quest book to find **Sera**, your wandering guide NPC. She teaches you crafting basics.
2. Walk through different biomes. **Pokemon spawn naturally** based on biome and time of day.
3. Craft **Poke Balls** (apricorns on trees -> cook -> assemble with iron and stone button).
4. Weaken a wild Pokemon, then throw a Poke Ball to catch it. Congratulations, you are now a trainer.

---

## Command Reference

All Horizons custom commands use the `/horizons` prefix.

### Player Commands

| Command | Description |
|---|---|
| `/horizons status` | Show your current stats: perk points, job level, faction rep, crime stat |
| `/horizons branch` | Choose or view your class/job specialization |
| `/horizons branch list` | List all available branches |
| `/horizons perks` | Open the perk tree GUI |
| `/horizons perks spend <tree> <node>` | Spend perk points in a tree |
| `/horizons rep` | View faction reputation standings |
| `/horizons crime` | View your current crime stat and bounty |
| `/horizons duel <player>` | Challenge another player to a Cobblemon duel |
| `/horizons companion` | View your active companion Pokemon and its trust level |
| `/horizons companion assign <slot>` | Assign a Pokemon to a companion slot |
| `/horizons nutrition` | View your current nutrition balance |
| `/horizons quality` | Check the quality tier of held item |
| `/horizons gate` | View gate floor statistics and personal records |
| `/horizons map` | Toggle the world map overlay |
| `/horizons warp list` | List discovered warp points |
| `/horizons warp <name>` | Warp to a discovered location (requires Warp Shards) |
| `/horizons title` | View and equip earned titles |
| `/horizons ascension` | View Ascension eligibility and progress |

### Team Commands

| Command | Description |
|---|---|
| `/ftbteams create <name>` | Create a new team |
| `/ftbteams invite <player>` | Invite a player to your team |
| `/ftbteams leave` | Leave your current team |

---

## System Overview

### Nutrition System

Your body needs five food groups:

| Group | Examples | Effect When Full |
|---|---|---|
| **Proteins** | Cooked beef, pork, chicken, fish | +10% melee damage |
| **Grains** | Bread, cookies, cake | +10% max stamina |
| **Fruits** | Apples, berries, melon | +10% movement speed |
| **Vegetables** | Carrots, potatoes, beetroot | +10% max health |
| **Dairy** | Milk, cheese (from Farmer's Delight) | +10% healing received |

Eating from all five groups regularly fills the "Balanced Diet" meter. A fully balanced diet grants all five bonuses simultaneously. Neglecting a group causes its bonus to decay over time.

### Quality System

Crafted items, cooked food, and brewed drinks have quality tiers:

| Tier | Color | Effect |
|---|---|---|
| Poor | Gray | -25% effectiveness |
| Common | White | Base effectiveness |
| Good | Green | +15% effectiveness |
| Excellent | Blue | +30% effectiveness |
| Masterwork | Purple | +50% effectiveness |
| Legendary | Gold | +100% effectiveness, unique particle effects |

Quality is determined by your job level, tools used, soil quality (for crops), aging time (for wines), and random chance. The Heartwood Hoe has a 5% chance to produce Legendary quality crops per harvest.

### Companion Pokemon

Pokemon are not just battle partners in Horizons. They interact with the world:

- **Fire-type** near a Create Blaze Burner = fueled state
- **Electric-type** near an IE connector = generates Forge Energy
- **Grass-type** in loaded chunks = boosts crop growth in a 5-block radius
- **Water-type** right-clicked on farmland = irrigates soil
- **Psychic-type** between two Psychic Relays = wireless item transfer
- **Steel-type** near Create shafts = +25% stress units
- **Ghost-type** in Gate dungeons = reveals hidden rooms
- **Ground/Rock-type** on surface = ore-finding particles
- **Ice-type** near food storage = preserves food (4x duration)
- **Poison-type** near brewing barrels = quality tier boost

Each Pokemon has a **Trust** score (0-1000) that grows through world interactions, battles, and preventing deaths. Higher trust tiers unlock better companion bonuses:

| Tier | Score | Benefit |
|---|---|---|
| Wary | 0-199 | Basic companion functions |
| Familiar | 200-499 | Efficiency bonuses activated |
| Bonded | 500-799 | Full companion power, loyalty effects |
| Soulbound | 800-1000 | Maximum bonuses, visible particle aura, custom title |

Pokemon also accumulate **Fatigue** (0-100). Fatigued Pokemon (80+) refuse to work. Rest them in their Poke Ball, in a preferred biome, or feed them their favorite berry.

### Dimensional Gates

Gates are infinite, procedurally-scaling dungeons that form the core combat challenge:

- Enter through a **Gate Portal** block found in the world.
- Each floor is harder than the last. Enemies scale with floor number.
- Loot improves with depth. Precursor artifacts appear on deeper floors.
- Boss floors appear every 10 levels.
- Floor 75 is the "Final Trial" for the main story.
- Floor 100 is the deepest anyone has gone. Legendary rewards await.

### Economy

The economy runs on **Lightman's Currency**:

| Coin | Value |
|---|---|
| Copper Coin | 1 |
| Iron Coin | 10 |
| Gold Coin | 100 |
| Emerald Coin | 1,000 |
| Diamond Coin | 10,000 |

Earn money by selling goods to merchants, completing bounties, paying workers, and trading with other players. ATMs in settlements let you convert between denominations.

Each kingdom has its own exchange rates affected by trade volume and faction reputation.

### Crime System

The crime system tracks illegal actions:

- **Crime Stat** ranges from 0 (lawful) to 100 (public enemy).
- Crimes include: stealing from NPCs, pickpocketing, trespassing, attacking guards, smuggling.
- At Crime Stat 25+: guards become hostile, some shops refuse service.
- At Crime Stat 50+: bounty hunters begin pursuing you.
- At Crime Stat 75+: all kingdoms consider you an enemy.
- Crime Stat decays slowly over time (-1 per in-game day) or can be paid off at a courthouse.
- Getting caught sends you to the **Penitentiary Dimension** (jail). Serve your time or do prison labor for early release.

---

## Faction Overview

Six factions compete for influence across Aetheria:

| Faction | Region | Specialty | Reputation Unlocks |
|---|---|---|---|
| **Plains Kingdom** | Central grasslands | Agriculture, trade | Farm tools, trade routes, grain recipes |
| **Forest Kingdom** | Dense woodlands | Cobblemon, nature | Rare Pokemon spawns, breeding bonuses |
| **Desert Kingdom** | Arid badlands | Mining, engineering | IE recipes, Create schematics, ore access |
| **Mountain Kingdom** | Highland peaks | Combat, crafting | Weapon recipes, gate bonuses, armor |
| **Coastal Kingdom** | Shoreline, islands | Naval, exploration | Ship parts, fishing, sea routes |
| **Hunters Guild** | Cross-kingdom | Bounty hunting | Bounty contracts, tracking tools, licenses |

Reputation ranges from -100 (Hostile) to +100 (Exalted). Reach key thresholds to unlock faction-specific shops, quests, and recipes.

---

## Perk Tree Overview

Four base perk trees, each with 100 points of investment:

### Vanguard (Combat)
Focus: Melee damage, dodge rolls, combo chains, Gate floor bonuses, spell power, Pokemon battle buffs.

Key nodes: Power Strike, Evasion Mastery, Gate Affinity, Spell Amplifier, Battle Bond.

### Artificer (Engineering)
Focus: Create SU efficiency, IE power output, train speed, sequenced assembly chance, brewing automation.

Key nodes: Stress Reduction, Power Bridge, Logistics Network, Precision Crafting, Rocket Engineer.

### Cultivator (Farming)
Focus: Crop yield, soil quality bonus, animal breeding rates, wine quality, cooking mastery, nutrition duration.

Key nodes: Green Thumb, Vintner's Touch, Animal Whisperer, Master Chef, Pokemon Farm Bond.

### Wayfinder (Exploration)
Focus: Map reveal range, movement speed, warp shard cost reduction, lore fragment detection, planet survey bonuses.

Key nodes: Pathfinder, Warp Efficiency, Lore Sense, Stellar Navigator, Cartographer's Eye.

At Act 4+, eligible players can undergo **Ascension** to unlock one of 10 Ascended Classes (6 hybrids combining two trees, 4 transcendents from maxing one tree). Ascension is additive, not a reset.

---

## Tips and Tricks

1. **Eat diverse food early.** The nutrition buffs are significant. A balanced diet is worth more than enchanted armor in the early game.

2. **Pair your Pokemon with your profession.** A Grass-type for farming, Electric-type for engineering, Ground-type for mining. The companion bonuses stack with perk tree bonuses.

3. **Do not skip tutorials.** The tutorial quest chapters teach mod mechanics with XP rewards. The knowledge pays off later when complex systems intersect.

4. **Wine ages in real time.** Start a wine cellar early. By Act 3, those bottles will be Legendary quality and worth a fortune.

5. **Gates are optional until Act 5.** You can progress through most of the story without going past floor 10. But the loot from deeper floors makes everything easier.

6. **Trade routes generate passive income.** Set up automated Create trains between settlements early. The coins add up.

7. **Trust your Pokemon.** High-trust companions are dramatically more useful. Keep them fed, rested, and in their preferred biome when not working.

8. **Read Lorebooks.** The five Lorebooks tell you the story of the Precursors. This directly affects which ending you can access and how much you understand the final choice.

9. **Crime has consequences.** The outlaw path is viable and fun, but it locks you out of some faction vendors and quests. Choose deliberately.

10. **Ascension requires breadth.** You need both depth in your main tree AND completion of at least one side chain. Do not hyper-specialize to the exclusion of everything else.

11. **Warp Shards are rare.** Save them for important trips. Build Create train networks for routine travel.

12. **The quality of your tools matters.** A Precursor-tier hoe dramatically outperforms an iron one. Invest in upgrades when available.

13. **Join or create a team.** Chunk claiming, shared quests, and colony access all benefit from team play.

14. **Back up your world.** This is a complex modpack. Regular backups prevent heartbreak.
