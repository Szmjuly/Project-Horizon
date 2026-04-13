// ============================================================
// Project Horizons — Pokemon Workers
// ============================================================
// File: kubejs/server_scripts/colony/pokemon_workers.js
// Phase: 3
// Dependencies: MineColonies, Cobblemon
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// 16 Cobblemon-type pairings that boost MineColonies worker efficiency.
// Each pairing grants a stage that MineColonies configs can read to
// apply bonuses. Trust level from trust_fatigue.js scales the bonus.
//
// PAIRINGS:
//   Bulbasaur+Farmer (+25% crop yield)
//   Machop+Builder (+15% build speed)
//   Chansey+Cook (+20% food quality)
//   Growlithe+Guard (+30% patrol range)
//   Abra+Researcher (+20% research speed)
//   Geodude+Miner (+25% ore yield)
//   Squirtle+Fisher (+20% catch rate)
//   Pidgey+Courier (+25% delivery speed)
//   Eevee+Animal Herder (+20% breeding rate)
//   Magnemite+Mechanic (+15% repair speed)
//   Oddish+Composter (+25% compost output)
//   Charmander+Smelter (+20% smelt speed)
//   Ditto+Crafter (+15% craft speed)
//   Porygon+Enchanter (+20% enchant quality)
//   Meowth+Merchant (+10% trade margin)
//   Ralts+Healer (+25% heal potency)
//
// COMMANDS:
//   /horizons colony pair <worker_type> <pokemon_name>
//   /horizons colony unpair <worker_type>
//   /horizons colony pairings — shows all active pairings and bonuses
// ============================================================

// --- Configuration ---
const WORKER_PAIRINGS = {
  farmer:        { pokemon: 'bulbasaur',  bonus: 25, desc: 'crop yield',       stage: 'colony_pair_farmer' },
  builder:       { pokemon: 'machop',     bonus: 15, desc: 'build speed',      stage: 'colony_pair_builder' },
  cook:          { pokemon: 'chansey',    bonus: 20, desc: 'food quality',     stage: 'colony_pair_cook' },
  guard:         { pokemon: 'growlithe',  bonus: 30, desc: 'patrol range',     stage: 'colony_pair_guard' },
  researcher:    { pokemon: 'abra',       bonus: 20, desc: 'research speed',   stage: 'colony_pair_researcher' },
  miner:         { pokemon: 'geodude',    bonus: 25, desc: 'ore yield',        stage: 'colony_pair_miner' },
  fisher:        { pokemon: 'squirtle',   bonus: 20, desc: 'catch rate',       stage: 'colony_pair_fisher' },
  courier:       { pokemon: 'pidgey',     bonus: 25, desc: 'delivery speed',   stage: 'colony_pair_courier' },
  herder:        { pokemon: 'eevee',      bonus: 20, desc: 'breeding rate',    stage: 'colony_pair_herder' },
  mechanic:      { pokemon: 'magnemite',  bonus: 15, desc: 'repair speed',     stage: 'colony_pair_mechanic' },
  composter:     { pokemon: 'oddish',     bonus: 25, desc: 'compost output',   stage: 'colony_pair_composter' },
  smelter:       { pokemon: 'charmander', bonus: 20, desc: 'smelt speed',      stage: 'colony_pair_smelter' },
  crafter:       { pokemon: 'ditto',      bonus: 15, desc: 'craft speed',      stage: 'colony_pair_crafter' },
  enchanter:     { pokemon: 'porygon',    bonus: 20, desc: 'enchant quality',  stage: 'colony_pair_enchanter' },
  merchant:      { pokemon: 'meowth',     bonus: 10, desc: 'trade margin',     stage: 'colony_pair_merchant' },
  healer:        { pokemon: 'ralts',      bonus: 25, desc: 'heal potency',     stage: 'colony_pair_healer' }
};

const WORKER_CONFIG = {
  // persistentData key prefix for tracking active pairings
  pairingPrefix: 'horizons_colony_pair_',
  // persistentData key for count of active pairings
  pairingCountKey: 'horizons_colony_pair_count',
  // Maximum simultaneous pairings per player
  maxPairings: 8,
  debug: true
};

// --- Utility Functions ---

function workerLog(message) {
  if (WORKER_CONFIG.debug) {
    console.log('[Horizons/Workers] ' + message);
  }
}

/**
 * Get the trust multiplier from trust_fatigue.js (0.0 - 1.0).
 */
function getPlayerTrust(player) {
  let trust = player.persistentData.getInt('horizons_companion_trust') || 0;
  return Math.max(0, Math.min(trust, 100)) / 100.0;
}

/**
 * Calculate the effective bonus for a pairing, scaled by trust.
 */
function getEffectiveBonus(baseBonus, trustMultiplier) {
  return Math.floor(baseBonus * trustMultiplier);
}

/**
 * Check if a worker type is currently paired for a player.
 */
