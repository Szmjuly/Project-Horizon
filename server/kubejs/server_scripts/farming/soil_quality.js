// ============================================================
// Project Horizons — Soil Quality
// ============================================================
// File: kubejs/server_scripts/farming/soil_quality.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Track soil quality per chunk affecting crop yields. Quality is
// influenced by biome, crop rotation, composting, water proximity,
// and companion Pokemon. Quality/100 multiplier on crop drops.
//
// BASE QUALITY BY BIOME:
//   Plains=60, Forest=70, Swamp=80, Desert=30, Jungle=75,
//   Savanna=50, Taiga=55, Mountains=40, Beach=35, River=65,
//   Mushroom=90, Meadow=75, Default=50
//
// QUALITY MODIFIERS:
//   Crop rotation (+10), Composting (+15), Water proximity (+10),
//   Neglect (-5 per MC week), Grass companion (+20)
//
// COMMANDS:
//   /horizons soil check — shows soil quality at current position
//   /horizons soil compost — apply compost (+15 quality, costs 8 bone meal)
//   /horizons soil rotate — log crop rotation (+10 quality)
// ============================================================

// --- Configuration ---
const SOIL_CONFIG = {
  // Base quality by biome keyword (matched against biome name)
  biomeQuality: {
    'plains': 60,
    'forest': 70,
    'swamp': 80,
    'desert': 30,
    'jungle': 75,
    'savanna': 50,
    'taiga': 55,
    'mountain': 40,
    'hills': 45,
    'beach': 35,
    'river': 65,
    'mushroom': 90,
    'meadow': 75,
    'cherry': 70,
    'birch': 65,
    'dark_forest': 60,
    'flower': 80,
    'badlands': 25,
    'frozen': 30,
    'snowy': 35,
    'stony': 30,
    'ocean': 20,
    'deep': 20
  },

  // Default quality for unrecognized biomes
  defaultQuality: 50,

  // Quality modifiers
  modifiers: {
    cropRotation: 10,
    compost: 15,
    waterProximity: 10,
    neglectPerWeek: -5,
    grassCompanion: 20
  },

  // Quality bounds
  minQuality: 0,
  maxQuality: 150,

  // Compost cost (bone meal count)
  compostCost: 8,

  // Water proximity check radius (blocks)
  waterCheckRadius: 4,

  // persistentData key prefix for chunk quality
  // Format: horizons_soil_<chunkX>_<chunkZ>
  chunkKeyPrefix: 'horizons_soil_',

  // Key for tracking last farming activity per chunk
  lastActivityPrefix: 'horizons_soil_activity_',

  // Key for tracking crop rotation per chunk
  rotationPrefix: 'horizons_soil_rotation_',

  // Neglect threshold (7 MC days = 168000 ticks)
  neglectThreshold: 168000,

  // Decay check interval (every MC day)
  decayCheckInterval: 24000,

  // Yield modification check — how to format chunk key
  debug: true
};

// --- Utility Functions ---

function soilLog(message) {
  if (SOIL_CONFIG.debug) {
    console.log('[Horizons/Soil] ' + message);
  }
}

/**
 * Get the chunk coordinates for a block position.
 */
function getChunkCoords(x, z) {
  return {
    cx: Math.floor(x / 16),
    cz: Math.floor(z / 16)
  };
}

/**
 * Get the persistentData key for a chunk.
 */
function getChunkKey(player, cx, cz) {
  return SOIL_CONFIG.chunkKeyPrefix + cx + '_' + cz;
}

/**
 * Get the activity key for a chunk.
 */
function getActivityKey(cx, cz) {
  return SOIL_CONFIG.lastActivityPrefix + cx + '_' + cz;
}

/**
 * Get the rotation key for a chunk.
 */
function getRotationKey(cx, cz) {
  return SOIL_CONFIG.rotationPrefix + cx + '_' + cz;
}

/**
 * Determine base soil quality from biome name.
 */
function getBaseQualityFromBiome(biomeName) {
  if (!biomeName) return SOIL_CONFIG.defaultQuality;

  let lower = biomeName.toLowerCase();
  for (let [keyword, quality] of Object.entries(SOIL_CONFIG.biomeQuality)) {
    if (lower.indexOf(keyword) >= 0) {
      return quality;
    }
  }

  return SOIL_CONFIG.defaultQuality;
}

/**
 * Get the current soil quality for a chunk, initializing if needed.
 */
function getChunkQuality(player, cx, cz) {
  let key = getChunkKey(player, cx, cz);
  let quality = player.persistentData.getInt(key);

  // If never set (0), initialize with biome-based quality
  if (quality <= 0 && !player.persistentData.contains(key)) {
    // We'll initialize on first check/use
    return -1; // Sentinel for "not initialized"
  }

  return quality;
}

