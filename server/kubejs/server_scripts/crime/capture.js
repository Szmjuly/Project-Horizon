// ============================================================
// Project Horizons — Capture System
// ============================================================
// File: kubejs/server_scripts/crime/capture.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Three capture methods for bounty hunters to apprehend criminals:
//
//   1. PvP Kill — Target dies to bounty hunter
//      Auto-capture, crime stat -2
//
//   2. Cobblemon Duel — Hunter challenges target
//      Winner captures loser, crime stat -1 (gentler)
//
//   3. Stealth Capture — Hunter uses Capture Net item
//      Within 3 blocks of target below 5 hearts
//      Instant capture, crime stat -3
//
// On capture:
//   - Target teleported to jail
//   - Hunter gets bounty reward via bounty_board.js
//
// Commands:
//   /horizons capture attempt <target> — initiate capture
// ============================================================

// --- Capture Configuration ---
const CAPTURE_CONFIG = {
  // NBT keys
  hunterTargetKey: 'horizons_bounty_target',
  bountyClaimableKey: 'horizons_bounty_claimable',
  capturedByKey: 'horizons_captured_by',
  captureMethodKey: 'horizons_capture_method',
  lastCaptureAttemptKey: 'horizons_last_capture_attempt',
  duelPendingKey: 'horizons_duel_pending',
  duelChallengerKey: 'horizons_duel_challenger',

  // Stealth capture requirements
  stealthMaxDistance: 3,
  stealthMaxHealth: 10.0, // 5 hearts = 10 health points
  stealthStage: 'has_capture_net',

  // Cooldown between capture attempts (ticks)
  attemptCooldown: 200,

  // Crime stat reductions per method
  crimeReductions: {
    pvp_kill: 2,
    cobblemon_duel: 1,
    stealth_capture: 3
  },

  // Capture method names
  methodNames: {
    pvp_kill: 'PvP Elimination',
    cobblemon_duel: 'Cobblemon Duel',
    stealth_capture: 'Stealth Capture'
  }
};

// ============================================================
// UTILITY — Capture Processing
// ============================================================

/**
 * Process a successful capture.
 * Handles crime stat reduction, jail send, and bounty marking.
 */
function processCapture(hunter, target, method, server) {
  const methodName = CAPTURE_CONFIG.methodNames[method] || method;
  const crimeReduction = CAPTURE_CONFIG.crimeReductions[method] || 1;

  // Record capture details on target
  target.persistentData.putString(CAPTURE_CONFIG.capturedByKey, hunter.username);
  target.persistentData.putString(CAPTURE_CONFIG.captureMethodKey, method);

  // Reduce target's crime stat
  server.runCommandSilent(
    `execute as ${target.username} run horizons reward crimestat ${-crimeReduction}`
  );

  // Send target to jail via jail.js command
  server.runCommandSilent(
    `horizons jail send ${target.username}`
  );

  // Mark bounty as claimable for the hunter
  hunter.persistentData.putInt(CAPTURE_CONFIG.bountyClaimableKey, 1);

  // Notify hunter
  hunter.tell(
    `\u00a7a[Horizons] \u00a77Target \u00a7f${target.username} \u00a77captured via \u00a7e${methodName}\u00a77!`
  );
  hunter.tell(
    `\u00a77Use \u00a7f/horizons bounty claim ${target.username} \u00a77to collect your reward.`
  );

  // Notify target
  target.tell(
    `\u00a7c[Horizons] \u00a77You have been captured by \u00a7f${hunter.username} \u00a77via \u00a7e${methodName}\u00a77.`
  );
  target.tell(
    `\u00a77Crime stat reduced by \u00a7a${crimeReduction}\u00a77. You are being sent to jail.`
  );

  // Broadcast capture
  for (let p of server.players) {
    if (p.uuid.toString() !== hunter.uuid.toString() && p.uuid.toString() !== target.uuid.toString()) {
      p.tell(
        `\u00a76[Horizons] \u00a7f${target.username} \u00a77has been captured by bounty hunter \u00a7f${hunter.username}\u00a77!`
      );
    }
  }
}

/**
 * Check if a player is a valid bounty hunter targeting a specific player.
 */
function isHunterOf(hunter, targetName) {
  const assignedTarget = hunter.persistentData.getString(CAPTURE_CONFIG.hunterTargetKey);
  return assignedTarget && assignedTarget === targetName;
}

// ============================================================
// PVP KILL CAPTURE — Auto-detect when hunter kills target
// ============================================================

