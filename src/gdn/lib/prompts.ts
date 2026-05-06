// ============================================================
// 📜 所有 LLM 提示词集中管理
// 问题文本可通过外部传入覆盖（不写死）：
//   buildBackgroundPrompt("你的自定义问题")
// ============================================================

import type { QaKey, StepKey } from "../types"

// ============================================================
// 1. 系统提示词
// ============================================================
export const SYSTEM_BASE = `你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语要符合AI语境，用英文(中文)格式表达。
3. 禁止把陌生希腊字母直接抛给读者，必要时必须紧接中文解释。
4. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
5. 基线参照：以传统Transformer为默认已经深度理解的认知起点。
6. 每次回答都必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），不得只凭记忆作答；关键数字、模型版本、发布时间以搜索结果为准。
7. 严禁在正文字段中输出任何形如 [1]、[2]、[3][5]、[1,2] 的方括号引用角标、脚注编号或文献编号；如需传递权威来源，直接在文内自然表述（如“MiniMax-01 技术报告指出...”），不准留任何方括号数字引用标记。注：圆圈数字①②③ 仅在 schema 明确要求的括号结构标记位置（如 steps[].desc 末尾的“①参数来源②对应场景”）可用，正文被述中禁用。`

// ============================================================
// 2. 概念告知消息（每条都会发）
// ============================================================
export function buildConceptIntro(rawQ: string): string {
  return `用户提出的概念：${rawQ}\n\n请以这个概念为主体，进入六问穿透讲解。下一条消息会告知第几问。`
}

// ============================================================
// 2.5 费曼预热问题生成（LLM 动态改写 3 个问题）
// ============================================================
export function buildFeynmanWarmupPrompt(rawQ: string): string {
  return `用户想学习的概念：${rawQ}

请基于这个概念，为 MaaS 从业者（大模型售前解决方案、业务架构师）生成 3 个费曼学习法预热问题，分别面向：
1. 完全不懂技术的客户公司的业务总监
2. 客户的 CTO
3. 客户的开发者（调用大模型的人）

要求：
- 每个问题都要代入这个具体概念，不要用模板原话
- 每个问题都要以客户的口吻来问
- 问题要能倒逼学习者认真思考后续讲解内容
- **每个问题严格限制在 50 字以内**
- 输出必须是 JSON 数组，格式：[{"role":"biz","question":"..."},{"role":"cto","question":"..."},{"role":"dev","question":"..."}]
- 不要加任何 Markdown 围栏或前后缀`
}

// ============================================================
// 3. 每问默认问题文本（UI 展示 + fallback）
//    修改这里即可更新 UI 上显示的问题文本和 LLM 收到的提问
// ============================================================
export const DEFAULT_QUESTIONS: Record<QaKey, string> = {
  background:
    "请按照以下四步结构来介绍这个概念：\n1.【价值铺垫】用生活化的通俗案例类比这个技术的价值，先揭示矛盾，为这个技术的价值做铺垫。\n2.【专业定义】给出这个概念的专业定义（要依据权威资料）。\n3.【术语拆解】基于传统 Transformer 的认知为基线，主动告知客户，基于这个概念的专业定义你可能哪些专业词可能不理解，把这些词挑出来（要比较愉悦的方式表达，大白话来通俗类比）。\n4.【总结升华】最后再总结一下官方定义，以及这个技术创新解决的行业问题，中间可以穿插着通俗类比。",
  principle: "请演示这个概念的核心工作流程。\n要求：用4个步骤来展示其工作机制，每一步都要给出对应的参数符号。\n**每个步骤的描述末尾必须用括号注明以下两点**：\n1. 该参数是训练得到的固定值，还是推理时由上游传入的？\n2. 这一步对应步骤1（类比）中的哪个生活化场景？（例：就像步骤1里说的用词条检索活页笔记本）",
  analogy: "基于这个原理的本质，用通俗案例类比一个，让非技术人员一听就懂。",
  engineering: "它在工程上的收益是什么？请列指标并与基线做表格对比。",
  math: "请用实际 token 代入公式做一次完整的分步演算，让用户直观理解计算过程。\n要求：\n1. 选取 2-3 个实际 token（如“我 爱 你”）作为例子。\n2. 假设简化的向量维度（如 d=4），给出 k_t, v_t 的示例数值。\n3. 设定 α_t, β_t 等参数的假设值。\n4. 分步骤展示：擦除旧记忆 → 计算门控 → 写入新信息 → 更新状态。\n5. 最后对比训练和推理阶段对这个例子的处理差异。",
  business:
    "对于调用 MaaS API 的客户（不考虑私有化部署），它的商业价值是什么？",
}

