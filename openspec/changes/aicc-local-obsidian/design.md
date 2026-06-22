## Context

现状：React+Vite SPA 部署 ECS `/aicc/`；数据全在浏览器 localStorage（`aicc-cognition-state`/`aicc-feynman-notes`/`aicc-creation-*`/`aicc-llm-cfg`）；LLM 浏览器直连 DashScope。雷达：本地 Cowork 定时任务采集 → `{weekId}.json` 落 Obsidian `AICC-Input/` → launchd `radar-publish.sh` ingest→git→build→ECS。`server/README.md` 有 Flask+SQLite 后端设计（未实现）。

参考实现：**OpenClaw**（Gateway 进程 localhost-only + web UI/CLI/desktop，OpenAI 兼容代理推理后端）；**QoderWake**（设备常驻、用户决定什么上云、Harness-First 持久记忆）。

## Goals / Non-Goals

- **Goals**：本地 Gateway（私有、可信、BYOK）+ Obsidian vault 作认知存储 + 图谱即 vault 链接 + 雷达消费契约。dogfood 即可用，路径通向开源桌面 App。
- **Non-Goals（本变更）**：公开 ECS 雷达阅读页去留（独立）；MCP 钉钉库；Tauri 打包（留到开源阶段）；App 内置雷达采集（dogfood 阶段仍用 Cowork）。

## Decisions

### 1. 本地 Gateway（仿 OpenClaw）
本地 server **绑 `127.0.0.1`（不绑 0.0.0.0）+ 单用户 bearer token**；持 key（`.env`/钥匙串），**代理 DashScope（OpenAI 兼容）**，浏览器/UI 永不碰 key。serve 现有 React build + 提供 API（认知状态 / vault 读写 / LLM 代理 / 雷达）。
> **Node（已定 2026-06-22）**：Gateway 用 Node（复用 Vite/Node 生态、单二进制打包易、Tauri 友好）；`server/README.md` 的 Flask+SQLite 设计据此调整——SQLite 仅作可选本地索引/缓存。

### 2. Obsidian vault = 认知存储单一来源
server 读写用户配置的 vault 文件夹。**已介入概念**（in-plan+）与**成稿**写成 atomic Markdown：
```
vault/AICC/concepts/<concept>.md   frontmatter: aicc-id, status, source-week, maturity; tags:[三域]; body: 费曼蒸馏; ## 关联 [[parent]]
vault/AICC/articles/<slug>.md      frontmatter: status, slug; tags:[三域]; 正文; 融合 [[conceptA]] [[conceptB]]
```
- **discovered 雷达层**留 JSON（不为每条雷达建笔记，避免淹没 vault）。
- localStorage 降级为运行时缓存（秒开 + 离线读），vault 为权威；用户在 Obsidian 改笔记，AICC 重扫 vault 即同步（**单一数据源，非双库同步**）。
> 已定：vault 目录 `vault/AICC/concepts/*.md` + `vault/AICC/articles/*.md`。

### 3. 认知图谱即 Obsidian 图谱
不再维护独立图谱存储：节点=概念/文章笔记，边=`[[wikilink]]`（费曼 relation = 链接；文章融合 = 文章节点连接多概念）。状态着色用 Obsidian graph **color group**（`status:published` 等）。AICC 自建 SVG 图谱**退役**（或保留一个读 vault 的轻量着色视图，非两套逻辑）。

### 4. 雷达消费契约（采集解耦、可替换）
唯一契约：**合法 `{weekId}.json` 落 vault `AICC-Input/`**。dogfood：本地 Cowork 定时任务采集→落 vault（本地、无桥）；AICC **启动检测**新周→拉进流水线（不当采集触发器）。开源阶段：触发+采集收进 server（启动检查 + 内置 LLM 联网采集），turnkey。

### 5. 分阶段迁移（见 tasks）
P1 本地 Gateway 骨架 → P2 vault 作存储 → P3 图谱归 Obsidian → P4 雷达消费 vault → P5 开源打包+内置采集。每阶段可独立验收；P1 是最小可跑骨架。

## Risks / Open Questions

- **大重构**：必须分阶段，避免一次性切换；每阶段保持 app 可跑。
- **已定（评审 2026-06-22）**：① Gateway = Node ② vault 目录 `vault/AICC/{concepts,articles}` ③ 公开 ECS 阅读页保留不变（本变更不动）。
- localStorage↔vault 双读期的缓存一致性（vault 为准，缓存可重建）。
- 雷达 discovered 仍在 vault 外（JSON）——与"vault 单一来源"并存：vault 存"已介入的第二大脑"，雷达 JSON 是"原始输入层"，分层清晰、不矛盾。
