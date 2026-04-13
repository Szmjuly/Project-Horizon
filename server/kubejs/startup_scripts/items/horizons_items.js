// ============================================================
// Project Horizons — Horizons Items (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/items/horizons_items.js
// Phase: 2
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers core Horizons items: kingdom currencies, precursor
// items, utility items, and food-tag items.
// ============================================================

StartupEvents.registry('item', event => {
  let count = 0

  // ----------------------------------------------------------
  // Kingdom Currencies (5)
  // One per kingdom, used in trade and reputation systems.
  // ----------------------------------------------------------

  event.create('horizons:currency_plains')
    .displayName('Plains Crown')
    .maxStackSize(64)
    .texture('horizons:item/currency_plains')
    .tooltip('Currency of the Plains Kingdom')
  count++

  event.create('horizons:currency_forest')
    .displayName('Forest Leaf')
    .maxStackSize(64)
    .texture('horizons:item/currency_forest')
    .tooltip('Currency of the Forest Kingdom')
  count++

  event.create('horizons:currency_mountain')
    .displayName('Mountain Mark')
    .maxStackSize(64)
    .texture('horizons:item/currency_mountain')
    .tooltip('Currency of the Mountain Kingdom')
  count++

  event.create('horizons:currency_coastal')
    .displayName('Coastal Pearl')
    .maxStackSize(64)
    .texture('horizons:item/currency_coastal')
    .tooltip('Currency of the Coastal Kingdom')
  count++

  event.create('horizons:currency_skyborn')
    .displayName('Skyborn Feather')
    .maxStackSize(64)
    .texture('horizons:item/currency_skyborn')
    .tooltip('Currency of the Skyborn Kingdom')
  count++

  // ----------------------------------------------------------
  // Precursor Items (3)
  // Relics of the ancient Precursor civilization.
  // ----------------------------------------------------------

  event.create('horizons:precursor_fragment')
    .displayName('Precursor Fragment')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/precursor_fragment')
    .tooltip('A shard of ancient Precursor technology')
  count++

  event.create('horizons:precursor_artifact')
    .displayName('Precursor Artifact')
    .maxStackSize(16)
    .rarity('rare')
    .texture('horizons:item/precursor_artifact')
    .tooltip('A partially intact Precursor device')
  count++

  event.create('horizons:precursor_token')
    .displayName('Precursor Token')
    .maxStackSize(64)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/precursor_token')
    .tooltip('A glowing token pulsing with Precursor energy')
  count++

  // ----------------------------------------------------------
  // Utility Items (3)
  // General-purpose items used across multiple systems.
  // ----------------------------------------------------------

  event.create('horizons:warp_shard')
    .displayName('Warp Shard')
    .maxStackSize(16)
    .rarity('rare')
    .texture('horizons:item/warp_shard')
    .tooltip('A crystallized fragment of warp energy')
  count++

  event.create('horizons:psychic_resonance_crystal')
    .displayName('Psychic Resonance Crystal')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/psychic_resonance_crystal')
    .tooltip('Amplifies psychic connections with Pokemon')
  count++

  event.create('horizons:trainer_card')
    .displayName('Trainer Card')
    .maxStackSize(1)
    .rarity('common')
    .texture('horizons:item/trainer_card')
    .tooltip('Your official Horizons trainer identification')
  count++

  // ----------------------------------------------------------
  // Quality Food Tag Items (1)
  // Used in the food quality upgrade system.
  // ----------------------------------------------------------

  event.create('horizons:gourmet_seasoning')
    .displayName('Gourmet Seasoning')
    .maxStackSize(64)
    .texture('horizons:item/gourmet_seasoning')
    .tooltip('Used to upgrade food quality - apply to food in crafting grid')
  count++

  console.log('[Horizons] horizons_items registered: ' + count + ' items')
})
