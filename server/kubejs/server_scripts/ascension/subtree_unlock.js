// ============================================================
// Project Horizons — Subtree Unlock
// ============================================================
// File: kubejs/server_scripts/ascension/subtree_unlock.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// When a player completes an Ascension trial, a 50-point subtree
// is unlocked for their chosen class. The subtree extends the base
// perk tree with class-specific abilities gated by tier stages.
// First ascension also grants 10 bonus perk points.
//
// SUBTREE STRUCTURE (per class):
//   Tier 1 (10 pts): Basic passive
//   Tier 2 (20 pts): Enhanced passive
//   Tier 3 (30 pts): Active ability modifier
//   Tier 4 (40 pts): Major passive
//   Tier 5 (50 pts): Capstone — ultimate ability
//
// STAGES:
//   ascend_subtree_<class>_unlocked   — Subtree available
//   subtree_<class>_tier1..tier5      — Tier progression
//
// COMMANDS:
//   /horizons subtree status                  — Show subtree progress
//   /horizons subtree invest <class> <points> — Spend perk points
//   /horizons subtree reset <class>           — OP: reset subtree
// ============================================================

// --- Subtree Definitions ---
const SUBTREES = {
  // Hybrid classes
  warlord: {
    name: 'Warlord',
    color: '\u00a7c',
    baseTree: 'vanguard+artificer',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Forged Resolve', desc: '+10% armor from crafted gear' },
      tier2: { points: 20, name: 'War Machine', desc: 'Melee attacks have 15% splash' },
      tier3: { points: 30, name: 'Siege Engine', desc: 'Battle Cry gains Haste II' },
      tier4: { points: 40, name: 'Iron Will', desc: '+25% knockback resistance' },
      tier5: { points: 50, name: 'Unstoppable Force', desc: 'Immune to Slowness, permanent +5% damage' }
    }
  },
  beastmaster: {
    name: 'Beastmaster',
    color: '\u00a7a',
    baseTree: 'vanguard+cultivator',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Beast Bond', desc: '+20% companion trust gain' },
      tier2: { points: 20, name: 'Pack Tactics', desc: 'Companions deal +15% near you' },
      tier3: { points: 30, name: 'Alpha Call', desc: 'Pack Call summons +2 wolves' },
      tier4: { points: 40, name: 'Wild Heart', desc: 'Regen I when near companions' },
      tier5: { points: 50, name: 'Primal Bond', desc: 'Companions gain your potion effects' }
    }
  },
  pathwalker: {
    name: 'Pathwalker',
    color: '\u00a7b',
    baseTree: 'vanguard+wayfinder',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Sure Step', desc: '+15% movement speed on paths' },
      tier2: { points: 20, name: 'Trail Sense', desc: 'Highlight nearby hostile mobs' },
      tier3: { points: 30, name: 'Way of Shadows', desc: 'Invisibility 5s on dodge roll' },
      tier4: { points: 40, name: 'Pathfinder\'s Eye', desc: 'See through walls (10 blocks)' },
      tier5: { points: 50, name: 'Leyline Walker', desc: 'Teleport to last death point once per day' }
    }
  },
  architect: {
    name: 'Architect',
    color: '\u00a7e',
    baseTree: 'artificer+cultivator',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Foundation', desc: '+20% block placement speed' },
      tier2: { points: 20, name: 'Efficient Design', desc: '10% chance to not consume blocks' },
      tier3: { points: 30, name: 'Schematic Memory', desc: 'Blueprint Vision lasts +10s' },
      tier4: { points: 40, name: 'Living Walls', desc: 'Placed blocks slowly regenerate' },
      tier5: { points: 50, name: 'Master Builder', desc: 'Place blocks in 3x3 area' }
    }
  },
  voyager: {
    name: 'Voyager',
    color: '\u00a7d',
    baseTree: 'artificer+wayfinder',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Wanderlust', desc: '+15% XP from exploration' },
      tier2: { points: 20, name: 'Compass Rose', desc: 'Auto-map nearby structures' },
      tier3: { points: 30, name: 'Cartographer', desc: 'Discovery rewards doubled' },
      tier4: { points: 40, name: 'Void Anchor', desc: 'Recall to last campfire once per day' },
      tier5: { points: 50, name: 'World Strider', desc: 'Ignore terrain speed penalties' }
    }
  },
  shepherd: {
    name: 'Shepherd',
    color: '\u00a76',
    baseTree: 'cultivator+wayfinder',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Green Thumb', desc: '+20% crop yield' },
      tier2: { points: 20, name: 'Bountiful Harvest', desc: 'Chance for double harvest' },
      tier3: { points: 30, name: 'Caravan Master', desc: '+30% trade route profits' },
      tier4: { points: 40, name: 'Fertile Ground', desc: 'Passive growth aura (3 blocks)' },
      tier5: { points: 50, name: 'Verdant Trail', desc: 'Flowers grow where you walk' }
    }
  },
  // Transcendent classes
  avatar_of_war: {
    name: 'Avatar of War',
    color: '\u00a74',
    baseTree: 'vanguard (mastery)',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Undying Rage', desc: 'Regen II when below 30% HP' },
      tier2: { points: 20, name: 'Bloodlust', desc: 'Kills heal 2 hearts' },
      tier3: { points: 30, name: 'Titan Grip', desc: 'Dual-wield two-handed weapons' },
      tier4: { points: 40, name: 'War Aura', desc: 'Nearby allies gain Strength I' },
      tier5: { points: 50, name: 'Aspect of Mars', desc: 'Temporary invulnerability on killing spree' }
    }
  },
  mind_of_the_forge: {
    name: 'Mind of the Forge',
    color: '\u00a75',
    baseTree: 'artificer (mastery)',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Auto-Repair', desc: 'Tools slowly repair over time' },
      tier2: { points: 20, name: 'Overclock', desc: '+25% tool efficiency' },
      tier3: { points: 30, name: 'Transmutation', desc: 'Convert materials at 2:1 ratio' },
      tier4: { points: 40, name: 'Living Metal', desc: 'Armor adapts to damage type' },
      tier5: { points: 50, name: 'Forge God', desc: 'Crafting has 10% chance for +1 tier' }
    }
  },
  verdant_sovereign: {
    name: 'Verdant Sovereign',
    color: '\u00a72',
    baseTree: 'cultivator (mastery)',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Root Network', desc: 'Sense all nearby plants' },
      tier2: { points: 20, name: 'Overgrowth', desc: 'Crops grow 50% faster near you' },
      tier3: { points: 30, name: 'Thorn Armor', desc: 'Attackers take 3 hearts thorns' },
      tier4: { points: 40, name: 'Photosynthesis', desc: 'Regen in sunlight, no hunger loss' },
      tier5: { points: 50, name: 'World Tree', desc: 'Place a permanent growth beacon' }
    }
  },
  eternal_walker: {
    name: 'Eternal Walker',
    color: '\u00a79',
    baseTree: 'wayfinder (mastery)',
    maxPoints: 50,
    tiers: {
      tier1: { points: 10, name: 'Featherfall', desc: 'No fall damage, slow falling' },
      tier2: { points: 20, name: 'Phase Step', desc: 'Short-range blink (8 blocks)' },
      tier3: { points: 30, name: 'Dimensional Anchor', desc: 'Set a recall point in any dimension' },
      tier4: { points: 40, name: 'Void Walk', desc: 'Walk on air for 5 seconds' },
      tier5: { points: 50, name: 'Beyond the Map', desc: 'Teleport to any discovered location' }
    }
  }
};

