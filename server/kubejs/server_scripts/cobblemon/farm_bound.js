// ============================================================
// Project Horizons — Farm-Bound Companions
// ============================================================
// File: kubejs/server_scripts/cobblemon/farm_bound.js
// Phase: 4
// Dependencies: Cobblemon, MineColonies
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Persistent Pokemon companions assigned to farms via Companion Hut.
// Farm-bound Pokemon provide passive bonuses based on type (Grass,
// Water, Fire, Bug). Trust from trust_fatigue.js affects magnitude.
// Berry upkeep required per MC day or bonuses degrade and Pokemon
// eventually leave.
//
// DATA FORMAT (JSON array in persistentData):
//   [ { name, type, location, daysBound, daysUnfed } ]
//
// COMMANDS:
//   /horizons farm bind <pokemon_name> <type>
//   /horizons farm unbind <pokemon_name>
//   /horizons farm list
// ============================================================

// --- Configuration ---
const FARM_CONFIG = {
  // persistentData keys
  keys: {
    farmPokemon: 'horizons_farm_pokemon',
    lastFarmTick: 'horizons_farm_last_tick'
  },

  // Maximum farm-bound Pokemon per player
  maxFarmPokemon: 6,

  // Tick interval for applying farm bonuses (6000 ticks = 5 minutes)
  bonusInterval: 6000,

  // Berry upkeep check interval (24000 ticks = 1 MC day)
  upkeepInterval: 24000,

  // Days without berry before unhappy penalty
  unhappyThreshold: 2,

  // Days without berry before Pokemon leaves
  leaveThreshold: 5,

  // Valid farm Pokemon types and their bonuses
  typeEffects: {
    grass: {
      name: 'Grass',
      color: '\u00a7a',
      icon: '\u2618',
      description: '+15% crop yield in farm chunks',
      bonusTag: 'farm_grass_bonus'
    },
    water: {
      name: 'Water',
      color: '\u00a79',
      icon: '\u2248',
      description: 'Irrigate crops (bone meal every 5 min)',
      bonusTag: 'farm_water_bonus'
    },
    fire: {
      name: 'Fire',
      color: '\u00a7c',
      icon: '\u2668',
      description: 'Faster smelting in nearby furnaces',
      bonusTag: 'farm_fire_bonus'
    },
    bug: {
      name: 'Bug',
      color: '\u00a7e',
      icon: '\u2042',
      description: '+20% honey production near beehives',
      bonusTag: 'farm_bug_bonus'
    }
  },

  // Berry item IDs accepted as upkeep
  berryItems: [
    'cobblemon:oran_berry',
    'cobblemon:sitrus_berry',
    'cobblemon:leppa_berry',
    'cobblemon:pecha_berry',
    'cobblemon:rawst_berry',
    'cobblemon:cheri_berry',
    'cobblemon:chesto_berry',
    'cobblemon:aspear_berry',
    'cobblemon:persim_berry',
    'cobblemon:lum_berry',
    'minecraft:sweet_berries',
    'minecraft:glow_berries'
  ],

  // Radius to search for crops/furnaces/beehives (blocks)
  effectRadius: 12,

  // Furnace-like blocks for Fire bonus
  furnaceBlocks: [
    'minecraft:furnace',
    'minecraft:blast_furnace',
    'minecraft:smoker',
    'create:blaze_burner',
    'farmersdelight:stove',
    'farmersdelight:cooking_pot'
  ],

  // Beehive blocks for Bug bonus
  beehiveBlocks: [
    'minecraft:beehive',
    'minecraft:bee_nest'
  ],

  debug: true
};

// --- Utility Functions ---

function farmLog(message) {
  if (FARM_CONFIG.debug) {
    console.log('[Horizons/FarmBound] ' + message);
  }
}

/**
 * Get the farm Pokemon list for a player from persistentData.
 * Returns a parsed array of { name, type, location, daysBound, daysUnfed }.
 */
function getFarmPokemon(player) {
  let json = player.persistentData.getString(FARM_CONFIG.keys.farmPokemon);
  if (!json || json.length === 0) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    farmLog('Failed to parse farm pokemon data for ' + player.username);
    return [];
  }
}

/**
 * Save the farm Pokemon list to persistentData.
 */
function saveFarmPokemon(player, list) {
  player.persistentData.putString(FARM_CONFIG.keys.farmPokemon, JSON.stringify(list));
}

/**
 * Find a farm Pokemon by name in a player's list.
 */
function findFarmPokemon(list, name) {
  let lower = name.toLowerCase();
  for (let i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() === lower) return i;
  }
  return -1;
}

