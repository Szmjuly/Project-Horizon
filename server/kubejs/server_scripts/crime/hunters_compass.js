// ============================================================
// Project Horizons — Hunter's Compass
// ============================================================
// File: kubejs/server_scripts/crime/hunters_compass.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Provides directional tracking for bounty hunters pursuing
// their assigned targets. Shows action bar messages with
// cardinal direction and approximate distance.
//
// Requirements:
//   - Player must have accepted a bounty (bounty_hunter_active stage)
//   - Target must be online and in the same dimension
//   - Compass tracking is toggleable via command
//
// Commands:
//   /horizons compass — toggle compass tracking on/off
// ============================================================

// --- Compass Configuration ---
const COMPASS_CONFIG = {
  // How often to update the compass (ticks)
  updateInterval: 200,

  // NBT keys
  compassEnabledKey: 'horizons_compass_enabled',
  hunterTargetKey: 'horizons_bounty_target',

  // Distance thresholds for descriptive ranges
  distanceRanges: [
    { max: 16, label: 'Very Close', color: '\u00a7a' },
    { max: 50, label: 'Nearby', color: '\u00a7e' },
    { max: 150, label: 'In Range', color: '\u00a76' },
    { max: 500, label: 'Distant', color: '\u00a7c' },
    { max: Infinity, label: 'Far Away', color: '\u00a74' }
  ]
};

// ============================================================
// UTILITY — Direction Calculation
// ============================================================

/**
 * Get cardinal direction from one position to another.
 * Returns a direction string like "N", "NE", "E", etc.
 */
function getCardinalDirection(fromX, fromZ, toX, toZ) {
  const dx = toX - fromX;
  const dz = toZ - fromZ;

  // atan2 gives angle in radians; convert to degrees
  // In Minecraft, negative Z is North, positive X is East
  const angle = Math.atan2(dx, -dz) * (180 / Math.PI);

  // Normalize to 0-360
  const normalized = ((angle % 360) + 360) % 360;

  // Map to 8 cardinal directions
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  if (normalized >= 292.5 && normalized < 337.5) return 'NW';

  return '?';
}

/**
 * Get a direction arrow character for display.
 */
function getDirectionArrow(direction) {
  const arrows = {
    'N': '\u2191',
    'NE': '\u2197',
    'E': '\u2192',
    'SE': '\u2198',
    'S': '\u2193',
    'SW': '\u2199',
    'W': '\u2190',
    'NW': '\u2196'
  };
  return arrows[direction] || '?';
}

/**
 * Get distance description and color.
 */
function getDistanceInfo(distance) {
  for (let range of COMPASS_CONFIG.distanceRanges) {
    if (distance <= range.max) {
      return { label: range.label, color: range.color };
    }
  }
  return { label: 'Unknown', color: '\u00a77' };
}

/**
 * Calculate horizontal distance between two positions.
 */
function calcDistance(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

// ============================================================
// COMPASS TRACKING — Periodic action bar updates
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % COMPASS_CONFIG.updateInterval !== 0) return;

  const players = server.players;
  for (let hunter of players) {
    // Check if hunter has compass enabled
    const compassEnabled = hunter.persistentData.getInt(COMPASS_CONFIG.compassEnabledKey) || 0;
    if (compassEnabled !== 1) continue;

    // Check if hunter has bounty_hunter_active stage
    if (!hunter.stages.has('bounty_hunter_active')) continue;

    // Get assigned target
    const targetName = hunter.persistentData.getString(COMPASS_CONFIG.hunterTargetKey);
    if (!targetName || targetName.length === 0) continue;

    // Find target player
    const target = server.getPlayer(targetName);
    if (!target) {
      // Target is offline
      server.runCommandSilent(
        `title ${hunter.username} actionbar {"text":"[\u2022] Target ${targetName} is OFFLINE [\u2022]","color":"dark_red"}`
      );
      continue;
    }

    // Check same dimension
    const hunterDim = hunter.level.dimension().toString();
    const targetDim = target.level.dimension().toString();

    if (hunterDim !== targetDim) {
      server.runCommandSilent(
        `title ${hunter.username} actionbar {"text":"[\u2022] Target is in another dimension [\u2022]","color":"dark_purple"}`
      );
      continue;
    }

    // Calculate direction and distance
    const hunterPos = hunter.blockPosition();
    const targetPos = target.blockPosition();

    const distance = calcDistance(hunterPos.x, hunterPos.z, targetPos.x, targetPos.z);
    const direction = getCardinalDirection(hunterPos.x, hunterPos.z, targetPos.x, targetPos.z);
    const arrow = getDirectionArrow(direction);
    const distInfo = getDistanceInfo(distance);
    const roundedDist = Math.round(distance);

    // Build action bar message as raw JSON for title command
    const message = `${arrow} ${direction} | ${distInfo.label} (~${roundedDist}m) | Target: ${targetName}`;

    // Determine color for JSON
    let jsonColor = 'gold';
    if (distance <= 16) jsonColor = 'green';
    else if (distance <= 50) jsonColor = 'yellow';
    else if (distance <= 150) jsonColor = 'gold';
    else if (distance <= 500) jsonColor = 'red';
    else jsonColor = 'dark_red';

    server.runCommandSilent(
      `title ${hunter.username} actionbar {"text":"[\\u2022] ${message} [\\u2022]","color":"${jsonColor}"}`
    );
  }
});

// ============================================================
// COMMAND — /horizons compass
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('compass')
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;

          // Check if player has a bounty assignment
          if (!player.stages.has('bounty_hunter_active')) {
            player.tell(
              '\u00a7c[Horizons] \u00a77You must have an active bounty to use the compass. Use \u00a7f/horizons bounty accept <target>'
            );
            return 0;
          }

          const targetName = player.persistentData.getString(COMPASS_CONFIG.hunterTargetKey);
          if (!targetName || targetName.length === 0) {
            player.tell(
              '\u00a7c[Horizons] \u00a77No target assigned. Accept a bounty first.'
            );
            return 0;
          }

          // Toggle compass
          const currentState = player.persistentData.getInt(COMPASS_CONFIG.compassEnabledKey) || 0;

          if (currentState === 1) {
            // Disable compass
            player.persistentData.putInt(COMPASS_CONFIG.compassEnabledKey, 0);
            player.tell(
              '\u00a7e[Horizons] \u00a77Hunter\'s Compass \u00a7cDISABLED\u00a77.'
            );
          } else {
            // Enable compass
            player.persistentData.putInt(COMPASS_CONFIG.compassEnabledKey, 1);
            player.tell(
              `\u00a7e[Horizons] \u00a77Hunter's Compass \u00a7aENABLED\u00a77. Tracking: \u00a7c${targetName}`
            );
            player.tell(
              '\u00a77Direction and distance will display on your action bar.'
            );
          }

          return 1;
        })
      )
  );
});

// ============================================================
// PLAYER JOIN — Auto-enable compass for active hunters
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;

  if (player.stages.has('bounty_hunter_active')) {
    const targetName = player.persistentData.getString(COMPASS_CONFIG.hunterTargetKey);
    if (targetName && targetName.length > 0) {
      // Auto-enable compass on login
      player.persistentData.putInt(COMPASS_CONFIG.compassEnabledKey, 1);
      player.tell(
        `\u00a7e[Horizons] \u00a77Hunter's Compass active. Tracking: \u00a7c${targetName}`
      );
    }
  }
});

console.log('[Horizons] Hunter\'s Compass loaded');
console.log('[Horizons] Commands: /horizons compass');
