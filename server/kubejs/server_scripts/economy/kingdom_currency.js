// ============================================================
// Project Horizons — Kingdom Currency
// ============================================================
// File: kubejs/server_scripts/economy/kingdom_currency.js
// Phase: 2
// Dependencies: Lightman's, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Manages 5 kingdom-specific currencies tracked per player via
// persistentData. Each kingdom has its own currency with a
// unique exchange rate to Lightman's gold coins (universal base).
// Provides commands for balance checking and currency exchange,
// plus grant/spend functions for use by other scripts.
//
// CURRENCIES:
//   Plains Crowns:   1 Crown   = 10 gold coins
//   Forest Leaves:   1 Leaf    =  8 gold coins
//   Mountain Marks:  1 Mark    = 12 gold coins
//   Coastal Pearls:  1 Pearl   = 15 gold coins
//   Skyborn Feathers: 1 Feather = 20 gold coins
//
// COMMANDS:
//   /horizons currency balance                       — Show all balances
//   /horizons currency exchange <from> <to> <amount> — Exchange currencies
//   /horizons currency grant <player> <type> <amount> — Admin grant (OP)
// ============================================================

// --- Configuration ---
const CURRENCY_CONFIG = {
  // persistentData key prefix
  keyPrefix: 'horizons_currency_',

  // Currency definitions: { id: { name, plural, symbol, color, goldRate } }
  currencies: {
    plains: {
      name: 'Crown',
      plural: 'Crowns',
      symbol: '\u265b',
      color: '\u00a7e',
      goldRate: 10
    },
    forest: {
      name: 'Leaf',
      plural: 'Leaves',
      symbol: '\u2618',
      color: '\u00a7a',
      goldRate: 8
    },
    mountain: {
      name: 'Mark',
      plural: 'Marks',
      symbol: '\u26cf',
      color: '\u00a77',
      goldRate: 12
    },
    coastal: {
      name: 'Pearl',
      plural: 'Pearls',
      symbol: '\u25cb',
      color: '\u00a7b',
      goldRate: 15
    },
    skyborn: {
      name: 'Feather',
      plural: 'Feathers',
      symbol: '\u2727',
      color: '\u00a7d',
      goldRate: 20
    }
  },

  // Lightman's gold coin item ID
  goldCoinItem: 'lightmanscurrency:coin_gold',

  // Debug logging
  debug: true
};

// --- Currency IDs list for iteration ---
const CURRENCY_IDS = Object.keys(CURRENCY_CONFIG.currencies);

// --- Utility Functions ---

function currencyLog(message) {
  if (CURRENCY_CONFIG.debug) {
    console.log('[Horizons/Currency] ' + message);
  }
}

/**
 * Get the persistentData key for a currency.
 */
function getCurrencyKey(currencyId) {
  return CURRENCY_CONFIG.keyPrefix + currencyId;
}

/**
 * Get a player's balance for a specific currency.
 */
function getBalance(player, currencyId) {
  if (!CURRENCY_CONFIG.currencies[currencyId]) return 0;
  return player.persistentData.getInt(getCurrencyKey(currencyId)) || 0;
}

/**
 * Set a player's balance for a specific currency.
 */
function setBalance(player, currencyId, amount) {
  if (!CURRENCY_CONFIG.currencies[currencyId]) return false;
  const clamped = Math.max(0, Math.floor(amount));
  player.persistentData.putInt(getCurrencyKey(currencyId), clamped);
  return true;
}

/**
 * Grant currency to a player. Returns the new balance.
 * Used by other scripts (reward_handlers, quest_completion, etc.)
 */
function grantCurrency(player, currencyId, amount) {
  if (!CURRENCY_CONFIG.currencies[currencyId]) {
    console.warn('[Horizons/Currency] Unknown currency: ' + currencyId);
    return -1;
  }
  if (amount <= 0) return getBalance(player, currencyId);

  const current = getBalance(player, currencyId);
  const newBalance = current + Math.floor(amount);
  setBalance(player, currencyId, newBalance);

  const info = CURRENCY_CONFIG.currencies[currencyId];
  const label = amount === 1 ? info.name : info.plural;
  player.tell(info.color + '[Horizons] +' + amount + ' ' + info.symbol + ' ' + label +
    ' \u00a77(Balance: ' + info.color + newBalance + '\u00a77)');

  currencyLog('Granted ' + amount + ' ' + currencyId + ' to ' + player.username + ' (new: ' + newBalance + ')');
  return newBalance;
}

/**
 * Spend (deduct) currency from a player. Returns true if successful, false if insufficient.
 * Used by other scripts (shops, upgrades, etc.)
 */
