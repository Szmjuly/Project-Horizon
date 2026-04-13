// ============================================================
// Project Horizons — Ascension Eligibility
// ============================================================
// File: kubejs/server_scripts/ascension/eligibility.js
// Phase: 4
// Dependencies: KubeJS, AStages
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Checks 6 requirements for the Ascension "Second Awakening" system.
// Players must meet ALL 6 to earn the ascend_eligible stage and
// proceed to trial selection. Requirements span story progress,
// perk investment, side content, gate depth, faction standing,
// and moral alignment (clean or outlaw).
//
// REQUIREMENTS:
//   1. Reached Act 4           (stage: act_4_started)
//   2. Perk tree depth         (50+ in one tree OR two trees at 25+)
//   3. Side chain capstone     (any stage matching sidechain_*_complete)
//   4. Gate Floor 30+          (persistentData horizons_highest_floor >= 30)
//   5. Faction Trusted+        (any stage matching rep_*_trusted)
//   6. Moral alignment         (Crime Stat 0 OR Crime Stat 4+)
//
// COMMANDS:
//   /horizons ascension check  — Show all 6 requirements with status
// ============================================================

// --- Configuration ---
const ELIGIBILITY_CONFIG = {
  // Perk tree keys stored in persistentData
  perkTrees: ['vanguard', 'artificer', 'cultivator', 'wayfinder'],

  // Perk tree persistentData prefix (points invested per tree)
  perkTreePrefix: 'horizons_tree_',

  // Single tree threshold
  singleTreeThreshold: 50,

  // Dual tree threshold
  dualTreeThreshold: 25,

  // Gate floor requirement
  gateFloorRequired: 30,

  // Factions that can satisfy the reputation requirement
  factions: ['plains', 'forest', 'mountain', 'coastal', 'skyborn', 'wanderer'],

  // Crime stat NBT key
  crimeStatKey: 'horizons_crime_stat',

  // Outlaw crime stat threshold
  outlawThreshold: 4,

  // Stage granted on full eligibility
  eligibleStage: 'ascend_eligible',

  // Tracking keys in persistentData
  trackingPrefix: 'ascend_req_',

  debug: true
};

// --- Logging ---
function eligLog(message) {
  if (ELIGIBILITY_CONFIG.debug) {
    console.log('[Horizons/Eligibility] ' + message);
  }
}

// ============================================================
// REQUIREMENT CHECKS
// ============================================================

/**
 * Req 1: Reached Act 4 (stage act_4_started).
 */
function checkActProgress(player) {
  return player.stages.has('act_4_started');
}

/**
 * Req 2: Perk tree depth — 50+ in one tree OR two trees at 25+.
 * Reads horizons_tree_<class> from persistentData.
 */
function checkPerkTreeDepth(player) {
  const data = player.persistentData;
  const trees = ELIGIBILITY_CONFIG.perkTrees;
  let hasSingle50 = false;
  let countOver25 = 0;

  for (const tree of trees) {
    const points = data.getInt(ELIGIBILITY_CONFIG.perkTreePrefix + tree) || 0;
    if (points >= ELIGIBILITY_CONFIG.singleTreeThreshold) {
      hasSingle50 = true;
    }
    if (points >= ELIGIBILITY_CONFIG.dualTreeThreshold) {
      countOver25++;
    }
  }

  return hasSingle50 || countOver25 >= 2;
}

/**
 * Get perk tree summary for display.
 */
function getPerkTreeSummary(player) {
  const data = player.persistentData;
  const trees = ELIGIBILITY_CONFIG.perkTrees;
  const results = [];

  for (const tree of trees) {
    const points = data.getInt(ELIGIBILITY_CONFIG.perkTreePrefix + tree) || 0;
    const name = tree.charAt(0).toUpperCase() + tree.slice(1);
    results.push({ name: name, points: points });
  }

  return results;
}

/**
 * Req 3: Completed a side chain capstone quest.
 * Checks for any stage matching sidechain_*_complete pattern.
 */
function checkSideChainCapstone(player) {
  // Known side chain capstone stages to check
  const sidechainIds = [
    'sidechain_merchant_complete',
    'sidechain_scholar_complete',
    'sidechain_warrior_complete',
    'sidechain_explorer_complete',
    'sidechain_artisan_complete',
    'sidechain_hunter_complete',
    'sidechain_diplomat_complete',
    'sidechain_outlaw_complete'
  ];

  for (const stage of sidechainIds) {
    if (player.stages.has(stage)) {
      return true;
    }
  }

  return false;
}

/**
 * Get which side chains are complete for display.
 */
