## Context

写作台目标 UI 见 `design/aicc-html-bundle/aicc_creation.html`（VIEW 2 · 写作台）：钉选题 + 编辑器 + 内联陪练 hint + 「我的素材」面板 + 「AI 陪练」4 按钮 + footer（存草稿 / 发布并闭环）。当前 `DeskView` 仅有钉选题 + 标题/正文/字数。现有可复用资产：`feynman/lib/llm.ts`（DashScope 调用 + `loadCfg`）、`feynman/lib/storage.ts`（`loadNotes`/草稿防抖模式）、`EditorPage.tsx`（成稿落库 + `upsert` published 回写）、`lib/cognition.tsx`（`upsert/setState`）。

## Goals / Non-Goals

- **Goals**：素材引用、AI 陪练、草稿持久化、发布并闭环——都在 `CreationPage.DeskView` 内一处完成。
- **Non-Goals**：选题角度标签 / 讨论潜力 / LLM 选题生成（→ `creation-topic-curation`）；富文本编辑器（保持轻量 `contenteditable`/textarea，仅支持引用块插入）。

## Decisions

### 1. 素材提取：纯前端派生，不引入新字段
从选题的 `Note` 派生三类片段，避免新增 LLM 契约或 schema：
- **原理** ← `Step3` `principle.coreIdea`（缺则 `Step3Blueprint` 主链 / `Step2` intro）
- **类比** ← `Step1Answer.analogy.quote`（缺则 `valueLead` 首句）
- **本质** ← `Step4` `oneLiner`
派生为脆弱点 → 集中到 `extractMaterials(note): {kind, text}[]`，缺字段则跳过该行（不崩）。
> 备选（弃）：在 Note 上加 `excerpts` 结构化字段——契约更重、收益不足，留待将来。

### 2. AI 陪练：复用 feynman LLM 通道，强约束「不代笔」
4 按钮各自构造 prompt（草稿正文 + 角色指令：找反方/缺论据/事实核查/读者之问），调 `feynman/lib/llm.ts` 的非流式 helper（或新增 `callSparring`），**system prompt 明令「只评点、禁止代写成段正文」**。结果渲染在编辑器下方 `.spar` 区，不自动插入正文。无 key 时走现有 `!cfg.apiKey` 前置校验弹设置。
> 设计稿用 `sendPrompt` 把 prompt 抛给宿主 chat——那是 mockup 假象；真实应用是独立站点，须直连 DashScope（与费曼一致）。

### 3. 发布闭环：抽出共享 `publishArticle()`，与 EditorPage 同源
把 `EditorPage.confirmPublish` 的落库逻辑（写 `aicc-article-md:<slug>` + `aicc-published-articles` 索引 + `cognition.upsert(conceptId,{slug,title,state:'published'})` + 清 `activeConcept`）抽到 `src/lib/publishArticle.ts`，写作台与编辑器共用，保证闭环回写一致、避免双实现漂移。slug 由 `slugify(title)` 生成，冲突沿用 EditorPage 的二次确认护栏。

### 4. 草稿持久化：对齐费曼模式
`aicc-creation-draft:<topicId>` 存 `{ title, body, updatedAt }`，输入 400ms 防抖写回；进入写作台若有草稿提示「继续 / 重新开始」。发布成功后清除该草稿键。

## Risks / Open Questions

- AI 陪练产出质量与「不代笔」边界须真机验证（gate）。
- `extractMaterials` 对历史 Note（字段缺失/旧结构）的健壮性——需对 `Note.qa?` 旧笔记兜底。
- 发布闭环抽取时不得改变 EditorPage 现有行为（回归验证编辑器发布仍正常）。
