// ============================================================
// Project Horizons — Caravan Routes
// ============================================================
// File: kubejs/server_scripts/trade/caravan_routes.js
// Phase: 4
// Dependencies: Create: Steam 'n' Rails (train logistics)
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Game layer on top of Create: Steam 'n' Rails train logistics.
// Defines 5 trade routes between kingdom pairs, tracks route
// activation and completion, grants rewards (currency + rep).
// Routes must be completed within 3 MC days.
//
// ROUTES:
//   Plains <-> Forest
//   Plains <-> Mountain
//   Forest <-> Coastal
//   Mountain <-> Skyborn
//   Coastal <-> Skyborn
//
// COMMANDS:
//   /horizons caravan start <route>
//   /horizons caravan complete <route>
//   /horizons caravan routes
//   /horizons caravan active
// ============================================================

// --- Configuration ---
const CARAVAN_CONFIG = {
  // persistentData keys
  keys: {
    activeRoute: 'horizons_caravan_active',
    routeStartTick: 'horizons_caravan_start_tick',
    routesCompleted: 'horizons_caravan_completed',
    totalDeliveries: 'horizons_caravan_total'
  },

  // Route time limit: 3 MC days = 72000 ticks
  routeTimeLimit: 72000,

  // Expiry check interval (every 5 minutes = 6000 ticks)
  expiryCheckInterval: 6000,

  // Route definitions
  routes: {
    plains_forest: {
      name: 'Plains-Forest Trade Route',
      from: 'plains',
      to: 'forest',
      color: '\u00a7e',
      distance: 2,
      requiredGoods: [
        { item: 'minecraft:wheat', count: 64, label: 'Wheat' },
        { item: 'minecraft:bread', count: 32, label: 'Bread' },
        { item: 'minecraft:oak_log', count: 32, label: 'Oak Logs' }
      ],
      reward: {
        currency: { plains: 15, forest: 15 },
        rep: { plains: 25, forest: 25 },
        prosperity: 3
      }
    },
    plains_mountain: {
      name: 'Plains-Mountain Trade Route',
      from: 'plains',
      to: 'mountain',
      color: '\u00a77',
      distance: 3,
      requiredGoods: [
        { item: 'minecraft:iron_ingot', count: 32, label: 'Iron Ingots' },
        { item: 'minecraft:coal', count: 64, label: 'Coal' },
        { item: 'minecraft:hay_block', count: 16, label: 'Hay Bales' }
      ],
      reward: {
        currency: { plains: 20, mountain: 20 },
        rep: { plains: 30, mountain: 30 },
        prosperity: 4
      }
    },
    forest_coastal: {
      name: 'Forest-Coastal Trade Route',
      from: 'forest',
      to: 'coastal',
      color: '\u00a7a',
      distance: 4,
      requiredGoods: [
        { item: 'minecraft:oak_planks', count: 64, label: 'Oak Planks' },
        { item: 'minecraft:cod', count: 48, label: 'Cod' },
        { item: 'minecraft:kelp', count: 32, label: 'Kelp' }
      ],
      reward: {
        currency: { forest: 25, coastal: 25 },
        rep: { forest: 35, coastal: 35 },
        prosperity: 5
      }
    },
    mountain_skyborn: {
      name: 'Mountain-Skyborn Trade Route',
      from: 'mountain',
      to: 'skyborn',
      color: '\u00a7d',
      distance: 5,
      requiredGoods: [
        { item: 'minecraft:diamond', count: 8, label: 'Diamonds' },
        { item: 'minecraft:gold_ingot', count: 32, label: 'Gold Ingots' },
        { item: 'minecraft:feather', count: 64, label: 'Feathers' }
      ],
      reward: {
        currency: { mountain: 35, skyborn: 35 },
        rep: { mountain: 45, skyborn: 45 },
        prosperity: 7
      }
    },
    coastal_skyborn: {
      name: 'Coastal-Skyborn Trade Route',
      from: 'coastal',
      to: 'skyborn',
      color: '\u00a7b',
      distance: 5,
      requiredGoods: [
        { item: 'minecraft:prismarine_shard', count: 32, label: 'Prismarine Shards' },
        { item: 'minecraft:nautilus_shell', count: 4, label: 'Nautilus Shells' },
        { item: 'minecraft:phantom_membrane', count: 16, label: 'Phantom Membranes' }
      ],
      reward: {
        currency: { coastal: 40, skyborn: 40 },
        rep: { coastal: 50, skyborn: 50 },
        prosperity: 8
      }
    }
  },

  // Kingdom display info
  kingdoms: {
    plains: { name: 'Plains', color: '\u00a7e', symbol: '\u265b' },
    forest: { name: 'Forest', color: '\u00a7a', symbol: '\u2618' },
    mountain: { name: 'Mountain', color: '\u00a77', symbol: '\u26cf' },
    coastal: { name: 'Coastal', color: '\u00a7b', symbol: '\u25cb' },
    skyborn: { name: 'Skyborn', color: '\u00a7d', symbol: '\u2727' }
  },

  debug: true
};

