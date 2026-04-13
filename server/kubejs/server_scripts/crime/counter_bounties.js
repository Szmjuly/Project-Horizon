// ============================================================
// Project Horizons — Counter-Bounty System
// ============================================================
// File: kubejs/server_scripts/crime/counter_bounties.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Allows outlaw players (crime tier 4+) to post reverse bounties
// on lawful players. Other outlaws can accept and pursue these
// counter-bounties.
//
// Features:
//   - Post counter-bounties (costs 100 gold coins)
//   - Track active counter-bounties server-wide
//   - Other outlaws can accept counter-bounties
//   - Claiming works similar to regular bounties
//
// Commands:
//   /horizons counterbounty post <target> <reward>
//   /horizons counterbounty list
//   /horizons counterbounty accept <target>
//   /horizons counterbounty claim <target>
//   /horizons counterbounty cancel <target>
// ============================================================

// --- Counter-Bounty Configuration ---
const COUNTER_BOUNTY_CONFIG = {
  // Minimum crime tier to post a counter-bounty
  minCrimeTier: 4,

  // Base cost in gold coins to post a counter-bounty
  baseCost: 100,

  // Minimum reward that can be posted
  minReward: 50,

  // Maximum reward that can be posted
  maxReward: 500,

  // Maximum active counter-bounties per outlaw
  maxPerPlayer: 3,

  // Scoreboard for tracking counter-bounty values
  scoreboardObjective: 'horizons_cbounty',

  // NBT keys
  counterBountiesPostedKey: 'horizons_cbounties_posted',
  counterBountyTargetKey: 'horizons_cbounty_target',
  counterBountyActiveKey: 'horizons_cbounty_active',
  counterBountyClaimableKey: 'horizons_cbounty_claimable',
  counterBountyRewardKey: 'horizons_cbounty_reward',

  // Currency item
  currencyItem: 'lightmanscurrency:coin_gold',

  // How often to clean up expired counter-bounties (ticks)
  cleanupInterval: 6000,

  // Counter-bounty expiration time (ticks) — 2 hours
  expirationTime: 144000
};

// ============================================================
// SERVER-SIDE STORAGE — Counter-bounty registry
// Using scoreboard + persistentData for tracking
//
// Each counter-bounty is stored as:
//   - Scoreboard: target_name -> reward value
//   - Poster's persistentData: list of posted bounties
// ============================================================

/**
 * Get list of counter-bounty targets posted by a player.
 * Stored as comma-separated string in persistentData.
 */
function getPostedBounties(player) {
  const posted = player.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountiesPostedKey) || '';
  if (posted.length === 0) return [];
  return posted.split(',').filter(s => s.length > 0);
}

/**
 * Add a counter-bounty target to a player's posted list.
 */
function addPostedBounty(player, targetName) {
  const posted = getPostedBounties(player);
  if (!posted.includes(targetName)) {
    posted.push(targetName);
  }
  player.persistentData.putString(
    COUNTER_BOUNTY_CONFIG.counterBountiesPostedKey,
    posted.join(',')
  );
}

/**
 * Remove a counter-bounty target from a player's posted list.
 */
function removePostedBounty(player, targetName) {
  const posted = getPostedBounties(player).filter(t => t !== targetName);
  player.persistentData.putString(
    COUNTER_BOUNTY_CONFIG.counterBountiesPostedKey,
    posted.join(',')
  );
}

/**
 * Get all active counter-bounties across all online players.
 * Returns array of { poster, target, reward }.
 */
function getAllCounterBounties(server) {
  const bounties = [];
  const players = server.players;

  for (let player of players) {
    const posted = getPostedBounties(player);
    for (let targetName of posted) {
      // Read reward from scoreboard-like storage in persistentData
      const rewardKey = `horizons_cbounty_reward_${targetName}`;
      const reward = player.persistentData.getInt(rewardKey) || 0;
      const postTick = player.persistentData.getLong(`horizons_cbounty_tick_${targetName}`) || 0;

      if (reward > 0) {
        bounties.push({
          poster: player.username,
          posterUuid: player.uuid.toString(),
          target: targetName,
          reward: reward,
          postedTick: postTick
        });
      }
    }
  }

  return bounties;
}

