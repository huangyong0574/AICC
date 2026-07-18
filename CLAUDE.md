# AICC · Claude Code 会话指令

AICC（AI Cognition Connector）：本地优先的「第二大脑」应用——认知雷达（周报）→ 深度计划 → 费曼学习 → 创作成文 → Obsidian 认知图谱。React 18 + TS(strict) + Vite；本地 Node Gateway（`server/gateway.mjs`，launchd 常驻 `localhost:8787`）；认知数据唯一来源 = Obsidian vault（`~/Documents/Obsidian Vault/AICC项目`），localStorage 仅缓存。

## 起手（新会话必读）
1. 读 `HANDOFF.md`（交接总纲）→ `SPEC.md`（产品唯一事实来源）
2. `git pull`，确认 local == GitHub HEAD

## 铁律（violations = 返工）
- **SPEC.md 同步**：动契约/状态机/路由/页面职责，先同步 SPEC 再写码
- **数据唯一来源**：所有用户数据必须落 vault（写穿透 + hydrate 可恢复），绝不允许只存浏览器；纯 UI 偏好除外
- **凭证绝不入库**：key 只在 `server/.env`（gitignored）；每次 commit 前扫 `git diff --cached | grep -E 'sk-|ghp_'`
- **精确 stage**：只 add 本次涉及的文件，禁用 `git add -A`（曾误提交无关项目）
- **UI 改动**：commit/部署前刷新 `design/live/` 基线（`export DASHSCOPE_API_KEY=$(grep '^DASHSCOPE_API_KEY=' server/.env | cut -d= -f2-)` 后 `node scripts/export-pages.mjs`）
- **验收 → commit/push → 查 README**；部署 ECS 已持久授权（`npm run build -- --base=/aicc/` + `bash scripts/deploy-dist.sh`），部署后重建本地 dist（`npm run build`）

## OpenSpec 工作流（实质编码主流程）
改「系统该做什么」/契约/数据/多文件 → `propose → 停下等用户评审 → apply → archive`（`/opsx:*` 或 `openspec-*` skills）；纯视觉/小修直接做。约定见 `openspec/project.md`。

## 关键设计模式（勿重蹈覆辙）
- 「结构化数据 + 固定前端模板」取代 LLM 自由生成 SVG/HTML（`Step1Route`/`Step3Blueprint`）
- LLM 生成必须 **grounding 在雷达 insight 材料**上（warmup/步骤讲解均传材料，禁止编造数字/机制）
- 费曼角色 key `biz/dev/internal` 语义 = 链接 CEO/CTO/业务运营负责人（key 不可改，兼容已存笔记）
- 概念 id/slug 是稳定主键；标题可变，文件名/链接防撞名靠 id（`server/vault.mjs resolveFileName`）

## 常用
- 本地跑：`npm run dev`（5188，`/api` 代理 8787）；正式：gateway 常驻读 `dist/`（改 UI 只需 `npm run build`；改 `server/*.mjs` 才 `launchctl kickstart -k gui/$(id -u)/com.aicc.gateway`）
- 沟通用简体中文；技术名词/代码/commit 保留原文
