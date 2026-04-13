// ============================================================
// Project Horizons — Faction Reputation
// ============================================================
// File: kubejs/server_scripts/economy/faction_reputation.js
// Phase: 2
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Manages 6 faction reputations per player, tracked via scoreboard
// objectives. Reputation ranges from -1000 (Hostile) to +1000 (Allied).
// Cross-faction tension causes gaining rep with one faction to slightly
// reduce rep with its opposing faction.
//
// FACTIONS:
//   plains, forest, mountain, coastal, skyborn, wanderer
//
// REPUTATION TIERS:
//   Hostile    (-1000 to -100)
//   Unfriendly (-99 to -1)
//   Neutral    (0 to 99)
//   Friendly   (100 to 499)
//   Trusted    (500 to 999)
//   Allied     (1000)
//
// OPPOSING PAIRS:
//   plains <-> mountain
//   forest <-> coastal
//   skyborn <-> wanderer
//
// COMMANDS:
//   /horizons reputation              — Show all faction standings
//   /horizons reputation set <faction> <amount>  — Admin set (OP)
//   /horizons reputation add <faction> <amount>  — Admin add (OP)
// ============================================================

// --- Configuration ---
const REP_CONFIG = {
  // Scoreboard objective prefix
  scoreboardPrefix: 'horizons_rep_',

  // persistentData key prefix (mirror of scoreboard for fast reads)
  dataPrefix: 'rep_',

  // Minimum and maximum reputation
  minRep: -1000,
  maxRep: 1000,

  // Faction definitions
  factions: {
    plains: {
      name: 'Plains Kingdom',
      color: '\u00a7e',
      symbol: '\u2655'
    },
    forest: {
      name: 'Forest Kingdom',
      color: '\u00a7a',
      symbol: '\u2618'
    },
    mountain: {
      name: 'Mountain Kingdom',
      color: '\u00a77',
      symbol: '\u26cf'
    },
    coastal: {
      name: 'Coastal Kingdom',
      color: '\u00a7b',
      symbol: '\u2693'
    },
    skyborn: {
      name: 'Skyborn Kingdom',
      color: '\u00a7d',
      symbol: '\u2727'
    },
    wanderer: {
      name: 'Wanderer Guild',
      color: '\u00a76',
      symbol: '\u2604'
    }
  },

  // Opposing faction pairs — gaining rep with one reduces the other
  opposingPairs: {
    plains: 'mountain',
    mountain: 'plains',
    forest: 'coastal',
    coastal: 'forest',
    skyborn: 'wanderer',
    wanderer: 'skyborn'
  },

  // How much opposing rep is lost per point gained (percentage)
  // Gaining 100 rep with plains reduces mountain by 100 * 0.15 = 15
  tensionRate: 0.15,

  // Reputation tier definitions: [tierName, min, max, color, barChar]
  tiers: [
    { name: 'Hostile',     min: -1000, max: -100, color: '\u00a74', barChar: '\u2588' },
    { name: 'Unfriendly',  min: -99,   max: -1,   color: '\u00a7c', barChar: '\u2588' },
    { name: 'Neutral',     min: 0,     max: 99,   color: '\u00a77', barChar: '\u2588' },
    { name: 'Friendly',    min: 100,   max: 499,  color: '\u00a7e', barChar: '\u2588' },
    { name: 'Trusted',     min: 500,   max: 999,  color: '\u00a7a', barChar: '\u2588' },
    { name: 'Allied',      min: 1000,  max: 1000, color: '\u00a76', barChar: '\u2588' }
  ],

  // Stage thresholds for reputation milestones
  stageThresholds: [
    { rep: -100, stage: 'hostile' },
    { rep: 100,  stage: 'friendly' },
    { rep: 500,  stage: 'trusted' },
    { rep: 1000, stage: 'allied' }
  ],

  // Debug logging
  debug: true
};

// --- Faction IDs list for iteration ---
const FACTION_IDS = Object.keys(REP_CONFIG.factions);

// --- Utility Functions ---

function repLog(message) {
  if (REP_CONFIG.debug) {
    console.log('[Horizons/Reputation] ' + message);
  }
}

/**
 * Get the reputation tier for a given rep value.
 */
function getTier(rep) {
  for (const tier of REP_CONFIG.tiers) {
    if (rep >= tier.min && rep <= tier.max) {
      return tier;
    }
  }
  // Fallback for edge cases
  if (rep <= REP_CONFIG.minRep) return REP_CONFIG.tiers[0];
  if (rep >= REP_CONFIG.maxRep) return REP_CONFIG.tiers[REP_CONFIG.tiers.length - 1];
  return REP_CONFIG.tiers[2]; // Neutral
}

