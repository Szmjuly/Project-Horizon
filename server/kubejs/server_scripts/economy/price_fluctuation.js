// ============================================================
// Project Horizons — Price Fluctuation
// ============================================================
// File: kubejs/server_scripts/economy/price_fluctuation.js
// Phase: 5
// Dependencies: Lightman's
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Weekly kingdom economy shifts. Each kingdom currency's exchange
// rate fluctuates +/-20% randomly every 7 MC days. World events
// (festivals, crises, trade routes) modify rates further. Rare
// events like Gold Rush or Market Crash can dramatically shift
// a single currency. Price history tracked for 4 weeks.
//
// RATE STORAGE:
//   Rates stored in first online player's persistentData as a
//   shared economy reference (server-wide). Keyed by kingdom.
//
// COMMANDS:
//   /horizons prices          — Show current exchange rates
//   /horizons prices history  — Show 4-week trend
// ============================================================

// --- Configuration ---
const PRICE_CONFIG = {
  // persistentData keys (stored on server-wide reference)
  keys: {
    ratePrefix: 'horizons_price_rate_',
    historyPrefix: 'horizons_price_history_',
    lastUpdateTick: 'horizons_price_last_update',
    weekCounter: 'horizons_price_week',
    activeEvent: 'horizons_price_event',
    eventExpiry: 'horizons_price_event_expiry'
  },

  // Update interval: 7 MC days = 168000 ticks
  updateInterval: 168000,

  // Event check interval: every MC day (24000 ticks)
  eventCheckInterval: 24000,

  // Base exchange rates (from kingdom_currency.js)
  baseRates: {
    plains: 10,
    forest: 8,
    mountain: 12,
    coastal: 15,
    skyborn: 20
  },

  // Maximum fluctuation per week (+/-20%)
  maxFluctuation: 0.20,

  // Event definitions
  events: {
    festival: {
      name: 'Festival',
      color: '\u00a7a',
      description: 'Local festival boosts the economy',
      modifier: 0.10,
      chance: 0.15
    },
    crisis: {
      name: 'Crisis',
      color: '\u00a7c',
      description: 'Economic crisis drops prices',
      modifier: -0.15,
      chance: 0.10
    },
    trade_route: {
      name: 'Trade Route',
      color: '\u00a7e',
      description: 'Active trade stabilizes exchange rates',
      modifier: 0,
      stabilize: true,
      chance: 0.12
    },
    gold_rush: {
      name: 'Gold Rush',
      color: '\u00a76',
      description: 'One currency doubles in value!',
      modifier: 1.0,
      chance: 0.03
    },
    market_crash: {
      name: 'Market Crash',
      color: '\u00a74',
      description: 'One currency halves in value!',
      modifier: -0.50,
      chance: 0.03
    }
  },

  // Number of weeks of history to retain
  historyWeeks: 4,

  // Kingdom display info (matches kingdom_currency.js)
  kingdoms: {
    plains: { name: 'Plains', symbol: '\u265b', color: '\u00a7e', unit: 'Crown' },
    forest: { name: 'Forest', symbol: '\u2618', color: '\u00a7a', unit: 'Leaf' },
    mountain: { name: 'Mountain', symbol: '\u26cf', color: '\u00a77', unit: 'Mark' },
    coastal: { name: 'Coastal', symbol: '\u25cb', color: '\u00a7b', unit: 'Pearl' },
    skyborn: { name: 'Skyborn', symbol: '\u2727', color: '\u00a7d', unit: 'Feather' }
  },

  debug: true
};

const KINGDOM_IDS = Object.keys(PRICE_CONFIG.baseRates);

// --- Utility Functions ---

function priceLog(message) {
  if (PRICE_CONFIG.debug) {
    console.log('[Horizons/Price] ' + message);
  }
}

/**
 * Get the current exchange rate for a kingdom.
 * Rate is stored as a percentage of base (100 = normal, 120 = +20%).
 */
function getCurrentRate(player, kingdomId) {
  let stored = player.persistentData.getInt(PRICE_CONFIG.keys.ratePrefix + kingdomId);
  if (stored <= 0) return 100; // Default to base rate
  return stored;
}

