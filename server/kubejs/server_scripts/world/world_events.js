// ============================================================
// Project Horizons — World Events
// File: kubejs/server_scripts/world/world_events.js
// Phase: 4 | Dependencies: KubeJS, calendar.js
// 6 major world events with periodic triggers and durations.
// ============================================================

// --- Event Definitions ---
const WORLD_EVENTS = [
  { id: 'meteor_shower', name: 'Meteor Shower', color: '\u00a7d',
    desc: 'Fragments of the void rain down across Aetheria. Rare materials can be found.',
    minCooldown: 10, maxCooldown: 25, duration: 2,
    effects: ['Rare drops from mobs', 'Glowing ore fragments appear', 'Bonus mining XP'] },
  { id: 'eclipse', name: 'Eclipse', color: '\u00a78',
    desc: 'The moon swallows the sun. Darkness falls and hostile mobs roam freely.',
    minCooldown: 14, maxCooldown: 30, duration: 1,
    effects: ['Hostile mobs spawn in daylight', 'Increased mob difficulty', 'Double combat XP'] },
  { id: 'gate_surge', name: 'Gate Surge', color: '\u00a75',
    desc: 'The dimensional gates pulse with unstable energy. Danger and reward await.',
    minCooldown: 7, maxCooldown: 20, duration: 3,
    effects: ['Gate difficulty doubled', 'Gate loot doubled', 'New gate floors unlock'] },
  { id: 'migration', name: 'Great Migration', color: '\u00a7a',
    desc: 'Wild Cobblemon herds migrate across the land. Rare species appear.',
    minCooldown: 10, maxCooldown: 20, duration: 3,
    effects: ['Rare Cobblemon spawns', 'Catch rate bonus', 'Shiny chance increased'] },
  { id: 'grand_market', name: 'Grand Market', color: '\u00a7e',
    desc: 'Merchants from distant lands set up stalls. Rare goods at special prices.',
    minCooldown: 8, maxCooldown: 15, duration: 3,
    effects: ['Special merchant NPCs', 'Trade prices reduced', 'Rare items available'] },
  { id: 'watcher_visit', name: 'Watcher Visit', color: '\u00a79',
    desc: 'A Watcher has been sighted. These ancient beings carry knowledge and power.',
    minCooldown: 20, maxCooldown: 30, duration: 1,
    effects: ['Lore fragments obtainable', 'Mysterious quests appear', 'Precursor tokens drop'] }
];

const WEVENT_CONFIG = {
  checkInterval: 2400,   // Check every 2 minutes for event triggers
  scoreboardObj: 'horizons_world_events',
  lastCheckKey: 'horizons_wevent_last_check',
  activePrefix: 'wevent_active_',
  cooldownPrefix: 'wevent_cd_',
  endDayPrefix: 'wevent_end_',
  dailyRollChance: 0.12  // 12% chance per check when off cooldown
};

// --- Calendar day helper ---
function getWEventDay(server) {
  if (server.persistentData) {
    return server.persistentData.getInt('horizons_calendar_day') || 1;
  }
  return 1;
}

// --- Event state helpers ---
function isEventActive(server, eventId) {
  if (!server.persistentData) return false;
  return server.persistentData.getBoolean(WEVENT_CONFIG.activePrefix + eventId) || false;
}

function getEventCooldown(server, eventId) {
  if (!server.persistentData) return 0;
  return server.persistentData.getInt(WEVENT_CONFIG.cooldownPrefix + eventId) || 0;
}

function getEventEndDay(server, eventId) {
  if (!server.persistentData) return 0;
  return server.persistentData.getInt(WEVENT_CONFIG.endDayPrefix + eventId) || 0;
}

function getAnyActiveEvent(server) {
  for (let i = 0; i < WORLD_EVENTS.length; i++) {
    if (isEventActive(server, WORLD_EVENTS[i].id)) return WORLD_EVENTS[i];
  }
  return null;
}