const ROUTE_IDS = Object.keys(CARAVAN_CONFIG.routes);

// --- Utility Functions ---

function caravanLog(message) {
  if (CARAVAN_CONFIG.debug) {
    console.log('[Horizons/Caravan] ' + message);
  }
}

/**
 * Get the active route ID for a player (or empty string).
 */
function getActiveRoute(player) {
  return player.persistentData.getString(CARAVAN_CONFIG.keys.activeRoute) || '';
}

/**
 * Get the completed routes as a JSON array of route IDs.
 */
function getCompletedRoutes(player) {
  let json = player.persistentData.getString(CARAVAN_CONFIG.keys.routesCompleted);
  if (!json || json.length === 0) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    return [];
  }
}

/**
 * Save completed routes.
 */
function saveCompletedRoutes(player, list) {
  player.persistentData.putString(CARAVAN_CONFIG.keys.routesCompleted, JSON.stringify(list));
}

/**
 * Check if the player has all required goods in inventory.
 * Returns { hasAll, missing } where missing lists shortfalls.
 */
function checkRequiredGoods(player, routeId) {
  let route = CARAVAN_CONFIG.routes[routeId];
  if (!route) return { hasAll: false, missing: [] };

  let missing = [];
  let inventory = player.inventory;

  for (let req of route.requiredGoods) {
    let found = 0;
    for (let slot = 0; slot < inventory.size; slot++) {
      let stack = inventory.getStackInSlot(slot);
      if (!stack.isEmpty() && stack.id === req.item) {
        found += stack.count;
      }
    }

    if (found < req.count) {
      missing.push({ label: req.label, item: req.item, have: found, need: req.count });
    }
  }

  return { hasAll: missing.length === 0, missing: missing };
}

/**
 * Remove required goods from player inventory.
 */
function consumeRequiredGoods(player, routeId) {
  let route = CARAVAN_CONFIG.routes[routeId];
  if (!route) return;

  let inventory = player.inventory;

  for (let req of route.requiredGoods) {
    let remaining = req.count;
    for (let slot = 0; slot < inventory.size && remaining > 0; slot++) {
      let stack = inventory.getStackInSlot(slot);
      if (!stack.isEmpty() && stack.id === req.item) {
        let toRemove = Math.min(remaining, stack.count);
        stack.shrink(toRemove);
        remaining -= toRemove;
      }
    }
  }
}

/**
 * Calculate remaining time for active route in ticks.
 */
function getRouteTimeRemaining(player) {
  let startTick = player.persistentData.getLong(CARAVAN_CONFIG.keys.routeStartTick) || 0;
  if (startTick <= 0) return 0;
  let elapsed = player.server.tickCount - startTick;
  return Math.max(0, CARAVAN_CONFIG.routeTimeLimit - elapsed);
}

// ============================================================
// ROUTE EXPIRY CHECK — Every 5 minutes
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % CARAVAN_CONFIG.expiryCheckInterval !== 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let activeId = getActiveRoute(player);
    if (!activeId || activeId.length === 0) return;

    let remaining = getRouteTimeRemaining(player);
    if (remaining <= 0) {
      let route = CARAVAN_CONFIG.routes[activeId];
      let routeName = route ? route.name : activeId;

      // Expire the route
      player.persistentData.putString(CARAVAN_CONFIG.keys.activeRoute, '');
      player.persistentData.putLong(CARAVAN_CONFIG.keys.routeStartTick, 0);

      // Remove quest stages
      if (player.stages.has('caravan_active')) {
        player.stages.remove('caravan_active');
      }
      if (player.stages.has('caravan_' + activeId)) {
        player.stages.remove('caravan_' + activeId);
      }

      player.tell('\u00a7c[Caravan] \u00a77Time expired! Route "' + routeName + '" has been cancelled.');
      player.tell('\u00a77You must complete routes within 3 MC days.');

      caravanLog(player.username + ' route expired: ' + activeId);
    } else if (remaining <= 12000) {
      // Warning at ~half a day remaining
      let minutesLeft = Math.ceil(remaining / 1200);
      player.tell('\u00a7e[Caravan] \u00a77Warning: ' + minutesLeft + ' minutes remaining on your caravan route!');
    }
  });
});

