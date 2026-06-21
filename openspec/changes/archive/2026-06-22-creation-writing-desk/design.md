## Context

写作台目标 UI 见 `design/aicc-html-bundle/aicc_creation.html`（VIEW 2 · 写作台）：钉选题 + 编辑器 + 内联陪练 hint + 「我的素材」面板 + 「AI 陪练」4 按钮 + footer（存草稿 / 发布并闭环）。当前 `DeskView` 仅有钉选题 + 标题/正文/字数。现有可复用资产：`feynman/lib/llm.ts`（DashScope 调用 + `loadCfg`）、`feynman/lib/storage.ts`（`loadNotes`/草稿防抖模式）、`EditorPage.tsx`（成稿落库 + `upsert` published 回写）、`lib/cognition.tsx`（`upsert/setState`）。

## Goals / Non-Goals

- **Goals**：**富文本编辑** · 素材引用 · AI 陪练 · 草稿持久化 · **发布 → 再修改 → 闭环到知识图谱**——都在 `CreationPage.DeskView` 内一处完成。
- **Non-Goals**：小红书等外发渠道（→ 独立变更）；选题生成（已在 `creation-topic-curation` 完成）；真·WYSIWYG 富文本（用 Markdown + 工具栏 + 预览替代，见决策 5）。

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

### 3. 发布 · 再修改 · 闭环图谱：共享 `publishArticle()` + 多概念连边
**发布**：抽 `EditorPage.confirmPublish` 落库逻辑（写 `aicc-article-md:<slug>` + `aicc-published-articles`(扩展含 `conceptIds`) + 清 `activeConcept`）到 `src/lib/publishArticle.ts`，写作台/编辑器共用，避免双实现漂移。slug 由 `slugify(title)` 生成，冲突沿用二次确认护栏。
**再修改（覆盖式）**：已发布文章可重进写作台编辑、覆盖重发（同 slug、不留版本历史）；进入时若该选题已 `published`，预填已发布正文。
**闭环图谱（连边）**：发布时——把该文融合的**所有 `conceptIds` 标 `published`**（都贡献了这篇成稿）、slug 指向该文；并写一条「文章连边」`aicc-creation-edges`：`{ slug, title, conceptIds, at }`，`GraphPage` 据此在这些概念间画边（标文章名）——**学=长节点，写=连边**。
> 待你拍板：多概念是否都标 published（备选：只标主概念）；连边用新 `aicc-creation-edges` 存，不污染既有 `relation` 单父模型。

### 4. 草稿持久化：对齐费曼模式
`aicc-creation-draft:<topicId>` 存 `{ title, body, updatedAt }`，输入 400ms 防抖写回；进入写作台若有草稿提示「继续 / 重新开始」。发布成功后清除该草稿键。

### 5. 富文本编辑：Markdown + 工具栏 + 实时预览（不做 WYSIWYG 序列化）
正文存 **Markdown**（与 `aicc-article-md` / 文章页 / `publishArticle` 同格式）。编辑区 = textarea + 格式工具栏（加粗 `**` / H2 `##` / 引用 `>` / 列表 `-` / 链接），用 `lib/markdown.ts` 实时预览；素材「引用」= 在光标处插入 Markdown blockquote。
> 弃真·WYSIWYG（contenteditable 渲染态 ↔ Markdown 双向序列化：复杂、易丢格式）；Markdown + 预览既富又稳，且与现有 `EditorPage` 一致。

## Risks / Open Questions

- AI 陪练产出质量与「不代笔」边界须真机验证（gate）。
- `extractMaterials` 对历史 Note（字段缺失/旧结构）的健壮性——需对 `Note.qa?` 旧笔记兜底。
- 发布闭环抽取时不得改变 EditorPage 现有行为（回归验证编辑器发布仍正常）。
- **多概念 published 语义**：一篇文融合多概念，是否每个都标 published（决策 3，待你确认）。
- **图谱连边模型**：用新 `aicc-creation-edges` 存文章连边，`GraphPage` 需新增渲染（不动既有 `relation` 单父模型）。
- **富文本**：工具栏需处理 textarea 光标处的语法包裹/插入（选中包裹、未选插入）。
