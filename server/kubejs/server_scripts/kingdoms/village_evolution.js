// ============================================================
// Project Horizons — Village Evolution
// ============================================================
// File: kubejs/server_scripts/kingdoms/village_evolution.js
// Phase: 3
// Dependencies: MineColonies, KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// 5-stage village evolution from Hamlet to Kingdom based on
// prosperity points. Prosperity is tracked per player (representing
// their nearest village) and persisted across sessions.
//
// EVOLUTION TIERS:
//   Hamlet   (0-99 prosperity)
//   Village  (100-299)
//   Town     (300-599)
//   City     (600-999)
//   Kingdom  (1000+)
//
// PROSPERITY SOURCES:
//   Player trades (+1), completed quests (+5), buildings placed (+2),
//   workers hired (+3)
//
// PROSPERITY DRAINS:
//   Crisis events (-20), crime in area (-5),
//   neglect (no activity for 7 MC days: -10)
//
// COMMANDS:
//   /horizons village status — show nearest village prosperity/tier
//   /horizons village prosperity add <amount> — OP only
// ============================================================

// --- Configuration ---
const VILLAGE_CONFIG = {
  tiers: [
    { name: 'Hamlet',  min: 0,    max: 99,   color: '\u00a78', stage: 'village_hamlet',  unlocks: 'Basic workers, small buildings' },
    { name: 'Village', min: 100,  max: 299,  color: '\u00a7a', stage: 'village_village', unlocks: 'Guard towers, tavern, merchant stalls' },
    { name: 'Town',    min: 300,  max: 599,  color: '\u00a7e', stage: 'village_town',    unlocks: 'Blacksmith, library, town hall' },
    { name: 'City',    min: 600,  max: 999,  color: '\u00a79', stage: 'village_city',    unlocks: 'University, barracks, grand market' },
    { name: 'Kingdom', min: 1000, max: 99999, color: '\u00a7d', stage: 'village_kingdom', unlocks: 'Castle, royal court, enchanting tower' }
  ],

  // persistentData keys
  keys: {
    prosperity: 'horizons_village_prosperity',
    tierIndex: 'horizons_village_tier',
    lastActivity: 'horizons_village_last_activity',
    villageName: 'horizons_village_name',
    villageX: 'horizons_village_x',
    villageZ: 'horizons_village_z'
  },

  // Neglect: ticks of inactivity before decay (7 MC days = 7 * 24000)
  neglectThreshold: 168000,

  // Decay amount per neglect cycle
  neglectDecay: 10,

  // Check interval for neglect (every MC day)
  neglectCheckInterval: 24000,

  // Prosperity sources (for reference and validation)
  sources: {
    trade: 1,
    quest: 5,
    building: 2,
    hire: 3,
    crisis: -20,
    crime: -5,
    neglect: -10
  },

  debug: true
};

// --- Utility Functions ---

function villageLog(message) {
  if (VILLAGE_CONFIG.debug) {
    console.log('[Horizons/Village] ' + message);
  }
}

/**
 * Get prosperity value for a player.
 */
function getProsperity(player) {
  return Math.max(0, player.persistentData.getInt(VILLAGE_CONFIG.keys.prosperity));
}

/**
 * Set prosperity value (clamped to 0 minimum).
 */
function setProsperity(player, value) {
  let clamped = Math.max(0, value);
  player.persistentData.putInt(VILLAGE_CONFIG.keys.prosperity, clamped);
  return clamped;
}

/**
 * Add or subtract prosperity and check for tier changes.
 */
function modifyProsperity(player, delta, source) {
  let oldProsperity = getProsperity(player);
  let oldTier = getTierIndex(oldProsperity);
  let newProsperity = setProsperity(player, oldProsperity + delta);
  let newTier = getTierIndex(newProsperity);

  // Mark activity timestamp
  player.persistentData.putLong(VILLAGE_CONFIG.keys.lastActivity, player.server.tickCount);

  // Check for tier change
  if (newTier !== oldTier) {
    handleTierChange(player, oldTier, newTier, newProsperity);
  }

  if (delta > 0) {
    villageLog(player.username + ' +' + delta + ' prosperity (' + source + '): ' + oldProsperity + ' -> ' + newProsperity);
  } else {
    villageLog(player.username + ' ' + delta + ' prosperity (' + source + '): ' + oldProsperity + ' -> ' + newProsperity);
  }

  return newProsperity;
}

