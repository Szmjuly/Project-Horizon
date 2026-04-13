// ============================================================
// Project Horizons — Multi-Ascension
// ============================================================
// File: kubejs/server_scripts/ascension/multi_ascension.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Players can ascend up to 3 times, each with increasing difficulty.
// Each additional ascension unlocks a new subtree (max 3 active).
// The Triple Crown achievement is granted for completing all 3.
//
// ASCENSION TIERS:
//   1st: Normal requirements (eligibility.js defaults)
//   2nd: 75+ in primary tree, Gate Floor 50+, 2 factions Allied
//   3rd: 100 in primary tree, Gate Floor 75+, all factions Trusted+
//
// TRACKING:
//   horizons_ascension_count     — Number of completed ascensions (0-3)
//   horizons_ascended_class_1..3 — Class ID per ascension
//   horizons_ascension_time_1..3 — Server tick at completion
//
// STAGES:
//   ascend_count_1, ascend_count_2, ascend_count_3
//   triple_crown  — All 3 ascensions complete
//
// COMMANDS:
//   /horizons ascension count    — Show ascension count
//   /horizons ascension history  — Show all completed ascensions with details
//   /horizons ascension reqs     — Show requirements for next ascension
// ============================================================

// --- Configuration ---
const MULTI_CONFIG = {
  maxAscensions: 3,

  // Factions for reputation checks
  factions: ['plains', 'forest', 'mountain', 'coastal', 'skyborn', 'wanderer'],

  // Perk tree IDs
  perkTrees: ['vanguard', 'artificer', 'cultivator', 'wayfinder'],

  // Requirements per ascension tier (tier 0 = no ascension yet -> first ascension reqs)
  // Tier 1 requirements are in eligibility.js (normal path)
  requirements: {
    // 2nd ascension requirements
    2: {
      primaryTreeMin: 75,
      gateFloorMin: 50,
      alliedFactionsMin: 2,
      description: 'Deeper mastery for the Second Awakening.'
    },
    // 3rd ascension requirements
    3: {
      primaryTreeMin: 100,
      gateFloorMin: 75,
      trustedFactionsMin: 6,  // all factions
      description: 'The Final Ascension demands total mastery.'
    }
  },

  // Class names for display
  classNames: {
    warlord: 'Warlord',
    beastmaster: 'Beastmaster',
    pathwalker: 'Pathwalker',
    architect: 'Architect',
    voyager: 'Voyager',
    shepherd: 'Shepherd',
    avatar_of_war: 'Avatar of War',
    mind_of_the_forge: 'Mind of the Forge',
    verdant_sovereign: 'Verdant Sovereign',
    eternal_walker: 'Eternal Walker',
    shadow_reaver: 'Shadow Reaver',
    wild_hunter: 'Wild Hunter',
    nightcloak: 'Nightcloak',
    smuggler_king: 'Smuggler-King',
    void_pirate: 'Void Pirate',
    wandering_outlaw: 'Wandering Outlaw',
    tyrant: 'Tyrant',
    lockbreaker: 'Lockbreaker',
    witch_of_thorns: 'Witch of Thorns',
    ghost_of_the_roads: 'Ghost of the Roads'
  },

  debug: true
};

// --- Logging ---
function multiLog(message) {
  if (MULTI_CONFIG.debug) {
    console.log('[Horizons/MultiAscend] ' + message);
  }
}

// ============================================================
// ASCENSION COUNT TRACKING
// ============================================================

/**
 * Get the current ascension count for a player.
 */
function getAscensionCount(player) {
  return player.persistentData.getInt('horizons_ascension_count') || 0;
}

/**
 * Get the class ID for a specific ascension number.
 */
function getAscendedClass(player, ascensionNumber) {
  return player.persistentData.getString('horizons_ascended_class_' + ascensionNumber) || '';
}

/**
 * Get the tick timestamp for a specific ascension.
 */
function getAscensionTime(player, ascensionNumber) {
  return player.persistentData.getLong('horizons_ascension_time_' + ascensionNumber) || 0;
}

/**
 * Format a class ID into a display name.
 */
