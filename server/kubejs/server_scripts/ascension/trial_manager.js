// ============================================================
// Project Horizons — Trial Manager
// ============================================================
// File: kubejs/server_scripts/ascension/trial_manager.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Manages 10 unique Ascension Trial dungeon instances, one per
// Ascended Class pair. Each trial teleports the player to a
// configurable arena, sets a 10-minute timer, and checks a
// completion stage. Trials gate the final class unlock.
//
// TRIAL TYPES:
//   Hybrid (two-tree combinations):
//     Iron Crucible       — Vanguard+Artificer  -> Warlord
//     Bond of Eight       — Vanguard+Cultivator -> Beastmaster
//     Mirror Maze         — Vanguard+Wayfinder  -> Pathwalker
//     Endless Field       — Artificer+Cultivator-> Architect
//     Long Journey        — Artificer+Wayfinder -> Voyager
//     Caravans Tale       — Cultivator+Wayfinder-> Shepherd
//   Transcendent (single-tree mastery at 100):
//     Hundred Floors      — Vanguard 100        -> Avatar of War
//     Recipe of Worlds    — Artificer 100       -> Mind of the Forge
//     First Garden        — Cultivator 100      -> Verdant Sovereign
//     Edge of Map         — Wayfinder 100       -> Eternal Walker
//
// COMMANDS:
//   /horizons trial start <trial_name>
//   /horizons trial complete    (OP only — forces completion)
//   /horizons trial abort       (player leaves trial early)
//   /horizons trial list        (shows available trials)
// ============================================================

// --- Trial Definitions ---
const TRIALS = {
  iron_crucible: {
    name: 'Iron Crucible',
    description: 'Survive waves of armored constructs in a forge arena.',
    classResult: 'warlord',
    type: 'hybrid',
    reqTrees: { vanguard: 25, artificer: 25 },
    arenaPos: { x: 10000, y: 100, z: 10000 },
    timeLimit: 12000,  // 10 minutes in ticks
    completionStage: 'trial_iron_crucible_complete',
    color: '\u00a7c'
  },
  bond_of_eight: {
    name: 'Bond of Eight',
    description: 'Tame 8 wild creatures before time expires.',
    classResult: 'beastmaster',
    type: 'hybrid',
    reqTrees: { vanguard: 25, cultivator: 25 },
    arenaPos: { x: 10000, y: 100, z: 10200 },
    timeLimit: 12000,
    completionStage: 'trial_bond_of_eight_complete',
    color: '\u00a7a'
  },
  mirror_maze: {
    name: 'Mirror Maze',
    description: 'Navigate a shifting labyrinth to find the exit.',
    classResult: 'pathwalker',
    type: 'hybrid',
    reqTrees: { vanguard: 25, wayfinder: 25 },
    arenaPos: { x: 10000, y: 100, z: 10400 },
    timeLimit: 12000,
    completionStage: 'trial_mirror_maze_complete',
    color: '\u00a7b'
  },
  endless_field: {
    name: 'Endless Field',
    description: 'Build a shelter and cultivate crops under siege.',
    classResult: 'architect',
    type: 'hybrid',
    reqTrees: { artificer: 25, cultivator: 25 },
    arenaPos: { x: 10000, y: 100, z: 10600 },
    timeLimit: 12000,
    completionStage: 'trial_endless_field_complete',
    color: '\u00a7e'
  },
  long_journey: {
    name: 'Long Journey',
    description: 'Reach the destination across a hostile landscape.',
    classResult: 'voyager',
    type: 'hybrid',
    reqTrees: { artificer: 25, wayfinder: 25 },
    arenaPos: { x: 10000, y: 100, z: 10800 },
    timeLimit: 12000,
    completionStage: 'trial_long_journey_complete',
    color: '\u00a7d'
  },
  caravans_tale: {
    name: "Caravan's Tale",
    description: 'Escort a caravan safely through bandit territory.',
    classResult: 'shepherd',
    type: 'hybrid',
    reqTrees: { cultivator: 25, wayfinder: 25 },
    arenaPos: { x: 10000, y: 100, z: 11000 },
    timeLimit: 12000,
    completionStage: 'trial_caravans_tale_complete',
    color: '\u00a76'
  },
  hundred_floors: {
    name: 'Hundred Floors',
    description: 'Ascend a tower of 100 combat encounters.',
    classResult: 'avatar_of_war',
    type: 'transcendent',
    reqTrees: { vanguard: 100 },
    arenaPos: { x: 10200, y: 100, z: 10000 },
    timeLimit: 12000,
    completionStage: 'trial_hundred_floors_complete',
    color: '\u00a74'
  },
  recipe_of_worlds: {
    name: 'Recipe of Worlds',
    description: 'Craft a legendary item from fragments across the arena.',
    classResult: 'mind_of_the_forge',
    type: 'transcendent',
    reqTrees: { artificer: 100 },
    arenaPos: { x: 10200, y: 100, z: 10200 },
    timeLimit: 12000,
    completionStage: 'trial_recipe_of_worlds_complete',
    color: '\u00a75'
  },
  first_garden: {
    name: 'First Garden',
    description: 'Restore a dying garden to full bloom before the blight spreads.',
    classResult: 'verdant_sovereign',
    type: 'transcendent',
    reqTrees: { cultivator: 100 },
    arenaPos: { x: 10200, y: 100, z: 10400 },
    timeLimit: 12000,
    completionStage: 'trial_first_garden_complete',
    color: '\u00a72'
  },
  edge_of_map: {
    name: 'Edge of Map',
    description: 'Traverse the void between worlds to reach the far shore.',
    classResult: 'eternal_walker',
    type: 'transcendent',
    reqTrees: { wayfinder: 100 },
    arenaPos: { x: 10200, y: 100, z: 10600 },
    timeLimit: 12000,
    completionStage: 'trial_edge_of_map_complete',
    color: '\u00a79'
  }
};

