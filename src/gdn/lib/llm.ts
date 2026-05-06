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
  buildFeynmanSystemPrompt,
  buildFeynmanWarmupPrompt,
} from "./prompts"

// 离线预览 fixtures
import {
  FIXTURE_WARMUP, FIXTURE_STEP1, FIXTURE_STEP2, FIXTURE_STEP3, FIXTURE_REVIEW,
  simulateStream, mockDelay,
} from "../mocks/fixtures"
// ============================================================
// 六问 API 调用（prompt 定义已移到 prompts.ts）
// ============================================================

// ============================================================
// 费曼预热问题生成（LLM 动态改写 3 个问题）
// ============================================================

export interface FeynmanWarmupQuestion {
  role: "biz" | "cto" | "dev"
  question: string
}

export async function callFeynmanWarmup(
  rawQuestion: string,
  cfg: LlmConfig,
): Promise<FeynmanWarmupQuestion[]> {
  // 离线预览：直接回 fixture
  if (cfg.offlineMock) {
    await mockDelay(600)
    return FIXTURE_WARMUP.map(x => ({ role: x.role, question: x.question }))
  }
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_BASE },
    { role: "user", content: buildFeynmanWarmupPrompt(rawQuestion) },
  ]

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "qwen3.6-plus",
      messages,
      temperature: 1.5,
      // 费曼预热：关闭思考以提升 JSON 稳定性；高 temperature 让问题更有多样性
      enable_thinking: false,
      enable_search: true,
      search_options: { forced_search: true, enable_source: true, enable_citation: true },
      // 不设 response_format：LLM 返回数组比对象更稳定
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
      role: item.role as "biz" | "cto" | "dev",
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
  if (cfg.offlineMock) {
    // 旧版六问不提供离线 fixture，直接报错
    throw new Error("离线预览仅支持新版三大步骤（step1/2/3）的 fixture 渲染")
  }
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
      model: cfg.model || "qwen3.6-plus",
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
  if (cfg.offlineMock) {
    throw new Error("离线预览仅支持新版三大步骤（step1/2/3）的 fixture 渲染")
  }
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
      model: cfg.model || "qwen3.6-plus",
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
// 三大步骤（Spec v4）流式调用
// ============================================================

export async function callStep<K extends StepKey>(
  stepKey: K,
  rawQuestion: string,
  history: StepEntry[],
  cfg: LlmConfig,
  onText: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<StepAnswerMap[K]> {
  // 离线预览：用 fixture 串流式喘出
  if (cfg.offlineMock) {
    const fixtureMap: Record<StepKey, unknown> = {
      step1: FIXTURE_STEP1,
      step2: FIXTURE_STEP2,
      step3: FIXTURE_STEP3,
    }
    const data = fixtureMap[stepKey]
    await simulateStream(data, onText, { chunks: 40, intervalMs: 35, signal })
    return data as StepAnswerMap[K]
  }
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_BASE },
    { role: "user", content: buildConceptIntro(rawQuestion) },
  ]
  // 追加历史步骤上下文（已确认的步骤才追加）
  for (const h of history) {
    if (!h.answer || !h.confirmed) continue
    messages.push({ role: "user", content: `🔹 ${h.key}问题：${h.question}` })
    messages.push({ role: "assistant", content: JSON.stringify(h.answer) })
  }
  const cur = BUILD_STEP_PROMPT[stepKey]()
  messages.push({
    role: "user",
    content: `🔹 问题：${cur.question}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${cur.schema}`,
  })

  // step2/step3 以算法推导、数学演算、工程/商业价值总结为主，无需联网搜索，关下来加速
  const useSearch = stepKey === "step1"

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model || "qwen3.6-plus",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
      stream: true,
      // 三大步骤全部关闭深度思考，避免 thinking 流拖慢响应
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
  if (cfg.offlineMock) {
    await mockDelay(800)
    return {
      reviews: FIXTURE_REVIEW.reviews.map(r => ({ ...r })),
      graph: { ...FIXTURE_REVIEW.graph, concept: topic || FIXTURE_REVIEW.graph.concept },
    }
  }
  if (!cfg.apiKey) throw new Error("请先填入 API Key")
  const base = (cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")

  const sys = buildFeynmanSystemPrompt(topic)

  const body = {
    model: cfg.model || "qwen3.6-plus",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `讲解内容 JSON：\n${JSON.stringify(context.map(q => ({ key: q.key, answer: q.answer })))}\n\n学习者原问题：${rawQuestion}\n\n学习者分别对三类听众的复述：\n- 业务总监：${answers.biz || "（未填）"}\n- CTO：${answers.cto || "（未填）"}\n- 开发者：${answers.dev || "（未填）"}` },
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

