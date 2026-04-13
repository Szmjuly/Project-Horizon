// ============================================================
// Project Horizons — Crime Stat Tracking
// ============================================================
// File: kubejs/server_scripts/crime/crime_stat.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// 6-tier crime stat system with escalating consequences.
// Tiers:
//   0 = Clean        — No penalties
//   1 = Suspect      — Villager prices +25%
//   2 = Wanted       — Villager prices +50%
//   3 = Dangerous    — Guards hostile, bounty posted
//   4 = Outlaw       — Cannot enter towns, outlaw faction unlocked
//   5 = Most Wanted  — NPC bounty hunters spawn
//   6 = Public Enemy — Maximum hunter intensity
//
// Crime stat decays -1 every 30 real minutes if crime-free.
// On death: crime stat reduced by 1.
// ============================================================

// --- Crime Stat Configuration ---
const CRIME_STAT_CONFIG = {
  // How often to apply tier consequences (ticks)
  consequenceInterval: 600,

  // How often to check decay (ticks) — every 60 seconds
  decayCheckInterval: 1200,

  // Time in ticks for 1 tier of decay (30 real minutes = 36000 ticks)
  decayTime: 36000,

  // NBT keys
  crimeStatKey: 'horizons_crime_stat',
  lastCrimeTickKey: 'horizons_last_crime_tick',
  lastDecayTickKey: 'horizons_last_decay_tick',
  priceMultiplierKey: 'horizons_price_multiplier',

  // Town center definitions (players teleported out at tier 4+)
  townCenters: [
    { name: 'Starter Town', x: 0, z: 0, radius: 80, ejectX: 90, ejectZ: 90 },
    { name: 'Market District', x: 400, z: 200, radius: 60, ejectX: 470, ejectZ: 270 },
    { name: 'Harbor Town', x: -300, z: 500, radius: 70, ejectX: -380, ejectZ: 580 }
  ]
};

// --- Tier Definitions ---
const CRIME_TIERS = {
  0: { name: 'Clean', color: '\u00a7a', description: 'No criminal record' },
  1: { name: 'Suspect', color: '\u00a7e', description: 'Villager prices increased 25%' },
  2: { name: 'Wanted', color: '\u00a76', description: 'Villager prices increased 50%' },
  3: { name: 'Dangerous', color: '\u00a7c', description: 'Guards hostile, bounty posted' },
  4: { name: 'Outlaw', color: '\u00a74', description: 'Banned from towns, outlaw faction unlocked' },
  5: { name: 'Most Wanted', color: '\u00a74', description: 'NPC bounty hunters dispatched' },
  6: { name: 'Public Enemy', color: '\u00a74\u00a7l', description: 'Maximum hunter intensity' }
};

// ============================================================
// UTILITY — Get/Set Crime Stat
// ============================================================

function getCrimeStat(player) {
  return player.persistentData.getInt(CRIME_STAT_CONFIG.crimeStatKey) || 0;
}

function getTierInfo(level) {
  return CRIME_TIERS[level] || CRIME_TIERS[0];
}

/**
 * Sync crime-related stages with the current crime stat level.
 */
function syncCrimeStages(player, level) {
  // Set tier stages
  for (let i = 1; i <= 6; i++) {
    if (level >= i) {
      if (!player.stages.has(`crime_level_${i}`)) {
        player.stages.add(`crime_level_${i}`);
      }
    } else {
      if (player.stages.has(`crime_level_${i}`)) {
        player.stages.remove(`crime_level_${i}`);
      }
    }
  }

  // Outlaw stage (tier 4+)
  if (level >= 4) {
    if (!player.stages.has('crime_outlaw')) {
      player.stages.add('crime_outlaw');
    }
  } else {
    if (player.stages.has('crime_outlaw')) {
      player.stages.remove('crime_outlaw');
    }
  }

  // Clean stage (tier 0)
  if (level === 0) {
    if (!player.stages.has('crime_clean')) {
      player.stages.add('crime_clean');
    }
  } else {
    if (player.stages.has('crime_clean')) {
      player.stages.remove('crime_clean');
    }
  }
}

