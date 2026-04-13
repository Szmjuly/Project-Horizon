// ============================================================
// Project Horizons — Player Events
// ============================================================
// File: kubejs/server_scripts/world/player_events.js
// Phase: 4
// Dependencies: KubeJS, pathfinder_levels.js, reward_handlers.js
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Tracks personal milestones for each player and triggers celebration
// events when thresholds are reached. Milestones include first-time
// achievements and cumulative count milestones.
//
// MILESTONES:
//   First: mob kill, cobblemon catch, gate clear, trade, brew
//   Kill counts: 100, 500, 1000
//   Cobblemon catches: 10, 50, 100
//   Gate floors: 10, 25, 50, 100
//
// COMMANDS:
//   /horizons milestones — show all milestone progress
// ============================================================

// --- Milestone Definitions ---
const MILESTONES_FIRST = [
  { id: 'first_mob_kill', dataKey: 'horizons_mob_kills', threshold: 1,
    title: 'First Blood', desc: 'Defeated your first hostile mob!', stage: 'milestone_first_kill', xp: 15 },
  { id: 'first_cobblemon_catch', dataKey: 'horizons_cobblemon_catches', threshold: 1,
    title: 'Apprentice Trainer', desc: 'Caught your first Cobblemon!', stage: 'milestone_first_catch', xp: 20 },
  { id: 'first_gate_clear', dataKey: 'horizons_gate_clears', threshold: 1,
    title: 'Gate Runner', desc: 'Cleared your first dungeon gate!', stage: 'milestone_first_gate', xp: 25 },
  { id: 'first_trade', dataKey: 'horizons_trades', threshold: 1,
    title: 'Merchant\'s Handshake', desc: 'Completed your first trade!', stage: 'milestone_first_trade', xp: 10 },
  { id: 'first_brew', dataKey: 'horizons_brews', threshold: 1,
    title: 'Budding Alchemist', desc: 'Brewed your first potion!', stage: 'milestone_first_brew', xp: 15 }
];

const MILESTONES_COUNT = [
  // Kill milestones
  { id: 'kills_100', dataKey: 'horizons_mob_kills', threshold: 100,
    title: 'Centurion', desc: '100 hostile mobs defeated!', stage: 'milestone_kills_100', xp: 50 },
  { id: 'kills_500', dataKey: 'horizons_mob_kills', threshold: 500,
    title: 'Slayer', desc: '500 hostile mobs defeated!', stage: 'milestone_kills_500', xp: 100 },
  { id: 'kills_1000', dataKey: 'horizons_mob_kills', threshold: 1000,
    title: 'Warbringer', desc: '1000 hostile mobs defeated!', stage: 'milestone_kills_1000', xp: 200 },

  // Cobblemon catch milestones
  { id: 'catches_10', dataKey: 'horizons_cobblemon_catches', threshold: 10,
    title: 'Collector', desc: '10 Cobblemon caught!', stage: 'milestone_catches_10', xp: 30 },
  { id: 'catches_50', dataKey: 'horizons_cobblemon_catches', threshold: 50,
    title: 'Seasoned Trainer', desc: '50 Cobblemon caught!', stage: 'milestone_catches_50', xp: 75 },
  { id: 'catches_100', dataKey: 'horizons_cobblemon_catches', threshold: 100,
    title: 'Master Trainer', desc: '100 Cobblemon caught!', stage: 'milestone_catches_100', xp: 150 },

  // Gate floor milestones
  { id: 'gates_10', dataKey: 'horizons_gate_clears', threshold: 10,
    title: 'Dungeon Diver', desc: '10 gate floors cleared!', stage: 'milestone_gates_10', xp: 40 },
  { id: 'gates_25', dataKey: 'horizons_gate_clears', threshold: 25,
    title: 'Abyssal Explorer', desc: '25 gate floors cleared!', stage: 'milestone_gates_25', xp: 80 },
  { id: 'gates_50', dataKey: 'horizons_gate_clears', threshold: 50,
    title: 'Gate Master', desc: '50 gate floors cleared!', stage: 'milestone_gates_50', xp: 150 },
  { id: 'gates_100', dataKey: 'horizons_gate_clears', threshold: 100,
    title: 'Void Conqueror', desc: '100 gate floors cleared!', stage: 'milestone_gates_100', xp: 300 }
];

const ALL_MILESTONES = MILESTONES_FIRST.concat(MILESTONES_COUNT);

// --- Milestone check function ---
function checkMilestones(player) {
  const data = player.persistentData;
  let newMilestones = 0;

  for (let i = 0; i < ALL_MILESTONES.length; i++) {
    const ms = ALL_MILESTONES[i];

    // Skip already earned
    if (player.stages.has(ms.stage)) continue;

    // Check threshold
    const current = data.getInt(ms.dataKey) || 0;
    if (current >= ms.threshold) {
      // Milestone reached!
      player.stages.add(ms.stage);
      newMilestones++;

      // Celebration
      player.tell('');
      player.tell('\u00a7e\u00a7l\u2605 MILESTONE ACHIEVED \u2605');
      player.tell('\u00a76' + ms.title);
      player.tell('\u00a77' + ms.desc);
      player.tell('\u00a7a+' + ms.xp + ' Pathfinder XP');
      player.tell('');

      // Grant XP
      player.server.runCommandSilent('horizons level grantxp ' + ms.xp);

      // Play celebration sound
      player.server.runCommandSilent('playsound minecraft:ui.toast.challenge_complete player ' + player.username);

      // Title display
      player.server.runCommandSilent('title ' + player.username + ' subtitle {"text":"' + ms.title + '","color":"gold"}');
      player.server.runCommandSilent('title ' + player.username + ' title {"text":"Milestone!","color":"yellow"}');

      console.log('[Horizons/Milestones] ' + player.username + ' earned: ' + ms.title);
    }
  }

  return newMilestones;
}

