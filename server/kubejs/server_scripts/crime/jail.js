// ============================================================
// Project Horizons — Jail System (Aetheria Penitentiary)
// ============================================================
// File: kubejs/server_scripts/crime/jail.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Manages the Aetheria Penitentiary — the jail system for
// captured criminals. Handles:
//   - Jail entry (teleport, effects, timer)
//   - Sentence tracking and reduction
//   - Jail activities (mining, crafting reduce sentence)
//   - Escape prevention
//   - Release when sentence expires
//
// Commands:
//   /horizons jail send <player>    — send player to jail (OP/system)
//   /horizons jail status           — show remaining sentence
//   /horizons jail release <player> — immediate release (OP only)
// ============================================================

// --- Jail Configuration ---
const JAIL_CONFIG = {
  // Jail location (overworld)
  jailX: 0,
  jailY: 64,
  jailZ: 0,
  jailDimension: 'minecraft:overworld',

  // Escape detection radius from jail center
  escapeRadius: 50,

  // How often to check jail status (ticks)
  checkInterval: 200,

  // Sentence duration: crime_level * this many minutes
  minutesPerCrimeLevel: 5,

  // Ticks per minute (20 ticks/sec * 60 sec)
  ticksPerMinute: 1200,

  // Sentence reduction activities
  miningReduction: {
    blocksRequired: 64,
    minutesReduced: 1
  },
  craftingReduction: {
    minutesReduced: 0.5 // 30 seconds per craft
  },

  // NBT keys
  jailedKey: 'horizons_jailed',
  jailSentenceKey: 'horizons_jail_sentence_ticks',
  jailStartTickKey: 'horizons_jail_start_tick',
  originalXKey: 'horizons_jail_original_x',
  originalYKey: 'horizons_jail_original_y',
  originalZKey: 'horizons_jail_original_z',
  originalDimKey: 'horizons_jail_original_dim',
  blocksMinedKey: 'horizons_jail_blocks_mined',
  craftCountKey: 'horizons_jail_craft_count',
  escapeAttemptsKey: 'horizons_jail_escape_attempts'
};

// ============================================================
// UTILITY — Jail Management
// ============================================================

/**
 * Check if a player is currently jailed.
 */
function isJailed(player) {
  return player.persistentData.getInt(JAIL_CONFIG.jailedKey) === 1;
}

/**
 * Send a player to jail.
 */
function sendToJail(player, server) {
  const data = player.persistentData;
  const crimeStat = data.getInt('horizons_crime_stat') || 1;

  // Store original position for release
  const pos = player.blockPosition();
  data.putInt(JAIL_CONFIG.originalXKey, pos.x);
  data.putInt(JAIL_CONFIG.originalYKey, pos.y);
  data.putInt(JAIL_CONFIG.originalZKey, pos.z);
  data.putString(JAIL_CONFIG.originalDimKey, player.level.dimension().toString());

  // Set jailed flag
  data.putInt(JAIL_CONFIG.jailedKey, 1);

  // Calculate sentence: crime_level * 5 minutes
  const sentenceMinutes = Math.max(1, crimeStat) * JAIL_CONFIG.minutesPerCrimeLevel;
  const sentenceTicks = sentenceMinutes * JAIL_CONFIG.ticksPerMinute;
  data.putLong(JAIL_CONFIG.jailSentenceKey, sentenceTicks);
  data.putLong(JAIL_CONFIG.jailStartTickKey, server.tickCount);

  // Reset activity counters
  data.putInt(JAIL_CONFIG.blocksMinedKey, 0);
  data.putInt(JAIL_CONFIG.craftCountKey, 0);
  data.putInt(JAIL_CONFIG.escapeAttemptsKey, 0);

  // Teleport to jail
  server.runCommandSilent(
    `execute in ${JAIL_CONFIG.jailDimension} run tp ${player.username} ${JAIL_CONFIG.jailX} ${JAIL_CONFIG.jailY} ${JAIL_CONFIG.jailZ}`
  );

  // Apply jail effects
  server.runCommandSilent(
    `effect give ${player.username} minecraft:slowness 999999 1 true`
  );
  server.runCommandSilent(
    `effect give ${player.username} minecraft:mining_fatigue 999999 0 true`
  );

  // Add jail stage
  if (!player.stages.has('horizons_jailed')) {
    player.stages.add('horizons_jailed');
  }

  // Notify player
  player.tell('\u00a74\u00a7l=== AETHERIA PENITENTIARY ===');
  player.tell(`\u00a7c[Horizons] \u00a77You have been incarcerated.`);
  player.tell(`\u00a77Sentence: \u00a7f${sentenceMinutes} minutes`);
  player.tell('\u00a77Reduce your sentence:');
  player.tell(`\u00a77  - Mine ${JAIL_CONFIG.miningReduction.blocksRequired} blocks = \u00a7a-${JAIL_CONFIG.miningReduction.minutesReduced} minute`);
  player.tell('\u00a77  - Craft items = \u00a7a-30 seconds per craft');
  player.tell('\u00a7c  WARNING: Escape attempts will increase your sentence!');
}

