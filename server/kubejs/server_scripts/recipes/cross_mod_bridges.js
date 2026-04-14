// ============================================================
// Project Horizons — Cross-Mod Recipe Bridges
// ============================================================
// File: kubejs/server_scripts/recipes/cross_mod_bridges.js
// Phase: 1
// Dependencies: Create, IE, Stellaris, Lightman's Currency, AE2,
//   TFMG, Diesel Generators, Power Grid, New Age, Central Kitchen
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
//   6. AE2 Bridges      — Create/IE materials → AE2 components
//   7. TFMG ↔ IE        — Steel and creosote bridges
//   8. TFMG ↔ Diesel    — Fuel processing chain
//   9. Power Grid ↔ CC&A — Electricity conversion
//  10. New Age ↔ TFMG    — Energiser steel components
//  11. Central Kitchen   — Food automation bridges
//  12. TFMG → AE2       — Steel casing alternatives
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

  // =========================================================
  // 7. AE2 BRIDGES — Create + IE → Applied Energistics 2
  // AE2 is the endgame storage tier. These recipes bridge
  // Create/IE materials into AE2 crafting chains.
  // Only active if AE2 mod is loaded.
  // =========================================================

  if (Platform.isLoaded('ae2')) {
    console.log('[Horizons] AE2 detected — registering AE2 recipe bridges');

    // Certus Quartz from Create crushing — crush quartz ore into crystals
    event.recipes.create.crushing([
      'ae2:certus_quartz_crystal',
      'ae2:certus_quartz_dust'
    ], 'ae2:quartz_block').id('horizons:ae2/crush_certus_block');

    // Fluix Crystal from Create mixing — combine charged certus + nether quartz + redstone
    event.recipes.create.mixing(
      'ae2:fluix_crystal',
      [
        'ae2:charged_certus_quartz_crystal',
        'minecraft:quartz',
        'minecraft:redstone'
      ]
    ).id('horizons:ae2/mix_fluix');

    // Fluix Dust from Create crushing
    event.recipes.create.crushing([
      'ae2:fluix_dust'
    ], 'ae2:fluix_crystal').id('horizons:ae2/crush_fluix');

    // ME Controller requires Refined Storage 2 components as progression bridge
    // RS2 controller + fluix blocks + engineering processors = ME controller
    event.shaped('ae2:controller', [
      'FPF',
      'PCP',
      'FPF'
    ], {
      F: 'ae2:fluix_block',
      P: 'ae2:engineering_processor',
      C: 'refinedstorage:controller'
    }).id('horizons:ae2/me_controller_bridge');

    // Remove default ME controller recipe (replaced by bridge)
    event.remove({ id: 'ae2:network/blocks/controller' });

    // Sky Stone from Stellaris meteor processing
    // Create crushing a meteor block yields sky stone
    event.recipes.create.crushing([
      '2x ae2:sky_stone_block',
      'ae2:certus_quartz_crystal'
    ], 'stellaris:meteorite').id('horizons:ae2/crush_meteor_skystone');

    // IE Arc Furnace: Sky Stone → Smooth Sky Stone (smelting alternative)
    event.smelting('ae2:smooth_sky_stone_block', 'ae2:sky_stone_block')
      .id('horizons:ae2/smelt_skystone');

    // Inscriber Silicon from Create mixing
    event.recipes.create.mixing(
      'ae2:silicon',
      [
        'minecraft:quartz',
        'minecraft:quartz',
        'minecraft:coal'
      ]
    ).heated().id('horizons:ae2/mix_silicon');

    console.log('[Horizons] AE2 recipe bridges registered');
  }

  // =========================================================
  // 8. TFMG ↔ IMMERSIVE ENGINEERING — Steel & Creosote
  // Unify steel production and creosote processing between
  // TFMG and IE so players can use either mod's machines.
  // =========================================================

  if (Platform.isLoaded('tfmg') && Platform.isLoaded('immersiveengineering')) {
    console.log('[Horizons] TFMG + IE detected — registering steel/creosote bridges');

    // TFMG steel ingot from IE blast furnace as alternative output
    event.recipes.create.mixing(
      'tfmg:steel_ingot',
      [
        'immersiveengineering:ingot_steel'
      ]
    ).id('horizons:tfmg_ie/steel_conversion');

    // IE steel ingot from TFMG steel (reverse conversion)
    event.recipes.create.mixing(
      'immersiveengineering:ingot_steel',
      [
        'tfmg:steel_ingot'
      ]
    ).id('horizons:tfmg_ie/steel_conversion_reverse');

    // IE treated wood from TFMG creosote oil via Create deploying
    event.recipes.create.filling(
      'immersiveengineering:treated_wood_horizontal',
      [
        'minecraft:oak_planks',
        Fluid.of('tfmg:creosote', 250)
      ]
    ).id('horizons:tfmg_ie/creosote_treated_wood');

    console.log('[Horizons] TFMG + IE bridges registered');
  }

  // =========================================================
  // 9. TFMG ↔ DIESEL GENERATORS — Fuel Processing
  // Connect TFMG distillation products to Diesel Generators
  // fuel system for a unified petroleum processing chain.
  // =========================================================

  if (Platform.isLoaded('tfmg') && Platform.isLoaded('createdieselgenerators')) {
    console.log('[Horizons] TFMG + Diesel Generators detected — registering fuel bridges');

    // Diesel fuel from TFMG diesel via Create mixing
    event.recipes.create.mixing(
      Fluid.of('createdieselgenerators:diesel', 1000),
      [
        Fluid.of('tfmg:diesel', 1000)
      ]
    ).id('horizons:tfmg_diesel/diesel_conversion');

    // Diesel Generators biodiesel from TFMG kerosene + plant oil
    event.recipes.create.mixing(
      Fluid.of('createdieselgenerators:biodiesel', 500),
      [
        Fluid.of('tfmg:kerosene', 250),
        Fluid.of('create:honey', 250)
      ]
    ).heated().id('horizons:tfmg_diesel/biodiesel_blend');

    // Shared crude oil — TFMG crude to Diesel Generators crude
    event.recipes.create.mixing(
      Fluid.of('createdieselgenerators:crude_oil', 1000),
      [
        Fluid.of('tfmg:crude_oil', 1000)
      ]
    ).id('horizons:tfmg_diesel/crude_oil_conversion');

    console.log('[Horizons] TFMG + Diesel Generators bridges registered');
  }

  // =========================================================
  // 10. POWER GRID ↔ CRAFTS & ADDITIONS — Electricity
  // Allow conversion between Power Grid electricity and
  // RF/FE power via Create Crafts & Additions components.
  // =========================================================

  if (Platform.isLoaded('powergrid') && Platform.isLoaded('createaddition')) {
    console.log('[Horizons] Power Grid + CC&A detected — registering power bridges');

    // Power Grid transformer core from CC&A electric motor + copper coils
    event.shaped('powergrid:incomplete_transformer_core', [
      'CEC',
      'CMC',
      'CEC'
    ], {
      C: 'createaddition:copper_spool',
      E: 'create:electron_tube',
      M: 'createaddition:electric_motor'
    }).id('horizons:powergrid_cca/transformer_core');

    // CC&A alternator using Power Grid wire for higher-tier conversion
    event.shaped('createaddition:alternator', [
      ' C ',
      'GMG',
      ' C '
    ], {
      C: 'powergrid:wire',
      G: 'create:cogwheel',
      M: 'create:shaft'
    }).id('horizons:powergrid_cca/alternator_bridge');

    console.log('[Horizons] Power Grid + CC&A bridges registered');
  }

  // =========================================================
  // 11. CREATE: NEW AGE ↔ TFMG — Energiser Steel
  // New Age energiser recipes using TFMG steel components
  // for higher-tier energy generation.
  // =========================================================

  if (Platform.isLoaded('create_new_age') && Platform.isLoaded('tfmg')) {
    console.log('[Horizons] New Age + TFMG detected — registering energiser bridges');

    // Solar heating plate from TFMG steel + Create brass
    event.shaped('create_new_age:basic_solar_heating_plate', [
      'GGG',
      'ERE',
      'SSS'
    ], {
      G: 'minecraft:glass',
      E: 'create:electron_tube',
      R: 'minecraft:redstone_block',
      S: 'tfmg:steel_ingot'
    }).id('horizons:newage_tfmg/solar_heating_plate');

    // Nuclear casing from TFMG heavy plates + Create precision mechanism
    event.shaped('create_new_age:reactor_casing', [
      'SPS',
      'PMP',
      'SPS'
    ], {
      S: 'tfmg:heavy_plate',
      P: 'tfmg:steel_ingot',
      M: 'create:precision_mechanism'
    }).id('horizons:newage_tfmg/reactor_casing');

    console.log('[Horizons] New Age + TFMG bridges registered');
  }

  // =========================================================
  // 12. CENTRAL KITCHEN ↔ FARMER'S DELIGHT ↔ CROPTOPIA
  // Automated cooking bridges between food mods using
  // Create's mechanical crafting and mixing.
  // =========================================================

  if (Platform.isLoaded('create_central_kitchen') && Platform.isLoaded('farmersdelight')) {
    console.log('[Horizons] Central Kitchen + FD detected — registering food bridges');

    // Automated dough from Central Kitchen mixer using FD wheat flour
    // NOTE: Create 6.0 mixing recipe API requires specific ingredient format.
    // Using shapeless as a fallback since create:mixing parsing changed in 1.21.
    event.shapeless('2x farmersdelight:wheat_dough', [
      'farmersdelight:wheat_flour',
      'farmersdelight:wheat_flour',
      'minecraft:water_bucket'
    ]).id('horizons:kitchen/auto_dough');

    // Bulk cooking oil from mixing sunflower seeds (if Croptopia + Rustic Delight loaded)
    if (Platform.isLoaded('croptopia') && Platform.isLoaded('rusticdelight')) {

      // Mixed salad via Create deployer-friendly shapeless
      event.shapeless('croptopia:fruit_salad', [
        'croptopia:strawberry',
        'croptopia:blueberry',
        'croptopia:banana',
        'farmersdelight:iron_knife'
      ]).id('horizons:kitchen/croptopia_fruit_salad').damageIngredient('farmersdelight:iron_knife');
    }

    console.log('[Horizons] Central Kitchen food bridges registered');
  }

  // =========================================================
  // 13. TFMG → AE2 — Steel Casing Alternatives
  // TFMG steel casings as alternative for AE2 components,
  // giving industrial players an alternate path to AE2.
  // =========================================================

  if (Platform.isLoaded('tfmg') && Platform.isLoaded('ae2')) {
    console.log('[Horizons] TFMG + AE2 detected — registering steel casing bridges');

    // AE2 quartz fiber from TFMG steel + certus quartz via Create mixing
    event.recipes.create.mixing(
      '4x ae2:quartz_fiber',
      [
        'ae2:certus_quartz_dust',
        'tfmg:steel_ingot',
        'ae2:certus_quartz_dust'
      ]
    ).heated().id('horizons:tfmg_ae2/quartz_fiber');

    // AE2 cell component housing using TFMG steel casing
    event.shaped('ae2:cell_component_1k', [
      'QRQ',
      'RSR',
      'QRQ'
    ], {
      Q: 'ae2:certus_quartz_crystal',
      R: 'minecraft:redstone',
      S: 'tfmg:steel_casing'
    }).id('horizons:tfmg_ae2/1k_cell_component');

    // ME chest alternative recipe using TFMG steel casing
    event.shaped('ae2:me_chest', [
      'SGS',
      'FCF',
      'SSS'
    ], {
      S: 'tfmg:steel_ingot',
      G: 'minecraft:glass',
      F: 'ae2:fluix_crystal',
      C: 'tfmg:steel_casing'
    }).id('horizons:tfmg_ae2/me_chest_alt');

    console.log('[Horizons] TFMG + AE2 bridges registered');
  }

  console.log('[Horizons] Cross-mod recipe bridges registered');
});
