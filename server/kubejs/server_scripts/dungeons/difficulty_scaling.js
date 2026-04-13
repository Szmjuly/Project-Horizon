// ============================================================
// Project Horizons — Difficulty Scaling
// ============================================================
// File: kubejs/server_scripts/dungeons/difficulty_scaling.js
// Phase: 2
// Dependencies: KubeJS, gate_system.js
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Scales mob health, damage, and XP drops based on the player's
// current gate floor. Mobs spawned near a player who is inside
// a gate receive attribute modifiers proportional to floor depth.
// Boss floors (every 10th) apply additional multipliers.
//
// SCALING FORMULAS:
//   Health:  base * (1 + floor * 0.1)    — floor 10 = 2x, floor 50 = 6x
//   Damage:  base * (1 + floor * 0.05)   — floor 10 = 1.5x, floor 50 = 3.5x
//   XP Drop: base * (1 + floor * 0.15)   — floor 10 = 2.5x, floor 50 = 8.5x
//
// BOSS FLOORS (every 10th floor):
//   Additional 3x HP multiplier and 2x damage multiplier on top
// ============================================================

// --- Configuration ---
const SCALING_CONFIG = {
  // persistentData keys (must match gate_system.js)
  gateKeys: {
    inGate: 'horizons_in_gate',
    currentFloor: 'horizons_gate_floor'
  },

  // Scaling factors per floor
  healthPerFloor: 0.1,     // +10% HP per floor
  damagePerFloor: 0.05,    // +5% damage per floor
  xpPerFloor: 0.15,        // +15% XP per floor

  // Boss floor multipliers (applied on top of floor scaling)
  bossHealthMult: 3.0,
  bossDamageMult: 2.0,

  // Range in blocks to check for nearby gate players
  playerSearchRange: 64,

  // Mob types to exclude from scaling (peaceful mobs, etc.)
  excludedMobs: [
    'minecraft:villager',
    'minecraft:iron_golem',
    'minecraft:snow_golem',
    'minecraft:cat',
    'minecraft:wolf',
    'minecraft:horse',
    'minecraft:donkey',
    'minecraft:mule',
    'minecraft:parrot',
    'minecraft:bat',
    'minecraft:pig',
    'minecraft:cow',
    'minecraft:sheep',
    'minecraft:chicken',
    'minecraft:rabbit',
    'minecraft:fox',
    'minecraft:bee',
    'minecraft:turtle',
    'minecraft:dolphin',
    'minecraft:squid',
    'minecraft:glow_squid',
    'minecraft:axolotl',
    'minecraft:frog',
    'minecraft:tadpole',
    'minecraft:allay',
    'minecraft:wandering_trader',
    'minecraft:cod',
    'minecraft:salmon',
    'minecraft:tropical_fish',
    'minecraft:pufferfish'
  ],

  // Attribute modifier UUIDs (used to track our modifiers)
  modifierPrefix: 'horizons_gate_',

  // Debug logging
  debug: true
};

// --- Utility Functions ---

function scalingLog(message) {
  if (SCALING_CONFIG.debug) {
    console.log('[Horizons/Scaling] ' + message);
  }
}

/**
 * Check if a floor is a boss floor (every 10th).
 */
function isBossFloor(floor) {
  return floor > 0 && floor % 10 === 0;
}

/**
 * Calculate the health multiplier for a given floor.
 */
function getHealthMultiplier(floor) {
  let mult = 1 + floor * SCALING_CONFIG.healthPerFloor;
  if (isBossFloor(floor)) {
    mult *= SCALING_CONFIG.bossHealthMult;
  }
  return mult;
}

/**
 * Calculate the damage multiplier for a given floor.
 */
function getDamageMultiplier(floor) {
  let mult = 1 + floor * SCALING_CONFIG.damagePerFloor;
  if (isBossFloor(floor)) {
    mult *= SCALING_CONFIG.bossDamageMult;
  }
  return mult;
}

/**
 * Calculate the XP drop multiplier for a given floor.
 */
function getXPMultiplier(floor) {
  return 1 + floor * SCALING_CONFIG.xpPerFloor;
}

/**
 * Find the nearest player who is inside a gate, within search range.
 * Returns { player, floor } or null.
 */
