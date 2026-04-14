// ============================================================
// Project Horizons — Location States
// File: kubejs/server_scripts/world/location_states.js
// Phase: 4 | Dependencies: KubeJS, locations_registry.js
// States: Pristine, Active, Ruined, Hidden, Contested, Restored
// ============================================================

// --- Valid states ---
const LOC_STATES = {
  pristine:  { id: 'pristine',  name: 'Pristine',  color: '\u00a7f', symbol: '\u2726',
    desc: 'Untouched. This location has not yet been discovered.' },
  active:    { id: 'active',    name: 'Active',     color: '\u00a7a', symbol: '\u2714',
    desc: 'Functioning normally. NPCs and services available.' },
  ruined:    { id: 'ruined',    name: 'Ruined',     color: '\u00a74', symbol: '\u2718',
    desc: 'Damaged and abandoned. No NPCs or services. Can be restored.' },
  hidden:    { id: 'hidden',    name: 'Hidden',     color: '\u00a78', symbol: '\u2620',
    desc: 'Concealed from the world. Cannot be visited until revealed.' },
  contested: { id: 'contested', name: 'Contested',  color: '\u00a7c', symbol: '\u2694',
    desc: 'Under faction conflict. PvP enabled. Control is up for grabs.' },
  restored:  { id: 'restored',  name: 'Restored',   color: '\u00a7e', symbol: '\u2605',
    desc: 'Rebuilt by Pathfinders. Enhanced rewards and services.' }
};

const VALID_STATE_IDS = Object.keys(LOC_STATES);

const LOCSTATE_CONFIG = {
  scoreboardObj: 'horizons_loc_states',
  dataPrefix: 'locstate_',
  checkInterval: 400 // Ticks between state effect checks
};

// --- Location IDs (mirrored from locations_registry.js) ---
const LOCATION_IDS = [
  'anchor_town', 'breach_gate', 'sky_archive', 'heartwood_tree',
  'capital_plains', 'capital_forest', 'capital_mountain', 'capital_coastal',
  'gym_ember', 'gym_tidecrest', 'gym_thornveil', 'gym_stormcrag',
  'gym_duskhollow', 'gym_glacial', 'gym_ironforge', 'gym_psyche',
  'void_scar', 'precursor_nexus', 'wanderer_shrine', 'eclipse_altar'
];

const LOCATION_NAMES = {
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

// --- State management functions ---

function getLocationState(server, locationId) {
  if (!server.persistentData) return 'pristine';
  return server.persistentData.getString(LOCSTATE_CONFIG.dataPrefix + locationId) || 'pristine';
}

function setLocationState(server, locationId, stateId) {
  if (!LOC_STATES[stateId]) return false;
  if (!LOCATION_IDS.includes(locationId)) return false;

  const oldState = getLocationState(server, locationId);

  if (server.persistentData) {
    server.persistentData.putString(LOCSTATE_CONFIG.dataPrefix + locationId, stateId);
  }

  // Track in scoreboard (encode state as number for scoreboard)
  const stateNum = VALID_STATE_IDS.indexOf(stateId);
  server.runCommandSilent('scoreboard objectives add ' + LOCSTATE_CONFIG.scoreboardObj + ' dummy');
  server.runCommandSilent('scoreboard players set ' + locationId + ' ' + LOCSTATE_CONFIG.scoreboardObj + ' ' + stateNum);

  // Update stages for all players
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    // Remove old state stage
    const oldStage = 'loc_' + locationId + '_' + oldState;
    if (player.stages.has(oldStage)) {
      player.stages.remove(oldStage);
    }

    // Add new state stage
    player.stages.add('loc_' + locationId + '_' + stateId);
  }

  console.log('[Horizons/LocStates] ' + locationId + ': ' + oldState + ' -> ' + stateId);
  return true;
}

// --- Transition validation ---
const VALID_TRANSITIONS = {
  pristine:  ['active'],
  active:    ['ruined', 'contested', 'hidden'],
  ruined:    ['restored', 'hidden'],
  hidden:    ['pristine', 'active', 'ruined', 'contested', 'restored'],
  contested: ['active', 'ruined'],
  restored:  ['active', 'ruined', 'contested', 'hidden']
};

function isValidTransition(fromState, toState) {
  if (!VALID_TRANSITIONS[fromState]) return false;
  return VALID_TRANSITIONS[fromState].includes(toState);
}

function transitionLocation(server, locationId, newState, force) {
  const currentState = getLocationState(server, locationId);

  if (!force && !isValidTransition(currentState, newState)) {
    return { success: false, reason: 'Invalid transition: ' + currentState + ' -> ' + newState };
  }

  setLocationState(server, locationId, newState);

  // Announce state change
  const locName = LOCATION_NAMES[locationId] || locationId;
  const stateInfo = LOC_STATES[newState];
  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player) continue;

    // Only announce to players who have discovered this location
    if (!player.stages.has('discovered_' + locationId)) continue;

    player.tell(stateInfo.color + '[Horizons] ' + locName + ' is now ' + stateInfo.name + '!');
    player.tell('\u00a78' + stateInfo.desc);
  }

  return { success: true };
}

// ============================================================
// AUTO-TRANSITIONS — React to discovery and crisis events
// ============================================================

