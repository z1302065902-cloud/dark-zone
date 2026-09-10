# DARK ZONE · 暗区

第一人称 3D 恐怖潜行游戏（Three.js / React / R3F / Rapier 物理引擎）。
你在深夜被困在一家废弃的地下医院，停电、怪物出没——找到钥匙卡、恢复电力、击败 BOSS、逃出生天。

[▶️ 立即游玩](https://z1302065902-cloud.github.io/dark-zone/) · 中 / English 双语

## 🎮 玩法

- **目标链**：找钥匙卡 → 打开急诊门 → 找保险丝 → 开启电箱 → 恢复电力 → 找万能钥匙 → 进入实验室 → 击败 BOSS → 逃离医院
- 武器：电击枪（Stun Gun），切枪、瞄准、开火
- 潜行：手电筒、体力系统、HUD、暂停菜单
- 完整音效 + 黑暗氛围

## 🕹️ 操作

| 按键 | 功能 |
|------|------|
| WASD | 移动 |
| 鼠标 | 视角 |
| 左键 | 开火 |
| E / F | 互动（拾取、开门、插保险丝） |
| 数字键 | 切换武器 |
| Esc | 暂停 |
| L | 中/英切换 |

## 📦 开发

```bash
npm install
npm run dev      # http://localhost:5174/?debug=1
npm run build    # tsc -b && vite build → dist/
```

E2E 全链验证（9 目标 + 击败 BOSS + 逃离 + 0 控制台错误）：

```bash
node scripts/e2e-chain.mjs [baseUrl]
```

## 🌐 部署

| 平台 | 地址 | 模式 |
|------|------|------|
| GitHub Pages | https://z1302065902-cloud.github.io/dark-zone/ | 免费试玩（Demo） |
| Vercel | https://dark-zone-pi.vercel.app | 免费试玩（Demo） |
| itch.io | https://zsy2026.itch.io/dark-zone | 免费试玩（Demo） |
| 爱发电 | https://afdian.com/item/170b3b9caced11f197865254001e7c00 | 完整版 ¥7 |

构建使用相对路径 `base: './'`，资源经 `import.meta.env.BASE_URL` 解析，可在任意子路径部署。

### 免费 / 完整版（v1.0.0 起）
- **在线免费端（Demo）**：可玩至第 4 个目标（恢复电力），此后展示完整版解锁页。
- **完整版**（任选其一即解锁全部 9 个目标 + BOSS 战 + 存档点）：
  1. 爱发电购买离线包（解压后双击「启动游戏.command / .bat」，本地运行自动为完整版）；
  2. 输入解锁码（`DZ-XXXX-XXXX-XXXX`，主菜单「开始游戏」→ 到达解锁墙时输入）；
  3. URL 参数 `?full=1`。
- 测试桥 `?debug=1` 自动为完整版（E2E 全链验证用）。

## 💖 支持

喜欢这个游戏？请支持我：[爱发电 · DARK ZONE 完整版](https://afdian.com/item/170b3b9caced11f197865254001e7c00)（¥7，支持者获得完整离线版，付款后私信「补发」获取下载）

在线免费游玩为试玩版，完整内容（后续章节 + 最终 BOSS）通过爱发电支持解锁。
