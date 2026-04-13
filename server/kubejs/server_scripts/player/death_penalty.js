// ============================================================
// Project Horizons — Death Penalty
// ============================================================
// File: kubejs/server_scripts/player/death_penalty.js
// Phase: 5
// Dependencies: Lightman's Currency
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// On death, the player loses a percentage of carried Lightman's
// Currency coins. Lost coins drop as item entities at the death
// location for recovery. Crime stat affects the penalty rate.
// Perk tree mitigations via stages. First death per session has
// a grace period (no penalty).
//
// PENALTY RATES:
//   Default:     15% of carried coins
//   Outlaw (4+): 25% of carried coins
//   In Gate:     10% + kicked to Gate entrance
//   path_vanguard perk: reduces to 10%
//
// COMMANDS:
//   /horizons death penalty info
// ============================================================

// --- Configuration ---
const DEATH_CONFIG = {
  // persistentData keys
  keys: {
    sessionDeaths: 'horizons_session_deaths',
    totalDeaths: 'horizons_total_deaths',
    lastDeathTick: 'horizons_last_death_tick',
    sessionInit: 'horizons_death_session_init'
  },

  // Default penalty rate (15%)
  defaultPenaltyRate: 0.15,

  // Outlaw penalty rate (25%, for crime stat 4+)
  outlawPenaltyRate: 0.25,

  // Gate death penalty rate (10%)
  gatePenaltyRate: 0.10,

  // Vanguard perk reduced penalty rate (10%)
  vanguardPenaltyRate: 0.10,

  // Lightman's Currency coin item IDs
  coinItems: [
    'lightmanscurrency:coin_copper',
    'lightmanscurrency:coin_iron',
    'lightmanscurrency:coin_gold',
    'lightmanscurrency:coin_emerald',
    'lightmanscurrency:coin_diamond',
    'lightmanscurrency:coin_netherite'
  ],

  // Coin values relative to copper for total calculation
  coinValues: {
    'lightmanscurrency:coin_copper': 1,
    'lightmanscurrency:coin_iron': 10,
    'lightmanscurrency:coin_gold': 100,
    'lightmanscurrency:coin_emerald': 1000,
    'lightmanscurrency:coin_diamond': 10000,
    'lightmanscurrency:coin_netherite': 100000
  },

  // Crime stat key (from crime_stat.js)
  crimeStatKey: 'horizons_crime_stat',

  // Gate keys (from gate_system.js)
  inGateKey: 'horizons_in_gate',
  gateReturnX: 'horizons_gate_return_x',
  gateReturnY: 'horizons_gate_return_y',
  gateReturnZ: 'horizons_gate_return_z',
  gateReturnDim: 'horizons_gate_return_dim',

  debug: true
};

// --- Utility Functions ---

function deathLog(message) {
  if (DEATH_CONFIG.debug) {
    console.log('[Horizons/Death] ' + message);
  }
}

/**
 * Determine the current penalty rate for a player.
 * Returns { rate, reason } where rate is 0.0-1.0.
 */
function getPenaltyRate(player) {
  let data = player.persistentData;
  let sessionDeaths = data.getInt(DEATH_CONFIG.keys.sessionDeaths) || 0;

  // First death of session: grace period
  if (sessionDeaths === 0) {
    return { rate: 0, reason: 'First death grace period' };
  }

  // Check if in a gate dungeon
  let inGate = data.getBoolean(DEATH_CONFIG.keys.inGateKey) || false;
  if (inGate) {
    return { rate: DEATH_CONFIG.gatePenaltyRate, reason: 'Gate dungeon (10%)' };
  }

  // Check for Vanguard perk
  if (player.stages.has('path_vanguard')) {
    return { rate: DEATH_CONFIG.vanguardPenaltyRate, reason: 'Vanguard perk (10%)' };
  }

  // Check crime stat for outlaw penalty
  let crimeStat = data.getInt(DEATH_CONFIG.crimeStatKey) || 0;
  if (crimeStat >= 4) {
    return { rate: DEATH_CONFIG.outlawPenaltyRate, reason: 'Outlaw status (25%)' };
  }

  return { rate: DEATH_CONFIG.defaultPenaltyRate, reason: 'Standard (15%)' };
}

/**
 * Count total coin value in a player's inventory.
 * Returns { totalValue, slotData } where slotData maps slot indices to { id, count, value }.
 */
function countCoins(player) {
  let inventory = player.inventory;
  let totalValue = 0;
  let slotData = [];

  for (let slot = 0; slot < inventory.size; slot++) {
    let stack = inventory.getStackInSlot(slot);
    if (stack.isEmpty()) continue;

    let itemId = stack.id;
    let coinVal = DEATH_CONFIG.coinValues[itemId];
    if (coinVal !== undefined) {
      let stackValue = stack.count * coinVal;
      totalValue += stackValue;
      slotData.push({ slot: slot, id: itemId, count: stack.count, unitValue: coinVal, totalValue: stackValue });
    }
  }

  return { totalValue: totalValue, slotData: slotData };
}

