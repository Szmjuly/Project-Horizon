// ============================================================
// Project Horizons — Client Scripts
// ============================================================
// File: kubejs/client_scripts/horizons_client.js
// Phase: 5
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
// ============================================================
//
// PURPOSE:
// Client-side enhancements: tooltips, item name formatting,
// quality display on items.
//
// NOTE: Full HUD overlays (nutrition bars, crime stat display,
// companion status) require a custom mod or resource pack overlay.
// This script handles what KubeJS client API supports.
// ============================================================

// ============================================================
// QUALITY TOOLTIPS — Show quality tier on food items
// ============================================================

ItemEvents.tooltip(event => {
  const QUALITY_TIERS = {
    2: { name: 'Fine',      color: '\u00a7a', stars: '\u2605' },
    3: { name: 'Superior',  color: '\u00a79', stars: '\u2605\u2605' },
    4: { name: 'Exquisite', color: '\u00a7d', stars: '\u2605\u2605\u2605' },
    5: { name: 'Legendary', color: '\u00a76', stars: '\u2605\u2605\u2605\u2605' }
  };

  // Add quality tooltip to all items
  event.addAdvanced('*', (item, advanced, text) => {
    if (!item.nbt) return;
    const q = item.nbt.getInt('horizons_quality');
    if (q >= 2 && q <= 5) {
      const tier = QUALITY_TIERS[q];
      text.add(1, Text.of(`${tier.color}${tier.stars} ${tier.name} Quality`));
    }
  });
});

// ============================================================
// CUSTOM ITEM TOOLTIPS — Extra info on Horizons items
// ============================================================

ItemEvents.tooltip(event => {
  // Kingdom currency tooltips
  event.add('horizons:currency_plains', '\u00a77Exchange: 1 Crown = 10 Gold Coins');
  event.add('horizons:currency_forest', '\u00a77Exchange: 1 Leaf = 8 Gold Coins');
  event.add('horizons:currency_mountain', '\u00a77Exchange: 1 Mark = 12 Gold Coins');
  event.add('horizons:currency_coastal', '\u00a77Exchange: 1 Pearl = 15 Gold Coins');
  event.add('horizons:currency_skyborn', '\u00a77Exchange: 1 Feather = 20 Gold Coins');

  // Crime items
  event.add('horizons:hood_of_shadows', '\u00a78Reduces NPC detection range by 60%');
  event.add('horizons:hunters_compass', '\u00a78Points toward active bounty target');
  event.add('horizons:capture_net', '\u00a78Use within 3 blocks of a weakened target');
  event.add('horizons:bail_token', '\u00a78Reduces jail sentence by 50%');

  // Precursor items
  event.add('horizons:precursor_fragment', '\u00a75An echo of ancient technology');
  event.add('horizons:precursor_artifact', '\u00a75A relic from before The Dimming');
  event.add('horizons:precursor_token', '\u00a75Currency of a forgotten civilization');

  // Sigil tooltips
  event.add('horizons:sigil_warlord', ['\u00a7dHybrid Sigil: Vanguard + Artificer', '\u00a77+20% melee damage']);
  event.add('horizons:sigil_beastmaster', ['\u00a7dHybrid Sigil: Vanguard + Cultivator', '\u00a77+15% companion trust gain']);
  event.add('horizons:sigil_pathwalker', ['\u00a7dHybrid Sigil: Vanguard + Wayfinder', '\u00a77+25% movement speed']);
  event.add('horizons:sigil_architect', ['\u00a7dHybrid Sigil: Artificer + Cultivator', '\u00a77+30% building speed']);
  event.add('horizons:sigil_voyager', ['\u00a7dHybrid Sigil: Artificer + Wayfinder', '\u00a77+20% exploration XP']);
  event.add('horizons:sigil_shepherd', ['\u00a7dHybrid Sigil: Cultivator + Wayfinder', '\u00a77+25% crop yield']);

  event.add('horizons:sigil_avatar_of_war', ['\u00a76Transcendent Sigil: Pure Vanguard', '\u00a77Regeneration during combat']);
  event.add('horizons:sigil_mind_of_forge', ['\u00a76Transcendent Sigil: Pure Artificer', '\u00a77Auto-repair tools']);
  event.add('horizons:sigil_verdant_sovereign', ['\u00a76Transcendent Sigil: Pure Cultivator', '\u00a77Passive crop growth aura']);
  event.add('horizons:sigil_eternal_walker', ['\u00a76Transcendent Sigil: Pure Wayfinder', '\u00a77No fall damage']);

  // Ascension items
  event.add('horizons:ascension_crystal', '\u00a75Required to begin an Ascension Trial');
  event.add('horizons:triple_crown', ['\u00a76The Triple Crown', '\u00a77Proof of three ascensions', '\u00a78Only the most dedicated earn this']);
});

console.log('[Horizons] Client scripts loaded');
console.log('[Horizons] Quality tooltips + item info active');
