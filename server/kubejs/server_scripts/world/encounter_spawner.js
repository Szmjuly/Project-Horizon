// ============================================================
// Project Horizons — Encounter Spawner
// File: kubejs/server_scripts/world/encounter_spawner.js
// Phase: 3 | Dependencies: KubeJS, encounter_scheduler.js
// ============================================================

// --- Encounter Data ---
const ENCOUNTER_DATA = {
  wandering_merchant: {
    label: 'Wandering Merchant',
    intro: '\u00a7e\u00a7lA Wandering Merchant appears!',
    description: '\u00a77A weathered traveler with a heavy pack catches your eye. "Care to trade, Pathfinder?"'
  },
  lost_child: {
    label: 'Lost Child',
    intro: '\u00a7b\u00a7lA Lost Child calls out!',
    description: '\u00a77A frightened child tugs at your sleeve. "Please, I cannot find my way home..."'
  },
  bandit_ambush: {
    label: 'Bandit Ambush',
    intro: '\u00a7c\u00a7lBandit Ambush!',
    description: '\u00a77Shadowy figures emerge from the brush, weapons drawn. "Your valuables or your life!"'
  },
  mysterious_stranger: {
    label: 'Mysterious Stranger',
    intro: '\u00a7d\u00a7lA Mysterious Stranger watches...',
    description: '\u00a77A cloaked figure steps from the shadows, eyes gleaming with ancient knowledge.'
  },
  treasure_map: {
    label: 'Treasure Map',
    intro: '\u00a76\u00a7lYou found a Treasure Map!',
    description: '\u00a77A weathered parchment catches the wind and lands at your feet.'
  },
  herb_gatherer: {
    label: 'Herb Gatherer',
    intro: '\u00a7a\u00a7lAn Herb Gatherer greets you!',
    description: '\u00a77An elderly herbalist looks up from their basket of freshly picked plants. "Ah, you look like you could use some remedies."'
  }
};

const MERCHANT_TRADES = [
  { name: 'Healing Potion', item: 'minecraft:potion', cost: '8 gold coins' },
  { name: 'Ender Pearl', item: 'minecraft:ender_pearl', cost: '12 gold coins' },
  { name: 'Golden Apple', item: 'minecraft:golden_apple', cost: '16 gold coins' },
  { name: 'Blaze Rod', item: 'minecraft:blaze_rod', cost: '10 gold coins' },
  { name: 'Name Tag', item: 'minecraft:name_tag', cost: '6 gold coins' },
  { name: 'Spyglass', item: 'minecraft:spyglass', cost: '5 gold coins' },
  { name: 'Saddle', item: 'minecraft:saddle', cost: '10 gold coins' }
];

// --- Herb items ---
const HERB_ITEMS = [
  'minecraft:sweet_berries', 'minecraft:glow_berries', 'minecraft:dried_kelp',
  'minecraft:golden_carrot', 'minecraft:mushroom_stew', 'minecraft:beetroot_soup',
  'minecraft:honey_bottle', 'minecraft:apple', 'minecraft:melon_slice'
];