function formatClassName(classId) {
  if (MULTI_CONFIG.classNames[classId]) {
    return MULTI_CONFIG.classNames[classId];
  }
  return classId.split('_').map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

// ============================================================
// MULTI-ASCENSION REQUIREMENT CHECKS
// ============================================================

/**
 * Check if a player meets the requirements for their next ascension.
 * Returns { met: boolean, details: [] } with per-requirement status.
 */
function checkNextAscensionRequirements(player) {
  var data = player.persistentData;
  var currentCount = getAscensionCount(player);
  var nextAscension = currentCount + 1;

  var result = {
    currentCount: currentCount,
    nextAscension: nextAscension,
    canAscend: false,
    maxReached: false,
    details: []
  };

  // Already at max
  if (nextAscension > MULTI_CONFIG.maxAscensions) {
    result.maxReached = true;
    return result;
  }

  // 1st ascension — uses normal eligibility.js requirements
  if (nextAscension === 1) {
    var isEligible = player.stages.has('ascend_eligible');
    result.details.push({
      name: 'Standard Eligibility (6 requirements)',
      met: isEligible,
      info: isEligible ? 'All requirements met' : 'Use /horizons ascension check for details'
    });
    result.canAscend = isEligible;
    return result;
  }

  // 2nd and 3rd ascension — escalated requirements
  var reqs = MULTI_CONFIG.requirements[nextAscension];
  if (!reqs) {
    result.details.push({ name: 'Unknown tier', met: false, info: 'No requirements defined' });
    return result;
  }

  var allMet = true;

  // Req: Primary tree must be at threshold
  var highestTree = 0;
  var highestTreeName = '';
  for (var tree of MULTI_CONFIG.perkTrees) {
    var pts = data.getInt('horizons_tree_' + tree) || 0;
    if (pts > highestTree) {
      highestTree = pts;
      highestTreeName = tree.charAt(0).toUpperCase() + tree.slice(1);
    }
  }
  var treeMet = highestTree >= reqs.primaryTreeMin;
  if (!treeMet) allMet = false;
  result.details.push({
    name: 'Primary Tree ' + reqs.primaryTreeMin + '+',
    met: treeMet,
    info: highestTreeName + ': ' + highestTree + '/' + reqs.primaryTreeMin
  });

  // Req: Gate Floor minimum
  var highestFloor = data.getInt('horizons_gate_highest') || 0;
  var gateMet = highestFloor >= reqs.gateFloorMin;
  if (!gateMet) allMet = false;
  result.details.push({
    name: 'Gate Floor ' + reqs.gateFloorMin + '+',
    met: gateMet,
    info: 'Highest: ' + highestFloor + '/' + reqs.gateFloorMin
  });

  // Req: Faction reputation (Allied for 2nd, Trusted for 3rd)
  if (reqs.alliedFactionsMin) {
    var alliedCount = 0;
    var alliedNames = [];
    for (var faction of MULTI_CONFIG.factions) {
      if (player.stages.has('rep_' + faction + '_allied')) {
        alliedCount++;
        alliedNames.push(faction.charAt(0).toUpperCase() + faction.slice(1));
      }
    }
    var alliedMet = alliedCount >= reqs.alliedFactionsMin;
    if (!alliedMet) allMet = false;
    result.details.push({
      name: reqs.alliedFactionsMin + ' Factions Allied',
      met: alliedMet,
      info: alliedCount + '/' + reqs.alliedFactionsMin + (alliedNames.length > 0 ? ' (' + alliedNames.join(', ') + ')' : '')
    });
  }

  if (reqs.trustedFactionsMin) {
    var trustedCount = 0;
    var trustedNames = [];
    for (var factionT of MULTI_CONFIG.factions) {
      if (player.stages.has('rep_' + factionT + '_trusted') || player.stages.has('rep_' + factionT + '_allied')) {
        trustedCount++;
        trustedNames.push(factionT.charAt(0).toUpperCase() + factionT.slice(1));
      }
    }
    var trustedMet = trustedCount >= reqs.trustedFactionsMin;
    if (!trustedMet) allMet = false;
    result.details.push({
      name: 'All ' + reqs.trustedFactionsMin + ' Factions Trusted+',
      met: trustedMet,
      info: trustedCount + '/' + reqs.trustedFactionsMin + (trustedNames.length > 0 ? ' (' + trustedNames.join(', ') + ')' : '')
    });
  }

  // Must still pass base eligibility
  var baseEligible = player.stages.has('ascend_eligible');
  if (!baseEligible) allMet = false;
  result.details.push({
    name: 'Base Eligibility (6 requirements)',
    met: baseEligible,
    info: baseEligible ? 'All met' : 'Use /horizons ascension check'
  });

  result.canAscend = allMet;
  return result;
}

// ============================================================
// POST-ASCENSION PROCESSING
// ============================================================

/**
 * Called after a trial completes to handle multi-ascension bookkeeping.
 * This is a periodic check that syncs stages with the ascension count.
 */
function syncAscensionStages(player) {
  var count = getAscensionCount(player);
  var data = player.persistentData;

  // Sync ascension count stages
  for (var i = 1; i <= MULTI_CONFIG.maxAscensions; i++) {
    var stage = 'ascend_count_' + i;
    if (count >= i) {
      if (!player.stages.has(stage)) {
        player.stages.add(stage);
        multiLog(player.username + ' earned stage: ' + stage);
      }
    }
  }

  // Triple Crown check
  if (count >= MULTI_CONFIG.maxAscensions) {
    if (!player.stages.has('triple_crown')) {
      player.stages.add('triple_crown');
      player.persistentData.putBoolean('horizons_triple_crown', true);

      player.tell('\u00a76\u00a7l==============================');
      player.tell('\u00a76\u00a7l  TRIPLE CROWN ACHIEVED!');
      player.tell('\u00a7e  You have completed all three Ascensions.');
      player.tell('\u00a7e  You are a true master of Project Horizons.');
      player.tell('\u00a77  Title unlocked: \u00a76The Ascended');
      player.tell('\u00a76\u00a7l==============================');

      // Grant title stage
      if (!player.stages.has('title_the_ascended')) {
        player.stages.add('title_the_ascended');
      }

      // Celebration effects
      player.server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:glowing 120 0 true'
      );
      player.server.runCommandSilent(
        'playsound minecraft:ui.toast.challenge_complete master ' + player.username + ' ~ ~ ~ 1 0.8'
      );

      // Announce to server
      player.server.runCommandSilent(
        'tellraw @a [{"text":"[Horizons] ","color":"gold","bold":true},{"text":"' +
        player.username + '","color":"yellow"},{"text":" has achieved the ","color":"gray"},' +
        '{"text":"Triple Crown","color":"gold","bold":true},{"text":"!","color":"gray"}]'
      );

      multiLog(player.username + ' achieved TRIPLE CROWN');
    }
  }

  // After an ascension completes, re-enable eligibility checking
  // for the next ascension (clear the eligible stage so it must be re-earned)
  if (count > 0 && count < MULTI_CONFIG.maxAscensions) {
    // The player needs to re-qualify for the next tier
    if (player.stages.has('ascend_eligible') && !data.getBoolean('horizons_recheck_scheduled')) {
      // Don't immediately remove — let them see completion first
      data.putBoolean('horizons_recheck_scheduled', true);
    }
  }
}