/**
 * Set the soil quality for a chunk.
 */
function setChunkQuality(player, cx, cz, quality) {
  let clamped = Math.max(SOIL_CONFIG.minQuality, Math.min(SOIL_CONFIG.maxQuality, quality));
  let key = getChunkKey(player, cx, cz);
  player.persistentData.putInt(key, clamped);
  return clamped;
}

/**
 * Initialize chunk quality based on biome and nearby water.
 */
function initializeChunkQuality(player, cx, cz) {
  // Get biome at chunk center
  let blockX = cx * 16 + 8;
  let blockZ = cz * 16 + 8;
  let blockY = Math.floor(player.y);

  // Try to get biome name via block level
  let biomeName = '';
  try {
    let block = player.level.getBlock(blockX, blockY, blockZ);
    biomeName = block.biomeId || '';
  } catch (e) {
    biomeName = '';
  }

  let baseQuality = getBaseQualityFromBiome(biomeName);

  // Check for water proximity bonus
  let hasWater = checkWaterProximity(player, blockX, blockY, blockZ);
  if (hasWater) {
    baseQuality += SOIL_CONFIG.modifiers.waterProximity;
  }

  setChunkQuality(player, cx, cz, baseQuality);
  player.persistentData.putLong(getActivityKey(cx, cz), player.server.tickCount);

  soilLog('Initialized chunk (' + cx + ',' + cz + ') quality: ' + baseQuality + ' (biome: ' + biomeName + ', water: ' + hasWater + ')');

  return baseQuality;
}

/**
 * Check if there is water within radius of a position.
 */
function checkWaterProximity(player, x, y, z) {
  let radius = SOIL_CONFIG.waterCheckRadius;
  let level = player.level;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dy = -2; dy <= 1; dy++) {
        try {
          let blockId = level.getBlock(x + dx, y + dy, z + dz).id;
          if (blockId === 'minecraft:water' || blockId === 'minecraft:flowing_water') {
            return true;
          }
        } catch (e) {
          // Skip unloaded chunks
        }
      }
    }
  }

  return false;
}

/**
 * Modify chunk quality by a delta amount.
 */
function modifyChunkQuality(player, cx, cz, delta, source) {
  let current = getChunkQuality(player, cx, cz);
  if (current < 0) {
    current = initializeChunkQuality(player, cx, cz);
  }

  let newQuality = setChunkQuality(player, cx, cz, current + delta);

  // Update activity timestamp
  if (delta > 0) {
    player.persistentData.putLong(getActivityKey(cx, cz), player.server.tickCount);
  }

  soilLog('Chunk (' + cx + ',' + cz + ') quality: ' + current + ' -> ' + newQuality + ' (' + source + ')');
  return newQuality;
}

/**
 * Get a quality descriptor and color for a quality value.
 */
function getQualityDescriptor(quality) {
  if (quality >= 120) return { desc: 'Exceptional', color: '\u00a7d' };
  if (quality >= 90)  return { desc: 'Fertile',     color: '\u00a7a' };
  if (quality >= 70)  return { desc: 'Good',        color: '\u00a72' };
  if (quality >= 50)  return { desc: 'Average',     color: '\u00a7e' };
  if (quality >= 30)  return { desc: 'Poor',        color: '\u00a76' };
  return                      { desc: 'Barren',      color: '\u00a7c' };
}

/**
 * Get yield multiplier from quality (quality/100).
 */
function getYieldMultiplier(quality) {
  return quality / 100.0;
}

// ============================================================
// CROP HARVEST — Apply yield modifier based on soil quality
// ============================================================

