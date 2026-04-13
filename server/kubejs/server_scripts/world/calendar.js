// ============================================================
// Project Horizons — Aetheria Calendar
// ============================================================
// File: kubejs/server_scripts/world/calendar.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Tracks an in-world calendar for Aetheria. Each Minecraft day advances
// the calendar by one Aetheria day. 12 months of 30 days each, 4 seasons.
// Tracks current day via scoreboard and updates season stages.
//
// CALENDAR:
//   Spring: Dawning, Verdance, Bloomtide (days 1-90)
//   Summer: Solara, Goldcrest, Harvest (days 91-180)
//   Autumn: Amberveil, Frostfall, Stillmoon (days 181-270)
//   Winter: Deepwinter, Thawreach, Renewal (days 271-360)
//
// COMMANDS:
//   /horizons calendar          — show current date, month, season
//   /horizons calendar setday   — OP only, set current day
// ============================================================

// --- Configuration ---
const CALENDAR = {
  daysPerMonth: 30,
  monthsPerYear: 12,
  daysPerYear: 360,
  scoreboardObj: 'horizons_calendar_day',
  lastDayTimeKey: 'horizons_last_daytime',
  tickInterval: 100 // Check every 100 ticks for day transitions
};

const MONTHS = [
  { id: 0,  name: 'Dawning',    season: 'spring', color: '\u00a7a' },
  { id: 1,  name: 'Verdance',   season: 'spring', color: '\u00a7a' },
  { id: 2,  name: 'Bloomtide',  season: 'spring', color: '\u00a72' },
  { id: 3,  name: 'Solara',     season: 'summer', color: '\u00a7e' },
  { id: 4,  name: 'Goldcrest',  season: 'summer', color: '\u00a76' },
  { id: 5,  name: 'Harvest',    season: 'summer', color: '\u00a76' },
  { id: 6,  name: 'Amberveil',  season: 'autumn', color: '\u00a7c' },
  { id: 7,  name: 'Frostfall',  season: 'autumn', color: '\u00a74' },
  { id: 8,  name: 'Stillmoon',  season: 'autumn', color: '\u00a78' },
  { id: 9,  name: 'Deepwinter', season: 'winter', color: '\u00a7b' },
  { id: 10, name: 'Thawreach',  season: 'winter', color: '\u00a79' },
  { id: 11, name: 'Renewal',    season: 'winter', color: '\u00a73' }
];

const SEASONS = {
  spring: { name: 'Spring', color: '\u00a7a', symbol: '\u2741' },
  summer: { name: 'Summer', color: '\u00a7e', symbol: '\u2600' },
  autumn: { name: 'Autumn', color: '\u00a7c', symbol: '\u2618' },
  winter: { name: 'Winter', color: '\u00a7b', symbol: '\u2744' }
};

const SEASON_STAGES = ['season_spring', 'season_summer', 'season_autumn', 'season_winter'];

// --- Calendar utility functions ---

function getCurrentDay(server) {
  // Stored as a scoreboard objective on a fake player "AetheriaCalendar"
  // We read from persistentData on overworld level for reliability
  // Fallback: derive from world time
  // The scoreboard is the source of truth, but we also track internally
  return server.persistentData ? (server.persistentData.getInt(CALENDAR.scoreboardObj) || 1) : 1;
}

function setCurrentDay(server, day) {
  // Wrap around year
  while (day > CALENDAR.daysPerYear) day -= CALENDAR.daysPerYear;
  if (day < 1) day = 1;

  if (server.persistentData) {
    server.persistentData.putInt(CALENDAR.scoreboardObj, day);
  }

  // Sync to scoreboard for other systems
  server.runCommandSilent('scoreboard objectives add ' + CALENDAR.scoreboardObj + ' dummy');
  server.runCommandSilent('scoreboard players set AetheriaCalendar ' + CALENDAR.scoreboardObj + ' ' + day);
}

function getDateInfo(dayOfYear) {
  // Clamp to valid range
  const d = ((dayOfYear - 1) % CALENDAR.daysPerYear) + 1;
  const monthIndex = Math.floor((d - 1) / CALENDAR.daysPerMonth);
  const dayInMonth = ((d - 1) % CALENDAR.daysPerMonth) + 1;
  const month = MONTHS[Math.min(monthIndex, MONTHS.length - 1)];
  const season = SEASONS[month.season];
  const year = Math.floor((dayOfYear - 1) / CALENDAR.daysPerYear) + 1;

  return {
    dayOfYear: d,
    dayInMonth: dayInMonth,
    monthIndex: monthIndex,
    month: month,
    season: season,
    year: year
  };
}

function getSeasonFromDay(dayOfYear) {
  const d = ((dayOfYear - 1) % CALENDAR.daysPerYear);
  if (d < 90) return 'spring';
  if (d < 180) return 'summer';
  if (d < 270) return 'autumn';
  return 'winter';
}

function formatOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============================================================
// TICK HANDLER — Advance calendar when MC day changes
// ============================================================

// Track the previous MC day tick to detect day transitions
let lastCheckedDay = -1;

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % CALENDAR.tickInterval !== 0) return;

  // Get the Minecraft day count from overworld
  const worldDay = Math.floor(server.overworld.dayTime / 24000);

  if (lastCheckedDay < 0) {
    // First tick — initialize
    lastCheckedDay = worldDay;
    // Initialize scoreboard
    server.runCommandSilent('scoreboard objectives add ' + CALENDAR.scoreboardObj + ' dummy');
    return;
  }

  // Check if a new MC day has begun
  if (worldDay > lastCheckedDay) {
    const daysAdvanced = worldDay - lastCheckedDay;
    lastCheckedDay = worldDay;

    // Advance Aetheria calendar
    let currentDay = getCurrentDay(server);
    const oldSeason = getSeasonFromDay(currentDay);
    currentDay += daysAdvanced;
    setCurrentDay(server, currentDay);
    const newSeason = getSeasonFromDay(currentDay);

    // Check for season change
    if (oldSeason !== newSeason) {
      const seasonInfo = SEASONS[newSeason];
      // Broadcast season change to all players
      const players = server.players;
      for (let p = 0; p < players.size(); p++) {
        const player = players.get(p);
        if (!player) continue;

        // Remove old season stages, add new one
        for (let s = 0; s < SEASON_STAGES.length; s++) {
          if (player.stages.has(SEASON_STAGES[s])) {
            player.stages.remove(SEASON_STAGES[s]);
          }
        }
        player.stages.add('season_' + newSeason);

        player.tell('');
        player.tell(seasonInfo.color + seasonInfo.symbol + ' \u00a7e\u00a7lSeason Change! ' + seasonInfo.color + seasonInfo.name + ' has arrived!');
        player.tell('');
      }

      server.runCommandSilent('playsound minecraft:block.bell.use player @a');
    }

    // New month announcement
    const info = getDateInfo(currentDay);
    if (info.dayInMonth === 1) {
      const players = server.players;
      for (let p = 0; p < players.size(); p++) {
        const player = players.get(p);
        if (!player) continue;
        player.tell(info.month.color + '[Calendar] The month of ' + info.month.name + ' begins.');
      }
    }
  }
});

// ============================================================
// PLAYER JOIN — Set season stage
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const server = player.server;

  // Initialize scoreboard
  server.runCommandSilent('scoreboard objectives add ' + CALENDAR.scoreboardObj + ' dummy');

  // Set current season stage
  const currentDay = getCurrentDay(server);
  const currentSeason = getSeasonFromDay(currentDay);

  for (let s = 0; s < SEASON_STAGES.length; s++) {
    if (player.stages.has(SEASON_STAGES[s])) {
      player.stages.remove(SEASON_STAGES[s]);
    }
  }
  player.stages.add('season_' + currentSeason);
});

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('calendar')
        // /horizons calendar — show current date
        .executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;

          const currentDay = getCurrentDay(player.server);
          const info = getDateInfo(currentDay);

          player.tell('\u00a7e=== Aetheria Calendar ===');
          player.tell(info.season.color + info.season.symbol + ' \u00a77Season: ' + info.season.color + info.season.name);
          player.tell(info.month.color + '\u00a77Month: ' + info.month.color + info.month.name);
          player.tell('\u00a77Day: \u00a7f' + formatOrdinal(info.dayInMonth) + ' \u00a77of ' + info.month.color + info.month.name);
          player.tell('\u00a77Day of Year: \u00a7f' + info.dayOfYear + '/' + CALENDAR.daysPerYear);
          player.tell('\u00a77Year: \u00a7f' + info.year);

          // Progress bar for the year
          const pct = Math.floor((info.dayOfYear / CALENDAR.daysPerYear) * 100);
          const barFilled = Math.floor(pct / 5);
          const bar = info.season.color + '='.repeat(barFilled) + '\u00a78' + '='.repeat(20 - barFilled);
          player.tell('\u00a77Year progress: ' + bar + ' \u00a7f' + pct + '%');

          return 1;
        })
        // /horizons calendar setday <day> — OP only
        .then(Commands.literal('setday')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('day', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const day = event.getArguments().INTEGER.getResult(ctx, 'day');
              if (day < 1 || day > CALENDAR.daysPerYear) {
                player.tell('\u00a7c[Horizons] Day must be between 1 and ' + CALENDAR.daysPerYear);
                return 0;
              }

              setCurrentDay(player.server, day);
              const info = getDateInfo(day);
              player.tell('\u00a7a[Horizons] Calendar set to ' + formatOrdinal(info.dayInMonth) + ' of ' + info.month.name + ' (' + info.season.name + ')');
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Aetheria Calendar loaded');
console.log('[Horizons] Commands: /horizons calendar [setday]');
