import type {
  LlmConfig, QaKey, QaAnswerMap, QaEntry,
  StepKey, StepAnswerMap, StepEntry, StepGap,
  FeynmanAnswers, FeynmanReviewItem, GraphDelta,
} from "../types"

import {
  SYSTEM_BASE,
  buildConceptIntro,
  BUILD_PROMPT,
  BUILD_STEP_PROMPT,
  SYSTEM_PROMPTS,
  SYSTEM_WARMUP,
  buildFeynmanSystemPrompt,
  buildFeynmanWarmupPrompt,
} from "./prompts"

// ============================================================
// Legacy 六问 QA API 调用（已废弃，保留兼容）
// ============================================================

// ============================================================
// 费曼预热问题生成（LLM 动态改写 3 个问题）
// ============================================================

export interface FeynmanWarmupQuestion {
  role: "biz" | "dev" | "internal"
  question: string
}

export async function callFeynmanWarmup(
  rawQuestion: string,
  cfg: LlmConfig,
): Promise<FeynmanWarmupQuestion[]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_WARMUP },
    { role: "user", content: buildFeynmanWarmupPrompt(rawQuestion) },
  ]

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages,
      temperature: 0.8,
      // 费曼预热：适度 temperature 保障多样性；关闭思考提升 JSON 稳定性
      enable_thinking: false,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`费曼预热问题生成失败 (${res.status}): ${errText}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content || ""

  try {
    // 从 LLM 输出中提取 JSON 数组（兼容 response_format 可能带外层文本）
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("LLM 返回不是合法 JSON 数组")
    const parsed = JSON.parse(match[0])

    if (!Array.isArray(parsed)) {
      throw new Error("费曼预热问题格式错误：应为 JSON 数组")
    }

    return parsed.map((item: any) => ({
      role: item.role as "biz" | "dev" | "internal",
      question: item.question as string,
    }))
  } catch (e: any) {
    throw new Error(`解析费曼预热问题失败: ${e.message}`)
  }
}

// ============================================================
// 单次（非流式）调用：一题一问，messages 携带前面全部问答
// ============================================================

export async function callQa<K extends QaKey>(
  qaKey: K,
  rawQuestion: string,
  history: QaEntry[],
  cfg: LlmConfig,
): Promise<QaAnswerMap[K]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_BASE },
    { role: "user", content: buildConceptIntro(rawQuestion) },
  ]
  // 追加历史问答对（已确认的 Q&A）
  for (const h of history) {
    if (!h.answer || !h.confirmed) continue
    // user 角色：之前的问题
    messages.push({ role: "user", content: `🔹 问题：${h.question}` })
    // assistant 角色：之前确认的答案
    messages.push({ role: "assistant", content: JSON.stringify(h.answer) })
  }
  const cur = BUILD_PROMPT[qaKey]()
  messages.push({
    role: "user",
    content: `🔹 问题：${cur.question}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${cur.schema}`,
  })

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
      // 百炼：开启思考模式 + 联网搜索
      enable_thinking: true,
      // 百炼：开启联网搜索，并强制每次都搜
      enable_search: true,
      search_options: { forced_search: true, enable_source: true, enable_citation: true },
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM HTTP ${res.status}: ${t.slice(0, 200)}`)
  }
  const json = await res.json()
  const content: string = json.choices?.[0]?.message?.content || ""
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("LLM 返回非 JSON")
    parsed = JSON.parse(m[0])
  }
  return parsed as QaAnswerMap[K]
}

// ============================================================
// 流式调用：用于"舒缓方式输出"体验（SSE）。
// onText 回调拿到累积 partial 文本，最终解析成 JSON。
// ============================================================

