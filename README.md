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

| 平台 | 地址 |
|------|------|
| GitHub Pages | https://z1302065902-cloud.github.io/dark-zone/ |
| Vercel | https://dark-zone-pi.vercel.app |
| itch.io | 即将上线 |

构建使用相对路径 `base: './'`，资源经 `import.meta.env.BASE_URL` 解析，可在任意子路径部署。

## 💖 支持

喜欢这个游戏？请支持我：[爱发电](https://afdian.com)（支持者将解锁更多关卡与内容）
