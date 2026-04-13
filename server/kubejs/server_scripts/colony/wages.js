// ============================================================
// Project Horizons — Colony Wages
// ============================================================
// File: kubejs/server_scripts/colony/wages.js
// Phase: 3
// Dependencies: MineColonies, Lightman's Currency
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Replace MineColonies happiness with Lightman's Currency wages.
// Workers earn daily wages that are deducted from the colony owner's
// balance. Unpaid workers slow down and eventually stop.
//
// WAGE TABLE (per MC day = 24000 ticks):
//   Farmer=5, Builder=8, Guard=10, Miner=8, Fisher=5,
//   Cook=6, Researcher=12, Courier=5, Herder=5, Mechanic=7,
//   Composter=4, Smelter=6, Crafter=7, Enchanter=15,
//   Merchant=8, Healer=10
//
// COMMANDS:
//   /horizons colony wages — shows daily wage bill and status
//   /horizons colony payday — manually trigger payment (OP only)
// ============================================================

// --- Configuration ---
const WAGE_CONFIG = {
  // Base wages per worker type (in copper coins per MC day)
  wages: {
    farmer: 5,
    builder: 8,
    guard: 10,
    miner: 8,
    fisher: 5,
    cook: 6,
    researcher: 12,
    courier: 5,
    herder: 5,
    mechanic: 7,
    composter: 4,
    smelter: 6,
    crafter: 7,
    enchanter: 15,
    merchant: 8,
    healer: 10
  },

  // Pokemon pairing wage increase (20%)
  pairingWageMultiplier: 1.2,

  // persistentData keys
  keys: {
    totalOwed: 'horizons_wages_owed',
    daysSincePayment: 'horizons_wages_days_unpaid',
    lastPayday: 'horizons_wages_last_payday',
    workerCount: 'horizons_wages_worker_count',
    hiredWorkers: 'horizons_wages_hired'
  },

  // How many ticks between pay cycles (24000 = 1 MC day)
  payCycleTicks: 24000,

  // Days without pay before workers slow
  slowdownThreshold: 1,

  // Days without pay before workers stop
  stopThreshold: 3,

  // Stages applied for payment status
  stages: {
    paid: 'colony_wages_paid',
    slowdown: 'colony_wages_slowdown',
    stopped: 'colony_wages_stopped'
  },

  debug: true
};

// --- Utility Functions ---

function wageLog(message) {
  if (WAGE_CONFIG.debug) {
    console.log('[Horizons/Wages] ' + message);
  }
}

/**
 * Get the list of hired worker types for a player.
 * Stored as comma-separated string in persistentData.
 */
function getHiredWorkers(player) {
  let raw = player.persistentData.getString(WAGE_CONFIG.keys.hiredWorkers);
  if (!raw || raw.length === 0) return [];
  return raw.split(',').filter(function(w) { return w.length > 0; });
}

/**
 * Set the hired workers list.
 */
function setHiredWorkers(player, workers) {
  player.persistentData.putString(WAGE_CONFIG.keys.hiredWorkers, workers.join(','));
}

/**
 * Add a worker type to the hired list.
 */
function hireWorker(player, workerType) {
  let workers = getHiredWorkers(player);
  workers.push(workerType);
  setHiredWorkers(player, workers);
  wageLog(player.username + ' hired ' + workerType + ' (total: ' + workers.length + ')');
}

/**
 * Remove one instance of a worker type from the hired list.
 */
function fireWorker(player, workerType) {
  let workers = getHiredWorkers(player);
  let idx = workers.indexOf(workerType);
  if (idx >= 0) {
    workers.splice(idx, 1);
    setHiredWorkers(player, workers);
    wageLog(player.username + ' fired ' + workerType + ' (remaining: ' + workers.length + ')');
    return true;
  }
  return false;
}

/**
 * Check if a worker type has a pokemon pairing active.
 */
function hasPokemonPairing(player, workerType) {
  let val = player.persistentData.getString('horizons_colony_pair_' + workerType);
  return val && val.length > 0;
}

/**
 * Calculate the total daily wage bill for a player.
 */
function calculateDailyWages(player) {
  let workers = getHiredWorkers(player);
  let total = 0;

  for (let w of workers) {
    let baseWage = WAGE_CONFIG.wages[w] || 5;
    let wage = baseWage;

    // Pokemon pairing increases wage by 20%
    if (hasPokemonPairing(player, w)) {
      wage = Math.ceil(wage * WAGE_CONFIG.pairingWageMultiplier);
    }

    total += wage;
  }

  return total;
}

/**
 * Get a breakdown of wages by worker type (with counts).
 */
function getWageBreakdown(player) {
  let workers = getHiredWorkers(player);
  let breakdown = {};

  for (let w of workers) {
    if (!breakdown[w]) {
      breakdown[w] = { count: 0, baseWage: WAGE_CONFIG.wages[w] || 5, paired: hasPokemonPairing(player, w) };
    }
    breakdown[w].count++;
  }

  return breakdown;
}

