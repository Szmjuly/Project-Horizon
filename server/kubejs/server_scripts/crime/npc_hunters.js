// ============================================================
// Project Horizons — NPC Bounty Hunters
// ============================================================
// File: kubejs/server_scripts/crime/npc_hunters.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Simulates NPC bounty hunters that pursue high crime-stat players.
// At crime tier 5+, hunters are periodically dispatched.
//
// Hunter "spawning" is simulated through effects:
//   - Glowing effect on the criminal
//   - Ominous sounds
//   - Warning messages
//   - At tier 6: Weakness applied (simulating attack)
//
// Commands:
//   /horizons hunters status — shows current hunter threat level
// ============================================================

// --- Hunter Configuration ---
const HUNTER_CONFIG = {
  // How often to check for hunter spawns (ticks)
  // 6000 ticks = 5 minutes at 20 tps
  spawnCheckInterval: 6000,

  // Minimum crime tier for NPC hunters
  minCrimeTier: 5,

  // Spawn chance per check at tier 5 (20%)
  baseSpawnChance: 0.20,

  // Spawn chance increase per tier above 5
  chancePerTier: 0.15,

  // Glowing duration (seconds)
  glowingDuration: 10,

  // Weakness duration at tier 6 (seconds)
  weaknessDuration: 30,

  // NBT keys
  hunterThreatKey: 'horizons_hunter_threat',
  hunterEncountersKey: 'horizons_hunter_encounters',
  lastHunterTickKey: 'horizons_last_hunter_tick',
  hunterActiveKey: 'horizons_npc_hunter_active'
};

// --- Hunter Encounter Messages ---
const HUNTER_MESSAGES = {
  approach: [
    '\u00a74[Horizons] \u00a7cYou feel eyes watching you from the shadows...',
    '\u00a74[Horizons] \u00a7cThe hairs on the back of your neck stand up.',
    '\u00a74[Horizons] \u00a7cA bounty hunter is closing in on your position!',
    '\u00a74[Horizons] \u00a7cYou hear footsteps behind you. A hunter draws near.',
    '\u00a74[Horizons] \u00a7cThe glint of a weapon catches your eye in the distance.'
  ],
  tier6: [
    '\u00a74\u00a7l[Horizons] \u00a7cAn elite hunter strikes from the shadows!',
    '\u00a74\u00a7l[Horizons] \u00a7cA poisoned dart hits you! The hunters are relentless.',
    '\u00a74\u00a7l[Horizons] \u00a7cAn assassin lunges from hiding! You feel weakened.',
    '\u00a74\u00a7l[Horizons] \u00a7cThe Guild of Hunters has sent their best after you!'
  ],
  warning: [
    '\u00a76[Horizons] \u00a77Hunters will continue to pursue you until your crime stat drops below 5.',
    '\u00a76[Horizons] \u00a77Consider surrendering to reduce your sentence.',
    '\u00a76[Horizons] \u00a77The longer you evade, the more hunters will come.'
  ]
};

// --- Ominous Sounds ---
const OMINOUS_SOUNDS = [
  'minecraft:ambient.cave',
  'minecraft:entity.warden.ambient',
  'minecraft:entity.elder_guardian.curse',
  'minecraft:event.raid.horn',
  'minecraft:entity.phantom.ambient'
];

// ============================================================
// UTILITY — Random selection from arrays
// ============================================================

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calculate threat level based on crime stat and encounters.
 * Returns a value from 1-5 representing hunter intensity.
 */
function calculateThreatLevel(crimeStat, encounters) {
  let threat = crimeStat - 4; // Base: tier 5 = threat 1, tier 6 = threat 2
  threat += Math.floor(encounters / 3); // +1 per 3 encounters
  return Math.min(5, Math.max(1, threat));
}

/**
 * Get threat level description.
 */
function getThreatDescription(threatLevel) {
  const descriptions = {
    1: { name: 'Low', color: '\u00a7e', desc: 'Occasional scout patrols' },
    2: { name: 'Moderate', color: '\u00a76', desc: 'Regular hunter patrols' },
    3: { name: 'High', color: '\u00a7c', desc: 'Dedicated hunting parties' },
    4: { name: 'Severe', color: '\u00a74', desc: 'Elite hunter squads deployed' },
    5: { name: 'Maximum', color: '\u00a74\u00a7l', desc: 'Guild of Hunters in full pursuit' }
  };
  return descriptions[threatLevel] || descriptions[1];
}

