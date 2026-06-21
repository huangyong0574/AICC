## Context

当前 `CreationPage` 把已闭环 `Note` map 成模板 `Topic`（id/topic/title/dek/hook，hook 取 `week.news[i].title`）。设计稿 `aicc_creation.html`（VIEW 1）的选题卡有：角度标签（争议红/预测紫）、讨论潜力 dots、「为什么现在·行业钩子」、「可调用你的闭环笔记」chips、「换一批」、底栏「就这个，我来写 →」。可复用：`feynman/lib/llm.ts`（DashScope + `loadCfg`）、雷达 `useLatestRadarWeek()` 的 `news`/`insights`（趋势源）、闭环 `Note`（知识点精髓）。

## Goals / Non-Goals

- **Goals**：选题在**融合 / 对比多个已闭环知识点 × 行业趋势**的基础上，**对准「AI Native 组织转型客户」的决策关切**（战略/组织/能力/落地/治理），有张力、引人深思；门槛宁缺毋滥。
- **Non-Goals**：写作台（→ `creation-writing-desk`）；AI **不替用户写文**（仍只给角度 / 时机 / 素材）；不做无限滚动 / 个性化推荐算法。

## Decisions

### 1. LLM 生成选题：`callTopics(concepts, trends)` → 结构化选题[]
复用 `feynman/lib/llm.ts` 非流式通道 + `aicc-llm-cfg`。
- **输入**：已闭环知识点精髓（topic + Step4 一句话本质 + Step1 类比，复用 `extractMaterials` 思路，控 token）+ 雷达趋势（`news` 标题 + `insights` 的 title/tagline）。
- **输出 schema（固定）**：`{ angle, title, dek, potential: 1–5, hook: { text, sourceUrl? }, conceptIds: string[] }[]`。
- system prompt 约束：**必须融合/对比 ≥1（优先 ≥2）个给定知识点**、绑定 1 条趋势钩子、**每条须命中「AI Native 组织转型客户」的关切（让转型决策者想读）**、给出有张力的角度；**不得编造用户没闭环的知识点**。
- `potential`（客户共鸣度 1–5）由 **LLM 按 rubric 自评**：融合 ≥2 知识点 + 趋势够热 + 张力够 → 4–5；单点 / 弱关联 → 1–3（rubric 写进 prompt，防全 5★ 膨胀）。每批生成 **3–5 条**。

### 2. 角度分类法：面向「转型客户」的固定 taxonomy（结构化 + 固定模板原则）
`angle ∈ { 战略抉择, 组织变革, 能力跃迁, 落地治理, 趋势预判 }`——每类对准 AI Native 转型客户的决策视角、且自带张力（如「战略抉择」即路线之争）。前端按角度配色跨选题统一，**不让 LLM 自由发明角度名**——延续 Step1Route/Step3Blueprint 的「结构化数据 + 固定前端模板」纪律。

### 3. 融合是硬约束
每个选题 `conceptIds` 至少 1 个（优先 2）来自**用户已闭环**集合 + 1 条趋势钩子；卡片渲染「可调用你的闭环笔记」chips 与「为什么现在·行业钩子」。conceptIds 必须落在已闭环集合内（前端过滤校验，防 LLM 幻觉）。

### 4. 缓存 + 换一批
生成结果存 `aicc-creation-topics`（`{ generatedAt, topics }`）。进页面优先读缓存（不每次烧 token）；「换一批」才重新 `callTopics`。闭环知识点集合变化时缓存失效重生成。

### 5. 门槛（宁缺毋滥）
闭环知识点 < `UNLOCK_MIN`（沿用现值 2）时锁定并提示「再闭环 N 个相邻知识点解锁」；无 `cfg.apiKey` 时复用前置校验弹设置。

## Risks / Open Questions

- 选题「张力 / 融合是否牵强」高度主观 → 必须真 key 真机调 prompt（gate）。
- 多知识点融合可能生硬 → prompt 强约束 + `potential` 自评分 + 用户「换一批 / 不感兴趣」兜底。
- token 成本 → 缓存 + 仅「换一批」时重算缓解。
- **已定（2026-06-22 评审）**：角度 5 类（战略抉择 / 组织变革 / 能力跃迁 / 落地治理 / 趋势预判）确认（样例评审通过）；**客户共鸣度由 LLM 按 rubric 自评**（飘则回退前端启发式）；每批 3–5 条；受众偏决策层（CIO/CTO/转型负责人）兼顾落地。