/**
 * Attempt to deduct wages via Lightman's Currency command.
 * Returns true if successful, false if insufficient funds.
 */
function deductWages(player, amount) {
  if (amount <= 0) return true;

  // Use Lightman's Currency deduct command
  let result = player.server.runCommandSilent(
    'lc debit ' + player.username + ' ' + amount
  );

  // If result is 0, the command likely failed (insufficient funds)
  // Try alternative command format
  if (result === 0) {
    result = player.server.runCommandSilent(
      'lightmanscurrency bank debit ' + player.username + ' ' + amount
    );
  }

  return result > 0;
}

/**
 * Update wage-related stages based on days unpaid.
 */
function updateWageStages(player) {
  let daysUnpaid = player.persistentData.getInt(WAGE_CONFIG.keys.daysSincePayment);

  // Remove all wage stages first
  for (let stage of Object.values(WAGE_CONFIG.stages)) {
    if (player.stages.has(stage)) {
      player.stages.remove(stage);
    }
  }

  // Apply appropriate stage
  if (daysUnpaid >= WAGE_CONFIG.stopThreshold) {
    player.stages.add(WAGE_CONFIG.stages.stopped);
    // Apply mining fatigue to simulate workers stopping
    player.server.runCommandSilent(
      'effect give ' + player.username + ' minecraft:mining_fatigue 1200 1 true'
    );
  } else if (daysUnpaid >= WAGE_CONFIG.slowdownThreshold) {
    player.stages.add(WAGE_CONFIG.stages.slowdown);
    // Apply slowness to simulate workers slowing down
    player.server.runCommandSilent(
      'effect give ' + player.username + ' minecraft:slowness 1200 0 true'
    );
  } else {
    player.stages.add(WAGE_CONFIG.stages.paid);
  }
}

/**
 * Process payday for a single player.
 */
function processPayday(player) {
  let dailyWages = calculateDailyWages(player);

  if (dailyWages <= 0) {
    // No workers hired, nothing to pay
    player.persistentData.putInt(WAGE_CONFIG.keys.daysSincePayment, 0);
    updateWageStages(player);
    return;
  }

  let totalOwed = player.persistentData.getInt(WAGE_CONFIG.keys.totalOwed) + dailyWages;
  player.persistentData.putInt(WAGE_CONFIG.keys.totalOwed, totalOwed);

  // Attempt payment
  let success = deductWages(player, totalOwed);

  if (success) {
    player.persistentData.putInt(WAGE_CONFIG.keys.totalOwed, 0);
    player.persistentData.putInt(WAGE_CONFIG.keys.daysSincePayment, 0);
    player.persistentData.putLong(WAGE_CONFIG.keys.lastPayday, player.server.tickCount);
    player.tell('\u00a7a[Colony] \u00a77Wages paid: \u00a7e' + totalOwed + ' copper coins\u00a77. Workers are happy!');
    wageLog(player.username + ' paid ' + totalOwed + ' copper in wages');
  } else {
    let daysUnpaid = player.persistentData.getInt(WAGE_CONFIG.keys.daysSincePayment) + 1;
    player.persistentData.putInt(WAGE_CONFIG.keys.daysSincePayment, daysUnpaid);

    player.tell('\u00a7c[Colony] \u00a77Insufficient funds! Owed: \u00a7e' + totalOwed + ' copper coins');

    if (daysUnpaid >= WAGE_CONFIG.stopThreshold) {
      player.tell('\u00a7c[Colony] Workers have stopped working! (' + daysUnpaid + ' days unpaid)');
    } else if (daysUnpaid >= WAGE_CONFIG.slowdownThreshold) {
      player.tell('\u00a7e[Colony] Workers are slowing down... (' + daysUnpaid + ' days unpaid)');
    }

    wageLog(player.username + ' failed to pay ' + totalOwed + ' copper (days unpaid: ' + daysUnpaid + ')');
  }

  updateWageStages(player);
}

// ============================================================
// PERIODIC TICK — Process wages every MC day (24000 ticks)
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Process wages every MC day
  if (server.tickCount % WAGE_CONFIG.payCycleTicks !== 0) return;
  // Skip tick 0
  if (server.tickCount === 0) return;

  server.players.forEach(player => {
    if (!player) return;
    processPayday(player);
  });
});

// ============================================================
// PLAYER LOGIN — Initialize wage data and restore stages
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(WAGE_CONFIG.keys.totalOwed)) {
    data.putInt(WAGE_CONFIG.keys.totalOwed, 0);
    data.putInt(WAGE_CONFIG.keys.daysSincePayment, 0);
    data.putLong(WAGE_CONFIG.keys.lastPayday, 0);
    data.putString(WAGE_CONFIG.keys.hiredWorkers, '');
    wageLog('Initialized wage data for ' + player.username);
  }

  updateWageStages(player);
});

