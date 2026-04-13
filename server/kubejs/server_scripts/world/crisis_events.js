// ============================================================
// Project Horizons — Crisis Events
// File: kubejs/server_scripts/world/crisis_events.js
// Phase: 4 | Dependencies: KubeJS, calendar.js
// 4 crisis types, 10% daily chance, time-limited with rewards.
// ============================================================

// --- Crisis Definitions ---
const CRISES = [
  { id: 'village_siege', name: 'Village Under Siege', color: '\u00a7c',
    desc: 'Hostile forces are attacking a nearby village! Defend the inhabitants!',
    duration: 600,   // ticks (MC night = ~600 seconds, so this is 30 seconds real-time equivalent; stored as MC ticks duration)
    durationTicks: 12000,  // 1 MC night (10 minutes real)
    xpReward: 40, repReward: 25, repFaction: 'plains' },
  { id: 'dungeon_overflow', name: 'Dungeon Overflow', color: '\u00a75',
    desc: 'Gate energy destabilizes! Dungeon mobs are leaking into the overworld!',
    durationTicks: 12000,  // 10 minutes
    xpReward: 50, repReward: 20, repFaction: 'mountain' },
  { id: 'outlaw_raid', name: 'Outlaw Raid', color: '\u00a74',
    desc: 'A band of outlaws is raiding the area! Defend yourself!',
    durationTicks: 6000,   // 5 minutes
    xpReward: 35, repReward: 30, repFaction: 'coastal' },
  { id: 'blight', name: 'The Blight', color: '\u00a72',
    desc: 'A mysterious blight spreads across the land. Crops wither and fail.',
    durationTicks: 24000,  // 1 MC day (20 minutes)
    xpReward: 30, repReward: 20, repFaction: 'forest' }
];

const CRISIS_CONFIG = {
  dailyCheckInterval: 24000, statusCheckInterval: 200, triggerChance: 0.10,
  scoreboardObj: 'horizons_crisis',
  activeIdKey: 'horizons_crisis_active_id', activeStartKey: 'horizons_crisis_start_tick',
  activeDurationKey: 'horizons_crisis_duration', respondersKey: 'horizons_crisis_responders'
};

function getActiveCrisisId(server) {
  return server.persistentData ? (server.persistentData.getString(CRISIS_CONFIG.activeIdKey) || '') : '';
}
function getCrisisById(id) {
  for (let i = 0; i < CRISES.length; i++) { if (CRISES[i].id === id) return CRISES[i]; }
  return null;
}
function isCrisisActive(server) { return getActiveCrisisId(server).length > 0; }
function getCrisisStartTick(server) { return server.persistentData ? (server.persistentData.getInt(CRISIS_CONFIG.activeStartKey) || 0) : 0; }
function getCrisisDuration(server) { return server.persistentData ? (server.persistentData.getInt(CRISIS_CONFIG.activeDurationKey) || 0) : 0; }

// --- Start a crisis ---
function startCrisis(server, crisis) {
  if (server.persistentData) {
    server.persistentData.putString(CRISIS_CONFIG.activeIdKey, crisis.id);
    server.persistentData.putInt(CRISIS_CONFIG.activeStartKey, server.tickCount);
    server.persistentData.putInt(CRISIS_CONFIG.activeDurationKey, crisis.durationTicks);
    server.persistentData.putString(CRISIS_CONFIG.respondersKey, '[]');
  }

  server.runCommandSilent('scoreboard objectives add ' + CRISIS_CONFIG.scoreboardObj + ' dummy');
  server.runCommandSilent('scoreboard players set crisis_active ' + CRISIS_CONFIG.scoreboardObj + ' 1');

  // Broadcast alarm
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.add('crisis_active');
    player.stages.add('crisis_' + crisis.id);

    player.tell('');
    player.tell(crisis.color + '\u00a7l!!! CRISIS: ' + crisis.name.toUpperCase() + ' !!!');
    player.tell('\u00a77' + crisis.desc);
    player.tell('\u00a77Duration: \u00a7f' + Math.floor(crisis.durationTicks / 1200) + ' minutes');
    player.tell('\u00a7aRespond to this crisis for bonus XP and reputation!');
    player.tell('');
  }

  // Alarm sound
  server.runCommandSilent('playsound minecraft:entity.elder_guardian.curse player @a ~ ~ ~ 1');
  server.runCommandSilent('title @a subtitle {"text":"' + crisis.name + '","color":"red"}');
  server.runCommandSilent('title @a title {"text":"CRISIS!","color":"dark_red"}');

  // Apply crisis-specific effects
  applyCrisisEffects(server, crisis, true);

  console.log('[Horizons/Crisis] Started: ' + crisis.name);
}