/**
 * Get the tier index for a given prosperity value.
 */
function getTierIndex(prosperity) {
  for (let i = VILLAGE_CONFIG.tiers.length - 1; i >= 0; i--) {
    if (prosperity >= VILLAGE_CONFIG.tiers[i].min) return i;
  }
  return 0;
}

/**
 * Get the tier object for a given prosperity value.
 */
function getTier(prosperity) {
  return VILLAGE_CONFIG.tiers[getTierIndex(prosperity)];
}

/**
 * Handle a tier change: announce, update stages, unlock new content.
 */
function handleTierChange(player, oldIndex, newIndex, prosperity) {
  let oldTier = VILLAGE_CONFIG.tiers[oldIndex];
  let newTier = VILLAGE_CONFIG.tiers[newIndex];
  let server = player.server;

  // Remove all village tier stages
  for (let tier of VILLAGE_CONFIG.tiers) {
    if (player.stages.has(tier.stage)) {
      player.stages.remove(tier.stage);
    }
  }

  // Add new tier stage
  player.stages.add(newTier.stage);
  player.persistentData.putInt(VILLAGE_CONFIG.keys.tierIndex, newIndex);

  // Evolution (tier increase)
  if (newIndex > oldIndex) {
    let villageName = player.persistentData.getString(VILLAGE_CONFIG.keys.villageName) || 'the settlement';

    // Announce to all players
    server.runCommandSilent(
      'tellraw @a {"text":"","extra":[' +
        '{"text":"\\n=== Village Evolution! ===\\n","color":"gold","bold":true},' +
        '{"text":"' + villageName + '","color":"yellow"},' +
        '{"text":" has evolved from ","color":"gray"},' +
        '{"text":"' + oldTier.name + '","color":"white"},' +
        '{"text":" to ","color":"gray"},' +
        '{"text":"' + newTier.name + '","color":"aqua","bold":true},' +
        '{"text":"!\\n","color":"gray"},' +
        '{"text":"Prosperity: ' + prosperity + '\\n","color":"gray"},' +
        '{"text":"New unlocks: ' + newTier.unlocks + '\\n","color":"green"}' +
      ']}'
    );

    // Celebration particles
    server.runCommandSilent(
      'execute at ' + player.username + ' run particle minecraft:totem_of_undying ~ ~2 ~ 2 2 2 0.1 50'
    );
    server.runCommandSilent(
      'execute at ' + player.username + ' run playsound minecraft:ui.toast.challenge_complete master @a ~ ~ ~ 1 1'
    );

    villageLog(villageName + ' evolved: ' + oldTier.name + ' -> ' + newTier.name + ' (prosperity: ' + prosperity + ')');
  }
  // Devolution (tier decrease)
  else if (newIndex < oldIndex) {
    let villageName = player.persistentData.getString(VILLAGE_CONFIG.keys.villageName) || 'the settlement';

    player.tell('\u00a7c=== Village Decline ===');
    player.tell('\u00a77' + villageName + ' has declined from \u00a7f' + oldTier.name + '\u00a77 to \u00a7c' + newTier.name + '\u00a77.');
    player.tell('\u00a77Prosperity: \u00a7f' + prosperity);

    villageLog(villageName + ' declined: ' + oldTier.name + ' -> ' + newTier.name + ' (prosperity: ' + prosperity + ')');
  }
}

/**
 * Get a visual progress bar for the current tier.
 */
function getTierProgressBar(prosperity) {
  let tier = getTier(prosperity);
  let tierIndex = getTierIndex(prosperity);
  let nextTier = (tierIndex < VILLAGE_CONFIG.tiers.length - 1) ? VILLAGE_CONFIG.tiers[tierIndex + 1] : null;

  if (!nextTier) {
    // Already at max tier
    return '\u00a7d|||||||||||||||||||||\u00a77 MAX';
  }

  let range = nextTier.min - tier.min;
  let progress = prosperity - tier.min;
  let barLength = 20;
  let filled = Math.floor((progress / range) * barLength);
  let empty = barLength - filled;

  let bar = '\u00a7a';
  for (let i = 0; i < filled; i++) bar += '|';
  bar += '\u00a78';
  for (let i = 0; i < empty; i++) bar += '|';

  return bar + ' \u00a7f' + progress + '/' + range;
}

