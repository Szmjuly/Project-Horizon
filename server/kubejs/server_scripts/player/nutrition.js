// ============================================================
// Project Horizons — Nutrition System
// ============================================================
// File: kubejs/server_scripts/player/nutrition.js
// Phase: 2
// Dependencies: KubeJS, quality_tiers.js
// Docs: HORIZONS_INTEGRATIONS.md Section 5.2
// ============================================================
//
// PURPOSE:
// Track 8 food groups per player. Eating varied foods grants
// escalating buffs. Eating the same food repeatedly yields
// diminishing returns. Quality tiers multiply nutrition value.
//
// FOOD GROUPS:
//   grains, fruits, vegetables, proteins,
//   dairy, sugars, herbs_spices, beverages
//
// BUFF STATES (based on groups satisfied):
//   0-2 groups: Malnourished — Slowness I, -10% max health
//   3-4 groups: Adequate — no buffs or debuffs
//   5-6 groups: Well Fed — Haste I, +10% max health
//   7   groups: Balanced Diet — Haste I, Strength I, +20% max health
//   8   groups: Gourmet — Haste II, Strength I, Resistance I, +20% max health
//
// TRACKING:
//   Each group has a satiety value (0-100) that decays over time.
//   Eating a food in that group adds to its satiety.
//   Eating the SAME item repeatedly has diminishing returns.
// ============================================================

const NUTRITION = {
  groups: ['grains', 'fruits', 'vegetables', 'proteins', 'dairy', 'sugars', 'herbs_spices', 'beverages'],

  // NBT keys
  dataKey: 'horizons_nutrition',
  lastEatenKey: 'horizons_last_eaten',

  // Satiety per group (0-100)
  maxSatiety: 100,
  baseGain: 25,           // Base satiety gain per food eaten
  decayPerMinute: 2,      // Satiety decay per real minute (1200 ticks)
  decayInterval: 1200,    // Ticks between decay (1 minute)

  // Diminishing returns
  repeatPenalty: 0.5,     // Multiplier when eating same item consecutively
  recentHistorySize: 5,   // Track last N items eaten per group

  // Buff thresholds
  buffStates: {
    malnourished: { min: 0, max: 2, effects: ['slowness'] },
    adequate:     { min: 3, max: 4, effects: [] },
    well_fed:     { min: 5, max: 6, effects: ['haste'] },
    balanced:     { min: 7, max: 7, effects: ['haste', 'strength'] },
    gourmet:      { min: 8, max: 8, effects: ['haste_2', 'strength', 'resistance'] }
  },

  // Buff refresh interval (every 30 seconds)
  buffInterval: 600
};

// ============================================================
// HELPER: Get/initialize player nutrition data
// ============================================================

function getNutritionData(player) {
  const data = player.persistentData;

  if (!data.contains(NUTRITION.dataKey)) {
    // Initialize all groups at 50 (neutral start)
    const nutData = {};
    NUTRITION.groups.forEach(g => { nutData[g] = 50; });
    data.putString(NUTRITION.dataKey, JSON.stringify(nutData));
    data.putString(NUTRITION.lastEatenKey, JSON.stringify({}));
  }

  try {
    return JSON.parse(data.getString(NUTRITION.dataKey));
  } catch (e) {
    const nutData = {};
    NUTRITION.groups.forEach(g => { nutData[g] = 50; });
    return nutData;
  }
}

function saveNutritionData(player, nutData) {
  player.persistentData.putString(NUTRITION.dataKey, JSON.stringify(nutData));
}

function getLastEaten(player) {
  try {
    return JSON.parse(player.persistentData.getString(NUTRITION.lastEatenKey));
  } catch (e) {
    return {};
  }
}

function saveLastEaten(player, lastEaten) {
  player.persistentData.putString(NUTRITION.lastEatenKey, JSON.stringify(lastEaten));
}

// ============================================================
// HELPER: Determine which nutrition group(s) a food belongs to
// ============================================================