const SUBTREE_IDS = Object.keys(SUBTREES);

// --- Perk point integration keys ---
const PERK_KEYS = {
  totalEarned: 'horizons_perk_points',
  totalSpent: 'horizons_perk_points_spent',
  subtreePrefix: 'horizons_subtree_points_',
  bonusGranted: 'horizons_ascend_bonus_granted'
};

// --- Logging ---
function subtreeLog(message) {
  console.log('[Horizons/Subtree] ' + message);
}

// ============================================================
// SUBTREE UNLOCK — Called when trial is completed
// ============================================================

/**
 * Unlock a subtree for the given class. Called after trial completion.
 * Also grants 10 bonus perk points on first ascension.
 */
function unlockSubtree(player, classId) {
  const subtree = SUBTREES[classId];
  if (!subtree) {
    player.tell('\u00a7c[Horizons] Unknown class for subtree: ' + classId);
    return false;
  }

  const unlockStage = 'ascend_subtree_' + classId + '_unlocked';
  if (player.stages.has(unlockStage)) {
    player.tell('\u00a7e[Horizons] Subtree for ' + subtree.name + ' is already unlocked.');
    return false;
  }

  // Grant the unlock stage
  player.stages.add(unlockStage);

  const data = player.persistentData;

  // Initialize subtree point tracking
  data.putInt(PERK_KEYS.subtreePrefix + classId, 0);

  // Grant 10 bonus perk points on first ascension only
  if (!data.getBoolean(PERK_KEYS.bonusGranted)) {
    data.putBoolean(PERK_KEYS.bonusGranted, true);
    const currentPoints = data.getInt(PERK_KEYS.totalEarned) || 0;
    data.putInt(PERK_KEYS.totalEarned, currentPoints + 10);
    player.tell('\u00a7a[Horizons] +10 Bonus Perk Points for your first Ascension!');
  }

  player.tell('\u00a76\u00a7l[Horizons] Subtree Unlocked: ' + subtree.color + subtree.name);
  player.tell('\u00a77Invest perk points with \u00a7f/horizons subtree invest ' + classId + ' <points>');

  subtreeLog(player.username + ' unlocked subtree: ' + classId);
  return true;
}

