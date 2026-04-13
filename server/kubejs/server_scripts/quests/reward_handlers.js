// ============================================================
// Project Horizons — Quest Reward Handlers
// ============================================================
// File: kubejs/server_scripts/quests/reward_handlers.js
// Phase: 1
// Dependencies: FTB Quests, AStages, ProgressiveStages, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md Section 3.1
// ============================================================
//
// PURPOSE:
// Custom reward types for FTB Quests that go beyond items/XP.
// Called when quests are completed to grant:
//   - Pathfinder Perk Points
//   - Stage unlocks (via bridge to both AStages + ProgressiveStages)
//   - Faction reputation changes
//   - Kingdom currency
//   - Precursor tokens
//   - Crime Stat modifications
//   - Custom titles/effects
//
// USAGE IN FTB QUESTS:
//   Set quest rewards to "Command" type, then use:
//   /horizons reward perkpoints <amount>
//   /horizons reward stage <stage_name>
//   /horizons reward reputation <faction> <amount>
//   /horizons reward currency <type> <amount>
//   /horizons reward title <title_key>
// ============================================================

// --- Reward Configuration ---
const REWARDS = {
  // Perk point tracking NBT key
  perkPointsKey: 'horizons_perk_points',
  perkPointsSpentKey: 'horizons_perk_points_spent',

  // Faction IDs
  factions: ['plains', 'forest', 'mountain', 'coastal', 'skyborn', 'wanderer'],

  // Reputation scoreboard prefix
  repScoreboardPrefix: 'horizons_rep_',

  // Kingdom currency types
  currencies: {
    lightman: 'lightmanscurrency:coin_gold',     // Universal
    plains: 'horizons:currency_plains',           // Custom items (Phase 2)
    forest: 'horizons:currency_forest',
    mountain: 'horizons:currency_mountain',
    coastal: 'horizons:currency_coastal',
    skyborn: 'horizons:currency_skyborn'
  },

  // Titles (stored as stages)
  titles: {
    pathfinder: 'title_pathfinder',
    explorer: 'title_explorer',
    champion: 'title_champion',
    merchant: 'title_merchant_prince',
    cultivator: 'title_master_cultivator',
    architect: 'title_architect'
  }
};

// ============================================================
// PERK POINTS — Pathfinder leveling currency
// ============================================================

function grantPerkPoints(player, amount) {
  const data = player.persistentData;
  const current = data.getInt(REWARDS.perkPointsKey) || 0;
  const newTotal = current + amount;
  data.putInt(REWARDS.perkPointsKey, newTotal);

  player.tell(`§a[Horizons] +${amount} Perk Point${amount > 1 ? 's' : ''}! §7(Total: ${newTotal})`);

  // Milestone stages for perk point thresholds
  if (newTotal >= 10 && !player.stages.has('perk_milestone_10')) {
    player.stages.add('perk_milestone_10');
  }
  if (newTotal >= 25 && !player.stages.has('perk_milestone_25')) {
    player.stages.add('perk_milestone_25');
  }
  if (newTotal >= 50 && !player.stages.has('perk_milestone_50')) {
    player.stages.add('perk_milestone_50');
  }
  if (newTotal >= 100 && !player.stages.has('perk_milestone_100')) {
    player.stages.add('perk_milestone_100');
  }

  return newTotal;
}

function getPerkPoints(player) {
  return player.persistentData.getInt(REWARDS.perkPointsKey) || 0;
}

function getSpentPerkPoints(player) {
  return player.persistentData.getInt(REWARDS.perkPointsSpentKey) || 0;
}

function getAvailablePerkPoints(player) {
  return getPerkPoints(player) - getSpentPerkPoints(player);
}

// ============================================================
// STAGE GRANTS — Unified stage system
// Uses the stage bridge to sync both AStages + ProgressiveStages
// ============================================================

