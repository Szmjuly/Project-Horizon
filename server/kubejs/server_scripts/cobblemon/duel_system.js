// ============================================================
// Project Horizons — Duel System
// ============================================================
// File: kubejs/server_scripts/cobblemon/duel_system.js
// Phase: 4
// Dependencies: Cobblemon
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// PvP-alternative: challenge another player to a Cobblemon battle.
// Supports wager system with gold coins and bounty-hunter capture.
//
// FLOW:
//   1. Challenger: /horizons duel challenge <player> [wager]
//   2. Target sees challenge notification
//   3. Target: /horizons duel accept — both teleported, battle starts
//   4. Winner takes wager; if bounty hunter, winner captures target
//
// RULES:
//   - 60-second timeout on pending challenges
//   - 5-minute cooldown between challenges to same player
//   - Wager capped at player's balance
//
// COMMANDS:
//   /horizons duel challenge <player> [wager]
//   /horizons duel accept
//   /horizons duel decline
//   /horizons duel status
// ============================================================

// --- Configuration ---
const DUEL_CONFIG = {
  // persistentData keys
  keys: {
    pendingChallenger: 'horizons_duel_challenger',
    pendingWager: 'horizons_duel_wager',
    pendingTime: 'horizons_duel_time',
    lastChallengePrefix: 'horizons_duel_last_vs_',
    totalWins: 'horizons_duel_wins',
    totalLosses: 'horizons_duel_losses',
    totalEarnings: 'horizons_duel_earnings',
    inDuel: 'horizons_duel_active',
    preDuelX: 'horizons_duel_prex',
    preDuelY: 'horizons_duel_prey',
    preDuelZ: 'horizons_duel_prez'
  },

  // Challenge timeout in ticks (60 seconds = 1200 ticks)
  challengeTimeout: 1200,

  // Cooldown between challenges to the same player (5 min = 6000 ticks)
  challengeCooldown: 6000,

  // Maximum wager amount (gold coins)
  maxWager: 100,

  // Minimum wager amount
  minWager: 0,

  // Stage applied during active duel
  duelStage: 'horizons_in_duel',

  // Bounty hunter stage from crime system
  bountyHunterStage: 'crime_bounty_hunter',

  // Check interval for timeouts (every 5 seconds)
  timeoutCheckInterval: 100,

  debug: true
};

// --- Utility Functions ---

function duelLog(message) {
  if (DUEL_CONFIG.debug) {
    console.log('[Horizons/Duel] ' + message);
  }
}

/**
 * Check if a player has a pending challenge (as target).
 */
function hasPendingChallenge(player) {
  let challenger = player.persistentData.getString(DUEL_CONFIG.keys.pendingChallenger);
  return challenger && challenger.length > 0;
}

/**
 * Get the pending challenge info for a target player.
 */
function getPendingChallenge(player) {
  return {
    challenger: player.persistentData.getString(DUEL_CONFIG.keys.pendingChallenger),
    wager: player.persistentData.getInt(DUEL_CONFIG.keys.pendingWager),
    time: player.persistentData.getLong(DUEL_CONFIG.keys.pendingTime)
  };
}

/**
 * Set a pending challenge on the target player.
 */
function setPendingChallenge(target, challengerName, wager, serverTick) {
  target.persistentData.putString(DUEL_CONFIG.keys.pendingChallenger, challengerName);
  target.persistentData.putInt(DUEL_CONFIG.keys.pendingWager, wager);
  target.persistentData.putLong(DUEL_CONFIG.keys.pendingTime, serverTick);
}

/**
 * Clear a pending challenge from a target player.
 */
function clearPendingChallenge(target) {
  target.persistentData.putString(DUEL_CONFIG.keys.pendingChallenger, '');
  target.persistentData.putInt(DUEL_CONFIG.keys.pendingWager, 0);
  target.persistentData.putLong(DUEL_CONFIG.keys.pendingTime, 0);
}

/**
 * Check challenge cooldown between two players.
 * Returns remaining ticks, or 0 if no cooldown.
 */