function isPaired(player, workerType) {
  let val = player.persistentData.getString(WORKER_CONFIG.pairingPrefix + workerType);
  return val && val.length > 0;
}

/**
 * Get the paired pokemon name for a worker type.
 */
function getPairedPokemon(player, workerType) {
  return player.persistentData.getString(WORKER_CONFIG.pairingPrefix + workerType) || '';
}

/**
 * Count how many active pairings a player has.
 */
function countPairings(player) {
  let count = 0;
  for (let wType of Object.keys(WORKER_PAIRINGS)) {
    if (isPaired(player, wType)) count++;
  }
  return count;
}

/**
 * Activate a pairing: store in persistentData and add stage.
 */
function activatePairing(player, workerType, pokemonName) {
  let config = WORKER_PAIRINGS[workerType];
  if (!config) return false;

  // Store the pokemon name for this worker type
  player.persistentData.putString(WORKER_CONFIG.pairingPrefix + workerType, pokemonName);

  // Add the stage so MineColonies configs can detect it
  if (!player.stages.has(config.stage)) {
    player.stages.add(config.stage);
  }

  // Also add a tier-specific stage based on trust for finer granularity
  let trust = getPlayerTrust(player);
  let tier = trust >= 0.8 ? 'max' : (trust >= 0.5 ? 'mid' : 'low');
  let tierStage = config.stage + '_' + tier;
  player.stages.add(tierStage);

  workerLog(player.username + ' paired ' + workerType + ' with ' + pokemonName + ' (trust: ' + Math.floor(trust * 100) + '%)');
  return true;
}

/**
 * Deactivate a pairing: remove from persistentData and remove stages.
 */
function deactivatePairing(player, workerType) {
  let config = WORKER_PAIRINGS[workerType];
  if (!config) return false;

  // Clear the stored pokemon name
  player.persistentData.putString(WORKER_CONFIG.pairingPrefix + workerType, '');

  // Remove all related stages
  if (player.stages.has(config.stage)) {
    player.stages.remove(config.stage);
  }
  let tiers = ['low', 'mid', 'max'];
  for (let t of tiers) {
    let tierStage = config.stage + '_' + t;
    if (player.stages.has(tierStage)) {
      player.stages.remove(tierStage);
    }
  }

  workerLog(player.username + ' unpaired ' + workerType);
  return true;
}

/**
 * Refresh all pairing stages based on current trust level.
 * Called periodically so trust changes update bonus tiers.
 */
function refreshPairingStages(player) {
  let trust = getPlayerTrust(player);
  let tier = trust >= 0.8 ? 'max' : (trust >= 0.5 ? 'mid' : 'low');
  let tiers = ['low', 'mid', 'max'];

  for (let wType of Object.keys(WORKER_PAIRINGS)) {
    if (!isPaired(player, wType)) continue;

    let config = WORKER_PAIRINGS[wType];

    // Ensure base stage is present
    if (!player.stages.has(config.stage)) {
      player.stages.add(config.stage);
    }

    // Set correct tier stage, remove others
    for (let t of tiers) {
      let tierStage = config.stage + '_' + t;
      if (t === tier) {
        if (!player.stages.has(tierStage)) player.stages.add(tierStage);
      } else {
        if (player.stages.has(tierStage)) player.stages.remove(tierStage);
      }
    }
  }
}

// ============================================================
// PERIODIC TICK — Refresh pairing tier stages every 5 minutes
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  // Every 6000 ticks (5 minutes)
  if (server.tickCount % 6000 !== 0) return;

  server.players.forEach(player => {
    if (!player || !player.isAlive()) return;
    refreshPairingStages(player);
  });
});

// ============================================================
// PLAYER LOGIN — Restore pairing stages from persistentData
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;

  for (let wType of Object.keys(WORKER_PAIRINGS)) {
    if (isPaired(player, wType)) {
      let config = WORKER_PAIRINGS[wType];
      if (!player.stages.has(config.stage)) {
        player.stages.add(config.stage);
      }
    }
  }

  refreshPairingStages(player);
  workerLog('Restored pairing stages for ' + player.username);
});