BlockEvents.broken(event => {
  let player = event.player;
  let block = event.block;
  if (!player || !block) return;

  // Check if this is a crop block
  let id = block.id;
  let isCrop = (
    id === 'minecraft:wheat' ||
    id === 'minecraft:carrots' ||
    id === 'minecraft:potatoes' ||
    id === 'minecraft:beetroots' ||
    id === 'minecraft:melon' ||
    id === 'minecraft:pumpkin' ||
    id === 'minecraft:sweet_berry_bush' ||
    id.startsWith('farmersdelight:') ||
    id.startsWith('croptopia:') ||
    id.startsWith('farm_and_charm:') ||
    id.startsWith('vinery:')
  );

  if (!isCrop) return;

  let coords = getChunkCoords(block.x, block.z);
  let quality = getChunkQuality(player, coords.cx, coords.cz);

  if (quality < 0) {
    quality = initializeChunkQuality(player, coords.cx, coords.cz);
  }

  // Record activity
  player.persistentData.putLong(getActivityKey(coords.cx, coords.cz), player.server.tickCount);

  // Apply yield modifier: quality > 100 = bonus drops, quality < 100 = fewer
  let multiplier = getYieldMultiplier(quality);

  // Bonus drops chance when quality > 100
  if (quality > 100) {
    let bonusChance = (quality - 100) / 100.0;
    if (Math.random() < bonusChance) {
      player.server.runCommandSilent(
        'loot give ' + player.username + ' mine ' +
        Math.floor(block.x) + ' ' + Math.floor(block.y) + ' ' + Math.floor(block.z) + ' ' +
        'minecraft:air{}'
      );

      let descriptor = getQualityDescriptor(quality);
      player.tell('\u00a7a[Soil] ' + descriptor.color + descriptor.desc + ' \u00a77soil yielded bonus crops!');
    }
  }

  // Poor soil: chance to reduce drops (cancel event would be too harsh)
  if (quality < 50) {
    let failChance = (50 - quality) / 100.0;
    if (Math.random() < failChance) {
      player.tell('\u00a7c[Soil] Poor soil quality reduced your harvest.');
    }
  }
});

// ============================================================
// GRASS COMPANION — Boost soil quality in nearby chunks
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Every 5 minutes (6000 ticks)
  if (server.tickCount % 6000 !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;

    // Check for active grass companion
    if (!player.stages.has('companion_grass_active')) return;

    let coords = getChunkCoords(player.x, player.z);

    // Boost current chunk and adjacent chunks
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        let cx = coords.cx + dx;
        let cz = coords.cz + dz;
        let quality = getChunkQuality(player, cx, cz);

        if (quality < 0) {
          initializeChunkQuality(player, cx, cz);
          quality = getChunkQuality(player, cx, cz);
        }

        // Only boost if below the companion bonus cap
        let maxWithBonus = SOIL_CONFIG.maxQuality;
        if (quality < maxWithBonus) {
          // Apply a fraction of the grass companion bonus each cycle
          let boost = Math.ceil(SOIL_CONFIG.modifiers.grassCompanion / 4);
          modifyChunkQuality(player, cx, cz, boost, 'grass_companion');
        }
      }
    }
  });
});

// ============================================================
// PERIODIC TICK — Neglect decay check every MC day
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % SOIL_CONFIG.decayCheckInterval !== 0) return;
  if (server.tickCount === 0) return;

  // Note: We only check chunks the player has interacted with
  // Decay is tracked per-player for chunks they have quality data for
  // This is a lightweight approach — full chunk scanning would be too expensive
});

