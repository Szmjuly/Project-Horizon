// ============================================================
// Project Horizons — Ascension Items (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/items/ascension_items.js
// Phase: 4
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers Ascension system items: Hybrid Class Sigils,
// Transcendent Sigils, Shadow Sigils, Ascension Crystals,
// Lore Codex, and Triple Crown.
// ============================================================

StartupEvents.registry('item', event => {
  let count = 0

  // ----------------------------------------------------------
  // Hybrid Class Sigils (6)
  // Earned by mastering two base classes.
  // ----------------------------------------------------------

  event.create('horizons:sigil_warlord')
    .displayName('Sigil of the Warlord')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_warlord')
    .tooltip('Hybrid Sigil: Warrior + Commander')
  count++

  event.create('horizons:sigil_beastmaster')
    .displayName('Sigil of the Beastmaster')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_beastmaster')
    .tooltip('Hybrid Sigil: Tamer + Ranger')
  count++

  event.create('horizons:sigil_pathwalker')
    .displayName('Sigil of the Pathwalker')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_pathwalker')
    .tooltip('Hybrid Sigil: Explorer + Scholar')
  count++

  event.create('horizons:sigil_architect')
    .displayName('Sigil of the Architect')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_architect')
    .tooltip('Hybrid Sigil: Builder + Engineer')
  count++

  event.create('horizons:sigil_voyager')
    .displayName('Sigil of the Voyager')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_voyager')
    .tooltip('Hybrid Sigil: Sailor + Merchant')
  count++

  event.create('horizons:sigil_shepherd')
    .displayName('Sigil of the Shepherd')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_shepherd')
    .tooltip('Hybrid Sigil: Farmer + Healer')
  count++

  // ----------------------------------------------------------
  // Transcendent Sigils (4)
  // Pinnacle achievements of heroic Ascension paths.
  // ----------------------------------------------------------

  event.create('horizons:sigil_avatar_of_war')
    .displayName('Sigil of the Avatar of War')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_avatar_of_war')
    .tooltip('Transcendent Sigil: Ultimate Warrior')
  count++

  event.create('horizons:sigil_mind_of_forge')
    .displayName('Sigil of the Mind of Forge')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_mind_of_forge')
    .tooltip('Transcendent Sigil: Ultimate Crafter')
  count++

  event.create('horizons:sigil_verdant_sovereign')
    .displayName('Sigil of the Verdant Sovereign')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_verdant_sovereign')
    .tooltip('Transcendent Sigil: Ultimate Nature Master')
  count++

  event.create('horizons:sigil_eternal_walker')
    .displayName('Sigil of the Eternal Walker')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_eternal_walker')
    .tooltip('Transcendent Sigil: Ultimate Explorer')
  count++

  // ----------------------------------------------------------
  // Shadow Sigils (6)
  // Dark-path Ascension rewards for criminal mastery.
  // ----------------------------------------------------------

  event.create('horizons:sigil_shadow_reaver')
    .displayName('Sigil of the Shadow Reaver')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_shadow_reaver')
    .tooltip('Shadow Sigil: Death from the Darkness')
  count++

  event.create('horizons:sigil_wild_hunter')
    .displayName('Sigil of the Wild Hunter')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_wild_hunter')
    .tooltip('Shadow Sigil: Predator of the Wilds')
  count++

  event.create('horizons:sigil_nightcloak')
    .displayName('Sigil of the Nightcloak')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_nightcloak')
    .tooltip('Shadow Sigil: Master of Deception')
  count++

  event.create('horizons:sigil_smuggler_king')
    .displayName('Sigil of the Smuggler King')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_smuggler_king')
    .tooltip('Shadow Sigil: Lord of the Black Market')
  count++

  event.create('horizons:sigil_void_pirate')
    .displayName('Sigil of the Void Pirate')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_void_pirate')
    .tooltip('Shadow Sigil: Terror of the Void Seas')
  count++

  event.create('horizons:sigil_wandering_outlaw')
    .displayName('Sigil of the Wandering Outlaw')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/sigil_wandering_outlaw')
    .tooltip('Shadow Sigil: Nomad Beyond the Law')
  count++

  // ----------------------------------------------------------
  // Ascension Utility Items (3)
  // ----------------------------------------------------------

  event.create('horizons:ascension_crystal')
    .displayName('Ascension Crystal')
    .maxStackSize(16)
    .rarity('epic')
    .texture('horizons:item/ascension_crystal')
    .tooltip('Crystallized power required for Ascension trials')
  count++

  event.create('horizons:lore_codex')
    .displayName('Lore Codex')
    .maxStackSize(1)
    .rarity('rare')
    .texture('horizons:item/lore_codex')
    .tooltip('A compendium of Horizons lore and history')
  count++

  event.create('horizons:triple_crown')
    .displayName('Triple Crown')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/triple_crown')
    .tooltip('Proof of mastering three Ascension paths')
  count++

  console.log('[Horizons] ascension_items registered: ' + count + ' items')
})
