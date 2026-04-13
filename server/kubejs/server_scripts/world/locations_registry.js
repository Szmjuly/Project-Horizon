// ============================================================
// Project Horizons — Locations Registry
// ============================================================
// File: kubejs/server_scripts/world/locations_registry.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Defines all famous locations in Aetheria with metadata including
// coordinates, biome, tier, lore, discovery XP, and discovery radius.
// Provides commands to list and inspect locations.
//
// COMMANDS:
//   /horizons locations list         — list all known locations
//   /horizons locations info <id>    — show details for a location
// ============================================================

const LOCATIONS = [
  // --- Tier 1: Starting Area ---
  { id: 'anchor_town', name: 'Anchor Town', x: 0, z: 0, tier: 1,
    loreKey: 'The central hub of Aetheria, where all Pathfinders begin their journey.',
    xpReward: 10, discoveryRadius: 64 },
  { id: 'breach_gate', name: 'The Breach Gate', x: 320, z: -180, tier: 2,
    loreKey: 'A shimmering tear between dimensions. The nether bleeds through here.',
    xpReward: 30, discoveryRadius: 48 },
  { id: 'sky_archive', name: 'Sky Archive Entrance', x: -500, z: 400, tier: 3,
    loreKey: 'The sealed entrance to the Precursor knowledge vaults, floating above the canopy.',
    xpReward: 50, discoveryRadius: 40 },
  { id: 'heartwood_tree', name: 'Heartwood Tree', x: 600, z: 600, tier: 2,
    loreKey: 'An ancient tree whose roots stretch across the continent. The Forest Kingdom was founded in its shade.',
    xpReward: 35, discoveryRadius: 56 },

  // --- Tier 2-3: Kingdom Capitals ---
  { id: 'capital_plains', name: 'Solhaven', x: 1200, z: 0, tier: 2,
    loreKey: 'Capital of the Plains Kingdom. Golden fields stretch to every horizon.',
    xpReward: 40, discoveryRadius: 80 },
  { id: 'capital_forest', name: 'Verdantia', x: 800, z: 1000, tier: 2,
    loreKey: 'Capital of the Forest Kingdom, built within the living boughs of giant oaks.',
    xpReward: 40, discoveryRadius: 80 },
  { id: 'capital_mountain', name: 'Ironspire Hold', x: -900, z: -700, tier: 3,
    loreKey: 'Capital of the Mountain Kingdom, carved deep into the Worldspine Peaks.',
    xpReward: 45, discoveryRadius: 72 },
  { id: 'capital_coastal', name: 'Tidesong Harbor', x: -1400, z: 800, tier: 2,
    loreKey: 'Capital of the Coastal Kingdom. Its lighthouse guides ships through perpetual fog.',
    xpReward: 40, discoveryRadius: 80 },

  // --- Tier 3-4: Gym Locations ---
  { id: 'gym_ember', name: 'Ember Arena', x: 400, z: -500, tier: 3,
    loreKey: 'A volcanic training ground where fire-type Cobblemon thrive.',
    xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_tidecrest', name: 'Tidecrest Pavilion', x: -1100, z: 500, tier: 3,
    loreKey: 'A grand pavilion on the coast, battered by storms and strong trainers alike.',
    xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_thornveil', name: 'Thornveil Sanctum', x: 950, z: 750, tier: 3,
    loreKey: 'Hidden among the briars, only the worthy find the grass-type gym.',
    xpReward: 50, discoveryRadius: 36 },
  { id: 'gym_stormcrag', name: 'Stormcrag Summit', x: -700, z: -1000, tier: 4,
    loreKey: 'Lightning strikes the peak every hour. Electric-type Cobblemon gather here.',
    xpReward: 60, discoveryRadius: 36 },
  { id: 'gym_duskhollow', name: 'Duskhollow Crypt', x: 200, z: 1400, tier: 4,
    loreKey: 'Beneath the cemetery lies a gym shrouded in ghostly mist.',
    xpReward: 60, discoveryRadius: 32 },
  { id: 'gym_glacial', name: 'Glacial Bastion', x: -300, z: -1500, tier: 4,
    loreKey: 'An ice fortress at the world\'s edge. Only the strongest challengers survive the cold.',
    xpReward: 65, discoveryRadius: 36 },
  { id: 'gym_ironforge', name: 'Ironforge Pit', x: -850, z: -500, tier: 3,
    loreKey: 'Deep in the mountain mines, steel clashes against steel.',
    xpReward: 50, discoveryRadius: 40 },
  { id: 'gym_psyche', name: 'Psyche Spire', x: -450, z: 200, tier: 4,
    loreKey: 'A floating tower where psychic Cobblemon bend reality.',
    xpReward: 60, discoveryRadius: 32 },

  // --- Tier 4-5: Mystery Locations ---
  { id: 'void_scar', name: 'The Void Scar', x: 2000, z: -2000, tier: 5,
    loreKey: 'A rift in reality itself. Something watches from the other side.',
    xpReward: 100, discoveryRadius: 24 },
  { id: 'precursor_nexus', name: 'Precursor Nexus', x: -2000, z: -2000, tier: 5,
    loreKey: 'The convergence point of all Precursor ley lines. Power hums in the air.',
    xpReward: 100, discoveryRadius: 20 },
  { id: 'wanderer_shrine', name: 'Wanderer\'s Shrine', x: 1800, z: 1800, tier: 4,
    loreKey: 'A forgotten shrine where the first Wanderers made their pact with the wild.',
    xpReward: 75, discoveryRadius: 28 },
  { id: 'eclipse_altar', name: 'Eclipse Altar', x: -1600, z: 1600, tier: 5,
    loreKey: 'When sun and moon align, this altar reveals the path to ascension.',
    xpReward: 100, discoveryRadius: 20 }
];