function getCooldownRemaining(challenger, targetName, serverTick) {
  let lastTime = challenger.persistentData.getLong(DUEL_CONFIG.keys.lastChallengePrefix + targetName);
  if (lastTime <= 0) return 0;
  let elapsed = serverTick - lastTime;
  return Math.max(0, DUEL_CONFIG.challengeCooldown - elapsed);
}

/**
 * Record the challenge time for cooldown tracking.
 */
function recordChallengeTime(challenger, targetName, serverTick) {
  challenger.persistentData.putLong(DUEL_CONFIG.keys.lastChallengePrefix + targetName, serverTick);
}

/**
 * Check if a player is currently in a duel.
 */
function isInDuel(player) {
  return player.persistentData.getInt(DUEL_CONFIG.keys.inDuel) === 1;
}

/**
 * Set a player as in-duel and save their position for return.
 */
function enterDuel(player) {
  player.persistentData.putInt(DUEL_CONFIG.keys.inDuel, 1);
  player.persistentData.putInt(DUEL_CONFIG.keys.preDuelX, Math.floor(player.x));
  player.persistentData.putInt(DUEL_CONFIG.keys.preDuelY, Math.floor(player.y));
  player.persistentData.putInt(DUEL_CONFIG.keys.preDuelZ, Math.floor(player.z));
  player.stages.add(DUEL_CONFIG.duelStage);
}

/**
 * End a duel and teleport player back to their pre-duel position.
 */
function exitDuel(player) {
  player.persistentData.putInt(DUEL_CONFIG.keys.inDuel, 0);
  if (player.stages.has(DUEL_CONFIG.duelStage)) {
    player.stages.remove(DUEL_CONFIG.duelStage);
  }

  let x = player.persistentData.getInt(DUEL_CONFIG.keys.preDuelX);
  let y = player.persistentData.getInt(DUEL_CONFIG.keys.preDuelY);
  let z = player.persistentData.getInt(DUEL_CONFIG.keys.preDuelZ);

  if (x !== 0 || y !== 0 || z !== 0) {
    player.server.runCommandSilent(
      'tp ' + player.username + ' ' + x + ' ' + y + ' ' + z
    );
  }
}

/**
 * Find a nearby flat area for the duel arena.
 * Uses player's current position offset by 10 blocks.
 */
function getDuelArenaPos(player) {
  let x = Math.floor(player.x) + 10;
  let z = Math.floor(player.z) + 10;
  // Find ground level
  let y = Math.floor(player.y);
  return { x: x, y: y, z: z };
}

/**
 * Start the actual Cobblemon battle between two players.
 */
function startBattle(challenger, target) {
  let server = challenger.server;

  // Teleport both players to arena
  let arena = getDuelArenaPos(challenger);
  enterDuel(challenger);
  enterDuel(target);

  server.runCommandSilent(
    'tp ' + challenger.username + ' ' + arena.x + ' ' + arena.y + ' ' + (arena.z - 3)
  );
  server.runCommandSilent(
    'tp ' + target.username + ' ' + arena.x + ' ' + arena.y + ' ' + (arena.z + 3)
  );

  // Start Cobblemon battle via command
  server.runCommandSilent(
    'cobblemon battle ' + challenger.username + ' ' + target.username
  );

  // Apply brief invulnerability
  server.runCommandSilent(
    'effect give ' + challenger.username + ' minecraft:resistance 10 4 true'
  );
  server.runCommandSilent(
    'effect give ' + target.username + ' minecraft:resistance 10 4 true'
  );

  duelLog('Battle started: ' + challenger.username + ' vs ' + target.username);
}

/**
 * Resolve a duel: award wager, handle bounty capture.
 */
