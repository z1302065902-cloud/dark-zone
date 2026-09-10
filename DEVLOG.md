# DARK ZONE 开发日志（断点续传）

## 2026-09-09 赛博恐怖视觉层完成 ✅

### 本次改动
- **新建 `src/components/environment/CyberDecor.tsx`**（~18KB）：
  - `HoloAd` — 全息广告 shader（切片位移 glitch + 扫描线 + 色彩分离 + 闪烁）
  - `SignText` — CanvasTexture 霓虹中文区域标牌（急诊区/手术区/实验室/地下研究所/电梯/赛博生化医院）
  - `SteamPlane` — 体积蒸汽飘散 shader（绿色消毒蒸汽/蓝色/粉色雾气）
  - `MonsterShadow` — 墙上怪物剪影投影（周期出现/隐没，随机间隔 6~40s，"先见影后见身"）
  - `BioTank` — 生化发光罐 + 绿色点光源
  - `PipeRun`（管线+发光环）、`NeonEdge`（霓虹夜灯条，断电变暗）、`RedAlarmLight`（红色警报灯）
  - `DynamicLightController` — **34 秒断电循环**：预闪烁警告 → 全黑断电 → 红色警报灯接管
  - `ambientEvents` — 模块级事件总线（blackout/alarm/preFlicker/time，每帧更新，灯光读取）
- **重写 Level.tsx**：
  - drei `MeshReflectorMaterial` 湿地面反射（512 分辨率保守参数）
  - 暗靛蓝墙体 + 青/品红霓虹上下装饰条
  - 中央大厅（reception 桌 + CRT 终端）、医疗推车、储物柜、生物污染污渍
  - 8 盏 CeilingLight（闪烁 + 断电联动，随机短路闪光）
  - 垂落电线 + 火花点光、BioTank、管线、4 块 MonsterShadow
  - 3 块 HoloAd + 6 块区域标牌
  - 体积雾 VolumetricFog（fbm 噪声，读相机位置）

### 修复的 Bug
- **`enemyPos.clone is not a function`**（Enemy.tsx 3 处，每帧 14k 次报错）：rapier `translation()` 返回的是普通 `{x,y,z}` 对象不是 THREE.Vector3 → 包一层 `new THREE.Vector3(t.x, t.y, t.z)`
- CyberDecor：`matRef.current` 赋值移入 useMemo（不要在 primitive 上挂 ref，类型和 R3F 语义都更稳）
- DynamicLightController 断电逻辑重写（原来 `pos > 1.0` 永不触发，黑屏永不解锁；新逻辑 0~3% 淡出恢复 → 88%~94% 渐入+预闪烁 → 94%+ 全黑）

### 验证结果（Playwright + PIL 像素分析）
- **47 秒全程 0 console 错误**（含断电窗口），tsc 0 错误
- 亮度验证断电循环：t=12s avg 16.4/62%亮 → t=32s avg 8.3/**20%亮**（真黑）→ t=35s avg 17.2/63%（恢复）
- HUD 正常（HP 100/100 电击枪 50/50），W 移动/F 手电/E 互动无报错
- 场景色彩签名：2% 青色霓虹 + 0.5% 品红（暗色恐怖基调，霓虹点缀）

### 待办
1. 用户浏览器试玩（localhost:5173），反馈亮度/手感/断电气氛
2. 下载 Poly Haven 医院 3D 资产 → public/assets/，替换占位几何体
3. **护士-07 Boss AI**：听声→搜索→消失→异区重现→突袭（改 Enemy.tsx 状态机）
4. 第一关流程：找钥匙 → 太平间 → Boss 战
5. 后期色调分级（后处理）

### 备忘
- 测试：`npx tsc --noEmit`；Playwright 截图到 /tmp，PIL 分析亮度
- vite 后台：`cd /Users/zsy/dark-zone && nohup npx vite --host > /tmp/darkzone-vite.log 2>&1 &`
- 断电循环参数：`CyberDecor.tsx` DynamicLightController，cycle=34s

## 2026-09-12 E2E 全链打通（fireWeapon 修复）
- **问题**：`__dz.fireWeapon()` 打 boss 不掉血。根因：事件只在 `isFiring` 上打标，真正开枪的 `fire()` 由 useFrame 轮询触发，headless 下 RAF 不跑 → fire() 从未执行。
- **修复**：`WeaponSystem` 用 `fireRef` 持有最新 `fire()`，`dz:fire-weapon` 事件处理器**同步调用** `fireRef.current()`，不依赖帧循环。保留 isFiring 兜底。
- **E2E 关键参数**：three.js camera rotation.y=0 时 forward 是 -z，瞄准公式 `rotY=atan2(-dx,-dz)`；fusebox 触发距离 <2（用 -18,-20.5）；boss 每枪前重置相机方向 + 900ms 等 fireRate。
- **验证**：`/tmp/dz-e2e-final.js` 全链 PASS（9 目标 + levelcomplete + 0 错误），tsc --noEmit 干净。

## 2026-09-12 itch.io 部署成功（HTML + 可收费）
- **创建游戏页**：Playwright Firefox 持久化 profile（复制 cookie sqlite 到 /tmp/dz-itch-profile）驱动 https://itch.io/game/new
- **突破**：前端 React 提交按钮不稳定（selectize 隐藏、submit 按钮时有时无），改用**页面内 fetch POST FormData**（带 csrf_token + cookie，绕过 React 前端校验）
- **枚举踩坑**：type 合法值 = `default|flash|unity|java|html`（不是 html5）；embed_type = `frame|maximized`；size_type = `manual|auto`；short_text ≤120 字符（中文按多字节计数，纯英文 108 字符过）
- **结果**：https://zsy2026.itch.io/dark-zone（id 4993039），type=html，embed frame 960x540，published 公开，Games › Free + Support This Game（$0 or donate 默认收费通道）
- **butler push**：`butler push dist/ zsy2026/dark-zone:html5` → upload #19177149 → build #1964591，12.85 MiB
- **E2E 验证 itch CDN**：`https://html-classic.itch.zone/html/19177149-1964591/index.html?debug=1` 全链 PASS（9 目标 + levelcomplete + 0 错误）
- 脚本：scripts/itch-create|editpost|embed|publish|verify-public.mjs（fetch POST 模式）
