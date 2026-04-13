# Project Horizons — Client Mods

**NeoForge 1.21.1** · Optional but recommended · ~55 mods · 10-12 GB RAM

> These are client-side enhancements. The server runs without them. Players install these for performance, visuals, and quality of life.

---

## About Dual-Sided Mods

Several mods from the server list have client-facing components that come bundled automatically. You don't install them separately, but they're worth knowing about:

- **Tough As Nails** — thirst bar HUD, temperature indicator, canteen overlay
- **MineColonies** — colony management UI, blueprint builder, worker status screens
- **Radical Cobblemon Trainers** — Trainer Card item UI, battle intro overlays
- **Jade** — block/entity info overlay on crosshair
- **JEI** — recipe viewer

If the server has these mods, your client automatically gets their UIs when you connect. The mods listed below are *additional* enhancements you choose yourself.

---

## Rendering Pipeline

**Pick ONE path.** Do not mix Sodium and Embeddium — they conflict fatally.

### Path A — Sodium + Iris ⭐ *Recommended*

Official, actively maintained, native Iris shader support on NeoForge 1.21.1+.

- **Sodium (NeoForge)** — rendering optimization foundation
- **Sodium Extra** — animation toggles, particle control, fog
- **Reese's Sodium Options** — better settings UI with categories
- **Iris Shaders (NeoForge)** — shader pack loader (v1.8.12+)
- **Sodium Dynamic Lights** — held-item lighting
- **Sodium Leaf Culling** — hide unseen leaf faces
- **Sodium/Embeddium Options API** — cross-platform settings

### Path B — Embeddium + Oculus

Alternative for maximum mod compatibility in edge cases.

- **Embeddium** — Sodium fork for NeoForge
- **Chloride (Embeddium Extras)** — OptiFine-style video settings
- **Oculus** — Iris fork for Forge/NeoForge (shader loader)
- **Embeddium Dynamic Lights** — dynamic lighting

---

## Performance — Memory & Loading

- **ModernFix** — 20-30% RAM reduction, faster startup
- **FerriteCore** — block state memory reduction (stacks with ModernFix)
- **Lazy DFU** — defer DataFixer init
- **ImmediatelyFast** — GUI/HUD/text rendering optimization
- **Entity Culling** — skip rendering entities behind walls
- **More Culling** — extended culling for block entities, maps, beacons
- **Smooth Chunk Save** — eliminate "Saving World" stutters

---

## Performance — Network & Loading

- **Connectivity** — fix timeouts and packet handling in large modpacks
- **Login Protection** — invulnerability during chunk load
- **Loading Backgrounds** — custom loading screen with pack branding
- **FancyMenu** — custom main menu (Horizons-themed)
- **Splash Animation** — animated loading bar

---

## Visual Enhancement

- **Distant Horizons** — LOD system, see terrain at 256+ chunks
- **Ambient Sounds** — dynamic ambient audio per biome/dimension
- **Sound Physics Remastered** — reverb in caves, muffled sounds through walls
- **Effective** — waterfall particles, water splash effects
- **Falling Leaves** — leaf particles drift from trees
- **Particle Rain** — rain splashes, snow accumulation
- **Better Clouds** — volumetric cloud rendering
- **Not Enough Animations** — third-person animation improvements
- **Model Gap Fix** — remove grid-line artifacts between blocks
- **Chat Heads** — player face next to chat messages
- **3D Skin Layers** — render outer skin layer as 3D geometry
- **Legendary Tooltips** — styled item tooltips with rarity borders (shows nutrition + quality tiers)
- **Equipment Compare** — comparison tooltip for gear
- **Advancement Plaques** — large animated quest/advancement toasts
- **Presence Footsteps** — material-based footstep sounds
- **AmbientEnvironment** — biome-tinted lighting
- **Eating Animation** — first-person eating/drinking animations

---

## QoL — Navigation & Info

- **JourneyMap** — minimap, world map, waypoints
- **Just Enough Items (JEI)** — recipe viewer
- **JEI Integration** — mob drops, villager trades, dungeon loot in JEI
- **Just Enough Resources (JER)** — ore distribution, loot tables in JEI
- **Just Enough Professions** — villager profession info
- **Jade** — block/entity info on crosshair
- **AppleSkin** — food saturation and hunger preview *(crucial for Tough As Nails + nutrition)*

---

## QoL — Inventory & Interaction

- **Mouse Tweaks** — click-and-drag inventory management
- **Inventory Profiles Next** — auto-sort, locked slots, gear sets, auto-refill
- **TrashSlot** — dedicated inventory trash slot
- **Inventory Essentials** — ctrl-click transfer shortcuts
- **Crafting Tweaks** — rotate, balance, clear crafting grid
- **Controlling** — search and filter keybinds
- **Configured** — in-game mod config GUI
- **Better Third Person** — improved third-person camera
- **Zoomify** — configurable zoom keybind
- **Carry On** — pick up and carry tile entities and mobs
- **Toast Control** — manage vanilla toast notifications
- **Shulker Box Tooltip** — preview contents on hover
- **Dark Loading Screen** — dark background during loading
- **No Chat Reports** — disable Mojang chat reporting

---

## Audio *(primarily audio, cross-listed from Visual)*

