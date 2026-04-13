// ============================================================
// Project Horizons — Traveling NPCs
// ============================================================
// File: kubejs/server_scripts/npcs/travelers.js
// Phase: 4
// Dependencies: Easy NPC
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Simulated traveling merchants/NPCs that visit player villages
// on a schedule. Each NPC type offers unique services when present.
//
// NPC TYPES:
//   Traveling Merchant — rare items for sale
//   Wandering Trainer  — Cobblemon battle for XP
//   Herbalist          — trades herbs for potions
//   Blacksmith         — weapon/armor repairs and upgrades
//   Lorekeeper         — quest hints and advancement tips
//   Scout              — reveals map locations and dungeons
//
// SCHEDULE:
//   Each NPC visits a random village every 3 MC days (72000 ticks).
//   Stays for 1 MC day (24000 ticks) before departing.
//
// COMMANDS:
//   /horizons visitors — shows current and upcoming NPC visitors
//   /horizons visitor spawn <type> — OP only, spawn visitor now
// ============================================================

// --- Configuration ---
const TRAVELER_CONFIG = {
  // NPC type definitions
  npcs: {
    merchant: {
      name: 'Traveling Merchant',
      color: '\u00a7e',
      icon: '\u2606',
      stage: 'visitor_merchant_present',
      description: 'Sells rare items, exotic goods, and crafting materials',
      arrivalMsg: 'A Traveling Merchant has arrived with exotic wares!',
      departMsg: 'The Traveling Merchant has packed up and moved on.'
    },
    trainer: {
      name: 'Wandering Trainer',
      color: '\u00a7d',
      icon: '\u2605',
      stage: 'visitor_trainer_present',
      description: 'Offers Cobblemon battles for XP and rare candy',
      arrivalMsg: 'A Wandering Pokemon Trainer seeks worthy opponents!',
      departMsg: 'The Wandering Trainer has left to find new challengers.'
    },
    herbalist: {
      name: 'Herbalist',
      color: '\u00a7a',
      icon: '\u2698',
      stage: 'visitor_herbalist_present',
      description: 'Trades herbs and flowers for custom potions',
      arrivalMsg: 'An Herbalist has set up shop with rare remedies!',
      departMsg: 'The Herbalist has wandered off to gather more ingredients.'
    },
    blacksmith: {
      name: 'Blacksmith',
      color: '\u00a78',
      icon: '\u2692',
      stage: 'visitor_blacksmith_present',
      description: 'Repairs equipment and offers gear upgrades',
      arrivalMsg: 'A master Blacksmith has arrived, anvil in tow!',
      departMsg: 'The Blacksmith has departed to the next settlement.'
    },
    lorekeeper: {
      name: 'Lorekeeper',
      color: '\u00a75',
      icon: '\u2709',
      stage: 'visitor_lorekeeper_present',
      description: 'Shares quest hints, lore, and advancement guidance',
      arrivalMsg: 'A mysterious Lorekeeper has appeared with ancient knowledge!',
      departMsg: 'The Lorekeeper has vanished as mysteriously as they arrived.'
    },
    scout: {
      name: 'Scout',
      color: '\u00a76',
      icon: '\u2316',
      stage: 'visitor_scout_present',
      description: 'Reveals nearby dungeon and structure locations',
      arrivalMsg: 'A Scout has arrived with maps and intelligence!',
      departMsg: 'The Scout has ridden off to survey new territories.'
    }
  },

  // persistentData keys
  keys: {
    // Per-NPC tracking: arrival tick, whether currently present
    visitorPrefix: 'horizons_visitor_',
    // Global schedule tracker
    lastScheduleUpdate: 'horizons_visitors_last_schedule',
    // Current visitors (comma-separated type keys)
    currentVisitors: 'horizons_visitors_current',
    // Next arrival tick per NPC type
    nextArrivalPrefix: 'horizons_visitor_next_'
  },

  // Visit interval: every 3 MC days per NPC (72000 ticks)
  visitInterval: 72000,

  // Stay duration: 1 MC day (24000 ticks)
  stayDuration: 24000,

  // Offset each NPC type to stagger arrivals (spread across the interval)
  // Each NPC gets a different starting offset so they don't all arrive at once
  staggerOffset: 12000,

  // Check interval for arrivals/departures (every 5 minutes = 6000 ticks)
  checkInterval: 6000,

  debug: true
};

