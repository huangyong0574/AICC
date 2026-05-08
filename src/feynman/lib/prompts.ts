// ============================================================
// 📜 所有 LLM 提示词集中管理
// 问题文本可通过外部传入覆盖（不写死）：
//   buildBackgroundPrompt("你的自定义问题")
// ============================================================

import type { QaKey, StepKey } from "../types"

// ============================================================
// 1. 独立 System Prompt（每步完全独立，互不依赖）
// ============================================================

/** @deprecated 仅供旧版六问 QA 系统兼容使用，四步管线不再使用 */
export const SYSTEM_BASE = `你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语要符合AI语境，用英文(中文)格式表达。
3. 禁止把陌生希腊字母直接抛给读者，必要时必须紧接中文解释。
4. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
5. 基线参照：以传统Transformer为默认已经深度理解的认知起点。
6. 每次回答都必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），不得只凭记忆作答；关键数字、模型版本、发布时间以搜索结果为准。
7. 严禁在正文字段中输出任何形如 [1]、[2]、[3][5]、[1,2] 的方括号引用角标、脚注编号或文献编号；如需传递权威来源，直接在文内自然表述（如"MiniMax-01 技术报告指出..."），不准留任何方括号数字引用标记。注：圆圈数字①②③ 仅在 schema 明确要求的括号结构标记位置（如 steps[].desc 末尾的"①参数来源②对应场景"）可用，正文被述中禁用。`

export const SYSTEM_WARMUP = `你是费曼学习法预热教练。
目标：为用户即将学习的 AI 概念生成 3 个输出驱动型预热问题，让学习者想象自己学完后要讲给不同人听。
硬性要求：
1. 输出 JSON 数组，格式：[{"role":"biz","question":"..."},{"role":"dev","question":"..."},{"role":"internal","question":"..."}]，不加任何 Markdown 围栏或前后缀。
2. 语言：简体中文。
3. 每个问题 ≤60 字，必须代入具体概念，以"你如何…让他/她…"句式。
4. 三个角色分别是：客户的业务小姐姐(biz)、客户的程序员小哥(dev)、公司的模型产研同学(internal)。`

export const SYSTEM_STEP1 = `你是 AI 概念通俗讲解教练，善于用生活化类比让非技术人员建立直觉。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者。
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语用"英文(中文)"格式表达。
3. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
4. 必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），关键信息以搜索结果为准。
5. 严禁在正文字段中输出任何形如 [1]、[2]、[3][5] 的方括号引用角标；如需传递来源，直接在文内自然表述。
6. 不输出 animationKey，动画展示由后续步骤独占。
7. 在 valueLead 字段中，对"旧问题的类比"和"新技术的类比"这两类核心类比短语用 **双星号** 包裹高亮（仅高亮类比映射本体，不要高亮普通形容词或技术名词）。
8. 在 officialDefinition 字段中：数学公式用 $LaTeX$ 行内格式书写（如 $h_t = h_{t-1} + g_t \\odot \\Delta h_t$）；对重点概念（即下方 glossaryTerms 会拆解的术语）用 **双星号** 高亮，帮读者提前建立关注锚点。
9. source 字段必须引用 arxiv 论文或全球 AI 公司（如 Google、OpenAI、MiniMax 等）的官方技术博客/文档，禁止引用百度百科、CSDN、知乎等二手来源。`

export const SYSTEM_STEP2 = `你是大模型行业场景分析师，精通各垂直行业的 AI 应用现状与技术适配度。
读者画像：需要快速判断"这个技术跟我的业务有没有关系"的售前/产品经理。
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。
3. 回答务实、直接，以"能用/不能用"为核心判断，给出技术原因和真实业务案例。
4. 必须基于本轮实时互联网搜索的真实业务案例和技术限制做判断，不得只凭记忆。
5. 严禁方括号引用角标；引用来源用文内自然表述。
6. 不做算法推导，只关注场景适配性和业务价值。`