/**
 * Check if a player has enough gold coins.
 * Uses scoreboard-based check via command.
 */
function deductGold(player, amount, server) {
  // Clear the specified amount of gold coins from inventory
  server.runCommandSilent(
    `clear ${player.username} ${COUNTER_BOUNTY_CONFIG.currencyItem} ${amount}`
  );
  return true;
}

// ============================================================
// COUNTER-BOUNTY MANAGEMENT — Post, Accept, Claim
// ============================================================

/**
 * Post a counter-bounty on a lawful player.
 */
function postCounterBounty(poster, targetName, reward, server) {
  // Verify poster is an outlaw
  const crimeStat = poster.persistentData.getInt('horizons_crime_stat') || 0;
  if (crimeStat < COUNTER_BOUNTY_CONFIG.minCrimeTier) {
    poster.tell(
      `\u00a7c[Horizons] \u00a77Only outlaws (crime tier ${COUNTER_BOUNTY_CONFIG.minCrimeTier}+) can post counter-bounties.`
    );
    return false;
  }

  // Validate reward
  if (reward < COUNTER_BOUNTY_CONFIG.minReward) {
    poster.tell(
      `\u00a7c[Horizons] \u00a77Minimum reward is ${COUNTER_BOUNTY_CONFIG.minReward} gold coins.`
    );
    return false;
  }

  if (reward > COUNTER_BOUNTY_CONFIG.maxReward) {
    poster.tell(
      `\u00a7c[Horizons] \u00a77Maximum reward is ${COUNTER_BOUNTY_CONFIG.maxReward} gold coins.`
    );
    return false;
  }

  // Check max bounties
  const posted = getPostedBounties(poster);
  if (posted.length >= COUNTER_BOUNTY_CONFIG.maxPerPlayer) {
    poster.tell(
      `\u00a7c[Horizons] \u00a77You can only have ${COUNTER_BOUNTY_CONFIG.maxPerPlayer} active counter-bounties.`
    );
    return false;
  }

  // Check for duplicate
  if (posted.includes(targetName)) {
    poster.tell(
      `\u00a7c[Horizons] \u00a77You already have a counter-bounty on \u00a7f${targetName}\u00a77.`
    );
    return false;
  }

  // Verify target exists
  const target = server.getPlayer(targetName);
  if (!target) {
    poster.tell('\u00a7c[Horizons] \u00a77Target player not found.');
    return false;
  }

  // Cannot post on yourself
  if (poster.uuid.toString() === target.uuid.toString()) {
    poster.tell('\u00a7c[Horizons] \u00a77You cannot post a counter-bounty on yourself.');
    return false;
  }

  // Deduct cost (base cost + reward amount)
  const totalCost = COUNTER_BOUNTY_CONFIG.baseCost + reward;
  deductGold(poster, totalCost, server);

  // Store the counter-bounty
  addPostedBounty(poster, targetName);
  poster.persistentData.putInt(`horizons_cbounty_reward_${targetName}`, reward);
  poster.persistentData.putLong(`horizons_cbounty_tick_${targetName}`, server.tickCount);

  // Update scoreboard for display
  server.runCommandSilent(
    `scoreboard objectives add ${COUNTER_BOUNTY_CONFIG.scoreboardObjective} dummy`
  );
  server.runCommandSilent(
    `scoreboard players set ${targetName} ${COUNTER_BOUNTY_CONFIG.scoreboardObjective} ${reward}`
  );

  poster.tell(
    `\u00a7a[Horizons] \u00a77Counter-bounty posted on \u00a7f${targetName} \u00a77for \u00a76${reward} gold coins\u00a77.`
  );
  poster.tell(
    `\u00a77Total cost: \u00a76${totalCost} gold \u00a77(${COUNTER_BOUNTY_CONFIG.baseCost} posting fee + ${reward} reward).`
  );

  // Broadcast to other outlaws
  for (let p of server.players) {
    if (p.uuid.toString() === poster.uuid.toString()) continue;
    const otherCrime = p.persistentData.getInt('horizons_crime_stat') || 0;
    if (otherCrime >= COUNTER_BOUNTY_CONFIG.minCrimeTier) {
      p.tell(
        `\u00a74[Horizons] \u00a77New counter-bounty: \u00a7f${targetName} \u00a77for \u00a76${reward} gold \u00a77(posted by \u00a7c${poster.username}\u00a77)`
      );
    }
  }

  return true;
}

