// ============================================================
// Project Horizons — Quest Branching Logic
// ============================================================
// File: kubejs/server_scripts/quests/branching_logic.js
// Phase: 2
// Dependencies: FTB Quests, AStages, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Quest narrative branching based on player choices. Branch points
// are stage-gated in FTB Quests via ProgressiveStages. When a player
// makes a choice, the chosen branch stage is granted and the
// alternative is permanently locked out (unless OP reset).
//
// BRANCH POINTS:
//   Act 2: branch_restoration vs branch_independence
//          Follow the Watchers or forge your own path
//   Act 3: branch_tech vs branch_nature
//          Focus on Artificer tech or Cultivator nature
//   Act 4: branch_conquer vs branch_diplomacy
//          Handle faction conflict through force or diplomacy
//
// COMMANDS:
//   /horizons branch choose <branch_name>  — Lock in a choice
//   /horizons branch status                — Show active branches
//   /horizons branch reset <branch_name>   — OP only, reset a branch
// ============================================================

// --- Configuration ---
var BRANCH_CONFIG = {
  // Each branch point defines a pair of mutually exclusive stages.
  // Choosing one locks out the other. The lockStage is granted to
  // mark the alternative as unavailable.
  branches: {
    // Act 2 — Watchers alignment
    branch_restoration: {
      act: 2,
      displayName: 'Restoration (Watchers)',
      description: 'Follow the Watchers and restore the old order.',
      alternative: 'branch_independence',
      lockStage: 'branch_independence_locked',
      consequenceStages: ['act2_watcher_ally', 'act2_restoration_path'],
      color: '\u00a7b'
    },
    branch_independence: {
      act: 2,
      displayName: 'Independence (Own Path)',
      description: 'Forge your own destiny, free from Watcher control.',
      alternative: 'branch_restoration',
      lockStage: 'branch_restoration_locked',
      consequenceStages: ['act2_independent', 'act2_freedom_path'],
      color: '\u00a7d'
    },

    // Act 3 — Specialization
    branch_tech: {
      act: 3,
      displayName: 'Artificer (Technology)',
      description: 'Focus on Precursor technology and mechanical innovation.',
      alternative: 'branch_nature',
      lockStage: 'branch_nature_locked',
      consequenceStages: ['act3_artificer', 'act3_tech_focus'],
      color: '\u00a73'
    },
    branch_nature: {
      act: 3,
      displayName: 'Cultivator (Nature)',
      description: 'Embrace the natural world and cultivate living power.',
      alternative: 'branch_tech',
      lockStage: 'branch_tech_locked',
      consequenceStages: ['act3_cultivator', 'act3_nature_focus'],
      color: '\u00a72'
    },

    // Act 4 — Conflict resolution
    branch_conquer: {
      act: 4,
      displayName: 'Conquer (Force)',
      description: 'Resolve faction conflict through strength and dominance.',
      alternative: 'branch_diplomacy',
      lockStage: 'branch_diplomacy_locked',
      consequenceStages: ['act4_conqueror', 'act4_military_path'],
      color: '\u00a7c'
    },
    branch_diplomacy: {
      act: 4,
      displayName: 'Diplomacy (Peace)',
      description: 'Unite the factions through negotiation and compromise.',
      alternative: 'branch_conquer',
      lockStage: 'branch_conquer_locked',
      consequenceStages: ['act4_diplomat', 'act4_peace_path'],
      color: '\u00a7a'
    }
  },

  // persistentData key for tracking chosen branches
  dataKey: 'horizons_branches',

  // Debug logging
  debug: true
};

// --- Utility Functions ---

function branchLog(message) {
  if (BRANCH_CONFIG.debug) {
    console.log('[Horizons/Branch] ' + message);
  }
}

/**
 * Get the list of branches the player has chosen (as a JSON array string in persistentData).
 */