export async function callQaStream<K extends QaKey>(
  qaKey: K,
  rawQuestion: string,
  history: QaEntry[],
  cfg: LlmConfig,
  onText: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<QaAnswerMap[K]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_BASE },
    { role: "user", content: buildConceptIntro(rawQuestion) },
  ]
  // 追加历史问答对（已确认的 Q&A）
  for (const h of history) {
    if (!h.answer || !h.confirmed) continue
    // user 角色：之前的问题
    messages.push({ role: "user", content: `🔹 问题：${h.question}` })
    // assistant 角色：之前确认的答案
    messages.push({ role: "assistant", content: JSON.stringify(h.answer) })
  }
  const cur = BUILD_PROMPT[qaKey]()
  messages.push({
    role: "user",
    content: `🔹 问题：${cur.question}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${cur.schema}`,
  })

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
      stream: true,
      // 百炼：开启思考模式 + 联网搜索
      enable_thinking: true,
      // 百炼：开启联网搜索，并强制每次都搜
      enable_search: true,
      search_options: { forced_search: true, enable_source: true, enable_citation: true },
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "")
    throw new Error(`LLM HTTP ${res.status}: ${t.slice(0, 200)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buf = ""
  let full = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() || ""
    for (const line of lines) {
      const s = line.trim()
      if (!s.startsWith("data:")) continue
      const payload = s.slice(5).trim()
      if (payload === "[DONE]") continue
      try {
        const obj = JSON.parse(payload)
        const delta: string = obj.choices?.[0]?.delta?.content || ""
        if (delta) {
          full += delta
          onText(full)
        }
      } catch {
        // 忽略非 JSON chunk
      }
    }
  }

  let parsed: any
  try {
    parsed = JSON.parse(full)
  } catch {
    const m = full.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("流式返回无法解析 JSON")
    parsed = JSON.parse(m[0])
  }
  return parsed as QaAnswerMap[K]
}

// ============================================================
// 四大步骤流式调用（独立 system prompt）
// ============================================================

export async function callStep<K extends StepKey>(
  stepKey: K,
  rawQuestion: string,
  history: StepEntry[],
  cfg: LlmConfig,
  onText: (accumulated: string) => void,
  signal?: AbortSignal,
  grounding?: string,
): Promise<StepAnswerMap[K]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  // 每步使用独立 system prompt，概念嵌入 user 消息
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPTS[stepKey] },
    { role: "user", content: `学习者想要深入理解的概念：「${rawQuestion}」` },
  ]
  // grounding：认知雷达对该概念的权威原文/提炼，作为讲解的事实依据，避免与雷达内容相悖
  if (grounding && grounding.trim()) {
    messages.push({
      role: "user",
      content: `🔹 以下是「认知雷达」对该概念的权威原文与提炼，请以此为事实依据展开本步讲解，与之保持一致、不要另起炉灶或自相矛盾：\n${grounding.trim()}`,
    })
  }
  // 追加历史步骤上下文（已确认的步骤才追加）
  for (const h of history) {
    if (!h.answer || !h.confirmed) continue
    messages.push({ role: "user", content: `🔹 ${h.key}已确认结果：` })
    messages.push({ role: "assistant", content: JSON.stringify(h.answer) })
  }
  const cur = BUILD_STEP_PROMPT[stepKey]()
  messages.push({
    role: "user",
    content: `🔹 始终紧扣概念「${rawQuestion}」回答下面这一步，不要漂移到与步骤名（如 L1/L2/L3）字面同名的其他领域术语（例如自动驾驶分级）。\n步骤要求：${cur.question}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${cur.schema}`,
  })

  // step1（类比理解）+ step2（场景选择）需联网获取真实案例；step3/step4 纯推理不需要
  const useSearch = stepKey === "step1" || stepKey === "step2"

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
      stream: true,
      // 四大步骤全部关闭深度思考，避免 thinking 流拖慢响应
      enable_thinking: false,
      enable_search: useSearch,
      ...(useSearch
        ? { search_options: { forced_search: true, enable_source: true, enable_citation: true } }
        : {}),
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "")
    throw new Error(`LLM HTTP ${res.status}: ${t.slice(0, 200)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buf = ""
  let full = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() || ""
    for (const line of lines) {
      const s = line.trim()
      if (!s.startsWith("data:")) continue
      const payload = s.slice(5).trim()
      if (payload === "[DONE]") continue
      try {
        const obj = JSON.parse(payload)
        const delta: string = obj.choices?.[0]?.delta?.content || ""
        if (delta) {
          full += delta
          onText(full)
        }
      } catch {
        // 忽略非 JSON chunk
      }
    }
  }

  let parsed: any
  try {
    parsed = JSON.parse(full)
  } catch {
    const m = full.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("流式返回无法解析 JSON")
    parsed = JSON.parse(m[0])
  }
  return parsed as StepAnswerMap[K]
}

// ============================================================
// 费曼内化评估（3 角色合一次调用，返回 3 条评估 + 图谱增量）
// ============================================================

