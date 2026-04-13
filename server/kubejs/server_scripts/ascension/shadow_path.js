// ============================================================
// Project Horizons — Shadow Path
// ============================================================
// File: kubejs/server_scripts/ascension/shadow_path.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Players with Crime Stat 4+ (Outlaw path) unlock alternative
// "Shadow" versions of Ascended Classes. Shadow classes have
// harder trials but grant offensive-focused sigils and abilities.
//
// SHADOW CLASSES (10):
//   Shadow Reaver       (replaces Warlord)
//   Wild Hunter         (replaces Beastmaster)
//   Nightcloak          (replaces Pathwalker)
//   Smuggler-King       (replaces Architect)
//   Void Pirate         (replaces Voyager)
//   Wandering Outlaw    (replaces Shepherd)
//   Tyrant              (replaces Avatar of War)
//   Lockbreaker         (replaces Mind of the Forge)
//   Witch of Thorns     (replaces Verdant Sovereign)
//   Ghost of the Roads  (replaces Eternal Walker)
//
// SHADOW TRIAL MODIFIERS:
//   - Time limit reduced to 8 minutes (from 10)
//   - Enemies deal +25% damage
//   - Unique dark-themed arenas
//   - Outlaw-only reward items
//
// STAGES:
//   ascend_shadow_path           — Player chose the outlaw path
//   ascend_class_<shadow_class>  — Shadow class unlocked
//
// COMMANDS:
//   /horizons shadow status     — Show shadow class options
//   /horizons shadow choose     — Commit to the shadow path
//   /horizons shadow trial <id> — Start a shadow trial
// ============================================================

