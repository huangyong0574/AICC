// ============================================================
// GDN 穿透 DEMO v3 数据契约（基于 GDN_DEMO_spec.md 新六问流程）
// ============================================================

export type QaKey =
  | "background"   // 概念与背景（时间轴）
  | "principle"    // 原理与可视化（动画 + 文字）
  | "analogy"      // 通俗类比（文字 + 示意图）
  | "engineering"  // 工程价值（指标对比表）
  | "math"         // 数学与流程（公式 + 训练/推理变量生命周期）
  | "business"     // 商业价值（MaaS 场景对比表）

export const QA_ORDER: QaKey[] = ["background", "principle", "analogy", "engineering", "math", "business"]

// ---- 每种问题对应的结构化答案 ---------------------------------

export interface TimelineNode {
  era: string
  tech: string
  problem: string
  nextDriver?: string
}

/** 可能不理解的术语：通俗 + 专业双解释 */
export interface GlossaryTerm {
  term: string
  plainHint: string    // 用大白话/生活比喻通俗解释这个术语
  techNote: string     // 该术语在论文/文档中的技术含义
}

// 问题 1：价值铺垫 → 专业定义 → 术语拆解 → 总结升华
export interface BackgroundAnswer {
  valueLead: string          // 用生活化案例先揭示矛盾/痛点，为技术价值做铺垫
  officialDefinition: string // 该概念的权威专业定义
  glossaryTerms: GlossaryTerm[]
  summary: string            // 官方定义总结 + 技术创新解决的行业问题
  timeline: TimelineNode[]
}

export interface PrincipleStep {
  label: string
  desc: string
  symbol?: string
}
/** step3 机制 blueprint（结构化，替代 LLM 自由 SVG）：垂直主链 + 可选侧输入 + 可选循环回路。
 *  前端用固定模板渲染成统一的「蓝色闭环」风格（节点 + mono code 标签），风格可控、跨概念一致。 */
export interface Step3Blueprint {
  nodes: {                  // 主链节点（从上到下顺序，3–5 个）
    label: string           // 节点名（如：屏幕截图捕获）
    code?: string           // mono code 标签（如：ScreenCapture()）
    highlight?: boolean     // 核心节点蓝色高亮
  }[]
  sideInput?: {             // 左侧侧输入（可选，如：任务指令）
    label: string
    sub?: string            // 副述（如：用户自然语言输入）
  }
  loop?: { label: string }  // 循环回路标记（可选，如：循环至任务完成）
}

export interface PrincipleAnswer {
  coreIdea: string
  steps: PrincipleStep[]
  blueprint?: Step3Blueprint  // 机制 blueprint（结构化，优先渲染；缺则回退 svg/动画）
  animationKey?: "gdn-gate" | "attention-on2" | "mamba-ssm" | "moe-route" | "generic-flow"
  svg?: string              // LLM 动态生成的机制示意 SVG（blueprint 缺失时回退）
  note: string
}

export interface AnalogyMapping {
  real: string
  tech: string
}
export interface AnalogyAnswer {
  title: string
  story: string            // 60~160 字生活类比
  mapping: AnalogyMapping[]
  diagramHint: "scene" | "factory" | "library" | "kitchen" | "traffic" // 选一种轻量示意图
}

export interface EngineeringMetric {
  name: string
  baseline: string         // 例：Attention O(N²)
  current: string          // 例：GDN O(N)
  delta: string            // 例：-65% 延迟
  favor: "up" | "down" | "neutral"
}
export interface EngineeringAnswer {
  summary: string
  metrics: EngineeringMetric[]
  deployNote: string
}

export interface MathVariable {
  symbol: string
  meaning: string
  trainRole: string        // 训练阶段的角色
  inferRole: string        // 推理阶段的角色
}
export interface MathAnswer {
  formula: string          // LaTeX 或符号串
  intuition: string
  variables: MathVariable[]
  calculationExample: string  // 以实际 token 为例的分步演算过程，包含代入数值、中间结果
  trainFlow: string        // 训练阶段文字流程
  inferFlow: string        // 推理阶段文字流程
}

export interface BusinessScenario {
  scenario: string         // 场景名
  apiCostDelta: string     // API 计费影响
  uxDelta: string          // 用户体验影响
  bizFit: string           // 业务适配程度
}
export interface BusinessAnswer {
  oneLine: string
  scenarios: BusinessScenario[]
  recommendation: string
}

// ---- QA 泛型条目 -------------------------------------------------

export type QaAnswerMap = {
  background: BackgroundAnswer
  principle: PrincipleAnswer
  analogy: AnalogyAnswer
  engineering: EngineeringAnswer
  math: MathAnswer
  business: BusinessAnswer
}

export interface QaEntry<K extends QaKey = QaKey> {
  key: K
  question: string      // 实际发给 LLM 的问题（已改写）
  answer: QaAnswerMap[K] | null
  streaming: boolean    // 是否正在流式
  confirmed: boolean    // 用户是否点「确认，继续下一问」
  error?: string
}

