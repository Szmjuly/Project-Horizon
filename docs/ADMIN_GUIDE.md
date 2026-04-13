# Project Horizons - Admin Guide

**Server setup, configuration, and operations manual.**

NeoForge 1.21.1 | Java 21 | 16 GB RAM minimum

---

## Server Setup Instructions

### 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Java | 21 (Adoptium/Temurin recommended) | JDK, not JRE |
| RAM | 16 GB allocated to server | 12 GB minimum, 16 GB recommended |
| Storage | 20 GB free minimum | World gen + mods + backups |
| CPU | 4+ cores recommended | Single-threaded perf matters most |
| OS | Linux recommended, Windows supported | Linux gets better garbage collection |
| NeoForge | 1.21.1 (latest stable) | Download from neoforged.net |

### 2. Installation Steps

1. **Install NeoForge server:**
   ```
   java -jar neoforge-installer.jar --installServer
   ```

2. **Accept the EULA:**
   Edit `eula.txt` and set `eula=true`.

3. **Copy mod files:**
   Place all `.jar` files from the modpack into the `mods/` directory. Ensure both server-side and shared mods are present. Do NOT include client-only mods (shaders, UI mods, etc.).

4. **Copy configuration:**
   Copy the entire `config/` directory from the modpack distribution.

5. **Copy datapacks:**
   Copy custom datapacks to `world/datapacks/` (created after first run).

6. **Copy KubeJS scripts:**
   Copy the `kubejs/` directory to the server root.

7. **Set JVM arguments** in your start script:
   ```bash
   java -Xms12G -Xmx16G \
     -XX:+UseG1GC \
     -XX:+ParallelRefProcEnabled \
     -XX:MaxGCPauseMillis=200 \
     -XX:+UnlockExperimentalVMOptions \
     -XX:+DisableExplicitGC \
     -XX:+AlwaysPreTouch \
     -XX:G1NewSizePercent=30 \
     -XX:G1MaxNewSizePercent=40 \
     -XX:G1HeapRegionSize=8M \
     -XX:G1ReservePercent=20 \
     -XX:G1HeapWastePercent=5 \
     -XX:G1MixedGCCountTarget=4 \
     -XX:InitiatingHeapOccupancyPercent=15 \
     -XX:G1MixedGCLiveThresholdPercent=90 \
     -XX:G1RSetUpdatingPauseTimePercent=5 \
     -XX:SurvivorRatio=32 \
     -XX:+PerfDisableSharedMem \
     -XX:MaxTenuringThreshold=1 \
     -jar neoforge-server.jar nogui
   ```

8. **First run:** Let the server generate the world. Stop it after world gen completes.

9. **Install datapacks:** Copy any remaining datapacks into `world/datapacks/`.

10. **Configure server.properties:**
    ```properties
    server-port=25565
    max-players=16
    view-distance=10
    simulation-distance=8
    max-tick-time=90000
    spawn-protection=0
    allow-flight=true
    ```

11. **Start the server** and verify all mods load without errors.

---

## Mod List with Categories

### Libraries and APIs (~25 mods)
Architectury API, Balm, Cloth Config API, Curios API, YUNG's API, Geckolib, Kotlin for Forge, playerAnimator, Collective, Bookshelf, Moonlight Lib, Puzzles Lib, CreativeCore, FTB Library, FTB XMod Compat, Item Filters, Structurize, MultiPiston, BlockUI, RCTApi, Cobblemon Trainers, GlitchCore

### Core Engine (~10 mods)
KubeJS, KubeJS Create, LootJS, MoreJS, FTB Quests, FTB Teams, FTB Chunks, Game Stages, Polymorph, CraftTweaker

### Automation and Engineering (~10 mods)
Create, Create: Steam 'n Rails, Create: Crafts & Additions, Create: Enchantment Industry, Create: Slice & Dice, Create: Garnished, Create: Connected, Immersive Engineering, Immersive Petroleum, Applied Energistics 2

### Space and Dimensions (~3 mods + custom)
Stellaris, Cobblemon/Stellaris Compatibility Patch, custom planet datapacks

### Cobblemon Ecosystem (~6 mods + custom)
Cobblemon, AllTheMons datapack, Cobblemon Loot Balls, Cobblemon Outbreaks, CNPC-Cobblemon-Addon, custom spawn datapacks

### Colonies and Workers (~2 mods + custom)
MineColonies, custom worker type configs

### Combat and RPG (~8 mods)
Better Combat, Iron's Spells 'n Spellbooks, Tough As Nails, Player Revive, Epic Fight, Curios API (equipment), custom combat scripts

### Economy (~2 mods)
Lightman's Currency, custom economy scripts

### Food and Agriculture (~6 mods)
Farmer's Delight, Let's Do Vinery, Let's Do Brewery, Spice of Life: Carrot Edition, Cooking for Blockheads, custom farming tools