// ============================================================
// PERIODIC TICK — Neglect decay check every MC day
// ============================================================

ServerEvents.tick(event => {
  let server = event.server;

  if (server.tickCount % VILLAGE_CONFIG.neglectCheckInterval !== 0) return;
  if (server.tickCount === 0) return;

  server.players.forEach(player => {
    if (!player) return;

    let lastActivity = player.persistentData.getLong(VILLAGE_CONFIG.keys.lastActivity);
    if (lastActivity <= 0) return;

    let ticksSinceActivity = server.tickCount - lastActivity;

    if (ticksSinceActivity >= VILLAGE_CONFIG.neglectThreshold) {
      let prosperity = getProsperity(player);
      if (prosperity > 0) {
        modifyProsperity(player, VILLAGE_CONFIG.sources.neglect, 'neglect');
        player.tell('\u00a7c[Village] \u00a77Your settlement is suffering from neglect! (-' + Math.abs(VILLAGE_CONFIG.sources.neglect) + ' prosperity)');
      }
    }
  });
});

// ============================================================
// PLAYER LOGIN — Initialize village data and restore stages
// ============================================================

PlayerEvents.loggedIn(event => {
  let player = event.player;
  let data = player.persistentData;

  if (!data.contains(VILLAGE_CONFIG.keys.prosperity)) {
    data.putInt(VILLAGE_CONFIG.keys.prosperity, 0);
    data.putInt(VILLAGE_CONFIG.keys.tierIndex, 0);
    data.putLong(VILLAGE_CONFIG.keys.lastActivity, player.server.tickCount);
    data.putString(VILLAGE_CONFIG.keys.villageName, player.username + "'s Settlement");
    data.putInt(VILLAGE_CONFIG.keys.villageX, Math.floor(player.x));
    data.putInt(VILLAGE_CONFIG.keys.villageZ, Math.floor(player.z));
    villageLog('Initialized village data for ' + player.username);
  }

  // Restore tier stage
  let prosperity = getProsperity(player);
  let tier = getTier(prosperity);

  // Remove all then add current
  for (let t of VILLAGE_CONFIG.tiers) {
    if (player.stages.has(t.stage)) player.stages.remove(t.stage);
  }
  player.stages.add(tier.stage);
});

// ============================================================
// TRADE EVENT — +1 prosperity on villager trades
// ============================================================

PlayerEvents.inventoryChanged(event => {
  let player = event.player;
  if (!player) return;

  // Track trade-based prosperity via a scoreboard set by other systems
  // This is a simplified approach — trades are detected by other scripts
  // calling modifyProsperity directly or using scoreboards
});

// ============================================================
// COMMANDS: /horizons village [status|prosperity|name]
// ============================================================