// ============================================================
// PERIODIC SYNC — Update stages and check Triple Crown
// ============================================================

ServerEvents.tick(event => {
  var server = event.server;

  // Check every 200 ticks (10 seconds)
  if (server.tickCount % 200 !== 0) return;

  for (var player of server.players) {
    if (player.isCreative() || player.isSpectator()) continue;

    var count = getAscensionCount(player);
    if (count > 0) {
      syncAscensionStages(player);
    }

    // Handle re-eligibility scheduling
    var data = player.persistentData;
    if (data.getBoolean('horizons_recheck_scheduled')) {
      // Give 200 ticks after ascension for celebration, then require re-qualification
      data.putBoolean('horizons_recheck_scheduled', false);

      // Remove eligible stage — they need to meet the next tier's requirements
      if (player.stages.has('ascend_eligible') && count < MULTI_CONFIG.maxAscensions) {
        // Keep eligible if they already meet next tier requirements
        var nextReqs = checkNextAscensionRequirements(player);
        if (!nextReqs.canAscend) {
          player.stages.remove('ascend_eligible');
          multiLog(player.username + ' eligibility reset for ascension ' + (count + 1));
        }
      }
    }
  }
});

// ============================================================
// DISPLAY FUNCTIONS
// ============================================================

/**
 * Display ascension count and summary.
 */