/**
 * Release a player from jail.
 */
function releaseFromJail(player, server) {
  const data = player.persistentData;

  // Clear jailed flag
  data.putInt(JAIL_CONFIG.jailedKey, 0);

  // Remove jail effects
  server.runCommandSilent(
    `effect clear ${player.username} minecraft:slowness`
  );
  server.runCommandSilent(
    `effect clear ${player.username} minecraft:mining_fatigue`
  );

  // Remove jail stage
  if (player.stages.has('horizons_jailed')) {
    player.stages.remove('horizons_jailed');
  }

  // Teleport to original position
  const origX = data.getInt(JAIL_CONFIG.originalXKey);
  const origY = data.getInt(JAIL_CONFIG.originalYKey);
  const origZ = data.getInt(JAIL_CONFIG.originalZKey);
  const origDim = data.getString(JAIL_CONFIG.originalDimKey) || JAIL_CONFIG.jailDimension;

  server.runCommandSilent(
    `execute in ${origDim} run tp ${player.username} ${origX} ${origY} ${origZ}`
  );

  // Notify player
  player.tell('\u00a7a[Horizons] \u00a77You have been released from Aetheria Penitentiary.');
  player.tell('\u00a77You have been returned to your previous location.');
  player.tell('\u00a7e  Stay out of trouble, citizen.');
}

/**
 * Get remaining sentence in ticks.
 */
function getRemainingSentence(player, server) {
  const data = player.persistentData;
  const totalSentence = data.getLong(JAIL_CONFIG.jailSentenceKey) || 0;
  const startTick = data.getLong(JAIL_CONFIG.jailStartTickKey) || 0;
  const elapsed = server.tickCount - startTick;

  // Calculate reductions from activities
  const blocksMined = data.getInt(JAIL_CONFIG.blocksMinedKey) || 0;
  const craftCount = data.getInt(JAIL_CONFIG.craftCountKey) || 0;

  const miningReductionTicks = Math.floor(blocksMined / JAIL_CONFIG.miningReduction.blocksRequired) *
    (JAIL_CONFIG.miningReduction.minutesReduced * JAIL_CONFIG.ticksPerMinute);
  const craftReductionTicks = Math.floor(craftCount * JAIL_CONFIG.craftingReduction.minutesReduced * JAIL_CONFIG.ticksPerMinute);

  const totalReduction = miningReductionTicks + craftReductionTicks;
  const remaining = Math.max(0, totalSentence - elapsed - totalReduction);

  return remaining;
}

// ============================================================
// PERIODIC CHECK — Sentence timer, escape detection, release
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % JAIL_CONFIG.checkInterval !== 0) return;

  const players = server.players;
  for (let player of players) {
    if (!isJailed(player)) continue;
    if (player.isCreative() || player.isSpectator()) continue;

    // Check for sentence completion
    const remaining = getRemainingSentence(player, server);
    if (remaining <= 0) {
      releaseFromJail(player, server);
      continue;
    }

    // Check for escape attempts
    const pos = player.blockPosition();
    const dx = pos.x - JAIL_CONFIG.jailX;
    const dz = pos.z - JAIL_CONFIG.jailZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > JAIL_CONFIG.escapeRadius) {
      handleEscapeAttempt(player, server);
    }

    // Re-apply jail effects if they wore off (in case of milk, etc.)
    server.runCommandSilent(
      `effect give ${player.username} minecraft:slowness 999999 1 true`
    );
    server.runCommandSilent(
      `effect give ${player.username} minecraft:mining_fatigue 999999 0 true`
    );
  }
});

