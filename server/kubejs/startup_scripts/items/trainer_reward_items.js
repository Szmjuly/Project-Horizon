// ============================================================
// Project Horizons — Trainer Reward Items
// ============================================================
// File: kubejs/startup_scripts/items/trainer_reward_items.js
// Phase: 2
// Dependencies: KubeJS
// ============================================================
//
// PURPOSE:
// Registers gym badges, sigil fragments, elite/champion sigils,
// and legendary quest items used in RCT trainer loot tables.
// ============================================================

StartupEvents.registry('item', event => {
  var count = 0

  // ----------------------------------------------------------
  // Gym Badges (8) — Awarded for defeating faction gym leaders
  // ----------------------------------------------------------

  event.create('horizons:plains_badge')
    .displayName('Plains Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/plains_badge')
    .tooltip('Proof of victory over the Plains Gym Leader')
  count++

  event.create('horizons:canopy_badge')
    .displayName('Canopy Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/canopy_badge')
    .tooltip('Proof of victory over the Canopy Gym Leader')
  count++

  event.create('horizons:forge_badge')
    .displayName('Forge Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/forge_badge')
    .tooltip('Proof of victory over the Forge Gym Leader')
  count++

  event.create('horizons:tide_badge')
    .displayName('Tide Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/tide_badge')
    .tooltip('Proof of victory over the Tide Gym Leader')
  count++

  event.create('horizons:ember_badge')
    .displayName('Ember Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/ember_badge')
    .tooltip('Proof of victory over the Ember Gym Leader')
  count++

  event.create('horizons:circuit_badge')
    .displayName('Circuit Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/circuit_badge')
    .tooltip('Proof of victory over the Circuit Gym Leader')
  count++

  event.create('horizons:eclipse_badge')
    .displayName('Eclipse Badge')
    .maxStackSize(1)
    .rarity('uncommon')
    .texture('horizons:item/eclipse_badge')
    .tooltip('Proof of victory over the Eclipse Gym Leader')
  count++

  event.create('horizons:dragon_badge')
    .displayName('Dragon Badge')
    .maxStackSize(1)
    .rarity('rare')
    .texture('horizons:item/dragon_badge')
    .tooltip('Proof of victory over the Dragon Gym Leader')
  count++

  // ----------------------------------------------------------
  // Sigil Fragments & Elite/Champion Sigils
  // ----------------------------------------------------------

  event.create('horizons:sigil_fragment')
    .displayName('Sigil Fragment')
    .maxStackSize(64)
    .rarity('uncommon')
    .texture('horizons:item/sigil_fragment')
    .tooltip('A shard of crystallized power. Collect enough to forge a sigil.')
  count++

  event.create('horizons:elite_sigil')
    .displayName('Elite Sigil')
    .maxStackSize(1)
    .rarity('rare')
    .glow(true)
    .texture('horizons:item/elite_sigil')
    .tooltip('Awarded by the Elite Four. A mark of exceptional skill.')
  count++

  event.create('horizons:champion_sigil')
    .displayName('Champion Sigil')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/champion_sigil')
    .tooltip('The highest honor. Proof of Champion-level mastery.')
  count++

  // ----------------------------------------------------------
  // Legendary Quest Items
  // ----------------------------------------------------------

  event.create('horizons:kingdom_mark')
    .displayName('Kingdom Mark')
    .maxStackSize(64)
    .rarity('uncommon')
    .texture('horizons:item/kingdom_mark')
    .tooltip('A mark of recognition from a kingdom faction')
  count++

  event.create('horizons:legendary_key')
    .displayName('Legendary Key')
    .maxStackSize(1)
    .rarity('epic')
    .glow(true)
    .texture('horizons:item/legendary_key')
    .tooltip('Unlocks the vault of the Champion')
  count++

  console.log('[Horizons] trainer_reward_items registered: ' + count + ' items')
})