function grantStage(player, stageName) {
  if (player.stages.has(stageName)) {
    return false; // Already has this stage
  }

  player.stages.add(stageName);
  // The stage_bridge.js listener will auto-sync to ProgressiveStages

  const prefix = stageName.split('_')[0];
  let category = 'Progression';
  switch (prefix) {
    case 'act': category = 'Story'; break;
    case 'path': category = 'Path'; break;
    case 'gate': category = 'Gate'; break;
    case 'unlock': category = 'Unlock'; break;
    case 'rep': category = 'Reputation'; break;
    case 'crime': category = 'Crime'; break;
    case 'ascend': category = 'Ascension'; break;
    case 'title': category = 'Title'; break;
  }

  player.tell(`§e[Horizons] §7${category} unlocked: §f${stageName.replace(/_/g, ' ')}`);
  return true;
}

// ============================================================
// FACTION REPUTATION — Scoreboard-based tracking
// ============================================================

function changeReputation(player, faction, amount) {
  if (!REWARDS.factions.includes(faction)) {
    console.warn(`[Horizons] Unknown faction: ${faction}`);
    return;
  }

  const objective = `${REWARDS.repScoreboardPrefix}${faction}`;
  const server = player.server;
  const playerName = player.username;

  // Ensure scoreboard objective exists
  server.runCommandSilent(`scoreboard objectives add ${objective} dummy`);

  // Add to score
  if (amount >= 0) {
    server.runCommandSilent(`scoreboard players add ${playerName} ${objective} ${amount}`);
  } else {
    server.runCommandSilent(`scoreboard players remove ${playerName} ${objective} ${Math.abs(amount)}`);
  }

  // Display change
  const sign = amount >= 0 ? '+' : '';
  const color = amount >= 0 ? '§a' : '§c';
  const factionName = faction.charAt(0).toUpperCase() + faction.slice(1);
  player.tell(`${color}[Horizons] ${sign}${amount} reputation with ${factionName} faction`);

  // Check reputation milestones and grant stages
  // We need to read the current score to check thresholds
  const data = player.persistentData;
  const repKey = `rep_${faction}`;
  const currentRep = (data.getInt(repKey) || 0) + amount;
  data.putInt(repKey, currentRep);

  if (currentRep >= 100 && !player.stages.has(`rep_${faction}_friendly`)) {
    player.stages.add(`rep_${faction}_friendly`);
    player.tell(`§e[Horizons] §7Reached §fFriendly §7status with ${factionName}!`);
  }
  if (currentRep >= 500 && !player.stages.has(`rep_${faction}_trusted`)) {
    player.stages.add(`rep_${faction}_trusted`);
    player.tell(`§e[Horizons] §7Reached §fTrusted §7status with ${factionName}!`);
  }
  if (currentRep >= 1000 && !player.stages.has(`rep_${faction}_allied`)) {
    player.stages.add(`rep_${faction}_allied`);
    player.tell(`§e[Horizons] §7Reached §6Allied §7status with ${factionName}!`);
  }
}

// ============================================================
// CURRENCY GRANTS — Give Lightman's coins or kingdom currency
// ============================================================

function grantCurrency(player, type, amount) {
  if (type === 'lightman' || type === 'coins') {
    // Give Lightman's gold coins
    player.server.runCommandSilent(
      `give ${player.username} lightmanscurrency:coin_gold ${amount}`
    );
    player.tell(`§e[Horizons] §7Received §6${amount} gold coin${amount > 1 ? 's' : ''}`);
  } else if (type === 'precursor') {
    // Precursor tokens (custom items, Phase 2)
    player.tell(`§5[Horizons] §7Received §d${amount} Precursor Token${amount > 1 ? 's' : ''}`);
    // TODO: Give actual precursor token items once startup_scripts/items/horizons_items.js is implemented
  } else if (REWARDS.currencies[type]) {
    // Kingdom currencies (Phase 2 custom items)
    player.tell(`§e[Horizons] §7Received §f${amount} ${type} currency`);
    // TODO: Give actual kingdom currency items once implemented
  } else {
    console.warn(`[Horizons] Unknown currency type: ${type}`);
  }
}

// ============================================================
// CRIME STAT — Modify player's crime rating
// ============================================================

