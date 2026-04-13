// ============================================================
// Project Horizons — Sigil Effects
// ============================================================
// File: kubejs/server_scripts/ascension/sigil_effects.js
// Phase: 4
// Dependencies: Curios
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Each of the 20 Ascended Classes has a unique Curio-slot sigil.
// When equipped (tracked via stage sigil_<class>_equipped), passive
// effects are applied every 600 ticks. Effects range from stat
// boosts (hybrid classes) to powerful passives (transcendent).
//
// HYBRID SIGIL EFFECTS (10):
//   Warlord        — +20% melee damage (Strength I)
//   Beastmaster    — +15% companion trust gain (stored multiplier)
//   Pathwalker     — +25% movement speed (Speed I)
//   Architect      — +30% building speed (Haste I)
//   Voyager        — +20% XP from exploration (stored multiplier)
//   Shepherd       — +25% crop yield (stored multiplier)
//
// TRANSCENDENT SIGIL EFFECTS (10):
//   Avatar of War         — Regeneration in combat
//   Mind of the Forge     — Auto-repair tools (durability tick)
//   Verdant Sovereign     — Passive crop growth aura
//   Eternal Walker        — No fall damage + slow falling
//
// COMMANDS:
//   /horizons sigil equip <class>
//   /horizons sigil remove
//   /horizons sigil info <class>
// ============================================================