const TRIAL_IDS = Object.keys(TRIALS);

// --- Trial state keys ---
const TRIAL_KEYS = {
  inTrial: 'horizons_in_trial',
  currentTrial: 'horizons_current_trial',
  trialStartTick: 'horizons_trial_start_tick',
  returnX: 'horizons_trial_return_x',
  returnY: 'horizons_trial_return_y',
  returnZ: 'horizons_trial_return_z',
  returnDim: 'horizons_trial_return_dim',
  trialAttempts: 'horizons_trial_attempts',
  trialsCompleted: 'horizons_trials_completed'
};

// --- Logging ---
function trialLog(message) {
  console.log('[Horizons/Trial] ' + message);
}

// ============================================================
// TRIAL PREREQUISITE CHECK
// ============================================================

/**
 * Check if a player meets the perk tree requirements for a trial.
 */
function meetsTrialRequirements(player, trialId) {
  const trial = TRIALS[trialId];
  if (!trial) return false;

  // Must be ascension-eligible
  if (!player.stages.has('ascend_eligible')) return false;

  const data = player.persistentData;
  for (const tree in trial.reqTrees) {
    const required = trial.reqTrees[tree];
    const invested = data.getInt('horizons_tree_' + tree) || 0;
    if (invested < required) return false;
  }

  return true;
}

// ============================================================
// TRIAL START / COMPLETE / ABORT
// ============================================================

/**
 * Start a trial instance for a player.
 */