### World Generation (~12 mods)
Terralith, YUNG's Better Dungeons/Mineshafts/Strongholds/Witch Huts/Ocean Monuments/Nether Fortresses/End Island, Tectonic, custom structures

### NPCs and Dialogue (~3 mods)
Custom NPCs Unofficial, Easy NPC, Radical Cobblemon Trainers

### Quality of Life (~15 mods)
JEI, JourneyMap, Jade, Inventory Profiles Next, FTB Ultimine, AppleSkin, Xaero's Map additions, Waystones, Storage Drawers, Sophisticated Backpacks, Entity Culling, Supplementaries, misc utility mods

**Total: approximately 113 mods**

---

## Config Tuning Guide

### FTB Quests
File: `config/ftbquests/`

- `detection_delay`: 60 (ticks between quest checks). Increase to 120 for lower-spec servers.
- `progression_mode`: "flexible" (allow non-linear quest completion).
- `default_consume_items`: false (do not take items on quest completion).

### Create
File: `config/create-common.toml`

- `maxAssemblySize`: 400 (default). Increase for larger contraptions.
- `maxTrainRelocationDistance`: 128. Increase if trains need longer routes.

### Cobblemon
File: `config/cobblemon/`

- `maxPokemonPerPlayer`: 30 (storage limit). Adjust based on server capacity.
- `spawnRate`: Adjust per-biome spawn tables in datapacks.
- `battleTimeout`: 300 seconds. Increase for longer battles.

### Lightman's Currency
File: `config/lightmanscurrency-common.toml`

- `coinDropRate`: Adjust mob coin drop frequency.
- `bankStorageLimit`: Set maximum bank balance per player.

### MineColonies
File: `config/minecolonies-common.toml`

- `maxCitizensPerColony`: 50 (default). Reduce for performance.
- `enableColonyProtection`: true.
- `maxColoniesPerPlayer`: 3.

### Tough As Nails
File: `config/toughasnails-common.toml`

- `enableThirst`: true.
- `enableTemperature`: true.
- `thirstExhaustionRate`: 0.004 (increase for harder survival).

### FTB Chunks
File: `config/ftbchunks-common.toml`

- `maxClaimedChunks`: 100 (per player).
- `maxForceLoadedChunks`: 5 (per player). Keep low for performance.

### Game Stages
No direct config file. Stages are set via KubeJS scripts in `kubejs/server_scripts/`.

---

## Performance Optimization

### Memory

- Allocate 16 GB to the server JVM. Do not exceed installed RAM.
- Use G1GC garbage collector (see JVM args above).
- Monitor GC pause times with `-Xlog:gc*:file=gc.log`.

### Tick Rate

- Target: 20 TPS (50ms per tick).
- Use `/forge tps` to monitor.
- If TPS drops below 18:
  1. Reduce `view-distance` to 8.
  2. Reduce `simulation-distance` to 6.
  3. Check for excessive entities with `/forge entities`.
  4. Reduce MineColonies `maxCitizensPerColony`.
  5. Reduce Cobblemon spawn rates.
  6. Limit FTB Chunks force-loaded chunks per player.

### Entity Management

- Cobblemon spawns can flood the entity count. Monitor with `/forge entities`.
- Use Cobblemon config to limit max wild spawns per chunk.
- MineColonies workers count as entities. Large colonies impact TPS.
- Create contraptions with many moving parts cause lag. Set `maxAssemblySize` appropriately.

### World Generation

- Pre-generate the world using a world pre-generation mod or tool before players join.
- Recommended pre-gen radius: 5000 blocks from spawn.
- This prevents lag spikes from on-the-fly chunk generation.

### Network

- Set `network-compression-threshold=256` in server.properties.
- For high-player-count servers (12+), consider a reverse proxy.

---

## Common Issues and Fixes

### Issue: Server fails to start with "mixin" errors
**Fix:** Ensure all library mods are present. Missing dependencies (Architectury, GlitchCore, etc.) cause mixin failures. Check the crash log for the missing mod ID.

### Issue: Quests not appearing in quest book
**Fix:** Ensure FTB Quests SNBT files are in `config/ftbquests/quests/`. Run `python tools/generate_content.py --quests` to regenerate from definitions.

### Issue: Pokemon not spawning in certain biomes
**Fix:** Check custom spawn datapacks in `datapacks/`. Verify the biome tags match the installed world generation mod (Terralith changes biome IDs).

### Issue: Create trains stuck or not moving
**Fix:** Increase `maxTrainRelocationDistance` in Create config. Ensure tracks are loaded (force-load chunks along the route or increase simulation distance).

### Issue: MineColonies workers idle
**Fix:** Check that workers have access to required materials. Verify the builder has a valid schematic. Check for path-finding issues (blocked doorways, missing ladders).

