// ============================================================
// Project Horizons — Trust/Fatigue System
// ============================================================
// File: kubejs/server_scripts/cobblemon/trust_fatigue.js
// Phase: 2
// Dependencies: Cobblemon
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Track trust and fatigue for the player's companion Pokemon.
// Both values are stored in persistentData (0-100 range each).
//
// TRUST (0-100):
//   Gain: feeding (+5), walking with companion (+1/min),
//         winning battles (+3)
//   Lose: companion fainting (-10), neglect (-2 after 30min
//         inactive), switching too fast (-3)
//   Tiers: Wary (0-19), Neutral (20-39), Friendly (40-59),
//          Bonded (60-79), Soulbound (80-100)
//   Effect: trust/100 multiplier on companion_interactions effects
//
// FATIGUE (0-100):
//   Gain: companion active (+1/min), ability used (+5), battle (+3)
//   Lose: resting/deactivated (-2/min), feeding (-10),
//         sleeping/bed (reset to 0)
//   75+: effects reduced 50%
//   100: companion auto-deactivates, "exhausted" message
//
// COMMANDS:
//   /horizons trust         — shows trust level and tier
//   /horizons trust feed    — feeds companion (+5 trust, -10 fatigue)
//   /horizons trust battle  — logs a battle win (+3 trust, +3 fatigue)
//   /horizons trust faint   — logs a companion faint (-10 trust)
// ============================================================

// --- Configuration ---
const TRUST_CONFIG = {
  // persistentData keys
  keys: {
    trust: 'horizons_companion_trust',
    fatigue: 'horizons_companion_fatigue',
    activeType: 'horizons_companion_type',
    lastActivation: 'horizons_companion_last_activation',
    lastSwitchTime: 'horizons_companion_last_switch',
    lastWalkTrust: 'horizons_companion_last_walk_trust',
    lastFatigueUpdate: 'horizons_companion_last_fatigue_update',
    lastActiveCheck: 'horizons_companion_last_active_check',
    previousPosition: 'horizons_companion_prev_pos'
  },

  // Trust tiers: [tierName, min, max, color, stage]
  trustTiers: [
    { name: 'Wary',      min: 0,  max: 19, color: '\u00a7c', stage: 'companion_trust_wary' },
    { name: 'Neutral',   min: 20, max: 39, color: '\u00a77', stage: 'companion_trust_neutral' },
    { name: 'Friendly',  min: 40, max: 59, color: '\u00a7a', stage: 'companion_trust_friendly' },
    { name: 'Bonded',    min: 60, max: 79, color: '\u00a79', stage: 'companion_trust_bonded' },
    { name: 'Soulbound', min: 80, max: 100, color: '\u00a7d', stage: 'companion_trust_soulbound' }
  ],

  // Trust gain/loss values
  trustValues: {
    feed:           5,
    walkPerMinute:  1,
    battleWin:      3,
    faint:         -10,
    neglect:       -2,
    fastSwitch:    -3
  },

  // Fatigue gain/loss values
  fatigueValues: {
    activePerMinute:  1,
    abilityUsed:      5,
    battle:           3,
    restPerMinute:   -2,
    feed:           -10,
    sleepReset:       0  // Reset to 0
  },

  // Neglect threshold: ticks without companion active before penalty
  // 30 minutes = 30 * 60 * 20 = 36000 ticks
  neglectThreshold: 36000,

  // Fast switch threshold: ticks between switches that triggers penalty
  // 2 minutes = 2 * 60 * 20 = 2400 ticks
  fastSwitchThreshold: 2400,

  // Fatigue exhaustion threshold
  fatigueExhaustedThreshold: 100,
  fatigueReducedThreshold: 75,

  // Tick interval for periodic updates (1200 ticks = 1 minute)
  updateInterval: 1200,

  // Minimum distance walked per minute to count as "walking together" (blocks)
  walkDistanceThreshold: 10,

  debug: true
};

// --- Utility Functions ---

function trustLog(message) {
  if (TRUST_CONFIG.debug) {
    console.log('[Horizons/Trust] ' + message);
  }
}

/**
 * Clamp a value between min and max.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the current trust value for a player.
 */