// ============================================================
// CONSEQUENCE ENGINE — Applied periodically based on tier
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;

  // --- Apply tier consequences every 600 ticks ---
  if (server.tickCount % CRIME_STAT_CONFIG.consequenceInterval === 0) {
    const players = server.players;
    for (let player of players) {
      if (player.isCreative() || player.isSpectator()) continue;

      const crimeStat = getCrimeStat(player);
      if (crimeStat <= 0) continue;

      syncCrimeStages(player, crimeStat);
      applyTierConsequences(player, crimeStat, server);
    }
  }

  // --- Check decay every 1200 ticks ---
  if (server.tickCount % CRIME_STAT_CONFIG.decayCheckInterval === 0) {
    const players = server.players;
    for (let player of players) {
      if (player.isCreative() || player.isSpectator()) continue;

      const crimeStat = getCrimeStat(player);
      if (crimeStat <= 0) continue;

      checkCrimeDecay(player, server);
    }
  }
});

/**
 * Apply escalating consequences based on current crime tier.
 */
function applyTierConsequences(player, tier, server) {
  const playerName = player.username;

  // --- Tier 1-2: Price increases (stored as multiplier for shop systems) ---
  if (tier === 1) {
    player.persistentData.putInt(CRIME_STAT_CONFIG.priceMultiplierKey, 125);
  } else if (tier === 2) {
    player.persistentData.putInt(CRIME_STAT_CONFIG.priceMultiplierKey, 150);
  } else if (tier >= 3) {
    player.persistentData.putInt(CRIME_STAT_CONFIG.priceMultiplierKey, 200);
  }

  // --- Tier 3: Guards become hostile, bounty auto-posted ---
  if (tier === 3) {
    // Tag player so guard AI can target them
    server.runCommandSilent(`tag ${playerName} add horizons_guard_hostile`);
  }

  // --- Tier 4+: Cannot enter towns ---
  if (tier >= 4) {
    const pos = player.blockPosition();
    const dimKey = player.level.dimension().toString();

    if (dimKey.includes('overworld')) {
      for (let town of CRIME_STAT_CONFIG.townCenters) {
        const dx = pos.x - town.x;
        const dz = pos.z - town.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= town.radius) {
          // Teleport player out of town
          server.runCommandSilent(
            `tp ${playerName} ${town.ejectX} ~ ${town.ejectZ}`
          );
          player.tell(
            `\u00a74[Horizons] \u00a7cYou are banned from ${town.name}! \u00a77Your crime stat is too high.`
          );
          // Apply brief slowness so they don't just run back in
          server.runCommandSilent(
            `effect give ${playerName} minecraft:slowness 5 1 true`
          );
          break;
        }
      }
    }
  }

  // --- Tier 3+: Ensure bounty is posted (handled by bounty_board.js) ---
  if (tier >= 3) {
    server.runCommandSilent(
      `scoreboard objectives add horizons_bounty dummy`
    );
    // Set bounty value: crime_level * 50
    server.runCommandSilent(
      `scoreboard players set ${playerName} horizons_bounty ${tier * 50}`
    );
  }

  // --- Tier 5-6: NPC hunters handled by npc_hunters.js ---
}

// ============================================================
// CRIME DECAY — Reduce crime stat over time
// ============================================================

/**
 * Check if player has been crime-free long enough for decay.
 * Decays -1 tier every 30 real minutes without committing crimes.
 */
function checkCrimeDecay(player, server) {
  const data = player.persistentData;
  const lastCrimeTick = data.getLong(CRIME_STAT_CONFIG.lastCrimeTickKey) || 0;
  const lastDecayTick = data.getLong(CRIME_STAT_CONFIG.lastDecayTickKey) || 0;
  const currentTick = server.tickCount;

  // Reference point: the later of last crime or last decay
  const referencePoint = Math.max(lastCrimeTick, lastDecayTick);

  // Check if enough time has passed for decay
  if (currentTick - referencePoint >= CRIME_STAT_CONFIG.decayTime) {
    const currentStat = getCrimeStat(player);
    if (currentStat > 0) {
      const newStat = currentStat - 1;
      data.putInt(CRIME_STAT_CONFIG.crimeStatKey, newStat);
      data.putLong(CRIME_STAT_CONFIG.lastDecayTickKey, currentTick);

      syncCrimeStages(player, newStat);

      const tierInfo = getTierInfo(newStat);
      player.tell(
        `\u00a7a[Horizons] \u00a77Crime stat decayed. Current level: ${tierInfo.color}${tierInfo.name} (${newStat}/6)`
      );

      // Remove guard hostility if below tier 3
      if (newStat < 3) {
        server.runCommandSilent(`tag ${player.username} remove horizons_guard_hostile`);
      }

      // Clear bounty if below tier 3
      if (newStat < 3) {
        server.runCommandSilent(
          `scoreboard players reset ${player.username} horizons_bounty`
        );
      }

      // If fully clean, celebrate
      if (newStat === 0) {
        player.tell('\u00a7a[Horizons] \u00a77Your criminal record has been cleared!');
        player.stages.add('crime_clean');
      }
    }
  }
}

