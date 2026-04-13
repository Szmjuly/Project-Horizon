// ============================================================
// Project Horizons — Village Needs
// ============================================================
// File: kubejs/server_scripts/villages/needs.js
// Phase: 4
// Dependencies: KubeJS, MCA Reborn (mood integration)
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Settlement-level needs tracking (separate from MCA Reborn's
// per-villager mood system). 4 needs per village: Food, Water,
// Safety, Comfort. Each on a 0-100 scale, decaying over time.
// Needs affect village prosperity from village_evolution.js.
//
// NEEDS:
//   Food    — +2 per food stack stored, decays -5/MC day
//   Water   — water sources + rain collectors, decays -3/MC day
//   Safety  — +15 per Guard Villager, decreases on mob attacks
//   Comfort — beds + decorative blocks + MCA mood
//
// PROSPERITY EFFECTS:
//   All below 25: prosperity stops growing
//   Any below 10: prosperity decays -5/day
//   All above 75: prosperity bonus +5/day
//
// COMMANDS:
//   /horizons village needs
//   /horizons village supply <need> <amount>
// ============================================================

// --- Configuration ---
const NEEDS_CONFIG = {
  // persistentData keys
  keys: {
    food: 'horizons_village_need_food',
    water: 'horizons_village_need_water',
    safety: 'horizons_village_need_safety',
    comfort: 'horizons_village_need_comfort',
    lastDecayTick: 'horizons_village_needs_decay_tick',
    lastProsperityTick: 'horizons_village_needs_prosperity_tick'
  },

  // Need definitions
  needs: {
    food: {
      name: 'Food',
      color: '\u00a76',
      icon: '\u2615',
      description: 'Store food in village chests',
      decayPerDay: 5,
      maxValue: 100
    },
    water: {
      name: 'Water',
      color: '\u00a79',
      icon: '\u2248',
      description: 'Water sources and rain collectors',
      decayPerDay: 3,
      maxValue: 100
    },
    safety: {
      name: 'Safety',
      color: '\u00a7c',
      icon: '\u2694',
      description: 'Guard Villagers and defenses',
      decayPerDay: 2,
      maxValue: 100
    },
    comfort: {
      name: 'Comfort',
      color: '\u00a7d',
      icon: '\u2764',
      description: 'Beds, decorations, villager mood',
      decayPerDay: 4,
      maxValue: 100
    }
  },

  // Prosperity effect thresholds
  prosperityCritical: 10,   // Below this: prosperity decays
  prosperityLow: 25,         // Below this: prosperity stops growing
  prosperityHigh: 75,        // Above this: prosperity bonus

  // Prosperity change amounts per day
  prosperityDecay: -5,
  prosperityBonus: 5,

  // Decay check interval (1 MC day = 24000 ticks)
  decayInterval: 24000,

  // Prosperity check interval (1 MC day)
  prosperityInterval: 24000,

  // Auto-scan interval for environmental bonuses (every 5 min = 6000 ticks)
  scanInterval: 6000,

  // Scan radius for environmental checks (blocks)
  scanRadius: 16,

  // Food items that count for food need (when stored in chests)
  foodTags: [
    'minecraft:bread', 'minecraft:cooked_beef', 'minecraft:cooked_porkchop',
    'minecraft:cooked_chicken', 'minecraft:cooked_mutton', 'minecraft:cooked_cod',
    'minecraft:cooked_salmon', 'minecraft:cooked_rabbit', 'minecraft:baked_potato',
    'minecraft:apple', 'minecraft:golden_apple', 'minecraft:golden_carrot',
    'minecraft:cookie', 'minecraft:pumpkin_pie', 'minecraft:mushroom_stew',
    'minecraft:beetroot_soup', 'minecraft:suspicious_stew', 'minecraft:rabbit_stew',
    'minecraft:carrot', 'minecraft:potato', 'minecraft:beetroot', 'minecraft:wheat',
    'minecraft:melon_slice', 'minecraft:sweet_berries', 'minecraft:dried_kelp'
  ],

  // Prosperity key from village_evolution.js
  prosperityKey: 'horizons_village_prosperity',

  debug: true
};

const NEED_IDS = Object.keys(NEEDS_CONFIG.needs);

// --- Utility Functions ---

function needsLog(message) {
  if (NEEDS_CONFIG.debug) {
    console.log('[Horizons/Needs] ' + message);
  }
}

/**
 * Get a need's current value for a player's village.
 */
function getNeed(player, needId) {
  let val = player.persistentData.getInt(NEEDS_CONFIG.keys[needId]);
  return Math.max(0, Math.min(100, val || 0));
}

/**
 * Set a need value (clamped 0-100).
 */
function setNeed(player, needId, value) {
  let clamped = Math.max(0, Math.min(100, Math.floor(value)));
  player.persistentData.putInt(NEEDS_CONFIG.keys[needId], clamped);
  return clamped;
}

/**
 * Modify a need by a delta.
 */
function modifyNeed(player, needId, delta) {
  let current = getNeed(player, needId);
  return setNeed(player, needId, current + delta);
}

/**
 * Build a visual bar for a need (0-100).
 */
function buildNeedBar(value) {
  let barLength = 20;
  let filled = Math.floor((value / 100) * barLength);
  let empty = barLength - filled;

  let fillColor;
  if (value >= 75) fillColor = '\u00a7a';
  else if (value >= 25) fillColor = '\u00a7e';
  else if (value >= 10) fillColor = '\u00a7c';
  else fillColor = '\u00a74';

  let bar = fillColor;
  for (let i = 0; i < filled; i++) bar += '|';
  bar += '\u00a78';
  for (let i = 0; i < empty; i++) bar += '|';
  return bar;
}

/**
 * Get a status label for a need value.
 */
function getNeedStatus(value) {
  if (value >= 75) return { label: 'Thriving', color: '\u00a7a' };
  if (value >= 50) return { label: 'Adequate', color: '\u00a7e' };
  if (value >= 25) return { label: 'Low', color: '\u00a7c' };
  if (value >= 10) return { label: 'Critical', color: '\u00a74' };
  return { label: 'DESPERATE', color: '\u00a74\u00a7l' };
}

// ============================================================
// DAILY DECAY — Reduce needs each MC day
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % NEEDS_CONFIG.decayInterval !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let lastDecay = player.persistentData.getLong(NEEDS_CONFIG.keys.lastDecayTick) || 0;
    if (lastDecay > 0 && (server.tickCount - lastDecay) < NEEDS_CONFIG.decayInterval) return;
    player.persistentData.putLong(NEEDS_CONFIG.keys.lastDecayTick, server.tickCount);

    let warnings = [];

    for (let needId of NEED_IDS) {
      let info = NEEDS_CONFIG.needs[needId];
      let oldVal = getNeed(player, needId);
      let newVal = modifyNeed(player, needId, -info.decayPerDay);

      if (newVal < NEEDS_CONFIG.prosperityCritical && oldVal >= NEEDS_CONFIG.prosperityCritical) {
        warnings.push(info.color + info.name + ' \u00a77is critically low!');
      } else if (newVal < NEEDS_CONFIG.prosperityLow && oldVal >= NEEDS_CONFIG.prosperityLow) {
        warnings.push(info.color + info.name + ' \u00a77is getting low.');
      }
    }

    // Notify player of warnings
    for (let warn of warnings) {
      player.tell('\u00a7e[Village] ' + warn);
    }
  });
});