// --- Shadow Class Definitions ---
const SHADOW_CLASSES = {
  shadow_reaver: {
    name: 'Shadow Reaver',
    color: '\u00a78',
    description: 'A dark warrior who thrives on violence and fear.',
    replaces: 'warlord',
    type: 'hybrid',
    reqTrees: { vanguard: 25, artificer: 25 },
    trialName: 'Shadow Crucible',
    trialDesc: 'Survive escalating waves in complete darkness.',
    arenaPos: { x: 10500, y: 100, z: 10000 },
    timeLimit: 9600,  // 8 minutes
    completionStage: 'trial_shadow_crucible_complete',
    rewards: ['shadow_blade_fragment', 'dark_sigil_shard']
  },
  wild_hunter: {
    name: 'Wild Hunter',
    color: '\u00a78',
    description: 'A predator who stalks prey from the shadows.',
    replaces: 'beastmaster',
    type: 'hybrid',
    reqTrees: { vanguard: 25, cultivator: 25 },
    trialName: 'Blood Hunt',
    trialDesc: 'Track and eliminate 10 marked targets before dawn.',
    arenaPos: { x: 10500, y: 100, z: 10200 },
    timeLimit: 9600,
    completionStage: 'trial_blood_hunt_complete',
    rewards: ['hunter_fang', 'dark_sigil_shard']
  },
  nightcloak: {
    name: 'Nightcloak',
    color: '\u00a78',
    description: 'An assassin who moves unseen through the night.',
    replaces: 'pathwalker',
    type: 'hybrid',
    reqTrees: { vanguard: 25, wayfinder: 25 },
    trialName: 'Silent Passage',
    trialDesc: 'Infiltrate a fortress without being detected.',
    arenaPos: { x: 10500, y: 100, z: 10400 },
    timeLimit: 9600,
    completionStage: 'trial_silent_passage_complete',
    rewards: ['shadow_cloak', 'dark_sigil_shard']
  },
  smuggler_king: {
    name: 'Smuggler-King',
    color: '\u00a78',
    description: 'A criminal mastermind who controls the black market.',
    replaces: 'architect',
    type: 'hybrid',
    reqTrees: { artificer: 25, cultivator: 25 },
    trialName: 'The Heist',
    trialDesc: 'Steal a treasure from a heavily guarded vault.',
    arenaPos: { x: 10500, y: 100, z: 10600 },
    timeLimit: 9600,
    completionStage: 'trial_the_heist_complete',
    rewards: ['crown_of_thieves', 'dark_sigil_shard']
  },
  void_pirate: {
    name: 'Void Pirate',
    color: '\u00a78',
    description: 'A feared corsair who sails the spaces between worlds.',
    replaces: 'voyager',
    type: 'hybrid',
    reqTrees: { artificer: 25, wayfinder: 25 },
    trialName: 'Ghost Ship',
    trialDesc: 'Commandeer a spectral vessel through the void.',
    arenaPos: { x: 10500, y: 100, z: 10800 },
    timeLimit: 9600,
    completionStage: 'trial_ghost_ship_complete',
    rewards: ['void_compass', 'dark_sigil_shard']
  },
  wandering_outlaw: {
    name: 'Wandering Outlaw',
    color: '\u00a78',
    description: 'A lone drifter with no allegiance but survival.',
    replaces: 'shepherd',
    type: 'hybrid',
    reqTrees: { cultivator: 25, wayfinder: 25 },
    trialName: 'No Man\'s Land',
    trialDesc: 'Cross a wasteland with enemies on all sides.',
    arenaPos: { x: 10500, y: 100, z: 11000 },
    timeLimit: 9600,
    completionStage: 'trial_no_mans_land_complete',
    rewards: ['outlaws_badge', 'dark_sigil_shard']
  },
  tyrant: {
    name: 'Tyrant',
    color: '\u00a74',
    description: 'A warlord who rules through fear and absolute power.',
    replaces: 'avatar_of_war',
    type: 'transcendent',
    reqTrees: { vanguard: 100 },
    trialName: 'Throne of Skulls',
    trialDesc: 'Defeat every challenger in the arena of tyrants.',
    arenaPos: { x: 10700, y: 100, z: 10000 },
    timeLimit: 9600,
    completionStage: 'trial_throne_of_skulls_complete',
    rewards: ['tyrant_crown', 'dark_sigil_shard']
  },
  lockbreaker: {
    name: 'Lockbreaker',
    color: '\u00a75',
    description: 'A master thief who can bypass any barrier.',
    replaces: 'mind_of_the_forge',
    type: 'transcendent',
    reqTrees: { artificer: 100 },
    trialName: 'Infinite Vault',
    trialDesc: 'Break through 10 increasingly complex locks.',
    arenaPos: { x: 10700, y: 100, z: 10200 },
    timeLimit: 9600,
    completionStage: 'trial_infinite_vault_complete',
    rewards: ['skeleton_master_key', 'dark_sigil_shard']
  },
  witch_of_thorns: {
    name: 'Witch of Thorns',
    color: '\u00a72',
    description: 'A dark druid who corrupts nature to serve their will.',
    replaces: 'verdant_sovereign',
    type: 'transcendent',
    reqTrees: { cultivator: 100 },
    trialName: 'Blighted Garden',
    trialDesc: 'Corrupt a sacred grove before the guardians stop you.',
    arenaPos: { x: 10700, y: 100, z: 10400 },
    timeLimit: 9600,
    completionStage: 'trial_blighted_garden_complete',
    rewards: ['thorn_crown', 'dark_sigil_shard']
  },
  ghost_of_the_roads: {
    name: 'Ghost of the Roads',
    color: '\u00a79',
    description: 'A phantom wanderer who has transcended mortality.',
    replaces: 'eternal_walker',
    type: 'transcendent',
    reqTrees: { wayfinder: 100 },
    trialName: 'Road of the Dead',
    trialDesc: 'Walk the path between life and death to the end.',
    arenaPos: { x: 10700, y: 100, z: 10600 },
    timeLimit: 9600,
    completionStage: 'trial_road_of_dead_complete',
    rewards: ['ghost_lantern', 'dark_sigil_shard']
  }
};

const SHADOW_CLASS_IDS = Object.keys(SHADOW_CLASSES);

// --- Mapping from light class -> shadow class ---
const LIGHT_TO_SHADOW = {};
for (const shadowId of SHADOW_CLASS_IDS) {
  LIGHT_TO_SHADOW[SHADOW_CLASSES[shadowId].replaces] = shadowId;
}

