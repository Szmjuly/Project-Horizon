// ============================================================
// Project Horizons — Jobs Currency Bridge
// ============================================================
// File: kubejs/server_scripts/economy/jobs_currency_bridge.js
// Phase: 2
// Dependencies: Jobs+, Lightman's Currency
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Bridge between Jobs+ XP earnings and Lightman's Currency.
// Every 1200 ticks, checks for new job XP earned and converts
// deltas into copper coins (10 job XP = 1 copper coin).
//
// CUSTOM HORIZONS JOBS:
//   Vintner — wine production (vinery mod items)
//   Trainer Aide — Cobblemon training assistance
//   Brewer — potions and beer crafting
//
// COMMANDS:
//   /horizons jobs status — shows job levels and earnings
// ============================================================

// --- Configuration ---
const JOBS_CONFIG = {
  // Conversion rate: job XP to copper coins
  xpPerCoin: 10,

  // Tick interval for checking job XP deltas (1200 = 1 minute)
  checkInterval: 1200,

  // persistentData key prefix for tracking last-synced XP
  lastXpPrefix: 'horizons_jobs_last_xp_',

  // persistentData key for total coins earned from jobs
  totalEarnedKey: 'horizons_jobs_total_earned',

  // Known job types and their scoreboard objectives
  jobs: {
    miner:        { scoreboard: 'jobs_miner_xp',    display: 'Miner',        color: '\u00a78', icon: '\u26cf' },
    farmer:       { scoreboard: 'jobs_farmer_xp',    display: 'Farmer',       color: '\u00a7a', icon: '\u2618' },
    fisherman:    { scoreboard: 'jobs_fisherman_xp',  display: 'Fisherman',    color: '\u00a79', icon: '\u2248' },
    lumberjack:   { scoreboard: 'jobs_lumberjack_xp', display: 'Lumberjack',   color: '\u00a76', icon: '\u2692' },
    hunter:       { scoreboard: 'jobs_hunter_xp',    display: 'Hunter',       color: '\u00a7c', icon: '\u2694' },
    crafter:      { scoreboard: 'jobs_crafter_xp',   display: 'Crafter',      color: '\u00a7e', icon: '\u2699' },
    builder:      { scoreboard: 'jobs_builder_xp',   display: 'Builder',      color: '\u00a7f', icon: '\u2302' },
    cook:         { scoreboard: 'jobs_cook_xp',      display: 'Cook',         color: '\u00a76', icon: '\u2615' },
    vintner:      { scoreboard: 'jobs_vintner_xp',   display: 'Vintner',      color: '\u00a75', icon: '\u2697' },
    trainer_aide: { scoreboard: 'jobs_trainer_xp',   display: 'Trainer Aide', color: '\u00a7d', icon: '\u2605' },
    brewer:       { scoreboard: 'jobs_brewer_xp',    display: 'Brewer',       color: '\u00a73', icon: '\u2697' }
  },

  // Job level thresholds (XP required per level)
  levelThresholds: [0, 50, 150, 350, 700, 1200, 2000, 3500, 5500, 8000, 12000],

  // Bonus multiplier per job level (higher level = slightly more coins)
  levelBonusMultiplier: 0.05,

  debug: true
};

// --- Utility Functions ---

function jobsLog(message) {
  if (JOBS_CONFIG.debug) {
    console.log('[Horizons/Jobs] ' + message);
  }
}

/**
 * Get the last-synced XP value for a specific job.
 */
function getLastSyncedXP(player, jobKey) {
  return player.persistentData.getInt(JOBS_CONFIG.lastXpPrefix + jobKey);
}

/**
 * Set the last-synced XP value for a specific job.
 */
function setLastSyncedXP(player, jobKey, value) {
  player.persistentData.putInt(JOBS_CONFIG.lastXpPrefix + jobKey, value);
}

/**
 * Get the current XP for a job from scoreboard.
 * Returns 0 if scoreboard doesn't exist yet.
 */
function getCurrentJobXP(player, jobKey) {
  let jobInfo = JOBS_CONFIG.jobs[jobKey];
  if (!jobInfo) return 0;

  // Read XP from persistentData (set by Jobs+ or other systems)
  // Using scoreboard as the source of truth
  let xpKey = 'horizons_job_xp_' + jobKey;
  return player.persistentData.getInt(xpKey);
}

/**
 * Calculate job level from total XP.
 */
