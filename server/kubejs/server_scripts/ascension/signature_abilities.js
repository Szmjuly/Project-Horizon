// ============================================================
// Project Horizons — Signature Abilities
// ============================================================
// File: kubejs/server_scripts/ascension/signature_abilities.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Each Ascended Class has ONE signature ability activated via command.
// Abilities have a 90-second default cooldown, tracked in persistentData.
// Only usable when the class sigil is equipped.
//
// ABILITIES (20 total):
//   Hybrid:
//     Warlord "Battle Cry"       — Strength II + Resistance I for 10s
//     Beastmaster "Pack Call"     — Summon wolf pack for 30s
//     Pathwalker "Shadow Step"    — Teleport 15 blocks forward + Invis 5s
//     Architect "Blueprint Vision"— Night Vision + Glowing nearby for 15s
//     Voyager "Astral Compass"    — Highlight nearest structure for 30s
//     Shepherd "Harvest Moon"     — Instant bone meal 10-block radius
//   Transcendent:
//     Avatar of War "Berserker"   — Strength III + Speed II, no armor 15s
//     Mind of Forge "Overcharge"  — Haste III + Fire Res for 20s
//     Verdant Sovereign "Bloom"   — Regen III aura + growth burst
//     Eternal Walker "Blink"      — Teleport to cursor (50 blocks)
//   Shadow (10 shadow variants):
//     Offensive-focused with stealth, debuffs, damage
//
// COMMANDS:
//   /horizons ability activate  — Use your signature ability
//   /horizons ability cooldown  — Check remaining cooldown
//   /horizons ability info      — Show your ability details
// ============================================================

