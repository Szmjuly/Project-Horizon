// ============================================================
// Project Horizons — Crime Items (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/items/crime_items.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers items used by the Crime & Bounty system:
// stealth gear, bounty tools, duel tokens, and jail items.
// ============================================================

StartupEvents.registry('item', event => {
  let count = 0

  // ----------------------------------------------------------
  // Stealth & Detection
  // ----------------------------------------------------------

  event.create('horizons:hood_of_shadows')
    .displayName('Hood of Shadows')
    .maxStackSize(1)
    .rarity('epic')
    .texture('horizons:item/hood_of_shadows')
    .tooltip('Reduces NPC detection range by 60%')
  count++

  // ----------------------------------------------------------
  // Bounty Hunting
  // ----------------------------------------------------------

  event.create('horizons:hunters_compass')
    .displayName("Hunter's Compass")
    .maxStackSize(1)
    .rarity('rare')
    .texture('horizons:item/hunters_compass')
    .tooltip('Points toward active bounty target')
  count++

  event.create('horizons:capture_net')
    .displayName('Capture Net')
    .maxStackSize(16)
    .rarity('uncommon')
    .texture('horizons:item/capture_net')
    .tooltip('Used for stealth captures')
  count++

  // ----------------------------------------------------------
  // Dueling
  // ----------------------------------------------------------

  event.create('horizons:duel_challenge_token')
    .displayName('Duel Challenge Token')
    .maxStackSize(64)
    .rarity('common')
    .texture('horizons:item/duel_challenge_token')
    .tooltip('Challenge a player to a Cobblemon duel')
  count++

  // ----------------------------------------------------------
  // Jail & Bail
  // ----------------------------------------------------------

  event.create('horizons:bail_token')
    .displayName('Bail Token')
    .maxStackSize(1)
    .rarity('rare')
    .texture('horizons:item/bail_token')
    .tooltip('Reduces jail sentence by 50%')
  count++

  // ----------------------------------------------------------
  // Crime Status
  // ----------------------------------------------------------

  event.create('horizons:crime_stat_display')
    .displayName('Crime Stat Display')
    .maxStackSize(1)
    .rarity('common')
    .texture('horizons:item/crime_stat_display')
    .tooltip('Shows your current Crime Stat')
  count++

  console.log('[Horizons] crime_items registered: ' + count + ' items')
})