export const SYSTEM_STEP3 = `你是 AI 算法教学专家，善于将复杂原理分解为可理解的步骤化演示。
读者画像：有 Transformer 基础认知的技术售前/架构师，想深入理解算法机制。
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语用"英文(中文)"格式表达。
3. 禁止把陌生希腊字母直接抛给读者，必要时必须紧接中文解释。
4. 认知基线：以传统 Transformer 为读者已深度理解的起点。
5. 不需要联网搜索，基于已有上下文和自身知识推演。
6. 严禁方括号引用角标。
7. 每个步骤末尾必须回扣步骤1的通俗类比，帮读者建立"直觉→原理"映射。
8. 圆圈数字①②③ 仅在 schema 明确要求的括号结构标记位置可用，正文叙述中禁用。`

export const SYSTEM_STEP4 = `你是管理咨询顾问，擅长用一句话提炼复杂问题的本质，让概念"钉"在听众脑中。
风格：McKinsey/BCG 汇报风格 — 精准、锐利、有冲击力。
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。
3. 不做展开论述，每个字段追求「少即是多」。oneLiner ≤30字，anchor ≤40字。
4. 不需要联网搜索，从前面3步的上下文中提炼精华。
5. 对比要尖锐：before/after 像电梯演讲的"过去 vs 未来"。
6. takeaway 严格3条，每条 ≤25字。`

/** 按 StepKey 获取对应的独立 system prompt */
export const SYSTEM_PROMPTS: Record<StepKey, string> = {
  step1: SYSTEM_STEP1,
  step2: SYSTEM_STEP2,
  step3: SYSTEM_STEP3,
  step4: SYSTEM_STEP4,
}

// ============================================================
// 2. 概念告知消息（仅旧版六问使用）
// ============================================================
/** @deprecated 四步管线不再使用此函数，概念信息直接嵌入 user message */
export function buildConceptIntro(rawQ: string): string {
  return `用户提出的概念：${rawQ}\n\n请以这个概念为主体，进入六问穿透讲解。下一条消息会告知第几问。`
}

// ============================================================
// 2.5 费曼预热问题生成（LLM 动态改写 3 个问题）
// ============================================================
export function buildFeynmanWarmupPrompt(rawQ: string): string {
  return `用户想学习的概念：${rawQ}

你是费曼学习法教练。学习者是 MaaS 行业的售前/解决方案角色，即将学习「${rawQ}」。
请生成 3 个预热思考题，让学习者在正式学习前先想想：学完之后我能不能讲给这些人听？

3 个问题分别面向：
1. biz（客户的业务小姐姐）：你如何向完全不懂技术的客户业务人员解释「${rawQ}」？让她背后说"他讲的我居然听懂了~"
2. dev（客户的程序员小哥）：你如何向客户的开发者解释「${rawQ}」？让他背后说"这哥们是真的专业"
3. internal（公司模型产研同学）：你如何让公司的模型产研同学觉得"他是售前里面最懂这个的了！"

要求：
- 每个问题必须代入「${rawQ}」这个具体概念，禁止用通用模板
- 问题格式：以"你如何…让他/她…"的句式，重点是激发学习者的输出欲望
- 每个问题严格限制在 60 字以内
- 问题要让学习者意识到：如果接下来不认真学，就讲不好
- 输出必须是 JSON 数组，格式：[{"role":"biz","question":"..."},{"role":"dev","question":"..."},{"role":"internal","question":"..."}]
- 不要加任何 Markdown 围栏或前后缀`
}