function getFoodGroups(itemId) {
  const groups = [];

  // Check against tag prefixes (simplified — real tag checks require
  // server-side tag resolution which we approximate here)
  const groupMappings = {
    grains: ['bread', 'wheat', 'cookie', 'cake', 'pie', 'pasta', 'noodle', 'rice', 'dough', 'flour', 'tortilla', 'baguette', 'croissant', 'waffle', 'pancake', 'cereal', 'oat', 'corn', 'barley'],
    fruits: ['apple', 'berry', 'melon', 'grape', 'cherry', 'peach', 'pear', 'plum', 'banana', 'mango', 'orange', 'lemon', 'lime', 'coconut', 'pineapple', 'fig', 'date', 'kiwi', 'chorus_fruit', 'glow_berries', 'sweet_berries'],
    vegetables: ['carrot', 'potato', 'beetroot', 'onion', 'tomato', 'lettuce', 'cabbage', 'pumpkin', 'squash', 'turnip', 'radish', 'celery', 'pepper', 'eggplant', 'broccoli', 'cauliflower', 'spinach', 'artichoke', 'asparagus', 'zucchini', 'cucumber', 'salad'],
    proteins: ['beef', 'pork', 'chicken', 'mutton', 'rabbit', 'cod', 'salmon', 'steak', 'chop', 'bacon', 'ham', 'sausage', 'jerky', 'egg', 'fish', 'meat', 'shrimp', 'crab', 'clam', 'calamari', 'drumstick', 'ribs', 'roast'],
    dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'mozzarella', 'ice_cream'],
    sugars: ['sugar', 'honey', 'chocolate', 'candy', 'caramel', 'cookie', 'cake', 'pudding', 'tart', 'cupcake', 'brownie', 'donut', 'fudge', 'jam', 'jelly', 'syrup'],
    herbs_spices: ['vanilla', 'cinnamon', 'mint', 'basil', 'ginger', 'nutmeg', 'pepper', 'paprika', 'turmeric', 'herb', 'spice', 'tea_leaves', 'coffee_beans', 'lavender', 'saffron'],
    beverages: ['juice', 'tea', 'coffee', 'wine', 'beer', 'mead', 'rum', 'whiskey', 'cider', 'smoothie', 'lemonade', 'cocoa', 'potion', 'brew', 'ale', 'spirit', 'sake']
  };

  const lowerItem = itemId.toLowerCase();

  for (const [group, keywords] of Object.entries(groupMappings)) {
    for (const keyword of keywords) {
      if (lowerItem.includes(keyword)) {
        groups.push(group);
        break; // Only add group once
      }
    }
  }

  // Default: if no group matched but it's a food, count as proteins (meat is common)
  // Actually, return empty — unknown foods don't contribute to nutrition
  return groups;
}

// ============================================================
// HELPER: Count satisfied groups (satiety > 20)
// ============================================================

function countSatisfiedGroups(nutData) {
  let count = 0;
  NUTRITION.groups.forEach(g => {
    if ((nutData[g] || 0) > 20) count++;
  });
  return count;
}

// ============================================================
// HELPER: Get buff state name
// ============================================================

function getBuffState(satisfiedCount) {
  for (const [name, config] of Object.entries(NUTRITION.buffStates)) {
    if (satisfiedCount >= config.min && satisfiedCount <= config.max) {
      return name;
    }
  }
  return 'adequate';
}

// ============================================================
// FOOD EATEN: Update nutrition tracking
// ============================================================

ItemEvents.foodEaten(event => {
  const player = event.player;
  const item = event.item;
  if (!player || !item) return;

  const itemId = item.id;
  const groups = getFoodGroups(itemId);

  if (groups.length === 0) return; // Not a tracked food

  const nutData = getNutritionData(player);
  const lastEaten = getLastEaten(player);

  // Get quality multiplier from quality_tiers system
  let qualityMult = 1.0;
  if (item.nbt) {
    const q = item.nbt.getInt('horizons_quality') || 1;
    const multipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 2.25, 5: 2.5 };
    qualityMult = multipliers[q] || 1.0;
  }

  groups.forEach(group => {
    // Check diminishing returns
    let diminish = 1.0;
    const groupHistory = lastEaten[group] || [];
    const recentCount = groupHistory.filter(id => id === itemId).length;
    if (recentCount > 0) {
      diminish = Math.pow(NUTRITION.repeatPenalty, recentCount);
    }

    // Calculate gain
    const gain = Math.floor(NUTRITION.baseGain * qualityMult * diminish);

    // Apply
    const current = nutData[group] || 0;
    nutData[group] = Math.min(NUTRITION.maxSatiety, current + gain);

    // Update history
    groupHistory.push(itemId);
    if (groupHistory.length > NUTRITION.recentHistorySize) {
      groupHistory.shift();
    }
    lastEaten[group] = groupHistory;
  });

  saveNutritionData(player, nutData);
  saveLastEaten(player, lastEaten);

  // Show nutrition gain
  const satisfied = countSatisfiedGroups(nutData);
  const state = getBuffState(satisfied);

  if (groups.length > 0) {
    const groupNames = groups.map(g => g.replace('_', ' ')).join(', ');
    player.setStatusMessage(
      Text.of(`§7Nutrition: §f${groupNames} §7(${satisfied}/8 groups)`)
    );
  }
});

