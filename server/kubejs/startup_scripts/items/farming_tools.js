// ============================================================
// Project Horizons — Farming Tools (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/items/farming_tools.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers tiered farming tools: hoes, watering cans,
// pruning shears, seed bags, and scythes. Actual stat
// differentiation comes from datapacks.
// ============================================================

StartupEvents.registry('item', event => {
  let count = 0

  // ----------------------------------------------------------
  // Tiered Hoes (6 tiers)
  // Registered as basic items; datapack handles stats.
  // ----------------------------------------------------------

  event.create('horizons:copper_hoe')
    .displayName('Copper Hoe')
    .maxStackSize(1)
    .texture('horizons:item/copper_hoe')
    .tooltip('A basic copper farming hoe')
  count++

  event.create('horizons:steel_hoe')
    .displayName('Steel Hoe')
    .maxStackSize(1)
    .texture('horizons:item/steel_hoe')
    .tooltip('A sturdy steel farming hoe')
  count++

  event.create('horizons:brass_hoe')
    .displayName('Brass Hoe')
    .maxStackSize(1)
    .texture('horizons:item/brass_hoe')
    .tooltip('A precision brass farming hoe')
  count++

  event.create('horizons:enchanted_hoe')
    .displayName('Enchanted Hoe')
    .maxStackSize(1)
    .rarity('rare')
    .glow(true)
    .texture('horizons:item/enchanted_hoe')
    .tooltip('A magically enhanced farming hoe')
  count++

  event.create('horizons:precursor_hoe')
    .displayName('Precursor Hoe')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/precursor_hoe')
    .tooltip('An ancient Precursor farming implement')
  count++

  event.create('horizons:heartwood_hoe')
    .displayName('Heartwood Hoe')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/heartwood_hoe')
    .tooltip('Carved from the heart of the World Tree')
  count++

  // ----------------------------------------------------------
  // Watering Cans (3 tiers)
  // ----------------------------------------------------------

  event.create('horizons:copper_watering_can')
    .displayName('Copper Watering Can')
    .maxStackSize(1)
    .texture('horizons:item/copper_watering_can')
    .tooltip('Waters a 1x1 area')
  count++

  event.create('horizons:iron_watering_can')
    .displayName('Iron Watering Can')
    .maxStackSize(1)
    .texture('horizons:item/iron_watering_can')
    .tooltip('Waters a 3x3 area')
  count++

  event.create('horizons:gold_watering_can')
    .displayName('Gold Watering Can')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/gold_watering_can')
    .tooltip('Waters a 5x5 area')
  count++

  // ----------------------------------------------------------
  // Specialty Farming Tools
  // ----------------------------------------------------------

  event.create('horizons:pruning_shears')
    .displayName('Pruning Shears')
    .maxStackSize(1)
    .texture('horizons:item/pruning_shears')
    .tooltip('Trims and shapes crops for quality bonuses')
  count++

  event.create('horizons:seed_bag')
    .displayName('Seed Bag')
    .maxStackSize(64)
    .texture('horizons:item/seed_bag')
    .tooltip('Holds and auto-plants seeds in a line')
  count++

  event.create('horizons:scythe')
    .displayName('Scythe')
    .maxStackSize(1)
    .texture('horizons:item/scythe')
    .tooltip('Harvests crops in a wide area')
  count++

  console.log('[Horizons] farming_tools registered: ' + count + ' items')
})
