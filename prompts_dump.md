# LLM 提示词完整快照（修订版 v2）

> 数据来源：`src/gdn/lib/prompts.ts` + `src/gdn/lib/llm.ts`
> 修订日期：2026-05-05
> 示例填数主题：「什么是 GDN（Gated Delta Network）？」

## 本次修订清单

| # | 修订项 | 结果 |
|---|---|---|
| ① | 移除 schema 里所有 `<60 字` / `100-200 字` / `≤100 字` / `<300 字` 类硬性字数限制，改为"不限字数 / 自然表达 / 多段深入讲解"类表意性要求 | ✅ 已改 `prompts.ts` 的 step1/step2/step3 schema |
| ② | 关闭 step2、step3 的 `enable_search`（不再强制联网） | ✅ 已在 `llm.ts` 的 `callStep` 加 `useSearch = stepKey === "step1"` 开关 |
| ④ | 三大步骤全部关闭 `enable_thinking` | ✅ 已在 `llm.ts` 的 `callStep` 里改为 `enable_thinking: false` |
| 同步 | SYSTEM_BASE 第 2 / 5 条文案、费曼预热 temperature 从 0.5 → 1.5 | ✅ 已从 md 同步到源码 |

TypeScript 编译：`npx tsc --noEmit -p tsconfig.app.json` → **EXIT=0**。

---

## 全局系统提示词（SYSTEM_BASE）

**所有 LLM 调用（预热、3 步、费曼内化）的第一条消息均为：**

```text
你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语要符合AI语境，用英文(中文)格式表达。
3. 禁止把陌生希腊字母直接抛给读者，必要时必须紧接中文解释。
4. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
5. 基线参照：以传统Transformer为默认已经深度理解的认知起点。
6. 每次回答都必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），不得只凭记忆作答；关键数字、模型版本、发布时间以搜索结果为准。
```

---

## 调用点清单（参数一览，修订后）

| # | 入口函数 | 模型 | stream | temperature | enable_thinking | enable_search | response_format |
|---|---|---|---|---|---|---|---|
| 1 | `callFeynmanWarmup` | qwen3.6-plus | ❌ | **1.5** | ❌ | ✅ forced | ❌ 不设 |
| 2 | `callStep(step1)` | qwen3.6-plus | ✅ | 0.3 | **❌** | ✅ forced | ✅ json_object |
| 3 | `callStep(step2)` | qwen3.6-plus | ✅ | 0.3 | **❌** | **❌** | ✅ json_object |
| 4 | `callStep(step3)` | qwen3.6-plus | ✅ | 0.3 | **❌** | **❌** | ✅ json_object |
| 5 | `callFeynmanReview` | qwen3.6-plus | ❌ | 0.5 | ✅ | ✅ forced | ✅ json_object |

> 粗体 = 本次修订变更项。费曼内化评估（#5）本次未修订，保留思考 + 联网。

---

## ① 费曼预热问题生成 `callFeynmanWarmup(rawQ, cfg)`

### 发出的 messages

```json
[
  { "role": "system", "content": "<SYSTEM_BASE 见上>" },
  { "role": "user", "content": "用户想学习的概念：什么是 GDN（Gated Delta Network）？\n\n请基于这个概念，为 MaaS 从业者（大模型售前解决方案、业务架构师）生成 3 个费曼学习法预热问题，分别面向：\n1. 完全不懂技术的客户公司的业务总监\n2. 客户的 CTO\n3. 客户的开发者（调用大模型的人）\n\n要求：\n- 每个问题都要代入这个具体概念，不要用模板原话\n- 每个问题都要以客户的口吻来问\n- 问题要能倒逼学习者认真思考后续讲解内容\n- **每个问题严格限制在 50 字以内**\n- 输出必须是 JSON 数组，格式：[{\"role\":\"biz\",\"question\":\"...\"},{\"role\":\"cto\",\"question\":\"...\"},{\"role\":\"dev\",\"question\":\"...\"}]\n- 不要加任何 Markdown 围栏或前后缀" }
]
```

### Body 参数（完整请求体）

```json
{
  "model": "qwen3.6-plus",
  "messages": [...],
  "temperature": 1.5,
  "enable_thinking": false,
  "enable_search": true,
  "search_options": { "forced_search": true, "enable_source": true, "enable_citation": true }
}
```

---

## ② 步骤1 `callStep("step1", rawQ, history=[], cfg, onText)`

### 发出的 messages

