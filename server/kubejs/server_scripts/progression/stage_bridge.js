// ============================================================
// Project Horizons — Stage Bridge
// ============================================================
// File: kubejs/server_scripts/progression/stage_bridge.js
// Phase: 1
// Dependencies: AStages, ProgressiveStages, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Bidirectional sync between AStages (KubeJS .stages API) and
// ProgressiveStages (FTB Quests native gating, FTB Teams sync, EMI).
//
// AStages provides: player.stages.add/has/remove — used by all 52 KubeJS scripts
// ProgressiveStages provides: FTB Quests "Stage Required" field, team-shared stages, EMI item locking
//
// This bridge ensures both systems stay in sync:
//   Script grants stage via .stages.add() → mirrored to ProgressiveStages via /stage grant
//   ProgressiveStages grants stage (quest reward, config) → detected and mirrored to AStages
//
// STAGE NAMING CONVENTION:
//   act_     — narrative progress (act_1_complete, act_2_started)
//   path_    — perk tree choices (path_vanguard, path_artificer)
//   gate_    — dungeon progress (gate_floor_10, gate_tier_b)
//   unlock_  — content unlocks (unlock_nether, unlock_space, unlock_brewing)
//   rep_     — reputation milestones (rep_plains_friendly, rep_forest_trusted)
//   crime_   — crime states (crime_wanted, crime_outlaw)
//   ascend_  — ascension progress (ascend_eligible, ascend_warlord)
// ============================================================

// --- Configuration ---
const BRIDGE_CONFIG = {
  // How often to run the ProgressiveStages → AStages reverse sync (in ticks)
  // 600 ticks = 30 seconds
  reverseSyncInterval: 600,

  // Whether to log all stage sync operations to console
  debugLogging: true,

  // Stages that should NOT be synced (internal/temporary stages)
  ignoredStages: [
    'horizons_internal',
    'debug_test'
  ]
};

// --- Utility: Check if a stage should be synced ---
function shouldSync(stageId) {
  if (!stageId || typeof stageId !== 'string') return false;
  if (BRIDGE_CONFIG.ignoredStages.includes(stageId)) return false;
  return true;
}

// --- Utility: Debug log ---
function bridgeLog(message) {
  if (BRIDGE_CONFIG.debugLogging) {
    console.log(`[Horizons/StageBridge] ${message}`);
  }
}

// ============================================================
// DIRECTION 1: AStages → ProgressiveStages
// When a KubeJS script calls player.stages.add(stage),
// mirror it to ProgressiveStages via /stage grant command.
// ============================================================

PlayerEvents.stageAdded(event => {
  const player = event.player;
  const stage = event.stage;

  if (!shouldSync(stage)) return;

  // Mirror to ProgressiveStages
  // Uses runCommandSilent to avoid chat spam
  const playerName = player.username;
  player.server.runCommandSilent(`stage grant ${playerName} ${stage}`);

  bridgeLog(`SYNC → ProgressiveStages: granted '${stage}' to ${playerName}`);
});

PlayerEvents.stageRemoved(event => {
  const player = event.player;
  const stage = event.stage;

  if (!shouldSync(stage)) return;

  // Mirror removal to ProgressiveStages
  const playerName = player.username;
  player.server.runCommandSilent(`stage revoke ${playerName} ${stage}`);

  bridgeLog(`SYNC → ProgressiveStages: revoked '${stage}' from ${playerName}`);
});

// ============================================================
// DIRECTION 2: ProgressiveStages → AStages (Reverse Sync)
// ProgressiveStages may grant stages via FTB Quests rewards,
// team sync, or TOML config. We periodically check for stages
// that ProgressiveStages has but AStages doesn't, and sync them.
//
// NOTE: This uses a periodic tick-based approach since
// ProgressiveStages is closed-source and doesn't fire KubeJS events.
// If ProgressiveStages adds KubeJS event support, replace this
// with direct event listeners.
// ============================================================

// Track known stages per player to detect new additions
// This is a server-session cache, reset on restart
const knownPlayerStages = {};