// ============================================================
// PERIODIC DECAY: Reduce satiety over time
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % NUTRITION.decayInterval !== 0) return;

  server.players.forEach(player => {
    const nutData = getNutritionData(player);
    let changed = false;

    NUTRITION.groups.forEach(group => {
      if (nutData[group] > 0) {
        nutData[group] = Math.max(0, nutData[group] - NUTRITION.decayPerMinute);
        changed = true;
      }
    });

    if (changed) {
      saveNutritionData(player, nutData);
    }
  });
});

// ============================================================
// PERIODIC BUFFS: Apply/remove effects based on nutrition state
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % NUTRITION.buffInterval !== 0) return;

  server.players.forEach(player => {
    const nutData = getNutritionData(player);
    const satisfied = countSatisfiedGroups(nutData);
    const state = getBuffState(satisfied);
    const name = player.username;

    // Clear previous nutrition effects (duration 35s so they expire between refreshes if state changes)
    // Apply new effects based on state
    switch (state) {
      case 'malnourished':
        server.runCommandSilent(`effect give ${name} minecraft:slowness 35 0 true`);
        // Remove positive effects
        server.runCommandSilent(`effect clear ${name} minecraft:haste`);
        server.runCommandSilent(`effect clear ${name} minecraft:strength`);
        server.runCommandSilent(`effect clear ${name} minecraft:resistance`);
        break;

      case 'adequate':
        // Clear all nutrition effects
        server.runCommandSilent(`effect clear ${name} minecraft:slowness`);
        server.runCommandSilent(`effect clear ${name} minecraft:haste`);
        server.runCommandSilent(`effect clear ${name} minecraft:strength`);
        server.runCommandSilent(`effect clear ${name} minecraft:resistance`);
        break;

      case 'well_fed':
        server.runCommandSilent(`effect clear ${name} minecraft:slowness`);
        server.runCommandSilent(`effect give ${name} minecraft:haste 35 0 true`);
        break;

      case 'balanced':
        server.runCommandSilent(`effect clear ${name} minecraft:slowness`);
        server.runCommandSilent(`effect give ${name} minecraft:haste 35 0 true`);
        server.runCommandSilent(`effect give ${name} minecraft:strength 35 0 true`);
        break;

      case 'gourmet':
        server.runCommandSilent(`effect clear ${name} minecraft:slowness`);
        server.runCommandSilent(`effect give ${name} minecraft:haste 35 1 true`); // Haste II
        server.runCommandSilent(`effect give ${name} minecraft:strength 35 0 true`);
        server.runCommandSilent(`effect give ${name} minecraft:resistance 35 0 true`);
        break;
    }

    // Grant nutrition stage milestones
    if (satisfied >= 5 && !player.stages.has('nutrition_well_fed')) {
      player.stages.add('nutrition_well_fed');
    }
    if (satisfied >= 7 && !player.stages.has('nutrition_balanced')) {
      player.stages.add('nutrition_balanced');
    }
    if (satisfied >= 8 && !player.stages.has('nutrition_gourmet')) {
      player.stages.add('nutrition_gourmet');
    }
  });
});

// ============================================================
// COMMAND: /horizons nutrition — view nutrition status
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('nutrition')
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;

          const nutData = getNutritionData(player);
          const satisfied = countSatisfiedGroups(nutData);
          const state = getBuffState(satisfied);

          player.tell('§e=== Nutrition Status ===');

          NUTRITION.groups.forEach(group => {
            const val = nutData[group] || 0;
            const bar = getBar(val, NUTRITION.maxSatiety);
            const displayName = group.replace('_', ' ');
            const name = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            const color = val > 60 ? '§a' : val > 20 ? '§e' : '§c';
            player.tell(`  ${color}${name}: ${bar} §7(${val}/${NUTRITION.maxSatiety})`);
          });

          const stateColors = {
            malnourished: '§c', adequate: '§7', well_fed: '§a',
            balanced: '§b', gourmet: '§6'
          };
          const stateDisplay = state.replace('_', ' ');
          player.tell(`§7Status: ${stateColors[state]}${stateDisplay.charAt(0).toUpperCase() + stateDisplay.slice(1)} §7(${satisfied}/8 groups satisfied)`);

          return 1;
        })
      )
  );
});

// Helper: visual bar
function getBar(value, max) {
  const filled = Math.floor((value / max) * 10);
  const empty = 10 - filled;
  return '§a' + '|'.repeat(filled) + '§8' + '|'.repeat(empty);
}

console.log('[Horizons] Nutrition System loaded');
console.log('[Horizons] Tracking 8 food groups with diminishing returns + quality scaling');