/**
 * Handle an escape attempt.
 */
function handleEscapeAttempt(player, server) {
  const data = player.persistentData;
  const attempts = (data.getInt(JAIL_CONFIG.escapeAttemptsKey) || 0) + 1;
  data.putInt(JAIL_CONFIG.escapeAttemptsKey, attempts);

  // Increase crime stat by 1 for escape attempt
  server.runCommandSilent(
    `execute as ${player.username} run horizons reward crimestat 1`
  );

  // Teleport back to jail
  server.runCommandSilent(
    `execute in ${JAIL_CONFIG.jailDimension} run tp ${player.username} ${JAIL_CONFIG.jailX} ${JAIL_CONFIG.jailY} ${JAIL_CONFIG.jailZ}`
  );

  // Apply punishment effects
  server.runCommandSilent(
    `effect give ${player.username} minecraft:slowness 30 3 true`
  );
  server.runCommandSilent(
    `effect give ${player.username} minecraft:blindness 10 0 true`
  );

  player.tell(
    '\u00a74[Horizons] \u00a7cESCAPE ATTEMPT DETECTED! \u00a77You have been returned to your cell.'
  );
  player.tell(
    `\u00a7c  Crime stat increased by 1. Escape attempts: ${attempts}`
  );
}

// ============================================================
// JAIL ACTIVITIES — Mining and crafting reduce sentence
// ============================================================

/**
 * Track block breaking in jail for sentence reduction.
 */
BlockEvents.broken(event => {
  const player = event.player;
  if (!player || !isJailed(player)) return;

  const data = player.persistentData;
  const blocksMined = (data.getInt(JAIL_CONFIG.blocksMinedKey) || 0) + 1;
  data.putInt(JAIL_CONFIG.blocksMinedKey, blocksMined);

  // Check if a reduction milestone was reached
  if (blocksMined % JAIL_CONFIG.miningReduction.blocksRequired === 0) {
    const totalMinutes = Math.floor(blocksMined / JAIL_CONFIG.miningReduction.blocksRequired) *
      JAIL_CONFIG.miningReduction.minutesReduced;
    player.tell(
      `\u00a7a[Horizons] \u00a77Mining progress: ${blocksMined} blocks. Sentence reduced by \u00a7a${totalMinutes} minute(s)\u00a77.`
    );
  }
});

/**
 * Track crafting in jail for sentence reduction.
 */
PlayerEvents.inventoryChanged(event => {
  const player = event.player;
  if (!player || !isJailed(player)) return;

  // Simple heuristic: count crafting events via inventory changes
  // This is approximate — proper crafting detection would use RecipeEvents
  const data = player.persistentData;
  const lastCraftTick = data.getLong('horizons_jail_last_craft_tick') || 0;
  const server = player.server;

  // Debounce: only count once per 20 ticks (1 second)
  if (server.tickCount - lastCraftTick < 20) return;

  // Only count if the item is a crafted result (not raw materials)
  const item = event.item;
  if (!item || item.isEmpty()) return;

  data.putLong('horizons_jail_last_craft_tick', server.tickCount);

  const craftCount = (data.getInt(JAIL_CONFIG.craftCountKey) || 0) + 1;
  data.putInt(JAIL_CONFIG.craftCountKey, craftCount);

  if (craftCount % 10 === 0) {
    const totalSeconds = craftCount * (JAIL_CONFIG.craftingReduction.minutesReduced * 60);
    player.tell(
      `\u00a7a[Horizons] \u00a77Crafting progress: ${craftCount} items. Sentence reduced by \u00a7a${totalSeconds} seconds\u00a77.`
    );
  }
});