function displayAscensionCount(player) {
  var count = getAscensionCount(player);

  player.tell('\u00a76\u00a7l=== Ascension Progress ===');
  player.tell('\u00a77Ascensions Completed: \u00a7f' + count + '/' + MULTI_CONFIG.maxAscensions);

  // Visual ascension bar
  var bar = '\u00a78[';
  for (var i = 1; i <= MULTI_CONFIG.maxAscensions; i++) {
    if (i <= count) {
      bar += '\u00a76\u2605';  // Filled star
    } else {
      bar += '\u00a78\u2606';  // Empty star
    }
    if (i < MULTI_CONFIG.maxAscensions) bar += ' ';
  }
  bar += '\u00a78]';
  player.tell('  ' + bar);

  // Show class for each ascension
  for (var a = 1; a <= count; a++) {
    var classId = getAscendedClass(player, a);
    var className = classId.length > 0 ? formatClassName(classId) : 'Unknown';
    player.tell('\u00a77  Ascension ' + a + ': \u00a7f' + className);
  }

  // Next ascension info
  if (count < MULTI_CONFIG.maxAscensions) {
    var nextReqs = checkNextAscensionRequirements(player);
    var statusColor = nextReqs.canAscend ? '\u00a7a' : '\u00a7e';
    player.tell('');
    player.tell('\u00a77Next Ascension: ' + statusColor + '#' + nextReqs.nextAscension);
    if (nextReqs.canAscend) {
      player.tell('\u00a7a  Requirements met! Begin a trial.');
    } else {
      player.tell('\u00a77  Use \u00a7f/horizons ascension reqs \u00a77for details.');
    }
  } else {
    player.tell('');
    if (player.stages.has('triple_crown')) {
      player.tell('\u00a76\u00a7l  TRIPLE CROWN \u00a76\u2605 \u2605 \u2605');
    } else {
      player.tell('\u00a7e  Maximum ascensions reached!');
    }
  }
}

/**
 * Display full ascension history with timestamps.
 */
function displayAscensionHistory(player) {
  var count = getAscensionCount(player);

  player.tell('\u00a76\u00a7l=== Ascension History ===');

  if (count === 0) {
    player.tell('\u00a78  No ascensions completed yet.');
    player.tell('\u00a77  Begin your journey with \u00a7f/horizons ascension check');
    return;
  }

  for (var i = 1; i <= count; i++) {
    var classId = getAscendedClass(player, i);
    var className = formatClassName(classId);
    var completionTick = getAscensionTime(player, i);

    // Calculate approximate real-world time from ticks
    var ticksAgo = player.server.tickCount - completionTick;
    var secondsAgo = Math.floor(ticksAgo / 20);
    var timeAgoStr = formatTimeAgo(secondsAgo);

    var tierLabel = i === 1 ? '\u00a7eFirst Awakening' : (i === 2 ? '\u00a76Second Awakening' : '\u00a7c\u00a7lFinal Ascension');

    player.tell('');
    player.tell('\u00a76--- Ascension #' + i + ' ---');
    player.tell('\u00a77  Tier: ' + tierLabel);
    player.tell('\u00a77  Class: \u00a7f' + className);
    player.tell('\u00a77  Completed: \u00a7f' + timeAgoStr + ' ago');

    // Show subtree progress
    var subtreeKey = 'horizons_subtree_points_' + classId;
    var subtreePoints = player.persistentData.getInt(subtreeKey) || 0;
    player.tell('\u00a77  Subtree: \u00a7f' + subtreePoints + '/50 points invested');
  }

  // Show active subtrees count
  player.tell('');
  player.tell('\u00a77Active Subtrees: \u00a7f' + count + '/' + MULTI_CONFIG.maxAscensions);

  if (player.stages.has('triple_crown')) {
    player.tell('');
    player.tell('\u00a76\u00a7l  \u2605 TRIPLE CROWN HOLDER \u2605');
    player.tell('\u00a77  Title: \u00a76The Ascended');
  }
}

/**
 * Display requirements for the next ascension.
 */