// --- Utility Functions ---

function travelerLog(message) {
  if (TRAVELER_CONFIG.debug) {
    console.log('[Horizons/Travelers] ' + message);
  }
}

/**
 * Get the list of currently present visitor types for a player.
 */
function getCurrentVisitors(player) {
  let raw = player.persistentData.getString(TRAVELER_CONFIG.keys.currentVisitors);
  if (!raw || raw.length === 0) return [];
  return raw.split(',').filter(function(v) { return v.length > 0; });
}

/**
 * Set the list of currently present visitors.
 */
function setCurrentVisitors(player, visitors) {
  player.persistentData.putString(TRAVELER_CONFIG.keys.currentVisitors, visitors.join(','));
}

/**
 * Check if a specific NPC type is currently visiting.
 */
function isVisitorPresent(player, npcType) {
  let visitors = getCurrentVisitors(player);
  return visitors.indexOf(npcType) >= 0;
}

/**
 * Get the next scheduled arrival tick for an NPC type.
 */
function getNextArrival(player, npcType) {
  return player.persistentData.getLong(TRAVELER_CONFIG.keys.nextArrivalPrefix + npcType);
}

/**
 * Set the next scheduled arrival tick for an NPC type.
 */
function setNextArrival(player, npcType, tick) {
  player.persistentData.putLong(TRAVELER_CONFIG.keys.nextArrivalPrefix + npcType, tick);
}

/**
 * Get the arrival tick for a currently present visitor.
 */
function getArrivalTick(player, npcType) {
  return player.persistentData.getLong(TRAVELER_CONFIG.keys.visitorPrefix + npcType + '_arrived');
}

/**
 * Handle a visitor arrival.
 */
function arriveVisitor(player, npcType) {
  let npcInfo = TRAVELER_CONFIG.npcs[npcType];
  if (!npcInfo) return;

  let server = player.server;

  // Add to current visitors list
  let visitors = getCurrentVisitors(player);
  if (visitors.indexOf(npcType) < 0) {
    visitors.push(npcType);
    setCurrentVisitors(player, visitors);
  }

  // Record arrival time
  player.persistentData.putLong(TRAVELER_CONFIG.keys.visitorPrefix + npcType + '_arrived', server.tickCount);

  // Add stage
  if (!player.stages.has(npcInfo.stage)) {
    player.stages.add(npcInfo.stage);
  }

  // Schedule next arrival
  setNextArrival(player, npcType, server.tickCount + TRAVELER_CONFIG.stayDuration + TRAVELER_CONFIG.visitInterval);

  // Broadcast arrival
  server.runCommandSilent(
    'tellraw @a {"text":"","extra":[' +
      '{"text":"\\n' + npcInfo.icon + ' ","color":"gold"},' +
      '{"text":"' + npcInfo.arrivalMsg + '","color":"yellow"},' +
      '{"text":"\\n","color":"gray"}' +
    ']}'
  );

  // Sound
  server.runCommandSilent(
    'execute at ' + player.username + ' run playsound minecraft:entity.wandering_trader.ambient master @a ~ ~ ~ 1 1'
  );

  travelerLog(npcInfo.name + ' arrived for ' + player.username);
}

/**
 * Handle a visitor departure.
 */