ServerEvents.commandRegistry(event => {
  let { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('village')

        // /horizons village status — show village prosperity/tier
        .then(Commands.literal('status')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let prosperity = getProsperity(player);
            let tier = getTier(prosperity);
            let tierIndex = getTierIndex(prosperity);
            let villageName = player.persistentData.getString(VILLAGE_CONFIG.keys.villageName) || 'Unknown';
            let vx = player.persistentData.getInt(VILLAGE_CONFIG.keys.villageX);
            let vz = player.persistentData.getInt(VILLAGE_CONFIG.keys.villageZ);
            let progressBar = getTierProgressBar(prosperity);

            player.tell('\u00a7e=== Village Status ===');
            player.tell('\u00a77Name: \u00a7f' + villageName);
            player.tell('\u00a77Location: \u00a7f' + vx + ', ' + vz);
            player.tell('\u00a77Tier: ' + tier.color + tier.name + ' \u00a77(' + tier.min + '+ prosperity)');
            player.tell('\u00a77Prosperity: \u00a7f' + prosperity);
            player.tell('\u00a77Progress: ' + progressBar);
            player.tell('');

            // Show all tiers
            player.tell('\u00a77Evolution Path:');
            for (let i = 0; i < VILLAGE_CONFIG.tiers.length; i++) {
              let t = VILLAGE_CONFIG.tiers[i];
              let isCurrent = (i === tierIndex);
              let reached = (prosperity >= t.min);
              let marker = isCurrent ? '\u00a7a\u25b6 ' : (reached ? '\u00a7a  \u2713 ' : '\u00a78  \u2717 ');
              player.tell(marker + t.color + t.name + ' \u00a77(' + t.min + '+)');
              if (isCurrent) {
                player.tell('    \u00a77Unlocks: \u00a7f' + t.unlocks);
              }
            }

            // Next unlock preview
            if (tierIndex < VILLAGE_CONFIG.tiers.length - 1) {
              let nextTier = VILLAGE_CONFIG.tiers[tierIndex + 1];
              let needed = nextTier.min - prosperity;
              player.tell('');
              player.tell('\u00a77Next: ' + nextTier.color + nextTier.name + ' \u00a77in \u00a7f' + needed + ' \u00a77prosperity');
              player.tell('\u00a77Will unlock: \u00a7f' + nextTier.unlocks);
            }

            return 1;
          })
        )

        // /horizons village prosperity add <amount> — OP only
        .then(Commands.literal('prosperity')
          .then(Commands.literal('add')
            .requires(function(source) { return source.hasPermission(2); })
            .then(Commands.argument('amount', event.getArguments().INTEGER.create(event))
              .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let amount = event.getArguments().INTEGER.getResult(ctx, 'amount');
                let newProsperity = modifyProsperity(player, amount, 'admin');

                if (amount >= 0) {
                  player.tell('\u00a7a[Village] Added ' + amount + ' prosperity. Total: ' + newProsperity);
                } else {
                  player.tell('\u00a7c[Village] Removed ' + Math.abs(amount) + ' prosperity. Total: ' + newProsperity);
                }

                return 1;
              })
            )
          )
        )

        // /horizons village name <name> — rename your village
        .then(Commands.literal('name')
          .then(Commands.argument('name', event.getArguments().STRING.create(event))
            .executes(ctx => {
              let player = ctx.source.player;
              if (!player) return 0;

              let newName = event.getArguments().STRING.getResult(ctx, 'name');
              let oldName = player.persistentData.getString(VILLAGE_CONFIG.keys.villageName);

              player.persistentData.putString(VILLAGE_CONFIG.keys.villageName, newName);
              player.tell('\u00a7a[Village] Renamed from "' + oldName + '" to "' + newName + '".');

              return 1;
            })
          )
        )

        // /horizons village setlocation — set village center to current pos
        .then(Commands.literal('setlocation')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let x = Math.floor(player.x);
            let z = Math.floor(player.z);
            player.persistentData.putInt(VILLAGE_CONFIG.keys.villageX, x);
            player.persistentData.putInt(VILLAGE_CONFIG.keys.villageZ, z);

            player.tell('\u00a7a[Village] Center set to \u00a7f' + x + ', ' + z);

            return 1;
          })
        )

        // /horizons village trade — log a trade (+1 prosperity)
        .then(Commands.literal('trade')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let newP = modifyProsperity(player, VILLAGE_CONFIG.sources.trade, 'trade');
            player.tell('\u00a7a[Village] Trade logged! +' + VILLAGE_CONFIG.sources.trade + ' prosperity (total: ' + newP + ')');

            return 1;
          })
        )

        // /horizons village quest — log a quest completion (+5 prosperity)
        .then(Commands.literal('quest')
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let newP = modifyProsperity(player, VILLAGE_CONFIG.sources.quest, 'quest');
            player.tell('\u00a7a[Village] Quest completed! +' + VILLAGE_CONFIG.sources.quest + ' prosperity (total: ' + newP + ')');

            return 1;
          })
        )

        // /horizons village crisis — log a crisis event (-20 prosperity, OP)
        .then(Commands.literal('crisis')
          .requires(function(source) { return source.hasPermission(2); })
          .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let newP = modifyProsperity(player, VILLAGE_CONFIG.sources.crisis, 'crisis');
            player.tell('\u00a7c[Village] Crisis event! ' + VILLAGE_CONFIG.sources.crisis + ' prosperity (total: ' + newP + ')');

            return 1;
          })
        )
      )
  );
});

console.log('[Horizons] Village Evolution system loaded');
console.log('[Horizons] Commands: /horizons village [status|prosperity|name|setlocation|trade|quest|crisis]');
console.log('[Horizons] Tiers: Hamlet -> Village -> Town -> City -> Kingdom');