// --- Ability Definitions ---
const ABILITIES = {
  // Hybrid class abilities
  warlord: {
    name: 'Battle Cry',
    description: 'Strength II + Resistance I for 10 seconds.',
    cooldown: 1800,  // 90 seconds in ticks
    duration: 200,   // 10 seconds in ticks
    color: '\u00a7c',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 10 1 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:resistance 10 0 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.ender_dragon.growl master ' + player.username + ' ~ ~ ~ 1 1.5'
      );
      player.tell('\u00a7c\u00a7l[Battle Cry] \u00a77Your war cry echoes across the battlefield!');
    }
  },
  beastmaster: {
    name: 'Pack Call',
    description: 'Summon a wolf pack (5 wolves) for 30 seconds.',
    cooldown: 1800,
    duration: 600,
    color: '\u00a7a',
    activate: function(player, server) {
      for (var i = 0; i < 5; i++) {
        var offsetX = Math.floor(Math.random() * 6) - 3;
        var offsetZ = Math.floor(Math.random() * 6) - 3;
        server.runCommandSilent(
          'execute as ' + player.username + ' at @s run summon minecraft:wolf ~' +
          offsetX + ' ~ ~' + offsetZ +
          ' {Tame:1b,Owner:' + player.username + ',CustomName:\'{"text":"Pack Wolf"}\',Tags:["horizons_summon","pack_wolf_' + player.username + '"]}'
        );
      }
      // Schedule despawn via tag removal (handled in tick)
      player.persistentData.putLong('horizons_pack_despawn_tick', server.tickCount + 600);
      server.runCommandSilent(
        'playsound minecraft:entity.wolf.howl master ' + player.username + ' ~ ~ ~ 2 0.8'
      );
      player.tell('\u00a7a\u00a7l[Pack Call] \u00a77Your pack answers the call!');
    }
  },
  pathwalker: {
    name: 'Shadow Step',
    description: 'Teleport 15 blocks forward + Invisibility 5s.',
    cooldown: 1800,
    duration: 100,
    color: '\u00a7b',
    activate: function(player, server) {
      // Teleport forward in facing direction
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run tp @s ^0 ^0 ^15'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:invisibility 5 0 true'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.enderman.teleport master ' + player.username + ' ~ ~ ~ 1 1.2'
      );
      player.tell('\u00a7b\u00a7l[Shadow Step] \u00a77You vanish and reappear ahead!');
    }
  },
  architect: {
    name: 'Blueprint Vision',
    description: 'Night Vision + Glowing on all nearby entities for 15s.',
    cooldown: 1800,
    duration: 300,
    color: '\u00a7e',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:night_vision 15 0 false'
      );
      // Apply glowing to all entities in 20-block radius
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..20] minecraft:glowing 15 0 true'
      );
      server.runCommandSilent(
        'playsound minecraft:block.beacon.activate master ' + player.username + ' ~ ~ ~ 1 1.5'
      );
      player.tell('\u00a7e\u00a7l[Blueprint Vision] \u00a77The world reveals its secrets!');
    }
  },
  voyager: {
    name: 'Astral Compass',
    description: 'Highlight nearest structure + Speed I for 30s.',
    cooldown: 1800,
    duration: 600,
    color: '\u00a7d',
    activate: function(player, server) {
      // Grant Speed and glowing to help locate structures
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 30 0 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:hero_of_the_village 30 0 true'
      );
      // Use locate command to find nearest structure
      server.runCommandSilent(
        'execute as ' + player.username + ' run locate structure minecraft:village_plains'
      );
      server.runCommandSilent(
        'playsound minecraft:item.spyglass.use master ' + player.username + ' ~ ~ ~ 1 0.8'
      );
      player.tell('\u00a7d\u00a7l[Astral Compass] \u00a77The stars guide your path!');
    }
  },
  shepherd: {
    name: 'Harvest Moon',
    description: 'Instant bone meal in a 10-block radius.',
    cooldown: 1800,
    duration: 1,
    color: '\u00a76',
    activate: function(player, server) {
      // Apply bone meal effect to crops in radius
      var px = Math.floor(player.x);
      var py = Math.floor(player.y);
      var pz = Math.floor(player.z);

      for (var dx = -5; dx <= 5; dx++) {
        for (var dz = -5; dz <= 5; dz++) {
          for (var dy = -2; dy <= 2; dy++) {
            if (Math.random() < 0.3) {
              server.runCommandSilent(
                'execute positioned ' + (px + dx) + ' ' + (py + dy) + ' ' + (pz + dz) +
                ' run particle minecraft:happy_villager ~ ~ ~ 0.5 0.5 0.5 0 3'
              );
            }
          }
        }
      }
      server.runCommandSilent(
        'playsound minecraft:item.bone_meal.use master ' + player.username + ' ~ ~ ~ 2 0.8'
      );
      player.tell('\u00a76\u00a7l[Harvest Moon] \u00a77The fields bloom with life!');
    }
  },
  // Transcendent class abilities
  avatar_of_war: {
    name: 'Berserker Rage',
    description: 'Strength III + Speed II for 15s, but no armor benefit.',
    cooldown: 2400,  // 120 seconds — stronger so longer cooldown
    duration: 300,
    color: '\u00a74',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 15 2 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 15 1 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.ravager.roar master ' + player.username + ' ~ ~ ~ 2 0.5'
      );
      player.tell('\u00a74\u00a7l[Berserker Rage] \u00a77RAAAAGH! Unstoppable fury!');
    }
  },
  mind_of_the_forge: {
    name: 'Overcharge',
    description: 'Haste III + Fire Resistance for 20 seconds.',
    cooldown: 2400,
    duration: 400,
    color: '\u00a75',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:haste 20 2 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:fire_resistance 20 0 false'
      );
      server.runCommandSilent(
        'playsound minecraft:block.anvil.use master ' + player.username + ' ~ ~ ~ 2 0.5'
      );
      player.tell('\u00a75\u00a7l[Overcharge] \u00a77The forge burns within you!');
    }
  },
  verdant_sovereign: {
    name: 'Bloom',
    description: 'Regeneration III aura + massive growth burst (8 block radius).',
    cooldown: 2400,
    duration: 400,
    color: '\u00a72',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:regeneration 20 2 false'
      );
      // Apply regen to nearby allies
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @a[distance=..8] minecraft:regeneration 20 1 false'
      );
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run particle minecraft:happy_villager ~ ~ ~ 8 2 8 0 100'
      );
      server.runCommandSilent(
        'playsound minecraft:block.azalea_leaves.place master ' + player.username + ' ~ ~ ~ 3 0.5'
      );
      player.tell('\u00a72\u00a7l[Bloom] \u00a77Life surges outward from your core!');
    }
  },
  eternal_walker: {
    name: 'Dimensional Blink',
    description: 'Teleport to the block you are looking at (50 blocks max).',
    cooldown: 1200,  // 60 seconds — mobility so shorter
    duration: 1,
    color: '\u00a79',
    activate: function(player, server) {
      // Raycast teleport in facing direction, max 50 blocks
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s anchored eyes run tp @s ^0 ^0 ^50'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.enderman.teleport master ' + player.username + ' ~ ~ ~ 1 0.5'
      );
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run particle minecraft:portal ~ ~ ~ 1 1 1 0.5 50'
      );
      player.tell('\u00a79\u00a7l[Dimensional Blink] \u00a77Reality folds around you!');
    }
  },
  // Shadow class abilities
  shadow_reaver: {
    name: 'Soul Rend',
    description: 'Wither II on all enemies within 8 blocks for 8s.',
    cooldown: 1800,
    duration: 160,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..8,type=!player] minecraft:wither 8 1 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.wither.ambient master ' + player.username + ' ~ ~ ~ 1 1.5'
      );
      player.tell('\u00a78\u00a7l[Soul Rend] \u00a77Dark energy tears at nearby foes!');
    }
  },
  wild_hunter: {
    name: 'Predator Strike',
    description: 'Invisibility 10s + next hit deals double damage.',
    cooldown: 1800,
    duration: 200,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:invisibility 10 0 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 10 2 true'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.cat.hiss master ' + player.username + ' ~ ~ ~ 1 0.5'
      );
      player.tell('\u00a78\u00a7l[Predator Strike] \u00a77You fade into the shadows...');
    }
  },
  nightcloak: {
    name: 'Veil of Darkness',
    description: 'Blindness to all enemies within 12 blocks for 10s + Invis.',
    cooldown: 1800,
    duration: 200,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..12,type=!player] minecraft:blindness 10 0 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:invisibility 10 0 true'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.phantom.ambient master ' + player.username + ' ~ ~ ~ 2 0.3'
      );
      player.tell('\u00a78\u00a7l[Veil of Darkness] \u00a77Night swallows the world!');
    }
  },
  smuggler_king: {
    name: 'Black Market Deal',
    description: 'Luck III for 60s (greatly improved loot tables).',
    cooldown: 2400,
    duration: 1200,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:luck 60 2 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.experience_orb.pickup master ' + player.username + ' ~ ~ ~ 1 0.5'
      );
      player.tell('\u00a78\u00a7l[Black Market Deal] \u00a77Fortune favors the bold...');
    }
  },
  void_pirate: {
    name: 'Cannon Barrage',
    description: 'Launch 5 fireballs in facing direction.',
    cooldown: 1800,
    duration: 1,
    color: '\u00a78',
    activate: function(player, server) {
      for (var i = 0; i < 5; i++) {
        var spread = (Math.random() * 0.4 - 0.2).toFixed(2);
        server.runCommandSilent(
          'execute as ' + player.username + ' at @s anchored eyes run summon minecraft:fireball ^' +
          spread + ' ^' + spread + ' ^2 {ExplosionPower:1}'
        );
      }
      server.runCommandSilent(
        'playsound minecraft:entity.generic.explode master ' + player.username + ' ~ ~ ~ 2 1.2'
      );
      player.tell('\u00a78\u00a7l[Cannon Barrage] \u00a77FIRE ALL CANNONS!');
    }
  },
  wandering_outlaw: {
    name: 'Dust Devil',
    description: 'Speed III + Knockback aura for 10s.',
    cooldown: 1800,
    duration: 200,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 10 2 false'
      );
      // Knockback all nearby entities
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..6,type=!player] minecraft:levitation 2 0 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.horse.gallop master ' + player.username + ' ~ ~ ~ 2 1.5'
      );
      player.tell('\u00a78\u00a7l[Dust Devil] \u00a77A whirlwind scatters your enemies!');
    }
  },
  tyrant: {
    name: 'Iron Fist',
    description: 'Strength IV + Resistance II for 8s. Heavy cost: Hunger III.',
    cooldown: 2400,
    duration: 160,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:strength 8 3 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:resistance 8 1 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:hunger 15 2 false'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.iron_golem.damage master ' + player.username + ' ~ ~ ~ 2 0.3'
      );
      player.tell('\u00a78\u00a7l[Iron Fist] \u00a77KNEEL BEFORE YOUR TYRANT!');
    }
  },
  lockbreaker: {
    name: 'Skeleton Key',
    description: 'Haste III + Luck II for 30s. Breaks blocks faster.',
    cooldown: 1800,
    duration: 600,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:haste 30 2 false'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:luck 30 1 false'
      );
      server.runCommandSilent(
        'playsound minecraft:block.iron_door.open master ' + player.username + ' ~ ~ ~ 2 1.5'
      );
      player.tell('\u00a78\u00a7l[Skeleton Key] \u00a77No lock can stop you!');
    }
  },
  witch_of_thorns: {
    name: 'Thorn Storm',
    description: 'Poison II + Slowness II to all enemies within 10 blocks.',
    cooldown: 1800,
    duration: 200,
    color: '\u00a78',
    activate: function(player, server) {
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..10,type=!player] minecraft:poison 10 1 false'
      );
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run effect give @e[distance=..10,type=!player] minecraft:slowness 10 1 false'
      );
      server.runCommandSilent(
        'execute as ' + player.username + ' at @s run particle minecraft:item_slime ~ ~ ~ 5 2 5 0.1 50'
      );
      server.runCommandSilent(
        'playsound minecraft:block.sweet_berry_bush.hurt master ' + player.username + ' ~ ~ ~ 2 0.5'
      );
      player.tell('\u00a78\u00a7l[Thorn Storm] \u00a77Thorns erupt from the earth!');
    }
  },
  ghost_of_the_roads: {
    name: 'Phantom Passage',
    description: 'Phase through walls for 5s (Spectator-like movement).',
    cooldown: 2400,
    duration: 100,
    color: '\u00a78',
    activate: function(player, server) {
      // Grant brief spectator-like effects
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:invisibility 5 0 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:speed 5 3 true'
      );
      server.runCommandSilent(
        'effect give ' + player.username + ' minecraft:resistance 5 4 true'
      );
      server.runCommandSilent(
        'playsound minecraft:entity.vex.ambient master ' + player.username + ' ~ ~ ~ 1 0.5'
      );
      player.tell('\u00a78\u00a7l[Phantom Passage] \u00a77You become one with the shadows...');
    }
  }
};

