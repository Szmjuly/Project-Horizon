// ============================================================
// Project Horizons — Pathfinder Leveling System
// ============================================================
// File: kubejs/server_scripts/progression/pathfinder_levels.js
// Phase: 2
// Dependencies: KubeJS, reward_handlers.js, AStages
// Docs: HORIZONS_INTEGRATIONS.md Section 3.3
// ============================================================
//
// PURPOSE:
// Players earn Pathfinder XP from ALL activities — combat, crafting,
// farming, exploring, Cobblemon battles, quest completion.
// XP accumulates into Pathfinder Levels which grant Perk Points.
//
// PERK TREES (100 points each, managed by Pufferfish Skills):
//   Vanguard    — combat, defense, HP
//   Artificer   — crafting, engineering, Create mastery
//   Cultivator  — farming, brewing, nutrition, MineColonies
//   Wayfinder   — exploration, Cobblemon, space travel
//
// LEVEL CURVE: baseXP * (level ^ 1.5)
//   Level 1: 100 XP, Level 5: 1118 XP, Level 10: 3162 XP
//   Level 25: 12500 XP, Level 50: 35355 XP, Level 100: 100000 XP
// ============================================================

const PATHFINDER = {
  xpKey: 'horizons_pathfinder_xp',
  levelKey: 'horizons_pathfinder_level',
  sessionXpKey: 'horizons_session_xp',
  baseXP: 100,
  exponent: 1.5,
  maxLevel: 100,
  pointsPerLevel: 1,
  bonusPointLevels: [10, 25, 50, 75, 100],

  xpSources: {
    mob_kill: 5, mob_kill_boss: 50,
    craft_item: 2, smelt_item: 2, eat_food: 3,
    cobblemon_catch: 15, cobblemon_battle_win: 10,
    quest_complete: 25, biome_discover: 20, trade: 5
  },

  diminishThreshold: 50,
  diminishFactor: 0.5
};

function xpForLevel(level) {
  return level <= 0 ? 0 : Math.floor(PATHFINDER.baseXP * Math.pow(level, PATHFINDER.exponent));
}

function getPathfinderXP(player) { return player.persistentData.getInt(PATHFINDER.xpKey) || 0; }
function getPathfinderLevel(player) { return player.persistentData.getInt(PATHFINDER.levelKey) || 0; }

function grantPathfinderXP(player, source, amount) {
  if (!player || !amount) return;

  let sessionData;
  try { sessionData = JSON.parse(player.persistentData.getString(PATHFINDER.sessionXpKey) || '{}'); }
  catch (e) { sessionData = {}; }

  const sourceCount = (sessionData[source] || 0) + 1;
  sessionData[source] = sourceCount;
  let finalAmount = amount;
  if (sourceCount > PATHFINDER.diminishThreshold) {
    finalAmount = Math.max(1, Math.floor(amount * PATHFINDER.diminishFactor));
  }
  player.persistentData.putString(PATHFINDER.sessionXpKey, JSON.stringify(sessionData));

  let currentXP = getPathfinderXP(player) + finalAmount;
  let currentLevel = getPathfinderLevel(player);
  let levelsGained = 0;

  while (currentLevel < PATHFINDER.maxLevel) {
    const required = xpForLevel(currentLevel + 1);
    if (currentXP >= required) {
      currentXP -= required;
      currentLevel++;
      levelsGained++;
    } else break;
  }

  player.persistentData.putInt(PATHFINDER.xpKey, currentXP);
  player.persistentData.putInt(PATHFINDER.levelKey, currentLevel);

  if (levelsGained > 0) {
    for (let i = 0; i < levelsGained; i++) {
      const newLevel = currentLevel - levelsGained + i + 1;
      let points = PATHFINDER.pointsPerLevel;
      if (PATHFINDER.bonusPointLevels.includes(newLevel)) points += 1;

      player.server.runCommandSilent(`horizons reward perkpoints ${points}`);
      player.tell(`\u00a76[Horizons] \u00a7eLEVEL UP! \u00a7fPathfinder Level ${newLevel}!`);
      player.tell(`\u00a77  +${points} Perk Point${points > 1 ? 's' : ''}`);
      player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username}`);

      if (newLevel >= 5) player.stages.add('level_5');
      if (newLevel >= 10) player.stages.add('level_10');
      if (newLevel >= 25) player.stages.add('level_25');
      if (newLevel >= 50) player.stages.add('level_50');
    }
  }
}

// XP from crafting
ItemEvents.crafted(event => {
  if (event.player && !event.player.isFake()) grantPathfinderXP(event.player, 'craft_item', PATHFINDER.xpSources.craft_item);
});

// XP from smelting
ItemEvents.smelted(event => {
  if (event.player && !event.player.isFake()) grantPathfinderXP(event.player, 'smelt_item', PATHFINDER.xpSources.smelt_item);
});

// XP from eating
ItemEvents.foodEaten(event => {
  if (event.player) grantPathfinderXP(event.player, 'eat_food', PATHFINDER.xpSources.eat_food);
});

// Reset session diminishing returns on login
PlayerEvents.loggedIn(event => {
  event.player.persistentData.putString(PATHFINDER.sessionXpKey, '{}');
});

// Command: /horizons level
ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;
  event.register(
    Commands.literal('horizons').then(Commands.literal('level').executes(ctx => {
      const player = ctx.source.player;
      if (!player) return 0;
      const level = getPathfinderLevel(player);
      const xp = getPathfinderXP(player);
      const needed = xpForLevel(level + 1);
      const pct = needed > 0 ? Math.floor((xp / needed) * 100) : 100;
      const filled = Math.floor((xp / Math.max(needed, 1)) * 20);
      const bar = '\u00a7a' + '='.repeat(Math.min(filled, 20)) + '\u00a78' + '='.repeat(Math.max(20 - filled, 0));
      player.tell('\u00a7e=== Pathfinder Level ===');
      player.tell(`\u00a77Level: \u00a7f${level}/${PATHFINDER.maxLevel}`);
      player.tell(`\u00a77XP: \u00a7f${xp}/${needed} \u00a77(${pct}%)`);
      player.tell(`\u00a77Progress: ${bar}`);
      return 1;
    }).then(Commands.literal('grantxp').requires(src => src.hasPermission(2))
      .then(Commands.argument('amount', event.getArguments().INTEGER.create(event)).executes(ctx => {
        const player = ctx.source.player;
        if (!player) return 0;
        grantPathfinderXP(player, 'admin', event.getArguments().INTEGER.getResult(ctx, 'amount'));
        return 1;
      }))
    ))
  );
});

console.log('[Horizons] Pathfinder Leveling loaded');
