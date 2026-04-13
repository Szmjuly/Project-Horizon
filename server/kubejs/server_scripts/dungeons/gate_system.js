// ============================================================
// Project Horizons — Gate System
// ============================================================
// File: kubejs/server_scripts/dungeons/gate_system.js
// Phase: 2
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Solo Leveling-inspired Gate dungeon system. Players interact with
// gate portal blocks (crying obsidian) to enter instanced dungeon
// floors. Floors scale in difficulty and are organized into tiers
// (E through S). Player progress is tracked via persistentData and
// stages, with loot scaling based on floor depth.
//
// STAGE NAMING CONVENTION:
//   gate_tier_e, gate_tier_d, gate_tier_c, gate_tier_b, gate_tier_a, gate_tier_s
//   gate_floor_10, gate_floor_20, gate_floor_30, gate_floor_50
//
// COMMANDS:
//   /horizons gate status          — Show current floor, tier, highest floor
//   /horizons gate enter <floor>   — Admin: enter a specific floor (OP only)
// ============================================================

// --- Configuration ---
const GATE_CONFIG = {
  // Block that acts as a gate portal
  gateBlock: 'minecraft:crying_obsidian',

  // Maximum floor
  maxFloor: 100,

  // Tier definitions: [tierName, minFloor, maxFloor, colorCode]
  tiers: [
    ['E', 1,  10, '\u00a77'],   // Gray
    ['D', 11, 20, '\u00a7a'],   // Green
    ['C', 21, 30, '\u00a7b'],   // Aqua
    ['B', 31, 50, '\u00a7e'],   // Yellow
    ['A', 51, 75, '\u00a76'],   // Gold
    ['S', 76, 100, '\u00a7c']   // Red
  ],

  // persistentData keys
  keys: {
    currentFloor: 'horizons_gate_floor',
    highestFloor: 'horizons_gate_highest',
    inGate: 'horizons_in_gate',
    returnX: 'horizons_gate_return_x',
    returnY: 'horizons_gate_return_y',
    returnZ: 'horizons_gate_return_z',
    returnDim: 'horizons_gate_return_dim'
  },

  // Floor milestone stages
  floorMilestones: [10, 20, 30, 50],

  // Loot modifier per floor: base * (1 + floor * lootScaling)
  lootScaling: 0.05,

  // Debug logging
  debug: true
};

// --- Utility Functions ---

function gateLog(message) {
  if (GATE_CONFIG.debug) {
    console.log(`[Horizons/Gate] ${message}`);
  }
}

/**
 * Get the tier info for a given floor number.
 * Returns { name, min, max, color } or null if invalid.
 */
function getTierForFloor(floor) {
  for (const [name, min, max, color] of GATE_CONFIG.tiers) {
    if (floor >= min && floor <= max) {
      return { name: name, min: min, max: max, color: color };
    }
  }
  return null;
}

/**
 * Get the loot multiplier for a given floor.
 */
function getLootMultiplier(floor) {
  return 1 + floor * GATE_CONFIG.lootScaling;
}

/**
 * Check if a floor is a boss floor (every 10th floor).
 */
function isBossFloor(floor) {
  return floor > 0 && floor % 10 === 0;
}

/**
 * Get the current floor for a player.
 */
function getPlayerFloor(player) {
  return player.persistentData.getInt(GATE_CONFIG.keys.currentFloor) || 0;
}

/**
 * Get the highest floor reached by a player.
 */
function getHighestFloor(player) {
  return player.persistentData.getInt(GATE_CONFIG.keys.highestFloor) || 0;
}

/**
 * Check if a player is currently inside a gate.
 */
function isInGate(player) {
  return player.persistentData.getBoolean(GATE_CONFIG.keys.inGate) || false;
}

/**
 * Store the player's current position for gate return.
 */
function storeReturnPosition(player) {
  const data = player.persistentData;
  data.putDouble(GATE_CONFIG.keys.returnX, player.x);
  data.putDouble(GATE_CONFIG.keys.returnY, player.y);
  data.putDouble(GATE_CONFIG.keys.returnZ, player.z);
  data.putString(GATE_CONFIG.keys.returnDim, player.level.dimension.toString());
  gateLog(`Stored return position for ${player.username}: ${player.x}, ${player.y}, ${player.z}`);
}

/**
 * Enter a gate at the specified floor.
 */
