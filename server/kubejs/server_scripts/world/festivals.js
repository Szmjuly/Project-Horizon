// ============================================================
// Project Horizons — Festivals
// ============================================================
// File: kubejs/server_scripts/world/festivals.js
// Phase: 4
// Dependencies: KubeJS, calendar.js
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// 12 annual festivals, one per month on day 15. Each lasts 3 MC days.
// During festivals: bonus XP, special effects, broadcast announcements.
// Integrates with the Aetheria calendar system.
//
// COMMANDS:
//   /horizons festival           — show current or next festival
//   /horizons festival start     — OP only, manually start a festival
// ============================================================

// --- Festival Definitions ---
const FESTIVALS = [
  { id: 'first_bloom',     month: 0,  name: 'First Bloom Festival',     color: '\u00a7a',
    desc: 'Celebrating the first flowers of spring. Nature comes alive!',
    effect: 'Bonus XP from farming and foraging' },
  { id: 'grand_market',    month: 1,  name: 'Grand Market Fair',        color: '\u00a7e',
    desc: 'Merchants from all kingdoms converge for the biggest trade event.',
    effect: 'All trades give bonus reputation' },
  { id: 'blossom_dance',   month: 2,  name: 'Blossom Dance',            color: '\u00a7d',
    desc: 'A celebration of life and growth as Bloomtide reaches its peak.',
    effect: 'Cobblemon friendship gains doubled' },
  { id: 'sun_zenith',      month: 3,  name: 'Sun Zenith Celebration',   color: '\u00a76',
    desc: 'The longest day of the year. Fire and light fill the streets.',
    effect: 'Bonus XP from combat and exploration' },
  { id: 'golden_harvest',  month: 4,  name: 'Golden Harvest Gala',      color: '\u00a7e',
    desc: 'A feast of abundance as the fields yield their golden treasure.',
    effect: 'Crop yields doubled' },
  { id: 'harvest_moon',    month: 5,  name: 'Harvest Moon Festival',    color: '\u00a76',
    desc: 'Under the great moon, the final harvest is celebrated with song.',
    effect: 'Nutrition bonuses increased' },
  { id: 'amber_lanterns',  month: 6,  name: 'Amber Lantern Night',     color: '\u00a7c',
    desc: 'Thousands of lanterns light the autumn sky in remembrance.',
    effect: 'Night encounters have better rewards' },
  { id: 'frost_faire',     month: 7,  name: 'Frost Faire',              color: '\u00a7b',
    desc: 'As the first frost arrives, communities gather for warmth and cheer.',
    effect: 'Crafting XP doubled' },
  { id: 'shadow_vigil',    month: 8,  name: 'Shadow Vigil',             color: '\u00a78',
    desc: 'The longest night approaches. Watchers are honored in solemn ritual.',
    effect: 'Gate rewards doubled' },
  { id: 'winter_solstice', month: 9,  name: 'Winter Solstice',          color: '\u00a79',
    desc: 'The darkest day passes, and light begins its return.',
    effect: 'All XP sources grant 1.5x bonus' },
  { id: 'thaw_feast',      month: 10, name: 'Thaw Feast',               color: '\u00a73',
    desc: 'The ice begins to crack. Communities share stores to survive.',
    effect: 'Food restores bonus hunger and saturation' },
  { id: 'renewal_rites',   month: 11, name: 'Renewal Rites',            color: '\u00a72',
    desc: 'The year ends and begins anew. Old debts are forgiven.',
    effect: 'Crime stat decay accelerated' }
];

const FESTIVAL_CONFIG = {
  startDay: 15,         // Day of month when festival begins
  duration: 3,          // Duration in MC days
  scoreboardObj: 'horizons_festival',
  activeKey: 'horizons_festival_active',
  festivalIdKey: 'horizons_festival_id',
  festivalEndKey: 'horizons_festival_end',
  checkInterval: 200    // Ticks between festival state checks
};

