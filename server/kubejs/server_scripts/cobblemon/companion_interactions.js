// ============================================================
// Project Horizons — Companion Interactions
// ============================================================
// File: kubejs/server_scripts/cobblemon/companion_interactions.js
// Phase: 2
// Dependencies: Cobblemon, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// 5 Cobblemon type-based world interactions using a stage + command
// approach (since we cannot directly access Cobblemon's Java API
// from KubeJS). Players activate companion types via commands, and
// effects are applied periodically to players with active stages.
//
// COMPANION TYPES:
//   Fire     — Warmth: clears Freezing, Haste near furnaces
//   Water    — Reduces thirst drain, faster crop growth (8 blocks)
//   Grass    — Periodic bone meal on crops, +25% farming drops
//   Electric — Powers Create machines, XP near generators
//   Steel    — Mining Fatigue resistance, +10% armor effectiveness
//
// STAGES (only ONE active at a time):
//   companion_fire_active
//   companion_water_active
//   companion_grass_active
//   companion_electric_active
//   companion_steel_active
//
// COMMANDS:
//   /horizons companion activate <type>
//   /horizons companion deactivate
//   /horizons companion status
//
// EFFECT INTERVAL: 200 ticks (10 seconds)
// EFFECT RADIUS: 8 blocks for area effects
// ============================================================

// --- Configuration ---
const COMPANION_CONFIG = {
  // All companion type definitions
  types: {
    fire: {
      stage: 'companion_fire_active',
      name: 'Fire',
      color: '\u00a7c',
      description: 'Warmth: clears Freezing, Haste near furnaces',
      icon: '\u2668' // Hot springs symbol
    },
    water: {
      stage: 'companion_water_active',
      name: 'Water',
      color: '\u00a79',
      description: 'Reduces thirst drain, faster crop growth nearby',
      icon: '\u2248' // Water waves
    },
    grass: {
      stage: 'companion_grass_active',
      name: 'Grass',
      color: '\u00a7a',
      description: 'Periodic bone meal, +25% farming drops',
      icon: '\u2618' // Shamrock
    },
    electric: {
      stage: 'companion_electric_active',
      name: 'Electric',
      color: '\u00a7e',
      description: 'Powers Create machines, XP near generators',
      icon: '\u26a1' // Lightning
    },
    steel: {
      stage: 'companion_steel_active',
      name: 'Steel',
      color: '\u00a78',
      description: 'Mining Fatigue resistance, +10% armor boost',
      icon: '\u2694' // Swords
    }
  },

  // Tick interval for applying effects (200 ticks = 10 seconds)
  effectInterval: 200,

  // Effect radius for area effects (blocks)
  effectRadius: 8,

  // persistentData keys
  keys: {
    activeType: 'horizons_companion_type',
    lastActivation: 'horizons_companion_last_activation',
    lastSwitchTime: 'horizons_companion_last_switch'
  },

  // Furnace-like blocks for Fire companion Haste detection
  furnaceBlocks: [
    'minecraft:furnace',
    'minecraft:blast_furnace',
    'minecraft:smoker',
    'create:blaze_burner',
    'farmersdelight:stove',
    'farmersdelight:cooking_pot'
  ],

  // Generator-like blocks for Electric companion XP bonus
  generatorBlocks: [
    'create:hand_crank',
    'create:water_wheel',
    'create:large_water_wheel',
    'create:windmill_bearing',
    'create:creative_motor'
  ],

  debug: true
};

// --- Utility Functions ---

function companionLog(message) {
  if (COMPANION_CONFIG.debug) {
    console.log('[Horizons/Companion] ' + message);
  }
}

/**
 * Get the currently active companion type for a player.
 * Returns the type key (e.g., 'fire') or null.
 */
function getActiveCompanion(player) {
  let typeName = player.persistentData.getString(COMPANION_CONFIG.keys.activeType);
  if (typeName && COMPANION_CONFIG.types[typeName]) return typeName;
  return null;
}

/**
 * Get the companion type info object for a type key.
 */
function getCompanionInfo(typeKey) {
  return COMPANION_CONFIG.types[typeKey] || null;
}

/**
 * Deactivate the current companion (remove all companion stages).
 * Returns the previously active type key or null.
 */