function departVisitor(player, npcType) {
  let npcInfo = TRAVELER_CONFIG.npcs[npcType];
  if (!npcInfo) return;

  let server = player.server;

  // Remove from current visitors list
  let visitors = getCurrentVisitors(player);
  let idx = visitors.indexOf(npcType);
  if (idx >= 0) {
    visitors.splice(idx, 1);
    setCurrentVisitors(player, visitors);
  }

  // Remove stage
  if (player.stages.has(npcInfo.stage)) {
    player.stages.remove(npcInfo.stage);
  }

  // Clear arrival tick
  player.persistentData.putLong(TRAVELER_CONFIG.keys.visitorPrefix + npcType + '_arrived', 0);

  // Broadcast departure
  server.runCommandSilent(
    'tellraw @a {"text":"","extra":[' +
      '{"text":"' + npcInfo.icon + ' ","color":"gray"},' +
      '{"text":"' + npcInfo.departMsg + '","color":"gray","italic":true}' +
    ']}'
  );

  travelerLog(npcInfo.name + ' departed from ' + player.username);
}

/**
 * Get time remaining as a human-readable string (MC days/hours).
 */
function getTimeString(ticks) {
  if (ticks <= 0) return 'now';
  let mcDays = Math.floor(ticks / 24000);
  let remainingTicks = ticks % 24000;
  let mcHours = Math.floor(remainingTicks / 1000);

  if (mcDays > 0) {
    return mcDays + ' MC day' + (mcDays > 1 ? 's' : '') + (mcHours > 0 ? ', ' + mcHours + 'h' : '');
  }
  return mcHours + ' MC hour' + (mcHours !== 1 ? 's' : '');
}

// ============================================================
// PERIODIC TICK — Check for arrivals and departures
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % TRAVELER_CONFIG.checkInterval !== 0) return;
  if (server.tickCount === 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let npcKeys = Object.keys(TRAVELER_CONFIG.npcs);

    for (let i = 0; i < npcKeys.length; i++) {
      let npcType = npcKeys[i];

      // Check if this NPC is currently visiting
      if (isVisitorPresent(player, npcType)) {
        // Check if stay duration has expired
        let arrivedAt = getArrivalTick(player, npcType);
        if (arrivedAt > 0 && (server.tickCount - arrivedAt) >= TRAVELER_CONFIG.stayDuration) {
          departVisitor(player, npcType);
        }
        continue;
      }

      // Check if it's time for this NPC to arrive
      let nextArrival = getNextArrival(player, npcType);
      if (nextArrival > 0 && server.tickCount >= nextArrival) {
        arriveVisitor(player, npcType);
      }
    }
  });
});

// ============================================================
// PLAYER LOGIN — Initialize schedule and restore visitor stages
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;
  let server = player.server;

  if (!data.contains(TRAVELER_CONFIG.keys.currentVisitors)) {
    data.putString(TRAVELER_CONFIG.keys.currentVisitors, '');

    // Initialize staggered arrival schedule
    let npcKeys = Object.keys(TRAVELER_CONFIG.npcs);
    for (let i = 0; i < npcKeys.length; i++) {
      let offset = TRAVELER_CONFIG.staggerOffset * i;
      let firstArrival = server.tickCount + TRAVELER_CONFIG.visitInterval + offset;
      setNextArrival(player, npcKeys[i], firstArrival);
    }

    travelerLog('Initialized traveler schedule for ' + player.username);
  }

  // Restore visitor stages for currently present visitors
  let visitors = getCurrentVisitors(player);
  for (let npcType of visitors) {
    let npcInfo = TRAVELER_CONFIG.npcs[npcType];
    if (npcInfo && !player.stages.has(npcInfo.stage)) {
      player.stages.add(npcInfo.stage);
    }
  }
});