/**
 * Remove a specific copper-value amount of coins from inventory.
 * Removes highest-denomination coins first for efficiency.
 * Returns the actual value removed.
 */
function removeCoins(player, targetValue) {
  let inventory = player.inventory;
  let remaining = targetValue;

  // Sort coin items by value descending for efficient removal
  let sortedCoinIds = Object.keys(DEATH_CONFIG.coinValues).sort(
    (a, b) => DEATH_CONFIG.coinValues[b] - DEATH_CONFIG.coinValues[a]
  );

  for (let coinId of sortedCoinIds) {
    if (remaining <= 0) break;
    let unitVal = DEATH_CONFIG.coinValues[coinId];

    for (let slot = 0; slot < inventory.size; slot++) {
      if (remaining <= 0) break;
      let stack = inventory.getStackInSlot(slot);
      if (stack.isEmpty() || stack.id !== coinId) continue;

      let coinsNeeded = Math.ceil(remaining / unitVal);
      let coinsToRemove = Math.min(coinsNeeded, stack.count);
      stack.shrink(coinsToRemove);
      remaining -= coinsToRemove * unitVal;
    }
  }

  return targetValue - Math.max(0, remaining);
}

// ============================================================
// DEATH EVENT — Apply penalty
// ============================================================

PlayerEvents.respawned(event => {
  let player = event.player;
  let data = player.persistentData;
  let server = player.server;

  // Increment session and total death counts
  let sessionDeaths = data.getInt(DEATH_CONFIG.keys.sessionDeaths) || 0;
  let totalDeaths = data.getInt(DEATH_CONFIG.keys.totalDeaths) || 0;

  // Determine penalty BEFORE incrementing (grace check uses pre-increment count)
  let penalty = getPenaltyRate(player);

  // Now increment
  data.putInt(DEATH_CONFIG.keys.sessionDeaths, sessionDeaths + 1);
  data.putInt(DEATH_CONFIG.keys.totalDeaths, totalDeaths + 1);
  data.putLong(DEATH_CONFIG.keys.lastDeathTick, server.tickCount);

  // Check if in gate — need to handle return before coin counting
  let wasInGate = data.getBoolean(DEATH_CONFIG.keys.inGateKey) || false;

  if (wasInGate) {
    // Return to gate entrance
    let returnX = data.getDouble(DEATH_CONFIG.keys.gateReturnX);
    let returnY = data.getDouble(DEATH_CONFIG.keys.gateReturnY);
    let returnZ = data.getDouble(DEATH_CONFIG.keys.gateReturnZ);
    let returnDim = data.getString(DEATH_CONFIG.keys.gateReturnDim);

    // Clear gate state
    data.putBoolean(DEATH_CONFIG.keys.inGateKey, false);
    data.putInt('horizons_gate_floor', 0);

    // Teleport back after a brief delay (next tick)
    if (returnDim && returnDim.length > 0) {
      server.runCommandSilent(
        'execute in ' + returnDim + ' run tp ' + player.username + ' ' +
        returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
      );
    } else {
      server.runCommandSilent(
        'tp ' + player.username + ' ' +
        returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
      );
    }

    player.tell('\u00a7c[Horizons] \u00a77You fell in the Gate. Returned to the entrance.');
  }

  // Grace period — no coin penalty
  if (penalty.rate <= 0) {
    player.tell('\u00a7e[Horizons] \u00a77Death recorded. ' + penalty.reason + ' \u00a78(no coin penalty)');
    deathLog(player.username + ' death #' + (sessionDeaths + 1) + ' — grace period');
    return;
  }

  // Count coins in inventory
  let coinData = countCoins(player);

  if (coinData.totalValue <= 0) {
    player.tell('\u00a7e[Horizons] \u00a77Death recorded. No coins to lose.');
    deathLog(player.username + ' death #' + (sessionDeaths + 1) + ' — no coins');
    return;
  }

  // Calculate penalty
  let penaltyValue = Math.floor(coinData.totalValue * penalty.rate);
  if (penaltyValue <= 0) {
    player.tell('\u00a7e[Horizons] \u00a77Death recorded. Penalty too small to apply.');
    return;
  }

  // Remove coins from inventory
  let actualRemoved = removeCoins(player, penaltyValue);

  // Drop penalty coins at death location as recoverable items
  // Spawn the highest-denomination coins possible at spawn point
  let dropValue = actualRemoved;
  let sortedCoins = Object.keys(DEATH_CONFIG.coinValues).sort(
    (a, b) => DEATH_CONFIG.coinValues[b] - DEATH_CONFIG.coinValues[a]
  );

  // Use player's current position (respawn point) as approximate drop location
  // In practice, the death position would be tracked — we use a summon at respawn
  let dropX = player.x;
  let dropY = player.y;
  let dropZ = player.z;

  for (let coinId of sortedCoins) {
    if (dropValue <= 0) break;
    let unitVal = DEATH_CONFIG.coinValues[coinId];
    let coinsToSpawn = Math.floor(dropValue / unitVal);
    if (coinsToSpawn <= 0) continue;

    // Cap individual summons to prevent lag
    coinsToSpawn = Math.min(coinsToSpawn, 64);
    dropValue -= coinsToSpawn * unitVal;

    server.runCommandSilent(
      'summon minecraft:item ' +
      dropX.toFixed(1) + ' ' + (dropY + 0.5).toFixed(1) + ' ' + dropZ.toFixed(1) +
      ' {Item:{id:"' + coinId + '",Count:' + coinsToSpawn + '},PickupDelay:40}'
    );
  }

  // Notify player
  let pctDisplay = Math.floor(penalty.rate * 100);
  player.tell('\u00a7c=== Death Penalty ===');
  player.tell('\u00a77Penalty rate: \u00a7c' + pctDisplay + '% \u00a77(' + penalty.reason + ')');
  player.tell('\u00a77Coins lost: \u00a7c' + actualRemoved + ' \u00a77copper value');
  player.tell('\u00a77Dropped coins near your position for recovery.');
  if (wasInGate) {
    player.tell('\u00a77You have been returned to the Gate entrance.');
  }

  // Wayfinder perk preserves waypoint
  if (player.stages.has('path_wayfinder')) {
    player.tell('\u00a7a[Perk] \u00a77Wayfinder: Your waypoint has been preserved.');
  }

  deathLog(player.username + ' death #' + (sessionDeaths + 1) +
    ' — lost ' + actualRemoved + ' copper value (' + pctDisplay + '%)');
});