/**
 * Clamp reputation to valid range.
 */
function clampRep(value) {
  return Math.max(REP_CONFIG.minRep, Math.min(REP_CONFIG.maxRep, Math.floor(value)));
}

/**
 * Get a player's reputation with a faction.
 */
function getReputation(player, factionId) {
  if (!REP_CONFIG.factions[factionId]) return 0;
  return player.persistentData.getInt(REP_CONFIG.dataPrefix + factionId) || 0;
}

/**
 * Set a player's reputation with a faction (direct set, no tension).
 */
function setReputation(player, factionId, amount) {
  if (!REP_CONFIG.factions[factionId]) return;

  const clamped = clampRep(amount);
  const data = player.persistentData;
  data.putInt(REP_CONFIG.dataPrefix + factionId, clamped);

  // Sync to scoreboard
  const objective = REP_CONFIG.scoreboardPrefix + factionId;
  const server = player.server;
  server.runCommandSilent('scoreboard objectives add ' + objective + ' dummy');

  // Scoreboards use set for absolute values
  if (clamped >= 0) {
    server.runCommandSilent('scoreboard players set ' + player.username + ' ' + objective + ' ' + clamped);
  } else {
    // Scoreboard supports negative values via set
    server.runCommandSilent('scoreboard players set ' + player.username + ' ' + objective + ' ' + clamped);
  }

  // Update reputation stages
  updateReputationStages(player, factionId, clamped);
}

/**
 * Change a player's reputation with a faction (with cross-faction tension).
 * Used by reward_handlers.js and other scripts.
 */
function changeReputation(player, factionId, amount) {
  if (!REP_CONFIG.factions[factionId]) {
    console.warn('[Horizons/Reputation] Unknown faction: ' + factionId);
    return;
  }

  const current = getReputation(player, factionId);
  const newRep = clampRep(current + amount);
  setReputation(player, factionId, newRep);

  const info = REP_CONFIG.factions[factionId];
  const sign = amount >= 0 ? '+' : '';
  const color = amount >= 0 ? '\u00a7a' : '\u00a7c';
  player.tell(color + '[Horizons] ' + sign + amount + ' reputation with ' + info.color + info.name);

  // Apply cross-faction tension
  if (amount > 0) {
    const opposingId = REP_CONFIG.opposingPairs[factionId];
    if (opposingId) {
      const tensionLoss = -Math.floor(amount * REP_CONFIG.tensionRate);
      if (tensionLoss < 0) {
        const opposingCurrent = getReputation(player, opposingId);
        const opposingNew = clampRep(opposingCurrent + tensionLoss);
        setReputation(player, opposingId, opposingNew);

        const opposingInfo = REP_CONFIG.factions[opposingId];
        player.tell('\u00a78  (Tension: ' + tensionLoss + ' with ' + opposingInfo.name + ')');

        repLog(player.username + ': tension ' + tensionLoss + ' ' + opposingId +
          ' from gaining ' + amount + ' ' + factionId);
      }
    }
  }

  repLog(player.username + ': ' + factionId + ' ' + current + ' -> ' + newRep + ' (' + sign + amount + ')');
}

/**
 * Update reputation stages based on current rep value.
 */
function updateReputationStages(player, factionId, rep) {
  // Add positive milestone stages
  for (const threshold of REP_CONFIG.stageThresholds) {
    const stageName = 'rep_' + factionId + '_' + threshold.stage;

    if (threshold.rep > 0 && rep >= threshold.rep) {
      if (!player.stages.has(stageName)) {
        player.stages.add(stageName);
        const tier = getTier(rep);
        const info = REP_CONFIG.factions[factionId];
        player.tell('\u00a7e[Horizons] \u00a77Reached ' + tier.color + threshold.stage.charAt(0).toUpperCase() +
          threshold.stage.slice(1) + ' \u00a77with ' + info.color + info.name + '\u00a77!');
      }
    } else if (threshold.rep > 0 && rep < threshold.rep) {
      // Remove stage if they dropped below threshold
      if (player.stages.has(stageName)) {
        player.stages.remove(stageName);
      }
    }

    // Handle hostile stage (negative threshold)
    if (threshold.rep < 0 && rep <= threshold.rep) {
      if (!player.stages.has(stageName)) {
        player.stages.add(stageName);
        const info = REP_CONFIG.factions[factionId];
        player.tell('\u00a7c[Horizons] \u00a77You are now \u00a74Hostile \u00a77with ' +
          info.color + info.name + '\u00a77!');
      }
    } else if (threshold.rep < 0 && rep > threshold.rep) {
      const stageName2 = 'rep_' + factionId + '_' + threshold.stage;
      if (player.stages.has(stageName2)) {
        player.stages.remove(stageName2);
      }
    }
  }
}