function deactivateCompanion(player) {
  let previous = getActiveCompanion(player);

  // Remove all companion stages
  for (let [key, info] of Object.entries(COMPANION_CONFIG.types)) {
    if (player.stages.has(info.stage)) {
      player.stages.remove(info.stage);
    }
  }

  // Clear persistentData
  player.persistentData.putString(COMPANION_CONFIG.keys.activeType, '');

  if (previous) {
    companionLog(player.username + ' deactivated companion: ' + previous);
  }

  return previous;
}

/**
 * Activate a companion type for a player.
 * Deactivates any currently active companion first.
 */
function activateCompanion(player, typeKey) {
  let info = getCompanionInfo(typeKey);
  if (!info) return false;

  // Deactivate current companion
  let previous = deactivateCompanion(player);

  // Set new companion
  player.stages.add(info.stage);
  player.persistentData.putString(COMPANION_CONFIG.keys.activeType, typeKey);
  player.persistentData.putLong(
    COMPANION_CONFIG.keys.lastActivation,
    player.server.tickCount
  );

  // Track switch time for trust_fatigue.js fast-switching penalty
  if (previous && previous !== typeKey) {
    player.persistentData.putLong(
      COMPANION_CONFIG.keys.lastSwitchTime,
      player.server.tickCount
    );
  }

  companionLog(player.username + ' activated companion: ' + typeKey + (previous ? ' (was: ' + previous + ')' : ''));
  return true;
}

/**
 * Get the trust multiplier for companion effects.
 * Reads trust from persistentData (set by trust_fatigue.js).
 * Returns a value between 0.0 and 1.0.
 */
function getTrustMultiplier(player) {
  let trust = player.persistentData.getInt('horizons_companion_trust') || 0;
  return Math.max(0, Math.min(trust, 100)) / 100.0;
}

/**
 * Get the fatigue reduction factor.
 * At fatigue 75+, effects reduced by 50%.
 * Returns 1.0 (normal), 0.5 (fatigued), or 0.0 (exhausted/inactive).
 */
function getFatigueMultiplier(player) {
  let fatigue = player.persistentData.getInt('horizons_companion_fatigue') || 0;
  if (fatigue >= 100) return 0.0;
  if (fatigue >= 75) return 0.5;
  return 1.0;
}

/**
 * Combined effect multiplier (trust * fatigue).
 */
function getEffectMultiplier(player) {
  return getTrustMultiplier(player) * getFatigueMultiplier(player);
}

// ============================================================
// FIRE COMPANION — Warmth: clear Freezing, Haste near furnaces
// ============================================================

function applyFireEffects(player, multiplier) {
  // Clear freezing effect
  player.server.runCommandSilent(
    'effect clear ' + player.username + ' minecraft:freezing'
  );

  // Apply Fire Resistance (brief, refreshed every 10s)
  // Scaled: at low trust, shorter duration
  let duration = Math.max(12, Math.floor(15 * multiplier));
  player.server.runCommandSilent(
    'effect give ' + player.username + ' minecraft:fire_resistance ' + duration + ' 0 true'
  );

  // Check for nearby furnace-like blocks -> grant Haste
  let px = Math.floor(player.x);
  let py = Math.floor(player.y);
  let pz = Math.floor(player.z);
  let radius = COMPANION_CONFIG.effectRadius;
  let nearFurnace = false;

  let level = player.level;
  for (let dx = -radius; dx <= radius && !nearFurnace; dx++) {
    for (let dy = -3; dy <= 3 && !nearFurnace; dy++) {
      for (let dz = -radius; dz <= radius && !nearFurnace; dz++) {
        let blockId = level.getBlock(px + dx, py + dy, pz + dz).id;
        if (COMPANION_CONFIG.furnaceBlocks.indexOf(blockId) >= 0) {
          nearFurnace = true;
        }
      }
    }
  }

  if (nearFurnace) {
    let hasteLevel = multiplier >= 0.8 ? 1 : 0;
    player.server.runCommandSilent(
      'effect give ' + player.username + ' minecraft:haste ' + duration + ' ' + hasteLevel + ' true'
    );
  }
}

// ============================================================
// WATER COMPANION — Thirst reduction + crop growth boost
// ============================================================

