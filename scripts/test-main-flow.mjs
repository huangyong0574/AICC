#!/usr/bin/env node
/**
 * 主链路端到端功能测试：
 *   ① 费曼预热问题（3 条）
 *   ② 步骤1 装模作样
 *   ③ 步骤2 像模像样   （历史 = 步骤1）
 *   ④ 步骤3 有模有样   （历史 = 步骤1+2）
 *   ⑤ 费曼内化评估     （上下文 = 3 步讲解 + 3 条用户复述占位）
 *
 * 每一步都会：
 *  - 调用百炼 qwen3.6-plus（流式 / 非流式按原 UI 一致）
 *  - 保存原始 JSON 到 test-data/ 下
 *  - 对字段做 Schema 校验，打印「证据摘要」
 *
 * 使用：
 *   DASHSCOPE_API_KEY=sk-xxxx node scripts/test-main-flow.mjs
 *   DASHSCOPE_API_KEY=sk-xxxx node scripts/test-main-flow.mjs "什么是 GDN？"
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "test-data")
fs.mkdirSync(OUT_DIR, { recursive: true })

const apiKey = process.env.DASHSCOPE_API_KEY || ""
if (!apiKey) {
  console.error("[x] 请先设置 DASHSCOPE_API_KEY 环境变量")
  process.exit(1)
}
const rawQuestion = process.argv[2] || "什么是 GDN（Gated Delta Network）？"
const baseUrl = (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "")
const model = process.env.DASHSCOPE_MODEL || "qwen3.6-plus"

const SYSTEM_BASE = `你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
你必须只输出 JSON，不要附加任何解释、Markdown 代码块或文字。`
const conceptIntro =
  `我想搞透一个 AI 概念：「${rawQuestion}」。\n` +
  `请以 Transformer 为基线，按我后续指示分步给出结构化讲解；每一步都严格输出符合 JSON Schema 的内容。`

/* ----------------------------- 工具函数 ----------------------------- */

function banner(title) {
  console.log("\n" + "═".repeat(70))
  console.log("  " + title)
  console.log("═".repeat(70))
}