function getTrust(player) {
  return clamp(player.persistentData.getInt(TRUST_CONFIG.keys.trust), 0, 100);
}

/**
 * Set the trust value for a player (clamped 0-100).
 */
function setTrust(player, value) {
  let clamped = clamp(value, 0, 100);
  player.persistentData.putInt(TRUST_CONFIG.keys.trust, clamped);
  updateTrustStage(player, clamped);
  return clamped;
}

/**
 * Modify trust by a delta amount.
 */
function modifyTrust(player, delta) {
  let current = getTrust(player);
  let newVal = setTrust(player, current + delta);
  trustLog(player.username + ' trust: ' + current + ' -> ' + newVal + ' (delta: ' + delta + ')');
  return newVal;
}

/**
 * Get the current fatigue value for a player.
 */
function getFatigue(player) {
  return clamp(player.persistentData.getInt(TRUST_CONFIG.keys.fatigue), 0, 100);
}

/**
 * Set the fatigue value for a player (clamped 0-100).
 */
function setFatigue(player, value) {
  let clamped = clamp(value, 0, 100);
  player.persistentData.putInt(TRUST_CONFIG.keys.fatigue, clamped);
  return clamped;
}

/**
 * Modify fatigue by a delta amount.
 */
function modifyFatigue(player, delta) {
  let current = getFatigue(player);
  let newVal = setFatigue(player, current + delta);
  trustLog(player.username + ' fatigue: ' + current + ' -> ' + newVal + ' (delta: ' + delta + ')');
  return newVal;
}

/**
 * Get the trust tier for a given trust value.
 */
function getTrustTier(trust) {
  for (let tier of TRUST_CONFIG.trustTiers) {
    if (trust >= tier.min && trust <= tier.max) return tier;
  }
  return TRUST_CONFIG.trustTiers[0]; // Fallback to Wary
}

/**
 * Update the player's trust tier stage.
 * Removes all trust stages, then adds the correct one.
 */
function updateTrustStage(player, trust) {
  let currentTier = getTrustTier(trust);

  // Remove all trust tier stages
  for (let tier of TRUST_CONFIG.trustTiers) {
    if (player.stages.has(tier.stage)) {
      player.stages.remove(tier.stage);
    }
  }

  // Add current tier stage
  player.stages.add(currentTier.stage);
}

/**
 * Check if player has an active companion (from companion_interactions.js).
 */
function hasActiveCompanion(player) {
  let type = player.persistentData.getString(TRUST_CONFIG.keys.activeType);
  return type && type.length > 0;
}

/**
 * Deactivate the companion (mirrors companion_interactions.js logic).
 */
function forceDeactivateCompanion(player) {
  // Remove all companion stages
  let companionStages = [
    'companion_fire_active',
    'companion_water_active',
    'companion_grass_active',
    'companion_electric_active',
    'companion_steel_active'
  ];
  for (let stage of companionStages) {
    if (player.stages.has(stage)) {
      player.stages.remove(stage);
    }
  }
  player.persistentData.putString(TRUST_CONFIG.keys.activeType, '');
}

/**
 * Get a visual bar string for a value (0-100).
 */
function getBar(value, maxVal, filledColor, emptyColor) {
  let barLength = 20;
  let filled = Math.floor((value / maxVal) * barLength);
  let empty = barLength - filled;
  let bar = filledColor;
  for (let i = 0; i < filled; i++) bar += '|';
  bar += emptyColor;
  for (let i = 0; i < empty; i++) bar += '|';
  return bar;
}