// ============================================================
// COMMANDS: /horizons caravan [start|complete|routes|active]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('caravan')

        // /horizons caravan routes — show all available routes
        .then(Commands.literal('routes')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let completed = getCompletedRoutes(player);
            let totalDeliveries = player.persistentData.getInt(CARAVAN_CONFIG.keys.totalDeliveries) || 0;

            player.tell('\u00a7e=== Caravan Trade Routes ===');
            player.tell('\u00a77Total deliveries: \u00a7f' + totalDeliveries);
            player.tell('');

            for (let routeId of ROUTE_IDS) {
              let route = CARAVAN_CONFIG.routes[routeId];
              let fromK = CARAVAN_CONFIG.kingdoms[route.from];
              let toK = CARAVAN_CONFIG.kingdoms[route.to];
              let hasCompleted = completed.indexOf(routeId) >= 0;
              let completeMark = hasCompleted ? '\u00a7a\u2713' : '\u00a78\u2717';

              player.tell(completeMark + ' ' + route.color + route.name);
              player.tell('  \u00a77Route: ' + fromK.color + fromK.symbol + ' ' + fromK.name +
                ' \u00a77\u2194 ' + toK.color + toK.symbol + ' ' + toK.name);
              player.tell('  \u00a77Distance: \u00a7f' + route.distance + ' \u00a77| Time limit: \u00a7f3 MC days');

              // Required goods
              player.tell('  \u00a77Required goods:');
              for (let req of route.requiredGoods) {
                player.tell('    \u00a7f- ' + req.count + 'x ' + req.label);
              }

              // Rewards
              let rewardParts = [];
              for (let [curr, amount] of Object.entries(route.reward.currency)) {
                let kInfo = CARAVAN_CONFIG.kingdoms[curr];
                rewardParts.push(kInfo.color + amount + ' ' + kInfo.name);
              }
              player.tell('  \u00a77Rewards: ' + rewardParts.join('\u00a77, ') +
                ' \u00a77+ Prosperity +' + route.reward.prosperity);
              player.tell('');
            }

            player.tell('\u00a77Use /horizons caravan start <route_id> to begin.');
            player.tell('\u00a77Route IDs: ' + ROUTE_IDS.join(', '));

            return 1;
          })
        )

        // /horizons caravan start <route>
        .then(Commands.literal('start')
          .then(Commands.argument('route', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let id of ROUTE_IDS) {
                builder.suggest(id);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let routeId = event.getArguments().STRING.getResult(ctx, 'route').toLowerCase();
              let route = CARAVAN_CONFIG.routes[routeId];

              if (!route) {
                player.tell('\u00a7c[Caravan] Unknown route: ' + routeId);
                player.tell('\u00a77Available: ' + ROUTE_IDS.join(', '));
                return 0;
              }

              // Check if already on a route
              let currentRoute = getActiveRoute(player);
              if (currentRoute && currentRoute.length > 0) {
                let current = CARAVAN_CONFIG.routes[currentRoute];
                player.tell('\u00a7c[Caravan] Already on route: ' + (current ? current.name : currentRoute));
                player.tell('\u00a77Complete or wait for it to expire first.');
                return 0;
              }

              // Activate route
              player.persistentData.putString(CARAVAN_CONFIG.keys.activeRoute, routeId);
              player.persistentData.putLong(CARAVAN_CONFIG.keys.routeStartTick, player.server.tickCount);

              // Set tracking stages
              player.stages.add('caravan_active');
              player.stages.add('caravan_' + routeId);

              let fromK = CARAVAN_CONFIG.kingdoms[route.from];
              let toK = CARAVAN_CONFIG.kingdoms[route.to];

              player.tell('\u00a7e=== Caravan Route Started ===');
              player.tell(route.color + route.name);
              player.tell('\u00a77From: ' + fromK.color + fromK.symbol + ' ' + fromK.name);
              player.tell('\u00a77To: ' + toK.color + toK.symbol + ' ' + toK.name);
              player.tell('\u00a77Time limit: \u00a7f3 MC days');
              player.tell('');
              player.tell('\u00a77Required goods to deliver:');
              for (let req of route.requiredGoods) {
                player.tell('  \u00a7f- ' + req.count + 'x ' + req.label);
              }
              player.tell('');
              player.tell('\u00a77Use /horizons caravan complete ' + routeId + ' when ready.');

              player.server.runCommandSilent(
                'particle minecraft:firework ' +
                player.x + ' ' + (player.y + 1) + ' ' + player.z +
                ' 0.5 0.5 0.5 0.05 10'
              );

              caravanLog(player.username + ' started route: ' + routeId);
              return 1;
            })
          )
        )

        // /horizons caravan complete <route>
        .then(Commands.literal('complete')
          .then(Commands.argument('route', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let id of ROUTE_IDS) {
                builder.suggest(id);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let routeId = event.getArguments().STRING.getResult(ctx, 'route').toLowerCase();

              // Verify this is the active route
              let activeId = getActiveRoute(player);
              if (activeId !== routeId) {
                player.tell('\u00a7c[Caravan] Route "' + routeId + '" is not your active route.');
                if (activeId && activeId.length > 0) {
                  player.tell('\u00a77Your active route: ' + activeId);
                } else {
                  player.tell('\u00a77You have no active route. Start one with /horizons caravan start');
                }
                return 0;
              }

              let route = CARAVAN_CONFIG.routes[routeId];
              if (!route) return 0;

              // Check if player has all required goods
              let check = checkRequiredGoods(player, routeId);
              if (!check.hasAll) {
                player.tell('\u00a7c[Caravan] Missing goods for delivery:');
                for (let m of check.missing) {
                  player.tell('  \u00a7c- ' + m.label + ': have ' + m.have + '/' + m.need);
                }
                return 0;
              }

              // Consume goods
              consumeRequiredGoods(player, routeId);

              // Clear active route
              player.persistentData.putString(CARAVAN_CONFIG.keys.activeRoute, '');
              player.persistentData.putLong(CARAVAN_CONFIG.keys.routeStartTick, 0);

              // Remove stages
              if (player.stages.has('caravan_active')) {
                player.stages.remove('caravan_active');
              }
              if (player.stages.has('caravan_' + routeId)) {
                player.stages.remove('caravan_' + routeId);
              }

              // Track completion
              let completed = getCompletedRoutes(player);
              if (completed.indexOf(routeId) < 0) {
                completed.push(routeId);
                saveCompletedRoutes(player, completed);
              }

              let totalDeliveries = (player.persistentData.getInt(CARAVAN_CONFIG.keys.totalDeliveries) || 0) + 1;
              player.persistentData.putInt(CARAVAN_CONFIG.keys.totalDeliveries, totalDeliveries);

              // Grant rewards
              player.tell('\u00a7e=== Caravan Route Completed! ===');
              player.tell(route.color + route.name);
              player.tell('');

              // Currency rewards (via kingdom_currency.js pattern)
              for (let [currId, amount] of Object.entries(route.reward.currency)) {
                let currKey = 'horizons_currency_' + currId;
                let current = player.persistentData.getInt(currKey) || 0;
                player.persistentData.putInt(currKey, current + amount);
                let kInfo = CARAVAN_CONFIG.kingdoms[currId];
                player.tell('  ' + kInfo.color + '+' + amount + ' ' + kInfo.name + ' currency');
              }

              // Reputation rewards (via faction_reputation.js pattern)
              for (let [facId, amount] of Object.entries(route.reward.rep)) {
                let repKey = 'rep_' + facId;
                let currentRep = player.persistentData.getInt(repKey) || 0;
                let newRep = Math.min(1000, currentRep + amount);
                player.persistentData.putInt(repKey, newRep);
                let kInfo = CARAVAN_CONFIG.kingdoms[facId];
                player.tell('  ' + kInfo.color + '+' + amount + ' reputation with ' + kInfo.name);
              }

              // Prosperity boost
              let prosKey = 'horizons_village_prosperity';
              let currentPros = player.persistentData.getInt(prosKey) || 0;
              player.persistentData.putInt(prosKey, currentPros + route.reward.prosperity);
              player.tell('  \u00a7a+' + route.reward.prosperity + ' village prosperity');

              player.tell('');
              player.tell('\u00a77Total deliveries: \u00a7f' + totalDeliveries);

              // Celebration effects
              player.server.runCommandSilent(
                'particle minecraft:totem_of_undying ' +
                player.x + ' ' + (player.y + 1) + ' ' + player.z +
                ' 0.5 0.5 0.5 0.1 15'
              );
              player.server.runCommandSilent(
                'playsound minecraft:ui.toast.challenge_complete player ' + player.username
              );

              caravanLog(player.username + ' completed route: ' + routeId +
                ' (delivery #' + totalDeliveries + ')');
              return 1;
            })
          )
        )

        // /horizons caravan active — show current route progress
        .then(Commands.literal('active')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let activeId = getActiveRoute(player);
            if (!activeId || activeId.length === 0) {
              player.tell('\u00a77[Caravan] No active caravan route.');
              player.tell('\u00a77Use /horizons caravan start <route> to begin one.');
              return 1;
            }

            let route = CARAVAN_CONFIG.routes[activeId];
            if (!route) {
              player.tell('\u00a7c[Caravan] Error: active route data invalid.');
              return 0;
            }

            let remaining = getRouteTimeRemaining(player);
            let minutesLeft = Math.ceil(remaining / 1200);
            let fromK = CARAVAN_CONFIG.kingdoms[route.from];
            let toK = CARAVAN_CONFIG.kingdoms[route.to];

            let timeColor = '\u00a7a';
            if (minutesLeft < 30) timeColor = '\u00a7c';
            else if (minutesLeft < 60) timeColor = '\u00a7e';

            player.tell('\u00a7e=== Active Caravan Route ===');
            player.tell(route.color + route.name);
            player.tell('\u00a77Route: ' + fromK.color + fromK.name + ' \u00a77\u2192 ' + toK.color + toK.name);
            player.tell('\u00a77Time remaining: ' + timeColor + minutesLeft + ' minutes');
            player.tell('');

            // Show goods checklist
            player.tell('\u00a77Delivery goods:');
            let check = checkRequiredGoods(player, activeId);

            for (let req of route.requiredGoods) {
              let found = 0;
              let inventory = player.inventory;
              for (let slot = 0; slot < inventory.size; slot++) {
                let stack = inventory.getStackInSlot(slot);
                if (!stack.isEmpty() && stack.id === req.item) {
                  found += stack.count;
                }
              }

              let hasEnough = found >= req.count;
              let checkMark = hasEnough ? '\u00a7a\u2713' : '\u00a7c\u2717';
              let countColor = hasEnough ? '\u00a7a' : '\u00a7c';

              player.tell('  ' + checkMark + ' \u00a77' + req.label + ': ' +
                countColor + found + '/' + req.count);
            }

            if (check.hasAll) {
              player.tell('');
              player.tell('\u00a7a  All goods ready! Use /horizons caravan complete ' + activeId);
            }

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize caravan data
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(CARAVAN_CONFIG.keys.totalDeliveries)) {
    data.putInt(CARAVAN_CONFIG.keys.totalDeliveries, 0);
    data.putString(CARAVAN_CONFIG.keys.activeRoute, '');
    data.putString(CARAVAN_CONFIG.keys.routesCompleted, '[]');
    caravanLog('Initialized caravan data for ' + player.username);
  }

  // Restore active route stages
  let activeId = getActiveRoute(player);
  if (activeId && activeId.length > 0) {
    if (!player.stages.has('caravan_active')) player.stages.add('caravan_active');
    if (!player.stages.has('caravan_' + activeId)) player.stages.add('caravan_' + activeId);

    let route = CARAVAN_CONFIG.routes[activeId];
    if (route) {
      let remaining = getRouteTimeRemaining(player);
      let minutesLeft = Math.ceil(remaining / 1200);
      player.tell('\u00a7e[Caravan] \u00a77Active route: ' + route.color + route.name +
        ' \u00a77(' + minutesLeft + ' min remaining)');
    }
  }
});

console.log('[Horizons] Caravan Routes loaded');
console.log('[Horizons] Commands: /horizons caravan [start|complete|routes|active]');
console.log('[Horizons] Routes: ' + ROUTE_IDS.join(', '));