/**
 * Build a visual reputation bar for display.
 * 20 characters wide, filled proportionally.
 */
function buildRepBar(rep) {
  const barWidth = 20;
  // Normalize to 0-1 range: -1000=0, 0=0.5, 1000=1
  const normalized = (rep - REP_CONFIG.minRep) / (REP_CONFIG.maxRep - REP_CONFIG.minRep);
  const filled = Math.round(normalized * barWidth);
  const tier = getTier(rep);

  let bar = '\u00a78[';
  for (let i = 0; i < barWidth; i++) {
    if (i < filled) {
      bar += tier.color + '|';
    } else {
      bar += '\u00a78-';
    }
  }
  bar += '\u00a78]';
  return bar;
}

// ============================================================
// COMMAND REGISTRATION — /horizons reputation
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('reputation')
        // /horizons reputation — show all standings
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;

          player.tell('\u00a7e=== Faction Reputation ===');

          for (const factionId of FACTION_IDS) {
            const info = REP_CONFIG.factions[factionId];
            const rep = getReputation(player, factionId);
            const tier = getTier(rep);
            const bar = buildRepBar(rep);
            const opposingId = REP_CONFIG.opposingPairs[factionId];
            const opposingLabel = opposingId ?
              ' \u00a78(opposes: ' + REP_CONFIG.factions[opposingId].name + ')' : '';

            player.tell('');
            player.tell(info.color + info.symbol + ' ' + info.name + opposingLabel);
            player.tell('  ' + bar + ' ' + tier.color + rep + '\u00a77/' + REP_CONFIG.maxRep);
            player.tell('  \u00a77Rank: ' + tier.color + tier.name);
          }

          player.tell('');
          player.tell('\u00a77Tension: Gaining rep with a faction slightly reduces its rival.');
          player.tell('\u00a77Tension rate: \u00a7f' + (REP_CONFIG.tensionRate * 100) + '%');

          return 1;
        })
        // /horizons reputation set <faction> <amount> — OP only
        .then(Commands.literal('set')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('faction', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const factionId = event.getArguments().STRING.getResult(ctx, 'faction').toLowerCase();
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                if (!REP_CONFIG.factions[factionId]) {
                  player.tell('\u00a7c[Horizons] Unknown faction: ' + factionId);
                  player.tell('\u00a77Valid: ' + FACTION_IDS.join(', '));
                  return 0;
                }

                setReputation(player, factionId, amount);
                const tier = getTier(clampRep(amount));
                const info = REP_CONFIG.factions[factionId];
                player.tell('\u00a7a[Horizons] Set ' + info.name + ' reputation to ' +
                  clampRep(amount) + ' (' + tier.color + tier.name + '\u00a7a)');
                return 1;
              })
            )
          )
        )
        // /horizons reputation add <faction> <amount> — OP only
        .then(Commands.literal('add')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('faction', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const factionId = event.getArguments().STRING.getResult(ctx, 'faction').toLowerCase();
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                if (!REP_CONFIG.factions[factionId]) {
                  player.tell('\u00a7c[Horizons] Unknown faction: ' + factionId);
                  player.tell('\u00a77Valid: ' + FACTION_IDS.join(', '));
                  return 0;
                }

                changeReputation(player, factionId, amount);
                return 1;
              })
            )
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize faction scoreboards
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;
  const server = player.server;

  // Ensure all scoreboard objectives exist
  for (const factionId of FACTION_IDS) {
    const objective = REP_CONFIG.scoreboardPrefix + factionId;
    server.runCommandSilent('scoreboard objectives add ' + objective + ' dummy');
  }

  // Initialize reputation data if first login
  const initKey = 'rep_initialized';
  if (!data.getBoolean(initKey)) {
    for (const factionId of FACTION_IDS) {
      data.putInt(REP_CONFIG.dataPrefix + factionId, 0);
      const objective = REP_CONFIG.scoreboardPrefix + factionId;
      server.runCommandSilent('scoreboard players set ' + player.username + ' ' + objective + ' 0');
    }
    data.putBoolean(initKey, true);
    repLog('Initialized reputation data for ' + player.username);
  }
});

console.log('[Horizons] Faction Reputation loaded');
console.log('[Horizons] Commands: /horizons reputation [set|add]');
console.log('[Horizons] Factions: ' + FACTION_IDS.join(', '));
console.log('[Horizons] Opposing pairs: plains<->mountain, forest<->coastal, skyborn<->wanderer');
