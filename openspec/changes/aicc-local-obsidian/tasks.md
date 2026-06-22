# Tasks · aicc-local-obsidian（分阶段；每阶段独立验收、app 全程可跑）

## ✅ 评审已定（2026-06-22）
- Gateway = **Node**；vault 目录 `vault/AICC/{concepts,articles}`；公开 ECS 阅读页保留不变（本变更不动）。

## Phase 1 · 本地 Gateway 骨架（最小可跑）
- [ ] 起本地 server（绑 `127.0.0.1` + 单用户 token），serve 现有 React build
- [ ] LLM 代理端点：前端调用改走 Gateway，key 进 server `.env`（浏览器不再持 key）
- [ ] 启动器：`npm run`/脚本一键起 + 自动开 localhost
- [ ] 验收：localhost 可用全流程；浏览器存储/网络无 key；费曼跑通

## Phase 2 · Obsidian vault 作认知存储
- [ ] Gateway 读写配置的 vault 文件夹（路径设置项）
- [ ] 概念/成稿写 atomic Markdown（frontmatter status/source-week + 三域 tag + `[[wikilink]]`：relation / 融合）
- [ ] localStorage 降级为缓存，vault 为权威（启动从 vault 重建缓存）
- [ ] 验收：发布后 vault 出现 .md；Obsidian 打开能看到笔记 + 图谱浮现

## Phase 3 · 认知图谱归 Obsidian
- [ ] AICC 自建 SVG 图谱退役（或改为读 vault 渲染的轻量着色视图）
- [ ] 文档化 Obsidian graph color group（按 status 着色）配置
- [ ] 验收：图谱来自 vault 链接，无第二份图谱数据

## Phase 4 · 雷达消费 vault
- [ ] AICC 启动检测 vault `AICC-Input/` 新周 JSON → 拉进流水线
- [ ] 个人自用去掉 ingest→git→build→ECS（采集仍由本地 Cowork 产 JSON 落 vault）
- [ ] 验收：新周 JSON 落 vault 后，AICC 自动多一期

## Phase 5 · 开源化（后续独立推进）
- [ ] 打包分发（npx / 单二进制 → Tauri/Electron 桌面 App，包同一 Gateway）
- [ ] 采集内置进 server（启动检查 + LLM 联网采集），turnkey、不依赖 Cowork
- [ ] 开源仓库 + README（隐私卖点：key/第二大脑永不离开你的设备）

## ✅ 纪律 Gate（每阶段 apply 后）
- [ ] `tsc`/`build` 通过；浏览器/本地验收 + 截图
- [ ] 动 LLM 契约 → 真机冒烟
- [ ] UI 改动 → 刷 `design/live` 基线
- [ ] `SPEC.md` 同步（架构/存储契约：§3 部署、§4.5 存储、§3.6 雷达）
- [ ] `/opsx:sync` 并入 `openspec/specs/local-architecture` → `/opsx:archive`（建议每阶段一次或整体收尾一次）
- [ ] commit/push → 查 README