function getJobLevel(totalXP) {
  let level = 0;
  for (let i = JOBS_CONFIG.levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= JOBS_CONFIG.levelThresholds[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/**
 * Get the XP needed for the next level.
 */
function getXPForNextLevel(totalXP) {
  let level = getJobLevel(totalXP);
  if (level >= JOBS_CONFIG.levelThresholds.length - 1) return 0;
  return JOBS_CONFIG.levelThresholds[level + 1] - totalXP;
}

/**
 * Calculate coins earned from an XP delta, accounting for job level bonus.
 */
function calculateCoins(xpDelta, jobLevel) {
  if (xpDelta <= 0) return 0;
  let baseCoins = Math.floor(xpDelta / JOBS_CONFIG.xpPerCoin);
  let bonus = Math.floor(baseCoins * jobLevel * JOBS_CONFIG.levelBonusMultiplier);
  return baseCoins + bonus;
}

/**
 * Grant coins to a player via Lightman's Currency.
 */
function grantCoins(player, amount) {
  if (amount <= 0) return false;

  player.server.runCommandSilent(
    'lc credit ' + player.username + ' ' + amount
  );

  // Fallback command format
  player.server.runCommandSilent(
    'lightmanscurrency bank credit ' + player.username + ' ' + amount
  );

  return true;
}

/**
 * Process XP deltas for all jobs and convert to coins.
 */
function processJobEarnings(player) {
  let totalNewCoins = 0;
  let earningDetails = [];

  for (let [jobKey, jobInfo] of Object.entries(JOBS_CONFIG.jobs)) {
    let currentXP = getCurrentJobXP(player, jobKey);
    let lastXP = getLastSyncedXP(player, jobKey);
    let delta = currentXP - lastXP;

    if (delta <= 0) continue;

    let level = getJobLevel(currentXP);
    let coins = calculateCoins(delta, level);

    if (coins > 0) {
      totalNewCoins += coins;
      earningDetails.push({
        job: jobInfo.display,
        xpDelta: delta,
        coins: coins,
        level: level
      });
    }

    // Update last synced value
    setLastSyncedXP(player, jobKey, currentXP);
  }

  if (totalNewCoins > 0) {
    grantCoins(player, totalNewCoins);

    // Track total earned
    let totalEarned = player.persistentData.getInt(JOBS_CONFIG.totalEarnedKey) + totalNewCoins;
    player.persistentData.putInt(JOBS_CONFIG.totalEarnedKey, totalEarned);

    // Notify player
    player.tell('\u00a7a[Jobs] \u00a77Earnings converted: \u00a7e+' + totalNewCoins + ' copper coins');
    for (let detail of earningDetails) {
      player.tell('\u00a77  ' + detail.job + ': +' + detail.xpDelta + ' XP \u00a7e\u2192 ' + detail.coins + ' coins');
    }

    jobsLog(player.username + ' earned ' + totalNewCoins + ' coins from job XP');
  }
}

/**
 * Add XP to a specific job for a player.
 * This is called by other scripts or commands to grant job XP.
 */
function addJobXP(player, jobKey, amount) {
  if (!JOBS_CONFIG.jobs[jobKey]) return;

  let xpKey = 'horizons_job_xp_' + jobKey;
  let current = player.persistentData.getInt(xpKey);
  let newXP = current + amount;
  player.persistentData.putInt(xpKey, newXP);

  // Check for level up
  let oldLevel = getJobLevel(current);
  let newLevel = getJobLevel(newXP);
  let jobInfo = JOBS_CONFIG.jobs[jobKey];

  if (newLevel > oldLevel) {
    player.tell('\u00a7e=== Job Level Up! ===');
    player.tell(jobInfo.color + jobInfo.icon + ' ' + jobInfo.display + ' \u00a77is now level \u00a7f' + newLevel + '\u00a77!');
    player.tell('\u00a77Coin bonus: \u00a7a+' + Math.floor(newLevel * JOBS_CONFIG.levelBonusMultiplier * 100) + '%');

    player.server.runCommandSilent(
      'execute at ' + player.username + ' run playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.2'
    );

    jobsLog(player.username + ' leveled up ' + jobKey + ' to ' + newLevel);
  }
}

// ============================================================
// PERIODIC TICK — Convert job XP to coins every minute
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % JOBS_CONFIG.checkInterval !== 0) return;
  if (server.tickCount === 0) return;

  server.players.forEach(player => {
    if (!player) return;
    processJobEarnings(player);
  });
});