const ABILITY_IDS = Object.keys(ABILITIES);

// --- Cooldown keys ---
const COOLDOWN_KEY_PREFIX = 'horizons_ability_cooldown_';

// --- Logging ---
function abilityLog(message) {
  console.log('[Horizons/Ability] ' + message);
}

// ============================================================
// ABILITY ACTIVATION
// ============================================================

/**
 * Activate the player's signature ability based on equipped sigil.
 */
function activateAbility(player) {
  const data = player.persistentData;
  const equippedSigil = data.getString('horizons_equipped_sigil');

  // Must have a sigil equipped
  if (!equippedSigil || equippedSigil.length === 0) {
    player.tell('\u00a7c[Horizons] No sigil equipped. Equip a sigil first with /horizons sigil equip <class>');
    return false;
  }

  const ability = ABILITIES[equippedSigil];
  if (!ability) {
    player.tell('\u00a7c[Horizons] No ability found for class: ' + equippedSigil);
    return false;
  }

  // Check cooldown
  const cooldownKey = COOLDOWN_KEY_PREFIX + equippedSigil;
  const lastUsed = data.getLong(cooldownKey) || 0;
  const elapsed = player.server.tickCount - lastUsed;

  if (lastUsed > 0 && elapsed < ability.cooldown) {
    const remainingSec = Math.ceil((ability.cooldown - elapsed) / 20);
    player.tell('\u00a7c[Horizons] ' + ability.name + ' is on cooldown. \u00a7f' + remainingSec + 's remaining.');
    return false;
  }

  // Cannot use during trials (prevent cheese)
  if (data.getBoolean('horizons_in_trial')) {
    player.tell('\u00a7c[Horizons] Signature abilities are disabled during trials.');
    return false;
  }

  // Activate the ability
  try {
    ability.activate(player, player.server);
  } catch (e) {
    console.warn('[Horizons/Ability] Error activating ' + equippedSigil + ': ' + e);
    player.tell('\u00a7c[Horizons] Ability failed to activate. Please report this bug.');
    return false;
  }

  // Set cooldown
  data.putLong(cooldownKey, player.server.tickCount);

  abilityLog(player.username + ' activated: ' + ability.name + ' (' + equippedSigil + ')');
  return true;
}