PlayerEvents.respawned(event => {
  const target = event.player;
  const server = target.server;

  // Check if this player was killed by a bounty hunter
  // We need to check the last damage source — this is checked
  // via the capturedBy data set by the hurt event tracking below
  const killerName = target.persistentData.getString('horizons_last_pvp_killer');
  if (!killerName || killerName.length === 0) return;

  // Clear the killer tracking
  target.persistentData.putString('horizons_last_pvp_killer', '');

  // Find the killer player
  const killer = server.getPlayer(killerName);
  if (!killer) return;

  // Check if killer is a bounty hunter targeting this player
  if (isHunterOf(killer, target.username)) {
    processCapture(killer, target, 'pvp_kill', server);
  }
});

/**
 * Track PvP kills to identify bounty hunter eliminations.
 * EntityEvents.death captures the killing blow.
 */
EntityEvents.death(event => {
  const entity = event.entity;
  if (!entity.player) return;

  const source = event.source;
  if (!source || !source.actual) return;

  const killer = source.actual;
  if (!killer.player) return;

  // Store killer name on the dying player for respawn processing
  entity.persistentData.putString('horizons_last_pvp_killer', killer.username);
});

// ============================================================
// COBBLEMON DUEL CAPTURE — Challenge and result tracking
// ============================================================

/**
 * Initiate a Cobblemon duel challenge for capture.
 * This sets up the tracking; the actual duel is handled by Cobblemon.
 */
function initiateDuelCapture(hunter, target, server) {
  // Mark duel pending on both players
  target.persistentData.putInt(CAPTURE_CONFIG.duelPendingKey, 1);
  target.persistentData.putString(CAPTURE_CONFIG.duelChallengerKey, hunter.username);

  hunter.persistentData.putInt(CAPTURE_CONFIG.duelPendingKey, 1);
  hunter.persistentData.putString(CAPTURE_CONFIG.duelChallengerKey, target.username);

  // Notify both players
  hunter.tell(
    `\u00a7e[Horizons] \u00a77Cobblemon duel challenge sent to \u00a7f${target.username}\u00a77!`
  );
  hunter.tell(
    '\u00a77If you win the battle, the target will be captured.'
  );

  target.tell(
    `\u00a7c[Horizons] \u00a77Bounty hunter \u00a7f${hunter.username} \u00a77challenges you to a Cobblemon duel!`
  );
  target.tell(
    '\u00a77If you lose, you will be captured. If you win, the bounty is cancelled.'
  );

  // Trigger the Cobblemon battle via command
  server.runCommandSilent(
    `cobblemon battle challenge ${hunter.username} ${target.username}`
  );
}

// ============================================================
// STEALTH CAPTURE — Capture Net within range of weakened target
// ============================================================

/**
 * Attempt a stealth capture on a target.
 * Requires: has_capture_net stage, within 3 blocks, target below 5 hearts.
 */
function attemptStealthCapture(hunter, target, server) {
  // Check capture net
  if (!hunter.stages.has(CAPTURE_CONFIG.stealthStage)) {
    hunter.tell(
      '\u00a7c[Horizons] \u00a77You need a Capture Net to perform a stealth capture.'
    );
    return false;
  }

  // Check distance
  const hunterPos = hunter.blockPosition();
  const targetPos = target.blockPosition();
  const dx = hunterPos.x - targetPos.x;
  const dy = hunterPos.y - targetPos.y;
  const dz = hunterPos.z - targetPos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist > CAPTURE_CONFIG.stealthMaxDistance) {
    hunter.tell(
      `\u00a7c[Horizons] \u00a77Target is too far away (${Math.round(dist)} blocks). Must be within ${CAPTURE_CONFIG.stealthMaxDistance} blocks.`
    );
    return false;
  }

  // Check target health
  const targetHealth = target.health;
  if (targetHealth > CAPTURE_CONFIG.stealthMaxHealth) {
    const hearts = Math.ceil(targetHealth / 2);
    hunter.tell(
      `\u00a7c[Horizons] \u00a77Target has too much health (${hearts} hearts). Must be below 5 hearts.`
    );
    return false;
  }

  // Stealth capture successful!
  hunter.tell(
    '\u00a7a[Horizons] \u00a77Stealth capture successful! The Capture Net ensnares the target.'
  );

  // Play capture effects
  server.runCommandSilent(
    `playsound minecraft:entity.evoker.cast_spell hostile ${target.username}`
  );
  server.runCommandSilent(
    `particle minecraft:enchant ${targetPos.x} ${targetPos.y + 1} ${targetPos.z} 1 1 1 0.5 50`
  );

  processCapture(hunter, target, 'stealth_capture', server);
  return true;
}