async function callLlm({ messages, responseFormat = true, temperature = 0.3 }) {
  const body = {
    model,
    messages,
    temperature,
    enable_thinking: true,
    enable_search: true,
    search_options: { forced_search: true, enable_source: true, enable_citation: true },
  }
  if (responseFormat) body.response_format = { type: "json_object" }
  const t0 = Date.now()
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 400)}`)
  }
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content || ""
  const dt = ((Date.now() - t0) / 1000).toFixed(1)
  return { content, dtSec: Number(dt) }
}

function parseJson(text, { allowArray = false } = {}) {
  try {
    return JSON.parse(text)
  } catch {
    const m = allowArray
      ? text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/)
      : text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("无法从返回中解析 JSON")
    return JSON.parse(m[0])
  }
}

function saveSample(fileName, payload) {
  const p = path.join(OUT_DIR, fileName)
  fs.writeFileSync(p, JSON.stringify(payload, null, 2), "utf-8")
  return path.relative(ROOT, p)
}

function mark(ok) { return ok ? "✓" : "✗" }

/* --------------------------- Prompt / Schema --------------------------- */

const FEYNMAN_WARMUP_PROMPT = `请根据用户提问「${rawQuestion}」，站在 MaaS 一线销售顾问的身份，设想未来他要把这个概念讲给客户的三类人员（业务总监、CTO、开发者），各生成一个 30 字以内的「代入式追问」，用于提前对齐讲解重点。
要求：
- 直接以第二人称让 TA 开口问你。
- 角色分别是 biz=业务总监、cto=CTO、dev=开发者。
- 严格只输出 JSON 数组，每个元素形如 {"role":"biz","question":"..."}，共 3 条。`

const STEP1_SCHEMA = `{
  "valueLead": "用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（100-200 字）",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，80-150 字）",
  "glossaryTerms": [{"term":"专业术语名","plainHint":"大白话类比","techNote":"技术含义"}],
  "diagram": {"animationKey":"gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow","caption":"<60 字"},
  "loop": {"prompt":"闭环问题 <60 字"}
}
animationKey 选择：GDN→gdn-gate；Attention→attention-on2；Mamba/SSM→mamba-ssm；MoE→moe-route；其他→generic-flow。`

const STEP1_QUESTION =
  "步骤1 装模作样｜概念与价值感性认识。请按四部分输出：价值铺垫、专业定义、术语拆解、示意图，结尾 loop 闭环问题。"

const STEP2_SCHEMA = `{
  "timeline":[{"era":"2017","tech":"Transformer","algo":"算法一句话","formula":"Attention(Q,K,V)=softmax(QK^T/\\\\sqrt{d})V","problem":"O(N^2)","valueLimit":"长序列成本高","nextDriver":"线性化"}],
  "principle":{
    "coreIdea":"核心机制 <50 字",
    "steps":[{"label":"第1步","desc":"动作，含参数来源与类比场景 ≤100 字","symbol":"g_t"}],
    "animationKey":"gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow",
    "note":"<80 字 末尾引用步骤1 类比"
  },
  "math":{
    "formula":"核心公式",
    "intuition":"<60 字",
    "variables":[{"symbol":"g_t","meaning":"门控","trainRole":"...","inferRole":"..."}],
    "calculationExample":"以实际 token（例 我 爱 你）代入分步演算，<300 字",
    "trainFlow":"<120 字",
    "inferFlow":"<120 字"
  },
  "loop":{"prompt":"<60 字"}
}`

const STEP2_QUESTION =
  "步骤2 像模像样｜算法原理与数学本质。请输出三部分：技术演进时间轴（每节点含 algo/formula/valueLimit）、分步静态帧（principle，每步写参数来源+回扣步骤1 类比）、Token 演算（math），结尾 loop 闭环问题。"

const STEP3_SCHEMA = `{
  "engSummary":"工程收益（100-180 字）",
  "engMetrics":[{"name":"推理延迟","baseline":"O(N^2)","current":"O(N)","delta":"-65%","favor":"up"}],
  "bizSummary":"业务价值（100-180 字）",
  "bizScenarios":[{"scenario":"长文档问答","apiCostDelta":"-40% token","uxDelta":"首字延迟减半","bizFit":"高度适配"}]
}
favor ∈ up/down/neutral；engMetrics ≤6，bizScenarios ≤5。`

const STEP3_QUESTION =
  "步骤3 有模有样｜客户价值与商业价值。请输出 engSummary + engMetrics 工程收益、bizSummary + bizScenarios 业务价值两部分。"

const FEYNMAN_SYSTEM = `你是一位严格但友善的 AI 认知教练，受训于费曼学习法。请评估学习者用自己的话对「${rawQuestion}」的复述（面向业务总监、CTO、开发者三类听众），分别给 0-100 打分，指出到位之处与缺口，并最终输出一个挂载到 Transformer 知识图谱的 graph 增量。
只输出 JSON：
{
  "reviews":[{"role":"biz|cto|dev","score":0,"oneLine":"","strengths":[],"gaps":[],"followups":[]}],
  "graph":{"concept":"","parent":"Transformer","relation":"","tags":[],"oneLine":""}
}`

/* ============================= 主流程 ============================= */

const report = {
  rawQuestion,
  model,
  startedAt: new Date().toISOString(),
  stages: [],
}

function pushStage(stage) {
  report.stages.push(stage)
  saveSample("main-flow-report.json", report)
}

// ---------- ① 费曼预热 ----------
banner("① 费曼预热（3 条代入式追问）")
const warmup = await callLlm({
  messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: FEYNMAN_WARMUP_PROMPT }],
  responseFormat: false,
  temperature: 0.5,
})
const warmupArr = parseJson(warmup.content, { allowArray: true })
const warmupOk = Array.isArray(warmupArr) && warmupArr.length === 3 && warmupArr.every(x => ["biz", "cto", "dev"].includes(x.role) && typeof x.question === "string" && x.question.length > 0)
console.log(`[${mark(warmupOk)}] 结构校验：数组=${Array.isArray(warmupArr)} 长度=${warmupArr.length}`)
warmupArr.forEach(w => console.log(`    • ${w.role.toUpperCase()} → ${w.question}`))
const warmupPath = saveSample("feynman-warmup-sample.json", { _meta: { dtSec: warmup.dtSec, ok: warmupOk }, data: warmupArr })
console.log(`[📁] 已保存：${warmupPath} (${warmup.dtSec}s)`)
pushStage({ name: "warmup", ok: warmupOk, dtSec: warmup.dtSec, file: warmupPath, count: warmupArr.length })

// ---------- ② 步骤1 ----------
banner("② 步骤1 装模作样｜概念与价值感性认识")
const step1Messages = [
  { role: "system", content: SYSTEM_BASE },
  { role: "user", content: conceptIntro },
  { role: "user", content: `🔹 问题：${STEP1_QUESTION}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${STEP1_SCHEMA}` },
]
const step1 = await callLlm({ messages: step1Messages })
const step1Data = parseJson(step1.content)
const step1Errs = []
if (!step1Data.valueLead) step1Errs.push("valueLead 缺失")
if (!step1Data.officialDefinition) step1Errs.push("officialDefinition 缺失")
if (!Array.isArray(step1Data.glossaryTerms) || step1Data.glossaryTerms.length === 0) step1Errs.push("glossaryTerms 为空")
if (!step1Data.diagram || !["gdn-gate", "attention-on2", "mamba-ssm", "moe-route", "generic-flow"].includes(step1Data.diagram.animationKey)) step1Errs.push("diagram.animationKey 非法")
if (!step1Data.loop?.prompt) step1Errs.push("loop.prompt 缺失")
const step1Ok = step1Errs.length === 0
console.log(`[${mark(step1Ok)}] Schema 校验：错误=${step1Errs.length}`)
console.log(`    • 价值铺垫首句: ${String(step1Data.valueLead || "").slice(0, 60)}…`)
console.log(`    • 专业定义首句: ${String(step1Data.officialDefinition || "").slice(0, 60)}…`)
console.log(`    • 术语拆解    : ${(step1Data.glossaryTerms || []).length} 条`)
console.log(`    • 示意图      : ${step1Data.diagram?.animationKey} → ${step1Data.diagram?.caption}`)
console.log(`    • 闭环提问    : ${step1Data.loop?.prompt}`)
if (step1Errs.length) step1Errs.forEach(e => console.log(`      ↳ ${e}`))
const step1Path = saveSample("step1-sample.json", { _meta: { dtSec: step1.dtSec, ok: step1Ok, errs: step1Errs }, data: step1Data })
console.log(`[📁] 已保存：${step1Path} (${step1.dtSec}s)`)
pushStage({ name: "step1", ok: step1Ok, dtSec: step1.dtSec, file: step1Path, errs: step1Errs })

// ---------- ③ 步骤2（history = step1）----------
banner("③ 步骤2 像模像样｜算法原理与数学本质")
const step2Messages = [
  { role: "system", content: SYSTEM_BASE },
  { role: "user", content: conceptIntro },
  { role: "user", content: `🔹 step1问题：${STEP1_QUESTION}` },
  { role: "assistant", content: JSON.stringify(step1Data) },
  { role: "user", content: `🔹 问题：${STEP2_QUESTION}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${STEP2_SCHEMA}` },
]
const step2 = await callLlm({ messages: step2Messages })
const step2Data = parseJson(step2.content)
const step2Errs = []
if (!Array.isArray(step2Data.timeline) || step2Data.timeline.length === 0) step2Errs.push("timeline 为空")
else {
  step2Data.timeline.forEach((t, i) => {
    if (!t.era || !t.tech || !t.problem) step2Errs.push(`timeline[${i}] 关键字段缺失`)
    if (!t.algo) step2Errs.push(`timeline[${i}] 缺 algo（扩展版要求）`)
    if (!t.formula) step2Errs.push(`timeline[${i}] 缺 formula（扩展版要求）`)
    if (!t.valueLimit) step2Errs.push(`timeline[${i}] 缺 valueLimit（扩展版要求）`)
  })
}
if (!step2Data.principle?.coreIdea) step2Errs.push("principle.coreIdea 缺失")
if (!Array.isArray(step2Data.principle?.steps) || step2Data.principle.steps.length === 0) step2Errs.push("principle.steps 为空")
if (!step2Data.math?.formula) step2Errs.push("math.formula 缺失")
if (!step2Data.math?.calculationExample) step2Errs.push("math.calculationExample 缺失")
if (!Array.isArray(step2Data.math?.variables) || step2Data.math.variables.length === 0) step2Errs.push("math.variables 为空")
if (!step2Data.loop?.prompt) step2Errs.push("loop.prompt 缺失")
const step2Ok = step2Errs.length === 0
console.log(`[${mark(step2Ok)}] Schema 校验：错误=${step2Errs.length}`)
console.log(`    • 时间轴节点数 : ${(step2Data.timeline || []).length}`)
console.log(`    • 扩展字段命中 : algo=${step2Data.timeline?.every(t => t.algo) ? "✓" : "✗"} formula=${step2Data.timeline?.every(t => t.formula) ? "✓" : "✗"} valueLimit=${step2Data.timeline?.every(t => t.valueLimit) ? "✓" : "✗"}`)
console.log(`    • 分步帧数量   : ${(step2Data.principle?.steps || []).length}`)
console.log(`    • 公式         : ${String(step2Data.math?.formula || "").slice(0, 60)}`)
console.log(`    • Token 演算段 : ${String(step2Data.math?.calculationExample || "").slice(0, 60)}…`)
console.log(`    • 变量数       : ${(step2Data.math?.variables || []).length}`)
console.log(`    • 闭环提问     : ${step2Data.loop?.prompt}`)
if (step2Errs.length) step2Errs.forEach(e => console.log(`      ↳ ${e}`))
const step2Path = saveSample("step2-sample.json", { _meta: { dtSec: step2.dtSec, ok: step2Ok, errs: step2Errs }, data: step2Data })
console.log(`[📁] 已保存：${step2Path} (${step2.dtSec}s)`)
pushStage({ name: "step2", ok: step2Ok, dtSec: step2.dtSec, file: step2Path, errs: step2Errs })

// ---------- ④ 步骤3（history = step1 + step2）----------
banner("④ 步骤3 有模有样｜客户价值与商业价值")
const step3Messages = [
  { role: "system", content: SYSTEM_BASE },
  { role: "user", content: conceptIntro },
  { role: "user", content: `🔹 step1问题：${STEP1_QUESTION}` },
  { role: "assistant", content: JSON.stringify(step1Data) },
  { role: "user", content: `🔹 step2问题：${STEP2_QUESTION}` },
  { role: "assistant", content: JSON.stringify(step2Data) },
  { role: "user", content: `🔹 问题：${STEP3_QUESTION}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${STEP3_SCHEMA}` },
]
const step3 = await callLlm({ messages: step3Messages })
const step3Data = parseJson(step3.content)
const step3Errs = []
if (!step3Data.engSummary) step3Errs.push("engSummary 缺失")
if (!Array.isArray(step3Data.engMetrics) || step3Data.engMetrics.length === 0) step3Errs.push("engMetrics 为空")
else step3Data.engMetrics.forEach((m, i) => {
  if (!m.name || !m.baseline || !m.current || !m.delta) step3Errs.push(`engMetrics[${i}] 关键字段缺失`)
  if (!["up", "down", "neutral"].includes(m.favor)) step3Errs.push(`engMetrics[${i}].favor 非法`)
})
if (!step3Data.bizSummary) step3Errs.push("bizSummary 缺失")
if (!Array.isArray(step3Data.bizScenarios) || step3Data.bizScenarios.length === 0) step3Errs.push("bizScenarios 为空")
const step3Ok = step3Errs.length === 0
console.log(`[${mark(step3Ok)}] Schema 校验：错误=${step3Errs.length}`)
console.log(`    • 工程收益首句: ${String(step3Data.engSummary || "").slice(0, 60)}…`)
console.log(`    • 工程指标    : ${(step3Data.engMetrics || []).length} 条`)
console.log(`    • 业务价值首句: ${String(step3Data.bizSummary || "").slice(0, 60)}…`)
console.log(`    • 业务场景    : ${(step3Data.bizScenarios || []).length} 条`)
if (step3Errs.length) step3Errs.forEach(e => console.log(`      ↳ ${e}`))
const step3Path = saveSample("step3-sample.json", { _meta: { dtSec: step3.dtSec, ok: step3Ok, errs: step3Errs }, data: step3Data })
console.log(`[📁] 已保存：${step3Path} (${step3.dtSec}s)`)
pushStage({ name: "step3", ok: step3Ok, dtSec: step3.dtSec, file: step3Path, errs: step3Errs })

// ---------- ⑤ 费曼内化评估 ----------
banner("⑤ 费曼内化（模拟用户复述 → LLM 评估 + 图谱挂载）")
const userAnswers = {
  biz: "这个技术让 API 调用更省钱：以前长文档问答每百页要等 10 秒，现在 3 秒，账单减 40%。",
  cto: "从 O(N²) 降到 O(N)，同等并发下显存预算砍半；切换成本主要在 prompt 模板复核。",
  dev: "把 attention 层替换成门控增量状态更新，调参要盯住 g_t 和 β_t 两个门控系数。",
}
const context = [
  { key: "step1", answer: step1Data },
  { key: "step2", answer: step2Data },
  { key: "step3", answer: step3Data },
]
const feynmanMessages = [
  { role: "system", content: FEYNMAN_SYSTEM },
  { role: "user", content: `讲解内容 JSON：\n${JSON.stringify(context)}\n\n学习者原问题：${rawQuestion}\n\n学习者分别对三类听众的复述：\n- 业务总监：${userAnswers.biz}\n- CTO：${userAnswers.cto}\n- 开发者：${userAnswers.dev}` },
]
const fey = await callLlm({ messages: feynmanMessages, temperature: 0.5 })
const feyData = parseJson(fey.content)
const feyErrs = []
if (!Array.isArray(feyData.reviews) || feyData.reviews.length !== 3) feyErrs.push("reviews 需 3 条")
else feyData.reviews.forEach((r, i) => {
  if (!["biz", "cto", "dev"].includes(r.role)) feyErrs.push(`reviews[${i}].role 非法`)
  if (typeof r.score !== "number") feyErrs.push(`reviews[${i}].score 非数字`)
})
if (!feyData.graph?.concept) feyErrs.push("graph.concept 缺失")
if (!feyData.graph?.parent) feyErrs.push("graph.parent 缺失")
const feyOk = feyErrs.length === 0
console.log(`[${mark(feyOk)}] Schema 校验：错误=${feyErrs.length}`)
console.log(`    • 评估条目: ${(feyData.reviews || []).length}`)
;(feyData.reviews || []).forEach(r => console.log(`      ${r.role.toUpperCase()} ${r.score} · ${String(r.oneLine || "").slice(0, 50)}`))
console.log(`    • 图谱挂载: ${feyData.graph?.concept} ← ${feyData.graph?.parent} · ${feyData.graph?.relation}`)
console.log(`    • 精髓    : ${feyData.graph?.oneLine}`)
if (feyErrs.length) feyErrs.forEach(e => console.log(`      ↳ ${e}`))
const feyPath = saveSample("feynman-review-sample.json", { _meta: { dtSec: fey.dtSec, ok: feyOk, errs: feyErrs }, data: feyData, userAnswers })
console.log(`[📁] 已保存：${feyPath} (${fey.dtSec}s)`)
pushStage({ name: "feynmanReview", ok: feyOk, dtSec: fey.dtSec, file: feyPath, errs: feyErrs })

// ---------- 汇总 ----------
report.finishedAt = new Date().toISOString()
report.summary = {
  allOk: report.stages.every(s => s.ok),
  totalDtSec: report.stages.reduce((a, b) => a + (b.dtSec || 0), 0),
  perStage: report.stages.map(s => ({ name: s.name, ok: s.ok, dtSec: s.dtSec })),
}
saveSample("main-flow-report.json", report)

banner("📊 主链路测试汇总")
report.stages.forEach(s => console.log(`  ${mark(s.ok)} ${s.name.padEnd(14)} ${String(s.dtSec).padStart(5)}s  → ${s.file}`))
console.log(`\n  总耗时：${report.summary.totalDtSec.toFixed(1)}s`)
console.log(`  汇总报告：${path.relative(ROOT, path.join(OUT_DIR, "main-flow-report.json"))}`)
console.log("═".repeat(70))

if (!report.summary.allOk) process.exit(2)