```json
[
  { "role": "system", "content": "<SYSTEM_BASE>" },
  { "role": "user", "content": "用户提出的概念：什么是 GDN（Gated Delta Network）？\n\n请以这个概念为主体，进入六问穿透讲解。下一条消息会告知第几问。" },
  { "role": "user", "content": "🔹 问题：步骤1 装模作样｜概念与价值感性认识。请按四部分输出：\n1.【价值铺垫】用生活化通俗案例类比这个技术的价值，先揭示以前的问题。\n2.【专业定义】给出专业定义（要依据权威资料）。\n3.【术语拆解】基于传统 Transformer 基线，挑出客户可能不理解的专业词，给出通俗类比与技术视角双解释。\n4.【示意图】选一个合适的动画 key（参考 animationKey 枚举），并给出一句结合通俗案例的 caption 说明。\n最后生成一个闭环问题，让学习者用自己的话说该技术的原理与价值。\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n{\n  \"valueLead\": \"用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（多段深入讲解，让读者建立共鸣，不限字数）\",\n  \"officialDefinition\": \"该概念的权威专业定义（引用论文/官方文档，展开解读，不限字数）\",\n  \"glossaryTerms\": [\n    {\"term\":\"专业术语名\",\"plainHint\":\"用大白话/生活比喻通俗解释\",\"techNote\":\"该术语在论文/文档中的技术含义\"}\n  ],\n  \"diagram\": {\n    \"animationKey\": \"gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow\",\n    \"caption\": \"一句结合通俗案例的说明（自然表达，句式完整即可）\"\n  },\n  \"loop\": {\n    \"prompt\": \"展示给学习者的闭环问题：请用自己的话说说当前这个概念的原理与价值（自然表达，问到点子上）\"\n  }\n}\nanimationKey 选择：GDN 选 gdn-gate；Attention 选 attention-on2；Mamba/SSM 选 mamba-ssm；MoE 选 moe-route；其他选 generic-flow。" }
]
```

### Body 参数

```json
{
  "model": "qwen3.6-plus",
  "messages": [...],
  "temperature": 0.3,
  "response_format": { "type": "json_object" },
  "stream": true,
  "enable_thinking": false,
  "enable_search": true,
  "search_options": { "forced_search": true, "enable_source": true, "enable_citation": true }
}
```

---

## ③ 步骤2 `callStep("step2", rawQ, history=[step1], cfg, onText)`

### 发出的 messages（历史上下文带上 step1 完整答案）

```json
[
  { "role": "system", "content": "<SYSTEM_BASE>" },
  { "role": "user", "content": "<概念告知，同步骤1>" },
  { "role": "user", "content": "🔹 step1问题：<step1 的 question 文本>" },
  { "role": "assistant", "content": "<步骤1 返回的完整 JSON 答案，作为上下文回扣类比场景用>" },
  { "role": "user", "content": "🔹 问题：步骤2 像模像样｜算法原理与数学本质。请按三部分输出：\n1.【技术演进时间轴】从 Transformer 开始，列出每个演进节点，每个节点必须包含：算法原理(algo)、数学公式(formula)、技术问题(problem)、价值限制(valueLimit)。\n2.【分步静态帧】以步骤+符号方式静态演示当前技术的实现原理，从上下文步骤1 中的类比场景回扣。\n3.【数学与 token 演算】用真实 token 代入公式做一次完整分步演算。\n最后生成一个闭环问题，让学习者用自己的话说明当前技术和以前技术的区别、为什么要用这个新技术。\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n{\n  \"timeline\": [\n    {\"era\":\"2017\",\"tech\":\"Transformer\",\"algo\":\"算法原理一句话\",\"formula\":\"Attention(Q,K,V)=softmax(QK^T/\\\\sqrt{d})V\",\"problem\":\"O(N^2) 显存/算力暴涨\",\"valueLimit\":\"长序列推理成本高\",\"nextDriver\":\"需要线性化方案\"}\n  ],\n  \"principle\": {\n    \"coreIdea\": \"一句话核心机制（精炼表达，表意完整）\",\n    \"steps\": [\n      {\"label\":\"第1步名称\",\"desc\":\"动作描述，详细展开讲清楚，末尾用括号注明：①参数来源（训练固定值 or 推理上游传入）②对应步骤1 类比中的哪个场景（不限字数）\",\"symbol\":\"可选符号如 g_t\"}\n    ],\n    \"animationKey\": \"gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow\",\n    \"note\": \"看动画时要抓住的关键点，末尾用括号引用步骤1 的类比场景（自然表达，把点说透）\"\n  },\n  \"math\": {\n    \"formula\": \"核心公式（LaTeX 或符号串）\",\n    \"intuition\": \"公式在直觉上意味着什么（一段话说到位，不限字数）\",\n    \"variables\": [\n      {\"symbol\":\"g_t\",\"meaning\":\"门控强度\",\"trainRole\":\"可学习参数更新\",\"inferRole\":\"每 token 动态计算\"}\n    ],\n    \"calculationExample\": \"以实际 token（如\"我 爱 你\"）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示：擦除旧记忆→计算门控→写入新信息→更新 S_t 的完整演算过程（每步清晰展开，不限字数）\",\n    \"trainFlow\": \"训练阶段完整流程说明（不限字数）\",\n    \"inferFlow\": \"推理阶段完整流程说明（不限字数）\"\n  },\n  \"loop\": {\n    \"prompt\": \"展示给学习者的闭环问题：用自己的话说说当前技术和之前技术的区别、为什么要用这个（自然表达，问到点子上）\"\n  }\n}" }
]
```

