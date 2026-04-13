// ============================================================
// Project Horizons — Living Storybook Progression
// ============================================================
// File: kubejs/server_scripts/quests/storybook_progression.js
// Phase: 5
// Dependencies: Patchouli, KubeJS, AStages
// Docs: PROJECT_STATUS.md
// ============================================================
//
// PURPOSE:
// Bridges the stage-based progression system to Patchouli's
// advancement-gated entry system. When a player earns a game
// stage, this script grants the corresponding vanilla advancement
// so the matching Storybook entry becomes visible.
//
// The Living Storybook is a second Patchouli book (separate from
// the Horizons Guide) that "writes itself" as the player progresses.
//
// MECHANISM:
//   Stage granted → PlayerEvents.stageAdded fires
//   → STORYBOOK_MAP lookup → advancement grant command
//   → Patchouli entry with that advancement becomes visible
//
// COMMANDS:
//   /horizons storybook status    — Show unlocked page count
//   /horizons storybook sync      — Re-grant all advancements (OP)
//   /horizons storybook give      — Give storybook item (OP)
// ============================================================

// --- Configuration ---
var STORYBOOK_CONFIG = {
  // The Patchouli book ID for give commands
  bookId: 'patchouli:guide_book',
  bookNbt: '{patchouli:book:"horizons:horizons_storybook"}',

  // Advancement namespace prefix
  advPrefix: 'horizons:storybook/',

  // Debug logging
  debug: true
};

function storyLog(message) {
  if (STORYBOOK_CONFIG.debug) {
    console.log('[Horizons/Storybook] ' + message);
  }
}

// ============================================================
// STAGE → ADVANCEMENT MAPPING
// Each key is a game stage name. The value is a string or array
// of advancement resource locations (without the prefix).
// ============================================================