// ============================================================
// PROSPERITY EFFECTS — Daily check
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Offset from decay check to avoid same-tick processing
  if ((server.tickCount + 12000) % NEEDS_CONFIG.prosperityInterval !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let food = getNeed(player, 'food');
    let water = getNeed(player, 'water');
    let safety = getNeed(player, 'safety');
    let comfort = getNeed(player, 'comfort');
    let allNeeds = [food, water, safety, comfort];

    let prosperity = player.persistentData.getInt(NEEDS_CONFIG.prosperityKey) || 0;
    let anyBelowCritical = allNeeds.some(n => n < NEEDS_CONFIG.prosperityCritical);
    let anyBelowLow = allNeeds.some(n => n < NEEDS_CONFIG.prosperityLow);
    let allAboveHigh = allNeeds.every(n => n >= NEEDS_CONFIG.prosperityHigh);

    // Apply prosperity effects
    if (anyBelowCritical) {
      let newPros = Math.max(0, prosperity + NEEDS_CONFIG.prosperityDecay);
      player.persistentData.putInt(NEEDS_CONFIG.prosperityKey, newPros);
      player.tell('\u00a7c[Village] \u00a77Village prosperity decaying due to critical needs! (' +
        NEEDS_CONFIG.prosperityDecay + ')');
      needsLog(player.username + ' prosperity decay: ' + prosperity + ' -> ' + newPros);
    } else if (allAboveHigh) {
      let newPros = prosperity + NEEDS_CONFIG.prosperityBonus;
      player.persistentData.putInt(NEEDS_CONFIG.prosperityKey, newPros);
      player.tell('\u00a7a[Village] \u00a77Village thriving! Prosperity bonus +' + NEEDS_CONFIG.prosperityBonus);
      needsLog(player.username + ' prosperity bonus: ' + prosperity + ' -> ' + newPros);
    } else if (anyBelowLow) {
      // Prosperity stagnates — no message unless first occurrence
      needsLog(player.username + ' prosperity stagnant (needs below ' + NEEDS_CONFIG.prosperityLow + ')');
    }

    // Update need-related stages for MCA Reborn integration
    if (comfort >= 75) {
      if (!player.stages.has('village_comfort_high')) player.stages.add('village_comfort_high');
    } else {
      if (player.stages.has('village_comfort_high')) player.stages.remove('village_comfort_high');
    }

    if (safety < NEEDS_CONFIG.prosperityCritical) {
      if (!player.stages.has('village_safety_critical')) player.stages.add('village_safety_critical');
    } else {
      if (player.stages.has('village_safety_critical')) player.stages.remove('village_safety_critical');
    }
  });
});