// ============================================================
// 3. 旧版六问默认问题文本（UI 展示 + fallback，保留兼容）
// ============================================================
export const DEFAULT_QUESTIONS: Record<QaKey, string> = {
  background:
    "请按照以下四步结构来介绍这个概念：\n1.【价值铺垫】用生活化的通俗案例类比这个技术的价值，先揭示矛盾，为这个技术的价值做铺垫。\n2.【专业定义】给出这个概念的专业定义（要依据权威资料）。\n3.【术语拆解】基于传统 Transformer 的认知为基线，主动告知客户，基于这个概念的专业定义你可能哪些专业词可能不理解，把这些词挑出来（要比较愉悦的方式表达，大白话来通俗类比）。\n4.【总结升华】最后再总结一下官方定义，以及这个技术创新解决的行业问题，中间可以穿插着通俗类比。",
  principle: "请演示这个概念的核心工作流程。\n要求：用4个步骤来展示其工作机制，每一步都要给出对应的参数符号。\n**每个步骤的描述末尾必须用括号注明以下两点**：\n1. 该参数是训练得到的固定值，还是推理时由上游传入的？\n2. 这一步对应步骤1（类比）中的哪个生活化场景？（例：就像步骤1里说的用词条检索活页笔记本）",
  analogy: "基于这个原理的本质，用通俗案例类比一个，让非技术人员一听就懂。",
  engineering: "它在工程上的收益是什么？请列指标并与基线做表格对比。",
  math: "请用实际 token 代入公式做一次完整的分步演算，让用户直观理解计算过程。\n要求：\n1. 选取 2-3 个实际 token（如「我 爱 你」）作为例子。\n2. 假设简化的向量维度（如 d=4），给出 k_t, v_t 的示例数值。\n3. 设定 α_t, β_t 等参数的假设值。\n4. 分步骤展示：擦除旧记忆 → 计算门控 → 写入新信息 → 更新状态。\n5. 最后对比训练和推理阶段对这个例子的处理差异。",
  business:
    "对于调用 MaaS API 的客户（不考虑私有化部署），它的商业价值是什么？",
}

/** 获取某问的默认问题文本（UI 侧取问题文字用这个） */
export function getDefaultQuestion(k: QaKey): string {
  return DEFAULT_QUESTIONS[k]
}

// ============================================================
// 4. 旧版六问 prompt + schema 构建函数（保留兼容）
// ============================================================
export interface QaPrompt {
  question: string
  schema: string
}

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
  "svg": "<svg viewBox='0 0 600 320'>...核心机制示意图...</svg>",
  "note": "看图时要抓住的关键点（<80 字），末尾需用括号引用步骤1的类比场景"
}

