# AICC 交接说明（新会话起手）

> **三个唯一基线，全部在本仓库**（`git clone` 即得，无需其它来源）：
> - **代码** → `src/`（GitHub `huangyong0574/AICC` · `main`）
> - **设计** → `design/`：`live/`（各页面**实际渲染** HTML 基线）+ `aicc-html-bundle/`（mockup 设计稿）
> - **项目整体事实来源** → `SPEC.md`（改契约/状态机/路由/页面职责必须同步它）

## 新会话起手步骤
1. `git pull`，确认本地 == GitHub HEAD（`git rev-parse HEAD` 应等于 `git ls-remote origin main`）
2. 读 **`SPEC.md`** —— 产品定位 / 认知状态机 / 数据契约 / 页面职责（唯一事实来源）
3. 看 **`design/live/*.html`** —— 8 个页面的真实渲染基线（`feynman.html` 含四步揭晓 + 认知差三色完整版）
4. 读下方「当前状态 / 待办 / 工程纪律」
5. `npm i && npm run dev` → http://localhost:5188 ；费曼/创作的 LLM 需在「设置」里填百炼 key

## 当前状态
- 已完成：费曼全 UI（4 步 stepper + 进度环 + 内化三问 + 认知差三色 + step1 类比叙事/route 路由图 + step3 blueprint + 实时持久化恢复）、雷达卡片认知状态机入口、创作模块阶段 1（选题约稿视图）
- 设计基线 `design/live/` 已是最新真实渲染（与线上 `/aicc/` 同代码）

## 待办（优先级从高到低）
1. **创作模块阶段 2–4**：写作台视图 / 发布并闭环回写（写回雷达卡片「已成文」）/ 选题 LLM 生成 + AI 陪练。
   闭环逻辑与 UI 见 `design/aicc-html-bundle/aicc_creation.html`。
2. **后端落库**：`server/README.md` 已有 Flask + SQLite 设计 SPEC（后端权威源 + 前端 localStorage 缓存 + 单用户 bearer token + LLM key 移后端），**尚未实现**。
3. 可选：费曼 step2/step4 逐屏截图验收（step1/step3 已逐屏比对过设计图）。

## 工程纪律（务必遵守）
1. **`SPEC.md` = 唯一事实来源**：任何影响契约/状态机/路由/页面职责的改动，先同步 SPEC 再写码。
2. **验收通过 → 刷新基线 → commit/push**，保持 local == GitHub。**凡涉及页面渲染的改动，commit 前必须先刷新 `design/live/` 基线**并与代码一并提交——这是纪律固定环节，不可遗漏（纯后端 / 文档 / 配置改动可免）。刷新命令：`export DASHSCOPE_API_KEY=<新key>` 后 `node scripts/export-pages.mjs`（或 `... feynman` 单独重跑）。部署同理：build + `deploy-dist.sh` 前基线应已刷新。**每次 push 后检查 `README.md` 是否需同步**——产品定位 / 功能 / 页面 / 架构 / 存储契约有变即更新 README（再补一次提交）。
3. `design/` 双源 + `src/` 三方对照：`design/aicc-html-bundle/`=mockup 设计稿、`design/live/`=真实渲染基线（由 export-pages.mjs 生成，脚本不再硬编码 key），二者均随相应改动同步。
4. **不提交凭证**：API key（仅存 localStorage「设置」/ 环境变量）、SSH 私钥（`~/.ssh/aicc_deploy`）等**绝不入库**——脚本只引用其路径。其余工程文件（含运维脚本 `deploy-dist.sh` / `radar-publish.sh` / `run-*.command` / `deploy/`）均已入库，**GitHub == 完整工程（除 API key）**。

## OpenSpec 工作流（编码主流程）
实质编码走 **OpenSpec spec-driven**（CLI 已装、仓库已 init，`/opsx:*` 命令 + `openspec-*` skills）。约定详见 **`openspec/project.md`**，要点：
- **事实来源分层**：`SPEC.md`=产品总纲/叙事真相；`openspec/specs/<capability>/`=可测行为契约（随变更逐能力长出，不一次性迁移）。
- **何时用**：改「系统该做什么」/ 契约 / 数据 / 多文件 / 后端 → 完整 `propose → apply → archive`；纯视觉/文案/小 bugfix → 走轻量纪律直接做。
- **纪律 gate 焊进每个 change 的 `tasks.md` 末尾**：tsc/build · 浏览器验收截图 · (LLM 契约)真机冒烟 · (UI)刷 design/live 基线 · (影响总纲)同步 SPEC · commit/push。

## 关键设计模式（避免重蹈覆辙）
- 「**结构化数据 + 固定前端模板**」取代「LLM 自由生成 SVG/HTML」：见 `Step1Route`（路由图）、`Step3Blueprint`（机制图）。风格可控、跨概念泛化。step3 机制图**不要**回退到 LLM 自由画 SVG。
- 费曼评测「认知差」依赖**雷达原文 grounding**（conceptId → 该周 insight），不是纯 LLM 现编。
- 费曼草稿按 `conceptId` 实时持久化，重进提示「继续 / 重新开始」。

## 部署
ECS `101.37.128.102` path-based `/aicc/`：`npm run build -- --base=/aicc/` → `bash scripts/deploy-dist.sh`（SSH key 免密；不 rsync --delete、保留 `dist/weekly`）。用户已**持久授权**部署。
部署脚本（`deploy-dist.sh` / `radar-publish.sh` / `run-*.command` / `deploy/*.plist`）均已入库；唯 SSH 私钥 `~/.ssh/aicc_deploy` 不入库，**新机器需自备该密钥**（`ssh-copy-id` 到 ECS）。

## ⚠️ 安全（待办）
百炼 API key 曾被硬编码进 `scripts/export-pages.mjs` 并提交（commit `5858ccf`），已进入 git 历史；`63f927d` 已从当前文件移除。**该 key 需轮换作废**；轮换后可选用 `git filter-repo` 清理历史。
