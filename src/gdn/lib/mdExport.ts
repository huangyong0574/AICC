import type {
  Note, FeynmanDigest,
  Step1Answer, Step2Answer, Step3Answer, Step4Answer, StepEntry,
} from "../types"

function bulletList(arr: string[] = []): string {
  return arr.map(s => `- ${s}`).join("\n")
}

function frontmatter(note: Note): string {
  const tags = note.tags.map(t => `"${t.replace(/"/g, "'")}"`).join(", ")
  return `---
title: ${JSON.stringify(note.topic)}
question: ${JSON.stringify(note.rawQuestion)}
tags: [${tags}]
parent: Transformer
createdAt: ${note.createdAt}
---

`
}

function sectionStep1(a: Step1Answer): string {
  const glossary = a.glossaryTerms.map(g => `- **${g.term}**
  - 大白话：${g.plainHint}
  - 技术含义：${g.techNote}`).join("\n")
  return `## L1 类比理解

**价值铺垫**：${a.valueLead}

**专业定义**：${a.officialDefinition}

**术语拆解**：
${glossary}

**示意图**：\`${a.diagram.animationKey}\` — ${a.diagram.caption}

---

**闭环小练习**：${a.loop.prompt}
${a.loop.userAnswer ? `\n> 你的回答：${a.loop.userAnswer}\n` : ""}`
}

function sectionStep2(a: Step2Answer): string {
  const applicable = a.applicable.map(c => `| ${c.scenario} | ${c.fit} | ${c.reason} |`).join("\n")
  const inapplicable = a.inapplicable.map(c => `| ${c.scenario} | ${c.fit} | ${c.reason} |`).join("\n")
  return `## L2 场景选择

**导读**：${a.intro}

### 适用场景

| 场景 | 匹配度 | 原因 |
| --- | --- | --- |
${applicable}

### 不适用场景

| 场景 | 匹配度 | 原因 |
| --- | --- | --- |
${inapplicable}

**选型标准**：${a.selectionCriteria}

---

**闭环小练习**：${a.loop.prompt}
${a.loop.userAnswer ? `\n> 你的回答：${a.loop.userAnswer}\n` : ""}`
}

function sectionStep3(a: Step3Answer): string {
  const tlRows = a.timeline.map(t => `| ${t.era} | ${t.tech} | ${t.algo || ""} | ${t.formula ? "`" + t.formula + "`" : ""} | ${t.problem} | ${t.valueLimit || ""} |`).join("\n")
  const steps = a.principle.steps.map((s, i) => `${i + 1}. **${s.label}** ${s.symbol ? `\`${s.symbol}\`` : ""} — ${s.desc}`).join("\n")
  const vars = a.math.variables.map(v => `| \`${v.symbol}\` | ${v.meaning} | ${v.trainRole} | ${v.inferRole} |`).join("\n")
  return `## L3 深入原理

### 3.1 技术演进时间轴

| 年代 | 技术 | 算法原理 | 公式 | 技术问题 | 价值限制 |
| --- | --- | --- | --- | --- | --- |
${tlRows}

### 3.2 分步静态帧演示

**核心思想**：${a.principle.coreIdea}

${steps}

> 关键点：${a.principle.note}

### 3.3 数学本质 Token 代入演算

**公式**

\`\`\`
${a.math.formula}
\`\`\`

**直觉**：${a.math.intuition}

**代入实际 token 演算**：
${a.math.calculationExample}

| 变量 | 含义 | 训练阶段 | 推理阶段 |
| --- | --- | --- | --- |
${vars}

**训练阶段流程**：${a.math.trainFlow}

**推理阶段流程**：${a.math.inferFlow}

---

**闭环小练习**：${a.loop.prompt}
${a.loop.userAnswer ? `\n> 你的回答：${a.loop.userAnswer}\n` : ""}`
}