// ============================================================
// DEATH PENALTY — Reduce crime stat by 1 on death
// ============================================================

PlayerEvents.respawned(event => {
  const player = event.player;
  const data = player.persistentData;
  const currentStat = data.getInt(CRIME_STAT_CONFIG.crimeStatKey) || 0;

  if (currentStat > 0) {
    const newStat = currentStat - 1;
    data.putInt(CRIME_STAT_CONFIG.crimeStatKey, newStat);
    syncCrimeStages(player, newStat);

    const tierInfo = getTierInfo(newStat);
    player.tell(
      `\u00a7e[Horizons] \u00a77Death has reduced your crime stat. Current: ${tierInfo.color}${tierInfo.name} (${newStat}/6)`
    );

    if (newStat < 3) {
      player.server.runCommandSilent(`tag ${player.username} remove horizons_guard_hostile`);
      player.server.runCommandSilent(
        `scoreboard players reset ${player.username} horizons_bounty`
      );
    }

    if (newStat === 0) {
      player.stages.add('crime_clean');
    }
  }
});

// ============================================================
// COMMAND — /horizons crime status
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('crime')
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const data = player.persistentData;
            const crimeStat = data.getInt(CRIME_STAT_CONFIG.crimeStatKey) || 0;
            const tierInfo = getTierInfo(crimeStat);
            const crimeCount = data.getInt('horizons_crime_count') || 0;

            player.tell('\u00a76\u00a7l=== Crime Status ===');
            player.tell(`\u00a77Current Tier: ${tierInfo.color}${tierInfo.name} \u00a77(${crimeStat}/6)`);
            player.tell(`\u00a77Description: \u00a7f${tierInfo.description}`);
            player.tell(`\u00a77Total Crimes: \u00a7f${crimeCount}`);

            // Show active consequences
            player.tell('\u00a76Active Consequences:');
            if (crimeStat === 0) {
              player.tell('\u00a7a  None — you are a law-abiding citizen.');
            }
            if (crimeStat >= 1) {
              const mult = crimeStat >= 3 ? 100 : (crimeStat === 2 ? 50 : 25);
              player.tell(`\u00a7e  - Villager prices +${mult}%`);
            }
            if (crimeStat >= 3) {
              player.tell('\u00a7c  - Guards are hostile');
              player.tell('\u00a7c  - Bounty posted on you');
            }
            if (crimeStat >= 4) {
              player.tell('\u00a74  - Banned from towns');
              player.tell('\u00a7d  - Outlaw faction available');
            }
            if (crimeStat >= 5) {
              player.tell('\u00a74  - NPC bounty hunters dispatched');
            }
            if (crimeStat === 6) {
              player.tell('\u00a74\u00a7l  - MAXIMUM HUNTER INTENSITY');
            }

            // Show decay info
            const lastCrime = data.getLong(CRIME_STAT_CONFIG.lastCrimeTickKey) || 0;
            const lastDecay = data.getLong(CRIME_STAT_CONFIG.lastDecayTickKey) || 0;
            const ref = Math.max(lastCrime, lastDecay);

            if (crimeStat > 0 && ref > 0) {
              const server = player.server;
              const ticksSinceRef = server.tickCount - ref;
              const ticksUntilDecay = Math.max(0, CRIME_STAT_CONFIG.decayTime - ticksSinceRef);
              const minutesLeft = Math.ceil(ticksUntilDecay / 1200);

              player.tell(
                `\u00a77Decay in: \u00a7f~${minutesLeft} minutes \u00a77(if crime-free)`
              );
            }

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Sync stages on login
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const crimeStat = getCrimeStat(player);
  syncCrimeStages(player, crimeStat);

  if (crimeStat > 0) {
    const tierInfo = getTierInfo(crimeStat);
    player.tell(
      `\u00a76[Horizons] \u00a77Crime Status: ${tierInfo.color}${tierInfo.name} \u00a77(${crimeStat}/6)`
    );
  }
});

console.log('[Horizons] Crime Stat Tracking loaded');
console.log('[Horizons] Tiers: Clean, Suspect, Wanted, Dangerous, Outlaw, Most Wanted, Public Enemy');
console.log('[Horizons] Commands: /horizons crime status');
