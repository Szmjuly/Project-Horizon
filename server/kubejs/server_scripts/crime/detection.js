// ============================================================
// Project Horizons — Crime Detection
// ============================================================
// File: kubejs/server_scripts/crime/detection.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// NPC "witness" detection system. Monitors player actions near
// villages and triggers crime stat increases when detected.
//
// Tracked crimes:
//   - Stealing from chests near village NPCs
//   - Attacking villagers
//   - Attacking guard villagers
//   - Trespassing in restricted (stage-gated) zones
//
// Detection chance is 80% base, reduced to 30% with Hood of Shadows.
// ============================================================

// --- Detection Configuration ---
const DETECTION_CONFIG = {
  // How often to run witness checks (ticks)
  witnessCheckInterval: 100,

  // Base detection chance (0.0 - 1.0)
  baseDetectionChance: 0.80,

  // Reduced detection chance with Hood of Shadows
  hoodDetectionChance: 0.30,

  // Stage that indicates Hood of Shadows is active
  hoodStage: 'crime_hood_active',

  // Radius (blocks) within which NPCs can witness crimes
  witnessRadius: 16,

  // Radius to broadcast warnings to nearby players
  broadcastRadius: 32,

  // Restricted zone definitions (stage-gated areas)
  // Players without the required stage are trespassing
  restrictedZones: [
    { name: 'Royal Quarter', x: 500, z: 500, radius: 50, requiredStage: 'access_royal_quarter' },
    { name: 'Guild Vault', x: -200, z: 300, radius: 20, requiredStage: 'access_guild_vault' },
    { name: 'Military Barracks', x: 800, z: -100, radius: 30, requiredStage: 'access_military' }
  ],

  // NBT keys
  lastCrimeTickKey: 'horizons_last_crime_tick',
  crimeCountKey: 'horizons_crime_count',
  trespassWarningKey: 'horizons_trespass_warned'
};

// --- Crime Types ---
const CRIME_TYPES = {
  THEFT: { name: 'Theft', statIncrease: 1, color: '\u00a7e' },
  ASSAULT_VILLAGER: { name: 'Assault on Citizen', statIncrease: 1, color: '\u00a7c' },
  ASSAULT_GUARD: { name: 'Assault on Guard', statIncrease: 2, color: '\u00a74' },
  TRESPASS: { name: 'Trespassing', statIncrease: 1, color: '\u00a76' }
};

// ============================================================
// UTILITY — Detection Roll
// ============================================================

/**
 * Roll for detection based on player's equipment/stages.
 * Returns true if the crime was witnessed.
 */
function rollDetection(player) {
  let chance = DETECTION_CONFIG.baseDetectionChance;

  // Hood of Shadows reduces detection
  if (player.stages.has(DETECTION_CONFIG.hoodStage)) {
    chance = DETECTION_CONFIG.hoodDetectionChance;
  }

  return Math.random() < chance;
}

/**
 * Check if any villager-type entities are within witness radius.
 */
function hasNearbyWitnesses(player) {
  const level = player.level;
  const pos = player.blockPosition();
  const entities = level.getEntitiesWithin(
    AABB.of(
      pos.x - DETECTION_CONFIG.witnessRadius,
      pos.y - DETECTION_CONFIG.witnessRadius,
      pos.z - DETECTION_CONFIG.witnessRadius,
      pos.x + DETECTION_CONFIG.witnessRadius,
      pos.y + DETECTION_CONFIG.witnessRadius,
      pos.z + DETECTION_CONFIG.witnessRadius
    )
  );

  for (let entity of entities) {
    const type = entity.type.toString();
    if (type.includes('villager') || type.includes('guard') || type.includes('npc')) {
      return true;
    }
  }
  return false;
}

/**
 * Process a detected crime: increment stat, broadcast warning.
 */
function processCrime(player, crimeType, server) {
  // Increment crime stat via reward_handlers command
  server.runCommandSilent(
    `horizons reward crimestat ${crimeType.statIncrease}`
  );

  // Track last crime tick for decay system
  player.persistentData.putLong(DETECTION_CONFIG.lastCrimeTickKey, server.tickCount);

  // Increment personal crime count
  const count = player.persistentData.getInt(DETECTION_CONFIG.crimeCountKey) || 0;
  player.persistentData.putInt(DETECTION_CONFIG.crimeCountKey, count + 1);

  // Notify the criminal
  player.tell(
    `${crimeType.color}[Horizons] \u00a7cCrime detected: \u00a7f${crimeType.name}! \u00a77A witness saw you.`
  );

  // Broadcast to nearby players
  broadcastCrimeWarning(player, crimeType, server);
}

/**
 * Broadcast a crime warning to players within range.
 */
function broadcastCrimeWarning(criminal, crimeType, server) {
  const players = server.players;
  const crimPos = criminal.blockPosition();

  for (let other of players) {
    if (other.uuid.toString() === criminal.uuid.toString()) continue;

    const otherPos = other.blockPosition();
    const dx = crimPos.x - otherPos.x;
    const dz = crimPos.z - otherPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= DETECTION_CONFIG.broadcastRadius && other.level.dimension() === criminal.level.dimension()) {
      other.tell(
        `\u00a76[Horizons] \u00a77A crime has been reported nearby: \u00a7f${crimeType.name} \u00a77by \u00a7c${criminal.username}`
      );
    }
  }
}