// ============================================================
// ENVIRONMENTAL SCAN — Auto-detect nearby contributions
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % NEEDS_CONFIG.scanInterval !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    // Only scan if player is near their village area
    let villageX = player.persistentData.getInt('horizons_village_x');
    let villageZ = player.persistentData.getInt('horizons_village_z');

    // If no village registered, skip environmental scan
    if (villageX === 0 && villageZ === 0) return;

    let dx = Math.floor(player.x) - villageX;
    let dz = Math.floor(player.z) - villageZ;
    let distToVillage = Math.sqrt(dx * dx + dz * dz);

    // Only scan if player is within 64 blocks of their village
    if (distToVillage > 64) return;

    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);
    let radius = NEEDS_CONFIG.scanRadius;
    let level = player.level;

    let waterSources = 0;
    let beds = 0;
    let decorBlocks = 0;

    for (let bx = -radius; bx <= radius; bx++) {
      for (let bz = -radius; bz <= radius; bz++) {
        for (let by = -4; by <= 8; by++) {
          let blockId = level.getBlock(px + bx, py + by, pz + bz).id;

          // Water sources for Water need
          if (blockId === 'minecraft:water' || blockId === 'minecraft:water_cauldron' ||
              blockId === 'minecraft:cauldron') {
            waterSources++;
          }

          // Beds for Comfort need
          if (blockId.endsWith('_bed')) {
            beds++;
          }

          // Decorative blocks for Comfort need
          if (blockId === 'minecraft:flower_pot' || blockId === 'minecraft:painting' ||
              blockId === 'minecraft:lantern' || blockId === 'minecraft:soul_lantern' ||
              blockId === 'minecraft:campfire' || blockId === 'minecraft:soul_campfire' ||
              blockId === 'minecraft:decorated_pot' || blockId === 'minecraft:candle' ||
              blockId.endsWith('_carpet') || blockId.endsWith('_banner')) {
            decorBlocks++;
          }
        }
      }
    }

    // Apply water bonus (diminishing: each 5 sources = +1, cap at +10 per scan)
    if (waterSources > 0) {
      let waterBonus = Math.min(10, Math.floor(waterSources / 5));
      if (waterBonus > 0) {
        let current = getNeed(player, 'water');
        if (current < 100) {
          modifyNeed(player, 'water', waterBonus);
        }
      }
    }

    // Apply comfort bonus from beds and decor (each 3 beds = +1, decor = +1 per 10)
    let comfortBonus = Math.floor(beds / 3) + Math.floor(decorBlocks / 10);
    comfortBonus = Math.min(8, comfortBonus);
    if (comfortBonus > 0) {
      let current = getNeed(player, 'comfort');
      if (current < 100) {
        modifyNeed(player, 'comfort', comfortBonus);
      }
    }

    // MCA Reborn mood integration via stage check
    if (player.stages.has('mca_villagers_happy')) {
      let current = getNeed(player, 'comfort');
      if (current < 100) {
        modifyNeed(player, 'comfort', 2);
      }
    }
  });
});

