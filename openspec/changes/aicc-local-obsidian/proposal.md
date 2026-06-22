## Why

AICC 现在是部署在公开 ECS 的 web SPA，数据全在浏览器 localStorage。对一个**个人第二大脑**、且要 **dogfood → 开源给别人（BYOK，不替别人买单）** 的产品，这套有三个硬伤：
- **信任墙**：新用户不会把 API key 粘进一个陌生网页（key 计费、无法验证）——直接卡死获客。
- **隐私 / 可携带**：认知图谱是私有 IP，却困在单一浏览器（5–10MB 上限、无备份、换设备不跟随）。
- **存储割裂**：第二大脑该是用户**可携带的方法论库（Obsidian）**，而非 bespoke localStorage 孤岛。

参考实现印证方向：**OpenClaw**（本地 Gateway 进程 `localhost:18789` + web UI，localhost-only、key 在本地、OpenAI 兼容代理后端）、**QoderWake**（设备常驻、隐私默认、持久记忆）。本地形态正是当下隐私优先 AI 工具的标准做法。

## What Changes

- **形态：公开 web app → 本地 Gateway**（复用现有 React UI）。本地 server 绑 `127.0.0.1` + 单用户 token，**持 key、代理 DashScope（OpenAI 兼容）**；浏览器开 `localhost`。将来用 Tauri/Electron 把同一 server 包成桌面 App。
- **存储：localStorage → Obsidian vault 为单一来源**。已介入（in-plan 及以后）的概念 / 成稿写成 **atomic Markdown**（frontmatter `status` + 三域 tag `#技术认知/#转型认知/#解决方案` + `[[wikilink]]`）；localStorage 降级为运行时缓存。
- **认知图谱：自建 SVG → Obsidian 原生图谱**（同一份 vault 链接，AICC 写、Obsidian 渲染；状态着色用 color group）。AICC SVG 图谱退役或改为读 vault 的轻量视图。
- **雷达：消费契约化**。采集仍由**本地 Cowork 定时任务**产 `{weekId}.json` 落 vault `AICC-Input/`（本地、无云→本地桥）；AICC **启动检测新周 → 拉进流水线**。采集器可替换（Cowork→将来 App 内置）。
- **LLM key：浏览器 → server `.env` / 系统钥匙串**（永不进浏览器、永不发往远程）。

## Capabilities

### New Capabilities
- `local-architecture`: AICC 本地运行时与认知存储的契约——本地 Gateway（localhost-only + token + key 代理）、Obsidian vault 作单一认知存储、图谱即 vault 链接、雷达消费契约。

### Modified Capabilities
<!-- 影响既有 app-shell（路由仍在）与 creation/cognition 的"存储落点"（从 localStorage 改 vault），但行为契约在新 capability 里统一表达，避免散落。 -->

## Impact

- 代码：新增本地 server（Gateway，建议 Node，复用 Vite 生态 + 易打包；`server/README.md` 的 Flask+SQLite 设计部分被 vault-as-storage 取代，SQLite 降为可选本地索引）；前端数据层从 localStorage 改走本地 API + 写 vault；`GraphPage` 退役/改读 vault；雷达从 `public/content/radar` fetch 改为读 vault `AICC-Input`。
- 部署：个人自用**不再需要 git→build→ECS** 这条发布链。
- 存储契约：vault 文件（`concepts/*.md`、`articles/*.md` + frontmatter + wikilink）成为事实来源；`aicc-*` localStorage 降级缓存。
- **不在本变更内（Out of scope）**：公开 ECS 雷达阅读页（`/weekly`、`/aicc` 归档，外循环分享）——独立保留、后续单独决策；MCP（钉钉 产品/客户库）留位不碰。
- 风险：大重构，必须分阶段；Node-vs-Flask、vault 目录结构、公开阅读页去留 需评审拍板。