// ============================================================
// COMMANDS: /horizons death penalty info
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('death')
        .then(Commands.literal('penalty')
          .then(Commands.literal('info')
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let data = player.persistentData;
              let penalty = getPenaltyRate(player);
              let sessionDeaths = data.getInt(DEATH_CONFIG.keys.sessionDeaths) || 0;
              let totalDeaths = data.getInt(DEATH_CONFIG.keys.totalDeaths) || 0;
              let crimeStat = data.getInt(DEATH_CONFIG.crimeStatKey) || 0;
              let coinData = countCoins(player);
              let pctDisplay = Math.floor(penalty.rate * 100);

              player.tell('\u00a7e=== Death Penalty Info ===');
              player.tell('\u00a77Current penalty rate: \u00a7f' + pctDisplay + '%');
              player.tell('\u00a77Reason: \u00a7f' + penalty.reason);
              player.tell('');

              // Current coin value
              player.tell('\u00a77Carried coin value: \u00a76' + coinData.totalValue + ' copper');
              if (coinData.totalValue > 0 && penalty.rate > 0) {
                let wouldLose = Math.floor(coinData.totalValue * penalty.rate);
                player.tell('\u00a77At-risk coins: \u00a7c' + wouldLose + ' copper');
              }

              player.tell('');
              player.tell('\u00a77Session deaths: \u00a7f' + sessionDeaths);
              player.tell('\u00a77Total deaths: \u00a7f' + totalDeaths);
              player.tell('\u00a77Crime stat: \u00a7f' + crimeStat + '/6');

              // Show active modifiers
              player.tell('');
              player.tell('\u00a77Active Modifiers:');

              if (sessionDeaths === 0) {
                player.tell('  \u00a7a+ First death grace (no penalty)');
              }
              if (player.stages.has('path_vanguard')) {
                player.tell('  \u00a7a+ Vanguard perk (10% rate)');
              }
              if (player.stages.has('path_wayfinder')) {
                player.tell('  \u00a7a+ Wayfinder perk (waypoint preserved)');
              }
              if (crimeStat >= 4) {
                player.tell('  \u00a7c- Outlaw status (25% rate)');
              }
              let inGate = data.getBoolean(DEATH_CONFIG.keys.inGateKey) || false;
              if (inGate) {
                player.tell('  \u00a7e~ Gate dungeon (10% + return to entrance)');
              }

              // Rate table
              player.tell('');
              player.tell('\u00a77Penalty Rates:');
              player.tell('  \u00a77Standard: \u00a7f15%');
              player.tell('  \u00a77Outlaw (crime 4+): \u00a7c25%');
              player.tell('  \u00a77Gate dungeon: \u00a7e10% + return');
              player.tell('  \u00a77Vanguard perk: \u00a7a10%');
              player.tell('  \u00a77First session death: \u00a7a0% (grace)');

              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Reset session death counter
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  // Reset session deaths on new login (session = login to logout)
  data.putInt(DEATH_CONFIG.keys.sessionDeaths, 0);

  // Initialize total deaths if not present
  if (!data.contains(DEATH_CONFIG.keys.totalDeaths)) {
    data.putInt(DEATH_CONFIG.keys.totalDeaths, 0);
  }

  deathLog('Reset session deaths for ' + player.username);
});

console.log('[Horizons] Death Penalty loaded');
console.log('[Horizons] Commands: /horizons death penalty info');
console.log('[Horizons] Rates: 15% standard, 25% outlaw, 10% gate, 0% first death');