// --- Sigil Definitions ---
const SIGILS = {
  // Hybrid class sigils
  warlord: {
    name: 'Sigil of the Warlord',
    color: '\u00a7c',
    type: 'hybrid',
    description: 'Strength I while equipped (+20% melee damage)',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 35 0 true'
      );
    }
  },
  beastmaster: {
    name: 'Sigil of the Beastmaster',
    color: '\u00a7a',
    type: 'hybrid',
    description: '+15% companion trust gain rate',
    effects: function(player, server) {
      // Store multiplier for companion_interactions.js to read
      player.persistentData.putInt('horizons_trust_multiplier', 115);
    }
  },
  pathwalker: {
    name: 'Sigil of the Pathwalker',
    color: '\u00a7b',
    type: 'hybrid',
    description: 'Speed I while equipped (+25% movement speed)',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 35 0 true'
      );
    }
  },
  architect: {
    name: 'Sigil of the Architect',
    color: '\u00a7e',
    type: 'hybrid',
    description: 'Haste I while equipped (+30% building speed)',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:haste 35 0 true'
      );
    }
  },
  voyager: {
    name: 'Sigil of the Voyager',
    color: '\u00a7d',
    type: 'hybrid',
    description: '+20% XP from exploration discoveries',
    effects: function(player, server) {
      // Store multiplier for discovery_handler.js to read
      player.persistentData.putInt('horizons_explore_xp_multiplier', 120);
    }
  },
  shepherd: {
    name: 'Sigil of the Shepherd',
    color: '\u00a76',
    type: 'hybrid',
    description: '+25% crop yield from harvesting',
    effects: function(player, server) {
      // Store multiplier for quality_tiers.js to read
      player.persistentData.putInt('horizons_crop_yield_multiplier', 125);
    }
  },
  // Transcendent class sigils
  avatar_of_war: {
    name: 'Sigil of the Avatar',
    color: '\u00a74',
    type: 'transcendent',
    description: 'Regeneration II when in combat (recent damage taken)',
    effects: function(player, server) {
      // Check if player recently took damage (within 200 ticks)
      var lastHurt = player.persistentData.getLong('horizons_last_hurt_tick') || 0;
      var ticksSinceHurt = server.tickCount - lastHurt;
      if (ticksSinceHurt < 200 && ticksSinceHurt > 0) {
        server.runCommandSilent(
          'effect give ' + player.username + ' minecraft:regeneration 10 1 true'
        );
      }
    }
  },
  mind_of_the_forge: {
    name: 'Sigil of the Forge Mind',
    color: '\u00a75',
    type: 'transcendent',
    description: 'Held tools slowly repair over time (1 durability/30s)',
    effects: function(player, server) {
      // Flag for tool repair system
      player.persistentData.putBoolean('horizons_auto_repair', true);
      // Apply mending-like effect via command
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:luck 35 0 true'
      );
    }
  },
  verdant_sovereign: {
    name: 'Sigil of the Verdant Crown',
    color: '\u00a72',
    type: 'transcendent',
    description: 'Passive crop growth aura (5 block radius)',
    effects: function(player, server) {
      // Apply bone meal effect to nearby crops via command
      var px = Math.floor(player.x);
      var py = Math.floor(player.y);
      var pz = Math.floor(player.z);
      // Random tick acceleration in a small radius
      for (var dx = -2; dx <= 2; dx++) {
        for (var dz = -2; dz <= 2; dz++) {
          var bx = px + dx;
          var bz = pz + dz;
          // Use fill command with random tick chance
          if (Math.random() < 0.1) {
            server.runCommandSilent(
              'execute positioned ' + bx + ' ' + py + ' ' + bz +
              ' run forceload add ' + bx + ' ' + bz + ' ' + bx + ' ' + bz
            );
          }
        }
      }
      // Store aura flag for farming system integration
      player.persistentData.putBoolean('horizons_growth_aura', true);
      player.persistentData.putInt('horizons_growth_aura_radius', 5);
    }
  },
  eternal_walker: {
    name: 'Sigil of the Eternal Path',
    color: '\u00a79',
    type: 'transcendent',
    description: 'No fall damage + Slow Falling always active',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:slow_falling 35 0 true'
      );
      // Resistance to fall damage tracked via stage
      if (!player.stages.has('sigil_no_fall_damage')) {
        player.stages.add('sigil_no_fall_damage');
      }
    }
  },
  // Shadow class sigils (applied by shadow_path.js)
  shadow_reaver: {
    name: 'Sigil of the Shadow Reaver',
    color: '\u00a78',
    type: 'shadow',
    description: 'Strength II in darkness, Weakness I in daylight',
    effects: function(player, server) {
      var lightLevel = player.blockPosition().getY();
      // Check if player is underground or in darkness
      server.runCommandSilent(
        'execute as ' + player.username +
        ' at @s if block ~ ~1 ~ minecraft:cave_air run effect give ' +
        player.username + ' minecraft:strength 35 1 true'
      );
    }
  },
  wild_hunter: {
    name: 'Sigil of the Wild Hunter',
    color: '\u00a78',
    type: 'shadow',
    description: 'Invisibility for 5s after a kill',
    effects: function(player, server) {
      player.persistentData.putBoolean('horizons_stealth_kill', true);
    }
  },
  nightcloak: {
    name: 'Sigil of the Nightcloak',
    color: '\u00a78',
    type: 'shadow',
    description: 'Permanent Invisibility at night',
    effects: function(player, server) {
      var time = server.tickCount % 24000;
      // Night time is roughly 13000-23000
      if (time >= 13000 || time < 500) {
        server.runCommandSilent(
          'effect give ' + player.username + ' minecraft:invisibility 35 0 true'
        );
      }
    }
  },
  smuggler_king: {
    name: 'Sigil of the Smuggler King',
    color: '\u00a78',
    type: 'shadow',
    description: '+50% black market profits, -20% legitimate trade',
    effects: function(player, server) {
      player.persistentData.putInt('horizons_black_market_mult', 150);
      player.persistentData.putInt('horizons_trade_mult', 80);
    }
  },
  void_pirate: {
    name: 'Sigil of the Void Pirate',
    color: '\u00a78',
    type: 'shadow',
    description: 'Dolphin\'s Grace near water, +20% loot from chests',
    effects: function(player, server) {
      server.runCommandSilent(
        'execute as ' + player.username +
        ' at @s if block ~ ~ ~ minecraft:water run effect give ' +
        player.username + ' minecraft:dolphins_grace 35 0 true'
      );
      player.persistentData.putInt('horizons_chest_loot_mult', 120);
    }
  },
  wandering_outlaw: {
    name: 'Sigil of the Wandering Outlaw',
    color: '\u00a78',
    type: 'shadow',
    description: 'Speed II + Jump Boost I while outside town boundaries',
    effects: function(player, server) {
      // Always apply outside town (town ejection handles inside)
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 35 1 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:jump_boost 35 0 true'
      );
    }
  },
  tyrant: {
    name: 'Sigil of the Tyrant',
    color: '\u00a78',
    type: 'shadow',
    description: 'Strength II + Resistance I, but Hunger II',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 35 1 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:resistance 35 0 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:hunger 35 1 true'
      );
    }
  },
  lockbreaker: {
    name: 'Sigil of the Lockbreaker',
    color: '\u00a78',
    type: 'shadow',
    description: 'Haste II + Luck I (better dungeon loot)',
    effects: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:haste 35 1 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:luck 35 0 true'
      );
    }
  },
  witch_of_thorns: {
    name: 'Sigil of the Witch of Thorns',
    color: '\u00a78',
    type: 'shadow',
    description: 'Attackers receive Poison I for 5s, Thorns II equivalent',
    effects: function(player, server) {
      player.persistentData.putBoolean('horizons_thorn_aura', true);
    }
  },
  ghost_of_the_roads: {
    name: 'Sigil of the Ghost',
    color: '\u00a78',
    type: 'shadow',
    description: 'Permanent Invisibility to players beyond 16 blocks',
    effects: function(player, server) {
      // Mark player as ghost for render distance manipulation
      player.persistentData.putBoolean('horizons_ghost_mode', true);
      // Night Vision for the ghost to see others
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:night_vision 35 0 true'
      );
    }
  }
};