export async function callFeynmanReview(
  rawQuestion: string,
  topic: string,
  context: Array<{ key: string; answer: any }>,
  answers: FeynmanAnswers,
  cfg: LlmConfig,
): Promise<{ reviews: FeynmanReviewItem[]; graph: GraphDelta }> {
  if (!cfg.apiKey) throw new Error("请先填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const sys = buildFeynmanSystemPrompt(topic)

  const body = {
    model: cfg.model || "deepseek-v4-flash",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `讲解内容 JSON：\n${JSON.stringify(context.map(q => ({ key: q.key, answer: q.answer })))}\n\n学习者原问题：${rawQuestion}\n\n学习者分别对三类听众的复述：\n- 客户业务小姐姐：${answers.biz || "（未填）"}\n- 客户程序员小哥：${answers.dev || "（未填）"}\n- 公司产研同学：${answers.internal || "（未填）"}` },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
    // 百炼：开启思考模式
    enable_thinking: true,
    // 百炼：开启联网搜索，并强制每次都搜
    enable_search: true,
    search_options: { forced_search: true, enable_source: true, enable_citation: true },
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Feynman HTTP ${res.status}`)
  const json = await res.json()
  const content: string = json.choices?.[0]?.message?.content || "{}"
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    parsed = m ? JSON.parse(m[0]) : {}
  }

  const reviews: FeynmanReviewItem[] = Array.isArray(parsed.reviews)
    ? parsed.reviews.map((r: any) => ({
        role: r.role,
        score: Number(r.score) || 0,
        oneLine: r.oneLine || "",
        strengths: Array.isArray(r.strengths) ? r.strengths : [],
        gaps: Array.isArray(r.gaps) ? r.gaps : [],
        followups: Array.isArray(r.followups) ? r.followups : [],
      }))
    : []
  const graph: GraphDelta = {
    concept: parsed.graph?.concept || topic,
    parent: parsed.graph?.parent || "Transformer",
    relation: parsed.graph?.relation || "",
    tags: Array.isArray(parsed.graph?.tags) ? parsed.graph.tags : [],
    oneLine: parsed.graph?.oneLine || "",
  }
  return { reviews, graph }
}


// ============================================================
// 认知差（先猜后揭）：对比"学习者猜想"与"揭晓答案"，标出命中/遗漏/偏差
// ============================================================
export async function callGap(
  stepKey: StepKey,
  rawQuestion: string,
  prediction: string,
  answer: unknown,
  cfg: LlmConfig,
  grounding?: string,
): Promise<StepGap> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")
  const sys = `你是费曼学习法的"认知差"评估器。学习者在看到答案前，先用自己的话写了对某 AI 概念某一步的猜想。请**以「认知雷达原文」为权威事实标准**（若提供），对比"学习者猜想"与"权威标准 + 标准答案"，输出三类要点（每类 1-3 条、每条 ≤20 字、简体中文、务实具体，对着学习者说"你"）：
- hit：学习者猜对/命中的关键点（须与雷达原文一致）
- miss：雷达原文/答案里重要、但学习者完全没提到的点（遗漏）
- wrong：学习者说错、或与雷达原文相悖的点（偏差）
评判优先以雷达原文为准；标准答案 JSON 仅作辅助。只返回单一合法 JSON：{"hit":[],"miss":[],"wrong":[]}，不加任何 Markdown 围栏或前后缀；某类没有就给空数组。`
  const user = `概念：${rawQuestion}\n步骤：${stepKey}\n\n【认知雷达原文（权威标准，评判优先以此为准）】\n${(grounding || "（未提供，仅依据下方标准答案）").slice(0, 2500)}\n\n【学习者猜想】\n${prediction}\n\n【标准答案 JSON（讲解生成，辅助参考）】\n${JSON.stringify(answer).slice(0, 2500)}`
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.3,
      enable_thinking: false,
      response_format: { type: "json_object" },
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  let parsed: { hit?: unknown; miss?: unknown; wrong?: unknown } = {}
  try { parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}") } catch { /* tolerate */ }
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter(x => typeof x === "string").slice(0, 4) : [])
  return { hit: arr(parsed.hit), miss: arr(parsed.miss), wrong: arr(parsed.wrong) }
}

// ============================================================
// 创作选题生成：用户「全部历史已闭环知识点（跨周）× 近期趋势」→ 面向 AI Native 转型客户的融合选题
// ============================================================
export type TopicAngle = "战略抉择" | "组织变革" | "能力跃迁" | "落地治理" | "趋势预判"
const TOPIC_ANGLES: TopicAngle[] = ["战略抉择", "组织变革", "能力跃迁", "落地治理", "趋势预判"]

export interface GenTopic {
  angle: TopicAngle
  title: string
  dek: string
  potential: number                       // 客户共鸣度 1–5
  hook: { text: string; sourceUrl?: string }
  conceptIds: string[]                     // 融合引用的已闭环知识点 id（已过滤幻觉）
}

export async function callTopics(
  concepts: { id: string; topic: string; essence: string }[],
  trends: string[],
  cfg: LlmConfig,
): Promise<GenTopic[]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")
  const validIds = new Set(concepts.map(c => c.id))

  const sys = `你是面向「AI Native 组织转型客户」的深度内容选题策划。读者是正在做 AI Native 组织转型的决策者（CIO/CTO/转型负责人），兼顾落地一线。
基于"用户已真正吃透（已闭环）的知识点（可跨不同时间学的，自由融合/对比）"与"近期行业趋势"，生成 3–5 条**有张力、引人深思**的选题。
硬性要求：
1. 每条必须**融合/对比 ≥1（强烈优先 ≥2）个给定知识点** + 绑定 1 条给定趋势作为「为什么现在」钩子；conceptIds 只能取给定知识点的 id，**严禁编造用户没学过的概念**。
2. 每条必须命中 AI Native 组织转型客户的**决策关切**（战略/组织/能力/落地/治理），不要纯学术科普。
3. angle 只能取其一：战略抉择 | 组织变革 | 能力跃迁 | 落地治理 | 趋势预判。
4. potential（客户共鸣度 1–5）按 rubric 自评：融合≥2知识点+趋势够热+张力强→5；融合2个或1知识点×热趋势且角度清晰→4；单点+一般趋势→3；关联弱/角度平淡→2；勉强沾边→1。**不要给所有选题都打 5**。
5. title 提一个真实的两难/抉择/反共识问题、有张力（≤40字）；dek 一句点出立意（≤50字）；hook.text 用给定趋势原文。
只返回单一合法 JSON：{"topics":[{"angle":"战略抉择","title":"","dek":"","potential":4,"hook":{"text":"","sourceUrl":""},"conceptIds":["..."]}]}，不加 Markdown 围栏或前后缀。`

  const user = `【用户已闭环知识点（跨周累积，可自由融合/对比）】\n${concepts.map(c => `- [${c.id}] ${c.topic}：${c.essence}`).join("\n")}\n\n【近期行业趋势（每条选题选 1 条做钩子）】\n${trends.map(t => `- ${t}`).join("\n")}\n\n请据此生成 3–5 条选题。`

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.7,
      enable_thinking: false,
      response_format: { type: "json_object" },
      stream: false,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`选题生成失败 HTTP ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content || "{}"
  let parsed: any = {}
  try { parsed = JSON.parse(content) } catch { const m = content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : {} }
  const list: any[] = Array.isArray(parsed?.topics) ? parsed.topics : Array.isArray(parsed) ? parsed : []

  return list
    .map((t: any): GenTopic | null => {
      const conceptIds = (Array.isArray(t?.conceptIds) ? t.conceptIds : []).filter((id: any) => validIds.has(id))
      if (!t?.title || conceptIds.length === 0) return null // 必须绑定真实知识点，否则丢弃（防幻觉/空挂）
      const angle: TopicAngle = TOPIC_ANGLES.includes(t.angle) ? t.angle : "趋势预判"
      const potential = Math.max(1, Math.min(5, Math.round(Number(t.potential) || 3)))
      const hookText = typeof t.hook === "string" ? t.hook : (t.hook?.text || "")
      return {
        angle,
        title: String(t.title),
        dek: String(t.dek || ""),
        potential,
        hook: { text: hookText, sourceUrl: t.hook?.sourceUrl },
        conceptIds,
      }
    })
    .filter((t): t is GenTopic => t !== null)
}

// ============================================================
// 创作 AI 陪练：针对当前草稿「只挑刺、不代笔」（找反方/缺论据/事实核查/读者之问）
// ============================================================
export type SparringMode = "反方" | "缺论据" | "事实核查" | "读者之问"

const SPARRING_INSTR: Record<SparringMode, string> = {
  反方: "找出这篇草稿最强的反方观点 / 漏洞，逼作者把论证补严。",
  缺论据: "指出草稿里哪些论点还缺论据 / 数据支撑，分别该补什么。",
  事实核查: "核查草稿涉及的事实、数字、模型 / 产品名是否准确，存疑处点出来。",
  读者之问: "以一个正在做 AI Native 组织转型的客户读者身份，提出读到这里最想追问的问题。",
}

export async function callSparring(mode: SparringMode, draft: string, cfg: LlmConfig): Promise<string> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")
  const sys = `你是作者的 AI 陪练，只挑刺、不代笔。本次任务：${SPARRING_INSTR[mode]}
硬性要求：只做点评 / 提问 / 给方向，**严禁代写或改写任何成段正文**；简体中文，给 3–5 条要点，每条 ≤40 字，对着作者说「你」。直接给要点（可用「- 」开头），不加前后缀说明。`
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "deepseek-v4-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: `【草稿】\n${draft.slice(0, 4000)}` }],
      temperature: 0.5,
      enable_thinking: false,
      stream: false,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`AI 陪练失败 HTTP ${res.status}: ${t.slice(0, 160)}`)
  }
  const data = await res.json()
  return String(data?.choices?.[0]?.message?.content || "").trim()
}