function displayNextRequirements(player) {
  var result = checkNextAscensionRequirements(player);

  if (result.maxReached) {
    player.tell('\u00a76[Horizons] You have completed all ' + MULTI_CONFIG.maxAscensions + ' ascensions!');
    return;
  }

  var tierLabel = result.nextAscension === 1 ? 'First Awakening' :
    (result.nextAscension === 2 ? 'Second Awakening' : 'Final Ascension');

  player.tell('\u00a76\u00a7l=== Requirements: ' + tierLabel + ' ===');
  player.tell('\u00a77Ascension #' + result.nextAscension + ' of ' + MULTI_CONFIG.maxAscensions);

  if (result.nextAscension >= 2) {
    var reqs = MULTI_CONFIG.requirements[result.nextAscension];
    if (reqs) {
      player.tell('\u00a78' + reqs.description);
    }
  }

  player.tell('');

  var check = '\u00a7a\u2713';
  var cross = '\u00a7c\u2717';

  for (var detail of result.details) {
    var indicator = detail.met ? check : cross;
    player.tell(indicator + ' \u00a77' + detail.name);
    player.tell('  \u00a78' + detail.info);
  }

  player.tell('');
  if (result.canAscend) {
    player.tell('\u00a7a\u00a7lAll requirements met! \u00a77Begin a trial with /horizons trial start <name>');
  } else {
    var metCount = result.details.filter(function(d) { return d.met; }).length;
    player.tell('\u00a77Progress: \u00a7f' + metCount + '/' + result.details.length + ' requirements met.');
  }
}

/**
 * Format seconds into a human-readable "X hours, Y minutes" string.
 */
function formatTimeAgo(seconds) {
  if (seconds < 60) return seconds + ' seconds';
  if (seconds < 3600) {
    var mins = Math.floor(seconds / 60);
    return mins + ' minute' + (mins > 1 ? 's' : '');
  }
  if (seconds < 86400) {
    var hours = Math.floor(seconds / 3600);
    var remainMins = Math.floor((seconds % 3600) / 60);
    return hours + ' hour' + (hours > 1 ? 's' : '') +
      (remainMins > 0 ? ', ' + remainMins + ' min' : '');
  }
  var days = Math.floor(seconds / 86400);
  var remainHours = Math.floor((seconds % 86400) / 3600);
  return days + ' day' + (days > 1 ? 's' : '') +
    (remainHours > 0 ? ', ' + remainHours + ' hr' : '');
}

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  var Commands = event.commands;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('ascension')
        // /horizons ascension count
        .then(Commands.literal('count')
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            displayAscensionCount(player);
            return 1;
          })
        )
        // /horizons ascension history
        .then(Commands.literal('history')
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            displayAscensionHistory(player);
            return 1;
          })
        )
        // /horizons ascension reqs
        .then(Commands.literal('reqs')
          .executes(ctx => {
            var player = ctx.source.player;
            if (!player) return 0;

            displayNextRequirements(player);
            return 1;
          })
        )
        // /horizons ascension set_count <n> (OP only — for testing)
        .then(Commands.literal('set_count')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('count', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              var player = ctx.source.player;
              if (!player) return 0;

              var newCount = event.getArguments().INTEGER.getResult(ctx, 'count');
              if (newCount < 0 || newCount > MULTI_CONFIG.maxAscensions) {
                player.tell('\u00a7c[Horizons] Count must be 0-' + MULTI_CONFIG.maxAscensions);
                return 0;
              }

              player.persistentData.putInt('horizons_ascension_count', newCount);
              syncAscensionStages(player);
              player.tell('\u00a7a[Horizons] Ascension count set to ' + newCount + ' (admin).');
              multiLog('Admin set ascension count to ' + newCount + ' for ' + player.username);
              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Sync stages on login
// ============================================================

PlayerEvents.loggedIn(event => {
  var player = event.player;
  var count = getAscensionCount(player);

  if (count > 0) {
    syncAscensionStages(player);

    // Delayed notification
    player.server.scheduleInTicks(60, function() {
      player.tell('\u00a76[Horizons] \u00a77Ascension progress: \u00a7f' + count + '/' + MULTI_CONFIG.maxAscensions);
      if (count >= MULTI_CONFIG.maxAscensions && player.stages.has('triple_crown')) {
        player.tell('\u00a76  \u2605 Triple Crown Holder \u2605');
      }
    });
  }
});

console.log('[Horizons] Multi-Ascension loaded');
console.log('[Horizons] Commands: /horizons ascension [count|history|reqs|set_count]');
console.log('[Horizons] Max ascensions: ' + MULTI_CONFIG.maxAscensions);
