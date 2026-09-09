# Implementation Plan: DARK ZONE 0.1 Demo — Cyber Biopunk Hospital

## Overview
Build a **complete, playable 0.1 Demo** of the first level (Cyber Biopunk Hospital) with: real CC0 assets, proper level progression (Lobby→Emergency→Surgery→Underground Lab), key/fuse objectives, Nurse-07 boss fight with unique AI, win/lose screens, and polished FPS feel.

## Architecture Decisions
- **Assets**: Poly Haven (models/HDRI), ambientCG (materials), Kenney (UI/props), Mixkit/Freesound (audio) — all CC0 or explicit commercial license
- **Level structure**: Single hospital level with 4 zones separated by locked doors; streamed via zone triggers
- **Boss AI**: Separate `Nurse07Boss` component extending base Enemy with "hear→search→disappear→reappear→ambush" state machine
- **Audio**: Keep procedural Web Audio as fallback; layer downloaded CC0 sounds on top
- **Persistence**: Zustand + localStorage already works; extend for level completion

## Task List

### Phase 1: Asset Pipeline & CC0 Asset Integration
- [x] **Task 1**: Create asset manifest + download script — **Poly Haven HDRIs downloaded (6 files, 1k)**
- [ ] **Task 2**: Place downloaded HDRIs in `public/assets/hdri/` ✅ done
- [ ] **Task 3**: Create `AssetLoader` utility with GLTFLoader + DRACOLoader for future models
- [ ] **Task 4**: Build level geometry procedurally (use CyberDecor + primitives); supplement with Kenney/Sketchfab models manually
- [ ] **Task 5**: Configure HDRI environment map for realistic lighting in Level.tsx

**Checkpoint: Assets** — HDRIs loaded, tsc clean, scene renders with HDRI lighting, 0 console errors

### Phase 2: Level Layout & Progression System
- [ ] **Task 6**: Design zone graph: Lobby(start) → Emergency(locked) → Surgery(locked) → Underground Lab(locked, boss)
- [ ] **Task 7**: Implement `Door` component: locked/unlocked, keycard/fuse/key requirements, animation, audio
- [ ] **Task 8**: Implement `ObjectiveSystem`: track "find key", "insert fuse", "restore power", "defeat boss" with UI prompts
- [ ] **Task 9**: Place key items in world (keycard in Lobby, fuse in Emergency, master key in Surgery)
- [ ] **Task 10**: Create `FuseBox` interaction: insert fuse → power restored → next door unlocks + lights change

**Checkpoint: Progression** — Player can complete full loop: start → find keycard → Emergency → find fuse → Surgery → master key → Lab → boss → win

### Phase 3: Enemy AI Polish & Nurse-07 Boss
- [ ] **Task 11**: Refactor base Enemy AI: add noise system (player running/shooting makes noise), better search behavior
- [ ] **Task 12**: Create `Nurse07Boss` component with unique state machine:
  - `patrol` → `hear` (investigate noise) → `search` (at last known pos) → `vanish` (teleport to hidden spawn) → `ambush` (burst from ceiling/vent) → `chase` → `attack`
  - Boss does NOT constantly chase; prefers ambush from unexpected angles
  - Phase 2 at 50% HP: faster, spawns minions (patients), EMP disables flashlight temporarily
- [ ] **Task 13**: Add boss health bar UI, phase transition effects, death animation + cinematic

**Checkpoint: Combat** — Regular enemies patrol/react properly; Boss fight is tense, fair, uses ambush mechanic

### Phase 4: Polish — FPS Feel, Audio, UI
- [ ] **Task 14**: Weapon feedback: screen shake, muzzle flash, hit markers, impact decals, recoil pattern
- [ ] **Task 15**: Audio layer: download CC0 sounds (footsteps, doors, electricity, monster vocalizations, heartbeat, jumpscare stings); integrate with AudioManager
- [ ] **Task 16**: Inventory UI (TAB): grid, drag-drop, use/equip, weight display
- [ ] **Task 17**: Win/Lose screens: Game Over (retry/quit), Level Complete (stats, continue)
- [ ] **Task 18**: Post-processing polish: color grading (cyber horror LUT), vignette, chromatic aberration on low health
- [ ] **Task 19**: Performance: instance meshes for repeated props, texture compression, level streaming hints

**Checkpoint: Polish** — 60fps on mid hardware, audio immersive, UI complete, win/lose flow works

### Phase 5: Final Verification & Packaging
- [ ] **Task 20**: Full playthrough test (automated Playwright: start→complete level, verify 0 errors)
- [ ] **Task 21**: Build production bundle (`npm run build`), verify size, test on mobile viewport (responsive check)
- [ ] **Task 22**: Write `DEVLOG_0.1.md` with asset credits, known issues, next steps for 0.2

**Checkpoint: Release** — Production build works, all criteria met, ready to ship

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poly Haven models don't fit grid/scale | High | Pre-scale in Blender; use placeholder colliders |
| Boss AI too hard/easy | Medium | Expose tuning params in store; playtest loop |
| WebGL context loss in headless test | Low | Conservative drei params; catch errors gracefully |
| Audio sync issues | Low | Procedural fallback always works; layer downloaded sounds |
| Asset license oversight | High | Verify each asset license before commit; maintain `ASSET_LICENSES.md` |

## Open Questions
- Target FPS on what hardware baseline? (Assume: M1 Mac / GTX 1060 equivalent)
- Should 0.1 include save/load mid-level? (Current persist only saves on quit; can add manual save stations)
- Boss arena: separate room or whole Underground Lab? (Start with arena room; expand in 0.3)