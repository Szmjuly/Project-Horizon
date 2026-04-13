// ============================================================
// Project Horizons — Bounty Board System
// ============================================================
// File: kubejs/server_scripts/crime/bounty_board.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Manages the bounty system for the crime framework.
// Auto-posts bounties for players at crime tier 3+.
// Bounty hunters can accept, track, and claim bounties.
//
// Bounties tracked via scoreboard "horizons_bounty" for values
// and persistentData for hunter assignments.
//
// Commands:
//   /horizons bounty list    — show all active bounties
//   /horizons bounty accept  — accept a bounty on a target
//   /horizons bounty claim   — claim reward after capture
// ============================================================

// --- Bounty Configuration ---
const BOUNTY_CONFIG = {
  // Scoreboard objective for bounty values
  bountyObjective: 'horizons_bounty',

  // NBT keys for hunter tracking
  hunterTargetKey: 'horizons_bounty_target',
  hunterActiveKey: 'horizons_bounty_hunter_active',
  bountyClaimableKey: 'horizons_bounty_claimable',
  bountyAcceptedTickKey: 'horizons_bounty_accepted_tick',

  // How often to check and auto-post bounties (ticks)
  autoPostInterval: 1200,

  // Minimum crime tier for auto-bounty
  minBountyTier: 3,

  // Gold coins per crime level
  goldPerLevel: 50,

  // Maximum active bounties per hunter
  maxActiveBounties: 1,

  // Currency item for rewards
  currencyItem: 'lightmanscurrency:coin_gold'
};

// ============================================================
// AUTO-POST — Automatically post bounties for high crime players
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % BOUNTY_CONFIG.autoPostInterval !== 0) return;

  // Ensure scoreboard objective exists
  server.runCommandSilent(
    `scoreboard objectives add ${BOUNTY_CONFIG.bountyObjective} dummy`
  );

  const players = server.players;
  for (let player of players) {
    if (player.isCreative() || player.isSpectator()) continue;

    const crimeStat = player.persistentData.getInt('horizons_crime_stat') || 0;

    if (crimeStat >= BOUNTY_CONFIG.minBountyTier) {
      const bountyValue = crimeStat * BOUNTY_CONFIG.goldPerLevel;

      // Post/update bounty on scoreboard
      server.runCommandSilent(
        `scoreboard players set ${player.username} ${BOUNTY_CONFIG.bountyObjective} ${bountyValue}`
      );
    } else {
      // Remove bounty if crime stat dropped below threshold
      server.runCommandSilent(
        `scoreboard players reset ${player.username} ${BOUNTY_CONFIG.bountyObjective}`
      );
    }
  }
});

// ============================================================
// BOUNTY MANAGEMENT — List, Accept, Claim
// ============================================================

/**
 * Get all players with active bounties.
 * Returns array of { name, bountyValue, crimeStat }.
 */
function getActiveBounties(server) {
  const bounties = [];
  const players = server.players;

  for (let player of players) {
    const crimeStat = player.persistentData.getInt('horizons_crime_stat') || 0;
    if (crimeStat >= BOUNTY_CONFIG.minBountyTier) {
      bounties.push({
        name: player.username,
        uuid: player.uuid.toString(),
        bountyValue: crimeStat * BOUNTY_CONFIG.goldPerLevel,
        crimeStat: crimeStat
      });
    }
  }

  return bounties;
}

/**
 * Check if a hunter already has an active bounty assignment.
 */
function hasActiveBounty(hunter) {
  const target = hunter.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);
  return target && target.length > 0;
}

/**
 * Assign a bounty target to a hunter.
 */