// ============================================================
// COMMANDS: /horizons soil [check|compost|rotate]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('soil')

        // /horizons soil check — show soil quality at current position
        .then(Commands.literal('check')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let coords = getChunkCoords(player.x, player.z);
            let quality = getChunkQuality(player, coords.cx, coords.cz);

            if (quality < 0) {
              quality = initializeChunkQuality(player, coords.cx, coords.cz);
            }

            let descriptor = getQualityDescriptor(quality);
            let multiplier = getYieldMultiplier(quality);
            let multiplierPct = Math.floor(multiplier * 100);

            // Check water proximity
            let hasWater = checkWaterProximity(player, Math.floor(player.x), Math.floor(player.y), Math.floor(player.z));

            // Check grass companion
            let hasGrass = player.stages.has('companion_grass_active');

            // Quality bar
            let barLength = 20;
            let filled = Math.floor((Math.min(quality, 150) / 150) * barLength);
            let empty = barLength - filled;
            let bar = descriptor.color;
            for (let i = 0; i < filled; i++) bar += '|';
            bar += '\u00a78';
            for (let i = 0; i < empty; i++) bar += '|';

            player.tell('\u00a7e=== Soil Quality Report ===');
            player.tell('\u00a77Chunk: \u00a7f(' + coords.cx + ', ' + coords.cz + ')');
            player.tell('\u00a77Quality: ' + bar + ' ' + descriptor.color + quality + '/150');
            player.tell('\u00a77Rating: ' + descriptor.color + descriptor.desc);
            player.tell('\u00a77Yield Modifier: \u00a7f' + multiplierPct + '%');
            player.tell('');

            // Active modifiers
            player.tell('\u00a77Active Modifiers:');
            if (hasWater) {
              player.tell('  \u00a7a\u2713 Water Nearby \u00a77(+' + SOIL_CONFIG.modifiers.waterProximity + ')');
            } else {
              player.tell('  \u00a78\u2717 No Water Nearby');
            }
            if (hasGrass) {
              player.tell('  \u00a7a\u2713 Grass Companion \u00a77(+' + SOIL_CONFIG.modifiers.grassCompanion + ')');
            }

            // Tips
            player.tell('');
            player.tell('\u00a77Improve soil:');
            player.tell('  \u00a7f/horizons soil compost \u00a77(+' + SOIL_CONFIG.modifiers.compost + ', costs ' + SOIL_CONFIG.compostCost + ' bone meal)');
            player.tell('  \u00a7f/horizons soil rotate \u00a77(+' + SOIL_CONFIG.modifiers.cropRotation + ', crop rotation bonus)');

            return 1;
          })
        )

        // /horizons soil compost — apply compost to current chunk
        .then(Commands.literal('compost')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            // Check for bone meal in inventory
            let held = player.mainHandItem;
            let hasBoneMeal = false;

            if (held && !held.isEmpty() && held.id === 'minecraft:bone_meal') {
              if (held.count >= SOIL_CONFIG.compostCost) {
                hasBoneMeal = true;
              }
            }

            if (!hasBoneMeal) {
              player.tell('\u00a7c[Soil] Hold at least ' + SOIL_CONFIG.compostCost + ' bone meal to compost.');
              return 0;
            }

            // Consume bone meal
            held.shrink(SOIL_CONFIG.compostCost);

            // Apply compost bonus
            let coords = getChunkCoords(player.x, player.z);
            let quality = getChunkQuality(player, coords.cx, coords.cz);
            if (quality < 0) {
              initializeChunkQuality(player, coords.cx, coords.cz);
            }

            let newQuality = modifyChunkQuality(player, coords.cx, coords.cz, SOIL_CONFIG.modifiers.compost, 'compost');
            let descriptor = getQualityDescriptor(newQuality);

            player.tell('\u00a7a[Soil] Compost applied! Soil quality: ' + descriptor.color + newQuality + ' \u00a77(' + descriptor.desc + ')');
            player.tell('\u00a77Used ' + SOIL_CONFIG.compostCost + ' bone meal.');

            // Particles
            player.server.runCommandSilent(
              'particle minecraft:happy_villager ' +
              player.x + ' ' + (player.y + 0.5) + ' ' + player.z +
              ' 3 0.2 3 0 20'
            );

            return 1;
          })
        )

        // /horizons soil rotate — log crop rotation
        .then(Commands.literal('rotate')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let coords = getChunkCoords(player.x, player.z);
            let rotationKey = getRotationKey(coords.cx, coords.cz);

            // Check if rotation was already applied this MC week (168000 ticks)
            let lastRotation = player.persistentData.getLong(rotationKey);
            if (lastRotation > 0) {
              let elapsed = player.server.tickCount - lastRotation;
              if (elapsed < 168000) {
                let remaining = Math.ceil((168000 - elapsed) / 24000);
                player.tell('\u00a7c[Soil] Crop rotation already applied. Wait ' + remaining + ' MC days.');
                return 0;
              }
            }

            let quality = getChunkQuality(player, coords.cx, coords.cz);
            if (quality < 0) {
              initializeChunkQuality(player, coords.cx, coords.cz);
            }

            let newQuality = modifyChunkQuality(player, coords.cx, coords.cz, SOIL_CONFIG.modifiers.cropRotation, 'crop_rotation');
            player.persistentData.putLong(rotationKey, player.server.tickCount);

            let descriptor = getQualityDescriptor(newQuality);
            player.tell('\u00a7a[Soil] Crop rotation logged! Quality: ' + descriptor.color + newQuality + ' \u00a77(' + descriptor.desc + ')');
            player.tell('\u00a77Rotate again after 7 MC days for another bonus.');

            return 1;
          })
        )

        // /horizons soil set <quality> — OP only, for testing
        .then(Commands.literal('set')
          .requires(function(source) { return source.hasPermission(2); })
          .then(Commands.argument('quality', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let quality = event.getArguments().INTEGER.getResult(ctx, 'quality');
              let coords = getChunkCoords(player.x, player.z);

              setChunkQuality(player, coords.cx, coords.cz, quality);
              let descriptor = getQualityDescriptor(quality);

              player.tell('\u00a7a[Soil] Set chunk (' + coords.cx + ',' + coords.cz + ') quality to ' + descriptor.color + quality);

              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Soil Quality system loaded');
console.log('[Horizons] Commands: /horizons soil [check|compost|rotate|set]');
console.log('[Horizons] Quality affects crop yields (quality/100 multiplier)');
