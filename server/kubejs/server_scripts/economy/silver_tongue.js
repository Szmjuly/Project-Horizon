// ============================================================
// Project Horizons — Silver Tongue (Villager Trade Reroll)
// ============================================================
// File: kubejs/server_scripts/economy/silver_tongue.js
// Phase: 2
// Dependencies: KubeJS, Lightman's Currency, AStages
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Allows players to reroll villager trades using the Merchant's
// Ledger item. Requires the "skill_silver_tongue" stage to be
// unlocked (granted via the Merchant Prince quest chain).
//
// MECHANICS:
//   1. Player crafts Merchant's Ledger (paper + ink + gold coin)
//   2. Player completes Silver Tongue quest → gets stage
//   3. Sneak + right-click villager with Ledger → reroll trades
//   4. Costs 1 gold coin per reroll (consumed from inventory)
//   5. 20-minute cooldown per villager (tracked via entity data)
//   6. Higher faction reputation = bonus "quality" message
//
// COMMANDS:
//   /horizons silvertongue [status|cooldown]
// ============================================================

// --- Configuration ---
var SILVER_CONFIG = {
  // Stage required to use the Silver Tongue ability
  requiredStage: 'skill_silver_tongue',

  // Item the player must hold
  ledgerItem: 'horizons:merchants_ledger',

  // Cost per reroll (Lightman's Currency gold coin)
  costItem: 'lightmanscurrency:coin_gold',
  costAmount: 1,

  // Cooldown in ticks (20 min = 24000 ticks)
  cooldownTicks: 24000,

  // Entity persistent data key for cooldown tracking
  cooldownKey: 'horizons_reroll_cooldown',

  // Reputation thresholds for bonus messages
  repFriendly: 100,
  repTrusted: 500,

  // Debug logging
  debug: false
};

// ============================================================
// INTERACTION HANDLER — Sneak + Right-click Villager
// ============================================================

ItemEvents.entityInteracted(SILVER_CONFIG.ledgerItem, function(event) {
  var player = event.player;
  var entity = event.target;

  // Must be sneaking
  if (!player.crouching) return;

  // Must be a villager (not a wandering trader — they have their own system)
  var entityType = String(entity.type);
  if (entityType !== 'minecraft:villager') {
    if (SILVER_CONFIG.debug) {
      console.log('[Silver Tongue] Not a villager: ' + entityType);
    }
    return;
  }

  // Cancel the default interaction (opening trade GUI)
  event.cancel();

  // --- Stage Check ---
  if (!player.stages.has(SILVER_CONFIG.requiredStage)) {
    player.tell([
      { text: '[', color: 'gray' },
      { text: 'Silver Tongue', color: 'gold' },
      { text: '] ', color: 'gray' },
      { text: 'You have not yet mastered the art of negotiation. ', color: 'red' },
      { text: 'Complete the ', color: 'gray' },
      { text: 'Silver Tongue', color: 'yellow', italic: true },
      { text: ' quest to unlock trade rerolling.', color: 'gray' }
    ]);
    return;
  }

  // --- Cooldown Check ---
  var now = entity.level.gameTime;
  var lastReroll = entity.persistentData.getLong(SILVER_CONFIG.cooldownKey) || 0;
  var elapsed = now - lastReroll;

  if (lastReroll > 0 && elapsed < SILVER_CONFIG.cooldownTicks) {
    var remainingTicks = SILVER_CONFIG.cooldownTicks - elapsed;
    var remainingMinutes = Math.ceil(remainingTicks / 1200);
    player.tell([
      { text: '[', color: 'gray' },
      { text: 'Silver Tongue', color: 'gold' },
      { text: '] ', color: 'gray' },
      { text: 'This villager is still considering your last offer. ', color: 'yellow' },
      { text: 'Try again in ~' + remainingMinutes + ' minute' + (remainingMinutes !== 1 ? 's' : '') + '.', color: 'gray' }
    ]);
    return;
  }

  // --- Gold Coin Cost Check ---
  var inventory = player.inventory;
  var goldCoins = 0;
  var goldSlot = -1;

  for (var i = 0; i < inventory.size; i++) {
    var stack = inventory.getStackInSlot(i);
    if (stack && stack.id === SILVER_CONFIG.costItem) {
      goldCoins += stack.count;
      if (goldSlot === -1) goldSlot = i;
    }
  }

  if (goldCoins < SILVER_CONFIG.costAmount) {
    player.tell([
      { text: '[', color: 'gray' },
      { text: 'Silver Tongue', color: 'gold' },
      { text: '] ', color: 'gray' },
      { text: 'You need ' + SILVER_CONFIG.costAmount + ' gold coin' + (SILVER_CONFIG.costAmount > 1 ? 's' : '') + ' to renegotiate trades.', color: 'red' }
    ]);
    return;
  }

  // --- Consume Gold Coin ---
  var removed = 0;
  for (var j = 0; j < inventory.size && removed < SILVER_CONFIG.costAmount; j++) {
    var stack2 = inventory.getStackInSlot(j);
    if (stack2 && stack2.id === SILVER_CONFIG.costItem) {
      var toRemove = Math.min(stack2.count, SILVER_CONFIG.costAmount - removed);
      stack2.shrink(toRemove);
      removed += toRemove;
    }
  }

  // --- Reroll Trades ---
  // Clear the villager's current trade offers and force a restock.
  // In 1.21+ the NBT paths are lowercase: offers.Recipes, last_restock, restocks_today
  // Try both formats for compatibility (data commands fail silently if path doesn't exist)
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' Offers set value {Recipes:[]}'
  );
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' offers set value {Recipes:[]}'
  );

  // Force the villager to restock
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' LastRestock set value 0'
  );
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' last_restock set value 0'
  );
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' RestocksToday set value 0'
  );
  player.server.runCommandSilent(
    'data modify entity ' + entity.uuid + ' restocks_today set value 0'
  );

  // Record cooldown on the entity
  entity.persistentData.putLong(SILVER_CONFIG.cooldownKey, now);

  // --- Reputation Bonus Flavor ---
  var repBonus = '';
  try {
    var repScore = player.persistentData.getInt('rep_plains') || 0;
    // Check all factions, use highest
    var factions = ['plains', 'forest', 'mountain', 'coastal', 'skyborn'];
    var maxRep = 0;
    var maxFaction = '';
    for (var f = 0; f < factions.length; f++) {
      var r = player.persistentData.getInt('rep_' + factions[f]) || 0;
      if (r > maxRep) {
        maxRep = r;
        maxFaction = factions[f];
      }
    }
    if (maxRep >= SILVER_CONFIG.repTrusted) {
      repBonus = ' Your reputation as a Trusted ally of the ' + maxFaction.charAt(0).toUpperCase() + maxFaction.slice(1) + ' kingdom precedes you!';
    } else if (maxRep >= SILVER_CONFIG.repFriendly) {
      repBonus = ' The villager recognizes your good standing with the ' + maxFaction.charAt(0).toUpperCase() + maxFaction.slice(1) + ' faction.';
    }
  } catch(e) {
    // Faction rep not available, skip bonus
  }

  // --- Success Message ---
  player.tell([
    { text: '[', color: 'gray' },
    { text: 'Silver Tongue', color: 'gold' },
    { text: '] ', color: 'gray' },
    { text: 'You persuade the villager to reconsider their offerings.', color: 'green' }
  ]);

  if (repBonus) {
    player.tell([
      { text: '[', color: 'gray' },
      { text: 'Silver Tongue', color: 'gold' },
      { text: '] ', color: 'gray' },
      { text: repBonus, color: 'aqua', italic: true }
    ]);
  }

  // Play a sound effect
  player.server.runCommandSilent(
    'playsound minecraft:entity.villager.trade master ' + player.username + ' ~ ~ ~ 1 1.2'
  );
  player.server.runCommandSilent(
    'playsound minecraft:entity.experience_orb.pickup master ' + player.username + ' ~ ~ ~ 0.5 1.5'
  );

  // Particles
  player.server.runCommandSilent(
    'particle minecraft:happy_villager ' +
    entity.x + ' ' + (entity.y + 1.5) + ' ' + entity.z +
    ' 0.3 0.3 0.3 0.1 8'
  );

  if (SILVER_CONFIG.debug) {
    console.log('[Silver Tongue] ' + player.username + ' rerolled trades for villager ' + entity.uuid);
  }
});