function startTrial(player, trialId) {
  const trial = TRIALS[trialId];
  if (!trial) {
    player.tell('\u00a7c[Horizons] Unknown trial: ' + trialId);
    player.tell('\u00a77Use \u00a7f/horizons trial list \u00a77to see available trials.');
    return false;
  }

  const data = player.persistentData;

  // Check if already in a trial
  if (data.getBoolean(TRIAL_KEYS.inTrial)) {
    player.tell('\u00a7c[Horizons] You are already in a trial! Abort first with /horizons trial abort');
    return false;
  }

  // Check if already completed this trial
  if (player.stages.has(trial.completionStage)) {
    player.tell('\u00a7e[Horizons] You have already completed ' + trial.name + '!');
    return false;
  }

  // Check prerequisites
  if (!meetsTrialRequirements(player, trialId)) {
    player.tell('\u00a7c[Horizons] You do not meet the requirements for ' + trial.name + '.');
    player.tell('\u00a77Required perk trees:');
    for (const tree in trial.reqTrees) {
      const required = trial.reqTrees[tree];
      const invested = data.getInt('horizons_tree_' + tree) || 0;
      const color = invested >= required ? '\u00a7a' : '\u00a7c';
      const treeName = tree.charAt(0).toUpperCase() + tree.slice(1);
      player.tell('  \u00a77' + treeName + ': ' + color + invested + '/' + required);
    }
    return false;
  }

  // Store return position
  data.putDouble(TRIAL_KEYS.returnX, player.x);
  data.putDouble(TRIAL_KEYS.returnY, player.y);
  data.putDouble(TRIAL_KEYS.returnZ, player.z);
  data.putString(TRIAL_KEYS.returnDim, player.level.dimension.toString());

  // Set trial state
  data.putBoolean(TRIAL_KEYS.inTrial, true);
  data.putString(TRIAL_KEYS.currentTrial, trialId);
  data.putLong(TRIAL_KEYS.trialStartTick, player.server.tickCount);

  // Increment attempt counter
  const attempts = data.getInt(TRIAL_KEYS.trialAttempts) || 0;
  data.putInt(TRIAL_KEYS.trialAttempts, attempts + 1);

  // Teleport to trial arena
  const pos = trial.arenaPos;
  player.server.runCommandSilent(
    'tp ' + player.username + ' ' + pos.x + ' ' + pos.y + ' ' + pos.z
  );

  // Grant trial-in-progress stage
  player.stages.add('trial_active');

  // Apply trial buffs (resistance to prevent instant death while loading)
  player.server.runCommandSilent(
    'effect give ' + player.username + ' minecraft:resistance 10 4 true'
  );

  // Display trial start message
  player.tell('\u00a76\u00a7l==============================');
  player.tell(trial.color + '\u00a7l  TRIAL: ' + trial.name.toUpperCase());
  player.tell('\u00a77  ' + trial.description);
  player.tell('\u00a77  Time Limit: \u00a7f10 minutes');
  player.tell('\u00a77  Class: \u00a7f' + formatClassName(trial.classResult));
  player.tell('\u00a76\u00a7l==============================');

  trialLog(player.username + ' started trial: ' + trialId + ' (' + trial.name + ')');
  return true;
}

/**
 * Complete the current trial (checks completion stage or forced via OP).
 */