/** 获取某问的默认问题文本（UI 侧取问题文字用这个） */
export function getDefaultQuestion(k: QaKey): string {
  return DEFAULT_QUESTIONS[k]
}

// ============================================================
// 4. 每题 prompt + schema 构建函数
//    question 可选，传了就覆盖默认；不传用 DEFAULT_QUESTIONS
// ============================================================
export interface QaPrompt {
  question: string
  schema: string
}

/** 构建某问的完整 prompt 对象（问题文本 + JSON Schema） */
export function buildBackgroundPrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.background,
    schema: `{
  "valueLead": "用生活化案例先揭示矛盾/痛点，为技术价值做铺垫，让读者建立共鸣（100-200 字）",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，80-150 字）",
  "glossaryTerms": [
    {"term":"专业术语名","plainHint":"用大白话/生活比喻通俗解释这个术语","techNote":"该术语在论文/文档中的技术含义"}
  ],
  "summary": "官方定义总结 + 该技术创新解决的行业问题，中间穿插通俗类比（150-250 字）",
  "timeline": [
    {"era":"2017","tech":"Transformer","problem":"O(N²) 显存/算力暴涨","nextDriver":"需要线性化方案"},
    {"era":"...","tech":"...","problem":"...","nextDriver":"..."}
  ]
}`,
  }
}

export function buildPrinciplePrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.principle,
    schema: `{
  "coreIdea": "一句话核心机制（<50 字）",
  "steps": [
    {"label":"第1步名称","desc":"动作描述，末尾必须用括号注明：①参数来源（训练固定值 or 推理上游传入）②对应步骤1类比中的哪个场景（≤100 字）","symbol":"可选的符号如 g_t"}
  ],
  "animationKey": "gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow",
  "note": "看动画时要抓住的关键点（<80 字），末尾需用括号引用步骤1的类比场景"
}
animationKey 选择：GDN 选 gdn-gate；Attention 选 attention-on2；Mamba/SSM 选 mamba-ssm；MoE 选 moe-route；其他选 generic-flow。`,
  }
}

export function buildAnalogyPrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.analogy,
    schema: `{
  "title": "类比的一句话标题",
  "story": "60~160 字的生活场景故事",
  "mapping": [{"real":"生活要素","tech":"技术对应"}],
  "diagramHint": "scene|factory|library|kitchen|traffic"
}`,
  }
}

export function buildEngineeringPrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.engineering,
    schema: `{
  "summary": "一句话工程价值（<50 字）",
  "metrics": [
    {"name":"推理延迟","baseline":"O(N²)","current":"O(N)","delta":"-65%","favor":"up"}
  ],
  "deployNote": "落地成本与运维提示（<80 字）"
}
favor 取值：up=更好，down=更差，neutral=中性。最多 6 条指标。`,
  }
}

export function buildMathPrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.math,
    schema: `{
  "formula": "核心公式（LaTeX 或符号串）",
  "intuition": "公式在直觉上意味着什么（<60 字）",
  "variables": [
    {"symbol":"g_t","meaning":"门控强度","trainRole":"可学习参数更新","inferRole":"每 token 动态计算"}
  ],
  "calculationExample": "以实际 token（如“我 爱 你”）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示：擦除旧记忆→计算门控→写入新信息→更新 S_t 的完整演算过程（<300 字）",
  "trainFlow": "训练阶段一段话流程（<120 字）",
  "inferFlow": "推理阶段一段话流程（<120 字）"
}`,
  }
}