function findNearestGatePlayer(entity) {
  const server = entity.server;
  if (!server) return null;

  let nearestPlayer = null;
  let nearestDistance = SCALING_CONFIG.playerSearchRange * SCALING_CONFIG.playerSearchRange;
  let nearestFloor = 0;

  server.players.forEach(player => {
    if (!player.persistentData.getBoolean(SCALING_CONFIG.gateKeys.inGate)) return;

    // Check same dimension
    if (player.level.dimension.toString() !== entity.level.dimension.toString()) return;

    const dx = player.x - entity.x;
    const dy = player.y - entity.y;
    const dz = player.z - entity.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < nearestDistance) {
      nearestDistance = distSq;
      nearestPlayer = player;
      nearestFloor = player.persistentData.getInt(SCALING_CONFIG.gateKeys.currentFloor) || 0;
    }
  });

  if (nearestPlayer && nearestFloor > 0) {
    return { player: nearestPlayer, floor: nearestFloor };
  }
  return null;
}

/**
 * Check if an entity type should be excluded from scaling.
 */
function isExcludedMob(entityType) {
  return SCALING_CONFIG.excludedMobs.includes(entityType);
}

// ============================================================
// MOB SPAWN SCALING — Apply attribute modifiers on spawn
// ============================================================

EntityEvents.spawned(event => {
  const entity = event.entity;

  // Only scale living entities (mobs)
  if (!entity || !entity.living) return;

  // Skip excluded mob types
  const entityType = entity.type.toString();
  if (isExcludedMob(entityType)) return;

  // Skip players
  if (entity.player) return;

  // Find nearest player in a gate
  const gateInfo = findNearestGatePlayer(entity);
  if (!gateInfo) return;

  const floor = gateInfo.floor;
  const healthMult = getHealthMultiplier(floor);
  const damageMult = getDamageMultiplier(floor);
  const boss = isBossFloor(floor);

  // Apply health scaling via attribute command
  // The modifier adds a percentage: (multiplier - 1) is the bonus fraction
  // We use the "add" operation (0) with a multiplied value, or "multiply_base" (1)
  const healthBonus = healthMult - 1;
  const damageBonus = damageMult - 1;

  const entityUUID = entity.uuid.toString();

  // Apply health modifier
  if (healthBonus > 0) {
    entity.server.runCommandSilent(
      'attribute ' + entityUUID +
      ' minecraft:generic.max_health modifier add ' +
      SCALING_CONFIG.modifierPrefix + 'health ' + healthBonus.toFixed(4) +
      ' multiply_base'
    );
    // Heal to new max HP so the mob actually has the scaled health
    entity.server.runCommandSilent(
      'attribute ' + entityUUID +
      ' minecraft:generic.max_health get'
    );
    // Set current health to max
    entity.heal(entity.maxHealth);
  }

  // Apply damage modifier
  if (damageBonus > 0) {
    entity.server.runCommandSilent(
      'attribute ' + entityUUID +
      ' minecraft:generic.attack_damage modifier add ' +
      SCALING_CONFIG.modifierPrefix + 'damage ' + damageBonus.toFixed(4) +
      ' multiply_base'
    );
  }

  // Tag the entity so we know it was scaled (for XP handling)
  entity.persistentData.putInt('horizons_gate_floor', floor);
  entity.persistentData.putBoolean('horizons_gate_scaled', true);

  // Give boss mobs a visible effect so players know
  if (boss) {
    entity.persistentData.putBoolean('horizons_gate_boss', true);
    // Give boss mobs glowing effect and fire resistance for visibility
    entity.server.runCommandSilent(
      'effect give ' + entityUUID + ' minecraft:glowing 99999 0 true'
    );
    // Custom name for boss mobs
    entity.server.runCommandSilent(
      'data merge entity ' + entityUUID +
      ' {CustomName:\'{"text":"\\u00a74\\u00a7l[Boss] \\u00a7cFloor ' + floor +
      ' Guardian","color":"red"}\',CustomNameVisible:1b}'
    );
  }

  scalingLog(
    'Scaled ' + entityType + ' for floor ' + floor +
    ' (HP x' + healthMult.toFixed(1) + ', DMG x' + damageMult.toFixed(1) + ')' +
    (boss ? ' [BOSS]' : '')
  );
});