function enterGate(player, floor) {
  if (floor < 1 || floor > GATE_CONFIG.maxFloor) {
    player.tell('\u00a7c[Horizons] Invalid floor number. Must be 1-' + GATE_CONFIG.maxFloor + '.');
    return false;
  }

  if (isInGate(player)) {
    player.tell('\u00a7c[Horizons] You are already inside a gate!');
    return false;
  }

  const tier = getTierForFloor(floor);
  if (!tier) {
    player.tell('\u00a7c[Horizons] Could not determine tier for floor ' + floor + '.');
    return false;
  }

  // Store return position before teleporting
  storeReturnPosition(player);

  const data = player.persistentData;
  data.putInt(GATE_CONFIG.keys.currentFloor, floor);
  data.putBoolean(GATE_CONFIG.keys.inGate, true);

  // Update highest floor if needed
  const highest = getHighestFloor(player);
  if (floor > highest) {
    data.putInt(GATE_CONFIG.keys.highestFloor, floor);
  }

  // Grant tier stages
  const tierLetter = tier.name.toLowerCase();
  if (!player.stages.has('gate_tier_' + tierLetter)) {
    player.stages.add('gate_tier_' + tierLetter);
    player.tell('\u00a7e[Horizons] \u00a77Tier unlocked: ' + tier.color + 'Tier ' + tier.name);
  }

  // Grant floor milestone stages
  for (const milestone of GATE_CONFIG.floorMilestones) {
    if (floor >= milestone && !player.stages.has('gate_floor_' + milestone)) {
      player.stages.add('gate_floor_' + milestone);
      player.tell('\u00a7e[Horizons] \u00a77Gate milestone: \u00a7fFloor ' + milestone + ' reached!');
    }
  }

  // Teleport to gate area (placeholder: teleport to y=0 in overworld)
  // In full implementation, this would teleport to a gate dimension or structure
  player.server.runCommandSilent(
    'tp ' + player.username + ' ~ 0 ~ 0 0'
  );

  // Boss floor notification
  const bossText = isBossFloor(floor) ? ' \u00a74[BOSS FLOOR]' : '';
  const lootMult = getLootMultiplier(floor).toFixed(1);

  player.tell('\u00a7e==============================');
  player.tell('\u00a7e  GATE OPENED' + bossText);
  player.tell('\u00a77  Floor: ' + tier.color + floor + ' \u00a77(' + tier.color + 'Tier ' + tier.name + '\u00a77)');
  player.tell('\u00a77  Loot Modifier: \u00a7a' + lootMult + 'x');
  player.tell('\u00a7e==============================');

  gateLog(player.username + ' entered gate floor ' + floor + ' (Tier ' + tier.name + ')');
  return true;
}

/**
 * Exit the current gate, returning the player to their stored position.
 */
function exitGate(player) {
  if (!isInGate(player)) {
    player.tell('\u00a7c[Horizons] You are not inside a gate.');
    return false;
  }

  const data = player.persistentData;
  const returnX = data.getDouble(GATE_CONFIG.keys.returnX);
  const returnY = data.getDouble(GATE_CONFIG.keys.returnY);
  const returnZ = data.getDouble(GATE_CONFIG.keys.returnZ);
  const returnDim = data.getString(GATE_CONFIG.keys.returnDim);
  const floor = getPlayerFloor(player);
  const tier = getTierForFloor(floor);

  // Clear gate state
  data.putBoolean(GATE_CONFIG.keys.inGate, false);
  data.putInt(GATE_CONFIG.keys.currentFloor, 0);

  // Teleport back to stored position
  // If dimension info is available, use execute in to change dimension
  if (returnDim && returnDim.length > 0) {
    player.server.runCommandSilent(
      'execute in ' + returnDim + ' run tp ' + player.username + ' ' +
      returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
    );
  } else {
    player.server.runCommandSilent(
      'tp ' + player.username + ' ' +
      returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
    );
  }

  const tierName = tier ? tier.color + 'Tier ' + tier.name : '\u00a77Unknown';
  player.tell('\u00a7e[Horizons] \u00a77Gate cleared! Returned from Floor ' + floor + ' (' + tierName + '\u00a77)');
  gateLog(player.username + ' exited gate from floor ' + floor);
  return true;
}

/**
 * Advance to the next floor within the gate.
 */
function advanceFloor(player) {
  if (!isInGate(player)) {
    player.tell('\u00a7c[Horizons] You are not inside a gate.');
    return false;
  }

  const currentFloor = getPlayerFloor(player);
  const nextFloor = currentFloor + 1;

  if (nextFloor > GATE_CONFIG.maxFloor) {
    player.tell('\u00a76[Horizons] \u00a7eYou have reached the maximum floor! The gate collapses...');
    exitGate(player);
    return false;
  }

  const data = player.persistentData;
  data.putInt(GATE_CONFIG.keys.currentFloor, nextFloor);

  // Update highest floor if needed
  const highest = getHighestFloor(player);
  if (nextFloor > highest) {
    data.putInt(GATE_CONFIG.keys.highestFloor, nextFloor);
  }

  const newTier = getTierForFloor(nextFloor);

  // Check for tier transition
  const oldTier = getTierForFloor(currentFloor);
  if (oldTier && newTier && oldTier.name !== newTier.name) {
    const tierLetter = newTier.name.toLowerCase();
    if (!player.stages.has('gate_tier_' + tierLetter)) {
      player.stages.add('gate_tier_' + tierLetter);
    }
    player.tell('\u00a7e[Horizons] \u00a77Tier advanced: ' + newTier.color + 'Tier ' + newTier.name + '!');
  }

  // Check floor milestones
  for (const milestone of GATE_CONFIG.floorMilestones) {
    if (nextFloor >= milestone && !player.stages.has('gate_floor_' + milestone)) {
      player.stages.add('gate_floor_' + milestone);
      player.tell('\u00a7e[Horizons] \u00a77Gate milestone: \u00a7fFloor ' + milestone + ' reached!');
    }
  }

  const bossText = isBossFloor(nextFloor) ? ' \u00a74[BOSS FLOOR]' : '';
  const lootMult = getLootMultiplier(nextFloor).toFixed(1);

  player.tell('\u00a7e--- Floor ' + nextFloor + bossText + ' ---');
  player.tell('\u00a77Tier: ' + newTier.color + newTier.name + ' \u00a77| Loot: \u00a7a' + lootMult + 'x');

  gateLog(player.username + ' advanced to floor ' + nextFloor);
  return true;
}