// ============================================================
// HUNTER SPAWN CHECK — Periodic hunter encounters
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % HUNTER_CONFIG.spawnCheckInterval !== 0) return;

  const players = server.players;
  for (let player of players) {
    if (player.isCreative() || player.isSpectator()) continue;

    const data = player.persistentData;
    const crimeStat = data.getInt('horizons_crime_stat') || 0;

    if (crimeStat < HUNTER_CONFIG.minCrimeTier) continue;

    // Calculate spawn chance
    const tierBonus = (crimeStat - HUNTER_CONFIG.minCrimeTier) * HUNTER_CONFIG.chancePerTier;
    const spawnChance = HUNTER_CONFIG.baseSpawnChance + tierBonus;

    if (Math.random() > spawnChance) continue;

    // Hunter encounter triggered!
    spawnHunterEncounter(player, crimeStat, server);
  }
});

/**
 * Simulate a hunter encounter for a player.
 */
function spawnHunterEncounter(player, crimeStat, server) {
  const data = player.persistentData;
  const encounters = (data.getInt(HUNTER_CONFIG.hunterEncountersKey) || 0) + 1;
  data.putInt(HUNTER_CONFIG.hunterEncountersKey, encounters);
  data.putLong(HUNTER_CONFIG.lastHunterTickKey, server.tickCount);

  const threatLevel = calculateThreatLevel(crimeStat, encounters);
  data.putInt(HUNTER_CONFIG.hunterThreatKey, threatLevel);
  data.putInt(HUNTER_CONFIG.hunterActiveKey, 1);

  const playerName = player.username;

  // --- Stage 1: Warning message ---
  player.tell(randomFrom(HUNTER_MESSAGES.approach));

  // --- Stage 2: Apply Glowing effect (makes criminal visible) ---
  server.runCommandSilent(
    `effect give ${playerName} minecraft:glowing ${HUNTER_CONFIG.glowingDuration} 0 true`
  );

  // --- Stage 3: Play ominous sound ---
  const sound = randomFrom(OMINOUS_SOUNDS);
  server.runCommandSilent(
    `playsound ${sound} hostile ${playerName} ~ ~ ~ 1 0.5`
  );

  // --- Stage 4: Particles at player location ---
  const pos = player.blockPosition();
  server.runCommandSilent(
    `particle minecraft:smoke ${pos.x} ${pos.y + 1} ${pos.z} 2 2 2 0.02 30`
  );

  // --- Stage 5: Tier 6 special — Weakness attack ---
  if (crimeStat >= 6) {
    player.tell(randomFrom(HUNTER_MESSAGES.tier6));

    // Apply Weakness I for 30 seconds
    server.runCommandSilent(
      `effect give ${playerName} minecraft:weakness ${HUNTER_CONFIG.weaknessDuration} 0 true`
    );

    // Additional punishment at max threat
    if (threatLevel >= 4) {
      server.runCommandSilent(
        `effect give ${playerName} minecraft:slowness 10 1 true`
      );
    }

    // Extra dramatic effects
    server.runCommandSilent(
      `playsound minecraft:entity.wither.spawn hostile ${playerName} ~ ~ ~ 0.5 1.5`
    );
    server.runCommandSilent(
      `particle minecraft:angry_villager ${pos.x} ${pos.y + 2} ${pos.z} 2 1 2 0.1 10`
    );
  }

  // --- Show threat escalation warning occasionally ---
  if (encounters % 3 === 0) {
    player.tell(randomFrom(HUNTER_MESSAGES.warning));
  }

  // --- Notify nearby lawful players ---
  for (let other of server.players) {
    if (other.uuid.toString() === player.uuid.toString()) continue;

    const otherPos = other.blockPosition();
    const dx = pos.x - otherPos.x;
    const dz = pos.z - otherPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= 64 && other.level.dimension().toString() === player.level.dimension().toString()) {
      other.tell(
        `\u00a76[Horizons] \u00a77Bounty hunters are pursuing \u00a7c${playerName} \u00a77nearby. Stay alert.`
      );
    }
  }
}

