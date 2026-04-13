// ============================================================
// Project Horizons — Encounter Scheduler
// ============================================================
// File: kubejs/server_scripts/world/encounter_scheduler.js
// Phase: 3
// Dependencies: KubeJS, encounter_spawner.js
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Periodically rolls for random encounters for each online player.
// Encounter chance is modified by time of day and biome proximity.
// Enforces per-type cooldowns to prevent encounter spam.
//
// COMMANDS:
//   /horizons encounter force <type>  — OP only, force-trigger an encounter
// ============================================================

// --- Configuration ---
const ENCOUNTER_SCHED = {
  rollInterval: 3000,           // ticks between rolls (2.5 minutes)
  baseChance: 0.10,             // 10% base chance per roll
  cooldownMs: 1800000,          // 30 minutes between same type (ms)
  cooldownKey: 'encounter_cd_', // persistentData prefix for cooldowns
  activeKey: 'encounter_active', // persistentData key for active encounter type
  activeTimeKey: 'encounter_active_time' // when the encounter started
};

const ENCOUNTER_TYPES = [
  { id: 'wandering_merchant', weight: 20, label: 'Wandering Merchant' },
  { id: 'lost_child', weight: 15, label: 'Lost Child' },
  { id: 'bandit_ambush', weight: 15, label: 'Bandit Ambush' },
  { id: 'mysterious_stranger', weight: 10, label: 'Mysterious Stranger' },
  { id: 'treasure_map', weight: 20, label: 'Treasure Map' },
  { id: 'herb_gatherer', weight: 20, label: 'Herb Gatherer' }
];

// Total weight for weighted selection
const TOTAL_WEIGHT = ENCOUNTER_TYPES.reduce((sum, e) => sum + e.weight, 0);

// --- Time-of-day modifier ---
function getTimeModifier(server) {
  // Minecraft day cycle: 0-24000 ticks
  // Daytime (0-12000) = normal, sunset/sunrise (11000-13500) = +bonus, night (13500-22500) = +more
  const dayTime = server.overworld.dayTime % 24000;
  if (dayTime >= 13500 && dayTime <= 22500) return 1.3; // Night: 30% more encounters
  if (dayTime >= 11000 && dayTime <= 13500) return 1.15; // Dusk: 15% bonus
  return 1.0;
}

// --- Select a random encounter type (weighted) ---
function selectEncounterType() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < ENCOUNTER_TYPES.length; i++) {
    roll -= ENCOUNTER_TYPES[i].weight;
    if (roll <= 0) return ENCOUNTER_TYPES[i];
  }
  return ENCOUNTER_TYPES[0];
}

// --- Check cooldown for a player + encounter type ---
function isOnCooldown(player, typeId) {
  const data = player.persistentData;
  const lastTime = data.getLong(ENCOUNTER_SCHED.cooldownKey + typeId);
  if (!lastTime) return false;
  const now = Date.now();
  return (now - lastTime) < ENCOUNTER_SCHED.cooldownMs;
}

// --- Set cooldown for a player + encounter type ---
function setCooldown(player, typeId) {
  player.persistentData.putLong(ENCOUNTER_SCHED.cooldownKey + typeId, Date.now());
}

// --- Check if player has an active encounter ---
function hasActiveEncounter(player) {
  const active = player.persistentData.getString(ENCOUNTER_SCHED.activeKey);
  return active && active.length > 0;
}

// --- Set active encounter ---
function setActiveEncounter(player, typeId) {
  player.persistentData.putString(ENCOUNTER_SCHED.activeKey, typeId);
  player.persistentData.putLong(ENCOUNTER_SCHED.activeTimeKey, Date.now());
}

// --- Clear active encounter ---
function clearActiveEncounter(player) {
  player.persistentData.putString(ENCOUNTER_SCHED.activeKey, '');
}

// --- Trigger an encounter ---
function triggerEncounter(player, encounterType) {
  const server = player.server;

  // Set cooldown and mark as active
  setCooldown(player, encounterType.id);
  setActiveEncounter(player, encounterType.id);

  // Add tracking stage
  player.stages.add('encounter_' + encounterType.id);

  // Dispatch to encounter_spawner via command
  server.runCommandSilent('horizons encounter spawn ' + player.username + ' ' + encounterType.id);

  console.log('[Horizons/Encounters] Triggered ' + encounterType.id + ' for ' + player.username);
}

// ============================================================
// TICK HANDLER — Roll for encounters every 3000 ticks
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % ENCOUNTER_SCHED.rollInterval !== 0) return;

  const timeMod = getTimeModifier(server);
  const players = server.players;

  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;

    // Skip if player already has an active encounter
    if (hasActiveEncounter(player)) continue;

    // Roll for encounter
    const roll = Math.random();
    const effectiveChance = ENCOUNTER_SCHED.baseChance * timeMod;

    if (roll > effectiveChance) continue;

    // Select encounter type
    const encounter = selectEncounterType();

    // Check cooldown
    if (isOnCooldown(player, encounter.id)) continue;

    // Trigger the encounter
    triggerEncounter(player, encounter);
  }
});

// --- Auto-expire active encounters after 5 minutes ---
ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % 1200 !== 0) return; // Check every minute

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;

    if (!hasActiveEncounter(player)) continue;

    const startTime = player.persistentData.getLong(ENCOUNTER_SCHED.activeTimeKey);
    if (startTime && (Date.now() - startTime) > 300000) { // 5 minutes
      const activeType = player.persistentData.getString(ENCOUNTER_SCHED.activeKey);
      player.tell('\u00a78[Horizons] The ' + activeType.replace(/_/g, ' ') + ' has moved on...');
      clearActiveEncounter(player);
      // Remove encounter stage
      if (player.stages.has('encounter_' + activeType)) {
        player.stages.remove('encounter_' + activeType);
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
      .then(Commands.literal('encounter')
        // /horizons encounter force <type> — OP only
        .then(Commands.literal('force')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const typeId = event.getArguments().STRING.getResult(ctx, 'type');

              // Find the encounter type
              let found = null;
              for (let i = 0; i < ENCOUNTER_TYPES.length; i++) {
                if (ENCOUNTER_TYPES[i].id === typeId) {
                  found = ENCOUNTER_TYPES[i];
                  break;
                }
              }

              if (!found) {
                player.tell('\u00a7c[Horizons] Unknown encounter type: ' + typeId);
                player.tell('\u00a77Valid types: ' + ENCOUNTER_TYPES.map(e => e.id).join(', '));
                return 0;
              }

              // Clear any existing encounter first
              clearActiveEncounter(player);
              triggerEncounter(player, found);
              player.tell('\u00a7a[Horizons] Forced encounter: ' + found.label);
              return 1;
            })
          )
        )
        // /horizons encounter status
        .then(Commands.literal('status').executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;

          if (hasActiveEncounter(player)) {
            const activeType = player.persistentData.getString(ENCOUNTER_SCHED.activeKey);
            const startTime = player.persistentData.getLong(ENCOUNTER_SCHED.activeTimeKey);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            player.tell('\u00a7e[Horizons] Active encounter: \u00a7f' + activeType.replace(/_/g, ' '));
            player.tell('\u00a77Time active: ' + elapsed + 's');
          } else {
            player.tell('\u00a77[Horizons] No active encounter.');
          }
          return 1;
        }))
      )
  );
});

console.log('[Horizons] Encounter Scheduler loaded');
console.log('[Horizons] Commands: /horizons encounter [force|status]');