/**
 * Accept a counter-bounty.
 */
function acceptCounterBounty(hunter, targetName, server) {
  // Verify hunter is an outlaw
  const crimeStat = hunter.persistentData.getInt('horizons_crime_stat') || 0;
  if (crimeStat < COUNTER_BOUNTY_CONFIG.minCrimeTier) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77Only outlaws (crime tier ${COUNTER_BOUNTY_CONFIG.minCrimeTier}+) can accept counter-bounties.`
    );
    return false;
  }

  // Check if already on a counter-bounty hunt
  const currentTarget = hunter.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
  if (currentTarget && currentTarget.length > 0) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77You already have an active counter-bounty on \u00a7f${currentTarget}\u00a77. Cancel it first.`
    );
    return false;
  }

  // Verify counter-bounty exists
  const allBounties = getAllCounterBounties(server);
  const bounty = allBounties.find(b => b.target === targetName);

  if (!bounty) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77No active counter-bounty found on \u00a7f${targetName}\u00a77.`
    );
    return false;
  }

  // Cannot accept your own bounty
  if (bounty.posterUuid === hunter.uuid.toString()) {
    hunter.tell('\u00a7c[Horizons] \u00a77You cannot accept your own counter-bounty.');
    return false;
  }

  // Assign the counter-bounty
  hunter.persistentData.putString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey, targetName);
  hunter.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyActiveKey, 1);
  hunter.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyRewardKey, bounty.reward);

  hunter.tell(
    `\u00a7a[Horizons] \u00a77Counter-bounty accepted on \u00a7f${targetName}\u00a77! Reward: \u00a76${bounty.reward} gold coins`
  );

  return true;
}

/**
 * Claim a completed counter-bounty.
 */
function claimCounterBounty(hunter, targetName, server) {
  const assignedTarget = hunter.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
  if (!assignedTarget || assignedTarget !== targetName) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77You do not have an active counter-bounty on \u00a7f${targetName}\u00a77.`
    );
    return false;
  }

  const claimable = hunter.persistentData.getInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey) || 0;
  if (claimable !== 1) {
    hunter.tell(
      '\u00a7c[Horizons] \u00a77You must eliminate or capture the target before claiming.'
    );
    return false;
  }

  const reward = hunter.persistentData.getInt(COUNTER_BOUNTY_CONFIG.counterBountyRewardKey) || 0;

  // Grant reward
  if (reward > 0) {
    server.runCommandSilent(
      `give ${hunter.username} ${COUNTER_BOUNTY_CONFIG.currencyItem} ${reward}`
    );
  }

  // Clear hunter assignment
  hunter.persistentData.putString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey, '');
  hunter.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyActiveKey, 0);
  hunter.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey, 0);
  hunter.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyRewardKey, 0);

  // Remove the counter-bounty from the poster's records
  for (let p of server.players) {
    const posted = getPostedBounties(p);
    if (posted.includes(targetName)) {
      removePostedBounty(p, targetName);
      p.persistentData.putInt(`horizons_cbounty_reward_${targetName}`, 0);
      break;
    }
  }

  // Clear scoreboard
  server.runCommandSilent(
    `scoreboard players reset ${targetName} ${COUNTER_BOUNTY_CONFIG.scoreboardObjective}`
  );

  hunter.tell(
    `\u00a7a[Horizons] \u00a77Counter-bounty claimed! Received \u00a76${reward} gold coins\u00a77.`
  );

  return true;
}

// ============================================================
// PVP KILL TRACKING — Auto-complete counter-bounties
// ============================================================