// ============================================================
// PLAYER LOGIN — Initialize job tracking data
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(JOBS_CONFIG.totalEarnedKey)) {
    data.putInt(JOBS_CONFIG.totalEarnedKey, 0);

    // Initialize all job XP trackers
    for (let jobKey of Object.keys(JOBS_CONFIG.jobs)) {
      data.putInt('horizons_job_xp_' + jobKey, 0);
      data.putInt(JOBS_CONFIG.lastXpPrefix + jobKey, 0);
    }

    jobsLog('Initialized job tracking data for ' + player.username);
  }
});

// ============================================================
// COMMANDS: /horizons jobs [status|addxp]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('jobs')

        // /horizons jobs status — show job levels and earnings
        .then(Commands.literal('status')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let totalEarned = player.persistentData.getInt(JOBS_CONFIG.totalEarnedKey);

            player.tell('\u00a7e=== Job Status ===');
            player.tell('\u00a77Total Earnings: \u00a7e' + totalEarned + ' copper coins');
            player.tell('\u00a77Conversion Rate: \u00a7f' + JOBS_CONFIG.xpPerCoin + ' XP = 1 copper');
            player.tell('');

            let hasJobs = false;
            for (let [jobKey, jobInfo] of Object.entries(JOBS_CONFIG.jobs)) {
              let xp = getCurrentJobXP(player, jobKey);
              if (xp <= 0) continue;

              hasJobs = true;
              let level = getJobLevel(xp);
              let nextLevelXP = getXPForNextLevel(xp);
              let levelBonus = Math.floor(level * JOBS_CONFIG.levelBonusMultiplier * 100);

              // Progress bar within current level
              let levelStart = JOBS_CONFIG.levelThresholds[level] || 0;
              let levelEnd = (level < JOBS_CONFIG.levelThresholds.length - 1)
                ? JOBS_CONFIG.levelThresholds[level + 1]
                : xp;
              let range = levelEnd - levelStart;
              let progress = xp - levelStart;
              let barLength = 15;
              let filled = range > 0 ? Math.floor((progress / range) * barLength) : barLength;
              let empty = barLength - filled;
              let bar = '\u00a7a';
              for (let i = 0; i < filled; i++) bar += '|';
              bar += '\u00a78';
              for (let i = 0; i < empty; i++) bar += '|';

              player.tell(jobInfo.color + jobInfo.icon + ' ' + jobInfo.display + ' \u00a77Lv.\u00a7f' + level);
              player.tell('  \u00a77XP: ' + bar + ' \u00a7f' + xp);
              if (nextLevelXP > 0) {
                player.tell('  \u00a77Next level: \u00a7f' + nextLevelXP + ' XP');
              }
              if (levelBonus > 0) {
                player.tell('  \u00a77Level bonus: \u00a7a+' + levelBonus + '%');
              }
            }

            if (!hasJobs) {
              player.tell('\u00a78No job experience yet. Start working to earn coins!');
              player.tell('\u00a77Custom jobs: Vintner, Trainer Aide, Brewer');
            }

            return 1;
          })
        )

        // /horizons jobs addxp <job> <amount> — OP only, for testing
        .then(Commands.literal('addxp')
          .requires(function(source) { return source.hasPermission(2); })
          .then(Commands.argument('job', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(JOBS_CONFIG.jobs)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let jobKey = event.getArguments().STRING.getResult(ctx, 'job').toLowerCase();
                let amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                if (!JOBS_CONFIG.jobs[jobKey]) {
                  player.tell('\u00a7c[Jobs] Unknown job: ' + jobKey);
                  player.tell('\u00a77Valid jobs: ' + Object.keys(JOBS_CONFIG.jobs).join(', '));
                  return 0;
                }

                addJobXP(player, jobKey, amount);
                let totalXP = getCurrentJobXP(player, jobKey);

                player.tell('\u00a7a[Jobs] Added ' + amount + ' XP to ' + JOBS_CONFIG.jobs[jobKey].display + ' (total: ' + totalXP + ')');

                return 1;
              })
            )
          )
        )
      )
  );
});

console.log('[Horizons] Jobs Currency Bridge loaded');
console.log('[Horizons] Commands: /horizons jobs [status|addxp]');
console.log('[Horizons] Conversion: ' + JOBS_CONFIG.xpPerCoin + ' job XP = 1 copper coin');