// ============================================================
// POINT INVESTMENT
// ============================================================

/**
 * Invest perk points into a subtree.
 */
function investPoints(player, classId, points) {
  const subtree = SUBTREES[classId];
  if (!subtree) {
    player.tell('\u00a7c[Horizons] Unknown class: ' + classId);
    return false;
  }

  // Check if subtree is unlocked
  if (!player.stages.has('ascend_subtree_' + classId + '_unlocked')) {
    player.tell('\u00a7c[Horizons] Subtree for ' + subtree.name + ' is not unlocked.');
    return false;
  }

  if (points <= 0) {
    player.tell('\u00a7c[Horizons] Must invest at least 1 point.');
    return false;
  }

  const data = player.persistentData;
  const currentInvested = data.getInt(PERK_KEYS.subtreePrefix + classId) || 0;
  const totalEarned = data.getInt(PERK_KEYS.totalEarned) || 0;
  const totalSpent = data.getInt(PERK_KEYS.totalSpent) || 0;
  const available = totalEarned - totalSpent;

  // Check available points
  if (points > available) {
    player.tell('\u00a7c[Horizons] Not enough perk points. Available: ' + available);
    return false;
  }

  // Check subtree cap
  const newTotal = currentInvested + points;
  if (newTotal > subtree.maxPoints) {
    const maxCanInvest = subtree.maxPoints - currentInvested;
    player.tell('\u00a7c[Horizons] Subtree cap is ' + subtree.maxPoints + '. You can invest up to ' + maxCanInvest + ' more.');
    return false;
  }

  // Spend the points
  data.putInt(PERK_KEYS.subtreePrefix + classId, newTotal);
  data.putInt(PERK_KEYS.totalSpent, totalSpent + points);

  player.tell('\u00a7a[Horizons] Invested ' + points + ' points in ' + subtree.color + subtree.name + ' subtree.');
  player.tell('\u00a77Progress: \u00a7f' + newTotal + '/' + subtree.maxPoints);

  // Check tier unlocks
  updateSubtreeTiers(player, classId, newTotal);

  subtreeLog(player.username + ' invested ' + points + ' in ' + classId + ' (' + newTotal + '/' + subtree.maxPoints + ')');
  return true;
}

/**
 * Update tier stages based on current investment.
 */
function updateSubtreeTiers(player, classId, invested) {
  const subtree = SUBTREES[classId];
  if (!subtree) return;

  for (const tierId in subtree.tiers) {
    const tier = subtree.tiers[tierId];
    const stageName = 'subtree_' + classId + '_' + tierId;

    if (invested >= tier.points) {
      if (!player.stages.has(stageName)) {
        player.stages.add(stageName);
        player.tell('\u00a76[Horizons] ' + subtree.color + 'Subtree Tier Unlocked: \u00a7f' + tier.name);
        player.tell('\u00a77  ' + tier.desc);
      }
    }
  }
}

// ============================================================
// SUBTREE STATUS DISPLAY
// ============================================================

/**
 * Display the subtree status for a player.
 */