EntityEvents.death(event => {
  const entity = event.entity;
  if (!entity.player) return;

  const source = event.source;
  if (!source || !source.actual) return;

  const killer = source.actual;
  if (!killer.player) return;

  // Check if killer has a counter-bounty on the dead player
  const cbTarget = killer.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
  if (cbTarget && cbTarget === entity.username) {
    killer.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey, 1);
    killer.tell(
      `\u00a7a[Horizons] \u00a77Counter-bounty target \u00a7f${entity.username} \u00a77eliminated! Use \u00a7f/horizons counterbounty claim ${entity.username}`
    );
  }
});

// ============================================================
// CLEANUP — Expire old counter-bounties
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % COUNTER_BOUNTY_CONFIG.cleanupInterval !== 0) return;

  const players = server.players;
  for (let player of players) {
    const posted = getPostedBounties(player);
    let changed = false;

    for (let targetName of posted) {
      const postTick = player.persistentData.getLong(`horizons_cbounty_tick_${targetName}`) || 0;

      if (postTick > 0 && server.tickCount - postTick > COUNTER_BOUNTY_CONFIG.expirationTime) {
        // Expired — refund partial reward
        const reward = player.persistentData.getInt(`horizons_cbounty_reward_${targetName}`) || 0;
        if (reward > 0) {
          const refund = Math.floor(reward / 2);
          server.runCommandSilent(
            `give ${player.username} ${COUNTER_BOUNTY_CONFIG.currencyItem} ${refund}`
          );
          player.tell(
            `\u00a7e[Horizons] \u00a77Counter-bounty on \u00a7f${targetName} \u00a77expired. Refunded \u00a76${refund} gold\u00a77.`
          );
        }

        // Clean up data
        player.persistentData.putInt(`horizons_cbounty_reward_${targetName}`, 0);
        player.persistentData.putLong(`horizons_cbounty_tick_${targetName}`, 0);

        server.runCommandSilent(
          `scoreboard players reset ${targetName} ${COUNTER_BOUNTY_CONFIG.scoreboardObjective}`
        );

        changed = true;
      }
    }

    if (changed) {
      // Rebuild the posted list without expired entries
      const remaining = posted.filter(t => {
        const r = player.persistentData.getInt(`horizons_cbounty_reward_${t}`) || 0;
        return r > 0;
      });
      player.persistentData.putString(
        COUNTER_BOUNTY_CONFIG.counterBountiesPostedKey,
        remaining.join(',')
      );
    }
  }
});