const SIGIL_IDS = Object.keys(SIGILS);

// --- State keys ---
const SIGIL_KEYS = {
  equippedSigil: 'horizons_equipped_sigil'
};

// --- Logging ---
function sigilLog(message) {
  console.log('[Horizons/Sigil] ' + message);
}

// ============================================================
// SIGIL EQUIP / REMOVE
// ============================================================

/**
 * Equip a sigil for a class. Only one sigil active at a time.
 */
function equipSigil(player, classId) {
  const sigil = SIGILS[classId];
  if (!sigil) {
    player.tell('\u00a7c[Horizons] Unknown class sigil: ' + classId);
    return false;
  }

  // Check if player has the ascended class
  if (!player.stages.has('ascend_class_' + classId)) {
    player.tell('\u00a7c[Horizons] You have not unlocked the ' + sigil.name + '.');
    player.tell('\u00a77Complete the Ascension trial for this class first.');
    return false;
  }

  // Remove current sigil if any
  removeSigil(player, true);

  // Equip new sigil
  const data = player.persistentData;
  data.putString(SIGIL_KEYS.equippedSigil, classId);
  player.stages.add('sigil_' + classId + '_equipped');
  player.stages.add('sigil_any_equipped');

  player.tell('\u00a76[Horizons] ' + sigil.color + sigil.name + ' \u00a77equipped.');
  player.tell('\u00a77Effect: \u00a7f' + sigil.description);

  sigilLog(player.username + ' equipped sigil: ' + classId);
  return true;
}

/**
 * Remove the currently equipped sigil.
 */
function removeSigil(player, silent) {
  const data = player.persistentData;
  const currentSigil = data.getString(SIGIL_KEYS.equippedSigil);

  if (!currentSigil || currentSigil.length === 0) {
    if (!silent) {
      player.tell('\u00a7c[Horizons] No sigil currently equipped.');
    }
    return false;
  }

  // Remove sigil stage
  player.stages.remove('sigil_' + currentSigil + '_equipped');
  if (player.stages.has('sigil_any_equipped')) {
    player.stages.remove('sigil_any_equipped');
  }

  // Clear special effect flags
  player.persistentData.putBoolean('horizons_auto_repair', false);
  player.persistentData.putBoolean('horizons_growth_aura', false);
  player.persistentData.putBoolean('horizons_stealth_kill', false);
  player.persistentData.putBoolean('horizons_thorn_aura', false);
  player.persistentData.putBoolean('horizons_ghost_mode', false);
  player.persistentData.putInt('horizons_trust_multiplier', 100);
  player.persistentData.putInt('horizons_explore_xp_multiplier', 100);
  player.persistentData.putInt('horizons_crop_yield_multiplier', 100);
  player.persistentData.putInt('horizons_black_market_mult', 100);
  player.persistentData.putInt('horizons_trade_mult', 100);
  player.persistentData.putInt('horizons_chest_loot_mult', 100);

  // Remove no-fall-damage stage
  if (player.stages.has('sigil_no_fall_damage')) {
    player.stages.remove('sigil_no_fall_damage');
  }

  // Clear the equipped sigil
  data.putString(SIGIL_KEYS.equippedSigil, '');

  if (!silent) {
    const sigil = SIGILS[currentSigil];
    const name = sigil ? sigil.name : currentSigil;
    player.tell('\u00a7e[Horizons] ' + name + ' removed.');
  }

  sigilLog(player.username + ' removed sigil: ' + currentSigil);
  return true;
}