function completeTrial(player, forced) {
  const data = player.persistentData;

  if (!data.getBoolean(TRIAL_KEYS.inTrial)) {
    player.tell('\u00a7c[Horizons] You are not in a trial.');
    return false;
  }

  const trialId = data.getString(TRIAL_KEYS.currentTrial);
  const trial = TRIALS[trialId];
  if (!trial) {
    player.tell('\u00a7c[Horizons] Invalid trial state. Aborting.');
    abortTrial(player);
    return false;
  }

  // Check if the completion condition is met (stage set by dungeon mechanics)
  if (!forced && !player.stages.has(trial.completionStage)) {
    player.tell('\u00a7c[Horizons] Trial objective not yet complete!');
    return false;
  }

  // Grant completion stage if not already present
  if (!player.stages.has(trial.completionStage)) {
    player.stages.add(trial.completionStage);
  }

  // Grant the Ascended Class stage
  const classStage = 'ascend_class_' + trial.classResult;
  if (!player.stages.has(classStage)) {
    player.stages.add(classStage);
  }

  // Increment completed trials counter
  const completed = data.getInt(TRIAL_KEYS.trialsCompleted) || 0;
  data.putInt(TRIAL_KEYS.trialsCompleted, completed + 1);

  // Store which class was earned
  const ascensionCount = data.getInt('horizons_ascension_count') || 0;
  data.putString('horizons_ascended_class_' + (ascensionCount + 1), trial.classResult);
  data.putInt('horizons_ascension_count', ascensionCount + 1);

  // Record timestamp
  data.putLong('horizons_ascension_time_' + (ascensionCount + 1), player.server.tickCount);

  // Return player to pre-trial position
  returnFromTrial(player);

  // Clear trial state
  clearTrialState(player);

  // Celebration
  player.tell('\u00a76\u00a7l==============================');
  player.tell('\u00a76\u00a7l  TRIAL COMPLETE!');
  player.tell(trial.color + '\u00a7l  ' + trial.name);
  player.tell('\u00a77  Class Unlocked: \u00a7f' + formatClassName(trial.classResult));
  player.tell('\u00a76\u00a7l==============================');

  // Celebration effects
  player.server.runCommandSilent(
    'effect give ' + player.username + ' minecraft:glowing 30 0 true'
  );
  player.server.runCommandSilent(
    'playsound minecraft:ui.toast.challenge_complete master ' + player.username
  );

  trialLog(player.username + ' completed trial: ' + trialId + ' -> Class: ' + trial.classResult);
  return true;
}

/**
 * Abort the current trial — player leaves early with no reward.
 */
function abortTrial(player) {
  const data = player.persistentData;

  if (!data.getBoolean(TRIAL_KEYS.inTrial)) {
    player.tell('\u00a7c[Horizons] You are not in a trial.');
    return false;
  }

  const trialId = data.getString(TRIAL_KEYS.currentTrial);
  const trial = TRIALS[trialId];
  const trialName = trial ? trial.name : 'Unknown';

  returnFromTrial(player);
  clearTrialState(player);

  player.tell('\u00a7c[Horizons] Trial aborted: ' + trialName);
  player.tell('\u00a77You may attempt it again at any time.');

  trialLog(player.username + ' aborted trial: ' + trialId);
  return true;
}

/**
 * Teleport the player back to their pre-trial position.
 */
function returnFromTrial(player) {
  const data = player.persistentData;
  const returnX = data.getDouble(TRIAL_KEYS.returnX);
  const returnY = data.getDouble(TRIAL_KEYS.returnY);
  const returnZ = data.getDouble(TRIAL_KEYS.returnZ);
  const returnDim = data.getString(TRIAL_KEYS.returnDim);

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
}

/**
 * Clear all trial state from persistentData.
 */
function clearTrialState(player) {
  const data = player.persistentData;
  data.putBoolean(TRIAL_KEYS.inTrial, false);
  data.putString(TRIAL_KEYS.currentTrial, '');
  data.putLong(TRIAL_KEYS.trialStartTick, 0);

  if (player.stages.has('trial_active')) {
    player.stages.remove('trial_active');
  }
}

/**
 * Format a class_name string into Title Case display name.
 */
function formatClassName(classId) {
  return classId.split('_').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// ============================================================
// TRIAL TIMER — Check timeout every 200 ticks
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;

  if (server.tickCount % 200 !== 0) return;

  for (const player of server.players) {
    const data = player.persistentData;
    if (!data.getBoolean(TRIAL_KEYS.inTrial)) continue;

    const startTick = data.getLong(TRIAL_KEYS.trialStartTick) || 0;
    const trialId = data.getString(TRIAL_KEYS.currentTrial);
    const trial = TRIALS[trialId];
    if (!trial || startTick === 0) continue;

    const elapsed = server.tickCount - startTick;
    const remaining = trial.timeLimit - elapsed;

    // Time expired — auto-fail
    if (remaining <= 0) {
      player.tell('\u00a74\u00a7l[Horizons] TIME IS UP! Trial failed.');
      abortTrial(player);
      continue;
    }

    // Warnings at 5 min, 2 min, 1 min, 30 sec
    const remainingSec = Math.floor(remaining / 20);
    if (remainingSec === 300 || remainingSec === 120 || remainingSec === 60 || remainingSec === 30) {
      const timeColor = remainingSec <= 60 ? '\u00a7c' : '\u00a7e';
      const minutes = Math.floor(remainingSec / 60);
      const seconds = remainingSec % 60;
      const timeStr = minutes > 0 ? minutes + 'm ' + seconds + 's' : seconds + 's';
      player.tell(timeColor + '[Horizons] Trial time remaining: ' + timeStr);
    }

    // Auto-detect completion (check if completion stage was granted by dungeon)
    if (player.stages.has(trial.completionStage) && data.getBoolean(TRIAL_KEYS.inTrial)) {
      completeTrial(player, false);
    }
  }
});