/**
 * Set the exchange rate for a kingdom (as percentage of base).
 */
function setCurrentRate(player, kingdomId, ratePct) {
  let clamped = Math.max(25, Math.min(200, Math.floor(ratePct)));
  player.persistentData.putInt(PRICE_CONFIG.keys.ratePrefix + kingdomId, clamped);
}

/**
 * Get the effective gold rate for a kingdom (base * rate%).
 */
function getEffectiveRate(player, kingdomId) {
  let base = PRICE_CONFIG.baseRates[kingdomId] || 10;
  let pct = getCurrentRate(player, kingdomId);
  return Math.max(1, Math.floor(base * pct / 100));
}

/**
 * Get price history for a kingdom (JSON array of last 4 weeks' rates).
 */
function getPriceHistory(player, kingdomId) {
  let json = player.persistentData.getString(PRICE_CONFIG.keys.historyPrefix + kingdomId);
  if (!json || json.length === 0) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    return [];
  }
}

/**
 * Save price history for a kingdom.
 */
function savePriceHistory(player, kingdomId, history) {
  // Keep only last 4 weeks
  while (history.length > PRICE_CONFIG.historyWeeks) {
    history.shift();
  }
  player.persistentData.putString(PRICE_CONFIG.keys.historyPrefix + kingdomId, JSON.stringify(history));
}

/**
 * Get the current active event name, or empty string.
 */
function getActiveEvent(player) {
  return player.persistentData.getString(PRICE_CONFIG.keys.activeEvent) || '';
}

/**
 * Build a trend arrow based on rate change.
 */
function getTrendArrow(currentRate, previousRate) {
  if (!previousRate || previousRate === 0) return '\u00a77-';
  let diff = currentRate - previousRate;
  if (diff > 5) return '\u00a7a\u25b2'; // Up arrow
  if (diff < -5) return '\u00a7c\u25bc'; // Down arrow
  return '\u00a7e\u25ac'; // Stable dash
}

