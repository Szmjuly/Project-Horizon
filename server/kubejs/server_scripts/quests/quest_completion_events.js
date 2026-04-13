// ============================================================
// Project Horizons — Quest Completion Events
// ============================================================
// File: kubejs/server_scripts/quests/quest_completion_events.js
// Phase: 2
// Dependencies: FTB Quests, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Side effects triggered when specific quests are completed.
// Listens for stage additions that correspond to quest completions
// and fires rewards, messages, sounds, and follow-up stage grants.
//
// TRIGGERS (via PlayerEvents.stageAdded):
//   quest_act1_complete     — Act 1 finished, unlock Act 2
//   quest_first_cobblemon   — First companion tutorial
//   quest_first_gate        — First gate tutorial
//   quest_first_village     — First village tutorial, spawn NPC
//   quest_first_farm        — Farming tutorial, give seeds
//   quest_first_brew        — Brewing tutorial, give bottles
//   quest_gym_1_complete    — Gym badges 1-8
//     through
//   quest_gym_8_complete
//   quest_elite_four        — Championship finale
//
// COMMANDS:
//   /horizons quest trigger <stage>  — OP only, manual trigger
// ============================================================

// --- Configuration ---
var QUEST_EVENTS = {
  // Sound played on quest completion (varies by importance)
  sounds: {
    normal: 'minecraft:entity.player.levelup',
    major: 'minecraft:ui.toast.challenge_complete',
    epic: 'minecraft:entity.ender_dragon.death'
  },

  // Perk point reward amounts
  perkRewards: {
    act_complete: 50,
    first_discovery: 10,
    gym_badge: 25,
    elite_four: 100
  },

  // Debug logging
  debug: true
};

// --- Utility ---

function questLog(message) {
  if (QUEST_EVENTS.debug) {
    console.log('[Horizons/QuestEvents] ' + message);
  }
}

/**
 * Grant perk points via the reward handler command.
 */
function grantPerkReward(player, amount) {
  player.server.runCommandSilent('horizons reward perkpoints ' + amount);
}

/**
 * Play a sound to the player.
 */
function playSound(player, soundKey) {
  var sound = QUEST_EVENTS.sounds[soundKey] || QUEST_EVENTS.sounds.normal;
  player.server.runCommandSilent(
    'playsound ' + sound + ' master ' + player.username + ' ~ ~ ~ 1 1'
  );
}

/**
 * Send a formatted quest completion message.
 */
function sendQuestMessage(player, title, description) {
  player.tell('\u00a7e\u00a7l==============================');
  player.tell('\u00a7e  ' + title);
  player.tell('  \u00a77' + description);
  player.tell('\u00a7e\u00a7l==============================');
}

/**
 * Grant a stage if the player doesn't already have it.
 */
function safeGrantStage(player, stage) {
  if (!player.stages.has(stage)) {
    player.stages.add(stage);
    return true;
  }
  return false;
}

/**
 * Give items to a player via command.
 */
function giveItem(player, itemId, count) {
  player.server.runCommandSilent(
    'give ' + player.username + ' ' + itemId + ' ' + count
  );
}

/**
 * Get the current gym badge count from persistentData.
 */
function getGymBadgeCount(player) {
  return player.persistentData.getInt('horizons_gym_badges') || 0;
}

/**
 * Set the gym badge count.
 */
function setGymBadgeCount(player, count) {
  player.persistentData.putInt('horizons_gym_badges', count);
}

// ============================================================
// QUEST COMPLETION TRIGGER DEFINITIONS
// Each key is a stage name; the value is a handler function.
// ============================================================

var QUEST_TRIGGERS = {};

// --- Act 1 Complete ---
QUEST_TRIGGERS['quest_act1_complete'] = function(player) {
  sendQuestMessage(player,
    'ACT 1 COMPLETE',
    'The Horizon awaits. A new chapter unfolds...'
  );
  playSound(player, 'major');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.act_complete);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.act_complete + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  The Watchers have noticed your arrival. New quests');
  player.tell('\u00a77  and challenges await in \u00a7fAct 2\u00a77.');

  safeGrantStage(player, 'act_2_started');
  questLog(player.username + ' completed Act 1, unlocked Act 2');
};

// --- First Cobblemon ---
QUEST_TRIGGERS['quest_first_cobblemon'] = function(player) {
  sendQuestMessage(player,
    'FIRST COMPANION',
    'You\'ve caught your first Cobblemon!'
  );
  playSound(player, 'normal');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.first_discovery);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.first_discovery + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  Your companion will grow stronger with you. Train,');
  player.tell('\u00a77  battle, and explore together. Check the \u00a7fCobblemon');
  player.tell('\u00a77  \u00a7fmenu\u00a77 for details on your team.');

  safeGrantStage(player, 'companion_tutorial');
  questLog(player.username + ' caught first Cobblemon, granted companion_tutorial');
};