// --- Get current calendar day (reads from calendar.js scoreboard) ---
function getFestivalCalendarDay(server) {
  if (server.persistentData) {
    return server.persistentData.getInt('horizons_calendar_day') || 1;
  }
  return 1;
}

// --- Determine which month a day falls in ---
function getMonthFromDay(dayOfYear) {
  return Math.floor(((dayOfYear - 1) % 360) / 30);
}

// --- Find festival for a given month ---
function getFestivalForMonth(monthIndex) {
  for (let i = 0; i < FESTIVALS.length; i++) {
    if (FESTIVALS[i].month === monthIndex) return FESTIVALS[i];
  }
  return null;
}

// --- Check if a festival should be active ---
function shouldFestivalBeActive(dayOfYear) {
  const dayInMonth = ((dayOfYear - 1) % 30) + 1;
  return dayInMonth >= FESTIVAL_CONFIG.startDay && dayInMonth < FESTIVAL_CONFIG.startDay + FESTIVAL_CONFIG.duration;
}

// --- Start a festival ---
function startFestival(server, festival) {
  if (server.persistentData) {
    server.persistentData.putString(FESTIVAL_CONFIG.festivalIdKey, festival.id);
    server.persistentData.putBoolean(FESTIVAL_CONFIG.activeKey, true);
  }

  server.runCommandSilent('scoreboard objectives add ' + FESTIVAL_CONFIG.scoreboardObj + ' dummy');
  server.runCommandSilent('scoreboard players set festival_active ' + FESTIVAL_CONFIG.scoreboardObj + ' 1');

  // Broadcast to all players
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.add('festival_active');
    player.stages.add('festival_' + festival.id);

    player.tell('');
    player.tell(festival.color + '\u00a7l=== ' + festival.name + ' ===');
    player.tell('\u00a77' + festival.desc);
    player.tell('\u00a7aEffect: ' + festival.effect);
    player.tell('\u00a77The festival lasts for ' + FESTIVAL_CONFIG.duration + ' days!');
    player.tell('');
  }

  server.runCommandSilent('playsound minecraft:entity.firework_rocket.launch player @a');
  server.runCommandSilent('title @a subtitle {"text":"' + festival.name + '","color":"gold"}');
  server.runCommandSilent('title @a title {"text":"Festival Begins!","color":"yellow"}');

  console.log('[Horizons/Festivals] Started: ' + festival.name);
}

// --- End a festival ---
function endFestival(server) {
  let festivalId = '';
  if (server.persistentData) {
    festivalId = server.persistentData.getString(FESTIVAL_CONFIG.festivalIdKey) || '';
    server.persistentData.putString(FESTIVAL_CONFIG.festivalIdKey, '');
    server.persistentData.putBoolean(FESTIVAL_CONFIG.activeKey, false);
  }

  server.runCommandSilent('scoreboard players set festival_active ' + FESTIVAL_CONFIG.scoreboardObj + ' 0');

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.remove('festival_active');
    if (festivalId) player.stages.remove('festival_' + festivalId);

    player.tell('\u00a77[Horizons] The festival has ended. Until next time!');
  }

  console.log('[Horizons/Festivals] Ended: ' + festivalId);
}

// --- Check if a festival is currently active ---
function isFestivalActive(server) {
  if (server.persistentData) {
    return server.persistentData.getBoolean(FESTIVAL_CONFIG.activeKey) || false;
  }
  return false;
}

// ============================================================
// TICK HANDLER — Check for festival start/end
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % FESTIVAL_CONFIG.checkInterval !== 0) return;

  const currentDay = getFestivalCalendarDay(server);
  const shouldBeActive = shouldFestivalBeActive(currentDay);
  const isActive = isFestivalActive(server);

  if (shouldBeActive && !isActive) {
    // Start festival
    const monthIndex = getMonthFromDay(currentDay);
    const festival = getFestivalForMonth(monthIndex);
    if (festival) {
      startFestival(server, festival);
    }
  } else if (!shouldBeActive && isActive) {
    // End festival
    endFestival(server);
  }
});