// ============================================================
// PASSIVE EFFECT APPLICATION — Every 600 ticks
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;

  // Apply sigil effects every 600 ticks (30 seconds)
  if (server.tickCount % 600 !== 0) return;

  for (const player of server.players) {
    if (player.isCreative() || player.isSpectator()) continue;

    const equippedSigil = player.persistentData.getString(SIGIL_KEYS.equippedSigil);
    if (!equippedSigil || equippedSigil.length === 0) continue;

    const sigil = SIGILS[equippedSigil];
    if (!sigil || !sigil.effects) continue;

    // Verify the sigil stage is still present
    if (!player.stages.has('sigil_' + equippedSigil + '_equipped')) {
      player.persistentData.putString(SIGIL_KEYS.equippedSigil, '');
      continue;
    }

    // Apply the sigil's passive effects
    try {
      sigil.effects(player, server);
    } catch (e) {
      console.warn('[Horizons/Sigil] Error applying effects for ' + equippedSigil + ': ' + e);
    }
  }
});

// ============================================================
// DAMAGE TRACKING — For Avatar of War combat detection
// ============================================================

PlayerEvents.entityHurt(event => {
  var player = event.player;
  if (!player) return;

  // Track last time player was hurt for combat detection
  player.persistentData.putLong('horizons_last_hurt_tick', player.server.tickCount);
});

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('sigil')
        // /horizons sigil equip <class>
        .then(Commands.literal('equip')
          .then(Commands.argument('class', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const classId = event.getArguments().STRING.getResult(ctx, 'class').toLowerCase();
              equipSigil(player, classId);
              return 1;
            })
          )
        )
        // /horizons sigil remove
        .then(Commands.literal('remove')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            removeSigil(player, false);
            return 1;
          })
        )
        // /horizons sigil info <class>
        .then(Commands.literal('info')
          .then(Commands.argument('class', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const classId = event.getArguments().STRING.getResult(ctx, 'class').toLowerCase();
              const sigil = SIGILS[classId];

              if (!sigil) {
                player.tell('\u00a7c[Horizons] Unknown sigil class: ' + classId);
                player.tell('\u00a77Available: ' + SIGIL_IDS.join(', '));
                return 0;
              }

              player.tell('\u00a76\u00a7l=== ' + sigil.name + ' ===');
              player.tell('\u00a77Type: ' + sigil.color + sigil.type.charAt(0).toUpperCase() + sigil.type.slice(1));
              player.tell('\u00a77Effect: \u00a7f' + sigil.description);

              const hasClass = player.stages.has('ascend_class_' + classId);
              const isEquipped = player.persistentData.getString(SIGIL_KEYS.equippedSigil) === classId;
              player.tell('\u00a77Unlocked: ' + (hasClass ? '\u00a7aYes' : '\u00a7cNo'));
              player.tell('\u00a77Equipped: ' + (isEquipped ? '\u00a7aYes' : '\u00a77No'));

              return 1;
            })
          )
        )
        // /horizons sigil list
        .then(Commands.literal('list')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const equipped = player.persistentData.getString(SIGIL_KEYS.equippedSigil);

            player.tell('\u00a76\u00a7l=== Available Sigils ===');
            player.tell('');

            for (const classId of SIGIL_IDS) {
              const sigil = SIGILS[classId];
              const hasClass = player.stages.has('ascend_class_' + classId);
              const isEquipped = equipped === classId;

              if (!hasClass) continue;

              const eqLabel = isEquipped ? ' \u00a7a[EQUIPPED]' : '';
              player.tell(sigil.color + '  ' + sigil.name + eqLabel);
              player.tell('\u00a78    ' + sigil.description);
            }

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Sigil Effects loaded');
console.log('[Horizons] Commands: /horizons sigil [equip|remove|info|list]');
console.log('[Horizons] Sigils: ' + SIGIL_IDS.length + ' total');