// ============================================================
// COMMANDS: /horizons colony [pair|unpair|pairings]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('colony')

        // /horizons colony pair <worker_type> <pokemon_name>
        .then(Commands.literal('pair')
          .then(Commands.argument('worker_type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(WORKER_PAIRINGS)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .then(Commands.argument('pokemon_name', event.getArguments().STRING.create(event))
              .suggests((ctx, builder) => {
                // Suggest the correct pokemon for each worker type
                for (let config of Object.values(WORKER_PAIRINGS)) {
                  builder.suggest(config.pokemon);
                }
                return builder.buildFuture();
              })
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let workerType = event.getArguments().STRING.getResult(ctx, 'worker_type').toLowerCase();
                let pokemonName = event.getArguments().STRING.getResult(ctx, 'pokemon_name').toLowerCase();

                // Validate worker type
                let config = WORKER_PAIRINGS[workerType];
                if (!config) {
                  player.tell('\u00a7c[Colony] Unknown worker type: ' + workerType);
                  player.tell('\u00a77Valid types: ' + Object.keys(WORKER_PAIRINGS).join(', '));
                  return 0;
                }

                // Validate pokemon match
                if (pokemonName !== config.pokemon) {
                  player.tell('\u00a7c[Colony] ' + pokemonName + ' is not the right partner for a ' + workerType + '.');
                  player.tell('\u00a77The ' + workerType + ' pairs with \u00a7a' + config.pokemon + '\u00a77.');
                  return 0;
                }

                // Check if already paired
                if (isPaired(player, workerType)) {
                  let existing = getPairedPokemon(player, workerType);
                  player.tell('\u00a7e[Colony] ' + workerType + ' is already paired with ' + existing + '. Unpair first.');
                  return 0;
                }

                // Check max pairings
                let currentCount = countPairings(player);
                if (currentCount >= WORKER_CONFIG.maxPairings) {
                  player.tell('\u00a7c[Colony] Maximum pairings reached (' + WORKER_CONFIG.maxPairings + '). Unpair a worker first.');
                  return 0;
                }

                // Activate pairing
                activatePairing(player, workerType, pokemonName);

                let trust = getPlayerTrust(player);
                let effectiveBonus = getEffectiveBonus(config.bonus, trust);

                player.tell('\u00a7a=== Pokemon Worker Paired ===');
                player.tell('\u00a77Worker: \u00a7f' + workerType.charAt(0).toUpperCase() + workerType.slice(1));
                player.tell('\u00a77Pokemon: \u00a7a' + pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1));
                player.tell('\u00a77Bonus: \u00a7a+' + effectiveBonus + '% ' + config.desc + ' \u00a77(base +' + config.bonus + '%, trust ' + Math.floor(trust * 100) + '%)');
                player.tell('\u00a77Active pairings: \u00a7f' + (currentCount + 1) + '/' + WORKER_CONFIG.maxPairings);

                return 1;
              })
            )
          )
        )

        // /horizons colony unpair <worker_type>
        .then(Commands.literal('unpair')
          .then(Commands.argument('worker_type', event.getArguments().STRING.create(event))
            .suggests((ctx, builder) => {
              for (let key of Object.keys(WORKER_PAIRINGS)) {
                builder.suggest(key);
              }
              return builder.buildFuture();
            })
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let workerType = event.getArguments().STRING.getResult(ctx, 'worker_type').toLowerCase();

              if (!WORKER_PAIRINGS[workerType]) {
                player.tell('\u00a7c[Colony] Unknown worker type: ' + workerType);
                return 0;
              }

              if (!isPaired(player, workerType)) {
                player.tell('\u00a77[Colony] ' + workerType + ' has no active pairing.');
                return 0;
              }

              let pokemonName = getPairedPokemon(player, workerType);
              deactivatePairing(player, workerType);

              player.tell('\u00a7e[Colony] Unpaired ' + workerType + ' from ' + pokemonName + '.');
              player.tell('\u00a77Worker returns to normal efficiency.');

              return 1;
            })
          )
        )

        // /horizons colony pairings — show all active pairings
        .then(Commands.literal('pairings')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let trust = getPlayerTrust(player);
            let trustPct = Math.floor(trust * 100);
            let count = countPairings(player);

            player.tell('\u00a7e=== Colony Pokemon Pairings ===');
            player.tell('\u00a77Trust Level: \u00a7f' + trustPct + '% \u00a77(bonus multiplier)');
            player.tell('\u00a77Active Pairings: \u00a7f' + count + '/' + WORKER_CONFIG.maxPairings);
            player.tell('');

            if (count === 0) {
              player.tell('\u00a78No active pairings. Use /horizons colony pair <worker> <pokemon>');
              player.tell('');
            }

            for (let [wType, config] of Object.entries(WORKER_PAIRINGS)) {
              let paired = isPaired(player, wType);
              let pokemonName = getPairedPokemon(player, wType);
              let effectiveBonus = getEffectiveBonus(config.bonus, trust);

              let label = wType.charAt(0).toUpperCase() + wType.slice(1);
              let pokemonLabel = config.pokemon.charAt(0).toUpperCase() + config.pokemon.slice(1);

              if (paired) {
                player.tell('\u00a7a  \u2713 ' + label + ' \u00a77+ \u00a7a' + pokemonLabel + ' \u00a77= \u00a7a+' + effectiveBonus + '% ' + config.desc);
              } else {
                player.tell('\u00a78  \u2717 ' + label + ' \u00a77\u2190 needs \u00a7f' + pokemonLabel);
              }
            }

            player.tell('');
            player.tell('\u00a77Paired workers cost \u00a7c20% more wages \u00a77but produce \u00a7a25%+ more\u00a77.');

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Pokemon Workers system loaded');
console.log('[Horizons] Commands: /horizons colony [pair|unpair|pairings]');
console.log('[Horizons] 16 worker/pokemon pairings available');
