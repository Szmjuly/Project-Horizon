// ============================================================
// Project Horizons — Food & Item Quality Tiers
// ============================================================
// File: kubejs/server_scripts/farming/quality_tiers.js
// Phase: 1
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md Section 5.1
// ============================================================
//
// PURPOSE:
// Every food/crafted item in Horizons has a Quality tier (Q1-Q5).
// Quality affects buff strength, sell price, and recipe outcomes.
// Quality is stored as NBT persistent data on the item stack.
//
// QUALITY TIERS:
//   Q1 "Common"     — 1.0x multiplier (default, no tag needed)
//   Q2 "Fine"       — 1.5x multiplier
//   Q3 "Superior"   — 2.0x multiplier
//   Q4 "Exquisite"  — 2.25x multiplier
//   Q5 "Legendary"  — 2.5x multiplier
//
// QUALITY DETERMINATION:
//   - Random chance on crafting (weighted toward Q1-Q2)
//   - Farming skill level increases quality chance
//   - Specific recipes/methods guarantee higher quality
//   - Cooking Pot recipes can upgrade quality by 1 tier
// ============================================================

// --- Quality Configuration ---
const QUALITY = {
  tiers: {
    1: { name: 'Common',    color: '§7', multiplier: 1.0 },
    2: { name: 'Fine',      color: '§a', multiplier: 1.5 },
    3: { name: 'Superior',  color: '§9', multiplier: 2.0 },
    4: { name: 'Exquisite', color: '§d', multiplier: 2.25 },
    5: { name: 'Legendary', color: '§6', multiplier: 2.5 }
  },

  // Base weights for random quality assignment (sum = 100)
  baseWeights: {
    1: 55,  // 55% Common
    2: 25,  // 25% Fine
    3: 13,  // 13% Superior
    4: 5,   //  5% Exquisite
    5: 2    //  2% Legendary
  },

  // NBT key used to store quality on items
  nbtKey: 'horizons_quality',

  // Items that should receive quality ratings
  // (Populated by tag checks at runtime)
  qualifyingTags: [
    '#horizons:nutrition/grains',
    '#horizons:nutrition/fruits',
    '#horizons:nutrition/vegetables',
    '#horizons:nutrition/proteins',
    '#horizons:nutrition/dairy',
    '#horizons:nutrition/sugars',
    '#horizons:nutrition/herbs_spices',
    '#horizons:nutrition/beverages'
  ]
};