// --- First Gate ---
QUEST_TRIGGERS['quest_first_gate'] = function(player) {
  sendQuestMessage(player,
    'GATE DISCOVERED',
    'You\'ve entered your first Gate dungeon!'
  );
  playSound(player, 'normal');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.first_discovery);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.first_discovery + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  Gates are instanced dungeons that scale in difficulty.');
  player.tell('\u00a77  Clear floors to increase your \u00a7fGate Rank\u00a77 from E to S.');
  player.tell('\u00a77  Boss floors appear every 10th floor. Good luck!');

  safeGrantStage(player, 'gate_tutorial');
  questLog(player.username + ' entered first gate, granted gate_tutorial');
};

// --- First Village ---
QUEST_TRIGGERS['quest_first_village'] = function(player) {
  sendQuestMessage(player,
    'VILLAGE FOUND',
    'You\'ve discovered a faction settlement!'
  );
  playSound(player, 'normal');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.first_discovery);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.first_discovery + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  Villages are home to \u00a7ftraders\u00a77, \u00a7fquest givers\u00a77, and');
  player.tell('\u00a77  \u00a7ffaction representatives\u00a77. Build reputation to unlock');
  player.tell('\u00a77  better trades and exclusive quests.');

  safeGrantStage(player, 'village_tutorial');

  // Spawn a trading NPC nearby (placeholder — summon a villager near the player)
  player.server.runCommandSilent(
    'summon minecraft:villager ~2 ~ ~2 {CustomName:\'{"text":"Horizon Trader","color":"gold"}\',VillagerData:{profession:merchant,level:3,type:plains}}'
  );
  player.tell('\u00a7e  A \u00a76Horizon Trader\u00a7e has appeared nearby!');

  questLog(player.username + ' found first village, granted village_tutorial + spawned trader');
};

// --- First Farm ---
QUEST_TRIGGERS['quest_first_farm'] = function(player) {
  sendQuestMessage(player,
    'FARMING BEGUN',
    'You\'ve started your first farm!'
  );
  playSound(player, 'normal');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.first_discovery);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.first_discovery + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  Farming is essential for \u00a7fnutrition\u00a77, \u00a7fbrewing\u00a77, and');
  player.tell('\u00a77  \u00a7ftrade goods\u00a77. Grow diverse crops for the best buffs.');

  safeGrantStage(player, 'farming_tutorial');

  // Give starter farming supplies
  giveItem(player, 'minecraft:iron_hoe', 1);
  giveItem(player, 'minecraft:wheat_seeds', 16);
  giveItem(player, 'minecraft:carrot', 8);
  giveItem(player, 'minecraft:potato', 8);
  giveItem(player, 'minecraft:beetroot_seeds', 8);
  player.tell('\u00a7e  Received starter seeds and a hoe!');

  questLog(player.username + ' started farming, granted farming_tutorial + starter items');
};

// --- First Brew ---
QUEST_TRIGGERS['quest_first_brew'] = function(player) {
  sendQuestMessage(player,
    'FIRST BREW',
    'You\'ve crafted your first beverage!'
  );
  playSound(player, 'normal');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.first_discovery);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.first_discovery + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a77  Brewing creates valuable \u00a7fbeverages\u00a77 that satisfy the');
  player.tell('\u00a77  beverages nutrition group. Higher quality ingredients');
  player.tell('\u00a77  yield better results. Experiment with recipes!');

  safeGrantStage(player, 'brewing_tutorial');

  // Give empty bottles to encourage further brewing
  giveItem(player, 'minecraft:glass_bottle', 16);
  player.tell('\u00a7e  Received 16 empty glass bottles!');

  questLog(player.username + ' brewed first item, granted brewing_tutorial + bottles');
};

// --- Gym Badges (1 through 8) ---
// Dynamically create handlers for each gym badge
function createGymHandler(gymNumber) {
  return function(player) {
    var badges = getGymBadgeCount(player);
    var newBadges = Math.max(badges, gymNumber);
    setGymBadgeCount(player, newBadges);

    // Grant the cumulative gym_badges_N stage
    safeGrantStage(player, 'gym_badges_' + newBadges);

    // Update the scoreboard for FTB Quests
    player.server.runCommandSilent('scoreboard objectives add horizons_gym_badges dummy');
    player.server.runCommandSilent(
      'scoreboard players set ' + player.username + ' horizons_gym_badges ' + newBadges
    );

    sendQuestMessage(player,
      'GYM BADGE #' + gymNumber,
      'Gym ' + gymNumber + ' defeated! Badges: ' + newBadges + '/8'
    );
    playSound(player, 'major');
    grantPerkReward(player, QUEST_EVENTS.perkRewards.gym_badge);
    player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.gym_badge + ' Pathfinder XP');

    // Milestone messages
    if (newBadges === 4) {
      player.tell('');
      player.tell('\u00a76  Halfway there! Four badges earned. The remaining');
      player.tell('\u00a76  gym leaders will be much tougher...');
    }
    if (newBadges === 8) {
      player.tell('');
      player.tell('\u00a76\u00a7l  ALL 8 BADGES EARNED!');
      player.tell('\u00a77  The \u00a7dElite Four\u00a77 challenge is now available.');
      safeGrantStage(player, 'gym_badges_all');
    }

    questLog(player.username + ' earned gym badge ' + gymNumber + ' (total: ' + newBadges + ')');
  };
}

