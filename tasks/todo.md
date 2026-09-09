# DARK ZONE 0.1 Demo — Task Checklist

## Phase 1: Asset Pipeline & CC0 Asset Integration
- [x] Task 1: Create asset manifest + download script — Poly Haven HDRIs downloaded (6 files, 1k)
- [x] Task 2: Set up `public/assets/` structure and place downloaded assets (HDRIs done)
- [ ] Task 3: Create `AssetLoader` utility with GLTFLoader + DRACOLoader for compressed models
- [ ] Task 4: Build level geometry procedurally (use CyberDecor + primitives); supplement with Kenney/Sketchfab models manually
- [ ] Task 5: Configure HDRI environment map for realistic lighting in Level.tsx

**Checkpoint: Assets**
- [ ] `npx tsc --noEmit` passes
- [ ] Scene loads with HDRI lighting, no pink textures
- [ ] Playwright: 0 console errors, scene renders

## Phase 2: Level Layout & Progression System
- [ ] Task 6: Design zone graph: Lobby(start) → Emergency(locked) → Surgery(locked) → Underground Lab(locked, boss)
- [ ] Task 7: Implement `Door` component: locked/unlocked, keycard/fuse/key requirements, animation, audio
- [ ] Task 8: Implement `ObjectiveSystem`: track "find key", "insert fuse", "restore power", "defeat boss" with UI prompts
- [ ] Task 9: Place key items in world (keycard in Lobby, fuse in Emergency, master key in Surgery)
- [ ] Task 10: Create `FuseBox` interaction: insert fuse → power restored → next door unlocks + lights change

**Checkpoint: Progression**
- [ ] Full loop playable: start → keycard → Emergency → fuse → Surgery → master key → Lab → boss → win
- [ ] `npx tsc --noEmit` passes
- [ ] Playwright: 0 console errors, objectives update in UI

## Phase 3: Enemy AI Polish & Nurse-07 Boss
- [ ] Task 11: Refactor base Enemy AI: add noise system (player running/shooting makes noise), better search behavior
- [ ] Task 12: Create `Nurse07Boss` component with unique state machine:
  - `patrol` → `hear` → `search` → `vanish` → `ambush` → `chase` → `attack`
  - Phase 2 at 50% HP: faster, spawns patients, EMP disables flashlight
- [ ] Task 13: Add boss health bar UI, phase transition effects, death animation + cinematic

**Checkpoint: Combat**
- [ ] Regular enemies patrol/react properly
- [ ] Boss fight is tense, fair, uses ambush mechanic
- [ ] `npx tsc --noEmit` passes
- [ ] Playwright: 0 console errors during boss fight

## Phase 4: Polish — FPS Feel, Audio, UI
- [ ] Task 14: Weapon feedback: screen shake, muzzle flash, hit markers, impact decals, recoil pattern
- [ ] Task 15: Audio layer: download CC0 sounds; integrate with AudioManager (footsteps, doors, electricity, monster vocals, heartbeat, jumpscare)
- [ ] Task 16: Inventory UI (TAB): grid, drag-drop, use/equip, weight display
- [ ] Task 17: Win/Lose screens: Game Over (retry/quit), Level Complete (stats, continue)
- [ ] Task 18: Post-processing polish: color grading (cyber horror LUT), vignette, chromatic aberration on low health
- [ ] Task 19: Performance: instance meshes, texture compression, level streaming hints

**Checkpoint: Polish**
- [ ] 60fps on mid hardware
- [ ] Audio immersive, UI complete
- [ ] Win/lose flow works
- [ ] `npx tsc --noEmit` passes
- [ ] Playwright: full playthrough 0 errors

## Phase 5: Final Verification & Packaging
- [ ] Task 20: Full playthrough test (automated Playwright)
- [ ] Task 21: Production build (`npm run build`), verify size, mobile viewport check
- [ ] Task 22: Write `DEVLOG_0.1.md` with asset credits, known issues, next steps for 0.2

**Checkpoint: Release**
- [ ] Production build works
- [ ] All acceptance criteria met
- [ ] Ready to ship
---
## 当前 5 项打磨进度（12345）
- [x] **1. Boss 战实弹端到端验证**（2026-09-09）：真实开火→hitMarker→bossHP 400→0→defeat_boss 达成，0 console 错误
- [ ] **2. 敌人 AI 升级**：巡逻/听觉/视觉/追踪/攻击/搜索/死亡状态机（代码已就位，需实测验证听力/搜索）
- [x] **3. 武器完善**：弹药/换弹/瞄准反馈（ADS、准星收缩、hit marker、换弹条、stunGun 长硬直）——已落地
- [x] **4. 声音系统完整接入**：dzSound Web Audio 合成器 + 脚步/呼吸/心跳/jumpscare/门/配电箱全部接入——已落地
- [x] **5. CC0 医院资产替换占位几何体**（Kenney Furniture Kit 28 个 GLB 484KB，锁柜/医疗推车/前台/病床/沙发/植物已替换，含加载失败降级）
- [ ] 用户本地试玩 + 部署上线（需确认域名购买）