// ============================================================
// PLAYER JOIN — Apply active festival stages
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const server = player.server;

  if (isFestivalActive(server)) {
    const festivalId = server.persistentData ? server.persistentData.getString(FESTIVAL_CONFIG.festivalIdKey) : '';
    if (festivalId) {
      player.stages.add('festival_active');
      player.stages.add('festival_' + festivalId);

      const festival = FESTIVALS.find(f => f.id === festivalId);
      if (festival) {
        player.tell(festival.color + '[Horizons] The ' + festival.name + ' is underway!');
        player.tell('\u00a7aEffect: ' + festival.effect);
      }
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
      .then(Commands.literal('festival')
        // /horizons festival — show current/next
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;
          const server = player.server;

          const currentDay = getFestivalCalendarDay(server);
          const monthIndex = getMonthFromDay(currentDay);
          const dayInMonth = ((currentDay - 1) % 30) + 1;

          if (isFestivalActive(server)) {
            const festivalId = server.persistentData ? server.persistentData.getString(FESTIVAL_CONFIG.festivalIdKey) : '';
            const festival = FESTIVALS.find(f => f.id === festivalId);
            if (festival) {
              const daysLeft = FESTIVAL_CONFIG.startDay + FESTIVAL_CONFIG.duration - dayInMonth;
              player.tell(festival.color + '\u00a7l=== ' + festival.name + ' (ACTIVE) ===');
              player.tell('\u00a77' + festival.desc);
              player.tell('\u00a7aEffect: ' + festival.effect);
              player.tell('\u00a77Days remaining: \u00a7f' + Math.max(daysLeft, 0));
            }
          } else {
            player.tell('\u00a7e=== Festivals ===');
            player.tell('\u00a77No festival is currently active.');

            // Find next festival
            let nextFestival = null;
            let daysUntil = 999;

            for (let i = 0; i < FESTIVALS.length; i++) {
              const fest = FESTIVALS[i];
              const festStartDay = fest.month * 30 + FESTIVAL_CONFIG.startDay;
              let diff = festStartDay - currentDay;
              if (diff < 0) diff += 360;
              if (diff < daysUntil) {
                daysUntil = diff;
                nextFestival = fest;
              }
            }

            if (nextFestival) {
              player.tell('\u00a77Next: ' + nextFestival.color + nextFestival.name);
              player.tell('\u00a77In \u00a7f' + daysUntil + ' \u00a77days');
              player.tell('\u00a78' + nextFestival.desc);
            }
          }

          // List all festivals
          player.tell('');
          player.tell('\u00a77Annual Festivals:');
          for (let i = 0; i < FESTIVALS.length; i++) {
            const f = FESTIVALS[i];
            const mName = ['Dawning','Verdance','Bloomtide','Solara','Goldcrest','Harvest',
                          'Amberveil','Frostfall','Stillmoon','Deepwinter','Thawreach','Renewal'][f.month];
            const isCurrent = isFestivalActive(server) && server.persistentData &&
                             server.persistentData.getString(FESTIVAL_CONFIG.festivalIdKey) === f.id;
            const marker = isCurrent ? ' \u00a7a[NOW]' : '';
            player.tell('  ' + f.color + f.name + ' \u00a78- ' + mName + ' ' + FESTIVAL_CONFIG.startDay + marker);
          }

          return 1;
        })
        // /horizons festival start <name> — OP only
        .then(Commands.literal('start')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const name = event.getArguments().STRING.getResult(ctx, 'name');
              const festival = FESTIVALS.find(f => f.id === name);

              if (!festival) {
                player.tell('\u00a7c[Horizons] Unknown festival: ' + name);
                player.tell('\u00a77Valid: ' + FESTIVALS.map(f => f.id).join(', '));
                return 0;
              }

              if (isFestivalActive(player.server)) {
                endFestival(player.server);
              }
              startFestival(player.server, festival);
              player.tell('\u00a7a[Horizons] Manually started: ' + festival.name);
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Festivals loaded (' + FESTIVALS.length + ' festivals)');
console.log('[Horizons] Commands: /horizons festival [start]');