- **Ambient Sounds** — biome and dimension atmosphere
- **Sound Physics Remastered** — reverb, occlusion, echo
- **Presence Footsteps** — surface-material footsteps
- 🔵 **Custom Music Resource Pack** — contextual soundtrack (we build)

---

## Shader Packs

Not mods — `.zip` files placed in the `shaderpacks` folder. Require Iris (Path A) or Oculus (Path B).

### Tier 1 — Recommended for the Ghibli / Anime Aesthetic

| # | Shader | Style | Perf | DH Compat |
|---|---|---|---|---|
| 1 | **Complementary Reimagined** ⭐ | Warm, volumetric, golden light | Medium | ✅ Excellent |
| 2 | **Complementary Unbound** | Reimagined's successor, more features | Medium-High | ✅ Excellent |
| 3 | **BSL Shaders** | Cinematic, stylized, "anime screenshot" | Medium | ⚠️ Basic |
| 4 | **Bliss Shaders** | Photorealistic, dreamy fog | High | ✅ Good |

**Primary recommendation: Complementary Reimagined.** Warm golden light matches the pastoral overworld, best Distant Horizons partner.

### Tier 2 — Performance-Friendly

| # | Shader | Style | Perf | DH Compat |
|---|---|---|---|---|
| 5 | **Super Duper Vanilla** | Subtle improvements, vanilla-faithful | Low | ✅ Good |
| 6 | **Sildur's Vibrant** | Classic, multiple presets | Low-High | ⚠️ Partial |
| 7 | **AstraLex** | BSL fork, better performance | Medium | Planned |
| 8 | **Rethinking Voxels** | Voxel path tracing (RTX-like) | Medium-High | ✅ Good |

### Tier 3 — Specialty

| # | Shader | Style | Perf | DH Compat |
|---|---|---|---|---|
| 9 | **Photon** | Physically-based rendering | High | ✅ Good |
| 10 | **Nostalgia** | Warm retro, dreamy | Medium | ⚠️ Partial |
| 11 | **Shrimple** | Lightweight path tracing | Medium | ✅ Good |
| 12 | **MakeUp Ultra Fast** | Minimal impact, clean improvements | Very Low | ❌ No |

### Shader Config Notes

- Shadow distance: **4-6 chunks** (not 16) for modded performance
- Enable volumetric fog for dungeons, disable in space via shader settings
- Disable motion blur (interferes with combat readability)
- Bloom: low-medium (high bloom washes out Create machines)
- With Distant Horizons, use a Tier 1 or Tier 2 shader with ✅ DH compat

---

## Hardware Presets

### Pathfinder · Mid-Range

*GTX 1660 / RTX 3060 / RX 6600 · 16 GB system RAM*

- **Rendering:** Sodium + Iris
- **Shader:** Complementary Reimagined (Medium)
- **Distant Horizons:** On (128 chunks)
- **Performance:** ModernFix, FerriteCore, Entity Culling, ImmediatelyFast
- **Visual:** Ambient Sounds, Sound Physics, Falling Leaves, Legendary Tooltips
- **QoL:** Full QoL suite
- **RAM allocation:** 10 GB
- **Expected:** 60-90 FPS @ 12 render distance

### Explorer · High-End

*RTX 3080+ / RX 7800 XT+ · 32 GB system RAM*

- **Rendering:** Sodium + Iris
- **Shader:** Complementary Unbound (High) or Bliss
- **Distant Horizons:** On (256 chunks)
- **Performance:** Full performance suite
- **Visual:** All visual mods
- **QoL:** Full QoL suite
- **RAM allocation:** 12 GB
- **Expected:** 80-144 FPS @ 16 render distance

### Survivor · Low-End

*GTX 1050 / RX 570 / integrated · 8 GB system RAM*

- **Rendering:** Embeddium (lighter on older hardware)
- **Shader:** Super Duper Vanilla Lite, or none
- **Distant Horizons:** Off
- **Performance:** ModernFix, FerriteCore, Entity Culling, ImmediatelyFast, Clumps
- **Visual:** Ambient Sounds only
- **QoL:** JEI, JourneyMap, Mouse Tweaks, AppleSkin
- **RAM allocation:** 8 GB
- **Expected:** 30-60 FPS @ 8 render distance

---

## Compatibility Warnings

**Do NOT combine:**

- Embeddium + Sodium → same function, will crash
- Oculus + Iris → same function, Oculus = Embeddium path, Iris = Sodium path
- OptiFine + anything here → conflicts with all modern rendering mods
- Multiple minimaps → JourneyMap OR Xaero's, not both
- Inventory Profiles Next + Inventory Sorter → sorting conflicts

**Known limitations:**

- **Voxy** is Fabric-native. Community NeoForge port is alpha-quality with broken shader support. Stick with Distant Horizons.
- **Nvidium** disables itself when shaders are enabled (safe to install, just won't help with shaders active)

---

## Counts

| Category | Mods |
|---|---:|
| Rendering pipeline (pick one path) | 4-7 |
| Memory & Loading | 7 |
| Network & Loading Screens | 5 |
| Visual Enhancement | 17 |
| Navigation & Info | 7 |
| Inventory & Interaction | 14 |
| **Client total** | **~54** |
| Shader packs (player choice) | 1-3 .zip files |

**Combined with ~110 server mods + ~27 custom systems = ~191 total** — within NeoForge 1.21.1 proven stability range (ATM10 runs 500+).