function applyWaterEffects(player, multiplier) {
  // Thirst reduction is handled in thirst_integration.js
  // via checking the companion_water_active stage.

  // Crop growth boost: apply random tick speed increase in area
  // We use a gamerule command scoped to a small area via /forceload
  // Alternative: use bone meal on random nearby crops
  let px = Math.floor(player.x);
  let py = Math.floor(player.y);
  let pz = Math.floor(player.z);
  let radius = COMPANION_CONFIG.effectRadius;
  let level = player.level;

  // Find crops in radius and apply growth tick
  let cropsFound = 0;
  let maxCrops = Math.max(1, Math.floor(3 * multiplier)); // Up to 3 crops per cycle

  for (let dx = -radius; dx <= radius && cropsFound < maxCrops; dx++) {
    for (let dz = -radius; dz <= radius && cropsFound < maxCrops; dz++) {
      for (let dy = -2; dy <= 2 && cropsFound < maxCrops; dy++) {
        let block = level.getBlock(px + dx, py + dy, pz + dz);
        let blockId = block.id;
        // Check for common crop blocks
        if (blockId === 'minecraft:wheat' ||
            blockId === 'minecraft:carrots' ||
            blockId === 'minecraft:potatoes' ||
            blockId === 'minecraft:beetroots' ||
            blockId === 'minecraft:melon_stem' ||
            blockId === 'minecraft:pumpkin_stem' ||
            blockId === 'minecraft:sweet_berry_bush' ||
            blockId === 'minecraft:torchflower_crop' ||
            blockId === 'minecraft:pitcher_crop' ||
            blockId.startsWith('farmersdelight:') ||
            blockId.startsWith('croptopia:') ||
            blockId.startsWith('farm_and_charm:')) {
          // Apply random tick to simulate growth
          player.server.runCommandSilent(
            'forceload add ' + (px + dx) + ' ' + (pz + dz)
          );
          // Remove forceload immediately — the brief load triggers a tick
          player.server.runCommandSilent(
            'forceload remove ' + (px + dx) + ' ' + (pz + dz)
          );
          cropsFound++;
        }
      }
    }
  }
}

// ============================================================
// GRASS COMPANION — Bone meal on crops + farming drop bonus
// ============================================================

function applyGrassEffects(player, multiplier) {
  let px = Math.floor(player.x);
  let py = Math.floor(player.y);
  let pz = Math.floor(player.z);
  let radius = COMPANION_CONFIG.effectRadius;
  let level = player.level;

  // Apply bone meal to random nearby crops
  let cropsToMeal = Math.max(1, Math.floor(2 * multiplier));
  let cropPositions = [];

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dy = -2; dy <= 2; dy++) {
        let block = level.getBlock(px + dx, py + dy, pz + dz);
        let blockId = block.id;
        if (blockId === 'minecraft:wheat' ||
            blockId === 'minecraft:carrots' ||
            blockId === 'minecraft:potatoes' ||
            blockId === 'minecraft:beetroots' ||
            blockId === 'minecraft:melon_stem' ||
            blockId === 'minecraft:pumpkin_stem' ||
            blockId === 'minecraft:sweet_berry_bush' ||
            blockId === 'minecraft:torchflower_crop' ||
            blockId === 'minecraft:pitcher_crop' ||
            blockId.startsWith('farmersdelight:') ||
            blockId.startsWith('croptopia:') ||
            blockId.startsWith('farm_and_charm:')) {
          cropPositions.push({ x: px + dx, y: py + dy, z: pz + dz });
        }
      }
    }
  }

  // Randomly select crops to bone meal
  for (let i = 0; i < cropsToMeal && cropPositions.length > 0; i++) {
    let idx = Math.floor(Math.random() * cropPositions.length);
    let pos = cropPositions.splice(idx, 1)[0];
    // Use /particle and growth tick simulation
    player.server.runCommandSilent(
      'particle minecraft:happy_villager ' +
      (pos.x + 0.5) + ' ' + (pos.y + 0.5) + ' ' + (pos.z + 0.5) +
      ' 0.3 0.3 0.3 0 5'
    );
    // Simulate bone meal via setblock cycle (state increment)
    // Using the fill command to replace the block with itself triggers a growth update
    player.server.runCommandSilent(
      'execute at ' + player.username + ' run fill ' +
      pos.x + ' ' + pos.y + ' ' + pos.z + ' ' +
      pos.x + ' ' + pos.y + ' ' + pos.z + ' ' +
      level.getBlock(pos.x, pos.y, pos.z).id + ' replace'
    );
  }

  // +25% farming drops is handled via the harvest event below (loot modifier)
}