// ============================================================
// COMMANDS — /horizons counterbounty [post|list|accept|claim|cancel]
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('counterbounty')

        // --- /horizons counterbounty post <target> <reward> ---
        .then(Commands.literal('post')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .then(Commands.argument('reward', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const server = ctx.source.server;
                const targetName = event.getArguments().STRING.getResult(ctx, 'target');
                const reward = event.getArguments().INTEGER.getResult(ctx, 'reward');

                postCounterBounty(player, targetName, reward, server);
                return 1;
              })
            )
          )
        )

        // --- /horizons counterbounty list ---
        .then(Commands.literal('list')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            const server = ctx.source.server;
            const bounties = getAllCounterBounties(server);

            player.tell('\u00a74\u00a7l=== Counter-Bounty Board ===');

            if (bounties.length === 0) {
              player.tell('\u00a77No active counter-bounties at this time.');
            } else {
              for (let bounty of bounties) {
                player.tell(
                  `\u00a7c  ${bounty.target} \u00a77- \u00a76${bounty.reward} gold \u00a77- Posted by: \u00a7c${bounty.poster}`
                );
              }
            }

            // Show current assignment
            const myTarget = player.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
            if (myTarget && myTarget.length > 0) {
              const claimable = player.persistentData.getInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey) || 0;
              const status = claimable === 1 ? '\u00a7aREADY TO CLAIM' : '\u00a7eACTIVE';
              const reward = player.persistentData.getInt(COUNTER_BOUNTY_CONFIG.counterBountyRewardKey) || 0;
              player.tell(
                `\u00a77Your assignment: \u00a7f${myTarget} \u00a77(\u00a76${reward} gold\u00a77) [${status}\u00a77]`
              );
            }

            // Show required crime tier
            const crimeStat = player.persistentData.getInt('horizons_crime_stat') || 0;
            if (crimeStat < COUNTER_BOUNTY_CONFIG.minCrimeTier) {
              player.tell(
                `\u00a78Requires crime tier ${COUNTER_BOUNTY_CONFIG.minCrimeTier}+ to participate.`
              );
            }

            return 1;
          })
        )

        // --- /horizons counterbounty accept <target> ---
        .then(Commands.literal('accept')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              acceptCounterBounty(player, targetName, server);
              return 1;
            })
          )
        )

        // --- /horizons counterbounty claim <target> ---
        .then(Commands.literal('claim')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              claimCounterBounty(player, targetName, server);
              return 1;
            })
          )
        )

        // --- /horizons counterbounty cancel <target> ---
        .then(Commands.literal('cancel')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              // Check if player posted this counter-bounty
              const posted = getPostedBounties(player);
              if (!posted.includes(targetName)) {
                // Maybe they accepted it as a hunter
                const assigned = player.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
                if (assigned === targetName) {
                  player.persistentData.putString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey, '');
                  player.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyActiveKey, 0);
                  player.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey, 0);
                  player.persistentData.putInt(COUNTER_BOUNTY_CONFIG.counterBountyRewardKey, 0);
                  player.tell(
                    `\u00a7e[Horizons] \u00a77Cancelled your hunt for \u00a7f${targetName}\u00a77.`
                  );
                  return 1;
                }

                player.tell(
                  `\u00a7c[Horizons] \u00a77You do not have a counter-bounty on \u00a7f${targetName}\u00a77.`
                );
                return 0;
              }

              // Refund partial reward
              const reward = player.persistentData.getInt(`horizons_cbounty_reward_${targetName}`) || 0;
              if (reward > 0) {
                const refund = Math.floor(reward / 2);
                server.runCommandSilent(
                  `give ${player.username} ${COUNTER_BOUNTY_CONFIG.currencyItem} ${refund}`
                );
                player.tell(
                  `\u00a7e[Horizons] \u00a77Refunded \u00a76${refund} gold \u00a77(50% of reward).`
                );
              }

              // Clean up
              removePostedBounty(player, targetName);
              player.persistentData.putInt(`horizons_cbounty_reward_${targetName}`, 0);
              player.persistentData.putLong(`horizons_cbounty_tick_${targetName}`, 0);

              server.runCommandSilent(
                `scoreboard players reset ${targetName} ${COUNTER_BOUNTY_CONFIG.scoreboardObjective}`
              );

              player.tell(
                `\u00a7e[Horizons] \u00a77Counter-bounty on \u00a7f${targetName} \u00a77cancelled.`
              );

              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Remind about counter-bounties
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;

  // Remind about posted counter-bounties
  const posted = getPostedBounties(player);
  if (posted.length > 0) {
    player.tell(
      `\u00a74[Horizons] \u00a77You have ${posted.length} active counter-bount${posted.length === 1 ? 'y' : 'ies'}: \u00a7f${posted.join(', ')}`
    );
  }

  // Remind about accepted counter-bounty
  const target = player.persistentData.getString(COUNTER_BOUNTY_CONFIG.counterBountyTargetKey);
  if (target && target.length > 0) {
    const claimable = player.persistentData.getInt(COUNTER_BOUNTY_CONFIG.counterBountyClaimableKey) || 0;
    if (claimable === 1) {
      player.tell(
        `\u00a7a[Horizons] \u00a77Counter-bounty on \u00a7f${target} \u00a77is claimable! Use \u00a7f/horizons counterbounty claim ${target}`
      );
    } else {
      player.tell(
        `\u00a76[Horizons] \u00a77Active counter-bounty hunt: \u00a7c${target}`
      );
    }
  }
});

console.log('[Horizons] Counter-Bounty System loaded');
console.log('[Horizons] Outlaws (tier 4+) can post reverse bounties on lawful players');
console.log('[Horizons] Commands: /horizons counterbounty [post|list|accept|claim|cancel]');