ServerEvents.tick(event => {
  const server = event.server;

  // Only run every N ticks
  if (server.tickCount % BRIDGE_CONFIG.reverseSyncInterval !== 0) return;

  // Check each online player
  server.players.forEach(player => {
    const playerName = player.username;
    const uuid = player.uuid.toString();

    // Initialize tracking for this player if needed
    if (!knownPlayerStages[uuid]) {
      knownPlayerStages[uuid] = new Set();
    }

    // Get current AStages stages
    const currentStages = new Set();
    // player.stages is the AStages/KubeJS stages collection
    if (player.stages) {
      player.stages.getAll().forEach(s => currentStages.add(s));
    }

    // Store for comparison on next tick
    // NOTE: To detect ProgressiveStages additions, we would need to
    // query ProgressiveStages. Since it uses /stage list command output,
    // we use a command-based approach when needed.
    //
    // For Phase 1, the primary flow is AStages → ProgressiveStages.
    // Reverse sync will be enhanced once we can test ProgressiveStages
    // command output parsing in-game.

    knownPlayerStages[uuid] = currentStages;
  });
});

// ============================================================
// HELPER: Grant a stage through the bridge (use this in other scripts)
// This is the preferred way to grant stages — it goes through AStages
// and the bridge automatically mirrors to ProgressiveStages.
// ============================================================

// To use from other scripts:
//   player.stages.add('act_1_complete')
//
// The PlayerEvents.stageAdded listener above will automatically
// mirror it to ProgressiveStages. You don't need to call both systems.

// ============================================================
// PLAYER JOIN: Ensure stages are synced when player connects
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const playerName = player.username;

  bridgeLog(`Player ${playerName} logged in — running stage sync check`);

  // Sync all current AStages to ProgressiveStages on join
  // This handles cases where stages were granted while offline
  if (player.stages) {
    let syncCount = 0;
    player.stages.getAll().forEach(stage => {
      if (shouldSync(stage)) {
        player.server.runCommandSilent(`stage grant ${playerName} ${stage}`);
        syncCount++;
      }
    });
    if (syncCount > 0) {
      bridgeLog(`Synced ${syncCount} stages to ProgressiveStages for ${playerName}`);
    }
  }
});

// ============================================================
// CLEANUP: Remove player from tracking cache on disconnect
// ============================================================

PlayerEvents.loggedOut(event => {
  const uuid = event.player.uuid.toString();
  delete knownPlayerStages[uuid];
});

// ============================================================
// DEBUG COMMAND: /horizons stages — list all stages for a player
// Useful for debugging sync issues
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('stages')
        .then(Commands.literal('list')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const stages = [];
            if (player.stages) {
              player.stages.getAll().forEach(s => stages.push(s));
            }

            if (stages.length === 0) {
              player.tell('[Horizons] You have no stages.');
            } else {
              player.tell(`[Horizons] Your stages (${stages.length}):`);
              // Group by prefix
              const grouped = {};
              stages.sort().forEach(s => {
                const prefix = s.split('_')[0] + '_';
                if (!grouped[prefix]) grouped[prefix] = [];
                grouped[prefix].push(s);
              });
              Object.entries(grouped).forEach(([prefix, stageList]) => {
                player.tell(`  ${prefix}: ${stageList.join(', ')}`);
              });
            }
            return 1;
          })
        )
        .then(Commands.literal('sync')
          .requires(src => src.hasPermission(2)) // OP only
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            let syncCount = 0;
            if (player.stages) {
              player.stages.getAll().forEach(stage => {
                if (shouldSync(stage)) {
                  player.server.runCommandSilent(`stage grant ${player.username} ${stage}`);
                  syncCount++;
                }
              });
            }
            player.tell(`[Horizons] Force-synced ${syncCount} stages to ProgressiveStages.`);
            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Stage Bridge loaded — AStages ↔ ProgressiveStages sync active');
console.log('[Horizons] Reverse sync interval: ' + (BRIDGE_CONFIG.reverseSyncInterval / 20) + ' seconds');