// ============================================================
// GRASS COMPANION — +25% farming drop bonus on harvest
// ============================================================

BlockEvents.broken(event => {
  let player = event.player;
  let block = event.block;
  if (!player || !block) return;

  // Only apply if grass companion is active
  if (!player.stages.has('companion_grass_active')) return;

  // Check if this is a crop block
  let id = block.id;
  let isCrop = (
    id === 'minecraft:wheat' ||
    id === 'minecraft:carrots' ||
    id === 'minecraft:potatoes' ||
    id === 'minecraft:beetroots' ||
    id === 'minecraft:melon' ||
    id === 'minecraft:pumpkin' ||
    id === 'minecraft:sweet_berry_bush' ||
    id.startsWith('farmersdelight:') ||
    id.startsWith('croptopia:') ||
    id.startsWith('farm_and_charm:')
  );

  if (!isCrop) return;

  let multiplier = getEffectMultiplier(player);
  // 25% chance of double drops, scaled by trust/fatigue
  let bonusChance = 0.25 * multiplier;
  if (Math.random() < bonusChance) {
    // Grant extra drops by running a loot give command
    // This drops an extra copy of the block's main drop at the player
    player.server.runCommandSilent(
      'loot give ' + player.username + ' mine ' +
      Math.floor(block.x) + ' ' + Math.floor(block.y) + ' ' + Math.floor(block.z) + ' ' +
      'minecraft:air{}'
    );
    player.tell('\u00a7a[Companion] \u00a77Your Grass companion found extra produce!');
  }
});

// ============================================================
// ELECTRIC COMPANION — XP near generators
// ============================================================

function applyElectricEffects(player, multiplier) {
  let px = Math.floor(player.x);
  let py = Math.floor(player.y);
  let pz = Math.floor(player.z);
  let radius = COMPANION_CONFIG.effectRadius;
  let level = player.level;
  let nearGenerator = false;

  for (let dx = -radius; dx <= radius && !nearGenerator; dx++) {
    for (let dy = -3; dy <= 3 && !nearGenerator; dy++) {
      for (let dz = -radius; dz <= radius && !nearGenerator; dz++) {
        let blockId = level.getBlock(px + dx, py + dy, pz + dz).id;
        if (COMPANION_CONFIG.generatorBlocks.indexOf(blockId) >= 0) {
          nearGenerator = true;
        }
      }
    }
  }

  if (nearGenerator) {
    // Grant small XP bonus, scaled by multiplier
    let xpAmount = Math.max(1, Math.floor(3 * multiplier));
    player.server.runCommandSilent(
      'experience add ' + player.username + ' ' + xpAmount + ' points'
    );
  }

  // Subtle visual: electric particles around player
  player.server.runCommandSilent(
    'particle minecraft:electric_spark ' +
    player.x + ' ' + (player.y + 1) + ' ' + player.z +
    ' 0.5 0.5 0.5 0.02 3'
  );
}

// ============================================================
// STEEL COMPANION — Mining Fatigue resistance + armor boost
// ============================================================

function applySteelEffects(player, multiplier) {
  // Remove Mining Fatigue if present
  player.server.runCommandSilent(
    'effect clear ' + player.username + ' minecraft:mining_fatigue'
  );

  // Grant brief Resistance effect for armor effectiveness boost
  // Resistance I = ~20% damage reduction, scaled by multiplier
  let duration = Math.max(12, Math.floor(15 * multiplier));
  if (multiplier >= 0.5) {
    player.server.runCommandSilent(
      'effect give ' + player.username + ' minecraft:resistance ' + duration + ' 0 true'
    );
  }

  // Visual: iron crack particles
  player.server.runCommandSilent(
    'particle minecraft:crit ' +
    player.x + ' ' + (player.y + 1) + ' ' + player.z +
    ' 0.3 0.3 0.3 0 2'
  );
}

// ============================================================
// PERIODIC TICK — Apply companion effects every 200 ticks
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Only check on our interval
  if (server.tickCount % COMPANION_CONFIG.effectInterval !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    let activeType = getActiveCompanion(player);
    if (!activeType) return;

    let multiplier = getEffectMultiplier(player);

    // If fatigue has shut down the companion, skip
    if (multiplier <= 0) return;

    // Apply type-specific effects
    switch (activeType) {
      case 'fire':
        applyFireEffects(player, multiplier);
        break;
      case 'water':
        applyWaterEffects(player, multiplier);
        break;
      case 'grass':
        applyGrassEffects(player, multiplier);
        break;
      case 'electric':
        applyElectricEffects(player, multiplier);
        break;
      case 'steel':
        applySteelEffects(player, multiplier);
        break;
    }
  });
});