// --- Crime stat threshold for shadow path ---
const SHADOW_CRIME_THRESHOLD = 4;

// --- Logging ---
function shadowLog(message) {
  console.log('[Horizons/Shadow] ' + message);
}

// ============================================================
// SHADOW PATH DETECTION
// ============================================================

/**
 * Check if a player qualifies for the shadow path.
 */
function isOutlawPath(player) {
  const crimeStat = player.persistentData.getInt('horizons_crime_stat') || 0;
  return crimeStat >= SHADOW_CRIME_THRESHOLD;
}

/**
 * Check if player meets requirements for a shadow class trial.
 */
function meetsShadowRequirements(player, shadowId) {
  const shadowClass = SHADOW_CLASSES[shadowId];
  if (!shadowClass) return false;

  // Must be on shadow path
  if (!player.stages.has('ascend_shadow_path')) return false;

  // Must be ascension-eligible
  if (!player.stages.has('ascend_eligible')) return false;

  // Check perk tree requirements
  const data = player.persistentData;
  for (const tree in shadowClass.reqTrees) {
    const required = shadowClass.reqTrees[tree];
    const invested = data.getInt('horizons_tree_' + tree) || 0;
    if (invested < required) return false;
  }

  return true;
}

// ============================================================
// SHADOW PATH COMMIT
// ============================================================

/**
 * Commit a player to the shadow path. This is a permanent choice per ascension.
 */
function chooseShadowPath(player) {
  if (!isOutlawPath(player)) {
    player.tell('\u00a7c[Horizons] The Shadow Path requires Crime Stat 4+.');
    player.tell('\u00a77Current Crime Stat: \u00a7f' + (player.persistentData.getInt('horizons_crime_stat') || 0));
    return false;
  }

  if (!player.stages.has('ascend_eligible')) {
    player.tell('\u00a7c[Horizons] You must meet all ascension requirements first.');
    player.tell('\u00a77Use \u00a7f/horizons ascension check \u00a77to see your progress.');
    return false;
  }

  if (player.stages.has('ascend_shadow_path')) {
    player.tell('\u00a7e[Horizons] You are already on the Shadow Path.');
    return false;
  }

  player.stages.add('ascend_shadow_path');

  player.tell('\u00a78\u00a7l==============================');
  player.tell('\u00a78\u00a7l  THE SHADOW PATH');
  player.tell('\u00a77  You have chosen the way of darkness.');
  player.tell('\u00a77  Shadow trials await. The rewards are');
  player.tell('\u00a77  greater, but so is the cost.');
  player.tell('\u00a78\u00a7l==============================');

  player.server.runCommandSilent(
    'playsound minecraft:ambient.cave master ' + player.username + ' ~ ~ ~ 1 0.5'
  );

  shadowLog(player.username + ' committed to the Shadow Path');
  return true;
}

// ============================================================
// SHADOW TRIAL START
// ============================================================

/**
 * Start a shadow trial. Uses the same framework as trial_manager
 * but with shadow-specific parameters.
 */