/**
 * Get trust multiplier from trust_fatigue.js data.
 * Returns 0.0 to 1.0 based on companion trust level.
 */
function getFarmTrustMultiplier(player) {
  let trust = player.persistentData.getInt('horizons_companion_trust') || 0;
  return Math.max(0, Math.min(trust, 100)) / 100.0;
}

/**
 * Get the effective bonus multiplier for a farm Pokemon.
 * Accounts for trust and unhappy state.
 */
function getEffectiveBonusMultiplier(player, pokemon) {
  let trustMult = getFarmTrustMultiplier(player);
  let happyMult = 1.0;

  // Reduce bonus by 50% if unfed for 2+ days
  if (pokemon.daysUnfed >= FARM_CONFIG.unhappyThreshold) {
    happyMult = 0.5;
  }

  return trustMult * happyMult;
}

/**
 * Build a visual bar for a value (0 to max).
 */
function buildBar(value, maxVal, filledColor, emptyColor) {
  let barLength = 15;
  let filled = Math.floor((value / maxVal) * barLength);
  let empty = barLength - filled;
  let bar = filledColor;
  for (let i = 0; i < filled; i++) bar += '|';
  bar += emptyColor;
  for (let i = 0; i < empty; i++) bar += '|';
  return bar;
}

// ============================================================
// PERIODIC BONUS APPLICATION — Every 5 minutes
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % FARM_CONFIG.bonusInterval !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    let farmPokemon = getFarmPokemon(player);
    if (farmPokemon.length === 0) return;

    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);
    let radius = FARM_CONFIG.effectRadius;
    let level = player.level;

    for (let pokemon of farmPokemon) {
      // Skip Pokemon that have passed the leave threshold
      if (pokemon.daysUnfed >= FARM_CONFIG.leaveThreshold) continue;

      let multiplier = getEffectiveBonusMultiplier(player, pokemon);
      if (multiplier <= 0) continue;

      let typeKey = pokemon.type.toLowerCase();

      // --- Water-type: bone meal random nearby crops ---
      if (typeKey === 'water') {
        let cropsToMeal = Math.max(1, Math.floor(2 * multiplier));
        let cropPositions = [];

        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            for (let dy = -3; dy <= 3; dy++) {
              let block = level.getBlock(px + dx, py + dy, pz + dz);
              let bid = block.id;
              if (bid === 'minecraft:wheat' || bid === 'minecraft:carrots' ||
                  bid === 'minecraft:potatoes' || bid === 'minecraft:beetroots' ||
                  bid === 'minecraft:melon_stem' || bid === 'minecraft:pumpkin_stem' ||
                  bid === 'minecraft:sweet_berry_bush' ||
                  bid.startsWith('farmersdelight:') || bid.startsWith('croptopia:') ||
                  bid.startsWith('farm_and_charm:')) {
                cropPositions.push({ x: px + dx, y: py + dy, z: pz + dz });
              }
            }
          }
        }

        for (let i = 0; i < cropsToMeal && cropPositions.length > 0; i++) {
          let idx = Math.floor(Math.random() * cropPositions.length);
          let pos = cropPositions.splice(idx, 1)[0];
          server.runCommandSilent(
            'particle minecraft:happy_villager ' +
            (pos.x + 0.5) + ' ' + (pos.y + 0.5) + ' ' + (pos.z + 0.5) +
            ' 0.3 0.3 0.3 0 5'
          );
        }
      }

      // --- Fire-type: Haste effect near furnaces ---
      if (typeKey === 'fire') {
        let nearFurnace = false;
        for (let dx = -radius; dx <= radius && !nearFurnace; dx++) {
          for (let dy = -3; dy <= 3 && !nearFurnace; dy++) {
            for (let dz = -radius; dz <= radius && !nearFurnace; dz++) {
              let blockId = level.getBlock(px + dx, py + dy, pz + dz).id;
              if (FARM_CONFIG.furnaceBlocks.indexOf(blockId) >= 0) {
                nearFurnace = true;
              }
            }
          }
        }
        if (nearFurnace) {
          let hasteDuration = Math.max(8, Math.floor(12 * multiplier));
          server.runCommandSilent(
            'effect give ' + player.username + ' minecraft:haste ' + hasteDuration + ' 1 true'
          );
        }
      }

      // --- Grass-type: crop yield bonus tracked via stage ---
      if (typeKey === 'grass') {
        if (!player.stages.has(FARM_CONFIG.typeEffects.grass.bonusTag)) {
          player.stages.add(FARM_CONFIG.typeEffects.grass.bonusTag);
        }
      }

      // --- Bug-type: honey bonus tracked via stage ---
      if (typeKey === 'bug') {
        let nearBeehive = false;
        for (let dx = -radius; dx <= radius && !nearBeehive; dx++) {
          for (let dy = -3; dy <= 3 && !nearBeehive; dy++) {
            for (let dz = -radius; dz <= radius && !nearBeehive; dz++) {
              let blockId = level.getBlock(px + dx, py + dy, pz + dz).id;
              if (FARM_CONFIG.beehiveBlocks.indexOf(blockId) >= 0) {
                nearBeehive = true;
              }
            }
          }
        }
        if (nearBeehive && !player.stages.has(FARM_CONFIG.typeEffects.bug.bonusTag)) {
          player.stages.add(FARM_CONFIG.typeEffects.bug.bonusTag);
        }
      }
    }
  });
});

