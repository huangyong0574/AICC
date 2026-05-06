#!/usr/bin/env node
/**
 * 功能性测试：真实调用百炼 qwen3.6-plus，验证三大步骤的第一步 Step1Answer JSON 契约。
 *
 * 使用：
 *   DASHSCOPE_API_KEY=sk-xxxx node scripts/test-step1.mjs
 *   # 可选参数
 *   DASHSCOPE_API_KEY=sk-xxxx node scripts/test-step1.mjs "什么是 GDN？"
 *
 * 输出：test-data/step1-sample.json （相对仓库根目录）
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")

const apiKey = process.env.DASHSCOPE_API_KEY || ""
if (!apiKey) {
  console.error("[x] 请先设置 DASHSCOPE_API_KEY 环境变量")
  process.exit(1)
}

const rawQuestion = process.argv[2] || "什么是 GDN（Gated Delta Network）？"
const baseUrl = process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"
const model = process.env.DASHSCOPE_MODEL || "qwen3.6-plus"

const SYSTEM_BASE = `你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
你必须只输出 JSON，不要附加任何解释、Markdown 代码块或文字。`

const conceptIntro =
  `我想搞透一个 AI 概念：「${rawQuestion}」。\n` +
  `请以 Transformer 为基线，按我后续指示分步给出结构化讲解；每一步都严格输出符合 JSON Schema 的内容。`

const STEP1_QUESTION =
  "步骤1 装模作样｜概念与价值感性认识。请按四部分输出：\n" +
  "1.【价值铺垫】用生活化通俗案例类比这个技术的价值，先揭示以前的问题。\n" +
  "2.【专业定义】给出专业定义（要依据权威资料）。\n" +
  "3.【术语拆解】基于传统 Transformer 基线，挑出客户可能不理解的专业词，给出通俗类比与技术视角双解释。\n" +
  "4.【示意图】选一个合适的动画 key（参考 animationKey 枚举），并给出一句结合通俗案例的 caption 说明。\n" +
  "最后生成一个闭环问题，让学习者用自己的话说该技术的原理与价值。"

const STEP1_SCHEMA = `{
  "valueLead": "用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（100-200 字）",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，80-150 字）",
  "glossaryTerms": [
    {"term":"专业术语名","plainHint":"用大白话/生活比喻通俗解释","techNote":"该术语在论文/文档中的技术含义"}
  ],
  "diagram": {
    "animationKey": "gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow",
    "caption": "一句结合通俗案例的说明（<60 字）"
  },
  "loop": {
    "prompt": "展示给学习者的闭环问题：请用自己的话说说当前这个概念的原理与价值（<60 字）"
  }
}
animationKey 选择：GDN 选 gdn-gate；Attention 选 attention-on2；Mamba/SSM 选 mamba-ssm；MoE 选 moe-route；其他选 generic-flow。`

const messages = [
  { role: "system", content: SYSTEM_BASE },
  { role: "user", content: conceptIntro },
  {
    role: "user",
    content: `🔹 问题：${STEP1_QUESTION}\n\n请严格按以下 JSON Schema 输出（只返回 JSON）：\n${STEP1_SCHEMA}`,
  },
]

console.log(`[>] 调用百炼 ${model} 生成 Step1 样本…`)
console.log(`[>] Question: ${rawQuestion}`)
const t0 = Date.now()

const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model,
    messages,
    temperature: 0.3,
    response_format: { type: "json_object" },
    enable_thinking: true,
    enable_search: true,
    search_options: { forced_search: true, enable_source: true, enable_citation: true },
  }),
})

if (!res.ok) {
  const txt = await res.text()
  console.error(`[x] HTTP ${res.status}:`, txt.slice(0, 400))
  process.exit(1)
}

const json = await res.json()
const content = json.choices?.[0]?.message?.content || ""
const dt = ((Date.now() - t0) / 1000).toFixed(1)
console.log(`[✓] LLM 响应完成 (${dt}s, 长度 ${content.length})`)

let parsed
try {
  parsed = JSON.parse(content)
} catch {
  const m = content.match(/\{[\s\S]*\}/)
  if (!m) {
    console.error("[x] 返回内容无法解析为 JSON")
    process.exit(1)
  }
  parsed = JSON.parse(m[0])
}

// --- Schema 校验 ---
const errs = []
if (typeof parsed.valueLead !== "string" || !parsed.valueLead.trim()) errs.push("缺少 valueLead")
if (typeof parsed.officialDefinition !== "string" || !parsed.officialDefinition.trim()) errs.push("缺少 officialDefinition")
if (!Array.isArray(parsed.glossaryTerms) || parsed.glossaryTerms.length === 0) errs.push("glossaryTerms 为空")
else {
  parsed.glossaryTerms.forEach((g, i) => {
    if (!g.term || !g.plainHint || !g.techNote) errs.push(`glossaryTerms[${i}] 缺字段`)
  })
}
if (!parsed.diagram || typeof parsed.diagram !== "object") errs.push("缺少 diagram")
else {
  const keys = ["gdn-gate", "attention-on2", "mamba-ssm", "moe-route", "generic-flow"]
  if (!keys.includes(parsed.diagram.animationKey)) errs.push(`diagram.animationKey 非法: ${parsed.diagram.animationKey}`)
  if (!parsed.diagram.caption) errs.push("diagram.caption 缺失")
}
if (!parsed.loop || typeof parsed.loop !== "object" || !parsed.loop.prompt) errs.push("缺少 loop.prompt")

if (errs.length) {
  console.error("[!] Schema 校验不通过：")
  errs.forEach(e => console.error("    -", e))
} else {
  console.log("[✓] Schema 校验全部通过")
}

// --- 保存样本 ---
const outDir = path.join(ROOT, "test-data")
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, "step1-sample.json")
const payload = {
  _meta: {
    generatedAt: new Date().toISOString(),
    model,
    rawQuestion,
    durationSec: Number(dt),
    schemaValidateErrors: errs,
  },
  data: parsed,
}
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8")
console.log(`[✓] 已保存：${path.relative(ROOT, outFile)}`)

// --- 简明摘要 ---
console.log("\n========== Step1 样本摘要 ==========")
console.log("价值铺垫:", (parsed.valueLead || "").slice(0, 80), "…")
console.log("官方定义:", (parsed.officialDefinition || "").slice(0, 80), "…")
console.log("术语数  :", (parsed.glossaryTerms || []).length, "条")
console.log("示意图  :", parsed.diagram?.animationKey, "—", parsed.diagram?.caption)
console.log("闭环提问:", parsed.loop?.prompt)
console.log("===================================")