function displaySubtreeStatus(player) {
  const data = player.persistentData;
  const totalEarned = data.getInt(PERK_KEYS.totalEarned) || 0;
  const totalSpent = data.getInt(PERK_KEYS.totalSpent) || 0;
  const available = totalEarned - totalSpent;

  player.tell('\u00a76\u00a7l=== Ascension Subtrees ===');
  player.tell('\u00a77Perk Points: \u00a7f' + available + ' available \u00a78(' + totalEarned + ' earned, ' + totalSpent + ' spent)');
  player.tell('');

  let hasAnySubtree = false;

  for (const classId of SUBTREE_IDS) {
    const subtree = SUBTREES[classId];
    const unlockStage = 'ascend_subtree_' + classId + '_unlocked';

    if (!player.stages.has(unlockStage)) continue;
    hasAnySubtree = true;

    const invested = data.getInt(PERK_KEYS.subtreePrefix + classId) || 0;
    const progressBar = buildProgressBar(invested, subtree.maxPoints);

    player.tell(subtree.color + '\u00a7l' + subtree.name + ' \u00a77(' + subtree.baseTree + ')');
    player.tell('  ' + progressBar + ' \u00a7f' + invested + '/' + subtree.maxPoints);

    // Show tiers
    for (const tierId in subtree.tiers) {
      const tier = subtree.tiers[tierId];
      const stageName = 'subtree_' + classId + '_' + tierId;
      const unlocked = player.stages.has(stageName);
      const indicator = unlocked ? '\u00a7a\u2713' : '\u00a78\u2717';
      const tierColor = unlocked ? '\u00a7f' : '\u00a78';

      player.tell('  ' + indicator + ' ' + tierColor + '[' + tier.points + ' pts] ' + tier.name);
      if (unlocked) {
        player.tell('    \u00a77' + tier.desc);
      }
    }

    player.tell('');
  }

  if (!hasAnySubtree) {
    player.tell('\u00a78No subtrees unlocked yet.');
    player.tell('\u00a77Complete an Ascension trial to unlock a subtree.');
  }
}

/**
 * Build a visual progress bar.
 */
function buildProgressBar(current, max) {
  const barWidth = 20;
  const filled = Math.round((current / max) * barWidth);
  let bar = '\u00a78[';
  for (let i = 0; i < barWidth; i++) {
    if (i < filled) {
      bar += '\u00a7a|';
    } else {
      bar += '\u00a78-';
    }
  }
  bar += '\u00a78]';
  return bar;
}

// ============================================================
// AUTO-UNLOCK — Listen for ascension class stage grants
// ============================================================

/**
 * Periodic check: if a player has an ascend_class_* stage but not
 * the corresponding subtree, unlock it. This bridges trial_manager.
 */
ServerEvents.tick(event => {
  const server = event.server;

  // Check every 100 ticks (5 seconds)
  if (server.tickCount % 100 !== 0) return;

  for (const player of server.players) {
    for (const classId of SUBTREE_IDS) {
      const classStage = 'ascend_class_' + classId;
      const subtreeStage = 'ascend_subtree_' + classId + '_unlocked';

      if (player.stages.has(classStage) && !player.stages.has(subtreeStage)) {
        unlockSubtree(player, classId);
      }
    }
  }
});

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('subtree')
        // /horizons subtree status
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            displaySubtreeStatus(player);
            return 1;
          })
        )
        // /horizons subtree invest <class> <points>
        .then(Commands.literal('invest')
          .then(Commands.argument('class', event.getArguments().STRING.create(event))
            .then(Commands.argument('points', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const classId = event.getArguments().STRING.getResult(ctx, 'class').toLowerCase();
                const points = event.getArguments().INTEGER.getResult(ctx, 'points');
                investPoints(player, classId, points);
                return 1;
              })
            )
          )
        )
        // /horizons subtree reset <class> (OP only)
        .then(Commands.literal('reset')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('class', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const classId = event.getArguments().STRING.getResult(ctx, 'class').toLowerCase();
              const subtree = SUBTREES[classId];
              if (!subtree) {
                player.tell('\u00a7c[Horizons] Unknown class: ' + classId);
                return 0;
              }

              const data = player.persistentData;
              const invested = data.getInt(PERK_KEYS.subtreePrefix + classId) || 0;

              // Refund points
              const totalSpent = data.getInt(PERK_KEYS.totalSpent) || 0;
              data.putInt(PERK_KEYS.totalSpent, Math.max(0, totalSpent - invested));
              data.putInt(PERK_KEYS.subtreePrefix + classId, 0);

              // Remove tier stages
              for (const tierId in subtree.tiers) {
                const stageName = 'subtree_' + classId + '_' + tierId;
                if (player.stages.has(stageName)) {
                  player.stages.remove(stageName);
                }
              }

              player.tell('\u00a7a[Horizons] Subtree ' + subtree.name + ' reset. ' + invested + ' points refunded.');
              subtreeLog('Admin reset subtree ' + classId + ' for ' + player.username + ' (' + invested + ' points refunded)');
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Subtree Unlock loaded');
console.log('[Horizons] Commands: /horizons subtree [status|invest|reset]');
console.log('[Horizons] Classes: ' + SUBTREE_IDS.length + ' subtrees available');