// --- Utility: pick N random unique items from array ---
function pickRandom(arr, count) {
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// --- Spawn encounter for a player ---
function spawnEncounter(server, playerName, typeId) {
  const player = server.getPlayer(playerName);
  if (!player) return;

  const data = ENCOUNTER_DATA[typeId];
  if (!data) return;

  // Send intro messages
  player.tell('');
  player.tell(data.intro);
  player.tell(data.description);
  player.tell('');

  switch (typeId) {
    case 'wandering_merchant':
      handleMerchant(player, server);
      break;
    case 'lost_child':
      handleLostChild(player, server);
      break;
    case 'bandit_ambush':
      handleBanditAmbush(player, server);
      break;
    case 'mysterious_stranger':
      handleMysteriousStranger(player, server);
      break;
    case 'treasure_map':
      handleTreasureMap(player, server);
      break;
    case 'herb_gatherer':
      handleHerbGatherer(player, server);
      break;
  }
}

// --- Encounter Handlers ---

function handleMerchant(player, server) {
  const trades = pickRandom(MERCHANT_TRADES, 3);
  // Store trade options in persistentData
  player.persistentData.putString('encounter_trades', JSON.stringify(trades.map(t => t.item)));

  player.tell('\u00a7e"I have these wares today:"');
  for (let i = 0; i < trades.length; i++) {
    player.tell('\u00a76  ' + (i + 1) + '. \u00a7f' + trades[i].name + ' \u00a77- ' + trades[i].cost);
  }
  player.tell('');
  player.tell('\u00a77Use \u00a7f/horizons encounter trade <1|2|3> \u00a77to select.');
  player.tell('\u00a77Or ignore to let the merchant pass.');
}

function handleLostChild(player, server) {
  player.tell('\u00a7b"My village is nearby... I think it was to the north..."');
  player.tell('\u00a77This child seems to be from a nearby settlement.');
  player.tell('\u00a77Escort quest started! Walk north to find the village.');

  // Grant rep with nearest faction as reward
  player.stages.add('quest_escort_child');
  // Grant a small immediate rep boost for accepting
  server.runCommandSilent('horizons reward reputation plains 10');
  player.tell('\u00a7a+10 reputation with Plains Kingdom for helping.');
}

function handleBanditAmbush(player, server) {
  player.tell('\u00a7c"Hand over your gold, Pathfinder!"');
  player.tell('\u00a77The bandits attack! You feel weakened...');

  // Apply negative effects
  server.runCommandSilent('effect give ' + player.username + ' minecraft:weakness 30 0');
  server.runCommandSilent('effect give ' + player.username + ' minecraft:slowness 15 0');

  // Set stage for survival tracking
  player.stages.add('encounter_bandit_survival');
  player.persistentData.putLong('bandit_ambush_time', Date.now());

  player.tell('\u00a77Survive for 30 seconds to drive them off and claim their gold!');
  player.tell('\u00a77The bandits will flee when your weakness wears off.');
}

function handleMysteriousStranger(player, server) {
  // Cryptic lore message
  const messages = [
    '\u00a7d"The gates between worlds grow thin. Prepare yourself, Pathfinder."',
    '\u00a7d"I have seen the eclipse that will reshape Aetheria. Have you?"',
    '\u00a7d"The Precursors left more than ruins. Seek the Nexus."',
    '\u00a7d"Your path forks ahead. Choose wisely, for the Watchers observe."',
    '\u00a7d"In the void between stars, something stirs. It knows your name."'
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  player.tell(msg);
  player.tell('');

  // Grant a rare item
  const rareItems = [
    'minecraft:echo_shard', 'minecraft:amethyst_shard',
    'minecraft:heart_of_the_sea', 'minecraft:nether_star'
  ];
  const reward = rareItems[Math.floor(Math.random() * rareItems.length)];
  server.runCommandSilent('give ' + player.username + ' ' + reward + ' 1');

  player.tell('\u00a7d"Take this. You will need it."');
  player.tell('\u00a7a[Received a mysterious gift]');

  // Grant pathfinder XP
  server.runCommandSilent('horizons level grantxp 25');
}

function handleTreasureMap(player, server) {
  // Generate coordinates near the player
  const offsetX = Math.floor(Math.random() * 400) - 200;
  const offsetZ = Math.floor(Math.random() * 400) - 200;
  const targetX = Math.floor(player.x) + offsetX;
  const targetZ = Math.floor(player.z) + offsetZ;

  // Store treasure location
  player.persistentData.putInt('treasure_x', targetX);
  player.persistentData.putInt('treasure_z', targetZ);
  player.stages.add('quest_treasure_hunt');

  player.tell('\u00a76The map shows a location marked with an X:');
  player.tell('\u00a7e  Coordinates: \u00a7f' + targetX + ', ' + targetZ);
  player.tell('\u00a77Travel there to claim the buried treasure!');
  player.tell('\u00a77The treasure will disappear if not found within 10 minutes.');

  // Grant map item as a memento
  server.runCommandSilent('give ' + player.username + ' minecraft:map 1');
}

function handleHerbGatherer(player, server) {
  player.tell('\u00a7a"Here, take some of my harvest. These will keep you healthy."');

  // Give 2-4 random herb/food items
  const count = 2 + Math.floor(Math.random() * 3);
  const herbs = pickRandom(HERB_ITEMS, count);

  for (let i = 0; i < herbs.length; i++) {
    const amount = 1 + Math.floor(Math.random() * 4);
    server.runCommandSilent('give ' + player.username + ' ' + herbs[i] + ' ' + amount);
  }

  player.tell('\u00a7a[Received assorted herbs and food]');

  // Small XP bonus
  server.runCommandSilent('horizons level grantxp 10');
  player.tell('\u00a7a+10 Pathfinder XP');
}

// ============================================================
// BANDIT SURVIVAL CHECK — Grant reward if player survives 30s
// ============================================================

ServerEvents.tick(event => {
  const server = event.server;
  if (server.tickCount % 600 !== 0) return; // Check every 30 seconds

  const players = server.players;
  for (let p = 0; p < players.size(); p++) {
    const player = players.get(p);
    if (!player || player.isFake()) continue;

    if (!player.stages.has('encounter_bandit_survival')) continue;

    const ambushTime = player.persistentData.getLong('bandit_ambush_time');
    if (!ambushTime) continue;

    if (Date.now() - ambushTime >= 30000) {
      // Player survived!
      player.stages.remove('encounter_bandit_survival');
      player.tell('\u00a7a\u00a7lThe bandits flee!');
      player.tell('\u00a77They drop some gold coins as they scatter.');

      // Grant gold coins
      server.runCommandSilent('horizons reward currency lightman 5');
      server.runCommandSilent('horizons level grantxp 20');
      player.tell('\u00a7a+5 gold coins, +20 Pathfinder XP');
    }
  }
});

// ============================================================
// COMMANDS
// ============================================================

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event;

  event.register(
    Commands.literal('horizons')
      .then(Commands.literal('encounter')
        // /horizons encounter spawn <player> <type> — internal use
        .then(Commands.literal('spawn')
          .requires(src => src.hasPermission(2))
          .then(Commands.argument('player', event.getArguments().STRING.create(event))
            .then(Commands.argument('type', event.getArguments().STRING.create(event))
              .executes(ctx => {
                const playerName = event.getArguments().STRING.getResult(ctx, 'player');
                const typeId = event.getArguments().STRING.getResult(ctx, 'type');
                spawnEncounter(ctx.source.server, playerName, typeId);
                return 1;
              })
            )
          )
        )
        // /horizons encounter trade <num> — select a merchant trade
        .then(Commands.literal('trade')
          .then(Commands.argument('num', event.getArguments().INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const active = player.persistentData.getString('encounter_active');
              if (active !== 'wandering_merchant') {
                player.tell('\u00a7c[Horizons] No active merchant encounter.');
                return 0;
              }

              const num = event.getArguments().INTEGER.getResult(ctx, 'num');
              if (num < 1 || num > 3) {
                player.tell('\u00a7c[Horizons] Choose 1, 2, or 3.');
                return 0;
              }

              let trades;
              try {
                trades = JSON.parse(player.persistentData.getString('encounter_trades') || '[]');
              } catch (e) {
                player.tell('\u00a7c[Horizons] Trade data not found.');
                return 0;
              }

              if (num > trades.length) {
                player.tell('\u00a7c[Horizons] Invalid trade number.');
                return 0;
              }

              const item = trades[num - 1];
              ctx.source.server.runCommandSilent('give ' + player.username + ' ' + item + ' 1');
              player.tell('\u00a7a[Horizons] Trade complete! Received item.');

              // Clear encounter
              player.persistentData.putString('encounter_active', '');
              player.persistentData.putString('encounter_trades', '');
              player.tell('\u00a77The merchant tips their hat and moves on.');

              return 1;
            })
          )
        )
        // /horizons encounter respond <choice> — generic response
        .then(Commands.literal('respond')
          .then(Commands.argument('choice', event.getArguments().STRING.create(event))
            .executes(ctx => {
              const player = ctx.source.player;
              if (!player) return 0;

              const active = player.persistentData.getString('encounter_active');
              if (!active || active.length === 0) {
                player.tell('\u00a7c[Horizons] No active encounter to respond to.');
                return 0;
              }

              const choice = event.getArguments().STRING.getResult(ctx, 'choice');
              player.tell('\u00a77You chose: \u00a7f' + choice);
              player.tell('\u00a77The encounter concludes.');

              // Grant small XP for engagement
              ctx.source.server.runCommandSilent('horizons level grantxp 5');

              // Clear encounter
              player.persistentData.putString('encounter_active', '');
              return 1;
            })
          )
        )
      )
  );
});

console.log('[Horizons] Encounter Spawner loaded');
console.log('[Horizons] Commands: /horizons encounter [spawn|trade|respond]');