var STORYBOOK_MAP = {
  // --- Act 1: Arrival ---
  'act_1_started':         'act_1/awakening',
  'quest_first_cobblemon': 'act_1/first_cobblemon',
  'quest_first_gate':      'act_1/first_gate',
  'quest_first_village':   'act_1/first_village',
  'quest_first_farm':      'act_1/first_farm',
  'quest_first_brew':      'act_1/first_brew',
  'quest_act1_complete':   'act_1/act_1_complete',

  // --- Act 2: First Steps ---
  'act_2_started':         ['act_2/act_2_started', 'act_2/watcher_contact'],
  'branch_restoration':    ['act_2/branch_restoration', 'act_2/restoration_path', 'branches/first_branch'],
  'branch_independence':   ['act_2/branch_independence', 'act_2/independence_path', 'branches/first_branch'],
  'quest_act2_complete':   'act_2/act_2_complete',

  // --- Act 3: The Wider World ---
  'act_3_started':         'act_3/act_3_started',
  'branch_tech':           ['act_3/branch_tech', 'act_3/tech_path', 'branches/second_branch'],
  'branch_nature':         ['act_3/branch_nature', 'act_3/nature_path', 'branches/second_branch'],
  'quest_act3_complete':   'act_3/act_3_complete',

  // --- Act 4: The Stars ---
  'act_4_started':         'act_4/act_4_started',
  'branch_conquer':        ['act_4/branch_conquer', 'act_4/conquer_path', 'branches/third_branch'],
  'branch_diplomacy':      ['act_4/branch_diplomacy', 'act_4/diplomacy_path', 'branches/third_branch'],
  'quest_act4_complete':   'act_4/act_4_complete',

  // --- Act 5: Convergence ---
  'act_5_started':         ['act_5/act_5_started', 'act_5/convergence'],
  'quest_act5_complete':   'act_5/act_5_complete',

  // --- Endings ---
  'ending_restoration':    ['endings/ending_begun', 'endings/ending_restoration'],
  'ending_pilgrim':        ['endings/ending_begun', 'endings/ending_pilgrim'],
  'ending_steward':        ['endings/ending_begun', 'endings/ending_steward'],
  'ending_awakened':       ['endings/ending_begun', 'endings/ending_awakened'],
  'ending_architect':      ['endings/ending_begun', 'endings/ending_architect'],

  // --- Gym Challenge ---
  'quest_gym_1_complete':  'gyms/gym_1',
  'quest_gym_2_complete':  'gyms/gym_2',
  'quest_gym_3_complete':  'gyms/gym_3',
  'quest_gym_4_complete':  'gyms/gym_4',
  'quest_gym_5_complete':  'gyms/gym_5',
  'quest_gym_6_complete':  'gyms/gym_6',
  'quest_gym_7_complete':  'gyms/gym_7',
  'quest_gym_8_complete':  'gyms/gym_8',
  'quest_elite_four':      'gyms/elite_four',
  'championship':          'gyms/champion',

  // --- Side Stories ---
  'sidechain_bounty_complete':      'side/bounty_hunter',
  'sidechain_cultivator_complete':  'side/cultivator',
  'sidechain_crafter_complete':     'side/crafter',
  'sidechain_merchant_complete':    'side/merchant',
  'sidechain_colony_complete':      'side/colony',
  'sidechain_lorekeeper_complete':  'side/lorekeeper',
  'sidechain_cartographer_complete':'side/cartographer',
  'sidechain_trainer_complete':     'side/trainer',
  'sidechain_outlaw_complete':      'side/outlaw',
  'sidechain_diplomat_complete':    'side/diplomat',

  // --- Discoveries ---
  'discovered_anchor_town':       'discoveries/anchor_town',
  'discovered_willowmere':        'discoveries/willowmere',
  'discovered_mountain_forge':    'discoveries/mountain_forge',
  'discovered_coastal_republic':  'discoveries/coastal_republic',
  'discovered_forest_coalition':  'discoveries/forest_coalition',
  'discovered_skyborn_citadel':   'discoveries/skyborn_citadel',

  // --- Additional Act triggers for deeper gates / rocket ---
  'gate_tier_c':           'act_3/deeper_gates',
  'quest_rocket_frame':    'act_3/rocket_frame',
  'act4_watchers_question':'act_4/watchers_question',
  'act5_final_trial':      ['act_5/final_trial', 'act_5/five_paths'],
  'quest_first_gym':       'act_2/first_gym',

  // --- AE2 Discovery ---
  'quest_ae2_network':     'discoveries/ae2_network'
};

// ============================================================
// ADVANCEMENT GRANT UTILITY
// ============================================================

/**
 * Grant a storybook advancement to a player.
 * @param {Player} player - The KubeJS player object
 * @param {string} advPath - Path relative to storybook/ (e.g. "act_1/awakening")
 */
function grantStorybookAdvancement(player, advPath) {
  var fullAdv = STORYBOOK_CONFIG.advPrefix + advPath;
  player.server.runCommandSilent(
    'advancement grant ' + player.username + ' only ' + fullAdv
  );
  storyLog('Granted advancement ' + fullAdv + ' to ' + player.username);
}

/**
 * Process a STORYBOOK_MAP value (string or array) and grant all advancements.
 */
function processStoryMapping(player, mapping) {
  if (typeof mapping === 'string') {
    grantStorybookAdvancement(player, mapping);
  } else if (Array.isArray(mapping)) {
    for (var i = 0; i < mapping.length; i++) {
      grantStorybookAdvancement(player, mapping[i]);
    }
  }
}

// ============================================================
// STAGE LISTENER — Grant storybook advancements on stage addition
// ============================================================

PlayerEvents.stageAdded(function(event) {
  var player = event.player;
  var stage = event.stage;

  var mapping = STORYBOOK_MAP[stage];
  if (mapping) {
    storyLog('Stage ' + stage + ' triggered storybook unlock for ' + player.username);
    processStoryMapping(player, mapping);
  }
});

// ============================================================
// PLAYER LOGIN — Retroactive grants + storybook item
// ============================================================

