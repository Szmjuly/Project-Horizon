// ============================================================
// Project Horizons — World Items (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/items/world_items.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers world event items: festival tokens (12 festivals),
// eclipse shards, meteor fragments, discovery journals,
// encounter maps, and watcher eyes.
// ============================================================

StartupEvents.registry('item', event => {
  let count = 0

  // ----------------------------------------------------------
  // Festival Tokens (12)
  // One token per in-game festival, earned by participation.
  // ----------------------------------------------------------

  event.create('horizons:token_first_bloom')
    .displayName('First Bloom Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_first_bloom')
    .tooltip('Festival of First Bloom commemorative token')
  count++

  event.create('horizons:token_sunfire')
    .displayName('Sunfire Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_sunfire')
    .tooltip('Sunfire Festival commemorative token')
  count++

  event.create('horizons:token_moonrise')
    .displayName('Moonrise Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_moonrise')
    .tooltip('Moonrise Festival commemorative token')
  count++

  event.create('horizons:token_harvest')
    .displayName('Harvest Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_harvest')
    .tooltip('Harvest Festival commemorative token')
  count++

  event.create('horizons:token_tidal')
    .displayName('Tidal Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_tidal')
    .tooltip('Tidal Festival commemorative token')
  count++

  event.create('horizons:token_stormcall')
    .displayName('Stormcall Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_stormcall')
    .tooltip('Stormcall Festival commemorative token')
  count++

  event.create('horizons:token_ember')
    .displayName('Ember Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_ember')
    .tooltip('Emberfeast Festival commemorative token')
  count++

  event.create('horizons:token_frost')
    .displayName('Frost Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_frost')
    .tooltip('Frostfall Festival commemorative token')
  count++

  event.create('horizons:token_starfall')
    .displayName('Starfall Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_starfall')
    .tooltip('Starfall Festival commemorative token')
  count++

  event.create('horizons:token_ancestors')
    .displayName('Ancestors Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_ancestors')
    .tooltip('Feast of Ancestors commemorative token')
  count++

  event.create('horizons:token_eclipse')
    .displayName('Eclipse Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_eclipse')
    .tooltip('Eclipse Festival commemorative token')
  count++

  event.create('horizons:token_renewal')
    .displayName('Renewal Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/token_renewal')
    .tooltip('Festival of Renewal commemorative token')
  count++

  // ----------------------------------------------------------
  // World Event Drops
  // ----------------------------------------------------------

  event.create('horizons:eclipse_shard')
    .displayName('Eclipse Shard')
    .maxStackSize(64)
    .rarity('rare')
    .glow(true)
    .texture('horizons:item/eclipse_shard')
    .tooltip('A shard imbued with the power of an eclipse')
  count++

  event.create('horizons:meteor_fragment')
    .displayName('Meteor Fragment')
    .maxStackSize(64)
    .rarity('uncommon')
    .texture('horizons:item/meteor_fragment')
    .tooltip('A smoldering fragment from a fallen meteor')
  count++

  // ----------------------------------------------------------
  // Exploration Items
  // ----------------------------------------------------------

  event.create('horizons:discovery_journal')
    .displayName('Discovery Journal')
    .maxStackSize(1)
    .rarity('rare')
    .texture('horizons:item/discovery_journal')
    .tooltip('Records your discoveries across the world')
  count++

  event.create('horizons:encounter_map')
    .displayName('Encounter Map')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/encounter_map')
    .tooltip('Marks locations of notable encounters')
  count++

  // ----------------------------------------------------------
  // Rare Drops
  // ----------------------------------------------------------

  event.create('horizons:watcher_eye')
    .displayName('Watcher Eye')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/watcher_eye')
    .tooltip('A rare drop from the enigmatic Watcher Visit event')
  count++

  console.log('[Horizons] world_items registered: ' + count + ' items')
})