function getCompletedSideChains(player) {
  const sidechainIds = [
    'sidechain_merchant_complete',
    'sidechain_scholar_complete',
    'sidechain_warrior_complete',
    'sidechain_explorer_complete',
    'sidechain_artisan_complete',
    'sidechain_hunter_complete',
    'sidechain_diplomat_complete',
    'sidechain_outlaw_complete'
  ];

  const completed = [];
  for (const stage of sidechainIds) {
    if (player.stages.has(stage)) {
      const name = stage.replace('sidechain_', '').replace('_complete', '');
      completed.push(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }

  return completed;
}

/**
 * Req 4: Reached Gate Floor 30+.
 */
function checkGateFloor(player) {
  const highest = player.persistentData.getInt('horizons_gate_highest') || 0;
  return highest >= ELIGIBILITY_CONFIG.gateFloorRequired;
}

/**
 * Req 5: Faction reputation Trusted or higher with any faction.
 */
function checkFactionReputation(player) {
  for (const faction of ELIGIBILITY_CONFIG.factions) {
    if (player.stages.has('rep_' + faction + '_trusted') ||
        player.stages.has('rep_' + faction + '_allied')) {
      return true;
    }
  }
  return false;
}

/**
 * Get which factions are Trusted+ for display.
 */
function getTrustedFactions(player) {
  const trusted = [];
  for (const faction of ELIGIBILITY_CONFIG.factions) {
    const name = faction.charAt(0).toUpperCase() + faction.slice(1);
    if (player.stages.has('rep_' + faction + '_allied')) {
      trusted.push(name + ' (\u00a76Allied\u00a7f)');
    } else if (player.stages.has('rep_' + faction + '_trusted')) {
      trusted.push(name + ' (\u00a7aTrusted\u00a7f)');
    }
  }
  return trusted;
}

/**
 * Req 6: Crime Stat 0 (clean) or Crime Stat 4+ (outlaw).
 */
function checkMoralAlignment(player) {
  const crimeStat = player.persistentData.getInt(ELIGIBILITY_CONFIG.crimeStatKey) || 0;
  return crimeStat === 0 || crimeStat >= ELIGIBILITY_CONFIG.outlawThreshold;
}

/**
 * Get moral alignment label for display.
 */
function getMoralAlignmentLabel(player) {
  const crimeStat = player.persistentData.getInt(ELIGIBILITY_CONFIG.crimeStatKey) || 0;
  if (crimeStat === 0) {
    return '\u00a7aClean Path \u00a77(Crime Stat 0)';
  } else if (crimeStat >= ELIGIBILITY_CONFIG.outlawThreshold) {
    return '\u00a74Outlaw Path \u00a77(Crime Stat ' + crimeStat + ')';
  } else {
    return '\u00a7cIneligible \u00a77(Crime Stat ' + crimeStat + ' \u2014 need 0 or 4+)';
  }
}

// ============================================================
// FULL ELIGIBILITY EVALUATION
// ============================================================

/**
 * Run all 6 checks and return structured results.
 * Also updates persistentData tracking and grants the stage if all pass.
 */
function evaluateEligibility(player) {
  const data = player.persistentData;

  const results = {
    actProgress: checkActProgress(player),
    perkDepth: checkPerkTreeDepth(player),
    sideChain: checkSideChainCapstone(player),
    gateFloor: checkGateFloor(player),
    factionRep: checkFactionReputation(player),
    moralAlign: checkMoralAlignment(player)
  };

  // Track individual requirements in persistentData
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'act', results.actProgress);
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'perk', results.perkDepth);
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'side', results.sideChain);
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'gate', results.gateFloor);
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'rep', results.factionRep);
  data.putBoolean(ELIGIBILITY_CONFIG.trackingPrefix + 'moral', results.moralAlign);

  // Count how many are met
  const metCount = Object.values(results).filter(v => v).length;
  data.putInt('ascend_requirements_met', metCount);

  results.allMet = metCount === 6;

  // Grant or revoke the eligible stage
  if (results.allMet) {
    if (!player.stages.has(ELIGIBILITY_CONFIG.eligibleStage)) {
      player.stages.add(ELIGIBILITY_CONFIG.eligibleStage);
      player.tell('\u00a76\u00a7l[Horizons] \u00a7eYou have met ALL ascension requirements!');
      player.tell('\u00a77The Second Awakening awaits. Choose your trial with \u00a7f/horizons trial start <name>');
      eligLog(player.username + ' became eligible for ascension');
    }
  } else {
    if (player.stages.has(ELIGIBILITY_CONFIG.eligibleStage)) {
      player.stages.remove(ELIGIBILITY_CONFIG.eligibleStage);
      eligLog(player.username + ' lost ascension eligibility');
    }
  }

  return results;
}

// ============================================================
// DISPLAY — Formatted eligibility report
// ============================================================

/**
 * Display the full eligibility report to a player.
 */