// --- End a crisis ---
function endCrisis(server) {
  const crisisId = getActiveCrisisId(server);
  if (!crisisId) return;

  const crisis = getCrisisById(crisisId);

  // Get responders list
  let responders = [];
  try {
    responders = JSON.parse(server.persistentData.getString(CRISIS_CONFIG.respondersKey) || '[]');
  } catch (e) { responders = []; }

  // Clear crisis state
  if (server.persistentData) {
    server.persistentData.putString(CRISIS_CONFIG.activeIdKey, '');
    server.persistentData.putInt(CRISIS_CONFIG.activeStartKey, 0);
    server.persistentData.putInt(CRISIS_CONFIG.activeDurationKey, 0);
  }

  server.runCommandSilent('scoreboard players set crisis_active ' + CRISIS_CONFIG.scoreboardObj + ' 0');

  // Reward responders and notify everyone
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    player.stages.remove('crisis_active');
    if (crisis) player.stages.remove('crisis_' + crisis.id);

    if (crisis && responders.includes(player.username)) {
      // Reward participants
      server.runCommandSilent('horizons level grantxp ' + crisis.xpReward);
      server.runCommandSilent('horizons reward reputation ' + crisis.repFaction + ' ' + crisis.repReward);
      player.tell('\u00a7a\u00a7l[Crisis Resolved!] \u00a77Thank you for responding!');
      player.tell('\u00a7a  +' + crisis.xpReward + ' Pathfinder XP');
      player.tell('\u00a7a  +' + crisis.repReward + ' ' + crisis.repFaction + ' reputation');
      player.stages.add('crisis_resolved_' + crisis.id);
    } else {
      player.tell('\u00a77[Horizons] The crisis has passed.');
    }
  }

  // Remove crisis effects
  if (crisis) applyCrisisEffects(server, crisis, false);

  console.log('[Horizons/Crisis] Ended: ' + (crisis ? crisis.name : crisisId));
}

// --- Apply/remove crisis-specific effects ---
function applyCrisisEffects(server, crisis, apply) {
  switch (crisis.id) {
    case 'village_siege':
      if (apply) {
        // Increase mob difficulty near villages
        server.runCommandSilent('effect give @a minecraft:bad_omen 600 0 true');
      } else {
        server.runCommandSilent('effect clear @a minecraft:bad_omen');
      }
      break;
    case 'dungeon_overflow':
      if (apply) {
        // Thematic: give resistance to help survive overflow
        server.runCommandSilent('effect give @a minecraft:resistance 600 0 true');
      }
      break;
    case 'outlaw_raid':
      if (apply) {
        // Apply combat-oriented effects
        server.runCommandSilent('effect give @a minecraft:strength 300 0 true');
      }
      break;
    case 'blight':
      if (apply) {
        // Apply hunger effect to simulate blight
        server.runCommandSilent('effect give @a minecraft:hunger 1200 0 true');
      } else {
        server.runCommandSilent('effect clear @a minecraft:hunger');
      }
      break;
  }
}

// --- Track crisis participation (players alive during crisis are responders) ---
function markCrisisParticipant(server, playerName) {
  if (!server.persistentData) return;
  let responders;
  try {
    responders = JSON.parse(server.persistentData.getString(CRISIS_CONFIG.respondersKey) || '[]');
  } catch (e) { responders = []; }

  if (!responders.includes(playerName)) {
    responders.push(playerName);
    server.persistentData.putString(CRISIS_CONFIG.respondersKey, JSON.stringify(responders));
  }
}

// ============================================================
// TICK HANDLERS
// ============================================================

