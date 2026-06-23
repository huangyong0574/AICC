# Tasks · aicc-local-obsidian（分阶段；每阶段独立验收、app 全程可跑）

## ✅ 评审已定（2026-06-22）
- Gateway = **Node**；vault 目录 `vault/AICC/{concepts,articles}`；公开 ECS 阅读页保留不变（本变更不动）。

## Phase 1 · 本地 Gateway 骨架（最小可跑）✅ 完成 2026-06-22
- [x] 起本地 server `server/gateway.mjs`（绑 `127.0.0.1` + 可选单用户 token），serve dist + SPA 兜底
- [x] LLM 代理 `/api/llm`：`llm.ts` 6 调用改走 Gateway（SSE 透传），key 进 server `.env`（浏览器不再持 key）
- [x] 启动器 `npm run aicc`（build + 起 Gateway）；dev 经 vite `/api` proxy → Gateway
- [x] 验收：localhost 全流程、浏览器无 key、token 鉴权(401)、无 key 优雅(503)、**代理真机冒烟（回「你好」）**

## Phase 1.1 · 前端 gateway 模式闸门改造（补完 P1「浏览器无 key」）✅ 完成 2026-06-22
- [x] 验收发现：P1 只迁移网络层，前端 7 处 `if(!cfg.apiKey)` 闸门 + SettingsDialog 仍逼浏览器持 key → gateway 模式打开即被挡死
- [x] 新增 `src/lib/gateway.ts`：`isLlmReady()`/`gatewayKeyConfigured()`/`probeGateway()`（dist 读注入 `window.__AICC_KEY_READY__`，dev 探 `/api/health`）
- [x] Gateway 注入 `__AICC_KEY_READY__`；6 处活跃闸门改 `isLlmReady(cfg)`（FeynmanApp×2 / StepPipeline / FeynmanDigestPanel / CreationPage×2）
- [x] SettingsDialog：gateway 模式放宽 key 必填 + 「测试连通」改走 `/api/llm` + 文案提示
- [x] 验收：localhost:8787 浏览器无 key 不弹设置、真机 LLM 冒烟回「你好」、tsc/build 通过

## Phase 2 · Obsidian vault 作认知存储 ✅ 完成 2026-06-22
- [x] Gateway 读写配置的 vault 文件夹（`VAULT_DIR`，默认 `<project>/vault`；`server/vault.mjs` + `/api/vault/{status,concepts,articles,concept,article}`，js-yaml frontmatter）
- [x] 概念/成稿写 atomic Markdown（`src/lib/vaultSync.ts` write-through；frontmatter aicc-id/status/source-week/maturity + tags + `[[wikilink]]`：`## 关联 [[parent]]` / `## 融合 [[concept]]`）
- [x] localStorage 降级为缓存，vault 为权威（`hydrateFromVault()` 启动安全合并重建，绝不删本地独有项）
- [x] 验收：真机点「加入计划」→ vault 出 `.md`（in-plan）；清缓存重载 → 从 vault 重建；gateway round-trip 无损；tsc/build 通过
- [x] 审计加固（2026-06-22）：按 aicc-id 防撞名静默覆盖/清改名孤儿（resolveFileName）、文章融合段幂等、listConcepts 按 id 去重、vault 写错误不回传本机路径
- [ ] 待办（迁移期/后续，均非数据丢失级）：① 三域 tag 未强制分类（用 relation.tags 占位，需改费曼 prompt）② 概念改名后文章内 `[[旧标题]]` 链接会断（建议改 `[[id\|title]]` 或级联重写）③ `remove()` 未删 vault 文件 ④ 发布把融合概念标题统一改成文章标题（`CreationPage.tsx:391`，疑似 app 既有 bug，待决策）⑤ write-through 失败静默无提示

## Phase 3 · 认知图谱归 Obsidian ✅ 完成 2026-06-23
- [x] 认知关系图谱归 Obsidian（节点=概念/文章 .md，边=`[[关联]]`/`[[融合]]`）；AICC 自建 SVG 图谱重定位为「雷达覆盖视图」，加横幅 + `obsidian://` 深链导向 Obsidian 关系图谱（仅 gateway 模式显示）
- [x] 应用内图谱去掉第二份数据源：`hydrateFromVault()` 从 vault 文章重建 `aicc-creation-edges`（连边也 vault 溯源）；relations 早已源自 cognition map(vault)；`aicc-feynman-graph` 本就 vestigial（GraphPage 不读）
- [x] Obsidian graph color group 按 status 着色：`.obsidian/graph.json` colorGroups（published=绿 / learning=琥珀 / in-plan=蓝 / articles 路径=紫；已备份 graph.json.bak-aicc）
- [x] 验收：Obsidian 关系图谱真机着色正确（learning 琥珀 / in-plan 蓝 / 文章紫 / discovered 灰）；应用内连边 `at:0` 证明源自 vault；tsc/build 通过

## Phase 4 · 雷达消费 vault ✅ 完成 2026-06-23
- [x] Gateway `server/radar.mjs` + `/api/radar/{index,week}`：扫 `${VAULT_DIR}/AICC-Input/`（根+日期子目录）的 `{weekId}.json`（校验 weekId 正则 + insights 非空）∪ 打包历史周（dist/content/radar），按 weekId 降序
- [x] 前端 `radarData.ts` 的 `loadRadarIndex/loadRadarWeek` 优先走 `/api/radar/*`（vault），无 Gateway 回退静态 `content/radar`（ECS 不受影响）
- [x] 个人自用：新周只需把 `{weekId}.json` 落 AICC-Input，AICC 即多一期——免 ingest→git→build→ECS（采集仍由本地 Cowork 产 JSON）
- [x] 验收：丢 `2026-W26.json` 进 AICC-Input → `/api/radar/index` 立即多出 W26、归档页渲染全部周（gateway 源）；vault 富数据版（含 videos 速览）优先；tsc/build 通过
- [ ] 待办：坏掉的 `com.aicc.radar-publish` launchd（状态 126）属旧 ECS 发布管线——个人自用可停用；若仍要更新公开 ECS 页再修

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