function getChosenBranches(player) {
  var raw = player.persistentData.getString(BRANCH_CONFIG.dataKey);
  if (!raw || raw.length === 0) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Save the list of chosen branches to persistentData.
 */
function saveChosenBranches(player, branches) {
  player.persistentData.putString(BRANCH_CONFIG.dataKey, JSON.stringify(branches));
}

/**
 * Check if a branch has already been chosen (or its alternative).
 * Returns: 'chosen' if this branch was picked, 'locked' if alternative was picked, 'available' if no choice yet.
 */
function getBranchState(player, branchName) {
  var config = BRANCH_CONFIG.branches[branchName];
  if (!config) return 'invalid';

  if (player.stages.has(branchName)) {
    return 'chosen';
  }
  if (player.stages.has(config.lockStage)) {
    return 'locked';
  }
  return 'available';
}

/**
 * Choose a branch. Grants the branch stage, locks the alternative,
 * and grants all consequence stages.
 * Returns true on success, false on failure.
 */
function chooseBranch(player, branchName) {
  var config = BRANCH_CONFIG.branches[branchName];
  if (!config) {
    player.tell('\u00a7c[Horizons] Unknown branch: ' + branchName);
    return false;
  }

  // Check if already chosen
  var state = getBranchState(player, branchName);
  if (state === 'chosen') {
    player.tell('\u00a7e[Horizons] \u00a77You have already chosen: ' + config.color + config.displayName);
    return false;
  }

  // Anti-exploit: check if the alternative was already chosen
  if (state === 'locked') {
    var altConfig = BRANCH_CONFIG.branches[config.alternative];
    var altName = altConfig ? altConfig.displayName : config.alternative;
    player.tell('\u00a7c[Horizons] This branch is locked! You already chose: \u00a7f' + altName);
    player.tell('\u00a7c[Horizons] Branch choices are permanent. Contact an admin for reset.');
    return false;
  }

  // Grant the chosen branch stage
  player.stages.add(branchName);

  // Lock the alternative
  var altConfig = BRANCH_CONFIG.branches[config.alternative];
  if (altConfig) {
    player.stages.add(altConfig.lockStage);
    // Also add the lock stage for the alternative itself to prevent it from being chosen
    if (player.stages.has(config.alternative)) {
      player.stages.remove(config.alternative);
    }
  }

  // Grant all consequence stages
  config.consequenceStages.forEach(function(stage) {
    if (!player.stages.has(stage)) {
      player.stages.add(stage);
    }
  });

  // Track in persistentData
  var chosen = getChosenBranches(player);
  if (chosen.indexOf(branchName) === -1) {
    chosen.push(branchName);
  }
  saveChosenBranches(player, chosen);

  // Notify the player
  player.tell('\u00a7e\u00a7l==============================');
  player.tell('\u00a7e  BRANCH CHOSEN');
  player.tell('  ' + config.color + '\u00a7l' + config.displayName);
  player.tell('  \u00a77' + config.description);
  player.tell('\u00a7e\u00a7l==============================');

  // Play a sound for dramatic effect
  player.server.runCommandSilent(
    'playsound minecraft:ui.toast.challenge_complete master ' + player.username + ' ~ ~ ~ 1 1'
  );

  branchLog(player.username + ' chose branch: ' + branchName + ' (locked ' + config.alternative + ')');
  return true;
}

/**
 * Reset a branch choice (OP only). Removes the branch stage, its lock stage,
 * and all consequence stages for both the chosen and alternative branches.
 */
function resetBranch(player, branchName) {
  var config = BRANCH_CONFIG.branches[branchName];
  if (!config) {
    player.tell('\u00a7c[Horizons] Unknown branch: ' + branchName);
    return false;
  }

  // Remove the branch stage itself
  if (player.stages.has(branchName)) {
    player.stages.remove(branchName);
  }

  // Remove the lock stage for this branch
  var lockStage = branchName.replace('branch_', 'branch_') + '_locked';
  if (player.stages.has(lockStage)) {
    player.stages.remove(lockStage);
  }

  // Remove consequence stages
  config.consequenceStages.forEach(function(stage) {
    if (player.stages.has(stage)) {
      player.stages.remove(stage);
    }
  });

  // Also reset the alternative branch's lock
  var altConfig = BRANCH_CONFIG.branches[config.alternative];
  if (altConfig) {
    if (player.stages.has(altConfig.lockStage)) {
      player.stages.remove(altConfig.lockStage);
    }
    // Remove the alternative branch stage if it was chosen
    if (player.stages.has(config.alternative)) {
      player.stages.remove(config.alternative);
    }
    // Remove alternative's consequence stages
    altConfig.consequenceStages.forEach(function(stage) {
      if (player.stages.has(stage)) {
        player.stages.remove(stage);
      }
    });
  }

  // Update persistentData
  var chosen = getChosenBranches(player);
  var filtered = [];
  for (var i = 0; i < chosen.length; i++) {
    if (chosen[i] !== branchName && chosen[i] !== config.alternative) {
      filtered.push(chosen[i]);
    }
  }
  saveChosenBranches(player, filtered);

  player.tell('\u00a7e[Horizons] \u00a77Branch reset: \u00a7f' + config.displayName);
  player.tell('\u00a77Both options for Act ' + config.act + ' are now available again.');

  branchLog('ADMIN reset branch ' + branchName + ' for ' + player.username);
  return true;
}

// ============================================================
// COMMAND REGISTRATION — /horizons branch
// ============================================================

ServerEvents.commandRegistry(function(event) {
  var Commands = event.commands;
  var Arguments = event.arguments;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('branch')
        // /horizons branch status — show all active branches
        .then(Commands.literal('status')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e=== Branch Status ===');

            // Group by act
            var acts = [2, 3, 4];
            acts.forEach(function(act) {
              player.tell('\u00a7e--- Act ' + act + ' ---');

              var actBranches = [];
              var branchNames = Object.keys(BRANCH_CONFIG.branches);
              for (var i = 0; i < branchNames.length; i++) {
                var name = branchNames[i];
                if (BRANCH_CONFIG.branches[name].act === act) {
                  actBranches.push(name);
                }
              }

              var anyChosen = false;
              actBranches.forEach(function(name) {
                var config = BRANCH_CONFIG.branches[name];
                var state = getBranchState(player, name);
                var stateText;
                if (state === 'chosen') {
                  stateText = '\u00a7a\u2713 CHOSEN';
                  anyChosen = true;
                } else if (state === 'locked') {
                  stateText = '\u00a7c\u2717 LOCKED';
                } else {
                  stateText = '\u00a77\u25cb Available';
                }
                player.tell('  ' + stateText + ' ' + config.color + config.displayName);
              });

              if (!anyChosen) {
                player.tell('  \u00a78No choice made yet for Act ' + act + '.');
              }
            });

            return 1;
          })
        )
        // /horizons branch choose <branch_name> — lock in a choice
        .then(Commands.literal('choose')
          .then(Commands.argument('branch_name', event.getArguments().STRING.create(event))
            .executes(function(ctx) {
              var player = ctx.source.player;
              if (!player) return 0;
              var branchName = event.getArguments().STRING.getResult(ctx, 'branch_name');
              chooseBranch(player, branchName);
              return 1;
            })
          )
        )
        // /horizons branch reset <branch_name> — OP only
        .then(Commands.literal('reset')
          .requires(function(src) { return src.hasPermission(2); })
          .then(Commands.argument('branch_name', event.getArguments().STRING.create(event))
            .executes(function(ctx) {
              var player = ctx.source.player;
              if (!player) return 0;
              var branchName = event.getArguments().STRING.getResult(ctx, 'branch_name');
              resetBranch(player, branchName);
              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize branch data
// ============================================================

PlayerEvents.loggedIn(function(event) {
  var player = event.player;
  var data = player.persistentData;

  // Initialize branch tracking if first login
  if (!data.contains(BRANCH_CONFIG.dataKey)) {
    data.putString(BRANCH_CONFIG.dataKey, '[]');
    branchLog('Initialized branch data for ' + player.username);
  }
});

console.log('[Horizons] Quest Branching Logic loaded');
console.log('[Horizons] Commands: /horizons branch [choose|status|reset]');
console.log('[Horizons] Branch points: Act 2 (Restoration/Independence), Act 3 (Tech/Nature), Act 4 (Conquer/Diplomacy)');