// --- Daily crisis roll ---
let lastCrisisRollDay = -1;

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % CRISIS_CONFIG.dailyCheckInterval !== 0) return;

  const worldDay = Math.floor(server.overworld.dayTime / 24000);
  if (worldDay === lastCrisisRollDay) return;
  lastCrisisRollDay = worldDay;

  // Don't trigger if one is already active
  if (isCrisisActive(server)) return;

  // Roll for crisis
  if (Math.random() > CRISIS_CONFIG.triggerChance) return;

  // Pick random crisis
  const crisis = CRISES[Math.floor(Math.random() * CRISES.length)];
  startCrisis(server, crisis);
});

// --- Crisis duration check and participation tracking ---
ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % CRISIS_CONFIG.statusCheckInterval !== 0) return;

  if (!isCrisisActive(server)) return;

  const startTick = getCrisisStartTick(server);
  const duration = getCrisisDuration(server);
  const elapsed = server.tickCount - startTick;

  // Track all online players as participants
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;
    if (player.stages.has('crisis_active')) {
      markCrisisParticipant(server, player.username);
    }
  }

  // Check if crisis should end
  if (elapsed >= duration) {
    endCrisis(server);
  }
});

// ============================================================
// PLAYER JOIN — Apply active crisis stages
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const server = player.server;

  if (isCrisisActive(server)) {
    const crisisId = getActiveCrisisId(server);
    const crisis = getCrisisById(crisisId);
    if (crisis) {
      player.stages.add('crisis_active');
      player.stages.add('crisis_' + crisis.id);
      player.tell(crisis.color + '\u00a7l[CRISIS] ' + crisis.name + ' is ongoing!');
      player.tell('\u00a77' + crisis.desc);
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
      .then(Commands.literal('crisis')
        // /horizons crisis status
        .then(Commands.literal('status').executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;
          const server = player.server;

          player.tell('\u00a7e=== Crisis Status ===');

          if (isCrisisActive(server)) {
            const crisisId = getActiveCrisisId(server);
            const crisis = getCrisisById(crisisId);
            if (crisis) {
              const startTick = getCrisisStartTick(server);
              const duration = getCrisisDuration(server);
              const elapsed = server.tickCount - startTick;
              const remaining = Math.max(0, duration - elapsed);
              const remainingSec = Math.floor(remaining / 20);
              const remainingMin = Math.floor(remainingSec / 60);
              const remainingSecRem = remainingSec % 60;

              player.tell(crisis.color + '\u00a7l[ACTIVE] ' + crisis.name);
              player.tell('\u00a77' + crisis.desc);
              player.tell('\u00a77Time remaining: \u00a7f' + remainingMin + 'm ' + remainingSecRem + 's');

              let responders;
              try {
                responders = JSON.parse(server.persistentData.getString(CRISIS_CONFIG.respondersKey) || '[]');
              } catch (e) { responders = []; }
              player.tell('\u00a77Responders: \u00a7f' + responders.length);

              // Progress bar
              const pct = Math.floor((elapsed / duration) * 100);
              const barFilled = Math.floor(pct / 5);
              const bar = '\u00a7c' + '='.repeat(Math.min(barFilled, 20)) + '\u00a78' + '='.repeat(Math.max(20 - barFilled, 0));
              player.tell('\u00a77Progress: ' + bar + ' \u00a7f' + pct + '%');
            }
          } else {
            player.tell('\u00a7aNo active crisis. All is calm... for now.');
          }

          // Show resolved crises count
          let resolved = 0;
          for (let i = 0; i < CRISES.length; i++) {
            if (player.stages.has('crisis_resolved_' + CRISES[i].id)) resolved++;
          }
          player.tell('\u00a77Crises resolved: \u00a7f' + resolved + '/' + CRISES.length);

          return 1;
        }))
        // /horizons crisis trigger <type> — OP only
        .then(Commands.literal('trigger')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const typeId = event.getArguments().STRING.getResult(ctx, 'type');
              const crisis = getCrisisById(typeId);

              if (!crisis) {
                player.tell('\u00a7c[Horizons] Unknown crisis type: ' + typeId);
                player.tell('\u00a77Valid: ' + CRISES.map(c => c.id).join(', '));
                return 0;
              }

              // End existing crisis first
              if (isCrisisActive(player.server)) {
                endCrisis(player.server);
              }

              startCrisis(player.server, crisis);
              player.tell('\u00a7a[Horizons] Triggered crisis: ' + crisis.name);
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Crisis Events loaded (' + CRISES.length + ' crisis types)');
console.log('[Horizons] Commands: /horizons crisis [status|trigger]');
