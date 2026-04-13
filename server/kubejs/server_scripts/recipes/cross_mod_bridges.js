// ============================================================
// Project Horizons — Cross-Mod Recipe Bridges
// ============================================================
// File: kubejs/server_scripts/recipes/cross_mod_bridges.js
// Phase: 1
// Dependencies: Create, IE, Stellaris, Lightman's Currency
// Docs: HORIZONS_INTEGRATIONS.md Section 1.1
// ============================================================
//
// PURPOSE:
// Bridge recipes between Create, Immersive Engineering, Stellaris,
// and Lightman's Currency so players progress through a unified
// tech tree rather than parallel isolated mod progressions.
//
// RECIPE CHAINS:
//   1. Coin Minting     — Create Press + metal = Lightman's coins
//   2. Rocket Components — IE alloys + Create mechanisms = Stellaris parts
//   3. Space Suit        — IE steel + Create brass + vanilla = Stellaris suits
//   4. Power Bridge      — Create SU ↔ FE conversion via Crafts & Additions
//   5. Advanced Materials — Cross-mod ingredient chains
// ============================================================

ServerEvents.recipes(event => {
  console.log('[Horizons] Registering cross-mod recipe bridges...');

  // =========================================================
  // 1. COIN MINTING — Create Pressing → Lightman's Coins
  // Players use Create's mechanical press to mint coins
  // =========================================================

  // Copper Coin — press copper ingot
  event.recipes.create.pressing(
    'lightmanscurrency:coin_copper',
    'minecraft:copper_ingot'
  ).id('horizons:minting/copper_coin');

  // Iron Coin — press iron ingot
  event.recipes.create.pressing(
    'lightmanscurrency:coin_iron',
    'minecraft:iron_ingot'
  ).id('horizons:minting/iron_coin');

  // Gold Coin — press gold ingot
  event.recipes.create.pressing(
    'lightmanscurrency:coin_gold',
    'minecraft:gold_ingot'
  ).id('horizons:minting/gold_coin');

  // Emerald Coin — press emerald
  event.recipes.create.pressing(
    'lightmanscurrency:coin_emerald',
    'minecraft:emerald'
  ).id('horizons:minting/emerald_coin');

  // Diamond Coin — press diamond
  event.recipes.create.pressing(
    'lightmanscurrency:coin_diamond',
    'minecraft:diamond'
  ).id('horizons:minting/diamond_coin');

  // =========================================================
  // 2. ROCKET COMPONENTS — IE + Create → Stellaris
  // Rocket parts require cross-mod crafting chains
  // =========================================================

  // Rocket Nose Cone — IE steel plates shaped with Create brass
  event.shaped('stellaris:rocket_nose_cone', [
    ' S ',
    'SBS',
    'B B'
  ], {
    S: 'immersiveengineering:plate_steel',
    B: 'create:brass_sheet'
  }).id('horizons:rocket/nose_cone');

  // Rocket Fin — IE steel + Create precision mechanism
  event.shaped('stellaris:rocket_fin', [
    'S  ',
    'SSP',
    'S  '
  ], {
    S: 'immersiveengineering:plate_steel',
    P: 'create:precision_mechanism'
  }).id('horizons:rocket/fin');

  // Rocket Engine — complex multi-material
  event.shaped('stellaris:rocket_engine', [
    'BPB',
    'SES',
    'S S'
  ], {
    B: 'create:brass_ingot',
    P: 'create:precision_mechanism',
    S: 'immersiveengineering:plate_steel',
    E: 'create:electron_tube'
  }).id('horizons:rocket/engine');

  // Fuel Module — IE tank + Create fluid handling
  event.shaped('stellaris:fuel_module', [
    'SBS',
    'BTB',
    'SBS'
  ], {
    S: 'immersiveengineering:plate_steel',
    B: 'create:brass_sheet',
    T: 'stellaris:t2_tank'
  }).id('horizons:rocket/fuel_module');

  // =========================================================
  // 3. SPACE SUIT — IE Steel + Create components
  // Space suits require industrial-age materials
  // =========================================================

  // Space Suit Helmet
  event.shaped('stellaris:space_suit_helmet', [
    'SPS',
    'SES',
    '   '
  ], {
    S: 'immersiveengineering:ingot_steel',
    P: 'minecraft:glass_pane',
    E: 'create:electron_tube'
  }).id('horizons:space_suit/helmet');

  // Space Suit Chestplate
  event.shaped('stellaris:space_suit_chestplate', [
    'S S',
    'SOS',
    'SBS'
  ], {
    S: 'immersiveengineering:ingot_steel',
    O: 'stellaris:oxygen_tank',
    B: 'create:brass_ingot'
  }).id('horizons:space_suit/chestplate');

  // Space Suit Leggings
  event.shaped('stellaris:space_suit_leggings', [
    'SSS',
    'S S',
    'B B'
  ], {
    S: 'immersiveengineering:ingot_steel',
    B: 'create:brass_ingot'
  }).id('horizons:space_suit/leggings');

  // Space Suit Boots
  event.shaped('stellaris:space_suit_boots', [
    '   ',
    'S S',
    'B B'
  ], {
    S: 'immersiveengineering:ingot_steel',
    B: 'create:brass_ingot'
  }).id('horizons:space_suit/boots');

  // =========================================================
  // 4. ADVANCED MATERIALS — Cross-mod ingredient chains
  // Create components that use IE materials and vice versa
  // =========================================================

  // Steel Mechanism — IE steel + Create mechanism pattern
  // A higher-tier precision mechanism for advanced recipes
  event.shaped('2x create:precision_mechanism', [
    ' S ',
    'SPS',
    ' R '
  ], {
    S: 'immersiveengineering:ingot_steel',
    P: 'create:precision_mechanism',
    R: 'create:polished_rose_quartz'
  }).id('horizons:materials/steel_mechanism');

  // Treated Casing — IE treated wood + Create andesite
  // Bridge between IE and Create building blocks
  event.shaped('2x create:andesite_casing', [
    ' T ',
    'TAT',
    ' T '
  ], {
    T: 'immersiveengineering:treated_wood_horizontal',
    A: 'minecraft:andesite'
  }).id('horizons:materials/treated_andesite_casing');

  // =========================================================
  // 5. COOKING BRIDGES — Farmer's Delight integration
  // Create automation meets Farmer's Delight recipes
  // =========================================================

  // Allow Create deployer to use FD knives for cutting
  // (This is handled by Create: Slice & Dice mod, but we add
  //  a shapeless backup recipe for manual crafting)
  event.shapeless('4x farmersdelight:straw', [
    'farmersdelight:iron_knife',
    'minecraft:wheat',
    'minecraft:wheat'
  ]).id('horizons:cooking/manual_straw').damageIngredient('farmersdelight:iron_knife');

  // =========================================================
  // 6. REMOVE CONFLICTING RECIPES
  // Remove default recipes that conflict with our bridges
  // =========================================================

  // Remove default Stellaris rocket part recipes (replaced by our cross-mod versions)
  event.remove({ id: 'stellaris:rocket_nose_cone' });
  event.remove({ id: 'stellaris:rocket_fin' });
  event.remove({ id: 'stellaris:rocket_engine' });
  event.remove({ id: 'stellaris:fuel_module' });
  event.remove({ id: 'stellaris:space_suit_helmet' });
  event.remove({ id: 'stellaris:space_suit_chestplate' });
  event.remove({ id: 'stellaris:space_suit_leggings' });
  event.remove({ id: 'stellaris:space_suit_boots' });

  console.log('[Horizons] Cross-mod recipe bridges registered');
});
