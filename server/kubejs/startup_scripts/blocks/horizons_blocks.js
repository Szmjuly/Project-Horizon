// ============================================================
// Project Horizons — Horizons Blocks (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/blocks/horizons_blocks.js
// Phase: 3
// Dependencies: KubeJS
// Docs: HORIZONS_INTEGRATIONS.md
//
// Registers custom blocks: dungeon portals, bounty boards,
// companion housing, route markers, precursor tech, warp
// anchors, ascension altars, kingdom banners, and stages.
// Also registers corresponding BlockItems for each.
// ============================================================

StartupEvents.registry('block', event => {
  let count = 0

  // ----------------------------------------------------------
  // Gate Portal
  // The entrance to gate dungeon instances.
  // ----------------------------------------------------------
  event.create('horizons:gate_portal')
    .displayName('Gate Portal')
    .hardness(50)
    .resistance(1200)
    .requiresTool(true)
    .lightLevel(10)
    .texture('horizons:block/gate_portal')
  count++

  // ----------------------------------------------------------
  // Bounty Board
  // Physical board where bounties are posted and claimed.
  // ----------------------------------------------------------
  event.create('horizons:bounty_board')
    .displayName('Bounty Board')
    .hardness(2)
    .resistance(3)
    .texture('horizons:block/bounty_board')
  count++

  // ----------------------------------------------------------
  // Companion Hut
  // Housing for farm-bound Pokemon companions.
  // ----------------------------------------------------------
  event.create('horizons:companion_hut')
    .displayName('Companion Hut')
    .hardness(3)
    .resistance(3)
    .texture('horizons:block/companion_hut')
  count++

  // ----------------------------------------------------------
  // Route Marker
  // Waypoint block for the trade route network.
  // ----------------------------------------------------------
  event.create('horizons:route_marker')
    .displayName('Route Marker')
    .hardness(4)
    .resistance(6)
    .lightLevel(5)
    .texture('horizons:block/route_marker')
  count++

  // ----------------------------------------------------------
  // Precursor Terminal
  // Interactive terminal for ancient Precursor technology.
  // ----------------------------------------------------------
  event.create('horizons:precursor_terminal')
    .displayName('Precursor Terminal')
    .hardness(10)
    .resistance(15)
    .requiresTool(true)
    .lightLevel(8)
    .texture('horizons:block/precursor_terminal')
  count++

  // ----------------------------------------------------------
  // Warp Anchor
  // Fast travel destination point.
  // ----------------------------------------------------------
  event.create('horizons:warp_anchor')
    .displayName('Warp Anchor')
    .hardness(8)
    .resistance(12)
    .requiresTool(true)
    .lightLevel(12)
    .texture('horizons:block/warp_anchor')
  count++

  // ----------------------------------------------------------
  // Ascension Altar
  // Starting point for Ascension trials.
  // ----------------------------------------------------------
  event.create('horizons:ascension_altar')
    .displayName('Ascension Altar')
    .hardness(15)
    .resistance(20)
    .requiresTool(true)
    .lightLevel(10)
    .texture('horizons:block/ascension_altar')
  count++

  // ----------------------------------------------------------
  // Kingdom Banner
  // Territory marker for kingdom claims.
  // ----------------------------------------------------------
  event.create('horizons:kingdom_banner')
    .displayName('Kingdom Banner')
    .hardness(1)
    .resistance(1)
    .texture('horizons:block/kingdom_banner')
  count++

  // ----------------------------------------------------------
  // Festival Stage
  // Platform used during festival events.
  // ----------------------------------------------------------
  event.create('horizons:festival_stage')
    .displayName('Festival Stage')
    .hardness(2)
    .resistance(3)
    .lightLevel(8)
    .texture('horizons:block/festival_stage')
  count++

  console.log('[Horizons] horizons_blocks registered: ' + count + ' blocks')
})

// ----------------------------------------------------------
// Block Items
// Register an inventory item for each custom block.
// ----------------------------------------------------------
StartupEvents.registry('item', event => {
  let blockItems = [
    { id: 'horizons:gate_portal_item',       name: 'Gate Portal',        texture: 'horizons:item/gate_portal' },
    { id: 'horizons:bounty_board_item',      name: 'Bounty Board',       texture: 'horizons:item/bounty_board' },
    { id: 'horizons:companion_hut_item',     name: 'Companion Hut',      texture: 'horizons:item/companion_hut' },
    { id: 'horizons:route_marker_item',      name: 'Route Marker',       texture: 'horizons:item/route_marker' },
    { id: 'horizons:precursor_terminal_item', name: 'Precursor Terminal', texture: 'horizons:item/precursor_terminal' },
    { id: 'horizons:warp_anchor_item',       name: 'Warp Anchor',        texture: 'horizons:item/warp_anchor' },
    { id: 'horizons:ascension_altar_item',   name: 'Ascension Altar',    texture: 'horizons:item/ascension_altar' },
    { id: 'horizons:kingdom_banner_item',    name: 'Kingdom Banner',     texture: 'horizons:item/kingdom_banner' },
    { id: 'horizons:festival_stage_item',    name: 'Festival Stage',     texture: 'horizons:item/festival_stage' }
  ]

  blockItems.forEach(b => {
    event.create(b.id)
      .displayName(b.name)
      .maxStackSize(64)
      .texture(b.texture)
  })

  console.log('[Horizons] horizons_blocks BlockItems registered: ' + blockItems.length + ' items')
})