function acceptBounty(hunter, targetName, server) {
  if (hasActiveBounty(hunter)) {
    const currentTarget = hunter.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);
    hunter.tell(
      `\u00a7c[Horizons] \u00a77You already have an active bounty on \u00a7f${currentTarget}\u00a77. Claim or cancel it first.`
    );
    return false;
  }

  // Verify target exists and has a bounty
  const targetPlayer = server.getPlayer(targetName);
  if (!targetPlayer) {
    hunter.tell('\u00a7c[Horizons] \u00a77Target player not found.');
    return false;
  }

  const targetCrime = targetPlayer.persistentData.getInt('horizons_crime_stat') || 0;
  if (targetCrime < BOUNTY_CONFIG.minBountyTier) {
    hunter.tell('\u00a7c[Horizons] \u00a77That player does not have an active bounty.');
    return false;
  }

  // Cannot bounty-hunt yourself
  if (hunter.uuid.toString() === targetPlayer.uuid.toString()) {
    hunter.tell('\u00a7c[Horizons] \u00a77You cannot accept a bounty on yourself.');
    return false;
  }

  // Assign the bounty
  hunter.persistentData.putString(BOUNTY_CONFIG.hunterTargetKey, targetName);
  hunter.persistentData.putInt(BOUNTY_CONFIG.hunterActiveKey, 1);
  hunter.persistentData.putLong(BOUNTY_CONFIG.bountyAcceptedTickKey, server.tickCount);

  // Grant bounty hunter stage
  if (!hunter.stages.has('bounty_hunter_active')) {
    hunter.stages.add('bounty_hunter_active');
  }

  const bountyValue = targetCrime * BOUNTY_CONFIG.goldPerLevel;

  hunter.tell(
    `\u00a7a[Horizons] \u00a77Bounty accepted on \u00a7c${targetName}\u00a77! Reward: \u00a76${bountyValue} gold coins`
  );
  hunter.tell(
    '\u00a77Use \u00a7f/horizons compass \u00a77to track your target.'
  );

  // Notify the target
  targetPlayer.tell(
    `\u00a74[Horizons] \u00a7cA bounty hunter has accepted the bounty on your head!`
  );

  return true;
}

/**
 * Mark a bounty as claimable (called by capture.js when target is captured).
 */
function markBountyClaimable(hunter, targetName) {
  hunter.persistentData.putInt(BOUNTY_CONFIG.bountyClaimableKey, 1);
  hunter.tell(
    `\u00a7a[Horizons] \u00a77Target \u00a7f${targetName} \u00a77captured! Use \u00a7f/horizons bounty claim ${targetName} \u00a77to collect your reward.`
  );
}

/**
 * Claim a completed bounty reward.
 */