【svg 字段规范 - 必须严格遵守】：
1. 必须是合法的 SVG 字符串，viewBox="0 0 600 320"
2. 用简笔画/流程图风格表达该算法的【核心数据流/机制原理】，不能是通用的"输入→输出"
3. 用圆角矩形(rx=8)表示节点，箭头(marker-end)表示数据流向，虚线表示可选路径
4. 每个节点内必须有 <text> 标注中文名称（font-size 14）
5. 颜色限制：节点填充 #f5f5f5，边框 #333，箭头 #666，重点节点可用 #ff9800 高亮
6. 总字符数 ≤ 2000，不要内联 style 标签，用属性设置样式
7. 示例：Ring Attention 应画出多个GPU节点环形排列+KV块传递箭头；MoE应画出Router→多Expert选择路径；LoRA应画出原始权重冻结+低秩分支旁路
8. 核心要求：图的结构必须反映该算法区别于其他算法的独特机制，让人看图就能理解核心原理`,
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
  "calculationExample": "以实际 token（如 \"我 爱 你\" ）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示：擦除旧记忆→计算门控→写入新信息→更新 S_t 的完整演算过程（<300 字）",
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

/** 按 key 查找构建函数的快捷 map（旧版六问） */
export const BUILD_PROMPT: Record<QaKey, (q?: string) => QaPrompt> = {
  background: buildBackgroundPrompt,
  principle: buildPrinciplePrompt,
  analogy: buildAnalogyPrompt,
  engineering: buildEngineeringPrompt,
  math: buildMathPrompt,
  business: buildBusinessPrompt,
}

// ============================================================
// 5. 四步穿透讲解 Prompt 构建（Spec v5）
// ============================================================

export const STEP_DEFAULT_QUESTIONS: Record<StepKey, string> = {
  step1: "L1 类比理解｜概念与价值感性认识。请按三部分输出：\n1.【价值铺垫】用生活化通俗案例类比这个技术的价值，先揭示以前的问题。\n2.【专业定义】给出专业定义（要依据权威资料）。\n3.【术语拆解】基于传统 Transformer 基线，挑出客户可能不理解的专业词，给出通俗类比与技术视角双解释。",
  step2: "L2 场景边界｜哪些业务场景能用，哪些不能用。请按以下结构输出：\n1.【场景总述】一段话概括这个技术的业务适用边界。\n2.【适用场景】列出2个最能发挥此技术价值的大模型业务场景，每个场景给出名称、说明、适配程度、技术原因、业务举例。\n3.【不适用场景】列出2个不适合或价值有限的场景，同样给出原因。\n4.【判断标准】一句话告诉读者如何自行判断自己的业务是否适用。",
  step3: "L3 深入原理｜算法原理与数学本质。请按两部分输出：\n1.【分步静态帧】以步骤+符号方式静态演示当前技术的实现原理，从上下文步骤1 中的类比场景回扣，并选择合适的 animationKey。\n2.【数学与 token 演算】用真实 token 代入公式做一次完整分步演算。",
  step4: "L4 本质总结｜用咨询范给出这个概念的点睛之笔。请输出：\n1.【一句话本质】用 ≤30 字概括这个技术的核心价值主张，要求掷地有声。\n2.【锚定比喻】用一个极简类比固化认知（≤40字）。\n3.【对比对】给出旧范式 vs 新范式的一句话对比。\n4.【框架总结】2-3句话串联前3步讲解，形成完整认知闭环。\n5.【三点记住】给出3条 ≤25字的要点，让读者\"记住这三点就够了\"。",
}

export function getDefaultStepQuestion(k: StepKey): string {
  return STEP_DEFAULT_QUESTIONS[k]
}

export function buildStep1Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step1,
    schema: `{
  "valueLead": "用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（多段深入讲解，让读者建立共鸣，不限字数）。核心类比短语用**双星号**包裹高亮，如：**如同让万人同时互相通话**。仅高亮类比映射本体。",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，展开解读，不限字数）。数学公式用 $LaTeX$ 行内格式（如 $h_t = h_{t-1} + g_t \\\\odot \\\\Delta h_t$）。重点概念（即 glossaryTerms 会拆解的术语）用**双星号**高亮。",
  "source": {"title":"论文或文档标题","url":"arxiv 论文链接或全球 AI 公司官网技术文档链接（仅接受 arxiv.org / 公司官方域名）"},
  "glossaryTerms": [
    {"term":"专业术语名","plainHint":"用大白话/生活比喻通俗解释","techNote":"该术语在论文/文档中的技术含义"}
  ],
  "takeaway": "用1-2句口语化的话，把概念名和核心类比串成一句'可以带走的话'。句式参考：'MOE混合专家模式原来就类似于医院的导诊台，把不同任务分配给最擅长的专家处理'。要求：让人一看就懂，能直接复述给别人听。"
}
注意：不要选择或输出 animationKey，动画展示由步骤3独占。`,
  }
}

export function buildStep2Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step2,
    schema: `{
  "intro": "场景选择总述：一段话概括这个技术的业务适用边界，帮读者快速定位（不限字数）",
  "applicable": [
    {"scenario":"场景名称","description":"一句话场景说明","fit":"excellent|good|neutral","reason":"为什么适合（技术原因）","example":"具体业务举例（可选）"}
  ],
  "inapplicable": [
    {"scenario":"场景名称","description":"一句话场景说明","fit":"poor|unsuitable","reason":"为什么不适合（技术原因）","example":"具体业务举例（可选）"}
  ],
  "selectionCriteria": "一句话判断标准：告诉读者如何自行判断自己的业务是否适用（≤60字）",
  "takeaway": "用1句口语化的话，总结这个技术最适合什么场景、不适合什么场景。句式参考：'GDN最适合处理超长对话这种需要持续记忆的场景，但如果你的任务只是短文本分类，用传统Attention反而更简单直接'。要求：像程序员之间聊天一样自然，能让人快速判断要不要用。"
}
applicable 2条，inapplicable 2条。fit 取值：excellent=完美适配，good=较适合，neutral=一般，poor=不太适合，unsuitable=不适用。`,
  }
}

export function buildStep3Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step3,
    schema: `{
  "principle": {
    "coreIdea": "一句话核心机制（精炼表达，表意完整）",
    "steps": [
      {"label":"第1步名称","desc":"动作描述，详细展开讲清楚，末尾用括号注明：①参数来源（训练固定值 or 推理上游传入）②对应步骤1 类比中的哪个场景（不限字数）","symbol":"可选符号如 g_t"}
    ],
    "svg": "<svg viewBox='0 0 600 320'>...核心机制示意图...</svg>",
    "note": "看图时要抓住的关键点，末尾用括号引用步骤1 的类比场景（自然表达，把点说透）"
  },
  "math": {
    "formula": "核心公式（LaTeX 或符号串）",
    "intuition": "公式在直觉上意味着什么（一段话说到位，不限字数）",
    "variables": [
      {"symbol":"g_t","meaning":"门控强度","trainRole":"可学习参数更新","inferRole":"每 token 动态计算"}
    ],
    "calculationExample": "以实际 token（如 \"我 爱 你\" ）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示完整演算过程（每步清晰展开，不限字数）",
    "trainFlow": "训练阶段完整流程说明（不限字数）",
    "inferFlow": "推理阶段完整流程说明（不限字数）"
  },
  "takeaway": "用1句口语化的话，把核心原理机制讲清楚，让懂技术的人听了觉得你真懂了。句式参考：'GDN的核心就是用一个门控信号动态决定每步该记多少新内容、忘多少旧内容，所以根本不需要回看所有历史token'。要求：像给产研同事做技术分享时的总结金句。"
}