// --- Start a world event ---
function startWorldEvent(server, worldEvent) {
  const currentDay = getWEventDay(server);
  const endDay = currentDay + worldEvent.duration;

  if (server.persistentData) {
    server.persistentData.putBoolean(WEVENT_CONFIG.activePrefix + worldEvent.id, true);
    server.persistentData.putInt(WEVENT_CONFIG.endDayPrefix + worldEvent.id, endDay);
  }

  // Track in scoreboard
  server.runCommandSilent('scoreboard objectives add ' + WEVENT_CONFIG.scoreboardObj + ' dummy');
  server.runCommandSilent('scoreboard players set ' + worldEvent.id + ' ' + WEVENT_CONFIG.scoreboardObj + ' 1');

  // Broadcast
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.add('wevent_' + worldEvent.id);

    player.tell('');
    player.tell(worldEvent.color + '\u00a7l=== WORLD EVENT: ' + worldEvent.name.toUpperCase() + ' ===');
    player.tell('\u00a77' + worldEvent.desc);
    player.tell('\u00a77Duration: \u00a7f' + worldEvent.duration + ' day(s)');
    for (let e = 0; e < worldEvent.effects.length; e++) {
      player.tell('\u00a7a  \u2022 ' + worldEvent.effects[e]);
    }
    player.tell('');
  }

  // Sound and title
  server.runCommandSilent('playsound minecraft:entity.wither.spawn player @a ~ ~ ~ 0.5');
  server.runCommandSilent('title @a subtitle {"text":"' + worldEvent.name + '","color":"gold"}');
  server.runCommandSilent('title @a title {"text":"World Event!","color":"red"}');

  // Apply event-specific effects
  applyEventEffects(server, worldEvent, true);

  console.log('[Horizons/WorldEvents] Started: ' + worldEvent.name + ' (ends day ' + endDay + ')');
}

// --- End a world event ---
function endWorldEvent(server, worldEvent) {
  if (server.persistentData) {
    server.persistentData.putBoolean(WEVENT_CONFIG.activePrefix + worldEvent.id, false);
    // Set cooldown
    const currentDay = getWEventDay(server);
    const cooldown = worldEvent.minCooldown + Math.floor(Math.random() * (worldEvent.maxCooldown - worldEvent.minCooldown));
    server.persistentData.putInt(WEVENT_CONFIG.cooldownPrefix + worldEvent.id, currentDay + cooldown);
  }

  server.runCommandSilent('scoreboard players set ' + worldEvent.id + ' ' + WEVENT_CONFIG.scoreboardObj + ' 0');

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.remove('wevent_' + worldEvent.id);
    player.tell(worldEvent.color + '[Horizons] The ' + worldEvent.name + ' has ended.');
  }

  // Remove event effects
  applyEventEffects(server, worldEvent, false);

  console.log('[Horizons/WorldEvents] Ended: ' + worldEvent.name);
}

// --- Apply/remove event-specific effects ---
function applyEventEffects(server, worldEvent, apply) {
  switch (worldEvent.id) {
    case 'eclipse':
      if (apply) {
        // Set time to night to simulate eclipse
        server.runCommandSilent('time set midnight');
        server.runCommandSilent('gamerule doDaylightCycle false');
      } else {
        server.runCommandSilent('gamerule doDaylightCycle true');
        server.runCommandSilent('time set day');
      }
      break;
    case 'meteor_shower':
      if (apply) {
        server.runCommandSilent('weather thunder');
      } else {
        server.runCommandSilent('weather clear');
      }
      break;
    case 'gate_surge':
      // Handled by gate_system.js checking for wevent_gate_surge stage
      break;
    case 'migration':
      // Handled by cobblemon integration checking wevent_migration stage
      break;
    case 'grand_market':
      // Handled by economy scripts checking wevent_grand_market stage
      break;
    case 'watcher_visit':
      // Handled by NPC scripts checking wevent_watcher_visit stage
      break;
  }
}

// ============================================================
// TICK HANDLER — Check for event triggers and expirations
// ============================================================