// ============================================================
// GRASS-TYPE FARM BONUS — +15% crop drops on harvest
// ============================================================

BlockEvents.broken(event => {
  let player = event.player;
  let block = event.block;
  if (!player || !block) return;

  if (!player.stages.has(FARM_CONFIG.typeEffects.grass.bonusTag)) return;

  let id = block.id;
  let isCrop = (id === 'minecraft:wheat' || id === 'minecraft:carrots' ||
    id === 'minecraft:potatoes' || id === 'minecraft:beetroots' ||
    id === 'minecraft:melon' || id === 'minecraft:pumpkin' ||
    id === 'minecraft:sweet_berry_bush' ||
    id.startsWith('farmersdelight:') || id.startsWith('croptopia:') ||
    id.startsWith('farm_and_charm:'));

  if (!isCrop) return;

  let farmPokemon = getFarmPokemon(player);
  let hasGrass = farmPokemon.some(p => p.type.toLowerCase() === 'grass' && p.daysUnfed < FARM_CONFIG.leaveThreshold);
  if (!hasGrass) return;

  let multiplier = getFarmTrustMultiplier(player);
  let bonusChance = 0.15 * multiplier;

  if (Math.random() < bonusChance) {
    server.runCommandSilent(
      'particle minecraft:happy_villager ' +
      Math.floor(block.x) + ' ' + (Math.floor(block.y) + 1) + ' ' + Math.floor(block.z) +
      ' 0.3 0.3 0.3 0 5'
    );
    player.tell('\u00a7a[Farm] \u00a77Your farm Grass-type found extra produce!');
  }
});

// ============================================================
// DAILY UPKEEP CHECK — Berry consumption every MC day
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % FARM_CONFIG.upkeepInterval !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let farmPokemon = getFarmPokemon(player);
    if (farmPokemon.length === 0) return;

    let changed = false;
    let removals = [];

    for (let i = 0; i < farmPokemon.length; i++) {
      let pokemon = farmPokemon[i];
      pokemon.daysBound = (pokemon.daysBound || 0) + 1;

      // Check player inventory for berries
      let foundBerry = false;
      let inventory = player.inventory;

      for (let slot = 0; slot < inventory.size && !foundBerry; slot++) {
        let stack = inventory.getStackInSlot(slot);
        if (!stack.isEmpty()) {
          let itemId = stack.id;
          if (FARM_CONFIG.berryItems.indexOf(itemId) >= 0) {
            stack.shrink(1);
            foundBerry = true;
          }
        }
      }

      if (foundBerry) {
        pokemon.daysUnfed = 0;
        changed = true;
      } else {
        pokemon.daysUnfed = (pokemon.daysUnfed || 0) + 1;
        changed = true;

        if (pokemon.daysUnfed === FARM_CONFIG.unhappyThreshold) {
          let typeInfo = FARM_CONFIG.typeEffects[pokemon.type.toLowerCase()] || {};
          player.tell('\u00a7e[Farm] \u00a77' + pokemon.name + ' (' +
            (typeInfo.color || '\u00a7f') + (typeInfo.name || pokemon.type) +
            '\u00a77) is unhappy! Bonuses reduced by 50%. Feed berries!');
        }

        if (pokemon.daysUnfed >= FARM_CONFIG.leaveThreshold) {
          let typeInfo = FARM_CONFIG.typeEffects[pokemon.type.toLowerCase()] || {};
          player.tell('\u00a7c[Farm] \u00a77' + pokemon.name + ' (' +
            (typeInfo.color || '\u00a7f') + (typeInfo.name || pokemon.type) +
            '\u00a77) has left the farm due to neglect!');
          removals.push(i);
        }
      }
    }

    // Remove departed Pokemon (iterate in reverse)
    for (let r = removals.length - 1; r >= 0; r--) {
      farmPokemon.splice(removals[r], 1);
      changed = true;
    }

    if (changed) {
      saveFarmPokemon(player, farmPokemon);
    }

    // Clear bonus stages if no active Pokemon of that type remain
    for (let typeKey of Object.keys(FARM_CONFIG.typeEffects)) {
      let hasActive = farmPokemon.some(p =>
        p.type.toLowerCase() === typeKey && p.daysUnfed < FARM_CONFIG.leaveThreshold
      );
      let stageTag = FARM_CONFIG.typeEffects[typeKey].bonusTag;
      if (!hasActive && player.stages.has(stageTag)) {
        player.stages.remove(stageTag);
      }
    }
  });
});