export function buildBusinessPrompt(question?: string): QaPrompt {
  return {
    question: question ?? DEFAULT_QUESTIONS.business,
    schema: `{
  "oneLine": "一句话总结商业价值",
  "scenarios": [
    {"scenario":"长文档问答","apiCostDelta":"-40% token 费","uxDelta":"首字延迟减半","bizFit":"高度适配"}
  ],
  "recommendation": "最建议客户优先尝试的一类场景（<50 字）"
}
最多 5 条 scenario。`,
  }
}

/** 按 key 查找构建函数的快捷 map */
export const BUILD_PROMPT: Record<QaKey, (q?: string) => QaPrompt> = {
  background: buildBackgroundPrompt,
  principle: buildPrinciplePrompt,
  analogy: buildAnalogyPrompt,
  engineering: buildEngineeringPrompt,
  math: buildMathPrompt,
  business: buildBusinessPrompt,
}

// ============================================================
// 4.5 三大步骤（Spec v4）Prompt 构建
// ============================================================

export const STEP_DEFAULT_QUESTIONS: Record<StepKey, string> = {
  step1: "步骤1 装模作样｜概念与价值感性认识。请按四部分输出：\n1.【价值铺垫】用生活化通俗案例类比这个技术的价值，先揭示以前的问题。\n2.【专业定义】给出专业定义（要依据权威资料）。\n3.【术语拆解】基于传统 Transformer 基线，挑出客户可能不理解的专业词，给出通俗类比与技术视角双解释。\n4.【示意图】选一个合适的动画 key（参考 animationKey 枚举），并给出一句结合通俗案例的 caption 说明。\n最后生成一个闭环问题，让学习者用自己的话说该技术的原理与价值。",
  step2: "步骤2 像模像样｜算法原理与数学本质。请按三部分输出：\n1.【技术演进时间轴】从 Transformer 开始，列出每个演进节点，每个节点必须包含：算法原理(algo)、数学公式(formula)、技术问题(problem)、价值限制(valueLimit)。\n2.【分步静态帧】以步骤+符号方式静态演示当前技术的实现原理，从上下文步骤1 中的类比场景回扣。\n3.【数学与 token 演算】用真实 token 代入公式做一次完整分步演算。\n最后生成一个闭环问题，让学习者用自己的话说明当前技术和以前技术的区别、为什么要用这个新技术。",
  step3: "步骤3 有模有样｜客户价值与商业价值。请按四部分输出：\n1.【工程收益总结】基于演进前之间的对比，面向 AI 应用开发和运维人员讲清餐技术和算法工程上的收益。\n2.【工程收益对比表】给出指标及基线 vs 当前对比。\n3.【业务价值总结】面向调用 MaaS API 的客户（不考虑私有化部署），讲清餐业务价值，可隐射高管视角。\n4.【业务价值对比表】给出场景 × API 计费/体验/业务适配 的对比。",
}

export function getDefaultStepQuestion(k: StepKey): string {
  return STEP_DEFAULT_QUESTIONS[k]
}

export function buildStep1Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step1,
    schema: `{
  "valueLead": "用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（多段深入讲解，让读者建立共鸣，不限字数）",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，展开解读，不限字数）",
  "glossaryTerms": [
    {"term":"专业术语名","plainHint":"用大白话/生活比喻通俗解释","techNote":"该术语在论文/文档中的技术含义"}
  ],
  "diagram": {
    "prompt": "Generate a prompt for AI image generation (English, max 50 words). Describe a flat educational illustration showing the core mechanism of this AI concept through a real-world analogy. Style: minimalist flat illustration, soft pastel colors, clean layout, 3-5 key nodes with arrows, no text labels in the image itself. Example: 'Flat illustration of a smart library system where new books flow through a conveyor belt, a smart gate filters important books, and a digital notebook automatically updates key points. Minimalist style, soft blue and orange colors, clean arrows showing information flow.'",
    "caption": "Image caption in Chinese: one sentence connecting the visual analogy to the concept's core mechanism"
  },
  "loop": {
    "prompt": "展示给学习者的闭环问题：请用自己的话说说当前这个概念的原理与价值（自然表达，问到点子上）"
  }
}
注意：步骤1 不要选择/输出任何动画 key，动画展示由步骤2 独占。diagram.svg 必须是合法 SVG 代码且不超过 2000 字符。`,
  }
}