let lastEventCheckDay = -1;

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % WEVENT_CONFIG.checkInterval !== 0) return;

  const currentDay = getWEventDay(server);
  if (currentDay === lastEventCheckDay) return;
  lastEventCheckDay = currentDay;

  // Check for expired events
  for (let i = 0; i < WORLD_EVENTS.length; i++) {
    const we = WORLD_EVENTS[i];
    if (isEventActive(server, we.id)) {
      const endDay = getEventEndDay(server, we.id);
      if (currentDay >= endDay) {
        endWorldEvent(server, we);
      }
    }
  }

  // Only allow one active event at a time
  if (getAnyActiveEvent(server)) return;

  // Roll for new events
  if (Math.random() > WEVENT_CONFIG.dailyRollChance) return;

  // Build eligible events list
  const eligible = [];
  for (let i = 0; i < WORLD_EVENTS.length; i++) {
    const we = WORLD_EVENTS[i];
    if (isEventActive(server, we.id)) continue;
    const cooldownEnd = getEventCooldown(server, we.id);
    if (currentDay < cooldownEnd) continue;
    eligible.push(we);
  }

  if (eligible.length === 0) return;

  // Pick a random eligible event
  const picked = eligible[Math.floor(Math.random() * eligible.length)];
  startWorldEvent(server, picked);
});

// ============================================================
// PLAYER JOIN — Apply active event stages
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const server = player.server;

  for (let i = 0; i < WORLD_EVENTS.length; i++) {
    const we = WORLD_EVENTS[i];
    if (isEventActive(server, we.id)) {
      player.stages.add('wevent_' + we.id);
      player.tell(we.color + '[Horizons] World Event active: ' + we.name);
    }
  }
});

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('event')
        // /horizons event status
        .then(Commands.literal('status').executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;
          const server = player.server;
          const currentDay = getWEventDay(server);

          player.tell('\u00a7e=== World Events ===');

          let hasActive = false;
          for (let i = 0; i < WORLD_EVENTS.length; i++) {
            const we = WORLD_EVENTS[i];
            if (isEventActive(server, we.id)) {
              const endDay = getEventEndDay(server, we.id);
              const remaining = endDay - currentDay;
              player.tell(we.color + '\u00a7l[ACTIVE] ' + we.name);
              player.tell('\u00a77  ' + we.desc);
              player.tell('\u00a77  Days remaining: \u00a7f' + Math.max(remaining, 0));
              for (let e = 0; e < we.effects.length; e++) {
                player.tell('\u00a7a    \u2022 ' + we.effects[e]);
              }
              hasActive = true;
            }
          }

          if (!hasActive) {
            player.tell('\u00a77No world event is currently active.');
          }

          // Show next possible events (OP only)
          if (ctx.source.hasPermission(2)) {
            player.tell('');
            player.tell('\u00a78--- Cooldowns (OP) ---');
            for (let i = 0; i < WORLD_EVENTS.length; i++) {
              const we = WORLD_EVENTS[i];
              const cd = getEventCooldown(server, we.id);
              const daysUntil = cd - currentDay;
              if (daysUntil > 0) {
                player.tell('\u00a78  ' + we.name + ': ' + daysUntil + ' days cooldown');
              } else {
                player.tell('\u00a78  ' + we.name + ': \u00a7aReady');
              }
            }
          }

          return 1;
        }))
        // /horizons event trigger <name> — OP only
        .then(Commands.literal('trigger')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const name = event.getArguments().STRING.getResult(ctx, 'name');
              const we = WORLD_EVENTS.find(e => e.id === name);

              if (!we) {
                player.tell('\u00a7c[Horizons] Unknown event: ' + name);
                player.tell('\u00a77Valid: ' + WORLD_EVENTS.map(e => e.id).join(', '));
                return 0;
              }

              // End any active event first
              const active = getAnyActiveEvent(player.server);
              if (active) {
                endWorldEvent(player.server, active);
              }

              startWorldEvent(player.server, we);
              player.tell('\u00a7a[Horizons] Triggered world event: ' + we.name);
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] World Events loaded (' + WORLD_EVENTS.length + ' events)');
console.log('[Horizons] Commands: /horizons event [status|trigger]');