// ============================================================
// WEEKLY PRICE UPDATE — Every 168000 ticks (7 MC days)
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % PRICE_CONFIG.updateInterval !== 0) return;

  // Use the first online player as the economy data host
  let players = server.players;
  if (players.size() === 0) return;

  let refPlayer = null;
  players.forEach(p => { if (!refPlayer) refPlayer = p; });
  if (!refPlayer) return;

  let lastUpdate = refPlayer.persistentData.getLong(PRICE_CONFIG.keys.lastUpdateTick) || 0;

  // Prevent double-processing within same tick window
  if (lastUpdate > 0 && (server.tickCount - lastUpdate) < PRICE_CONFIG.updateInterval) return;

  let weekNum = (refPlayer.persistentData.getInt(PRICE_CONFIG.keys.weekCounter) || 0) + 1;
  refPlayer.persistentData.putInt(PRICE_CONFIG.keys.weekCounter, weekNum);
  refPlayer.persistentData.putLong(PRICE_CONFIG.keys.lastUpdateTick, server.tickCount);

  priceLog('Weekly price update — Week ' + weekNum);

  // Check for active event modifiers
  let activeEventKey = getActiveEvent(refPlayer);
  let activeEvent = PRICE_CONFIG.events[activeEventKey] || null;

  for (let kingdomId of KINGDOM_IDS) {
    let oldRate = getCurrentRate(refPlayer, kingdomId);

    // Save current rate to history before changing
    let history = getPriceHistory(refPlayer, kingdomId);
    history.push(oldRate);
    savePriceHistory(refPlayer, kingdomId, history);

    // Calculate new rate with random fluctuation
    let fluctuation = (Math.random() * 2 - 1) * PRICE_CONFIG.maxFluctuation;

    // Apply event modifier if active
    if (activeEvent) {
      if (activeEvent.stabilize) {
        // Trade route: reduce fluctuation to +/-5%
        fluctuation = (Math.random() * 2 - 1) * 0.05;
      } else {
        fluctuation += activeEvent.modifier;
      }
    }

    let newRate = Math.floor(oldRate * (1 + fluctuation));
    newRate = Math.max(50, Math.min(200, newRate)); // Clamp 50%-200% of base
    setCurrentRate(refPlayer, kingdomId, newRate);

    let info = PRICE_CONFIG.kingdoms[kingdomId];
    priceLog('  ' + info.name + ': ' + oldRate + '% -> ' + newRate + '%');
  }

  // Clear expired event
  if (activeEventKey.length > 0) {
    refPlayer.persistentData.putString(PRICE_CONFIG.keys.activeEvent, '');
  }

  // Roll for new event
  let eventRoll = Math.random();
  let cumulativeChance = 0;
  let newEvent = null;
  let newEventKey = '';

  for (let [key, evt] of Object.entries(PRICE_CONFIG.events)) {
    cumulativeChance += evt.chance;
    if (eventRoll < cumulativeChance && !newEvent) {
      newEvent = evt;
      newEventKey = key;
    }
  }

  if (newEvent) {
    refPlayer.persistentData.putString(PRICE_CONFIG.keys.activeEvent, newEventKey);

    // For Gold Rush / Market Crash: apply immediately to a random kingdom
    if (newEventKey === 'gold_rush' || newEventKey === 'market_crash') {
      let targetIdx = Math.floor(Math.random() * KINGDOM_IDS.length);
      let targetKingdom = KINGDOM_IDS[targetIdx];
      let currentRate = getCurrentRate(refPlayer, targetKingdom);
      let newRate;

      if (newEventKey === 'gold_rush') {
        newRate = Math.min(200, currentRate * 2);
      } else {
        newRate = Math.max(50, Math.floor(currentRate / 2));
      }

      setCurrentRate(refPlayer, targetKingdom, newRate);
      let kInfo = PRICE_CONFIG.kingdoms[targetKingdom];

      // Broadcast to all players
      server.players.forEach(p => {
        p.tell(newEvent.color + '\u00a7l[Economy] ' + newEvent.name + '!');
        p.tell('\u00a77' + newEvent.description);
        p.tell('\u00a77Affected: ' + kInfo.color + kInfo.name + ' Kingdom');
        p.tell('\u00a77New rate: ' + newRate + '% of base');
      });

      priceLog('RARE EVENT: ' + newEventKey + ' on ' + targetKingdom + ' -> ' + newRate + '%');
    } else {
      // Broadcast normal event
      server.players.forEach(p => {
        p.tell(newEvent.color + '[Economy] ' + newEvent.name + ' this week!');
        p.tell('\u00a77' + newEvent.description);
      });

      priceLog('Event: ' + newEventKey);
    }
  }

  // Broadcast weekly update to all players
  server.players.forEach(p => {
    p.tell('\u00a7e[Economy] \u00a77Weekly exchange rates have been updated. Use /horizons prices to check.');
  });
});