### Issue: Economy inflation
**Fix:** Reduce coin drop rates in Lightman's Currency config. Add coin sinks: higher worker wages, expensive recipes, warp shard costs.

### Issue: TPS drops during Gate dungeon runs
**Fix:** Gate instances generate on-the-fly. Reduce the number of concurrent gate instances. Pre-generate gate template dimensions.

### Issue: Client crash on joining (texture errors)
**Fix:** Ensure the resource pack is installed on the client. Check that `AllTheMons-resourcepack.zip` is in the client's resource packs folder.

### Issue: Nutrition bars not showing
**Fix:** Verify Spice of Life: Carrot Edition is installed on both server and client. Check config for HUD display settings.

### Issue: Crime stat not decaying
**Fix:** Verify the KubeJS crime decay script is loaded (`kubejs/server_scripts/crime/crime_decay.js`). The script runs on `server.tick` events. Check server console for KubeJS errors.

---

## OP Commands Reference

Server operators have access to additional management commands.

### Horizons Admin Commands

| Command | Description |
|---|---|
| `/horizons admin setperk <player> <tree> <points>` | Set perk points for a player |
| `/horizons admin resetperks <player>` | Reset all perk points for a player |
| `/horizons admin setrep <player> <faction> <value>` | Set faction reputation |
| `/horizons admin setcrime <player> <value>` | Set crime stat directly |
| `/horizons admin clearcrime <player>` | Clear all crime and bounties |
| `/horizons admin setjob <player> <job> <level>` | Set a player's job and level |
| `/horizons admin grant <player> <stage>` | Grant a Game Stage |
| `/horizons admin revoke <player> <stage>` | Revoke a Game Stage |
| `/horizons admin gate <player> <floor>` | Teleport player to a specific gate floor |
| `/horizons admin economy <action> <args>` | Manage the economy (add/remove coins, reset shops) |
| `/horizons admin reload` | Reload all Horizons KubeJS scripts |
| `/horizons admin debug <system>` | Toggle debug output for a system |

### FTB Quests Admin

| Command | Description |
|---|---|
| `/ftbquests editing_mode` | Toggle quest editing mode |
| `/ftbquests change_progress <player> <quest> complete` | Force-complete a quest |
| `/ftbquests change_progress <player> <quest> reset` | Reset a quest |
| `/ftbquests reload` | Reload quest data from files |

### Game Stages Admin

| Command | Description |
|---|---|
| `/gamestage add <player> <stage>` | Add a stage to a player |
| `/gamestage remove <player> <stage>` | Remove a stage from a player |
| `/gamestage clear <player>` | Clear all stages |
| `/gamestage check <player> <stage>` | Check if player has a stage |
| `/gamestage all <player>` | List all stages for a player |

### KubeJS Admin

| Command | Description |
|---|---|
| `/kubejs reload server_scripts` | Reload server scripts |
| `/kubejs reload startup_scripts` | Requires server restart |
| `/kubejs errors` | Show script errors |
| `/kubejs hand` | Show held item NBT data |
| `/kubejs inventory` | Dump inventory to console |

### FTB Chunks Admin

| Command | Description |
|---|---|
| `/ftbchunks admin unclaim_all <player>` | Unclaim all chunks for a player |
| `/ftbchunks admin bypass` | Toggle admin bypass for chunk protection |

### Cobblemon Admin

| Command | Description |
|---|---|
| `/cobblemon givepokemon <player> <species> <level>` | Give a Pokemon to a player |
| `/cobblemon spawnpokemon <species> <level>` | Spawn a Pokemon at your location |
| `/cobblemon pokebox <player>` | View a player's PC storage |

### MineColonies Admin

| Command | Description |
|---|---|
| `/minecolonies colony info <id>` | View colony information |
| `/minecolonies colony delete <id>` | Delete a colony |
| `/minecolonies citizens kill <colony> <citizen>` | Remove a citizen |
| `/minecolonies colony teleport <id>` | Teleport to a colony |

### Standard Server Commands

| Command | Description |
|---|---|
| `/forge tps` | View current TPS |
| `/forge entities` | List entity counts by type |
| `/forge generate` | Pre-generate chunks |
| `/gamerule <rule> <value>` | Modify game rules |
| `/whitelist add/remove <player>` | Manage whitelist |
| `/ban/pardon <player>` | Manage bans |
| `/op/deop <player>` | Manage operators |
| `/backup start` | Trigger a manual backup |

---

## Backup Strategy

- **Frequency:** Every 4 hours minimum, hourly recommended.
- **What to back up:** The entire `world/` directory, `config/`, and `kubejs/`.
- **Retention:** Keep at least 7 days of rolling backups.
- **Tools:** Use a server wrapper (e.g., AMP, Pterodactyl) with built-in backup scheduling, or a cron job with rsync/tar.
- **Test restores regularly.** An untested backup is not a backup.