function displayEligibilityReport(player) {
  const results = evaluateEligibility(player);
  const data = player.persistentData;

  const check = '\u00a7a\u2713';
  const cross = '\u00a7c\u2717';
  const metCount = Object.values(results).filter(function(v) { return v === true; }).length;

  player.tell('\u00a76\u00a7l=== Ascension Eligibility ===');
  player.tell('\u00a77Requirements met: \u00a7f' + metCount + '/6');
  player.tell('');

  // Req 1: Act Progress
  const r1 = results.actProgress ? check : cross;
  player.tell(r1 + ' \u00a77Act 4 Reached');
  if (!results.actProgress) {
    player.tell('  \u00a78Progress through the main story to reach Act 4.');
  }

  // Req 2: Perk Tree Depth
  const r2 = results.perkDepth ? check : cross;
  player.tell(r2 + ' \u00a77Perk Tree Depth (50 in one OR 25 in two)');
  const treeSummary = getPerkTreeSummary(player);
  for (const tree of treeSummary) {
    const color = tree.points >= 50 ? '\u00a7a' : (tree.points >= 25 ? '\u00a7e' : '\u00a77');
    player.tell('  \u00a78' + tree.name + ': ' + color + tree.points + ' pts');
  }

  // Req 3: Side Chain Capstone
  const r3 = results.sideChain ? check : cross;
  player.tell(r3 + ' \u00a77Side Chain Capstone Complete');
  const completedChains = getCompletedSideChains(player);
  if (completedChains.length > 0) {
    player.tell('  \u00a78Completed: \u00a7f' + completedChains.join(', '));
  } else {
    player.tell('  \u00a78Complete any side chain questline to its capstone.');
  }

  // Req 4: Gate Floor
  const r4 = results.gateFloor ? check : cross;
  const highestFloor = data.getInt('horizons_gate_highest') || 0;
  player.tell(r4 + ' \u00a77Gate Floor 30+ Reached');
  player.tell('  \u00a78Highest floor: \u00a7f' + highestFloor + '/30');

  // Req 5: Faction Reputation
  const r5 = results.factionRep ? check : cross;
  player.tell(r5 + ' \u00a77Faction Reputation Trusted+');
  const trustedFactions = getTrustedFactions(player);
  if (trustedFactions.length > 0) {
    player.tell('  \u00a78Trusted with: \u00a7f' + trustedFactions.join(', '));
  } else {
    player.tell('  \u00a78Reach Trusted (500+ rep) with any faction.');
  }

  // Req 6: Moral Alignment
  const r6 = results.moralAlign ? check : cross;
  player.tell(r6 + ' \u00a77Moral Alignment (Clean or Outlaw)');
  player.tell('  \u00a78Path: ' + getMoralAlignmentLabel(player));

  // Summary
  player.tell('');
  if (results.allMet) {
    player.tell('\u00a76\u00a7l>> ALL REQUIREMENTS MET <<');
    player.tell('\u00a7eYou may begin your Ascension trial.');
    player.tell('\u00a77Use \u00a7f/horizons trial start <trial_name> \u00a77to begin.');
  } else {
    const remaining = 6 - metCount;
    player.tell('\u00a77' + remaining + ' requirement' + (remaining > 1 ? 's' : '') + ' remaining before Ascension.');
  }
}

// ============================================================
// PERIODIC ELIGIBILITY CHECK — Every 600 ticks
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;

  // Check eligibility every 600 ticks (30 seconds)
  if (server.tickCount % 600 !== 0) return;

  for (const player of server.players) {
    if (player.isCreative() || player.isSpectator()) continue;

    // Only check players who have reached Act 4 (basic filter)
    if (!player.stages.has('act_4_started')) continue;

    // Skip players who are already in a trial or have ascended
    if (player.persistentData.getBoolean('horizons_in_trial')) continue;

    const wasEligible = player.stages.has(ELIGIBILITY_CONFIG.eligibleStage);
    evaluateEligibility(player);
    const isEligible = player.stages.has(ELIGIBILITY_CONFIG.eligibleStage);

    // Notify on transition to eligible (only once)
    if (!wasEligible && isEligible) {
      player.tell('\u00a76\u00a7l[Horizons] \u00a7eThe path to Ascension has opened!');
      player.tell('\u00a77Use \u00a7f/horizons ascension check \u00a77for details.');
    }
  }
});

// ============================================================
// COMMAND — /horizons ascension check
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('ascension')
        .then(Commands.literal('check')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            displayEligibilityReport(player);
            return 1;
          })
        )
        // OP command: force-grant eligibility for testing
        .then(Commands.literal('force_eligible')
          .requires(src => src.hasPermission(2))
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            player.stages.add(ELIGIBILITY_CONFIG.eligibleStage);
            player.persistentData.putInt('ascend_requirements_met', 6);
            player.tell('\u00a7a[Horizons] Ascension eligibility force-granted (admin).');
            eligLog('Admin force-granted eligibility to ' + player.username);
            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Run eligibility check on login
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;

  // Only check for Act 4+ players
  if (!player.stages.has('act_4_started')) return;

  // Delayed check to let other systems initialize
  player.server.scheduleInTicks(40, () => {
    evaluateEligibility(player);

    if (player.stages.has(ELIGIBILITY_CONFIG.eligibleStage)) {
      player.tell('\u00a76[Horizons] \u00a77Ascension status: \u00a7aEligible');
    } else {
      const metCount = player.persistentData.getInt('ascend_requirements_met') || 0;
      player.tell('\u00a76[Horizons] \u00a77Ascension status: \u00a7e' + metCount + '/6 requirements met');
    }
  });
});

console.log('[Horizons] Ascension Eligibility loaded');
console.log('[Horizons] Commands: /horizons ascension [check|force_eligible]');
console.log('[Horizons] Requirements: Act 4, Perk 50/25+25, Side Chain, Gate 30, Faction Trusted, Moral Alignment');
