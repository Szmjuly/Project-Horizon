// ============================================================
// Project Horizons — Custom Quest Tasks
// ============================================================
// File: kubejs/server_scripts/quests/custom_tasks.js
// Phase: 2
// Dependencies: FTB Quests, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Custom task types that FTB Quests can check via KubeJS events.
// Each task is tracked as both a persistentData counter AND a
// scoreboard objective so FTB Quests advancement triggers can read them.
//
// TASK COUNTERS:
//   horizons_npc_talked         — NPC conversations
//   horizons_cobblemon_caught   — Cobblemon catches
//   horizons_cobblemon_battled  — Cobblemon battle wins
//   horizons_gate_floor_reached — Highest gate floor (from gate_system.js)
//   horizons_wine_brewed        — Wine items crafted
//   horizons_balanced_diet      — Achieved balanced nutrition (0/1)
//   horizons_reputation_earned  — Total reputation across all factions
//   horizons_trade_completed    — Villager trades
//
// COMMANDS:
//   /horizons task <task_name> [npc_name]  — Increment a task counter
//   /horizons task status                  — Show all task counters
// ============================================================

// --- Configuration ---
const TASK_CONFIG = {
  // All tracked task counter names
  tasks: [
    'horizons_npc_talked',
    'horizons_cobblemon_caught',
    'horizons_cobblemon_battled',
    'horizons_gate_floor_reached',
    'horizons_wine_brewed',
    'horizons_balanced_diet',
    'horizons_reputation_earned',
    'horizons_trade_completed'
  ],

  // Items that count as wine for crafting detection
  wineKeywords: ['wine', 'mead', 'brew', 'ale', 'cider', 'sake', 'spirit', 'rum', 'whiskey'],

  // Faction list for reputation totaling (must match reward_handlers.js)
  factions: ['plains', 'forest', 'mountain', 'coastal', 'skyborn', 'wanderer'],

  // Debug logging
  debug: true
};

// --- Utility Functions ---

function taskLog(message) {
  if (TASK_CONFIG.debug) {
    console.log('[Horizons/Tasks] ' + message);
  }
}

/**
 * Get the current value of a task counter for a player.
 */
function getTaskCounter(player, taskName) {
  return player.persistentData.getInt(taskName) || 0;
}

/**
 * Set a task counter to a specific value and sync to scoreboard.
 */
function setTaskCounter(player, taskName, value) {
  player.persistentData.putInt(taskName, value);
  syncScoreboard(player, taskName, value);
  taskLog(player.username + ' | ' + taskName + ' = ' + value);
}

/**
 * Increment a task counter by the given amount (default 1) and sync to scoreboard.
 */
function incrementTaskCounter(player, taskName, amount) {
  if (amount === undefined) amount = 1;
  var current = getTaskCounter(player, taskName);
  var newValue = current + amount;
  setTaskCounter(player, taskName, newValue);
  return newValue;
}

/**
 * Sync a task counter value to the scoreboard so FTB Quests can read it.
 * Ensures the objective exists, then sets the player's score.
 */
function syncScoreboard(player, objective, value) {
  var server = player.server;
  // Ensure the scoreboard objective exists (silent — no error if already present)
  server.runCommandSilent('scoreboard objectives add ' + objective + ' dummy');
  // Set the player's score
  server.runCommandSilent('scoreboard players set ' + player.username + ' ' + objective + ' ' + value);
}

/**
 * Sync all task counters to scoreboards for a player.
 * Called on login and after bulk updates.
 */
function syncAllScoreboards(player) {
  TASK_CONFIG.tasks.forEach(function(taskName) {
    var value = getTaskCounter(player, taskName);
    syncScoreboard(player, taskName, value);
  });
}

/**
 * Calculate total reputation across all factions from persistentData.
 */
function calculateTotalReputation(player) {
  var total = 0;
  TASK_CONFIG.factions.forEach(function(faction) {
    var rep = player.persistentData.getInt('rep_' + faction) || 0;
    if (rep > 0) {
      total += rep;
    }
  });
  return total;
}

/**
 * Read the highest gate floor from gate_system.js persistentData key.
 */
function readGateFloor(player) {
  return player.persistentData.getInt('horizons_gate_highest') || 0;
}

/**
 * Check if the player has achieved balanced diet from nutrition.js stages.
 */
function checkBalancedDiet(player) {
  return player.stages.has('nutrition_balanced') || player.stages.has('nutrition_gourmet');
}

// ============================================================
// COMMAND REGISTRATION — /horizons task
// ============================================================

