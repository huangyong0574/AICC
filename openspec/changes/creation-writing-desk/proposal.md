## Why

创作是认知闭环的最后一环（published → 已成文回写），但当前写作台（`CreationPage.tsx` 的 `DeskView`）只有标题/正文/字数，UI 自己标注「AI 陪练 / 素材引用 / 发布并闭环将在后续阶段接入」。用户已吃透知识点却无法在一处完成「调用自己的闭环笔记 → AI 挑刺打磨 → 发布并闭环」，闭环断在最后一步。本变更补齐写作台，让「输出你的理解」真正落地为成稿。

## What Changes

- **我的素材面板**：从该选题对应的已闭环 `Note` 提取「原理 / 类比 / 本质」三类片段，点击「引用」插入正文 blockquote（带「引自 · 来源」标注）。纯前端派生，不调 LLM。
- **AI 陪练**：4 个快捷按钮（找反方观点 / 哪里缺论据 / 事实核查 / 读者之问），针对当前草稿调 DashScope LLM **只挑刺、不代笔**，结果内联展示。复用 `feynman/lib/llm.ts` + `aicc-llm-cfg` 配置。**（LLM 契约改动，需真机冒烟）**
- **草稿实时持久化**：正文/标题按选题 id 防抖写入 localStorage（`aicc-creation-draft:<topicId>`），重进恢复——对齐费曼草稿模式。
- **发布并闭环**：发布 → 复用现有成稿落库路径（`aicc-published-articles` + `aicc-article-md:<slug>`）+ `cognition.upsert(conceptId, { slug, state: 'published' })`，使雷达卡 / 计划页显示「已成文」。
- 不在本变更内：选题卡片的「角度标签 / 讨论潜力」与 LLM 选题生成（拆到独立变更 `creation-topic-curation`）。

## Capabilities

### New Capabilities
- `creation`: 创作模块的行为契约——选题约稿门槛、写作台（素材引用 / AI 陪练 / 草稿持久化）、发布并闭环回写认知状态机。本变更落其中「写作台 + 发布闭环」子集。

### Modified Capabilities
<!-- 无既有 openspec 能力规格被改（openspec/specs/ 尚空）；与 SPEC.md §3.1/§5 创作描述保持一致，发布闭环沿用 §3.5 状态机契约。 -->

## Impact

- 代码：`src/pages/CreationPage.tsx`（`DeskView` 扩展）；可能抽出 `src/lib/publishArticle.ts`（与 `EditorPage.tsx` 共用发布逻辑，避免重复）；新增 AI 陪练调用（复用 `src/feynman/lib/llm.ts`）。
- 存储契约：新增 `aicc-creation-draft:<topicId>`；复用 `aicc-published-articles` / `aicc-article-md:<slug>` / `aicc-cognition-state`。
- LLM：新增「创作陪练」调用点（DashScope，复用 `aicc-llm-cfg`）——需在 §4.4 LLM 调用矩阵补一行（同步 SPEC.md）。
- 风险：AI 陪练是新 LLM 契约，须真 key 真机验证产出与「不代笔」边界。