// ============================================================
// COMMANDS — /horizons jail [send|status|release]
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('jail')

        // --- /horizons jail send <player> (requires permission level 2 / OP) ---
        .then(Commands.literal('send')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              const target = server.getPlayer(targetName);
              if (!target) {
                if (ctx.source.player) {
                  ctx.source.player.tell('\u00a7c[Horizons] Player not found.');
                }
                return 0;
              }

              if (isJailed(target)) {
                if (ctx.source.player) {
                  ctx.source.player.tell(
                    `\u00a7c[Horizons] ${targetName} is already in jail.`
                  );
                }
                return 0;
              }

              sendToJail(target, server);

              if (ctx.source.player) {
                ctx.source.player.tell(
                  `\u00a7a[Horizons] \u00a77Sent \u00a7f${targetName} \u00a77to Aetheria Penitentiary.`
                );
              }

              return 1;
            })
          )
        )

        // --- /horizons jail status ---
        .then(Commands.literal('status')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            if (!isJailed(player)) {
              player.tell('\u00a7a[Horizons] \u00a77You are not currently incarcerated.');
              return 1;
            }

            const server = ctx.source.server;
            const data = player.persistentData;
            const remaining = getRemainingSentence(player, server);
            const remainingMinutes = Math.ceil(remaining / JAIL_CONFIG.ticksPerMinute);
            const remainingSeconds = Math.ceil(remaining / 20);

            const blocksMined = data.getInt(JAIL_CONFIG.blocksMinedKey) || 0;
            const craftCount = data.getInt(JAIL_CONFIG.craftCountKey) || 0;
            const escapeAttempts = data.getInt(JAIL_CONFIG.escapeAttemptsKey) || 0;

            player.tell('\u00a76\u00a7l=== Jail Status ===');

            if (remainingMinutes > 1) {
              player.tell(`\u00a77Remaining sentence: \u00a7f${remainingMinutes} minutes`);
            } else {
              player.tell(`\u00a77Remaining sentence: \u00a7f${remainingSeconds} seconds`);
            }

            player.tell(`\u00a77Blocks mined: \u00a7f${blocksMined}`);

            const blocksNeeded = JAIL_CONFIG.miningReduction.blocksRequired -
              (blocksMined % JAIL_CONFIG.miningReduction.blocksRequired);
            player.tell(
              `\u00a77  Mine \u00a7f${blocksNeeded} \u00a77more blocks for -${JAIL_CONFIG.miningReduction.minutesReduced} minute`
            );

            player.tell(`\u00a77Items crafted: \u00a7f${craftCount}`);
            player.tell(`\u00a77Escape attempts: \u00a7c${escapeAttempts}`);

            return 1;
          })
        )

        // --- /horizons jail release <player> (OP only) ---
        .then(Commands.literal('release')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              const target = server.getPlayer(targetName);
              if (!target) {
                if (ctx.source.player) {
                  ctx.source.player.tell('\u00a7c[Horizons] Player not found.');
                }
                return 0;
              }

              if (!isJailed(target)) {
                if (ctx.source.player) {
                  ctx.source.player.tell(
                    `\u00a7c[Horizons] ${targetName} is not in jail.`
                  );
                }
                return 0;
              }

              releaseFromJail(target, server);

              if (ctx.source.player) {
                ctx.source.player.tell(
                  `\u00a7a[Horizons] \u00a77Released \u00a7f${targetName} \u00a77from Aetheria Penitentiary.`
                );
              }

              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Re-apply jail state on login
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;

  if (isJailed(player)) {
    const server = player.server;
    const remaining = getRemainingSentence(player, server);

    if (remaining <= 0) {
      // Sentence served while offline (approximately)
      releaseFromJail(player, server);
    } else {
      // Still jailed — teleport back and re-apply effects
      server.runCommandSilent(
        `execute in ${JAIL_CONFIG.jailDimension} run tp ${player.username} ${JAIL_CONFIG.jailX} ${JAIL_CONFIG.jailY} ${JAIL_CONFIG.jailZ}`
      );
      server.runCommandSilent(
        `effect give ${player.username} minecraft:slowness 999999 1 true`
      );
      server.runCommandSilent(
        `effect give ${player.username} minecraft:mining_fatigue 999999 0 true`
      );

      const remainingMinutes = Math.ceil(remaining / JAIL_CONFIG.ticksPerMinute);
      player.tell('\u00a74[Horizons] \u00a77You are still incarcerated in Aetheria Penitentiary.');
      player.tell(`\u00a77Remaining sentence: \u00a7f${remainingMinutes} minutes`);
    }
  }
});

console.log('[Horizons] Jail System (Aetheria Penitentiary) loaded');
console.log('[Horizons] Commands: /horizons jail [send|status|release]');