// ============================================================
// COMMANDS: /horizons visitors, /horizons visitor spawn <type>
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')

      // /horizons visitors — show current and upcoming
      .then(Commands.literal('visitors')
        .executes(ctx => {
          let player = ctx.source.player;
          if (!player) return 0;

          let server = player.server;
          let currentVisitors = getCurrentVisitors(player);

          player.tell('\u00a7e=== Traveling NPCs ===');
          player.tell('');

          // Current visitors
          if (currentVisitors.length > 0) {
            player.tell('\u00a7a  Currently Visiting:');
            for (let npcType of currentVisitors) {
              let npcInfo = TRAVELER_CONFIG.npcs[npcType];
              if (!npcInfo) continue;

              let arrivedAt = getArrivalTick(player, npcType);
              let remaining = TRAVELER_CONFIG.stayDuration - (server.tickCount - arrivedAt);
              let timeStr = getTimeString(remaining);

              player.tell('  ' + npcInfo.color + npcInfo.icon + ' ' + npcInfo.name);
              player.tell('    \u00a77' + npcInfo.description);
              player.tell('    \u00a77Departs in: \u00a7f' + timeStr);
            }
          } else {
            player.tell('\u00a78  No visitors at this time.');
          }

          player.tell('');

          // Upcoming schedule
          player.tell('\u00a7e  Upcoming Arrivals:');
          let scheduleEntries = [];

          for (let [npcType, npcInfo] of Object.entries(TRAVELER_CONFIG.npcs)) {
            if (isVisitorPresent(player, npcType)) continue;

            let nextArrival = getNextArrival(player, npcType);
            let ticksUntil = nextArrival - server.tickCount;

            if (ticksUntil > 0) {
              scheduleEntries.push({
                type: npcType,
                info: npcInfo,
                ticksUntil: ticksUntil
              });
            }
          }

          // Sort by soonest arrival
          scheduleEntries.sort(function(a, b) { return a.ticksUntil - b.ticksUntil; });

          if (scheduleEntries.length === 0) {
            player.tell('\u00a78  No upcoming arrivals scheduled.');
          } else {
            for (let entry of scheduleEntries) {
              let timeStr = getTimeString(entry.ticksUntil);
              player.tell('  ' + entry.info.color + entry.info.icon + ' ' + entry.info.name + ' \u00a77- in ' + timeStr);
            }
          }

          player.tell('');
          player.tell('\u00a77NPCs visit every 3 MC days and stay for 1 MC day.');

          return 1;
        })
      )

      // /horizons visitor spawn <type> — OP only
      .then(Commands.literal('visitor')
        .then(Commands.literal('spawn')
          .requires(function(source) { return source.hasPermission(2); })
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(TRAVELER_CONFIG.npcs)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let npcType = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();
              let npcInfo = TRAVELER_CONFIG.npcs[npcType];

              if (!npcInfo) {
                player.tell('\u00a7c[Visitors] Unknown NPC type: ' + npcType);
                player.tell('\u00a77Valid types: ' + Object.keys(TRAVELER_CONFIG.npcs).join(', '));
                return 0;
              }

              if (isVisitorPresent(player, npcType)) {
                player.tell('\u00a7e[Visitors] ' + npcInfo.name + ' is already visiting.');
                return 0;
              }

              arriveVisitor(player, npcType);
              player.tell('\u00a7a[Visitors] Spawned ' + npcInfo.name + '.');

              return 1;
            })
          )
        )

        // /horizons visitor dismiss <type> — OP only
        .then(Commands.literal('dismiss')
          .requires(function(source) { return source.hasPermission(2); })
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(TRAVELER_CONFIG.npcs)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let npcType = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();
              let npcInfo = TRAVELER_CONFIG.npcs[npcType];

              if (!npcInfo) {
                player.tell('\u00a7c[Visitors] Unknown NPC type: ' + npcType);
                return 0;
              }

              if (!isVisitorPresent(player, npcType)) {
                player.tell('\u00a77[Visitors] ' + npcInfo.name + ' is not currently visiting.');
                return 0;
              }

              departVisitor(player, npcType);
              player.tell('\u00a7e[Visitors] Dismissed ' + npcInfo.name + '.');

              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Traveling NPC system loaded');
console.log('[Horizons] Commands: /horizons visitors, /horizons visitor [spawn|dismiss]');
console.log('[Horizons] 6 NPC types: merchant, trainer, herbalist, blacksmith, lorekeeper, scout');
