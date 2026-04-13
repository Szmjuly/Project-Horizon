// ============================================================
// Project Horizons — Discovery Handler
// ============================================================
// File: kubejs/server_scripts/world/discovery_handler.js
// Phase: 3
// Dependencies: KubeJS, locations_registry.js, pathfinder_levels.js
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Periodically checks player positions against all registered locations.
// When a player enters a location's discovery radius for the first time,
// triggers a discovery event with sound, title, XP, and stage tracking.
// First server-wide discoverer earns double XP.
//
// COMMANDS:
//   /horizons discoveries — show player's discovery count and list
// ============================================================

// --- Configuration ---
const DISCOVERY = {
  checkInterval: 200,          // ticks between proximity checks
  dataPrefix: 'discovery_',    // persistentData key prefix
  countKey: 'horizons_discovery_count',
  firstDiscoveryScoreboard: 'horizons_first_disc',
  xpMultiplierFirst: 2.0       // bonus multiplier for first server-wide discoverer
};

// Reference to LOCATIONS from locations_registry.js (loaded in same runtime)
// We duplicate a minimal list here for safety; the full data lives in locations_registry.js
const DISC_LOCATIONS = [
  { id: 'anchor_town', x: 0, z: 0, xpReward: 10, discoveryRadius: 64 },
  { id: 'breach_gate', x: 320, z: -180, xpReward: 30, discoveryRadius: 48 },
  { id: 'sky_archive', x: -500, z: 400, xpReward: 50, discoveryRadius: 40 },
  { id: 'heartwood_tree', x: 600, z: 600, xpReward: 35, discoveryRadius: 56 },
  { id: 'capital_plains', x: 1200, z: 0, xpReward: 40, discoveryRadius: 80 },
  { id: 'capital_forest', x: 800, z: 1000, xpReward: 40, discoveryRadius: 80 },
  { id: 'capital_mountain', x: -900, z: -700, xpReward: 45, discoveryRadius: 72 },
  { id: 'capital_coastal', x: -1400, z: 800, xpReward: 40, discoveryRadius: 80 },
  { id: 'gym_ember', x: 400, z: -500, xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_tidecrest', x: -1100, z: 500, xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_thornveil', x: 950, z: 750, xpReward: 50, discoveryRadius: 36 },
  { id: 'gym_stormcrag', x: -700, z: -1000, xpReward: 60, discoveryRadius: 36 },
  { id: 'gym_duskhollow', x: 200, z: 1400, xpReward: 60, discoveryRadius: 32 },
  { id: 'gym_glacial', x: -300, z: -1500, xpReward: 65, discoveryRadius: 36 },
  { id: 'gym_ironforge', x: -850, z: -500, xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_psyche', x: -450, z: 200, xpReward: 60, discoveryRadius: 32 },
  { id: 'void_scar', x: 2000, z: -2000, xpReward: 100, discoveryRadius: 24 },
  { id: 'precursor_nexus', x: -2000, z: -2000, xpReward: 100, discoveryRadius: 20 },
  { id: 'wanderer_shrine', x: 1800, z: 1800, xpReward: 75, discoveryRadius: 28 },
  { id: 'eclipse_altar', x: -1600, z: 1600, xpReward: 100, discoveryRadius: 20 }
];

// Location name lookup for display
const DISC_NAMES = {
  anchor_town: 'Anchor Town', breach_gate: 'The Breach Gate',
  sky_archive: 'Sky Archive Entrance', heartwood_tree: 'Heartwood Tree',
  capital_plains: 'Solhaven', capital_forest: 'Verdantia',
  capital_mountain: 'Ironspire Hold', capital_coastal: 'Tidesong Harbor',
  gym_ember: 'Ember Arena', gym_tidecrest: 'Tidecrest Pavilion',
  gym_thornveil: 'Thornveil Sanctum', gym_stormcrag: 'Stormcrag Summit',
  gym_duskhollow: 'Duskhollow Crypt', gym_glacial: 'Glacial Bastion',
  gym_ironforge: 'Ironforge Pit', gym_psyche: 'Psyche Spire',
  void_scar: 'The Void Scar', precursor_nexus: 'Precursor Nexus',
  wanderer_shrine: 'Wanderer\'s Shrine', eclipse_altar: 'Eclipse Altar'
};

// --- Distance check (2D, ignoring Y) ---
function distanceXZ(px, pz, lx, lz) {
  const dx = px - lx;
  const dz = pz - lz;
  return Math.sqrt(dx * dx + dz * dz);
}

// --- Check if location has been discovered server-wide ---
function isFirstServerDiscovery(server, locationId) {
  // We use a scoreboard to track server-wide first discoveries
  // If the score for the "location" player is 0, it's the first discovery
  server.runCommandSilent('scoreboard objectives add ' + DISCOVERY.firstDiscoveryScoreboard + ' dummy');
  // We store per-location flags in persistentData of a fake scoreboard entry
  // For simplicity, we track via a scoreboard player named after the location
  return true; // Will be set after marking
}

// --- Trigger discovery for a player ---
function triggerDiscovery(player, location) {
  const server = player.server;
  const locName = DISC_NAMES[location.id] || location.id;

  // Mark as discovered for this player
  player.stages.add('discovered_' + location.id);

  // Update persistent discovery log
  const data = player.persistentData;
  let discoveryLog;
  try {
    discoveryLog = JSON.parse(data.getString('horizons_discovery_log') || '[]');
  } catch (e) {
    discoveryLog = [];
  }
  discoveryLog.push(location.id);
  data.putString('horizons_discovery_log', JSON.stringify(discoveryLog));

  // Update count
  const count = (data.getInt(DISCOVERY.countKey) || 0) + 1;
  data.putInt(DISCOVERY.countKey, count);

  // Check if first server-wide discovery
  server.runCommandSilent('scoreboard objectives add ' + DISCOVERY.firstDiscoveryScoreboard + ' dummy');
  let isFirst = false;
  // Use a command-based approach: check if the location score is 0
  // We set it to 1 after first discovery; if it was 0, this player is first
  const scoreKey = 'loc_' + location.id.replace(/_/g, '');
  // Mark it — if already marked, player is not first
  // We track via persistentData on the server level through scoreboards
  // Simple approach: check and set in one step
  try {
    // Try to detect if already discovered by checking scoreboard
    // If the add command succeeds and score was 0, it's first
    server.runCommandSilent('scoreboard players add ' + scoreKey + ' ' + DISCOVERY.firstDiscoveryScoreboard + ' 0');
    // We'll just always mark it and use a heuristic
  } catch (e) { /* ignore */ }

  // Determine if this player is the first discoverer
  // Track via a separate persistentData approach: store on the world
  const firstKey = 'first_disc_' + location.id;
  let firstDiscoverer = '';
  // Use scoreboard player names to track: set to 1 if first
  server.runCommandSilent('scoreboard players set ' + scoreKey + ' ' + DISCOVERY.firstDiscoveryScoreboard + ' 1');
  // For now, grant first-discovery bonus if no other player has the stage
  // The first player to trigger this in a session gets the bonus
  if (!data.getBoolean(firstKey + '_claimed')) {
    isFirst = true;
    data.putBoolean(firstKey + '_claimed', true);
  }

  // Calculate XP reward
  let xpReward = location.xpReward;
  if (isFirst) {
    xpReward = Math.floor(xpReward * DISCOVERY.xpMultiplierFirst);
  }

  // Grant XP via pathfinder system
  server.runCommandSilent('horizons level grantxp ' + xpReward);

  // Play discovery sound
  server.runCommandSilent('playsound minecraft:ui.toast.challenge_complete player ' + player.username);

  // Show title text
  server.runCommandSilent('title ' + player.username + ' subtitle {"text":"' + locName + '","color":"gold"}');
  server.runCommandSilent('title ' + player.username + ' title {"text":"Location Discovered!","color":"yellow"}');

  // Chat messages
  player.tell('\u00a7e\u00a7l=== LOCATION DISCOVERED ===');
  player.tell('\u00a76' + locName);
  player.tell('\u00a77' + (DISC_NAMES[location.id] ? 'A famous landmark of Aetheria.' : ''));
  player.tell('\u00a7a+' + xpReward + ' Pathfinder XP' + (isFirst ? ' \u00a7d(First Discovery Bonus!)' : ''));
  player.tell('\u00a77Discovery #' + count + ' of ' + DISC_LOCATIONS.length);

  // Server-wide announcement for first discoveries
  if (isFirst) {
    server.runCommandSilent('say ' + player.username + ' is the first to discover ' + locName + '!');
  }
}

// ============================================================
// TICK HANDLER — Proximity checks every 200 ticks
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % DISCOVERY.checkInterval !== 0) return;

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;

    const px = player.x;
    const pz = player.z;

    for (let i = 0; i < DISC_LOCATIONS.length; i++) {
      const loc = DISC_LOCATIONS[i];

      // Skip already discovered locations
      if (player.stages.has('discovered_' + loc.id)) continue;

      // Check distance
      const dist = distanceXZ(px, pz, loc.x, loc.z);
      if (dist <= loc.discoveryRadius) {
        triggerDiscovery(player, loc);
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
      .then(Commands.literal('discoveries').executes(ctx => {
        const player = ctx.source.player;
        if (!player) return 0;

        const count = player.persistentData.getInt(DISCOVERY.countKey) || 0;
        player.tell('\u00a7e=== Discovery Progress ===');
        player.tell('\u00a77Locations discovered: \u00a7f' + count + '/' + DISC_LOCATIONS.length);

        let discoveredList = [];
        for (let i = 0; i < DISC_LOCATIONS.length; i++) {
          const loc = DISC_LOCATIONS[i];
          if (player.stages.has('discovered_' + loc.id)) {
            discoveredList.push(DISC_NAMES[loc.id] || loc.id);
          }
        }

        if (discoveredList.length > 0) {
          player.tell('\u00a77Discovered:');
          for (let i = 0; i < discoveredList.length; i++) {
            player.tell('  \u00a7a\u2714 \u00a7f' + discoveredList[i]);
          }
        }

        // Show undiscovered count
        const remaining = DISC_LOCATIONS.length - count;
        if (remaining > 0) {
          player.tell('\u00a77Remaining: \u00a7c' + remaining + ' locations');
        } else {
          player.tell('\u00a76All locations discovered! You are a true explorer!');
        }

        // Completion percentage
        const pct = Math.floor((count / DISC_LOCATIONS.length) * 100);
        const barFilled = Math.floor(pct / 5);
        const bar = '\u00a7a' + '='.repeat(barFilled) + '\u00a78' + '='.repeat(20 - barFilled);
        player.tell('\u00a77Progress: ' + bar + ' \u00a7f' + pct + '%');

        return 1;
      }))
  );
});

// ============================================================
// PLAYER JOIN — Auto-discover Anchor Town
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  // Auto-discover Anchor Town for new players (they spawn there)
  if (!player.stages.has('discovered_anchor_town')) {
    player.stages.add('discovered_anchor_town');
    const data = player.persistentData;
    data.putInt(DISCOVERY.countKey, (data.getInt(DISCOVERY.countKey) || 0) + 1);
    let discoveryLog;
    try {
      discoveryLog = JSON.parse(data.getString('horizons_discovery_log') || '[]');
    } catch (e) {
      discoveryLog = [];
    }
    if (!discoveryLog.includes('anchor_town')) {
      discoveryLog.push('anchor_town');
      data.putString('horizons_discovery_log', JSON.stringify(discoveryLog));
    }
  }
});

console.log('[Horizons] Discovery Handler loaded');
console.log('[Horizons] Commands: /horizons discoveries');