PlayerEvents.loggedIn(function(event) {
  var player = event.player;
  var data = player.persistentData;

  // --- Give storybook on first login ---
  if (!data.getBoolean('horizons_has_storybook')) {
    player.server.runCommandSilent(
      'give ' + player.username + ' ' + STORYBOOK_CONFIG.bookId + STORYBOOK_CONFIG.bookNbt + ' 1'
    );
    data.putBoolean('horizons_has_storybook', true);
    player.tell('\u00a76\u00a7l[Living Storybook] \u00a7eA mysterious journal has appeared in your inventory.');
    player.tell('\u00a77  Its pages are mostly blank... for now.');
    storyLog('Gave storybook to first-time player ' + player.username);
  }

  // --- Retroactive advancement sync ---
  // Grant all storybook advancements for stages the player already has.
  // This supports adding the storybook to existing saves.
  var syncCount = 0;
  var stages = Object.keys(STORYBOOK_MAP);
  for (var i = 0; i < stages.length; i++) {
    var stageName = stages[i];
    if (player.stages.has(stageName)) {
      processStoryMapping(player, STORYBOOK_MAP[stageName]);
      syncCount++;
    }
  }
  if (syncCount > 0) {
    storyLog('Retroactively synced ' + syncCount + ' storybook entries for ' + player.username);
  }
});

// ============================================================
// CRAFTING RECIPE — Replacement storybook
// ============================================================

ServerEvents.recipes(function(event) {
  event.shaped(
    Item.of(STORYBOOK_CONFIG.bookId, STORYBOOK_CONFIG.bookNbt),
    [
      ' F ',
      ' B ',
      ' I '
    ],
    {
      F: 'minecraft:feather',
      B: 'minecraft:book',
      I: 'minecraft:ink_sac'
    }
  ).id('horizons:storybook_craft');
});

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(function(event) {
  var Commands = event.commands;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('storybook')
        // /horizons storybook status — Show unlocked page count
        .then(Commands.literal('status')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            var unlocked = 0;
            var total = 0;
            var stages = Object.keys(STORYBOOK_MAP);
            for (var i = 0; i < stages.length; i++) {
              total++;
              if (player.stages.has(stages[i])) {
                unlocked++;
              }
            }

            player.tell('\u00a76\u00a7l=== Living Storybook ===');
            player.tell('\u00a77  Pages unlocked: \u00a7f' + unlocked + '\u00a77 / \u00a7f' + total);
            var pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
            player.tell('\u00a77  Completion: \u00a7f' + pct + '%');

            if (unlocked === 0) {
              player.tell('\u00a78  Your story has not yet begun...');
            } else if (unlocked === total) {
              player.tell('\u00a7a  Every page is filled. Your story is complete.');
            }
            return 1;
          })
        )
        // /horizons storybook sync — OP only, re-grant all advancements
        .then(Commands.literal('sync')
          .requires(function(src) { return src.hasPermission(2); })
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            var syncCount = 0;
            var stages = Object.keys(STORYBOOK_MAP);
            for (var i = 0; i < stages.length; i++) {
              if (player.stages.has(stages[i])) {
                processStoryMapping(player, STORYBOOK_MAP[stages[i]]);
                syncCount++;
              }
            }

            player.tell('\u00a7e[Storybook] Synced ' + syncCount + ' advancement(s).');
            return 1;
          })
        )
        // /horizons storybook give — OP only, give storybook item
        .then(Commands.literal('give')
          .requires(function(src) { return src.hasPermission(2); })
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            player.server.runCommandSilent(
              'give ' + player.username + ' ' + STORYBOOK_CONFIG.bookId + STORYBOOK_CONFIG.bookNbt + ' 1'
            );
            player.tell('\u00a7e[Storybook] Gave Living Storybook.');
            return 1;
          })
        )
      )
  );
});

// ============================================================
// INITIALIZATION
// ============================================================

console.log('[Horizons] Living Storybook Progression loaded');
console.log('[Horizons] Commands: /horizons storybook [status|sync|give]');
console.log('[Horizons] Mapped ' + Object.keys(STORYBOOK_MAP).length + ' stages to storybook advancements');