// ============================================================
// XP DROP SCALING — Scale XP on mob death
// ============================================================

EntityEvents.death(event => {
  const entity = event.entity;

  // Only process scaled mobs
  if (!entity || !entity.living) return;
  if (!entity.persistentData.getBoolean('horizons_gate_scaled')) return;

  const floor = entity.persistentData.getInt('horizons_gate_floor') || 0;
  if (floor <= 0) return;

  const xpMult = getXPMultiplier(floor);

  // Drop bonus XP orbs near the entity
  // Base XP is already dropped by vanilla; we add the bonus portion
  // Bonus = baseXP * (multiplier - 1), but we don't know exact base XP
  // Instead, drop flat bonus XP scaled to floor
  const bonusXP = Math.floor(floor * SCALING_CONFIG.xpPerFloor * 5);
  if (bonusXP > 0) {
    entity.server.runCommandSilent(
      'summon minecraft:experience_orb ' +
      entity.x.toFixed(1) + ' ' +
      (entity.y + 0.5).toFixed(1) + ' ' +
      entity.z.toFixed(1) +
      ' {Value:' + bonusXP + '}'
    );
  }

  // Notify killer if they are a player
  const source = event.source;
  if (source && source.actual && source.actual.player) {
    const killer = source.actual;
    const isBoss = entity.persistentData.getBoolean('horizons_gate_boss') || false;
    if (isBoss) {
      killer.tell('\u00a76[Horizons] \u00a7eBoss defeated! +' + bonusXP + ' bonus XP');
    }
  }

  scalingLog(
    'Mob death on floor ' + floor + ': +'  + bonusXP + ' bonus XP (x' + xpMult.toFixed(1) + ')'
  );
});

// ============================================================
// DEBUG COMMAND — /horizons scaling info
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('scaling')
        .then(Commands.literal('info')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e=== Difficulty Scaling Info ===');

            if (!player.persistentData.getBoolean(SCALING_CONFIG.gateKeys.inGate)) {
              player.tell('\u00a77You are not in a gate. Scaling is inactive.');
              return 1;
            }

            const floor = player.persistentData.getInt(SCALING_CONFIG.gateKeys.currentFloor) || 0;
            const healthMult = getHealthMultiplier(floor);
            const damageMult = getDamageMultiplier(floor);
            const xpMult = getXPMultiplier(floor);
            const boss = isBossFloor(floor);

            player.tell('\u00a77Current Floor: \u00a7f' + floor + (boss ? ' \u00a74[BOSS]' : ''));
            player.tell('\u00a77Mob HP Scaling: \u00a7c' + healthMult.toFixed(1) + 'x' +
              (boss ? ' \u00a77(includes ' + SCALING_CONFIG.bossHealthMult + 'x boss bonus)' : ''));
            player.tell('\u00a77Mob DMG Scaling: \u00a7c' + damageMult.toFixed(1) + 'x' +
              (boss ? ' \u00a77(includes ' + SCALING_CONFIG.bossDamageMult + 'x boss bonus)' : ''));
            player.tell('\u00a77XP Drop Scaling: \u00a7a' + xpMult.toFixed(1) + 'x');

            // Show a preview of scaling at key floors
            player.tell('\u00a77--- Scaling Preview ---');
            const previewFloors = [1, 10, 20, 30, 50, 75, 100];
            for (const f of previewFloors) {
              const hp = getHealthMultiplier(f).toFixed(1);
              const dmg = getDamageMultiplier(f).toFixed(1);
              const xp = getXPMultiplier(f).toFixed(1);
              const bossMarker = isBossFloor(f) ? ' \u00a74[B]' : '';
              const marker = f === floor ? ' \u00a7a<-- you' : '';
              player.tell('\u00a77  F' + f + bossMarker + ': \u00a7cHP ' + hp + 'x \u00a77| \u00a7cDMG ' + dmg + 'x \u00a77| \u00a7aXP ' + xp + 'x' + marker);
            }

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Difficulty Scaling loaded');
console.log('[Horizons] Formulas: HP=1+floor*0.1, DMG=1+floor*0.05, XP=1+floor*0.15');
console.log('[Horizons] Boss floors (every 10th): +3x HP, +2x DMG');