// ============================================================
// PERIODIC TICK — Update trust and fatigue every minute
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Only check on our interval (every 1200 ticks = 1 minute)
  if (server.tickCount % TRUST_CONFIG.updateInterval !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    let active = hasActiveCompanion(player);

    // --- Walking trust bonus ---
    if (active) {
      // Check distance traveled since last check
      let prevPosStr = player.persistentData.getString(TRUST_CONFIG.keys.previousPosition);
      let px = player.x;
      let py = player.y;
      let pz = player.z;

      if (prevPosStr && prevPosStr.length > 0) {
        let parts = prevPosStr.split(',');
        if (parts.length === 3) {
          let prevX = parseFloat(parts[0]);
          let prevY = parseFloat(parts[1]);
          let prevZ = parseFloat(parts[2]);
          let dx = px - prevX;
          let dy = py - prevY;
          let dz = pz - prevZ;
          let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance >= TRUST_CONFIG.walkDistanceThreshold) {
            modifyTrust(player, TRUST_CONFIG.trustValues.walkPerMinute);
          }
        }
      }

      // Store current position for next check
      player.persistentData.putString(
        TRUST_CONFIG.keys.previousPosition,
        px.toFixed(1) + ',' + py.toFixed(1) + ',' + pz.toFixed(1)
      );
    }

    // --- Fatigue: active companion gains fatigue ---
    if (active) {
      let newFatigue = modifyFatigue(player, TRUST_CONFIG.fatigueValues.activePerMinute);

      // Check for exhaustion
      if (newFatigue >= TRUST_CONFIG.fatigueExhaustedThreshold) {
        forceDeactivateCompanion(player);
        player.tell('\u00a7c[Companion] \u00a77Your companion is exhausted! It needs rest.');
        player.tell('\u00a77Deactivate your companion and let it recover.');
        trustLog(player.username + ' companion exhausted, auto-deactivated');
      } else if (newFatigue >= TRUST_CONFIG.fatigueReducedThreshold) {
        // Only warn once when crossing the threshold
        if (newFatigue === TRUST_CONFIG.fatigueReducedThreshold ||
            (newFatigue - TRUST_CONFIG.fatigueValues.activePerMinute) < TRUST_CONFIG.fatigueReducedThreshold) {
          player.tell('\u00a7e[Companion] \u00a77Your companion is getting tired. Effects reduced by 50%.');
        }
      }
    }

    // --- Fatigue: resting companion recovers ---
    if (!active) {
      let currentFatigue = getFatigue(player);
      if (currentFatigue > 0) {
        modifyFatigue(player, TRUST_CONFIG.fatigueValues.restPerMinute);
      }
    }

    // --- Trust: neglect penalty ---
    if (!active) {
      let lastActivation = player.persistentData.getLong(TRUST_CONFIG.keys.lastActivation);
      if (lastActivation > 0) {
        let ticksSinceActive = server.tickCount - lastActivation;
        // Apply neglect penalty every minute after 30min threshold
        if (ticksSinceActive > TRUST_CONFIG.neglectThreshold) {
          modifyTrust(player, TRUST_CONFIG.trustValues.neglect);
        }
      }
    }
  });
});

// ============================================================
// SLEEPING EVENT — Reset fatigue to 0 when player sleeps
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  // Initialize trust/fatigue if first time
  if (!data.contains(TRUST_CONFIG.keys.trust)) {
    data.putInt(TRUST_CONFIG.keys.trust, 20); // Start at Neutral tier
    data.putInt(TRUST_CONFIG.keys.fatigue, 0);
    data.putLong(TRUST_CONFIG.keys.lastActivation, 0);
    data.putLong(TRUST_CONFIG.keys.lastSwitchTime, 0);
    data.putString(TRUST_CONFIG.keys.previousPosition, '');
    trustLog('Initialized trust/fatigue data for ' + player.username);
  }

  // Update trust stage on login
  updateTrustStage(player, getTrust(player));
});

// ============================================================
// SLEEP CHECK — Reset fatigue when player uses a bed
// We check via periodic tick if player is sleeping.
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Check every 100 ticks (5 seconds) — lighter than the 1-minute cycle
  if (server.tickCount % 100 !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    // Check if player is sleeping
    if (player.isSleeping()) {
      let fatigue = getFatigue(player);
      if (fatigue > 0) {
        setFatigue(player, 0);
        player.tell('\u00a7a[Companion] \u00a77Your companion rested fully while you slept!');
        trustLog(player.username + ' slept, fatigue reset to 0');
      }
    }
  });
});