function resolveDuel(winner, loser, wager) {
  let server = winner.server;

  // Award wager
  if (wager > 0) {
    server.runCommandSilent(
      'lc credit ' + winner.username + ' ' + wager
    );
    server.runCommandSilent(
      'lc debit ' + loser.username + ' ' + wager
    );

    winner.tell('\u00a7a[Duel] You won \u00a7e' + wager + ' gold coins\u00a7a!');
    loser.tell('\u00a7c[Duel] You lost \u00a7e' + wager + ' gold coins\u00a7c.');

    // Track earnings
    let earnings = winner.persistentData.getInt(DUEL_CONFIG.keys.totalEarnings) + wager;
    winner.persistentData.putInt(DUEL_CONFIG.keys.totalEarnings, earnings);
  }

  // Track wins/losses
  let wins = winner.persistentData.getInt(DUEL_CONFIG.keys.totalWins) + 1;
  winner.persistentData.putInt(DUEL_CONFIG.keys.totalWins, wins);
  let losses = loser.persistentData.getInt(DUEL_CONFIG.keys.totalLosses) + 1;
  loser.persistentData.putInt(DUEL_CONFIG.keys.totalLosses, losses);

  // Bounty hunter capture check
  if (winner.stages.has(DUEL_CONFIG.bountyHunterStage)) {
    winner.tell('\u00a7d[Duel] Bounty hunter victory! Target captured via duel.');
    loser.tell('\u00a7c[Duel] You have been captured by a bounty hunter!');

    // Trigger capture system from crime scripts
    server.runCommandSilent(
      'scoreboard players set ' + loser.username + ' horizons_captured 1'
    );
  }

  // Return both players
  exitDuel(winner);
  exitDuel(loser);

  // Announce result
  server.runCommandSilent(
    'tellraw @a {"text":"","extra":[' +
      '{"text":"[Duel] ","color":"gold"},' +
      '{"text":"' + winner.username + '","color":"green"},' +
      '{"text":" defeated ","color":"gray"},' +
      '{"text":"' + loser.username + '","color":"red"},' +
      '{"text":" in a Pokemon duel!","color":"gray"}' +
    ']}'
  );

  duelLog(winner.username + ' defeated ' + loser.username + ' (wager: ' + wager + ')');
}

// ============================================================
// PERIODIC TICK — Check for challenge timeouts
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % DUEL_CONFIG.timeoutCheckInterval !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    if (!hasPendingChallenge(player)) return;

    let challenge = getPendingChallenge(player);
    let elapsed = server.tickCount - challenge.time;

    if (elapsed >= DUEL_CONFIG.challengeTimeout) {
      player.tell('\u00a77[Duel] Challenge from \u00a7f' + challenge.challenger + '\u00a77 has expired.');

      // Notify challenger if online
      let challengerPlayer = server.getPlayer(challenge.challenger);
      if (challengerPlayer) {
        challengerPlayer.tell('\u00a77[Duel] Your challenge to \u00a7f' + player.username + '\u00a77 has expired.');
      }

      clearPendingChallenge(player);
      duelLog('Challenge expired: ' + challenge.challenger + ' -> ' + player.username);
    }
  });
});

// ============================================================
// PLAYER LOGIN — Initialize duel data and clear stale challenges
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(DUEL_CONFIG.keys.totalWins)) {
    data.putInt(DUEL_CONFIG.keys.totalWins, 0);
    data.putInt(DUEL_CONFIG.keys.totalLosses, 0);
    data.putInt(DUEL_CONFIG.keys.totalEarnings, 0);
    data.putInt(DUEL_CONFIG.keys.inDuel, 0);
    data.putString(DUEL_CONFIG.keys.pendingChallenger, '');
    duelLog('Initialized duel data for ' + player.username);
  }

  // Clear any stale pending challenges
  clearPendingChallenge(player);

  // If player was in a duel when they logged off, return them
  if (isInDuel(player)) {
    exitDuel(player);
    player.tell('\u00a7e[Duel] You were returned from an interrupted duel.');
  }
});