export function buildStep2Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step2,
    schema: `{
  "timeline": [
    {"era":"2017","tech":"Transformer","algo":"算法原理一句话","formula":"Attention(Q,K,V)=softmax(QK^T/\\sqrt{d})V","problem":"O(N^2) 显存/算力暴涨","valueLimit":"长序列推理成本高","nextDriver":"需要线性化方案"}
  ],
  "principle": {
    "coreIdea": "一句话核心机制（精炼表达，表意完整）",
    "steps": [
      {"label":"第1步名称","desc":"动作描述，详细展开讲清楚，末尾用括号注明：①参数来源（训练固定值 or 推理上游传入）②对应步骤1 类比中的哪个场景（不限字数）","symbol":"可选符号如 g_t"}
    ],
    "animationKey": "gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow",
    "note": "看动画时要抓住的关键点，末尾用括号引用步骤1 的类比场景（自然表达，把点说透）"
  },
  "math": {
    "formula": "核心公式（LaTeX 或符号串）",
    "intuition": "公式在直觉上意味着什么（一段话说到位，不限字数）",
    "variables": [
      {"symbol":"g_t","meaning":"门控强度","trainRole":"可学习参数更新","inferRole":"每 token 动态计算"}
    ],
    "calculationExample": "以实际 token（如“我 爱 你”）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示：擦除旧记忆→计算门控→写入新信息→更新 S_t 的完整演算过程（每步清晰展开，不限字数）",
    "trainFlow": "训练阶段完整流程说明（不限字数）",
    "inferFlow": "推理阶段完整流程说明（不限字数）"
  },
  "loop": {
    "prompt": "展示给学习者的闭环问题：用自己的话说说当前技术和之前技术的区别、为什么要用这个（自然表达，问到点子上）"
  }
}`,
  }
}

export function buildStep3Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step3,
    schema: `{
  "engSummary": "工程收益总结，面向 AI 应用开发与运维，结合演进前对比（多段充分阐述，不限字数）",
  "engMetrics": [
    {"name":"推理延迟","baseline":"O(N^2)","current":"O(N)","delta":"-65%","favor":"up"}
  ],
  "bizSummary": "业务价值总结，面向调用 MaaS API 的客户高管，结合演进前对比（多段充分阐述，不限字数）",
  "bizScenarios": [
    {"scenario":"长文档问答","apiCostDelta":"-40% token 费","uxDelta":"首字延迟减半","bizFit":"高度适配"}
  ]
}
favor 取值：up=更好，down=更差，neutral=中性。engMetrics 最多 6 条，bizScenarios 最多 5 条。`,
  }
}

export const BUILD_STEP_PROMPT: Record<StepKey, (q?: string) => QaPrompt> = {
  step1: buildStep1Prompt,
  step2: buildStep2Prompt,
  step3: buildStep3Prompt,
}

// ============================================================
// 5. 费曼内化评估 System Prompt
// ============================================================
export function buildFeynmanSystemPrompt(topic: string): string {
  return `你是费曼学习法评估教练。学习者刚通过六问讲解了"${topic}"这个 AI 概念，现在要以三种听众身份复述。请从三个听众视角分别评估，并为知识图谱生成一个挂载项（以 Transformer 为基线父节点）。
必须返回单一合法 JSON：
{
  "reviews": [
    {"role":"biz","score":0-100,"oneLine":"业务总监总评","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"cto","score":0-100,"oneLine":"...","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"dev","score":0-100,"oneLine":"...","strengths":["..."],"gaps":["..."],"followups":["..."]}
  ],
  "graph": {"concept":"${topic}","parent":"Transformer","relation":"与父节点的一句关系","tags":["标签1","标签2","标签3"],"oneLine":"一句话精髓"}
}
若某角色 answers 为空，仍给 0-20 分并在 gaps 写"未提交该角色答案"。`
}