function modifyCrimeStat(player, change) {
  const data = player.persistentData;
  const current = data.getInt('horizons_crime_stat') || 0;
  const newStat = Math.max(0, Math.min(6, current + change));
  data.putInt('horizons_crime_stat', newStat);

  if (change > 0) {
    player.tell(`§c[Horizons] Crime Stat increased to ${newStat}`);
  } else if (change < 0) {
    player.tell(`§a[Horizons] Crime Stat decreased to ${newStat}`);
  }

  // Update crime stages
  for (let i = 1; i <= 6; i++) {
    if (newStat >= i) {
      if (!player.stages.has(`crime_level_${i}`)) {
        player.stages.add(`crime_level_${i}`);
      }
    } else {
      if (player.stages.has(`crime_level_${i}`)) {
        player.stages.remove(`crime_level_${i}`);
      }
    }
  }

  // Special stages
  if (newStat >= 4 && !player.stages.has('crime_outlaw')) {
    player.stages.add('crime_outlaw');
    player.tell('§4[Horizons] You are now an OUTLAW!');
  } else if (newStat < 4 && player.stages.has('crime_outlaw')) {
    player.stages.remove('crime_outlaw');
  }

  return newStat;
}

// ============================================================
// COMMAND REGISTRATION — /horizons reward
// Used by FTB Quests "Command" reward type
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('reward')
        // Perk Points
        .then(Commands.literal('perkpoints')
          .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');
              grantPerkPoints(player, amount);
              return 1;
            })
          )
        )
        // Stage grant
        .then(Commands.literal('stage')
          .then(Commands.argument('name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const name = event.getArguments().STRING.getResult(ctx, 'name');
              grantStage(player, name);
              return 1;
            })
          )
        )
        // Reputation
        .then(Commands.literal('reputation')
          .then(Commands.argument('faction', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;
                const faction = event.getArguments().STRING.getResult(ctx, 'faction');
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');
                changeReputation(player, faction, amount);
                return 1;
              })
            )
          )
        )
        // Currency
        .then(Commands.literal('currency')
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;
                const type = event.getArguments().STRING.getResult(ctx, 'type');
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');
                grantCurrency(player, type, amount);
                return 1;
              })
            )
          )
        )
        // Crime stat
        .then(Commands.literal('crimestat')
          .then(Commands.argument('change', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const change = event.getArguments().INTEGER.getResult(ctx, 'change');
              modifyCrimeStat(player, change);
              return 1;
            })
          )
        )
        // Status — show all reward stats
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;
            const data = player.persistentData;

            player.tell('§e=== Horizons Status ===');
            player.tell(`§7Perk Points: §f${getAvailablePerkPoints(player)} §7(${getPerkPoints(player)} earned, ${getSpentPerkPoints(player)} spent)`);

            for (const faction of REWARDS.factions) {
              const rep = data.getInt(`rep_${faction}`) || 0;
              const fName = faction.charAt(0).toUpperCase() + faction.slice(1);
              let rank = '§8Neutral';
              if (rep >= 1000) rank = '§6Allied';
              else if (rep >= 500) rank = '§aTrusted';
              else if (rep >= 100) rank = '§eFriendly';
              else if (rep < -100) rank = '§cHostile';
              player.tell(`§7  ${fName}: ${rank} §7(${rep})`);
            }

            const crimeStat = data.getInt('horizons_crime_stat') || 0;
            const crimeColor = crimeStat >= 4 ? '§c' : crimeStat >= 2 ? '§e' : '§a';
            player.tell(`§7Crime Stat: ${crimeColor}${crimeStat}/6`);

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize reward data
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  // Initialize if first login
  if (!data.contains(REWARDS.perkPointsKey)) {
    data.putInt(REWARDS.perkPointsKey, 0);
    data.putInt(REWARDS.perkPointsSpentKey, 0);
    data.putInt('horizons_crime_stat', 0);

    // Grant starting stage
    if (!player.stages.has('act_1_started')) {
      player.stages.add('act_1_started');
    }

    player.tell('§e[Horizons] §7Welcome, Pathfinder. Your journey begins.');
    player.tell('§7Use §f/horizons reward status §7to check your progress.');
  }
});

console.log('[Horizons] Quest Reward Handlers loaded');
console.log('[Horizons] Commands: /horizons reward [perkpoints|stage|reputation|currency|crimestat|status]');
