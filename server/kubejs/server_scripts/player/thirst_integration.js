// ============================================================
// Project Horizons — Thirst Integration
// ============================================================
// File: kubejs/server_scripts/player/thirst_integration.js
// Phase: 2
// Dependencies: Tough As Nails, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Bridge between Tough As Nails thirst system and Horizons custom
// systems. Beverage quality affects hydration bonus, alcoholic
// drinks apply negative effects, Gate dungeons increase thirst
// drain, and Water-type Cobblemon companions slow thirst drain.
//
// COMMANDS:
//   /horizons thirst info — shows current hydration status/modifiers
//
// QUALITY -> HYDRATION BONUS:
//   Q1=+0, Q2=+1, Q3=+2, Q4=+3, Q5=+5 thirst points
//
// ALCOHOL EFFECTS:
//   Beer   — Nausea 3s
//   Spirits — Slowness 5s
//   Wine   — (none)
// ============================================================

// --- Configuration ---
const THIRST_CONFIG = {
  // Quality tier -> bonus hydration points
  hydrationBonus: {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 5
  },

  // Beverage categories and their alcohol type
  // Maps item ID prefixes/patterns to alcohol type
  alcoholTypes: {
    beer: [
      'brewery:beer',
      'brewinandchewin:beer',
      'farm_and_charm:beer',
      'croptopia:beer',
      'vinery:beer'
    ],
    spirits: [
      'brewery:whiskey',
      'brewery:rum',
      'brewery:vodka',
      'brewery:gin',
      'brewery:sake',
      'brewinandchewin:vodka',
      'brewinandchewin:rum',
      'brewinandchewin:whiskey'
    ],
    wine: [
      'vinery:red_wine',
      'vinery:white_wine',
      'vinery:rose_wine',
      'vinery:cherry_wine',
      'vinery:apple_wine',
      'vinery:jungle_wine',
      'vinery:magnetic_wine',
      'vinery:noir_wine',
      'vinery:stalwart_wine',
      'vinery:mead',
      'croptopia:wine'
    ]
  },

  // Alcohol effect durations (in seconds)
  alcoholEffects: {
    beer:    { effect: 'minecraft:nausea',   duration: 3, amplifier: 0 },
    spirits: { effect: 'minecraft:slowness',  duration: 5, amplifier: 0 },
    wine:    null // No negative effect for wine
  },

  // NBT key for quality (shared with quality_tiers.js)
  qualityNbtKey: 'horizons_quality',

  // Gate dungeon thirst drain multiplier
  gateDrainExhaustion: 0.05, // Additional exhaustion per tick when in gate

  // Tick interval for periodic checks (every 100 ticks = 5 seconds)
  checkInterval: 100,

  // Water companion thirst relief (exhaustion reduction)
  waterCompanionRelief: 0.025,

  // persistentData keys (shared with gate_system.js)
  gateKey: 'horizons_in_gate',

  // Canteen recipe materials
  canteenRecipe: {
    output: 'toughasnails:iron_water_canteen',
    brass: 'create:brass_ingot',
    iron: 'minecraft:iron_ingot',
    leather: 'minecraft:leather'
  },

  debug: true
};

// --- Beverage item ID prefixes that count as beverages ---
const BEVERAGE_PREFIXES = [
  'brewery:', 'vinery:', 'brewinandchewin:', 'herbalbrews:',
  'croptopia:juice', 'croptopia:tea', 'croptopia:coffee',
  'croptopia:beer', 'croptopia:wine', 'croptopia:smoothie',
  'croptopia:lemonade', 'croptopia:milkshake',
  'farm_and_charm:beer', 'farm_and_charm:juice',
  'toughasnails:purified_water_bottle',
  'toughasnails:water_bottle'
];

// --- Utility Functions ---

function thirstLog(message) {
  if (THIRST_CONFIG.debug) {
    console.log('[Horizons/Thirst] ' + message);
  }
}

/**
 * Get quality tier from an item's NBT.
 */
function getItemQuality(item) {
  if (!item || !item.nbt) return 1;
  let q = item.nbt.getInt(THIRST_CONFIG.qualityNbtKey);
  return (q >= 1 && q <= 5) ? q : 1;
}

/**
 * Check if an item is a beverage from our nutrition group.
 */