function startShadowTrial(player, shadowId) {
  const shadowClass = SHADOW_CLASSES[shadowId];
  if (!shadowClass) {
    player.tell('\u00a7c[Horizons] Unknown shadow trial: ' + shadowId);
    player.tell('\u00a77Available: ' + SHADOW_CLASS_IDS.join(', '));
    return false;
  }

  const data = player.persistentData;

  // Check if already in a trial
  if (data.getBoolean('horizons_in_trial')) {
    player.tell('\u00a7c[Horizons] You are already in a trial!');
    return false;
  }

  // Check if already completed
  if (player.stages.has(shadowClass.completionStage)) {
    player.tell('\u00a7e[Horizons] You have already completed ' + shadowClass.trialName + '!');
    return false;
  }

  // Check requirements
  if (!meetsShadowRequirements(player, shadowId)) {
    player.tell('\u00a7c[Horizons] You do not meet the requirements for ' + shadowClass.trialName + '.');
    return false;
  }

  // Store return position
  data.putDouble('horizons_trial_return_x', player.x);
  data.putDouble('horizons_trial_return_y', player.y);
  data.putDouble('horizons_trial_return_z', player.z);
  data.putString('horizons_trial_return_dim', player.level.dimension.toString());

  // Set trial state
  data.putBoolean('horizons_in_trial', true);
  data.putString('horizons_current_trial', 'shadow_' + shadowId);
  data.putLong('horizons_trial_start_tick', player.server.tickCount);
  data.putBoolean('horizons_shadow_trial', true);

  // Teleport to shadow arena
  var pos = shadowClass.arenaPos;
  player.server.runCommandSilent(
    'tp ' + player.username + ' ' + pos.x + ' ' + pos.y + ' ' + pos.z
  );

  // Grant trial-active stage
  player.stages.add('trial_active');

  // Shadow trial debuffs (harder difficulty)
  player.server.runCommandSilent(
    'effect give ' + player.username + ' minecraft:resistance 10 4 true'
  );

  // Display shadow trial banner
  player.tell('\u00a78\u00a7l==============================');
  player.tell('\u00a74\u00a7l  SHADOW TRIAL: ' + shadowClass.trialName.toUpperCase());
  player.tell('\u00a77  ' + shadowClass.trialDesc);
  player.tell('\u00a7c  Time Limit: 8 minutes (HARD MODE)');
  player.tell('\u00a77  Shadow Class: \u00a7f' + shadowClass.name);
  player.tell('\u00a78\u00a7l==============================');

  player.server.runCommandSilent(
    'playsound minecraft:ambient.basalt_deltas.mood master ' + player.username + ' ~ ~ ~ 2 0.5'
  );

  shadowLog(player.username + ' started shadow trial: ' + shadowId + ' (' + shadowClass.trialName + ')');
  return true;
}

// ============================================================
// SHADOW TRIAL COMPLETION — Hooks into trial_manager tick
// ============================================================

/**
 * Complete a shadow trial. Called when the completion stage is detected
 * or forced by an admin.
 */
function completeShadowTrial(player, shadowId, forced) {
  const shadowClass = SHADOW_CLASSES[shadowId];
  if (!shadowClass) return false;

  // Check completion condition
  if (!forced && !player.stages.has(shadowClass.completionStage)) {
    player.tell('\u00a7c[Horizons] Shadow trial objective not yet complete!');
    return false;
  }

  const data = player.persistentData;

  // Grant completion stage
  if (!player.stages.has(shadowClass.completionStage)) {
    player.stages.add(shadowClass.completionStage);
  }

  // Grant the shadow class stage
  var classStage = 'ascend_class_' + shadowId;
  if (!player.stages.has(classStage)) {
    player.stages.add(classStage);
  }

  // Update ascension tracking
  var ascensionCount = data.getInt('horizons_ascension_count') || 0;
  data.putString('horizons_ascended_class_' + (ascensionCount + 1), shadowId);
  data.putInt('horizons_ascension_count', ascensionCount + 1);
  data.putLong('horizons_ascension_time_' + (ascensionCount + 1), player.server.tickCount);

  // Return to pre-trial position
  var returnX = data.getDouble('horizons_trial_return_x');
  var returnY = data.getDouble('horizons_trial_return_y');
  var returnZ = data.getDouble('horizons_trial_return_z');
  var returnDim = data.getString('horizons_trial_return_dim');

  if (returnDim && returnDim.length > 0) {
    player.server.runCommandSilent(
      'execute in ' + returnDim + ' run tp ' + player.username + ' ' +
      returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
    );
  } else {
    player.server.runCommandSilent(
      'tp ' + player.username + ' ' + returnX.toFixed(1) + ' ' + returnY.toFixed(1) + ' ' + returnZ.toFixed(1)
    );
  }

  // Clear trial state
  data.putBoolean('horizons_in_trial', false);
  data.putString('horizons_current_trial', '');
  data.putLong('horizons_trial_start_tick', 0);
  data.putBoolean('horizons_shadow_trial', false);
  if (player.stages.has('trial_active')) {
    player.stages.remove('trial_active');
  }

  // Celebration
  player.tell('\u00a78\u00a7l==============================');
  player.tell('\u00a74\u00a7l  SHADOW TRIAL COMPLETE!');
  player.tell(shadowClass.color + '\u00a7l  ' + shadowClass.name);
  player.tell('\u00a77  The darkness is yours to command.');
  player.tell('\u00a78\u00a7l==============================');

  player.server.runCommandSilent(
    'effect give ' + player.username + ' minecraft:glowing 30 0 true'
  );
  player.server.runCommandSilent(
    'playsound minecraft:entity.wither.spawn master ' + player.username + ' ~ ~ ~ 0.5 1.5'
  );

  shadowLog(player.username + ' completed shadow trial: ' + shadowId + ' -> ' + shadowClass.name);
  return true;
}