function spendCurrency(player, currencyId, amount) {
  if (!CURRENCY_CONFIG.currencies[currencyId]) {
    console.warn('[Horizons/Currency] Unknown currency: ' + currencyId);
    return false;
  }
  if (amount <= 0) return true;

  const current = getBalance(player, currencyId);
  if (current < amount) {
    const info = CURRENCY_CONFIG.currencies[currencyId];
    player.tell('\u00a7c[Horizons] Insufficient ' + info.plural + '! Need ' +
      amount + ' but have ' + current + '.');
    return false;
  }

  const newBalance = current - Math.floor(amount);
  setBalance(player, currencyId, newBalance);

  const info = CURRENCY_CONFIG.currencies[currencyId];
  const label = amount === 1 ? info.name : info.plural;
  player.tell(info.color + '[Horizons] -' + amount + ' ' + info.symbol + ' ' + label +
    ' \u00a77(Balance: ' + info.color + newBalance + '\u00a77)');

  currencyLog('Spent ' + amount + ' ' + currencyId + ' from ' + player.username + ' (new: ' + newBalance + ')');
  return true;
}

/**
 * Check if a player can afford a certain amount of currency.
 */
function canAfford(player, currencyId, amount) {
  return getBalance(player, currencyId) >= amount;
}

/**
 * Calculate the exchange amount between two currencies.
 * Exchange goes: source -> gold coins -> target
 * Returns the amount of target currency received (floored).
 */
function calculateExchange(fromId, toId, amount) {
  const fromInfo = CURRENCY_CONFIG.currencies[fromId];
  const toInfo = CURRENCY_CONFIG.currencies[toId];
  if (!fromInfo || !toInfo) return 0;

  // Convert source to gold coins, then gold coins to target
  const goldValue = amount * fromInfo.goldRate;
  const targetAmount = Math.floor(goldValue / toInfo.goldRate);
  return targetAmount;
}

/**
 * Execute a currency exchange between two types.
 */
function exchangeCurrency(player, fromId, toId, amount) {
  if (fromId === toId) {
    player.tell('\u00a7c[Horizons] Cannot exchange a currency for itself.');
    return false;
  }

  const fromInfo = CURRENCY_CONFIG.currencies[fromId];
  const toInfo = CURRENCY_CONFIG.currencies[toId];

  if (!fromInfo) {
    player.tell('\u00a7c[Horizons] Unknown source currency: ' + fromId);
    player.tell('\u00a77Valid: ' + CURRENCY_IDS.join(', '));
    return false;
  }
  if (!toInfo) {
    player.tell('\u00a7c[Horizons] Unknown target currency: ' + toId);
    player.tell('\u00a77Valid: ' + CURRENCY_IDS.join(', '));
    return false;
  }

  if (amount <= 0) {
    player.tell('\u00a7c[Horizons] Amount must be positive.');
    return false;
  }

  // Check if player has enough
  const currentFrom = getBalance(player, fromId);
  if (currentFrom < amount) {
    player.tell('\u00a7c[Horizons] Insufficient ' + fromInfo.plural + '! Have ' +
      currentFrom + ', need ' + amount + '.');
    return false;
  }

  // Calculate exchange
  const received = calculateExchange(fromId, toId, amount);
  if (received <= 0) {
    player.tell('\u00a7c[Horizons] Exchange amount too small. The conversion yields 0 ' + toInfo.plural + '.');
    player.tell('\u00a77Rate: 1 ' + fromInfo.name + ' = ' + fromInfo.goldRate + 'g, 1 ' +
      toInfo.name + ' = ' + toInfo.goldRate + 'g');
    return false;
  }

  // Perform exchange
  const goldValue = amount * fromInfo.goldRate;
  setBalance(player, fromId, currentFrom - amount);
  const currentTo = getBalance(player, toId);
  setBalance(player, toId, currentTo + received);

  player.tell('\u00a7e=== Currency Exchange ===');
  player.tell(fromInfo.color + '  -' + amount + ' ' + fromInfo.symbol + ' ' +
    (amount === 1 ? fromInfo.name : fromInfo.plural));
  player.tell('\u00a77  = ' + goldValue + ' gold coin value');
  player.tell(toInfo.color + '  +' + received + ' ' + toInfo.symbol + ' ' +
    (received === 1 ? toInfo.name : toInfo.plural));
  player.tell('\u00a7e========================');

  currencyLog(player.username + ' exchanged ' + amount + ' ' + fromId + ' -> ' +
    received + ' ' + toId + ' (' + goldValue + 'g value)');
  return true;
}