// ============================================================
// COMMANDS: /horizons duel [challenge|accept|decline|status|resolve]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('duel')

        // /horizons duel challenge <player> [wager]
        .then(Commands.literal('challenge')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              // Challenge with no wager
              let player = ctx.source.player;
              if (!player) return 0;

              let targetName = event.getArguments().STRING.getResult(ctx, 'target');
              return handleChallenge(player, targetName, 0);
            })
            .then(Commands.argument('wager', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let targetName = event.getArguments().STRING.getResult(ctx, 'target');
                let wager = event.getArguments().INTEGER.getResult(ctx, 'wager');
                return handleChallenge(player, targetName, wager);
              })
            )
          )
        )

        // /horizons duel accept
        .then(Commands.literal('accept')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            if (!hasPendingChallenge(player)) {
              player.tell('\u00a7c[Duel] No pending challenge to accept.');
              return 0;
            }

            let challenge = getPendingChallenge(player);
            let server = player.server;

            // Check timeout
            let elapsed = server.tickCount - challenge.time;
            if (elapsed >= DUEL_CONFIG.challengeTimeout) {
              player.tell('\u00a7c[Duel] That challenge has expired.');
              clearPendingChallenge(player);
              return 0;
            }

            // Find challenger
            let challenger = server.getPlayer(challenge.challenger);
            if (!challenger) {
              player.tell('\u00a7c[Duel] ' + challenge.challenger + ' is no longer online.');
              clearPendingChallenge(player);
              return 0;
            }

            let wager = challenge.wager;

            player.tell('\u00a7a[Duel] Challenge accepted! Prepare for battle!');
            challenger.tell('\u00a7a[Duel] ' + player.username + ' accepted your challenge! Battle starting!');

            clearPendingChallenge(player);
            startBattle(challenger, player);

            return 1;
          })
        )

        // /horizons duel decline
        .then(Commands.literal('decline')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            if (!hasPendingChallenge(player)) {
              player.tell('\u00a77[Duel] No pending challenge to decline.');
              return 0;
            }

            let challenge = getPendingChallenge(player);
            let server = player.server;

            // Notify challenger
            let challenger = server.getPlayer(challenge.challenger);
            if (challenger) {
              challenger.tell('\u00a7c[Duel] ' + player.username + ' declined your challenge.');
            }

            player.tell('\u00a77[Duel] Challenge declined.');
            clearPendingChallenge(player);

            duelLog(player.username + ' declined challenge from ' + challenge.challenger);
            return 1;
          })
        )

        // /horizons duel status — show duel stats
        .then(Commands.literal('status')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let wins = player.persistentData.getInt(DUEL_CONFIG.keys.totalWins);
            let losses = player.persistentData.getInt(DUEL_CONFIG.keys.totalLosses);
            let earnings = player.persistentData.getInt(DUEL_CONFIG.keys.totalEarnings);
            let total = wins + losses;
            let winRate = total > 0 ? Math.floor((wins / total) * 100) : 0;

            player.tell('\u00a7e=== Duel Record ===');
            player.tell('\u00a77Wins: \u00a7a' + wins + ' \u00a77| Losses: \u00a7c' + losses);
            player.tell('\u00a77Win Rate: \u00a7f' + winRate + '%');
            player.tell('\u00a77Total Earnings: \u00a7e' + earnings + ' gold coins');

            if (isInDuel(player)) {
              player.tell('\u00a7d  Currently in a duel!');
            }

            if (hasPendingChallenge(player)) {
              let challenge = getPendingChallenge(player);
              let remaining = Math.max(0, DUEL_CONFIG.challengeTimeout - (player.server.tickCount - challenge.time));
              let remainingSec = Math.floor(remaining / 20);
              player.tell('\u00a7e  Pending challenge from: \u00a7f' + challenge.challenger);
              player.tell('\u00a77  Wager: \u00a7e' + challenge.wager + ' gold \u00a77| Expires: \u00a7f' + remainingSec + 's');
            }

            player.tell('');
            player.tell('\u00a77Use \u00a7f/horizons duel challenge <player> [wager]');

            return 1;
          })
        )

        // /horizons duel resolve <winner> <loser> — OP only, manual resolution
        .then(Commands.literal('resolve')
          .requires(function(source) { return source.hasPermission(2); })
          .then(Commands.argument('winner', event.getArguments().STRING.create(event))
            .then(Commands.argument('loser', event.getArguments().STRING.create(event))
              .executes(ctx => {
                let source = ctx.source;
                let winnerName = event.getArguments().STRING.getResult(ctx, 'winner');
                let loserName = event.getArguments().STRING.getResult(ctx, 'loser');
                let server = source.server;

                let winner = server.getPlayer(winnerName);
                let loser = server.getPlayer(loserName);

                if (!winner || !loser) {
                  if (source.player) source.player.tell('\u00a7c[Duel] Both players must be online.');
                  return 0;
                }

                // Use the wager from the last challenge if available
                let wager = loser.persistentData.getInt(DUEL_CONFIG.keys.pendingWager);
                resolveDuel(winner, loser, wager);

                if (source.player) {
                  source.player.tell('\u00a7a[Duel] Resolved: ' + winnerName + ' wins over ' + loserName);
                }

                return 1;
              })
            )
          )
        )
      )
  );
});