// ============================================================
// COMMAND — /horizons capture attempt <target>
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('capture')
        .then(Commands.literal('attempt')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const hunter = ctx.source.player;
              if (!hunter) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              // Verify hunter has this bounty
              if (!isHunterOf(hunter, targetName)) {
                hunter.tell(
                  `\u00a7c[Horizons] \u00a77You do not have an active bounty on \u00a7f${targetName}\u00a77.`
                );
                return 0;
              }

              // Cooldown check
              const lastAttempt = hunter.persistentData.getLong(CAPTURE_CONFIG.lastCaptureAttemptKey) || 0;
              if (server.tickCount - lastAttempt < CAPTURE_CONFIG.attemptCooldown) {
                hunter.tell(
                  '\u00a7c[Horizons] \u00a77Capture attempt on cooldown. Wait a moment.'
                );
                return 0;
              }

              // Find target
              const target = server.getPlayer(targetName);
              if (!target) {
                hunter.tell(
                  '\u00a7c[Horizons] \u00a77Target player is not online.'
                );
                return 0;
              }

              // Check same dimension
              if (hunter.level.dimension().toString() !== target.level.dimension().toString()) {
                hunter.tell(
                  '\u00a7c[Horizons] \u00a77Target is in a different dimension.'
                );
                return 0;
              }

              // Record attempt timestamp
              hunter.persistentData.putLong(CAPTURE_CONFIG.lastCaptureAttemptKey, server.tickCount);

              // Determine capture method based on conditions
              // Priority: Stealth (if conditions met) > Duel challenge

              // Try stealth capture first
              if (hunter.stages.has(CAPTURE_CONFIG.stealthStage)) {
                const hunterPos = hunter.blockPosition();
                const targetPos = target.blockPosition();
                const dx = hunterPos.x - targetPos.x;
                const dy = hunterPos.y - targetPos.y;
                const dz = hunterPos.z - targetPos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist <= CAPTURE_CONFIG.stealthMaxDistance && target.health <= CAPTURE_CONFIG.stealthMaxHealth) {
                  attemptStealthCapture(hunter, target, server);
                  return 1;
                }
              }

              // Fall back to duel challenge
              hunter.tell(
                '\u00a7e[Horizons] \u00a77Capture Methods:'
              );
              hunter.tell(
                '\u00a77  \u00a7f1. PvP Kill \u00a77- Eliminate the target in combat (crime stat -2)'
              );
              hunter.tell(
                '\u00a77  \u00a7f2. Cobblemon Duel \u00a77- Challenge to a Cobblemon battle (crime stat -1)'
              );

              if (hunter.stages.has(CAPTURE_CONFIG.stealthStage)) {
                hunter.tell(
                  '\u00a77  \u00a7f3. Stealth Capture \u00a77- Get within 3 blocks when target is below 5 hearts (crime stat -3)'
                );
              } else {
                hunter.tell(
                  '\u00a78  3. Stealth Capture - Requires Capture Net item'
                );
              }

              hunter.tell(
                '\u00a77Use \u00a7f/horizons capture duel ' + targetName + ' \u00a77to initiate a Cobblemon duel.'
              );

              return 1;
            })
          )
        )

        // --- /horizons capture duel <target> ---
        .then(Commands.literal('duel')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const hunter = ctx.source.player;
              if (!hunter) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              // Verify hunter has this bounty
              if (!isHunterOf(hunter, targetName)) {
                hunter.tell(
                  `\u00a7c[Horizons] \u00a77You do not have an active bounty on \u00a7f${targetName}\u00a77.`
                );
                return 0;
              }

              const target = server.getPlayer(targetName);
              if (!target) {
                hunter.tell('\u00a7c[Horizons] \u00a77Target player is not online.');
                return 0;
              }

              // Check same dimension
              if (hunter.level.dimension().toString() !== target.level.dimension().toString()) {
                hunter.tell('\u00a7c[Horizons] \u00a77Target is in a different dimension.');
                return 0;
              }

              initiateDuelCapture(hunter, target, server);
              return 1;
            })
          )
        )

        // --- /horizons capture stealth <target> ---
        .then(Commands.literal('stealth')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const hunter = ctx.source.player;
              if (!hunter) return 0;

              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              if (!isHunterOf(hunter, targetName)) {
                hunter.tell(
                  `\u00a7c[Horizons] \u00a77You do not have an active bounty on \u00a7f${targetName}\u00a77.`
                );
                return 0;
              }

              const target = server.getPlayer(targetName);
              if (!target) {
                hunter.tell('\u00a7c[Horizons] \u00a77Target player is not online.');
                return 0;
              }

              attemptStealthCapture(hunter, target, server);
              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Clear stale duel data
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  // Clear any pending duel data from previous session
  if (data.getInt(CAPTURE_CONFIG.duelPendingKey) === 1) {
    data.putInt(CAPTURE_CONFIG.duelPendingKey, 0);
    data.putString(CAPTURE_CONFIG.duelChallengerKey, '');
  }
});

console.log('[Horizons] Capture System loaded');
console.log('[Horizons] Methods: PvP Kill, Cobblemon Duel, Stealth Capture');
console.log('[Horizons] Commands: /horizons capture [attempt|duel|stealth] <target>');