// ============================================================
// DEATH DURING TRIAL — Auto-abort
// ============================================================

PlayerEvents.respawned(event => {
  const player = event.player;
  const data = player.persistentData;

  if (data.getBoolean(TRIAL_KEYS.inTrial)) {
    player.tell('\u00a74[Horizons] You died during the trial. Trial failed.');
    abortTrial(player);
  }
});

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('trial')
        // /horizons trial list
        .then(Commands.literal('list')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a76\u00a7l=== Ascension Trials ===');
            player.tell('');

            // Hybrid trials
            player.tell('\u00a7e--- Hybrid Trials (two-tree) ---');
            for (const id of TRIAL_IDS) {
              const trial = TRIALS[id];
              if (trial.type !== 'hybrid') continue;

              const canAttempt = meetsTrialRequirements(player, id);
              const completed = player.stages.has(trial.completionStage);
              const status = completed ? '\u00a7a[COMPLETE]' : (canAttempt ? '\u00a7e[AVAILABLE]' : '\u00a7c[LOCKED]');

              player.tell(trial.color + '  ' + trial.name + ' ' + status);
              player.tell('\u00a78    -> ' + formatClassName(trial.classResult));
            }

            player.tell('');
            player.tell('\u00a7e--- Transcendent Trials (mastery) ---');
            for (const id of TRIAL_IDS) {
              const trial = TRIALS[id];
              if (trial.type !== 'transcendent') continue;

              const canAttempt = meetsTrialRequirements(player, id);
              const completed = player.stages.has(trial.completionStage);
              const status = completed ? '\u00a7a[COMPLETE]' : (canAttempt ? '\u00a7e[AVAILABLE]' : '\u00a7c[LOCKED]');

              player.tell(trial.color + '  ' + trial.name + ' ' + status);
              player.tell('\u00a78    -> ' + formatClassName(trial.classResult));
            }

            return 1;
          })
        )
        // /horizons trial start <trial_name>
        .then(Commands.literal('start')
          .then(Commands.argument('trial_name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const trialName = event.getArguments().STRING.getResult(ctx, 'trial_name').toLowerCase();
              startTrial(player, trialName);
              return 1;
            })
          )
        )
        // /horizons trial complete (OP only)
        .then(Commands.literal('complete')
          .requires(src => src.hasPermission(2))
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            completeTrial(player, true);
            return 1;
          })
        )
        // /horizons trial abort
        .then(Commands.literal('abort')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            abortTrial(player);
            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Recover from crash during trial
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  if (data.getBoolean(TRIAL_KEYS.inTrial)) {
    player.tell('\u00a7e[Horizons] You were in a trial when you disconnected.');
    player.tell('\u00a77The trial has been aborted. You may retry at any time.');
    abortTrial(player);
  }
});

console.log('[Horizons] Trial Manager loaded');
console.log('[Horizons] Commands: /horizons trial [list|start|complete|abort]');
console.log('[Horizons] Trials: ' + TRIAL_IDS.length + ' total (' +
  TRIAL_IDS.filter(function(id) { return TRIALS[id].type === 'hybrid'; }).length + ' hybrid, ' +
  TRIAL_IDS.filter(function(id) { return TRIALS[id].type === 'transcendent'; }).length + ' transcendent)');