// ============================================================
// FAST SWITCH DETECTION — Penalty on companion_interactions activate
// Monitored via the lastSwitchTime written by companion_interactions.js
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Check every 20 ticks (1 second) for recent switches
  if (server.tickCount % 20 !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let lastSwitch = player.persistentData.getLong(TRUST_CONFIG.keys.lastSwitchTime);
    if (lastSwitch <= 0) return;

    // Check if this switch was recent (within last 20 ticks)
    let ticksSinceSwitch = server.tickCount - lastSwitch;
    if (ticksSinceSwitch > 0 && ticksSinceSwitch <= 20) {
      // Check if previous switch was too recent
      let lastCheck = player.persistentData.getLong(TRUST_CONFIG.keys.lastActiveCheck);
      if (lastCheck > 0) {
        let timeBetweenSwitches = lastSwitch - lastCheck;
        if (timeBetweenSwitches > 0 && timeBetweenSwitches < TRUST_CONFIG.fastSwitchThreshold) {
          modifyTrust(player, TRUST_CONFIG.trustValues.fastSwitch);
          player.tell('\u00a7c[Companion] \u00a77Your companion doesn\'t like being switched so quickly! (-3 trust)');
        }
      }
      // Update the last check time
      player.persistentData.putLong(TRUST_CONFIG.keys.lastActiveCheck, lastSwitch);
    }
  });
});