// ============================================================
// GATE PORTAL DETECTION — Right-click crying obsidian
// ============================================================

BlockEvents.rightClicked(event => {
  const block = event.block;
  const player = event.player;

  if (!player || !block) return;
  if (block.id !== GATE_CONFIG.gateBlock) return;

  // If already in a gate, offer to exit
  if (isInGate(player)) {
    exitGate(player);
    return;
  }

  // Determine which floor to enter
  // Default: player's highest floor + 1, or floor 1 if new
  const highest = getHighestFloor(player);
  const targetFloor = Math.min(highest + 1, GATE_CONFIG.maxFloor);
  const entryFloor = targetFloor < 1 ? 1 : targetFloor;

  enterGate(player, entryFloor);
});

// ============================================================
// COMMAND REGISTRATION — /horizons gate
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('gate')
        // /horizons gate status
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const data = player.persistentData;
            const inGate = isInGate(player);
            const currentFloor = getPlayerFloor(player);
            const highest = getHighestFloor(player);

            player.tell('\u00a7e=== Gate Status ===');

            if (inGate && currentFloor > 0) {
              const tier = getTierForFloor(currentFloor);
              const bossText = isBossFloor(currentFloor) ? ' \u00a74[BOSS]' : '';
              const lootMult = getLootMultiplier(currentFloor).toFixed(1);
              player.tell('\u00a77Status: \u00a7aINSIDE GATE');
              player.tell('\u00a77Current Floor: ' + tier.color + currentFloor + bossText);
              player.tell('\u00a77Current Tier: ' + tier.color + 'Tier ' + tier.name);
              player.tell('\u00a77Loot Modifier: \u00a7a' + lootMult + 'x');
            } else {
              player.tell('\u00a77Status: \u00a7fOutside gate');
            }

            player.tell('\u00a77Highest Floor: \u00a7f' + (highest > 0 ? highest : 'None'));

            // Show tier progress
            player.tell('\u00a77Tier Progress:');
            for (const [name, min, max, color] of GATE_CONFIG.tiers) {
              const tierLetter = name.toLowerCase();
              const hasStage = player.stages.has('gate_tier_' + tierLetter);
              const indicator = hasStage ? '\u00a7a\u2713' : '\u00a78\u2717';
              player.tell('  ' + indicator + ' ' + color + 'Tier ' + name + ' \u00a77(Floors ' + min + '-' + max + ')');
            }

            // Show floor milestones
            player.tell('\u00a77Floor Milestones:');
            for (const milestone of GATE_CONFIG.floorMilestones) {
              const hasStage = player.stages.has('gate_floor_' + milestone);
              const indicator = hasStage ? '\u00a7a\u2713' : '\u00a78\u2717';
              player.tell('  ' + indicator + ' \u00a77Floor ' + milestone);
            }

            return 1;
          })
        )
        // /horizons gate enter <floor> — OP only
        .then(Commands.literal('enter')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('floor', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const floor = event.getArguments().INTEGER.getResult(ctx, 'floor');
              enterGate(player, floor);
              return 1;
            })
          )
        )
        // /horizons gate exit
        .then(Commands.literal('exit')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;
            exitGate(player);
            return 1;
          })
        )
        // /horizons gate advance — move to next floor
        .then(Commands.literal('advance')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;
            advanceFloor(player);
            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize gate data
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  // Initialize gate data if first login
  if (!data.contains(GATE_CONFIG.keys.highestFloor)) {
    data.putInt(GATE_CONFIG.keys.currentFloor, 0);
    data.putInt(GATE_CONFIG.keys.highestFloor, 0);
    data.putBoolean(GATE_CONFIG.keys.inGate, false);
    gateLog('Initialized gate data for ' + player.username);
  }

  // Safety check: if player was in a gate when they logged off,
  // return them to their stored position
  if (isInGate(player)) {
    player.tell('\u00a7e[Horizons] \u00a77You were in a gate when you disconnected. Returning to safety...');
    exitGate(player);
  }
});

console.log('[Horizons] Gate System loaded');
console.log('[Horizons] Commands: /horizons gate [status|enter|exit|advance]');
console.log('[Horizons] Gate block: ' + GATE_CONFIG.gateBlock);