### Body 参数（⚠️ 不再带 search_options）

```json
{
  "model": "qwen3.6-plus",
  "messages": [...],
  "temperature": 0.3,
  "response_format": { "type": "json_object" },
  "stream": true,
  "enable_thinking": false,
  "enable_search": false
}
```

---

## ④ 步骤3 `callStep("step3", rawQ, history=[step1, step2], cfg, onText)`

### 发出的 messages（历史带上 step1 + step2 完整答案）

```json
[
  { "role": "system", "content": "<SYSTEM_BASE>" },
  { "role": "user", "content": "<概念告知>" },
  { "role": "user", "content": "🔹 step1问题：..." },
  { "role": "assistant", "content": "<step1 JSON>" },
  { "role": "user", "content": "🔹 step2问题：..." },
  { "role": "assistant", "content": "<step2 JSON>" },
  { "role": "user", "content": "🔹 问题：步骤3 有模有样｜客户价值与商业价值。请按四部分输出：\n1.【工程收益总结】基于演进前之间的对比，面向 AI 应用开发和运维人员讲清餐技术和算法工程上的收益。\n2.【工程收益对比表】给出指标及基线 vs 当前对比。\n3.【业务价值总结】面向调用 MaaS API 的客户（不考虑私有化部署），讲清餐业务价值，可隐射高管视角。\n4.【业务价值对比表】给出场景 × API 计费/体验/业务适配 的对比。\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n{\n  \"engSummary\": \"工程收益总结，面向 AI 应用开发与运维，结合演进前对比（多段充分阐述，不限字数）\",\n  \"engMetrics\": [\n    {\"name\":\"推理延迟\",\"baseline\":\"O(N^2)\",\"current\":\"O(N)\",\"delta\":\"-65%\",\"favor\":\"up\"}\n  ],\n  \"bizSummary\": \"业务价值总结，面向调用 MaaS API 的客户高管，结合演进前对比（多段充分阐述，不限字数）\",\n  \"bizScenarios\": [\n    {\"scenario\":\"长文档问答\",\"apiCostDelta\":\"-40% token 费\",\"uxDelta\":\"首字延迟减半\",\"bizFit\":\"高度适配\"}\n  ]\n}\nfavor 取值：up=更好，down=更差，neutral=中性。engMetrics 最多 6 条，bizScenarios 最多 5 条。" }
]
```

### Body 参数（⚠️ 不再带 search_options）

```json
{
  "model": "qwen3.6-plus",
  "messages": [...],
  "temperature": 0.3,
  "response_format": { "type": "json_object" },
  "stream": true,
  "enable_thinking": false,
  "enable_search": false
}
```

---

## ⑤ 费曼内化评估 `callFeynmanReview(...)` — 本次未修订

（保留 enable_thinking=true + forced_search=true，见上一版本 prompts_dump_v1）

---

## 预期收益

| 预期 | 估算依据 |
|---|---|
| step2 耗时从 **85s → 30s 量级** | 关思考省约 50s（思考流占大头），关搜索省约 10s |
| step3 耗时从 **62s → 25s 量级** | 同上，上下文更长但无思考+无搜索 |
| step1 耗时保持 **~20s** | 仅关思考，仍保留联网查定义 |
| 总链路 304s → **~160s（≈ 减 45%）** | warmup 47s + step1 20s + step2 30s + step3 25s + review 90s |
| 回答字段不再卡字数 | schema 改为"不限字数 / 多段深入讲解"后，模型按自然长度输出，避免硬性截断 |

## 待观察风险

1. **step2/3 关搜索后**，算法演进时间轴、工程指标基线数据可能不再引用权威来源，出现"凭记忆"的数字——建议实际跑一遍对比 fixture。
2. **关 enable_thinking** 后，step2 的数学演算质量可能下降（没有 chain-of-thought），若实测不好可考虑仅对 step2 保留思考。
3. **字数放开**后长度可能爆炸（step2 曾见 3.5KB），若前端渲染布局被撑爆再考虑加软上限。

---

修订已完成，可以立即跑一次真实对比：
```bash
DASHSCOPE_API_KEY=sk-xxx node scripts/test-main-flow.mjs "什么是 GDN（Gated Delta Network）？"
```
（注意 test-main-flow.mjs 内还硬编码了旧参数，如需脚本侧也同步修订可告知）