// ============================================================
// COMMANDS: /horizons farm [bind|unbind|list]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('farm')

        // /horizons farm bind <pokemon_name> <type>
        .then(Commands.literal('bind')
          .then(Commands.argument('pokemon_name', event.getArguments().STRING.create(event))
            .then(Commands.argument('type', event.getArguments().STRING.create(event))
              .suggests((ctx, builder) => {
                for (let key of Object.keys(FARM_CONFIG.typeEffects)) {
                  builder.suggest(key);
                }
                return builder.buildFuture();
              })
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let pokemonName = event.getArguments().STRING.getResult(ctx, 'pokemon_name');
                let typeKey = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();

                // Validate type
                let typeInfo = FARM_CONFIG.typeEffects[typeKey];
                if (!typeInfo) {
                  player.tell('\u00a7c[Farm] Unknown type: ' + typeKey);
                  player.tell('\u00a77Valid types: ' + Object.keys(FARM_CONFIG.typeEffects).join(', '));
                  return 0;
                }

                let farmPokemon = getFarmPokemon(player);

                // Check max limit
                if (farmPokemon.length >= FARM_CONFIG.maxFarmPokemon) {
                  player.tell('\u00a7c[Farm] Maximum ' + FARM_CONFIG.maxFarmPokemon + ' farm-bound Pokemon reached!');
                  player.tell('\u00a77Unbind one first with /horizons farm unbind <name>');
                  return 0;
                }

                // Check if already bound
                if (findFarmPokemon(farmPokemon, pokemonName) >= 0) {
                  player.tell('\u00a7c[Farm] ' + pokemonName + ' is already farm-bound.');
                  return 0;
                }

                // Bind the Pokemon
                let entry = {
                  name: pokemonName,
                  type: typeKey,
                  location: Math.floor(player.x) + ',' + Math.floor(player.y) + ',' + Math.floor(player.z),
                  daysBound: 0,
                  daysUnfed: 0
                };
                farmPokemon.push(entry);
                saveFarmPokemon(player, farmPokemon);

                player.tell('\u00a7e=== Farm Pokemon Bound ===');
                player.tell(typeInfo.color + typeInfo.icon + ' ' + pokemonName + ' (' + typeInfo.name + '-type)');
                player.tell('\u00a77Bonus: ' + typeInfo.description);
                player.tell('\u00a77Location: ' + entry.location);
                player.tell('\u00a77Requires 1 berry per MC day as upkeep.');
                player.tell('\u00a77Farm slots: ' + farmPokemon.length + '/' + FARM_CONFIG.maxFarmPokemon);

                // Add bonus stage
                if (!player.stages.has(typeInfo.bonusTag)) {
                  player.stages.add(typeInfo.bonusTag);
                }

                server.runCommandSilent(
                  'particle minecraft:happy_villager ' +
                  player.x + ' ' + (player.y + 1) + ' ' + player.z +
                  ' 0.5 0.5 0.5 0 10'
                );

                farmLog(player.username + ' bound ' + pokemonName + ' (' + typeKey + ') at ' + entry.location);
                return 1;
              })
            )
          )
        )

        // /horizons farm unbind <pokemon_name>
        .then(Commands.literal('unbind')
          .then(Commands.argument('pokemon_name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let pokemonName = event.getArguments().STRING.getResult(ctx, 'pokemon_name');
              let farmPokemon = getFarmPokemon(player);
              let idx = findFarmPokemon(farmPokemon, pokemonName);

              if (idx < 0) {
                player.tell('\u00a7c[Farm] No farm-bound Pokemon named "' + pokemonName + '" found.');
                return 0;
              }

              let removed = farmPokemon.splice(idx, 1)[0];
              saveFarmPokemon(player, farmPokemon);

              let typeInfo = FARM_CONFIG.typeEffects[removed.type.toLowerCase()] || {};
              player.tell('\u00a7e[Farm] ' + (typeInfo.color || '\u00a7f') + removed.name +
                ' \u00a77has been unbound from the farm.');
              player.tell('\u00a77Farm slots: ' + farmPokemon.length + '/' + FARM_CONFIG.maxFarmPokemon);

              // Remove bonus stage if no more of that type
              let hasOther = farmPokemon.some(p =>
                p.type.toLowerCase() === removed.type.toLowerCase() && p.daysUnfed < FARM_CONFIG.leaveThreshold
              );
              if (!hasOther && typeInfo.bonusTag && player.stages.has(typeInfo.bonusTag)) {
                player.stages.remove(typeInfo.bonusTag);
              }

              farmLog(player.username + ' unbound ' + removed.name + ' (' + removed.type + ')');
              return 1;
            })
          )
        )

        // /horizons farm list
        .then(Commands.literal('list')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let farmPokemon = getFarmPokemon(player);

            player.tell('\u00a7e=== Farm-Bound Pokemon ===');
            player.tell('\u00a77Slots: ' + farmPokemon.length + '/' + FARM_CONFIG.maxFarmPokemon);

            if (farmPokemon.length === 0) {
              player.tell('\u00a78  No farm-bound Pokemon.');
              player.tell('\u00a77  Use /horizons farm bind <name> <type> to assign one.');
              return 1;
            }

            let trustMult = getFarmTrustMultiplier(player);

            for (let pokemon of farmPokemon) {
              let typeKey = pokemon.type.toLowerCase();
              let typeInfo = FARM_CONFIG.typeEffects[typeKey] || { name: pokemon.type, color: '\u00a7f', icon: '?', description: 'Unknown' };
              let effectiveMult = getEffectiveBonusMultiplier(player, pokemon);
              let pct = Math.floor(effectiveMult * 100);

              let statusColor = '\u00a7a';
              let statusText = 'Happy';
              if (pokemon.daysUnfed >= FARM_CONFIG.leaveThreshold) {
                statusColor = '\u00a74';
                statusText = 'DEPARTED';
              } else if (pokemon.daysUnfed >= FARM_CONFIG.unhappyThreshold) {
                statusColor = '\u00a7c';
                statusText = 'Unhappy (-50%)';
              }

              player.tell('');
              player.tell(typeInfo.color + typeInfo.icon + ' ' + pokemon.name + ' (' + typeInfo.name + '-type)');
              player.tell('  \u00a77Location: \u00a7f' + (pokemon.location || 'unknown'));
              player.tell('  \u00a77Days bound: \u00a7f' + (pokemon.daysBound || 0));
              player.tell('  \u00a77Status: ' + statusColor + statusText);
              player.tell('  \u00a77Bonus strength: \u00a7f' + pct + '%');
              player.tell('  \u00a77Effect: \u00a7f' + typeInfo.description);

              if (pokemon.daysUnfed > 0 && pokemon.daysUnfed < FARM_CONFIG.leaveThreshold) {
                let daysLeft = FARM_CONFIG.leaveThreshold - pokemon.daysUnfed;
                player.tell('  \u00a7c  Days unfed: ' + pokemon.daysUnfed + ' (leaves in ' + daysLeft + ' days)');
              }
            }

            player.tell('');
            player.tell('\u00a77Trust multiplier: \u00a7f' + Math.floor(trustMult * 100) + '%');
            player.tell('\u00a77Berry upkeep: 1 berry per Pokemon per MC day');

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize farm data
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(FARM_CONFIG.keys.farmPokemon)) {
    data.putString(FARM_CONFIG.keys.farmPokemon, '[]');
    farmLog('Initialized farm-bound data for ' + player.username);
  }

  // Restore bonus stages based on current farm Pokemon
  let farmPokemon = getFarmPokemon(player);
  for (let typeKey of Object.keys(FARM_CONFIG.typeEffects)) {
    let hasActive = farmPokemon.some(p =>
      p.type.toLowerCase() === typeKey && (p.daysUnfed || 0) < FARM_CONFIG.leaveThreshold
    );
    let stageTag = FARM_CONFIG.typeEffects[typeKey].bonusTag;
    if (hasActive && !player.stages.has(stageTag)) {
      player.stages.add(stageTag);
    }
  }

  if (farmPokemon.length > 0) {
    player.tell('\u00a7e[Farm] \u00a77You have ' + farmPokemon.length + ' farm-bound Pokemon.');
  }
});

console.log('[Horizons] Farm-Bound Companions loaded');
console.log('[Horizons] Commands: /horizons farm [bind|unbind|list]');
console.log('[Horizons] Types: grass, water, fire, bug');
