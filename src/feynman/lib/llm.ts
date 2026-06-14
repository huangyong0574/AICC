import type {
  LlmConfig, QaKey, QaAnswerMap, QaEntry,
  StepKey, StepAnswerMap, StepEntry,
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
): Promise<StepAnswerMap[K]> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  // 每步使用独立 system prompt，概念嵌入 user 消息
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPTS[stepKey] },
    { role: "user", content: `学习者想要深入理解的概念：「${rawQuestion}」` },
  ]
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