// ---- 费曼内化（3 问 + 评估）-------------------------------------

export type FeynmanRole = "biz" | "dev" | "internal"

/** 费曼预热问题（LLM 动态生成） */
export interface FeynmanWarmupQuestion {
  role: FeynmanRole
  question: string
}

// 2026-06-26 语义重映射：面向客户决策层「链接 CEO / CTO / 业务运营负责人」。
// key 保持 biz/dev/internal 不变——已存笔记（localStorage/vault）与 FeynmanAnswers 按旧键存储，改键会断档。
export const FEYNMAN_ROLES: { key: FeynmanRole; label: string; hint: string; loadingText: string; question?: string }[] = [
  { key: "biz", label: "链接 CEO", hint: "不聊技术聊生意——战略价值、风险、投入产出", loadingText: "正在代入 CEO 视角…" },
  { key: "dev", label: "链接 CTO", hint: "技术决策者——架构取舍、趋势判断、为什么是现在", loadingText: "正在代入 CTO 视角…" },
  { key: "internal", label: "链接业务运营负责人", hint: "关心怎么落进现有流程、指标怎么变、团队怎么用", loadingText: "正在代入业务运营负责人视角…" },
]

export interface FeynmanAnswers {
  biz: string
  dev: string
  internal: string
}

export interface FeynmanReviewItem {
  role: FeynmanRole
  score: number         // 0-100
  oneLine: string
  strengths: string[]
  gaps: string[]
  followups: string[]
}

export interface FeynmanDigest {
  answers: FeynmanAnswers
  reviews: FeynmanReviewItem[]   // 每个角色一条
  graphDelta: GraphDelta         // 本次内化挂载到知识图谱的增量
}

// ---- 知识图谱（以 Transformer 为基线）-------------------------

export interface GraphDelta {
  concept: string                // 本次内化的概念名（如 "GDN"）
  parent: string                 // 父节点，默认 "Transformer"
  relation: string               // 与父节点的关系一句话（如："线性化长序列建模"）
  tags: string[]                 // 3-5 个标签
  oneLine: string                // 一句话精髓
}

// ---- 四步穿透讲解（Spec v5）---------------------------------------

export type StepKey = "step1" | "step2" | "step3" | "step4"
export const STEP_ORDER: StepKey[] = ["step1", "step2", "step3", "step4"]

/** 扩展版时间轴节点（步骤2：每节点需含算法/公式/技术问题/价值限制） */
export interface TimelineNodeV2 {
  era: string
  tech: string
  algo?: string         // 算法原理（一句话）
  formula?: string      // 数学公式/算法标识（LaTeX 或符号串）
  problem: string       // 技术问题
  valueLimit?: string   // 价值限制/业务局限
  nextDriver?: string
}

/** 步骤1 通俗概念插图：SVG 模板渲染（5 种布局 + LLM 填充内容） */
export interface ConceptDiagram {
  templateType: 'flowchart' | 'comparison' | 'hierarchy' | 'cycle' | 'architecture'
  nodes: Array<{
    id: string
    label: string       // 节点标题（如“输入”“门控”“输出”）
    sublabel?: string   // 节点副标题（可选）
    color?: string      // 节点颜色（可选，默认主色系）
  }>
  edges: Array<{
    from: string        // 起点节点 ID
    to: string          // 终点节点 ID
    label?: string      // 箭头标签（可选）
  }>
  caption: string       // 图片下方一句话点睛
  svg: string           // 前端根据模板 + 数据生成的最终 SVG
}

/** 每个步骤末尾的闭环问题（用户回答 + LLM 评价，本轮 review 预留） */
export interface LoopCheck {
  prompt: string
  userAnswer?: string
  review?: LoopReview
}
export interface LoopReview {
  score: number                 // 0-100
  strengths: string[]
  gaps: string[]
  nextHint: string              // 是否建议进入下一步的一句话
}

/** 精致类比叙事（可选增强；缺则回退 valueLead 渲染）：痛点两难 → 换个思路 → 一句金句 */
export interface Step1Analogy {
  title: string                 // 类比标题（如：天才外科医生 · 分诊台）
  lead: string                  // 痛点铺垫，引出旧两难
  dilemmas: { label: string; text: string }[] // 旧路 A/B：各一条做法 → 代价
  resolveTitle: string          // 新思路核心做法标题
  resolve: string               // 新思路如何同时保住能力与安全
  quote: string                 // 一句凝练本质的金句
  quoteCaption?: string         // 金句注解（可选）
}

/** 机制路由图：把「输入 → 关键判断节点 → 多分支走向」可视化（如 用户请求→安全分类器→[放行/降级]）。
 *  泛化适用于路由/分类/门控/决策类机制；纯线性算法概念可不产出（回退到定义文本）。 */