// --- Utility: Roll quality tier based on weights ---
function rollQuality(bonusWeight) {
  const weights = Object.assign({}, QUALITY.baseWeights);

  // Apply bonus: shift weight from Q1 toward higher tiers
  if (bonusWeight && bonusWeight > 0) {
    const shift = Math.min(bonusWeight, weights[1] - 10); // Never drop Q1 below 10%
    weights[1] -= shift;
    weights[2] += Math.floor(shift * 0.4);
    weights[3] += Math.floor(shift * 0.3);
    weights[4] += Math.floor(shift * 0.2);
    weights[5] += Math.floor(shift * 0.1);
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.floor(Math.random() * total);

  for (const [tier, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll < 0) return parseInt(tier);
  }
  return 1; // Fallback
}

// --- Utility: Get quality tier from item ---
function getQuality(item) {
  if (!item || !item.nbt) return 1;
  const q = item.nbt.getInt(QUALITY.nbtKey);
  return q >= 1 && q <= 5 ? q : 1;
}

// --- Utility: Get quality display string ---
function getQualityDisplay(tier) {
  const info = QUALITY.tiers[tier];
  if (!info || tier <= 1) return '';
  return `${info.color}★ ${info.name} Quality`;
}

// --- Utility: Get quality multiplier ---
function getQualityMultiplier(tier) {
  const info = QUALITY.tiers[tier];
  return info ? info.multiplier : 1.0;
}

// ============================================================
// CRAFTING EVENT: Assign quality to food items on craft
// ============================================================

ItemEvents.crafted(event => {
  const item = event.item;
  if (!item || item.isEmpty()) return;

  // Check if this is a food item
  if (!item.hasTag('minecraft:foods') && !isNutritionItem(item)) return;

  // Roll quality
  const player = event.player;
  let bonus = 0;

  // Check player's farming skill stage for quality bonus
  if (player && player.stages) {
    if (player.stages.has('path_cultivator')) bonus += 10;
    if (player.stages.has('unlock_cooking')) bonus += 5;
  }

  const quality = rollQuality(bonus);

  if (quality > 1) {
    // Apply quality NBT
    let nbt = item.nbt || {};
    nbt[QUALITY.nbtKey] = quality;
    item.nbt = nbt;
  }
});

// ============================================================
// SMELTING EVENT: Assign quality to smelted food
// ============================================================

ItemEvents.smelted(event => {
  const item = event.item;
  if (!item || item.isEmpty()) return;

  if (!item.hasTag('minecraft:foods')) return;

  const quality = rollQuality(0);
  if (quality > 1) {
    let nbt = item.nbt || {};
    nbt[QUALITY.nbtKey] = quality;
    item.nbt = nbt;
  }
});

// ============================================================
// FOOD EATEN EVENT: Apply quality-scaled effects
// ============================================================

ItemEvents.foodEaten(event => {
  const item = event.item;
  const player = event.player;
  if (!item || !player) return;

  const quality = getQuality(item);
  if (quality <= 1) return;

  const multiplier = getQualityMultiplier(quality);
  const tierInfo = QUALITY.tiers[quality];

  // Display quality message
  player.tell(`${tierInfo.color}[Quality] ${tierInfo.name} food consumed! (${multiplier}x effects)`);

  // Apply bonus saturation based on quality
  const bonusSaturation = (multiplier - 1.0) * 2.0;
  if (bonusSaturation > 0) {
    player.addExhaustion(-bonusSaturation); // Negative exhaustion = restore saturation
  }

  // Q4+ foods grant a brief regeneration effect
  if (quality >= 4) {
    player.server.runCommandSilent(
      `effect give ${player.username} minecraft:regeneration 5 0`
    );
  }

  // Q5 foods grant brief absorption
  if (quality >= 5) {
    player.server.runCommandSilent(
      `effect give ${player.username} minecraft:absorption 30 1`
    );
  }
});

// ============================================================
// TOOLTIP HOOK: Quality display on items
// NOTE: ItemEvents.tooltip is CLIENT-SIDE only — moved to
// client_scripts/horizons_client.js for tooltip rendering.
// Server-side quality info is shown via chat on food eaten.
// ============================================================

// ============================================================
// HELPER: Check if item is in our nutrition tags
// ============================================================

function isNutritionItem(item) {
  if (!item) return false;
  const id = item.id;
  // Check common food mod prefixes
  return id.startsWith('farmersdelight:') ||
         id.startsWith('croptopia:') ||
         id.startsWith('bakery:') ||
         id.startsWith('brewery:') ||
         id.startsWith('vinery:') ||
         id.startsWith('herbalbrews:') ||
         id.startsWith('candlelight:') ||
         id.startsWith('farm_and_charm:') ||
         id.startsWith('brewinandchewin:');
}

// ============================================================
// SERVER COMMAND: /horizons quality — debug quality on held item
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('quality')
        .then(Commands.literal('check')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;
            const held = player.mainHandItem;
            if (held.isEmpty()) {
              player.tell('[Horizons] Hold an item to check its quality.');
              return 0;
            }
            const q = getQuality(held);
            const info = QUALITY.tiers[q];
            player.tell(`[Horizons] ${held.id}: ${info.color}${info.name} Quality (Q${q}, ${info.multiplier}x)`);
            return 1;
          })
        )
        .then(Commands.literal('set')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('tier', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const tier = event.getArguments().INTEGER.getResult(ctx, 'tier');
              if (tier < 1 || tier > 5) {
                player.tell('[Horizons] Quality must be 1-5.');
                return 0;
              }
              const held = player.mainHandItem;
              if (held.isEmpty()) {
                player.tell('[Horizons] Hold an item to set quality.');
                return 0;
              }
              let nbt = held.nbt || {};
              nbt[QUALITY.nbtKey] = tier;
              held.nbt = nbt;
              const info = QUALITY.tiers[tier];
              player.tell(`[Horizons] Set ${held.id} to ${info.color}${info.name} Quality (Q${tier})`);
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Quality Tiers system loaded');
console.log('[Horizons] Quality tiers: Q1 Common (1x) -> Q5 Legendary (2.5x)');