function sectionStep4(a: Step4Answer): string {
  return `## L4 本质总结

**一句话本质**：${a.oneLiner}

**认知锚定**：${a.anchor}

### 认知翻转对比

| Before | After |
| --- | --- |
| ${a.contrastPair.before} | ${a.contrastPair.after} |

**框架归位**：${a.frameworkNote}

### Key Takeaways

${a.takeaway.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
}

function sectionFeynman(f: FeynmanDigest): string {
  const parts: string[] = ["## 费曼内化"]
  parts.push(`### 业务总监视角\n\n${f.answers.biz || "_（未作答）_"}\n`)
  parts.push(`### CTO 视角\n\n${f.answers.cto || "_（未作答）_"}\n`)
  parts.push(`### 开发者视角\n\n${f.answers.dev || "_（未作答）_"}\n`)
  parts.push(`### LLM 评估`)
  f.reviews.forEach(r => {
    parts.push(`- **${r.role}** 得分 ${r.score} · ${r.oneLine}`)
    if (r.strengths.length) parts.push(`  - 到位：${r.strengths.join("；")}`)
    if (r.gaps.length) parts.push(`  - 缺口：${r.gaps.join("；")}`)
    if (r.followups.length) parts.push(`  - 追问：${r.followups.join("；")}`)
  })
  parts.push(`\n### 知识图谱挂载\n\n- 概念：**${f.graphDelta.concept}**\n- 父节点：${f.graphDelta.parent}\n- 关系：${f.graphDelta.relation}\n- 标签：${f.graphDelta.tags.join(", ")}\n- 精髓：${f.graphDelta.oneLine}\n`)
  return parts.join("\n")
}

function findStep<K extends StepEntry["key"]>(note: Note, key: K): Extract<StepEntry, { key: K }>["answer"] | undefined {
  const e = (note.steps || []).find(s => s.key === key)
  return (e?.answer as any) || undefined
}

export function toMarkdown(note: Note): string {
  const out: string[] = [frontmatter(note), `# ${note.topic}\n`, `> 原始问题：${note.rawQuestion}\n`]
  const s1 = findStep(note, "step1") as Step1Answer | undefined
  const s2 = findStep(note, "step2") as Step2Answer | undefined
  const s3 = findStep(note, "step3") as Step3Answer | undefined
  const s4 = findStep(note, "step4") as Step4Answer | undefined
  if (s1) out.push(sectionStep1(s1))
  if (s2) out.push(sectionStep2(s2))
  if (s3) out.push(sectionStep3(s3))
  if (s4) out.push(sectionStep4(s4))
  if (note.feynman) out.push(sectionFeynman(note.feynman))
  return out.join("\n")
}

export function downloadMarkdown(note: Note) {
  const blob = new Blob([toMarkdown(note)], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${note.topic.replace(/[\\/:*?"<>|]/g, "_")}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export function toSpeechScript(note: Note): string {
  const lines: string[] = []
  const s1 = findStep(note, "step1") as Step1Answer | undefined
  const s4 = findStep(note, "step4") as Step4Answer | undefined
  if (s1) lines.push(`价值铺垫：${s1.valueLead}\n官方定义：${s1.officialDefinition}`)
  if (s4) lines.push(`一句话本质：${s4.oneLiner}\n认知锚定：${s4.anchor}`)
  return lines.join("\n\n")
}

export function validateNote(note: Note): string[] {
  const errs: string[] = []
  if (!note.topic) errs.push("缺少 topic")
  if (!Array.isArray(note.steps) || note.steps.length !== 4) errs.push("steps 必须为 4 条")
  return errs
}

export function toPptBullets(note: Note): string {
  const s1 = findStep(note, "step1") as Step1Answer | undefined
  const s3 = findStep(note, "step3") as Step3Answer | undefined
  const s4 = findStep(note, "step4") as Step4Answer | undefined
  const lines: string[] = []
  lines.push(note.topic)
  if (s1) { lines.push(""); lines.push("- 价值铺垫：" + s1.valueLead); lines.push("- 专业定义：" + s1.officialDefinition) }
  if (s3) { lines.push(""); lines.push("- 核心机制：" + s3.principle.coreIdea) }
  if (s4) { lines.push(""); lines.push("- 一句话本质：" + s4.oneLiner); lines.push("- 认知锚定：" + s4.anchor) }
  return lines.join("\n")
}

export { bulletList }