function isBeverage(item) {
  if (!item) return false;
  let id = item.id;
  // Check tag first
  if (item.hasTag && item.hasTag('horizons:nutrition/beverages')) return true;
  // Fallback: check prefixes
  for (let prefix of BEVERAGE_PREFIXES) {
    if (id.startsWith(prefix) || id.indexOf(prefix) >= 0) return true;
  }
  return false;
}

/**
 * Determine the alcohol type of a beverage item.
 * Returns 'beer', 'spirits', 'wine', or null if non-alcoholic.
 */
function getAlcoholType(item) {
  if (!item) return null;
  let id = item.id;

  for (let [type, items] of Object.entries(THIRST_CONFIG.alcoholTypes)) {
    for (let pattern of items) {
      if (id === pattern || id.startsWith(pattern)) return type;
    }
  }

  // Broad pattern matching for unlisted items
  if (id.indexOf('beer') >= 0 || id.indexOf('ale') >= 0 || id.indexOf('stout') >= 0 || id.indexOf('lager') >= 0) return 'beer';
  if (id.indexOf('whiskey') >= 0 || id.indexOf('rum') >= 0 || id.indexOf('vodka') >= 0 || id.indexOf('gin') >= 0 || id.indexOf('sake') >= 0 || id.indexOf('brandy') >= 0 || id.indexOf('tequila') >= 0) return 'spirits';
  if (id.indexOf('wine') >= 0 || id.indexOf('mead') >= 0) return 'wine';

  return null;
}

/**
 * Check if player is in a Gate dungeon.
 */
function isInGate(player) {
  return player.persistentData.getBoolean(THIRST_CONFIG.gateKey) || false;
}

/**
 * Check if player has a Water-type companion active.
 */
function hasWaterCompanion(player) {
  return player.stages.has('companion_water_active');
}

// ============================================================
// BEVERAGE CONSUMPTION — Hydration bonus + alcohol effects
// ============================================================

ItemEvents.foodEaten(event => {
  let item = event.item;
  let player = event.player;
  if (!item || !player) return;

  // Only process beverages
  if (!isBeverage(item)) return;

  let quality = getItemQuality(item);
  let hydrationBonus = THIRST_CONFIG.hydrationBonus[quality] || 0;

  // Apply hydration bonus via Tough As Nails thirst command
  // TaN uses /toughasnails thirst add <player> <amount> to restore thirst
  if (hydrationBonus > 0) {
    player.server.runCommandSilent(
      'toughasnails thirst add ' + player.username + ' ' + hydrationBonus
    );

    let qualityNames = { 1: 'Common', 2: 'Fine', 3: 'Superior', 4: 'Exquisite', 5: 'Legendary' };
    let qualityColors = { 1: '\u00a77', 2: '\u00a7a', 3: '\u00a79', 4: '\u00a7d', 5: '\u00a76' };
    player.tell(
      qualityColors[quality] + '[Thirst] ' + qualityNames[quality] +
      ' beverage! +' + hydrationBonus + ' bonus hydration'
    );
  }

  // Check for alcohol effects
  let alcoholType = getAlcoholType(item);
  if (alcoholType) {
    let effectInfo = THIRST_CONFIG.alcoholEffects[alcoholType];
    if (effectInfo) {
      player.server.runCommandSilent(
        'effect give ' + player.username + ' ' + effectInfo.effect +
        ' ' + effectInfo.duration + ' ' + effectInfo.amplifier
      );
      thirstLog(player.username + ' drank ' + alcoholType + ', applying ' + effectInfo.effect);
    }

    // Flavor messages
    if (alcoholType === 'beer') {
      player.tell('\u00a7e[Thirst] \u00a77The beer makes your head swim a little...');
    } else if (alcoholType === 'spirits') {
      player.tell('\u00a7e[Thirst] \u00a77The strong drink burns going down...');
    } else if (alcoholType === 'wine') {
      player.tell('\u00a7e[Thirst] \u00a77A refined drink. Refreshing.');
    }
  }

  thirstLog(player.username + ' drank beverage: ' + item.id + ' (Q' + quality + ', +' + hydrationBonus + ' hydration)');
});