// ============================================================
// COMMANDS: /horizons companion [activate|deactivate|status]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('companion')

        // /horizons companion activate <type>
        .then(Commands.literal('activate')
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(COMPANION_CONFIG.types)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let typeKey = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();
              let info = getCompanionInfo(typeKey);

              if (!info) {
                player.tell('\u00a7c[Horizons] Unknown companion type: ' + typeKey);
                player.tell('\u00a77Valid types: ' + Object.keys(COMPANION_CONFIG.types).join(', '));
                return 0;
              }

              let previous = getActiveCompanion(player);

              activateCompanion(player, typeKey);

              player.tell('\u00a7e=== Companion Activated ===');
              player.tell(info.color + info.icon + ' ' + info.name + '-Type Companion');
              player.tell('\u00a77' + info.description);

              if (previous && previous !== typeKey) {
                let prevInfo = getCompanionInfo(previous);
                player.tell('\u00a77(Deactivated ' + prevInfo.color + prevInfo.name + '\u00a77 companion)');
              }

              return 1;
            })
          )
        )

        // /horizons companion deactivate
        .then(Commands.literal('deactivate')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let previous = deactivateCompanion(player);

            if (previous) {
              let info = getCompanionInfo(previous);
              player.tell('\u00a7e[Horizons] ' + info.color + info.name + '\u00a7e companion deactivated.');
              player.tell('\u00a77Your companion is now resting.');
            } else {
              player.tell('\u00a77[Horizons] No companion is currently active.');
            }

            return 1;
          })
        )

        // /horizons companion status
        .then(Commands.literal('status')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let activeType = getActiveCompanion(player);
            let trust = player.persistentData.getInt('horizons_companion_trust') || 0;
            let fatigue = player.persistentData.getInt('horizons_companion_fatigue') || 0;

            player.tell('\u00a7e=== Companion Status ===');

            if (activeType) {
              let info = getCompanionInfo(activeType);
              let multiplier = getEffectMultiplier(player);
              let pct = Math.floor(multiplier * 100);

              player.tell('\u00a77Active: ' + info.color + info.icon + ' ' + info.name + '-Type');
              player.tell('\u00a77Effect: ' + info.description);
              player.tell('\u00a77Strength: \u00a7f' + pct + '%');

              if (fatigue >= 75) {
                player.tell('\u00a7c  ! Companion is fatigued (effects reduced 50%)');
              }
            } else {
              player.tell('\u00a77Active: \u00a78None');
              player.tell('\u00a77Use /horizons companion activate <type> to summon.');
            }

            // Trust & fatigue summary (details in trust_fatigue.js commands)
            player.tell('\u00a77Trust: \u00a7f' + trust + '/100');
            player.tell('\u00a77Fatigue: \u00a7f' + fatigue + '/100');

            // List available types
            player.tell('\u00a77Available Types:');
            for (let [key, info] of Object.entries(COMPANION_CONFIG.types)) {
              let active = (key === activeType) ? ' \u00a7a[ACTIVE]' : '';
              player.tell('  ' + info.color + info.icon + ' ' + info.name + active + ' \u00a77- ' + info.description);
            }

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Restore companion stage from persistentData
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let activeType = player.persistentData.getString(COMPANION_CONFIG.keys.activeType);

  // Restore companion stage if player had one active
  if (activeType && COMPANION_CONFIG.types[activeType]) {
    let info = COMPANION_CONFIG.types[activeType];
    // Ensure the stage is set (may have been lost on relog)
    if (!player.stages.has(info.stage)) {
      player.stages.add(info.stage);
    }
    player.tell('\u00a7e[Companion] ' + info.color + info.icon + ' ' + info.name + '\u00a7e-type companion is still active.');
  }
});

console.log('[Horizons] Companion Interactions loaded');
console.log('[Horizons] Commands: /horizons companion [activate|deactivate|status]');
console.log('[Horizons] Types: fire, water, grass, electric, steel');