function claimBounty(hunter, targetName, server) {
  const assignedTarget = hunter.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);

  if (!assignedTarget || assignedTarget !== targetName) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77You do not have an active bounty on \u00a7f${targetName}\u00a77.`
    );
    return false;
  }

  const claimable = hunter.persistentData.getInt(BOUNTY_CONFIG.bountyClaimableKey) || 0;
  if (claimable !== 1) {
    hunter.tell(
      '\u00a7c[Horizons] \u00a77You must capture the target before claiming the reward.'
    );
    return false;
  }

  // Calculate reward based on target's crime stat at time of capture
  const targetPlayer = server.getPlayer(targetName);
  let bountyValue = 150; // Default if target is offline
  if (targetPlayer) {
    const targetCrime = targetPlayer.persistentData.getInt('horizons_crime_stat') || 0;
    bountyValue = Math.max(BOUNTY_CONFIG.minBountyTier, targetCrime) * BOUNTY_CONFIG.goldPerLevel;
  }

  // Grant reward
  server.runCommandSilent(
    `give ${hunter.username} ${BOUNTY_CONFIG.currencyItem} ${bountyValue}`
  );

  // Clear hunter assignment
  hunter.persistentData.putString(BOUNTY_CONFIG.hunterTargetKey, '');
  hunter.persistentData.putInt(BOUNTY_CONFIG.hunterActiveKey, 0);
  hunter.persistentData.putInt(BOUNTY_CONFIG.bountyClaimableKey, 0);

  // Remove bounty hunter stage
  if (hunter.stages.has('bounty_hunter_active')) {
    hunter.stages.remove('bounty_hunter_active');
  }

  hunter.tell(
    `\u00a7a[Horizons] \u00a77Bounty claimed! Received \u00a76${bountyValue} gold coins\u00a77.`
  );

  // Remove bounty from scoreboard if target's crime dropped
  if (targetPlayer) {
    const newCrime = targetPlayer.persistentData.getInt('horizons_crime_stat') || 0;
    if (newCrime < BOUNTY_CONFIG.minBountyTier) {
      server.runCommandSilent(
        `scoreboard players reset ${targetName} ${BOUNTY_CONFIG.bountyObjective}`
      );
    }
  }

  return true;
}

/**
 * Cancel an active bounty assignment without claiming.
 */
function cancelBounty(hunter) {
  const assignedTarget = hunter.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);
  if (!assignedTarget || assignedTarget.length === 0) {
    hunter.tell('\u00a7c[Horizons] \u00a77You have no active bounty to cancel.');
    return false;
  }

  hunter.persistentData.putString(BOUNTY_CONFIG.hunterTargetKey, '');
  hunter.persistentData.putInt(BOUNTY_CONFIG.hunterActiveKey, 0);
  hunter.persistentData.putInt(BOUNTY_CONFIG.bountyClaimableKey, 0);

  if (hunter.stages.has('bounty_hunter_active')) {
    hunter.stages.remove('bounty_hunter_active');
  }

  hunter.tell(
    `\u00a7e[Horizons] \u00a77Bounty on \u00a7f${assignedTarget} \u00a77cancelled.`
  );
  return true;
}

// ============================================================
// COMMANDS — /horizons bounty [list|accept|claim|cancel]
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('bounty')

        // --- /horizons bounty list ---
        .then(Commands.literal('list')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const server = ctx.source.server;
            const bounties = getActiveBounties(server);

            player.tell('\u00a76\u00a7l=== Bounty Board ===');

            if (bounties.length === 0) {
              player.tell('\u00a77No active bounties at this time.');
            } else {
              for (let bounty of bounties) {
                const tierNames = ['Clean','Suspect','Wanted','Dangerous','Outlaw','Most Wanted','Public Enemy'];
                const tierName = tierNames[bounty.crimeStat] || 'Unknown';
                player.tell(
                  `\u00a7c  ${bounty.name} \u00a77- \u00a76${bounty.bountyValue} gold \u00a77- Crime: \u00a7c${tierName} (${bounty.crimeStat})`
                );
              }
            }

            // Show current assignment if any
            const myTarget = player.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);
            if (myTarget && myTarget.length > 0) {
              const claimable = player.persistentData.getInt(BOUNTY_CONFIG.bountyClaimableKey) || 0;
              const status = claimable === 1 ? '\u00a7aREADY TO CLAIM' : '\u00a7eACTIVE';
              player.tell(
                `\u00a77Your assignment: \u00a7f${myTarget} \u00a77[${status}\u00a77]`
              );
            }

            return 1;
          })
        )

        // --- /horizons bounty accept <target> ---
        .then(Commands.literal('accept')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const targetName = event.getArguments().STRING.getResult(ctx, 'target');
              const server = ctx.source.server;

              acceptBounty(player, targetName, server);
              return 1;
            })
          )
        )

        // --- /horizons bounty claim <target> ---
        .then(Commands.literal('claim')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const targetName = event.getArguments().STRING.getResult(ctx, 'target');
              const server = ctx.source.server;

              claimBounty(player, targetName, server);
              return 1;
            })
          )
        )

        // --- /horizons bounty cancel ---
        .then(Commands.literal('cancel')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            cancelBounty(player);
            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Remind active bounty hunters
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const target = player.persistentData.getString(BOUNTY_CONFIG.hunterTargetKey);

  if (target && target.length > 0) {
    const claimable = player.persistentData.getInt(BOUNTY_CONFIG.bountyClaimableKey) || 0;

    if (claimable === 1) {
      player.tell(
        `\u00a7a[Horizons] \u00a77You have a claimable bounty on \u00a7f${target}\u00a77! Use \u00a7f/horizons bounty claim ${target}`
      );
    } else {
      player.tell(
        `\u00a76[Horizons] \u00a77Active bounty on \u00a7c${target}\u00a77. Use \u00a7f/horizons compass \u00a77to track.`
      );
    }
  }
});

console.log('[Horizons] Bounty Board System loaded');
console.log('[Horizons] Commands: /horizons bounty [list|accept|claim|cancel]');