【principle.svg 字段规范 - 必须严格遵守】：
1. 必须是合法的 SVG 字符串，viewBox="0 0 600 320"
2. 用简笔画/流程图风格表达该算法的【核心数据流/机制原理】，不能是通用的"输入→输出"
3. 用圆角矩形(rx=8)表示节点，箭头(marker-end)表示数据流向，虚线表示可选路径
4. 每个节点内必须有 <text> 标注中文名称（font-size 14）
5. 颜色限制：节点填充 #f5f5f5，边框 #333，箭头 #666，重点节点可用 #ff9800 高亮
6. 总字符数 ≤ 2000，不要内联 style 标签，用属性设置样式
7. 示例：Ring Attention 应画出多个GPU节点环形排列+KV块传递箭头；MoE应画出Router→多Expert选择路径；LoRA应画出原始权重冻结+低秩分支旁路
8. 核心要求：图的结构必须反映该算法区别于其他算法的独特机制，让人看图就能理解核心原理`,
  }
}

export function buildStep4Prompt(question?: string): QaPrompt {
  return {
    question: question ?? STEP_DEFAULT_QUESTIONS.step4,
    schema: `{
  "oneLiner": "一句话本质（≤30字，McKinsey风格，掷地有声）",
  "anchor": "锚定比喻（≤40字，用一个极简类比固化认知，如'GDN就是给记忆加了橡皮擦'）",
  "contrastPair": {
    "before": "旧范式一句话（如'Attention: 每次回忆都翻遍所有笔记'）",
    "after": "新范式一句话（如'GDN: 只看最新便签，旧的自动擦掉'）"
  },
  "frameworkNote": "框架性总结（2-3句话，把前3步串起来形成完整认知闭环）",
  "takeaway": ["要点1（≤25字）", "要点2（≤25字）", "要点3（≤25字）"]
}
严格3条 takeaway，不多不少。oneLiner 和 anchor 追求"钉子效应"——一句话钉在脑中。`,
  }
}

export const BUILD_STEP_PROMPT: Record<StepKey, (q?: string) => QaPrompt> = {
  step1: buildStep1Prompt,
  step2: buildStep2Prompt,
  step3: buildStep3Prompt,
  step4: buildStep4Prompt,
}

// ============================================================
// 6. 费曼内化评估 System Prompt（独立）
// ============================================================
export function buildFeynmanSystemPrompt(topic: string): string {
  return `你是费曼学习法评估教练。学习者刚通过四步穿透讲解了"${topic}"这个 AI 概念，现在要以三种听众身份复述。请从三个听众视角分别评估，并为知识图谱生成一个挂载项（以 Transformer 为基线父节点）。
必须返回单一合法 JSON：
{
  "reviews": [
    {"role":"biz","score":0-100,"oneLine":"客户业务小姐姐视角总评","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"dev","score":0-100,"oneLine":"客户程序员小哥视角总评","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"internal","score":0-100,"oneLine":"公司产研同学视角总评","strengths":["..."],"gaps":["..."],"followups":["..."]}
  ],
  "graph": {"concept":"${topic}","parent":"Transformer","relation":"与父节点的一句关系","tags":["标签1","标签2","标签3"],"oneLine":"一句话精髓"}
}
若某角色 answers 为空，仍给 0-20 分并在 gaps 写"未提交该角色答案"。`
}