// --- Increment a counter and check milestones ---
function incrementCounter(player, dataKey, amount) {
  const data = player.persistentData;
  const current = (data.getInt(dataKey) || 0) + amount;
  data.putInt(dataKey, current);
  checkMilestones(player);
  return current;
}

// ============================================================
// EVENT LISTENERS — Track player activities
// ============================================================

// Track mob kills
EntityEvents.death(event => {
  const entity = event.entity;
  const source = event.source;
  if (!source || !source.player) return;
  const player = source.player;
  if (player.isFake()) return;

  // Only count hostile mobs
  if (entity.type === 'minecraft:player') return;

  incrementCounter(player, 'horizons_mob_kills', 1);
});

// Track crafting (as proxy for brewing — potions are crafted)
ItemEvents.crafted(event => {
  const player = event.player;
  if (!player || player.isFake()) return;

  // Check if it's a potion
  const itemId = event.item.id;
  if (itemId === 'minecraft:potion' || itemId === 'minecraft:splash_potion' || itemId === 'minecraft:lingering_potion') {
    incrementCounter(player, 'horizons_brews', 1);
  }
});

// ============================================================
// COMMANDS — Increment counters for activities tracked via commands
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('milestones')
        // /horizons milestones — show all progress
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;
          const data = player.persistentData;

          player.tell('\u00a7e=== Milestone Progress ===');

          // Group by category
          player.tell('');
          player.tell('\u00a76--- Combat ---');
          const kills = data.getInt('horizons_mob_kills') || 0;
          player.tell('\u00a77Mob Kills: \u00a7f' + kills);
          showMilestoneProgress(player, 'horizons_mob_kills', [
            { threshold: 1, name: 'First Blood' },
            { threshold: 100, name: 'Centurion' },
            { threshold: 500, name: 'Slayer' },
            { threshold: 1000, name: 'Warbringer' }
          ]);

          player.tell('');
          player.tell('\u00a7b--- Cobblemon ---');
          const catches = data.getInt('horizons_cobblemon_catches') || 0;
          player.tell('\u00a77Cobblemon Caught: \u00a7f' + catches);
          showMilestoneProgress(player, 'horizons_cobblemon_catches', [
            { threshold: 1, name: 'Apprentice Trainer' },
            { threshold: 10, name: 'Collector' },
            { threshold: 50, name: 'Seasoned Trainer' },
            { threshold: 100, name: 'Master Trainer' }
          ]);

          player.tell('');
          player.tell('\u00a7d--- Gates ---');
          const gates = data.getInt('horizons_gate_clears') || 0;
          player.tell('\u00a77Gate Floors Cleared: \u00a7f' + gates);
          showMilestoneProgress(player, 'horizons_gate_clears', [
            { threshold: 1, name: 'Gate Runner' },
            { threshold: 10, name: 'Dungeon Diver' },
            { threshold: 25, name: 'Abyssal Explorer' },
            { threshold: 50, name: 'Gate Master' },
            { threshold: 100, name: 'Void Conqueror' }
          ]);

          player.tell('');
          player.tell('\u00a7e--- Other ---');
          const trades = data.getInt('horizons_trades') || 0;
          const brews = data.getInt('horizons_brews') || 0;
          player.tell('\u00a77Trades: \u00a7f' + trades + (trades >= 1 ? ' \u00a7a\u2714' : ''));
          player.tell('\u00a77Brews: \u00a7f' + brews + (brews >= 1 ? ' \u00a7a\u2714' : ''));

          // Total milestones earned
          let earned = 0;
          for (let i = 0; i < ALL_MILESTONES.length; i++) {
            if (player.stages.has(ALL_MILESTONES[i].stage)) earned++;
          }
          player.tell('');
          player.tell('\u00a77Total Milestones: \u00a7f' + earned + '/' + ALL_MILESTONES.length);

          return 1;
        })
        // /horizons milestones track <type> <amount> — internal/OP
        .then(Commands.literal('track')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const type = event.getArguments().STRING.getResult(ctx, 'type');
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                const validKeys = {
                  kills: 'horizons_mob_kills',
                  catches: 'horizons_cobblemon_catches',
                  gates: 'horizons_gate_clears',
                  trades: 'horizons_trades',
                  brews: 'horizons_brews'
                };

                const dataKey = validKeys[type];
                if (!dataKey) {
                  player.tell('\u00a7c[Horizons] Unknown type: ' + type);
                  player.tell('\u00a77Valid: ' + Object.keys(validKeys).join(', '));
                  return 0;
                }

                const newVal = incrementCounter(player, dataKey, amount);
                player.tell('\u00a7a[Horizons] ' + type + ' counter: ' + newVal);
                return 1;
              })
            )
          )
        )
      )
  );
});

// --- Helper to show milestone progress for a category ---
function showMilestoneProgress(player, dataKey, thresholds) {
  const current = player.persistentData.getInt(dataKey) || 0;
  for (let i = 0; i < thresholds.length; i++) {
    const t = thresholds[i];
    if (current >= t.threshold) {
      player.tell('  \u00a7a\u2714 ' + t.name + ' \u00a78(' + t.threshold + ')');
    } else {
      const pct = Math.floor((current / t.threshold) * 100);
      player.tell('  \u00a78\u2718 ' + t.name + ' \u00a78(' + current + '/' + t.threshold + ' - ' + pct + '%)');
    }
  }
}

console.log('[Horizons] Player Events loaded (' + ALL_MILESTONES.length + ' milestones)');
console.log('[Horizons] Commands: /horizons milestones [track]');