// Register handlers for gym_1 through gym_8
for (var g = 1; g <= 8; g++) {
  QUEST_TRIGGERS['quest_gym_' + g + '_complete'] = createGymHandler(g);
}

// --- Elite Four ---
QUEST_TRIGGERS['quest_elite_four'] = function(player) {
  sendQuestMessage(player,
    '\u00a7d\u00a7lCHAMPION!',
    'You have conquered the Elite Four!'
  );
  playSound(player, 'epic');
  grantPerkReward(player, QUEST_EVENTS.perkRewards.elite_four);
  player.tell('\u00a7a  +' + QUEST_EVENTS.perkRewards.elite_four + ' Pathfinder XP');
  player.tell('');
  player.tell('\u00a76  You stand as Champion of the Horizon. Your name will');
  player.tell('\u00a76  echo through the ages. New endgame content awaits.');

  safeGrantStage(player, 'championship');

  // Grant a title stage
  safeGrantStage(player, 'title_champion');

  questLog(player.username + ' defeated the Elite Four, granted championship + title_champion');
};

// ============================================================
// STAGE LISTENER — Fire quest completion events
// ============================================================

PlayerEvents.stageAdded(function(event) {
  var player = event.player;
  var stage = event.stage;

  // Check if this stage has a registered quest trigger
  var handler = QUEST_TRIGGERS[stage];
  if (handler) {
    questLog('Triggering quest event for stage: ' + stage + ' (player: ' + player.username + ')');
    try {
      handler(player);
    } catch (e) {
      console.error('[Horizons/QuestEvents] Error in trigger for ' + stage + ': ' + e);
    }
  }
});

// ============================================================
// COMMAND: /horizons quest trigger <stage> — OP only manual trigger
// ============================================================

ServerEvents.commandRegistry(function(event) {
  var Commands = event.commands;
  var Arguments = event.arguments;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('quest')
        // /horizons quest trigger <stage> — OP only
        .then(Commands.literal('trigger')
          .requires(function(src) { return src.hasPermission(2); })
          .then(Commands.argument('stage', event.getArguments().STRING.create(event))
            .executes(function(ctx) {
              var player = ctx.source.player;
              if (!player) return 0;
              var stage = event.getArguments().STRING.getResult(ctx, 'stage');

              var handler = QUEST_TRIGGERS[stage];
              if (!handler) {
                player.tell('\u00a7c[Horizons] No quest trigger registered for stage: ' + stage);
                player.tell('\u00a77Available triggers:');
                var triggerNames = Object.keys(QUEST_TRIGGERS);
                for (var i = 0; i < triggerNames.length; i++) {
                  player.tell('  \u00a7f' + triggerNames[i]);
                }
                return 0;
              }

              // Grant the stage first (which will fire the stageAdded listener)
              if (!player.stages.has(stage)) {
                player.stages.add(stage);
                player.tell('\u00a7e[Horizons] \u00a77Manually triggered: \u00a7f' + stage);
              } else {
                // Stage already present — fire handler directly
                player.tell('\u00a7e[Horizons] \u00a77Re-triggering: \u00a7f' + stage + ' \u00a77(stage already active)');
                handler(player);
              }

              return 1;
            })
          )
        )
        // /horizons quest list — show all registered triggers
        .then(Commands.literal('list')
          .executes(function(ctx) {
            var player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e=== Registered Quest Triggers ===');
            var triggerNames = Object.keys(QUEST_TRIGGERS);
            for (var i = 0; i < triggerNames.length; i++) {
              var name = triggerNames[i];
              var hasStage = player.stages.has(name);
              var indicator = hasStage ? '\u00a7a\u2713' : '\u00a78\u25cb';
              player.tell('  ' + indicator + ' \u00a7f' + name);
            }
            player.tell('\u00a77Total: ' + triggerNames.length + ' triggers');
            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize gym badge data
// ============================================================

PlayerEvents.loggedIn(function(event) {
  var player = event.player;
  var data = player.persistentData;

  // Initialize gym badge counter if missing
  if (!data.contains('horizons_gym_badges')) {
    data.putInt('horizons_gym_badges', 0);
    questLog('Initialized quest event data for ' + player.username);
  }

  // Sync gym badge scoreboard
  var badges = getGymBadgeCount(player);
  player.server.runCommandSilent('scoreboard objectives add horizons_gym_badges dummy');
  player.server.runCommandSilent(
    'scoreboard players set ' + player.username + ' horizons_gym_badges ' + badges
  );
});

console.log('[Horizons] Quest Completion Events loaded');
console.log('[Horizons] Commands: /horizons quest [trigger|list]');
console.log('[Horizons] Registered ' + Object.keys(QUEST_TRIGGERS).length + ' quest completion triggers');