// ============================================================
// MOB KILL NEAR VILLAGE — Safety boost
// ============================================================

EntityEvents.death(event => {
  let entity = event.entity;
  if (!entity) return;

  let source = event.source;
  if (!source) return;

  let attacker = source.actual;
  if (!attacker || !attacker.player) return;

  let player = attacker;
  // Check if entity is a hostile mob
  let entityType = entity.type.toString();
  let isHostile = (entityType.includes('zombie') || entityType.includes('skeleton') ||
    entityType.includes('creeper') || entityType.includes('spider') ||
    entityType.includes('witch') || entityType.includes('pillager') ||
    entityType.includes('vindicator') || entityType.includes('ravager') ||
    entityType.includes('evoker') || entityType.includes('phantom') ||
    entityType.includes('drowned'));

  if (!isHostile) return;

  // Small safety boost for defending near village
  let villageX = player.persistentData.getInt('horizons_village_x');
  let villageZ = player.persistentData.getInt('horizons_village_z');
  if (villageX === 0 && villageZ === 0) return;

  let dx = Math.floor(player.x) - villageX;
  let dz = Math.floor(player.z) - villageZ;
  let dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= 64) {
    modifyNeed(player, 'safety', 1);
  }
});

// ============================================================
// COMMANDS: /horizons village needs, /horizons village supply
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('village')

        // /horizons village needs — show all 4 needs
        .then(Commands.literal('needs')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let prosperity = player.persistentData.getInt(NEEDS_CONFIG.prosperityKey) || 0;

            player.tell('\u00a7e=== Village Needs ===');
            player.tell('\u00a77Prosperity: \u00a7f' + prosperity);
            player.tell('');

            let allAboveHigh = true;
            let anyBelowLow = false;
            let anyBelowCritical = false;

            for (let needId of NEED_IDS) {
              let info = NEEDS_CONFIG.needs[needId];
              let value = getNeed(player, needId);
              let bar = buildNeedBar(value);
              let status = getNeedStatus(value);

              if (value < NEEDS_CONFIG.prosperityHigh) allAboveHigh = false;
              if (value < NEEDS_CONFIG.prosperityLow) anyBelowLow = true;
              if (value < NEEDS_CONFIG.prosperityCritical) anyBelowCritical = true;

              player.tell(info.color + info.icon + ' ' + info.name + ':');
              player.tell('  ' + bar + ' ' + status.color + value + '/100 \u00a77(' + status.label + ')');
              player.tell('  \u00a78' + info.description + ' | Decay: -' + info.decayPerDay + '/day');
            }

            player.tell('');

            // Prosperity impact summary
            player.tell('\u00a77Prosperity Impact:');
            if (anyBelowCritical) {
              player.tell('  \u00a74DECAYING \u00a77- One or more needs critically low (below ' + NEEDS_CONFIG.prosperityCritical + ')');
            } else if (anyBelowLow) {
              player.tell('  \u00a7eSTAGNANT \u00a77- One or more needs below ' + NEEDS_CONFIG.prosperityLow);
            } else if (allAboveHigh) {
              player.tell('  \u00a7aTHRIVING \u00a77- All needs above ' + NEEDS_CONFIG.prosperityHigh + ' (+' + NEEDS_CONFIG.prosperityBonus + '/day)');
            } else {
              player.tell('  \u00a7fSTABLE \u00a77- Needs are adequate');
            }

            player.tell('');
            player.tell('\u00a77Use /horizons village supply <need> <amount> to improve needs.');

            return 1;
          })
        )

        // /horizons village supply <need> <amount>
        .then(Commands.literal('supply')
          .then(Commands.argument('need', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let id of NEED_IDS) {
                builder.suggest(id);
              }
              return builder.buildFuture();
            })
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let needId = event.getArguments().STRING.getResult(ctx, 'need').toLowerCase();
                let amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                if (!NEEDS_CONFIG.needs[needId]) {
                  player.tell('\u00a7c[Village] Unknown need: ' + needId);
                  player.tell('\u00a77Valid needs: ' + NEED_IDS.join(', '));
                  return 0;
                }

                if (amount <= 0) {
                  player.tell('\u00a7c[Village] Amount must be positive.');
                  return 0;
                }

                // Cap at reasonable value
                amount = Math.min(amount, 50);

                let info = NEEDS_CONFIG.needs[needId];
                let oldVal = getNeed(player, needId);
                let newVal = modifyNeed(player, needId, amount);

                player.tell('\u00a7a[Village] ' + info.color + info.icon + ' ' + info.name +
                  ' \u00a77supplied: \u00a7a+' + amount);
                player.tell('\u00a77  ' + oldVal + ' \u00a77\u2192 \u00a7f' + newVal + '/100');

                let status = getNeedStatus(newVal);
                player.tell('\u00a77  Status: ' + status.color + status.label);

                player.server.runCommandSilent(
                  'particle minecraft:happy_villager ' +
                  player.x + ' ' + (player.y + 1) + ' ' + player.z +
                  ' 0.5 0.5 0.5 0 8'
                );

                needsLog(player.username + ' supplied ' + needId + ' +' + amount +
                  ' (' + oldVal + ' -> ' + newVal + ')');
                return 1;
              })
            )
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize needs data
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  // Initialize needs if not set
  let initKey = 'horizons_village_needs_init';
  if (!data.getBoolean(initKey)) {
    for (let needId of NEED_IDS) {
      data.putInt(NEEDS_CONFIG.keys[needId], 50); // Start at 50/100
    }
    data.putBoolean(initKey, true);
    needsLog('Initialized village needs for ' + player.username);
  }

  // Show needs summary on login
  let anyLow = false;
  for (let needId of NEED_IDS) {
    let val = getNeed(player, needId);
    if (val < NEEDS_CONFIG.prosperityLow) {
      anyLow = true;
      break;
    }
  }

  if (anyLow) {
    player.tell('\u00a7e[Village] \u00a77Some village needs are low. Check /horizons village needs');
  }
});

console.log('[Horizons] Village Needs loaded');
console.log('[Horizons] Commands: /horizons village [needs|supply]');
console.log('[Horizons] Needs: food, water, safety, comfort');