// ============================================================
// SHADOW TRIAL TIMER — Checks within the main tick loop
// ============================================================

ServerEvents.tick(event => {
  var server = event.server;

  if (server.tickCount % 200 !== 0) return;

  for (var player of server.players) {
    var data = player.persistentData;
    if (!data.getBoolean('horizons_in_trial')) continue;
    if (!data.getBoolean('horizons_shadow_trial')) continue;

    var currentTrialStr = data.getString('horizons_current_trial');
    if (!currentTrialStr || !currentTrialStr.startsWith('shadow_')) continue;

    var shadowId = currentTrialStr.replace('shadow_', '');
    var shadowClass = SHADOW_CLASSES[shadowId];
    if (!shadowClass) continue;

    var startTick = data.getLong('horizons_trial_start_tick') || 0;
    var elapsed = server.tickCount - startTick;
    var remaining = shadowClass.timeLimit - elapsed;

    // Time expired
    if (remaining <= 0) {
      player.tell('\u00a74\u00a7l[Horizons] TIME IS UP! Shadow trial failed.');

      // Return and clear
      var rx = data.getDouble('horizons_trial_return_x');
      var ry = data.getDouble('horizons_trial_return_y');
      var rz = data.getDouble('horizons_trial_return_z');
      var rd = data.getString('horizons_trial_return_dim');

      if (rd && rd.length > 0) {
        server.runCommandSilent(
          'execute in ' + rd + ' run tp ' + player.username + ' ' +
          rx.toFixed(1) + ' ' + ry.toFixed(1) + ' ' + rz.toFixed(1)
        );
      }
      data.putBoolean('horizons_in_trial', false);
      data.putString('horizons_current_trial', '');
      data.putBoolean('horizons_shadow_trial', false);
      if (player.stages.has('trial_active')) player.stages.remove('trial_active');
      continue;
    }

    // Time warnings
    var remainingSec = Math.floor(remaining / 20);
    if (remainingSec === 240 || remainingSec === 120 || remainingSec === 60 || remainingSec === 30) {
      var timeColor = remainingSec <= 60 ? '\u00a7c' : '\u00a7e';
      var minutes = Math.floor(remainingSec / 60);
      var seconds = remainingSec % 60;
      var timeStr = minutes > 0 ? minutes + 'm ' + seconds + 's' : seconds + 's';
      player.tell(timeColor + '[Horizons] Shadow trial time remaining: ' + timeStr);
    }

    // Auto-detect completion
    if (player.stages.has(shadowClass.completionStage)) {
      completeShadowTrial(player, shadowId, false);
    }
  }
});

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  var Commands = event.commands;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('shadow')
        // /horizons shadow status
        .then(Commands.literal('status')
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            var data = player.persistentData;
            var crimeStat = data.getInt('horizons_crime_stat') || 0;
            var isShadow = player.stages.has('ascend_shadow_path');
            var isOutlaw = crimeStat >= SHADOW_CRIME_THRESHOLD;

            player.tell('\u00a78\u00a7l=== Shadow Path Status ===');
            player.tell('\u00a77Crime Stat: ' + (crimeStat >= 4 ? '\u00a7c' : '\u00a7e') + crimeStat + '/6');
            player.tell('\u00a77Outlaw Status: ' + (isOutlaw ? '\u00a7c\u2713 Outlaw' : '\u00a78\u2717 Not Outlaw (need 4+)'));
            player.tell('\u00a77Shadow Path: ' + (isShadow ? '\u00a7c\u2713 Committed' : '\u00a78\u2717 Not chosen'));

            if (!isOutlaw) {
              player.tell('');
              player.tell('\u00a77The Shadow Path requires Crime Stat 4+.');
              player.tell('\u00a77Your current path is the way of \u00a7aLight\u00a77.');
              return 1;
            }

            player.tell('');
            player.tell('\u00a78--- Shadow Classes ---');

            for (var shadowId of SHADOW_CLASS_IDS) {
              var sc = SHADOW_CLASSES[shadowId];
              var canAttempt = isShadow && meetsShadowRequirements(player, shadowId);
              var completed = player.stages.has(sc.completionStage);
              var status = completed ? '\u00a7a[COMPLETE]' : (canAttempt ? '\u00a7e[AVAILABLE]' : '\u00a7c[LOCKED]');

              player.tell(sc.color + '  ' + sc.name + ' ' + status);
              player.tell('\u00a78    Replaces: ' + sc.replaces + ' | Trial: ' + sc.trialName);
            }

            if (!isShadow && isOutlaw) {
              player.tell('');
              player.tell('\u00a77Use \u00a7f/horizons shadow choose \u00a77to commit to the Shadow Path.');
            }

            return 1;
          })
        )
        // /horizons shadow choose
        .then(Commands.literal('choose')
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            chooseShadowPath(player);
            return 1;
          })
        )
        // /horizons shadow trial <id>
        .then(Commands.literal('trial')
          .then(Commands.argument('shadow_class', event.getArguments().STRING.create(event))
            .executes(ctx => {
              var player = ctx.source.player;
              if (!player) return 0;

              var shadowId = event.getArguments().STRING.getResult(ctx, 'shadow_class').toLowerCase();
              startShadowTrial(player, shadowId);
              return 1;
            })
          )
        )
        // /horizons shadow complete (OP)
        .then(Commands.literal('complete')
          .requires(src => src.hasPermission(2))
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            var data = player.persistentData;
            var currentTrialStr = data.getString('horizons_current_trial');
            if (!currentTrialStr || !currentTrialStr.startsWith('shadow_')) {
              player.tell('\u00a7c[Horizons] Not in a shadow trial.');
              return 0;
            }
            var shadowId = currentTrialStr.replace('shadow_', '');
            completeShadowTrial(player, shadowId, true);
            return 1;
          })
        )
      )
  );
});

// ============================================================
// AUTO-DETECT — Flag outlaw players on periodic check
// ============================================================

ServerEvents.tick(event => {
  var server = event.server;

  // Check every 600 ticks
  if (server.tickCount % 600 !== 0) return;

  for (var player of server.players) {
    if (player.isCreative() || player.isSpectator()) continue;
    if (!player.stages.has('ascend_eligible')) continue;

    // Auto-notify outlaws about shadow path
    if (isOutlawPath(player) && !player.stages.has('ascend_shadow_path') &&
        !player.persistentData.getBoolean('horizons_shadow_notified')) {
      player.tell('\u00a78[Horizons] \u00a77The \u00a74Shadow Path \u00a77beckons...');
      player.tell('\u00a77Your outlaw status unlocks dark alternatives to Ascension.');
      player.tell('\u00a77Use \u00a7f/horizons shadow status \u00a77to learn more.');
      player.persistentData.putBoolean('horizons_shadow_notified', true);
    }
  }
});

console.log('[Horizons] Shadow Path loaded');
console.log('[Horizons] Commands: /horizons shadow [status|choose|trial|complete]');
console.log('[Horizons] Shadow Classes: ' + SHADOW_CLASS_IDS.length + ' total');