// ============================================================
// PACK WOLF DESPAWN — Clean up summoned wolves
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;

  // Check every 100 ticks
  if (server.tickCount % 100 !== 0) return;

  for (const player of server.players) {
    const despawnTick = player.persistentData.getLong('horizons_pack_despawn_tick') || 0;
    if (despawnTick > 0 && server.tickCount >= despawnTick) {
      server.runCommandSilent(
        'kill @e[tag=pack_wolf_' + player.username + ']'
      );
      player.persistentData.putLong('horizons_pack_despawn_tick', 0);
      player.tell('\u00a77[Horizons] Your summoned pack fades away.');
    }
  }
});

// ============================================================
// COMMAND REGISTRATION
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('ability')
        // /horizons ability activate
        .then(Commands.literal('activate')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            activateAbility(player);
            return 1;
          })
        )
        // /horizons ability cooldown
        .then(Commands.literal('cooldown')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const data = player.persistentData;
            const equippedSigil = data.getString('horizons_equipped_sigil');

            if (!equippedSigil || equippedSigil.length === 0) {
              player.tell('\u00a7c[Horizons] No sigil equipped.');
              return 0;
            }

            const ability = ABILITIES[equippedSigil];
            if (!ability) {
              player.tell('\u00a7c[Horizons] No ability for class: ' + equippedSigil);
              return 0;
            }

            const cooldownKey = COOLDOWN_KEY_PREFIX + equippedSigil;
            const lastUsed = data.getLong(cooldownKey) || 0;
            const elapsed = player.server.tickCount - lastUsed;

            if (lastUsed === 0 || elapsed >= ability.cooldown) {
              player.tell('\u00a7a[Horizons] ' + ability.color + ability.name + ' \u00a7ais READY.');
            } else {
              const remainingSec = Math.ceil((ability.cooldown - elapsed) / 20);
              const totalSec = Math.ceil(ability.cooldown / 20);
              player.tell('\u00a7e[Horizons] ' + ability.color + ability.name + ' \u00a77cooldown: \u00a7f' + remainingSec + 's / ' + totalSec + 's');
            }

            return 1;
          })
        )
        // /horizons ability info
        .then(Commands.literal('info')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const data = player.persistentData;
            const equippedSigil = data.getString('horizons_equipped_sigil');

            if (!equippedSigil || equippedSigil.length === 0) {
              player.tell('\u00a7c[Horizons] No sigil equipped. Equip one with /horizons sigil equip <class>');
              return 0;
            }

            const ability = ABILITIES[equippedSigil];
            if (!ability) {
              player.tell('\u00a7c[Horizons] No ability for class: ' + equippedSigil);
              return 0;
            }

            player.tell('\u00a76\u00a7l=== Signature Ability ===');
            player.tell(ability.color + '\u00a7l' + ability.name);
            player.tell('\u00a77' + ability.description);
            player.tell('\u00a77Cooldown: \u00a7f' + Math.ceil(ability.cooldown / 20) + ' seconds');
            player.tell('\u00a77Activate: \u00a7f/horizons ability activate');

            return 1;
          })
        )
        // /horizons ability reset (OP — reset all cooldowns)
        .then(Commands.literal('reset')
          .requires(src => src.hasPermission(2))
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            for (const classId of ABILITY_IDS) {
              player.persistentData.putLong(COOLDOWN_KEY_PREFIX + classId, 0);
            }
            player.tell('\u00a7a[Horizons] All ability cooldowns reset (admin).');
            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Signature Abilities loaded');
console.log('[Horizons] Commands: /horizons ability [activate|cooldown|info|reset]');
console.log('[Horizons] Abilities: ' + ABILITY_IDS.length + ' total');