// --- Lookup helpers ---
function getLocationById(id) {
  for (let i = 0; i < LOCATIONS.length; i++) {
    if (LOCATIONS[i].id === id) return LOCATIONS[i];
  }
  return null;
}

function getTierColor(tier) {
  switch (tier) {
    case 1: return '\u00a7f';
    case 2: return '\u00a7a';
    case 3: return '\u00a7e';
    case 4: return '\u00a76';
    case 5: return '\u00a7d';
    default: return '\u00a77';
  }
}

function getTierLabel(tier) {
  switch (tier) {
    case 1: return 'Common';
    case 2: return 'Uncommon';
    case 3: return 'Rare';
    case 4: return 'Epic';
    case 5: return 'Legendary';
    default: return 'Unknown';
  }
}

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('locations')
        // /horizons locations list
        .then(Commands.literal('list').executes(ctx => {
          const player = ctx.source.player;
          if (!player) return 0;
          const isOp = ctx.source.hasPermission(2);

          player.tell('\u00a7e=== Aetheria Locations ===');
          let shown = 0;

          for (let i = 0; i < LOCATIONS.length; i++) {
            const loc = LOCATIONS[i];
            const discovered = player.stages.has('discovered_' + loc.id);

            if (!isOp && !discovered) continue;

            const tierColor = getTierColor(loc.tier);
            const status = discovered ? '\u00a7a[Discovered]' : '\u00a78[Hidden]';
            player.tell(tierColor + loc.name + ' \u00a77(Tier ' + loc.tier + ') ' + status);
            shown++;
          }

          if (shown === 0) {
            player.tell('\u00a77No locations discovered yet. Explore the world!');
          }

          const totalDiscovered = LOCATIONS.reduce((count, loc) => {
            return count + (player.stages.has('discovered_' + loc.id) ? 1 : 0);
          }, 0);
          player.tell('\u00a77Discovered: \u00a7f' + totalDiscovered + '/' + LOCATIONS.length);

          return 1;
        }))
        // /horizons locations info <id>
        .then(Commands.literal('info')
          .then(Commands.argument('id', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;
              const locId = event.getArguments().STRING.getResult(ctx, 'id');
              const loc = getLocationById(locId);
              const isOp = ctx.source.hasPermission(2);

              if (!loc) {
                player.tell('\u00a7c[Horizons] Unknown location: ' + locId);
                player.tell('\u00a77Use /horizons locations list to see locations.');
                return 0;
              }

              const discovered = player.stages.has('discovered_' + loc.id);
              if (!discovered && !isOp) {
                player.tell('\u00a7c[Horizons] You have not discovered this location yet.');
                return 0;
              }

              const tierColor = getTierColor(loc.tier);
              player.tell('\u00a7e=== ' + tierColor + loc.name + ' \u00a7e===');
              player.tell('\u00a77Tier: ' + tierColor + loc.tier + ' (' + getTierLabel(loc.tier) + ')');

              if (discovered || isOp) {
                player.tell('\u00a77Coordinates: \u00a7f' + loc.x + ', ' + loc.z);
              }

              player.tell('\u00a77Lore: \u00a7f' + loc.loreKey);
              player.tell('\u00a77Discovery XP: \u00a7a' + loc.xpReward);
              player.tell('\u00a77Discovery Radius: \u00a7f' + loc.discoveryRadius + ' blocks');

              if (discovered) {
                player.tell('\u00a7aStatus: Discovered');
              } else {
                player.tell('\u00a78Status: Undiscovered');
              }

              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Locations Registry loaded (' + LOCATIONS.length + ' locations)');
console.log('[Horizons] Commands: /horizons locations [list|info]');