// ============================================================
// THEFT DETECTION — Chest interaction near villages
// ============================================================

BlockEvents.rightClicked(event => {
  const player = event.player;
  if (!player || player.isCreative()) return;

  const block = event.block;
  const blockId = block.id;

  // Check if the block is a chest-type container
  if (blockId !== 'minecraft:chest' &&
      blockId !== 'minecraft:trapped_chest' &&
      blockId !== 'minecraft:barrel') {
    return;
  }

  // Check if there are NPC witnesses nearby
  if (!hasNearbyWitnesses(player)) return;

  // Check if this chest is in a village area (near villagers = village)
  // The witness check already confirms NPCs are nearby
  if (rollDetection(player)) {
    processCrime(player, CRIME_TYPES.THEFT, player.server);
  }
});

// ============================================================
// ASSAULT DETECTION — Attacking villagers or guards
// ============================================================

EntityEvents.hurt(event => {
  const source = event.source;
  if (!source || !source.actual) return;

  const attacker = source.actual;
  if (!attacker.player || attacker.isCreative()) return;

  const target = event.entity;
  const targetType = target.type.toString();

  // Check if target is a villager
  if (targetType.includes('villager') || targetType.includes('wandering_trader')) {
    if (rollDetection(attacker)) {
      processCrime(attacker, CRIME_TYPES.ASSAULT_VILLAGER, attacker.server);
    }
    return;
  }

  // Check if target is a guard (custom NPC type)
  if (targetType.includes('guard') || targetType.includes('iron_golem')) {
    if (rollDetection(attacker)) {
      processCrime(attacker, CRIME_TYPES.ASSAULT_GUARD, attacker.server);
    }
    return;
  }
});

// ============================================================
// TRESPASS DETECTION — Stage-gated zone monitoring
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % DETECTION_CONFIG.witnessCheckInterval !== 0) return;

  const players = server.players;
  for (let player of players) {
    if (player.isCreative() || player.isSpectator()) continue;

    const pos = player.blockPosition();
    const dimKey = player.level.dimension().toString();

    // Only check overworld for now
    if (!dimKey.includes('overworld')) continue;

    for (let zone of DETECTION_CONFIG.restrictedZones) {
      const dx = pos.x - zone.x;
      const dz = pos.z - zone.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= zone.radius) {
        // Player is in a restricted zone
        if (!player.stages.has(zone.requiredStage)) {
          const warnKey = `${DETECTION_CONFIG.trespassWarningKey}_${zone.name}`;
          const lastWarn = player.persistentData.getLong(warnKey) || 0;

          // Only trigger trespass crime every 600 ticks (30 seconds) per zone
          if (server.tickCount - lastWarn > 600) {
            player.persistentData.putLong(warnKey, server.tickCount);

            player.tell(
              `\u00a76[Horizons] \u00a7cYou are trespassing in the ${zone.name}! \u00a77Leave immediately.`
            );

            if (rollDetection(player)) {
              processCrime(player, CRIME_TYPES.TRESPASS, server);
            }
          }
        }
      }
    }
  }
});

// ============================================================
// COMMAND — /horizons crime report <player>
// For NPC dialogue or manual reporting
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('crime')
        .then(Commands.literal('report')
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .requires(src => src.hasPermission(0))
            .executes(ctx => {
              const server = ctx.source.server;
              const targetName = event.getArguments().STRING.getResult(ctx, 'target');

              // Find target player
              const targetPlayer = server.getPlayer(targetName);
              if (!targetPlayer) {
                if (ctx.source.player) {
                  ctx.source.player.tell('\u00a7c[Horizons] Player not found.');
                }
                return 0;
              }

              // Increment crime stat by 1 via command bridge
              server.runCommandSilent(
                `execute as ${targetPlayer.username} run horizons reward crimestat 1`
              );

              // Notify the reported player
              targetPlayer.tell(
                '\u00a7c[Horizons] \u00a77A crime has been reported against you!'
              );

              // Notify the reporter
              if (ctx.source.player) {
                ctx.source.player.tell(
                  `\u00a7a[Horizons] \u00a77Crime reported against \u00a7f${targetPlayer.username}\u00a77.`
                );
              }

              // Broadcast to nearby players
              broadcastCrimeWarning(targetPlayer, { name: 'Reported Crime' }, server);

              return 1;
            })
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize detection data
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  if (!data.contains(DETECTION_CONFIG.crimeCountKey)) {
    data.putInt(DETECTION_CONFIG.crimeCountKey, 0);
  }
});

console.log('[Horizons] Crime Detection System loaded');
console.log('[Horizons] Tracking: theft, assault, guard assault, trespassing');
console.log('[Horizons] Commands: /horizons crime report <player>');
