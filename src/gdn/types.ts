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
export interface PrincipleAnswer {
  coreIdea: string
  steps: PrincipleStep[]
  animationKey: "gdn-gate" | "attention-on2" | "mamba-ssm" | "moe-route" | "generic-flow"
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

export type FeynmanRole = "biz" | "cto" | "dev"

/** 费曼预热问题（LLM 动态生成） */
export interface FeynmanWarmupQuestion {
  role: FeynmanRole
  question: string
}

export const FEYNMAN_ROLES: { key: FeynmanRole; label: string; hint: string; loadingText: string; question?: string }[] = [
  { key: "biz", label: "客户的业务人员问：", hint: "", loadingText: "正在代入业务人员视角…" },
  { key: "cto", label: "客户的技术高管问：", hint: "和技术决策者对话，关心成本/稳定性/改造影响", loadingText: "正在代入技术高管视角…" },
  { key: "dev", label: "客户的工程师问：", hint: "工程师视角，关心怎么调、踩坑在哪、上手时间", loadingText: "正在代入工程师视角…" },
]

export interface FeynmanAnswers {
  biz: string
  cto: string
  dev: string
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

// ---- 三大步骤（Spec v4）-----------------------------------------

export type StepKey = "step1" | "step2" | "step3"
export const STEP_ORDER: StepKey[] = ["step1", "step2", "step3"]

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

/** 步骤1 通俗概念插图：LLM 生成场景描述 → 通义万相生成精致图片 */
export interface ConceptDiagram {
  prompt: string        // LLM 生成的文生图 prompt（英文，用于 API 调用）
  imageUrl: string      // 通义万相返回的图片 URL（Base64 data URI 或 CDN 链接）
  caption: string       // 图片下方一句话点睛（把画面与概念核心动作勾连）
  generating: boolean   // 图片是否仍在生成中（前端用于显示骨架）
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

/** 步骤1 装模作样｜概念与价值感性认识 */
export interface Step1Answer {
  valueLead: string             // 生活化类比揭示旧问题
  officialDefinition: string    // 权威专业定义
  glossaryTerms: GlossaryTerm[] // 难懂术语拆解
  diagram: ConceptDiagram       // 结合通俗案例的示意图
  loop: LoopCheck               // 闭环：让用户用自己的话说原理与价值
}

/** 步骤2 像模像样｜算法原理与数学本质 */
export interface Step2Answer {
  timeline: TimelineNodeV2[]    // 技术演进时间轴（扩展版）
  principle: PrincipleAnswer    // 分步静态帧演示
  math: MathAnswer              // 真实 token 代入公式演算
  loop: LoopCheck               // 闭环：和之前技术的区别
}

/** 步骤3 有模有样｜客户价值与商业价值 */
export interface Step3Answer {
  engSummary: string                   // 工程收益总结（面向 AI 应用开发/运维）
  engMetrics: EngineeringMetric[]      // 工程收益对比表
  bizSummary: string                   // 业务价值总结（面向 MaaS API 客户高管）
  bizScenarios: BusinessScenario[]     // 业务价值对比表
  // 闭环 = 回答开头费曼 3 问，由 FeynmanDigestPanel 承载
}

export type StepAnswerMap = {
  step1: Step1Answer
  step2: Step2Answer
  step3: Step3Answer
}

export interface StepEntry<K extends StepKey = StepKey> {
  key: K
  question: string
  answer: StepAnswerMap[K] | null
  streaming: boolean
  confirmed: boolean
  error?: string
}

// ---- 完整笔记 v4 -------------------------------------------------

export interface Note {
  id: string
  topic: string                  // 概念名
  rawQuestion: string            // 用户最初那句话
  steps: StepEntry[]             // 三大步骤（主字段）
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
  /** 离线预览：跳过真实 LLM 调用，使用内置样本（fixtures）渲染 UI */
  offlineMock?: boolean
}

// ---- 流式事件 ---------------------------------------------------

export interface StreamChunk {
  qaKey: QaKey | StepKey
  delta: string          // 累积到当前时的 partial JSON 文本
}