// ============================================================
// COMMANDS: /horizons colony [wages|payday|hire|fire]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('colony')

        // /horizons colony wages — show wage status
        .then(Commands.literal('wages')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let dailyWages = calculateDailyWages(player);
            let totalOwed = player.persistentData.getInt(WAGE_CONFIG.keys.totalOwed);
            let daysUnpaid = player.persistentData.getInt(WAGE_CONFIG.keys.daysSincePayment);
            let workers = getHiredWorkers(player);
            let breakdown = getWageBreakdown(player);

            player.tell('\u00a7e=== Colony Wage Report ===');
            player.tell('\u00a77Workers Employed: \u00a7f' + workers.length);
            player.tell('\u00a77Daily Wage Bill: \u00a7e' + dailyWages + ' copper coins');

            if (totalOwed > 0) {
              player.tell('\u00a7cOutstanding Debt: \u00a7e' + totalOwed + ' copper coins');
            }

            // Payment status
            if (daysUnpaid >= WAGE_CONFIG.stopThreshold) {
              player.tell('\u00a7cStatus: WORKERS STOPPED (' + daysUnpaid + ' days unpaid)');
            } else if (daysUnpaid >= WAGE_CONFIG.slowdownThreshold) {
              player.tell('\u00a7eStatus: Workers Slowed (' + daysUnpaid + ' days unpaid)');
            } else {
              player.tell('\u00a7aStatus: All Wages Paid');
            }

            // Breakdown
            if (Object.keys(breakdown).length > 0) {
              player.tell('');
              player.tell('\u00a77Wage Breakdown:');
              for (let [wType, info] of Object.entries(breakdown)) {
                let wage = info.baseWage;
                let pairedMark = '';
                if (info.paired) {
                  wage = Math.ceil(wage * WAGE_CONFIG.pairingWageMultiplier);
                  pairedMark = ' \u00a7d[Paired +20%]';
                }
                let label = wType.charAt(0).toUpperCase() + wType.slice(1);
                let lineTotal = wage * info.count;
                player.tell('  \u00a77' + label + ' x' + info.count + ': \u00a7e' + lineTotal + ' copper' + pairedMark);
              }
            }

            return 1;
          })
        )

        // /horizons colony payday — manually trigger payment (OP only)
        .then(Commands.literal('payday')
          .requires(function(source) { return source.hasPermission(2); })
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e[Colony] Processing manual payday...');
            processPayday(player);

            return 1;
          })
        )

        // /horizons colony hire <worker_type> — add a worker
        .then(Commands.literal('hire')
          .then(Commands.argument('worker_type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(WAGE_CONFIG.wages)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let workerType = event.getArguments().STRING.getResult(ctx, 'worker_type').toLowerCase();

              if (!WAGE_CONFIG.wages[workerType]) {
                player.tell('\u00a7c[Colony] Unknown worker type: ' + workerType);
                player.tell('\u00a77Valid types: ' + Object.keys(WAGE_CONFIG.wages).join(', '));
                return 0;
              }

              hireWorker(player, workerType);

              let wage = WAGE_CONFIG.wages[workerType];
              let label = workerType.charAt(0).toUpperCase() + workerType.slice(1);
              let workers = getHiredWorkers(player);
              let daily = calculateDailyWages(player);

              player.tell('\u00a7a[Colony] Hired a ' + label + '! \u00a77(Wage: \u00a7e' + wage + ' copper/day\u00a77)');
              player.tell('\u00a77Total workers: \u00a7f' + workers.length + ' \u00a77| Daily wages: \u00a7e' + daily + ' copper');

              // Grant prosperity for village_evolution.js
              player.server.runCommandSilent(
                'scoreboard players add ' + player.username + ' horizons_prosperity 3'
              );

              return 1;
            })
          )
        )

        // /horizons colony fire <worker_type> — remove a worker
        .then(Commands.literal('fire')
          .then(Commands.argument('worker_type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(WAGE_CONFIG.wages)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let workerType = event.getArguments().STRING.getResult(ctx, 'worker_type').toLowerCase();

              if (!fireWorker(player, workerType)) {
                player.tell('\u00a7c[Colony] No ' + workerType + ' is employed to dismiss.');
                return 0;
              }

              let label = workerType.charAt(0).toUpperCase() + workerType.slice(1);
              let daily = calculateDailyWages(player);
              player.tell('\u00a7e[Colony] Dismissed a ' + label + '.');
              player.tell('\u00a77Daily wages now: \u00a7e' + daily + ' copper');

              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Colony Wage system loaded');
console.log('[Horizons] Commands: /horizons colony [wages|payday|hire|fire]');
console.log('[Horizons] Pay cycle: every MC day (24000 ticks)');