export interface Step1Route {
  entry: string                 // 入口节点（如：用户请求）
  gate: string                  // 关键判断/分流节点（如：安全分类器）
  branches: {                   // 2–3 条分支（判断后的不同走向）
    tone: "ok" | "warn" | "danger"  // 放行/常规=ok，降级/谨慎=warn，拦截/高危=danger
    label: string               // 分支条件（如：常规 · 直接放行）
    target: string              // 目标/结果，code 样式（如：Mythos 5）
    note: string                // 一句说明（如：完全能力模型）
  }[]
  note?: string                 // 底部补充说明（可选）
}

/** 步骤1 L1 类比理解｜它是什么？ */
export interface Step1Answer {
  valueLead: string             // 生活化类比揭示旧问题
  analogy?: Step1Analogy        // 精致类比叙事（可选；缺则用 valueLead 渲染）
  officialDefinition: string    // 权威专业定义（含 $公式$ 和 **高亮**）
  source: {                     // 引用来源（仅 arxiv 论文或 AI 公司官网）
    title: string               // 论文/文档标题
    url: string                 // arxiv 或公司官网 URL
  }
  route?: Step1Route            // 机制路由图（可选；仅当概念有 输入→判断→多分支 的运行时机制时产出，否则省略）
  essence?: string              // 本质升华：把该机制提到系统/范式层面的一句话（可选；技术定义末尾渲染）
  dims?: string[]               // 关联工程维度 chips（可选；如 能力分层/场景识别/身份权限/审计日志/合规策略，2–6 个）
  glossaryTerms: GlossaryTerm[] // 难懂术语拆解
}

/** 步骤2 L2 场景选择｜能用在哪？ */
export interface ScenarioCard {
  scenario: string       // 场景名称
  description: string    // 一句话场景说明
  fit: "excellent" | "good" | "neutral" | "poor" | "unsuitable"
  reason: string         // 为什么适合/不适合（技术原因）
  example?: string       // 具体业务举例
}
export interface Step2Answer {
  intro: string                 // 场景选择总述（关键边界句用 **加粗** 高亮）
  applicable: ScenarioCard[]    // 适用场景列表
  inapplicable: ScenarioCard[]  // 不适用场景列表
  selectionCriteria: string     // 判断标准总结（引导句）
  selectionConditions?: string[] // 选型条件 chips（可选；2–4 个同时满足的判据，如 对外服务/风险高低混杂/有多档位模型）
}

/** 步骤3 L3 深入原理｜怎么实现？ */
export interface Step3Answer {
  principle: PrincipleAnswer    // 分步静态帧演示
  math: MathAnswer              // 真实 token 代入公式演算
}

/** 步骤4 L4 本质总结｜一句话是？ */
export interface Step4Answer {
  oneLiner: string              // 一句话本质（McKinsey风格，≤30字）
  anchor: string                // 锚定比喻（极简类比固化认知）
  contrastPair: {               // 对比对：旧世界 vs 新世界
    before: string
    after: string
  }
  frameworkNote: string         // 框架性总结（串联前3步）
  takeaway: string[]            // 3个要点（记住这三点就够了）
}

export type StepAnswerMap = {
  step1: Step1Answer
  step2: Step2Answer
  step3: Step3Answer
  step4: Step4Answer
}

export interface StepEntry<K extends StepKey = StepKey> {
  key: K
  question: string
  answer: StepAnswerMap[K] | null
  streaming: boolean
  confirmed: boolean
  error?: string
  /** 先猜后揭：用户在揭晓前写下的猜想（空=「不确定，直接看」） */
  prediction?: string
  /** 认知差：对比猜想与揭晓答案的命中/遗漏/偏差 */
  gap?: StepGap
}

/** 认知差（先猜后揭）：命中 / 遗漏 / 偏差 */
export interface StepGap {
  hit: string[]
  miss: string[]
  wrong: string[]
}

// ---- 完整笔记 v5 -------------------------------------------------

export interface Note {
  id: string
  conceptId?: string             // 关联认知点 id（雷达/计划带入）；据此实时持久化 + 重进恢复学习进度
  topic: string                  // 概念名
  rawQuestion: string            // 用户最初那句话
  steps: StepEntry[]             // 四步穿透讲解（主字段）
  warmupQuestions?: FeynmanWarmupQuestion[] // 费曼预热问题（缓存后复用）
  qa?: QaEntry[]                 // 旧版六问（向后兼容笔记库历史数据）
  feynman?: FeynmanDigest
  tags: string[]
  createdAt: string
}

// ---- LLM 配置 ---------------------------------------------------

export interface LlmConfig {
  apiKey: string
  baseUrl: string
  model: string
}

// ---- 流式事件 ---------------------------------------------------

export interface StreamChunk {
  qaKey: QaKey | StepKey
  delta: string          // 累积到当前时的 partial JSON 文本
}