// ============================================================
// COMMANDS: /horizons prices [history]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('prices')

        // /horizons prices — show current rates
        .executes(ctx => {
          let player = ctx.source.player;
          if (!player) return 0;

          // Find reference player for shared data
          let refPlayer = null;
          player.server.players.forEach(p => { if (!refPlayer) refPlayer = p; });
          if (!refPlayer) refPlayer = player;

          let weekNum = refPlayer.persistentData.getInt(PRICE_CONFIG.keys.weekCounter) || 0;
          let activeEventKey = getActiveEvent(refPlayer);
          let activeEvent = PRICE_CONFIG.events[activeEventKey] || null;

          player.tell('\u00a7e=== Kingdom Exchange Rates ===');
          player.tell('\u00a77Week ' + weekNum + ' | Rates vs baseline');

          if (activeEvent) {
            player.tell('\u00a77Active event: ' + activeEvent.color + activeEvent.name +
              ' \u00a77- ' + activeEvent.description);
          }

          player.tell('');

          for (let kingdomId of KINGDOM_IDS) {
            let info = PRICE_CONFIG.kingdoms[kingdomId];
            let baseRate = PRICE_CONFIG.baseRates[kingdomId];
            let currentPct = getCurrentRate(refPlayer, kingdomId);
            let effectiveRate = getEffectiveRate(refPlayer, kingdomId);
            let history = getPriceHistory(refPlayer, kingdomId);
            let prevRate = history.length > 0 ? history[history.length - 1] : 100;
            let trend = getTrendArrow(currentPct, prevRate);

            let diffPct = currentPct - 100;
            let diffColor = diffPct >= 0 ? '\u00a7a+' : '\u00a7c';

            player.tell(info.color + info.symbol + ' ' + info.name +
              ' \u00a77| 1 ' + info.unit + ' = \u00a76' + effectiveRate + 'g \u00a77' +
              '(' + diffColor + diffPct + '%\u00a77) ' + trend);
          }

          player.tell('');
          player.tell('\u00a77Base rate = 100% | Range: 50%-200%');
          player.tell('\u00a77Rates update every 7 MC days');

          return 1;
        })

        // /horizons prices history — show 4-week trend
        .then(Commands.literal('history')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let refPlayer = null;
            player.server.players.forEach(p => { if (!refPlayer) refPlayer = p; });
            if (!refPlayer) refPlayer = player;

            let weekNum = refPlayer.persistentData.getInt(PRICE_CONFIG.keys.weekCounter) || 0;

            player.tell('\u00a7e=== Price History (Last 4 Weeks) ===');
            player.tell('\u00a77Current week: ' + weekNum);
            player.tell('');

            for (let kingdomId of KINGDOM_IDS) {
              let info = PRICE_CONFIG.kingdoms[kingdomId];
              let currentPct = getCurrentRate(refPlayer, kingdomId);
              let history = getPriceHistory(refPlayer, kingdomId);

              player.tell(info.color + info.symbol + ' ' + info.name + ':');

              // Show historical weeks
              let startWeek = Math.max(1, weekNum - PRICE_CONFIG.historyWeeks + 1);
              let line = '  ';

              for (let w = 0; w < history.length; w++) {
                let rate = history[w];
                let weekLabel = 'W' + (startWeek + w);
                let rateColor = rate > 100 ? '\u00a7a' : (rate < 100 ? '\u00a7c' : '\u00a7f');
                line += '\u00a77' + weekLabel + ':' + rateColor + rate + '% ';
              }

              // Current week
              let nowColor = currentPct > 100 ? '\u00a7a' : (currentPct < 100 ? '\u00a7c' : '\u00a7f');
              line += '\u00a77Now:' + nowColor + currentPct + '%';

              player.tell(line);

              // Mini trend visualization
              let trendLine = '  \u00a77Trend: ';
              let allRates = history.slice();
              allRates.push(currentPct);

              for (let r = 1; r < allRates.length; r++) {
                let diff = allRates[r] - allRates[r - 1];
                if (diff > 5) trendLine += '\u00a7a\u25b2';
                else if (diff < -5) trendLine += '\u00a7c\u25bc';
                else trendLine += '\u00a7e\u25ac';
              }

              if (allRates.length <= 1) trendLine += '\u00a78No history yet';

              player.tell(trendLine);
            }

            player.tell('');
            player.tell('\u00a77\u25b2 = up | \u25bc = down | \u25ac = stable');
            player.tell('\u00a77Rates fluctuate \u00b120% weekly, events may amplify changes');

            return 1;
          })
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize price data if first player
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  // Initialize rates if not yet set (first player to initialize becomes reference)
  let hasRates = data.getInt(PRICE_CONFIG.keys.ratePrefix + 'plains');
  if (hasRates <= 0) {
    for (let kingdomId of KINGDOM_IDS) {
      data.putInt(PRICE_CONFIG.keys.ratePrefix + kingdomId, 100);
      data.putString(PRICE_CONFIG.keys.historyPrefix + kingdomId, '[]');
    }
    data.putInt(PRICE_CONFIG.keys.weekCounter, 0);
    data.putString(PRICE_CONFIG.keys.activeEvent, '');
    priceLog('Initialized price data for ' + player.username);
  }
});

console.log('[Horizons] Price Fluctuation loaded');
console.log('[Horizons] Commands: /horizons prices [history]');
console.log('[Horizons] Kingdoms: ' + KINGDOM_IDS.join(', '));
console.log('[Horizons] Update interval: 7 MC days (168000 ticks)');