// ============================================================
// CLEAR HUNTER STATE — When crime drops below threshold
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  // Check every 30 seconds (600 ticks)
  if (server.tickCount % 600 !== 50) return; // Offset to avoid collision with main check

  const players = server.players;
  for (let player of players) {
    const data = player.persistentData;
    const crimeStat = data.getInt('horizons_crime_stat') || 0;
    const hunterActive = data.getInt(HUNTER_CONFIG.hunterActiveKey) || 0;

    if (hunterActive === 1 && crimeStat < HUNTER_CONFIG.minCrimeTier) {
      // Crime dropped below hunter threshold — stand down
      data.putInt(HUNTER_CONFIG.hunterActiveKey, 0);
      data.putInt(HUNTER_CONFIG.hunterThreatKey, 0);

      player.tell(
        '\u00a7a[Horizons] \u00a77The bounty hunters have called off the pursuit. Your crime stat is below their threshold.'
      );
    }
  }
});

// ============================================================
// COMMAND — /horizons hunters status
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('hunters')
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const data = player.persistentData;
            const crimeStat = data.getInt('horizons_crime_stat') || 0;
            const encounters = data.getInt(HUNTER_CONFIG.hunterEncountersKey) || 0;
            const hunterActive = data.getInt(HUNTER_CONFIG.hunterActiveKey) || 0;

            player.tell('\u00a76\u00a7l=== Hunter Threat Status ===');

            if (crimeStat < HUNTER_CONFIG.minCrimeTier) {
              player.tell(
                '\u00a7a  No active hunter threat. \u00a77Crime stat is below the threshold.'
              );
              player.tell(
                `\u00a77  Hunters activate at crime tier ${HUNTER_CONFIG.minCrimeTier}+.`
              );

              if (encounters > 0) {
                player.tell(`\u00a77  Past encounters: \u00a7f${encounters}`);
              }

              return 1;
            }

            const threatLevel = calculateThreatLevel(crimeStat, encounters);
            const threatInfo = getThreatDescription(threatLevel);

            player.tell(`\u00a77Threat Level: ${threatInfo.color}${threatInfo.name} (${threatLevel}/5)`);
            player.tell(`\u00a77Description: \u00a7f${threatInfo.desc}`);
            player.tell(`\u00a77Total Encounters: \u00a7f${encounters}`);
            player.tell(`\u00a77Crime Stat: \u00a7c${crimeStat}/6`);

            if (hunterActive === 1) {
              player.tell('\u00a7c  Hunters are ACTIVELY pursuing you!');
            }

            if (crimeStat >= 6) {
              player.tell('\u00a74  WARNING: Elite hunters will attack on sight.');
              player.tell('\u00a74  Weakness effect will be applied during encounters.');
            }

            // Calculate time until next potential encounter
            const lastEncounter = data.getLong(HUNTER_CONFIG.lastHunterTickKey) || 0;
            const ticksSince = player.server.tickCount - lastEncounter;
            const ticksUntil = Math.max(0, HUNTER_CONFIG.spawnCheckInterval - ticksSince);
            const secondsUntil = Math.ceil(ticksUntil / 20);

            player.tell(
              `\u00a77Next patrol check in: \u00a7f~${secondsUntil} seconds`
            );

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Warn about active hunters
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;
  const crimeStat = data.getInt('horizons_crime_stat') || 0;

  if (crimeStat >= HUNTER_CONFIG.minCrimeTier) {
    const threatLevel = calculateThreatLevel(crimeStat, data.getInt(HUNTER_CONFIG.hunterEncountersKey) || 0);
    const threatInfo = getThreatDescription(threatLevel);

    player.tell(
      `\u00a74[Horizons] \u00a7cWARNING: Hunter threat level: ${threatInfo.color}${threatInfo.name}`
    );
    player.tell(
      '\u00a77  Bounty hunters are actively pursuing you. Stay vigilant.'
    );

    data.putInt(HUNTER_CONFIG.hunterActiveKey, 1);
  }
});

console.log('[Horizons] NPC Bounty Hunters loaded');
console.log('[Horizons] Activates at crime tier 5+, tier 6 adds Weakness attacks');
console.log('[Horizons] Commands: /horizons hunters status');