// ============================================================
// COMMAND REGISTRATION — /horizons currency
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('currency')
        // /horizons currency balance
        .then(Commands.literal('balance')
          .executes(ctx => {
            const player = ctx.source.player;
            if (!player) return 0;

            player.tell('\u00a7e=== Kingdom Currency Balances ===');

            let totalGoldValue = 0;

            for (const id of CURRENCY_IDS) {
              const info = CURRENCY_CONFIG.currencies[id];
              const bal = getBalance(player, id);
              const goldValue = bal * info.goldRate;
              totalGoldValue += goldValue;

              const kingdomName = id.charAt(0).toUpperCase() + id.slice(1);
              const balStr = bal > 0 ? info.color + bal : '\u00a78' + bal;

              player.tell('  ' + info.color + info.symbol + ' ' + kingdomName + ' ' + info.plural +
                ': ' + balStr + ' \u00a77(' + goldValue + 'g)');
            }

            player.tell('\u00a77Total Gold Value: \u00a76' + totalGoldValue + ' gold coins');
            player.tell('');
            player.tell('\u00a77Exchange Rates:');
            for (const id of CURRENCY_IDS) {
              const info = CURRENCY_CONFIG.currencies[id];
              player.tell('  \u00a77  1 ' + info.color + info.name + ' \u00a77= \u00a76' +
                info.goldRate + ' gold coins');
            }

            return 1;
          })
        )
        // /horizons currency exchange <from> <to> <amount>
        .then(Commands.literal('exchange')
          .then(Commands.argument('from', event.getArguments().STRING.create(event))
            .then(Commands.argument('to', event.getArguments().STRING.create(event))
              .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
                .executes(ctx => {
                  const player = ctx.source.player;
                  if (!player) return 0;

                  const fromId = event.getArguments().STRING.getResult(ctx, 'from').toLowerCase();
                  const toId = event.getArguments().STRING.getResult(ctx, 'to').toLowerCase();
                  const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                  exchangeCurrency(player, fromId, toId, amount);
                  return 1;
                })
              )
            )
          )
        )
        // /horizons currency grant <player> <type> <amount> — OP only
        .then(Commands.literal('grant')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('target', event.getArguments().STRING.create(event))
            .then(Commands.argument('type', event.getArguments().STRING.create(event))
              .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
                .executes(ctx => {
                  const source = ctx.source;
                  const targetName = event.getArguments().STRING.getResult(ctx, 'target');
                  const currencyType = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();
                  const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                  // Find target player
                  const server = source.server;
                  let targetPlayer = null;
                  server.players.forEach(p => {
                    if (p.username.toLowerCase() === targetName.toLowerCase()) {
                      targetPlayer = p;
                    }
                  });

                  if (!targetPlayer) {
                    if (source.player) {
                      source.player.tell('\u00a7c[Horizons] Player "' + targetName + '" not found online.');
                    }
                    return 0;
                  }

                  if (!CURRENCY_CONFIG.currencies[currencyType]) {
                    if (source.player) {
                      source.player.tell('\u00a7c[Horizons] Unknown currency: ' + currencyType);
                      source.player.tell('\u00a77Valid: ' + CURRENCY_IDS.join(', '));
                    }
                    return 0;
                  }

                  grantCurrency(targetPlayer, currencyType, amount);
                  if (source.player) {
                    source.player.tell('\u00a7a[Horizons] Granted ' + amount + ' ' + currencyType +
                      ' to ' + targetPlayer.username);
                  }
                  return 1;
                })
              )
            )
          )
        )
        // /horizons currency spend <type> <amount> — for testing
        .then(Commands.literal('spend')
          .then(Commands.argument('type', event.getArguments().STRING.create(event))
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player;
                if (!player) return 0;

                const currencyType = event.getArguments().STRING.getResult(ctx, 'type').toLowerCase();
                const amount = event.getArguments().INTEGER.getResult(ctx, 'amount');

                spendCurrency(player, currencyType, amount);
                return 1;
              })
            )
          )
        )
      )
  );
});

// ============================================================
// PLAYER JOIN — Initialize currency data
// ============================================================

PlayerEvents.loggedIn(event => {
  const player = event.player;
  const data = player.persistentData;

  // Initialize currency balances if first login
  const initKey = CURRENCY_CONFIG.keyPrefix + 'initialized';
  if (!data.getBoolean(initKey)) {
    for (const id of CURRENCY_IDS) {
      data.putInt(getCurrencyKey(id), 0);
    }
    data.putBoolean(initKey, true);
    currencyLog('Initialized currency data for ' + player.username);
  }
});

console.log('[Horizons] Kingdom Currency loaded');
console.log('[Horizons] Commands: /horizons currency [balance|exchange|grant|spend]');
console.log('[Horizons] Currencies: ' + CURRENCY_IDS.join(', '));
