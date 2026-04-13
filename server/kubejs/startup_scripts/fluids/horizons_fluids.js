// ============================================================
// Project Horizons — Horizons Fluids (Startup Registration)
// ============================================================
// File: kubejs/startup_scripts/fluids/horizons_fluids.js
// Phase: 4
// Dependencies: KubeJS
// ============================================================

StartupEvents.registry('fluid', event => {
  let count = 0

  event.create('horizons:warp_propellant')
    .displayName('Warp Propellant')
  count++

  event.create('horizons:refined_ether')
    .displayName('Refined Ether')
  count++

  event.create('horizons:quality_wine_base')
    .displayName('Quality Wine Base')
  count++

  console.log('[Horizons] horizons_fluids registered: ' + count + ' fluids')
})