// ============================================================
// CRAFTING RECIPE — Merchant's Ledger
// ============================================================

ServerEvents.recipes(function(event) {
  event.shaped('horizons:merchants_ledger', [
    ' G ',
    'PBP',
    ' I '
  ], {
    G: 'lightmanscurrency:coin_gold',
    P: 'minecraft:paper',
    B: 'minecraft:book',
    I: 'minecraft:ink_sac'
  }).id('horizons:silver_tongue/merchants_ledger');

  console.log('[Horizons] Silver Tongue recipes registered');
});

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(function(event) {
  var Commands = event.commands;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('silvertongue')
        .then(Commands.literal('status')
          .executes(function(ctx) {
            var player = ctx.source.player;
            var hasSkill = player.stages.has(SILVER_CONFIG.requiredStage);
            var hasLedger = false;

            for (var i = 0; i < player.inventory.size; i++) {
              var stack = player.inventory.getStackInSlot(i);
              if (stack && stack.id === SILVER_CONFIG.ledgerItem) {
                hasLedger = true;
                break;
              }
            }

            player.tell([
              { text: '=== Silver Tongue Status ===', color: 'gold', bold: true }
            ]);
            player.tell([
              { text: 'Skill unlocked: ', color: 'gray' },
              { text: hasSkill ? 'Yes' : 'No', color: hasSkill ? 'green' : 'red' }
            ]);
            player.tell([
              { text: "Merchant's Ledger: ", color: 'gray' },
              { text: hasLedger ? 'In inventory' : 'Not found', color: hasLedger ? 'green' : 'yellow' }
            ]);
            player.tell([
              { text: 'Reroll cost: ', color: 'gray' },
              { text: SILVER_CONFIG.costAmount + ' gold coin(s)', color: 'yellow' }
            ]);
            player.tell([
              { text: 'Cooldown: ', color: 'gray' },
              { text: (SILVER_CONFIG.cooldownTicks / 1200) + ' minutes per villager', color: 'yellow' }
            ]);
            player.tell([
              { text: 'Usage: ', color: 'gray' },
              { text: 'Sneak + right-click a villager while holding the Ledger', color: 'white' }
            ]);

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Silver Tongue system loaded');