// When a player discovers a location, transition from Pristine to Active
ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % LOCSTATE_CONFIG.checkInterval !== 0) return;

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;

    for (let i = 0; i < LOCATION_IDS.length; i++) {
      const locId = LOCATION_IDS[i];
      const state = getLocationState(server, locId);

      // Auto-transition: Pristine -> Active on discovery
      if (state === 'pristine' && player.stages.has('discovered_' + locId)) {
        transitionLocation(server, locId, 'active', false);
      }
    }
  }

  // Auto-transition: Ruined locations during active crises
  if (server.persistentData) {
    var crisisId = server.persistentData.getString('horizons_crisis_active_id') || '';
    if (crisisId && crisisId.length > 0) {
      // During a crisis, there's a small chance an active location becomes ruined
      if (server.tickCount % 12000 === 0) { // Once per 10 minutes
        var activeLocations = LOCATION_IDS.filter(function(id) { return getLocationState(server, id) === 'active'; });
        if (activeLocations.length > 0 && Math.random() < 0.15) {
          var target = activeLocations[Math.floor(Math.random() * activeLocations.length)];
          // Don't ruin Anchor Town
          if (target !== 'anchor_town') {
            transitionLocation(server, target, 'ruined', false);
            var locName = LOCATION_NAMES[target] || target;
            var players2 = server.players;
            for (var q = 0; q < players2.size(); q++) {
              var pl = players2.get(q);
              if (pl) {
                pl.tell('\u00a74[Horizons] The crisis has damaged ' + locName + '!');
              }
            }
          }
        }
      }
    }
  }
});

// ============================================================
// PLAYER JOIN — Apply location state stages
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const server = player.server;

  server.runCommandSilent('scoreboard objectives add ' + LOCSTATE_CONFIG.scoreboardObj + ' dummy');

  for (let i = 0; i < LOCATION_IDS.length; i++) {
    const locId = LOCATION_IDS[i];
    const state = getLocationState(server, locId);

    // Only apply stages for discovered locations
    if (player.stages.has('discovered_' + locId)) {
      player.stages.add('loc_' + locId + '_' + state);
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
      .then(Commands.literal('location')
        // /horizons location state <id> — show state
        .then(Commands.literal('state')
          .then(Commands.argument('id', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const locId = event.getArguments().STRING.getResult(ctx, 'id');

              if (!LOCATION_IDS.includes(locId)) {
                player.tell('\u00a7c[Horizons] Unknown location: ' + locId);
                player.tell('\u00a77Use /horizons locations list to see valid IDs.');
                return 0;
              }

              const locName = LOCATION_NAMES[locId] || locId;
              const stateId = getLocationState(player.server, locId);
              const stateInfo = LOC_STATES[stateId];

              player.tell('\u00a7e=== ' + locName + ' ===');
              player.tell('\u00a77State: ' + stateInfo.color + stateInfo.symbol + ' ' + stateInfo.name);
              player.tell('\u00a78' + stateInfo.desc);

              // Show valid transitions (OP only)
              if (ctx.source.hasPermission(2)) {
                const transitions = VALID_TRANSITIONS[stateId] || [];
                if (transitions.length > 0) {
                  player.tell('\u00a78Valid transitions: ' + transitions.join(', '));
                }
              }

              // Show gameplay implications
              switch (stateId) {
                case 'ruined':
                  player.tell('\u00a7c  No NPCs or services. Complete a restoration quest to rebuild.');
                  break;
                case 'contested':
                  player.tell('\u00a7c  PvP is enabled here. Fight for control!');
                  break;
                case 'hidden':
                  player.tell('\u00a78  This location is hidden. A special event may reveal it.');
                  break;
                case 'restored':
                  player.tell('\u00a7a  Enhanced rewards and services available!');
                  break;
              }

              return 1;
            })
          )
        )
        // /horizons location setstate <id> <state> — OP only
        .then(Commands.literal('setstate')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('id', event.getArguments().STRING.create(event))
            .then(Commands.argument('state', event.getArguments().STRING.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const locId = event.getArguments().STRING.getResult(ctx, 'id');
                const stateId = event.getArguments().STRING.getResult(ctx, 'state');

                if (!LOCATION_IDS.includes(locId)) {
                  player.tell('\u00a7c[Horizons] Unknown location: ' + locId);
                  return 0;
                }

                if (!LOC_STATES[stateId]) {
                  player.tell('\u00a7c[Horizons] Unknown state: ' + stateId);
                  player.tell('\u00a77Valid states: ' + VALID_STATE_IDS.join(', '));
                  return 0;
                }

                // OP can force any transition
                const result = transitionLocation(player.server, locId, stateId, true);
                if (result.success) {
                  const locName = LOCATION_NAMES[locId] || locId;
                  const stateInfo = LOC_STATES[stateId];
                  player.tell('\u00a7a[Horizons] ' + locName + ' set to ' + stateInfo.color + stateInfo.name);
                } else {
                  player.tell('\u00a7c[Horizons] ' + result.reason);
                }

                return 1;
              })
            )
          )
        )
        // /horizons location list — show all location states (OP)
        .then(Commands.literal('listall')
          .requires(src => src.hasPermission(2))
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e=== All Location States ===');

            for (let i = 0; i < LOCATION_IDS.length; i++) {
              const locId = LOCATION_IDS[i];
              const locName = LOCATION_NAMES[locId] || locId;
              const stateId = getLocationState(player.server, locId);
              const stateInfo = LOC_STATES[stateId];

              player.tell(stateInfo.color + stateInfo.symbol + ' ' + locName + ' \u00a78- ' + stateInfo.color + stateInfo.name);
            }

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Location States loaded');
console.log('[Horizons] States: ' + VALID_STATE_IDS.join(', '));
console.log('[Horizons] Commands: /horizons location [state|setstate|listall]');