// ============================================================
// COMMANDS: /horizons trust [info|feed|battle|faint]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('trust')

        // /horizons trust — show trust info
        .executes(ctx => {
          let player = ctx.source.player;
          if (!player) return 0;

          let trust = getTrust(player);
          let fatigue = getFatigue(player);
          let tier = getTrustTier(trust);
          let active = hasActiveCompanion(player);
          let activeType = player.persistentData.getString(TRUST_CONFIG.keys.activeType) || 'none';

          player.tell('\u00a7e=== Companion Trust & Fatigue ===');

          // Trust display
          let trustBar = getBar(trust, 100, '\u00a7a', '\u00a78');
          player.tell('\u00a77Trust: ' + trustBar + ' \u00a7f' + trust + '/100');
          player.tell('\u00a77Tier: ' + tier.color + tier.name + ' \u00a77(' + tier.min + '-' + tier.max + ')');

          // Tier progress
          player.tell('\u00a77Tier Progress:');
          for (let t of TRUST_CONFIG.trustTiers) {
            let isCurrent = (trust >= t.min && trust <= t.max);
            let indicator = isCurrent ? '\u00a7a\u25b6 ' : '  ';
            let hasReached = trust >= t.min;
            let reachedMark = hasReached ? '\u00a7a\u2713' : '\u00a78\u2717';
            player.tell('  ' + indicator + reachedMark + ' ' + t.color + t.name + ' \u00a77(' + t.min + '-' + t.max + ')');
          }

          // Fatigue display
          let fatigueColor = fatigue >= 75 ? '\u00a7c' : (fatigue >= 50 ? '\u00a7e' : '\u00a7a');
          let fatigueBar = getBar(fatigue, 100, fatigueColor, '\u00a78');
          player.tell('\u00a77Fatigue: ' + fatigueBar + ' \u00a7f' + fatigue + '/100');

          if (fatigue >= 100) {
            player.tell('\u00a7c  EXHAUSTED! Companion is unable to assist.');
          } else if (fatigue >= 75) {
            player.tell('\u00a7e  Tired: Companion effects reduced by 50%.');
          }

          // Companion status
          if (active) {
            player.tell('\u00a77Companion: \u00a7f' + activeType + ' \u00a77(active)');
          } else {
            player.tell('\u00a77Companion: \u00a78resting');
          }

          // Tips
          player.tell('\u00a77Commands:');
          player.tell('  \u00a7f/horizons trust feed \u00a77- Feed companion (+5 trust, -10 fatigue)');

          return 1;
        })

        // /horizons trust feed — feed companion
        .then(Commands.literal('feed')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            // Check for food in main hand
            let held = player.mainHandItem;
            if (held.isEmpty()) {
              player.tell('\u00a7c[Companion] \u00a77Hold a food item to feed your companion.');
              return 0;
            }

            // Check if it's a food item
            let isFood = false;
            if (held.hasTag && held.hasTag('minecraft:foods')) {
              isFood = true;
            }
            // Also accept items from food mods
            let id = held.id;
            if (id.startsWith('farmersdelight:') ||
                id.startsWith('croptopia:') ||
                id.startsWith('bakery:') ||
                id.startsWith('brewery:') ||
                id.startsWith('vinery:') ||
                id.startsWith('herbalbrews:') ||
                id.startsWith('farm_and_charm:') ||
                id.startsWith('brewinandchewin:') ||
                id.startsWith('minecraft:apple') ||
                id.startsWith('minecraft:bread') ||
                id.startsWith('minecraft:cooked_') ||
                id === 'minecraft:golden_apple' ||
                id === 'minecraft:golden_carrot') {
              isFood = true;
            }

            if (!isFood) {
              player.tell('\u00a7c[Companion] \u00a77That doesn\'t look like food. Hold a food item.');
              return 0;
            }

            // Consume 1 food item
            held.shrink(1);

            // Apply trust and fatigue changes
            let newTrust = modifyTrust(player, TRUST_CONFIG.trustValues.feed);
            let newFatigue = modifyFatigue(player, TRUST_CONFIG.fatigueValues.feed);
            let tier = getTrustTier(newTrust);

            player.tell('\u00a7a[Companion] \u00a77Your companion happily eats the food!');
            player.tell('\u00a77  Trust: \u00a7a+' + TRUST_CONFIG.trustValues.feed + ' \u00a77(' + newTrust + '/100, ' + tier.color + tier.name + '\u00a77)');
            player.tell('\u00a77  Fatigue: \u00a7a' + TRUST_CONFIG.fatigueValues.feed + ' \u00a77(' + newFatigue + '/100)');

            // Particle effect
            player.server.runCommandSilent(
              'particle minecraft:heart ' +
              player.x + ' ' + (player.y + 2) + ' ' + player.z +
              ' 0.5 0.3 0.5 0 3'
            );

            trustLog(player.username + ' fed companion: trust=' + newTrust + ', fatigue=' + newFatigue);
            return 1;
          })
        )

        // /horizons trust battle — log a battle win
        .then(Commands.literal('battle')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            if (!hasActiveCompanion(player)) {
              player.tell('\u00a7c[Companion] \u00a77No active companion to credit for the battle.');
              return 0;
            }

            let newTrust = modifyTrust(player, TRUST_CONFIG.trustValues.battleWin);
            let newFatigue = modifyFatigue(player, TRUST_CONFIG.fatigueValues.battle);
            let tier = getTrustTier(newTrust);

            player.tell('\u00a7e[Companion] \u00a77Battle victory logged!');
            player.tell('\u00a77  Trust: \u00a7a+' + TRUST_CONFIG.trustValues.battleWin + ' \u00a77(' + newTrust + '/100, ' + tier.color + tier.name + '\u00a77)');
            player.tell('\u00a77  Fatigue: \u00a7c+' + TRUST_CONFIG.fatigueValues.battle + ' \u00a77(' + newFatigue + '/100)');

            // Victory particles
            player.server.runCommandSilent(
              'particle minecraft:totem_of_undying ' +
              player.x + ' ' + (player.y + 1) + ' ' + player.z +
              ' 0.5 0.5 0.5 0.1 10'
            );

            trustLog(player.username + ' battle win: trust=' + newTrust + ', fatigue=' + newFatigue);
            return 1;
          })
        )

        // /horizons trust faint — log a companion faint
        .then(Commands.literal('faint')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let newTrust = modifyTrust(player, TRUST_CONFIG.trustValues.faint);
            let tier = getTrustTier(newTrust);

            player.tell('\u00a7c[Companion] \u00a77Your companion fainted...');
            player.tell('\u00a77  Trust: \u00a7c' + TRUST_CONFIG.trustValues.faint + ' \u00a77(' + newTrust + '/100, ' + tier.color + tier.name + '\u00a77)');

            // Sad particles
            player.server.runCommandSilent(
              'particle minecraft:smoke ' +
              player.x + ' ' + (player.y + 1) + ' ' + player.z +
              ' 0.3 0.3 0.3 0.02 8'
            );

            trustLog(player.username + ' companion fainted: trust=' + newTrust);
            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Trust/Fatigue system loaded');
console.log('[Horizons] Commands: /horizons trust [feed|battle|faint]');
console.log('[Horizons] Trust tiers: Wary(0-19) -> Neutral(20-39) -> Friendly(40-59) -> Bonded(60-79) -> Soulbound(80-100)');