// ============================================================
// PERIODIC TICK — Gate dungeon thirst drain + Water companion
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Only check on our interval
  if (server.tickCount % THIRST_CONFIG.checkInterval !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    let inGate = isInGate(player);
    let hasWater = hasWaterCompanion(player);

    // Gate dungeon: thirst drains 50% faster
    // We simulate faster drain by applying exhaustion
    if (inGate) {
      // Apply extra exhaustion to simulate faster thirst drain
      // Tough As Nails links exhaustion to thirst depletion
      player.server.runCommandSilent(
        'toughasnails thirst remove ' + player.username + ' 1'
      );

      // If player also has water companion, counteract some of the drain
      // Water companion reduces drain by 25%, so net gate penalty = 25% faster
      if (hasWater) {
        // Every other check interval, restore 1 thirst to simulate 25% reduction
        if (Math.floor(server.tickCount / THIRST_CONFIG.checkInterval) % 2 === 0) {
          player.server.runCommandSilent(
            'toughasnails thirst add ' + player.username + ' 1'
          );
        }
      }
    } else if (hasWater) {
      // Outside gate: Water companion slows thirst drain by 25%
      // Every 4th check interval, restore 1 thirst to simulate slower drain
      if (Math.floor(server.tickCount / THIRST_CONFIG.checkInterval) % 4 === 0) {
        player.server.runCommandSilent(
          'toughasnails thirst add ' + player.username + ' 1'
        );
      }
    }
  });
});

// ============================================================
// CANTEEN CRAFTING — Iron canteen with Create brass
// ============================================================

ServerEvents.recipes(event => {
  let cfg = THIRST_CONFIG.canteenRecipe;

  // Iron Canteen: shaped recipe using Create brass + iron + leather
  event.shaped(cfg.output, [
    ' B ',
    'ILI',
    ' I '
  ], {
    B: cfg.brass,
    I: cfg.iron,
    L: cfg.leather
  }).id('horizons:iron_canteen_brass');

  thirstLog('Registered iron canteen recipe with Create brass');
});

// ============================================================
// COMMAND: /horizons thirst info
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('thirst')
        .then(Commands.literal('info')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let inGate = isInGate(player);
            let hasWater = hasWaterCompanion(player);

            player.tell('\u00a7b=== Thirst Status ===');

            // Active modifiers
            player.tell('\u00a77Active Modifiers:');

            if (inGate && hasWater) {
              player.tell('  \u00a7c\u25b6 Gate Dungeon: \u00a77+50% thirst drain');
              player.tell('  \u00a7b\u25b6 Water Companion: \u00a77-25% thirst drain');
              player.tell('  \u00a7e  Net: \u00a77+25% thirst drain');
            } else if (inGate) {
              player.tell('  \u00a7c\u25b6 Gate Dungeon: \u00a77+50% thirst drain');
              player.tell('  \u00a77  Tip: A Water-type companion can reduce this!');
            } else if (hasWater) {
              player.tell('  \u00a7b\u25b6 Water Companion: \u00a77-25% thirst drain');
            } else {
              player.tell('  \u00a77  (none)');
            }

            // Quality hydration info
            player.tell('\u00a77Beverage Quality Bonuses:');
            player.tell('  \u00a77Q1 Common:    +0 hydration');
            player.tell('  \u00a7aQ2 Fine:      +1 hydration');
            player.tell('  \u00a79Q3 Superior:  +2 hydration');
            player.tell('  \u00a7dQ4 Exquisite: +3 hydration');
            player.tell('  \u00a76Q5 Legendary: +5 hydration');

            // Alcohol info
            player.tell('\u00a77Alcohol Effects:');
            player.tell('  \u00a7eBeer: \u00a77Nausea (3s)');
            player.tell('  \u00a7eSpirits: \u00a77Slowness (5s)');
            player.tell('  \u00a7eWine: \u00a77No negative effects');

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Info message about thirst modifiers
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;

  // If player is in a gate, warn about thirst drain
  if (isInGate(player)) {
    player.tell('\u00a7c[Thirst] \u00a77Warning: Thirst drains 50% faster in Gate dungeons!');
    if (hasWaterCompanion(player)) {
      player.tell('\u00a7b[Thirst] \u00a77Water companion active: drain reduced by 25%.');
    }
  }
});

console.log('[Horizons] Thirst Integration loaded');
console.log('[Horizons] Commands: /horizons thirst info');
console.log('[Horizons] Beverage quality hydration: Q1=+0, Q2=+1, Q3=+2, Q4=+3, Q5=+5');