ServerEvents.commandRegistry(function(event) {
  var Commands = event.commands;
  var Arguments = event.arguments;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('task')
        // /horizons task status — show all counters
        .then(Commands.literal('status')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            // Refresh computed counters before display
            refreshComputedCounters(player);

            player.tell('\u00a7e=== Quest Task Counters ===');

            TASK_CONFIG.tasks.forEach(function(taskName) {
              var value = getTaskCounter(player, taskName);
              var displayName = taskName.replace('horizons_', '').replace(/_/g, ' ');
              displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              var color = value > 0 ? '\u00a7a' : '\u00a77';
              player.tell('  ' + color + displayName + ': \u00a7f' + value);
            });

            player.tell('\u00a77Use \u00a7f/horizons task <name>\u00a77 to manually increment a counter.');
            return 1;
          })
        )
        // /horizons task npc_talk <npc_name> — increment NPC talked counter
        .then(Commands.literal('npc_talk')
          .then(Commands.argument('npc_name', event.getArguments().STRING.create(event))
            .executes(function(ctx) {
              var player = ctx.source.player;
              if (!player) return 0;
              var npcName = event.getArguments().STRING.getResult(ctx, 'npc_name');
              var newVal = incrementTaskCounter(player, 'horizons_npc_talked');
              player.tell('\u00a7e[Horizons] \u00a77Spoke with \u00a7f' + npcName + '\u00a77. NPC conversations: \u00a7a' + newVal);
              // Track individual NPC conversations as well
              var npcKey = 'horizons_npc_' + npcName.toLowerCase().replace(/\s+/g, '_');
              var npcCount = incrementTaskCounter(player, npcKey);
              taskLog(player.username + ' talked to NPC: ' + npcName + ' (count: ' + npcCount + ')');
              return 1;
            })
          )
        )
        // /horizons task catch — increment cobblemon caught counter
        .then(Commands.literal('catch')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;
            var newVal = incrementTaskCounter(player, 'horizons_cobblemon_caught');
            player.tell('\u00a7e[Horizons] \u00a77Cobblemon caught! Total catches: \u00a7a' + newVal);
            return 1;
          })
        )
        // /horizons task battle_win — increment cobblemon battled counter
        .then(Commands.literal('battle_win')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;
            var newVal = incrementTaskCounter(player, 'horizons_cobblemon_battled');
            player.tell('\u00a7e[Horizons] \u00a77Battle won! Total victories: \u00a7a' + newVal);
            return 1;
          })
        )
        // /horizons task trade — increment trade completed counter
        .then(Commands.literal('trade')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;
            var newVal = incrementTaskCounter(player, 'horizons_trade_completed');
            player.tell('\u00a7e[Horizons] \u00a77Trade completed! Total trades: \u00a7a' + newVal);
            return 1;
          })
        )
        // /horizons task refresh — force-refresh all computed counters
        .then(Commands.literal('refresh')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;
            refreshComputedCounters(player);
            player.tell('\u00a7e[Horizons] \u00a77All task counters refreshed and synced to scoreboards.');
            return 1;
          })
        )
      )
  );
});

// ============================================================
// COMPUTED COUNTER REFRESH
// Some counters are derived from other systems rather than manually
// incremented. This function reads their current values and syncs.
// ============================================================

function refreshComputedCounters(player) {
  // Gate floor — read highest floor from gate_system.js data
  var gateFloor = readGateFloor(player);
  setTaskCounter(player, 'horizons_gate_floor_reached', gateFloor);

  // Balanced diet — check nutrition stages
  var balanced = checkBalancedDiet(player) ? 1 : 0;
  setTaskCounter(player, 'horizons_balanced_diet', balanced);

  // Total reputation — sum positive rep across all factions
  var totalRep = calculateTotalReputation(player);
  setTaskCounter(player, 'horizons_reputation_earned', totalRep);
}

// ============================================================
// AUTO-DETECT: Wine/brewing crafts via ItemEvents.crafted
// ============================================================

ItemEvents.crafted(function(event) {
  var player = event.player;
  var item = event.item;
  if (!player || !item) return;

  var itemId = item.id.toLowerCase();
  var isWine = false;

  for (var i = 0; i < TASK_CONFIG.wineKeywords.length; i++) {
    if (itemId.indexOf(TASK_CONFIG.wineKeywords[i]) !== -1) {
      isWine = true;
      break;
    }
  }

  if (isWine) {
    var newVal = incrementTaskCounter(player, 'horizons_wine_brewed');
    player.tell('\u00a7e[Horizons] \u00a77Wine brewed! Total brews: \u00a7d' + newVal);
    taskLog(player.username + ' brewed wine: ' + item.id);
  }
});

// ============================================================
// AUTO-DETECT: Balanced Diet via stage addition from nutrition.js
// ============================================================

PlayerEvents.stageAdded(function(event) {
  var player = event.player;
  var stage = event.stage;

  if (stage === 'nutrition_balanced' || stage === 'nutrition_gourmet') {
    setTaskCounter(player, 'horizons_balanced_diet', 1);
    player.tell('\u00a7e[Horizons] \u00a77Balanced Diet achieved! Quest task updated.');
    taskLog(player.username + ' achieved balanced diet via stage: ' + stage);
  }
});

// ============================================================
// PERIODIC SYNC: Refresh computed counters for all online players
// Runs every 60 seconds (1200 ticks) to keep scoreboards current.
// ============================================================

ServerEvents.tick(function(event) {
  var server = event.server;
  // Every 60 seconds (1200 ticks)
  if (server.tickCount % 1200 !== 0) return;

  server.players.forEach(function(player) {
    refreshComputedCounters(player);
  });
});

// ============================================================
// PLAYER JOIN — Initialize task counters and sync scoreboards
// ============================================================

PlayerEvents.loggedIn(function(event) {
  var player = event.player;
  var data = player.persistentData;

  // Initialize all task counters if first login
  if (!data.contains('horizons_npc_talked')) {
    TASK_CONFIG.tasks.forEach(function(taskName) {
      data.putInt(taskName, 0);
    });
    taskLog('Initialized task counters for ' + player.username);
  }

  // Always sync scoreboards on login
  syncAllScoreboards(player);

  // Refresh computed counters on login
  refreshComputedCounters(player);
});

console.log('[Horizons] Custom Quest Tasks loaded');
console.log('[Horizons] Commands: /horizons task [status|npc_talk|catch|battle_win|trade|refresh]');
console.log('[Horizons] Tracking ' + TASK_CONFIG.tasks.length + ' task counters with scoreboard sync');