/**
 * Handle the challenge logic (shared between wager/no-wager variants).
 */
function handleChallenge(player, targetName, wager) {
  let server = player.server;

  // Can't challenge self
  if (targetName.toLowerCase() === player.username.toLowerCase()) {
    player.tell('\u00a7c[Duel] You cannot challenge yourself.');
    return 0;
  }

  // Check if player is already in a duel
  if (isInDuel(player)) {
    player.tell('\u00a7c[Duel] You are already in a duel!');
    return 0;
  }

  // Find target player
  let target = server.getPlayer(targetName);
  if (!target) {
    player.tell('\u00a7c[Duel] Player ' + targetName + ' is not online.');
    return 0;
  }

  // Check if target is already in a duel
  if (isInDuel(target)) {
    player.tell('\u00a7c[Duel] ' + targetName + ' is already in a duel.');
    return 0;
  }

  // Check if target already has a pending challenge
  if (hasPendingChallenge(target)) {
    player.tell('\u00a7c[Duel] ' + targetName + ' already has a pending challenge.');
    return 0;
  }

  // Check cooldown
  let cooldown = getCooldownRemaining(player, targetName, server.tickCount);
  if (cooldown > 0) {
    let seconds = Math.ceil(cooldown / 20);
    player.tell('\u00a7c[Duel] Cooldown active. Wait ' + seconds + ' seconds before challenging ' + targetName + ' again.');
    return 0;
  }

  // Validate wager
  if (wager < DUEL_CONFIG.minWager) wager = DUEL_CONFIG.minWager;
  if (wager > DUEL_CONFIG.maxWager) {
    player.tell('\u00a7c[Duel] Maximum wager is ' + DUEL_CONFIG.maxWager + ' gold coins.');
    wager = DUEL_CONFIG.maxWager;
  }

  // Send challenge
  setPendingChallenge(target, player.username, wager, server.tickCount);
  recordChallengeTime(player, targetName, server.tickCount);

  // Notify challenger
  player.tell('\u00a7e[Duel] Challenge sent to \u00a7f' + targetName + '\u00a7e!');
  if (wager > 0) {
    player.tell('\u00a77Wager: \u00a7e' + wager + ' gold coins');
  }
  player.tell('\u00a77Expires in 60 seconds.');

  // Notify target
  target.tell('\u00a7e=== Duel Challenge! ===');
  target.tell('\u00a7f' + player.username + ' \u00a77challenges you to a Pokemon duel!');
  if (wager > 0) {
    target.tell('\u00a77Wager: \u00a7e' + wager + ' gold coins');
  }

  // Check if challenger is a bounty hunter
  if (player.stages.has(DUEL_CONFIG.bountyHunterStage)) {
    target.tell('\u00a7c  WARNING: Challenger is a bounty hunter!');
  }

  target.tell('\u00a77Type \u00a7a/horizons duel accept \u00a77or \u00a7c/horizons duel decline');
  target.tell('\u00a77Expires in 60 seconds.');

  // Sound notification
  server.runCommandSilent(
    'execute at ' + targetName + ' run playsound minecraft:entity.experience_orb.pickup master @s ~ ~ ~ 1 0.8'
  );

  duelLog(player.username + ' challenged ' + targetName + ' (wager: ' + wager + ')');
  return 1;
}

console.log('[Horizons] Duel System loaded');
console.log('[Horizons] Commands: /horizons duel [challenge|accept|decline|status|resolve]');
console.log('[Horizons] 60s timeout, 5min cooldown, wager support');
