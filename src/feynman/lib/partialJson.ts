/**
 * 流式 JSON 部分解析工具
 *
 * 背景：LLM 以 SSE 流式返回 JSON 字符串，结构固定（key 有序），
 * 我们希望在每个字段写完后立即渲染，而不是等整段 JSON 闭合。
 *
 * 策略：按序号找到每个 key 的位置，从 `:` 后开始按首字符类型
 * （"、{、[）做严格的括号/引号平衡扫描，能解析出完整的 value 才尝试 JSON.parse。
 * 未写完的字段直接跳过。这样既避免 try/catch 暴风雨，也不会误取到半截内容。
 */

/** 从 start 起查找匹配的 close，返回 close 的下一个下标；未闭合返回 -1 */
function findBalanced(s: string, start: number, open: string, close: string): number {
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === "\\") {
        esc = true
        continue
      }
      if (c === '"') {
        inStr = false
        continue
      }
    } else {
      if (c === '"') {
        inStr = true
        continue
      }
      if (c === open) depth++
      else if (c === close) {
        depth--
        if (depth === 0) return i + 1
      }
    }
  }
  return -1
}

/** 查找字符串字面量结束位置（处理转义），返回结束引号的下一个下标；未闭合返回 -1 */
function findStringEnd(s: string, start: number): number {
  // s[start] 必须是 "
  let esc = false
  for (let i = start + 1; i < s.length; i++) {
    const c = s[i]
    if (esc) {
      esc = false
      continue
    }
    if (c === "\\") {
      esc = true
      continue
    }
    if (c === '"') return i + 1
  }
  return -1
}

/**
 * 按给定顺序的 key 从 buf 中抽取已经写完整的字段值并 JSON.parse。
 * 只返回已完整的字段；未完整的字段不在返回对象里。
 */
export function extractCompletedFields<T extends Record<string, any>>(
  buf: string,
  keys: readonly string[],
): Partial<T> {
  const result: Record<string, any> = {}

  for (const k of keys) {
    const keyStr = `"${k}"`
    const keyIdx = buf.indexOf(keyStr)
    if (keyIdx < 0) continue

    // 找 key 后的冒号
    const colonIdx = buf.indexOf(":", keyIdx + keyStr.length)
    if (colonIdx < 0) continue

    // 跳过空白
    let vStart = colonIdx + 1
    while (vStart < buf.length && /\s/.test(buf[vStart])) vStart++
    if (vStart >= buf.length) continue

    const firstChar = buf[vStart]
    let vEnd = -1

    if (firstChar === '"') {
      vEnd = findStringEnd(buf, vStart)
    } else if (firstChar === "{") {
      vEnd = findBalanced(buf, vStart, "{", "}")
    } else if (firstChar === "[") {
      vEnd = findBalanced(buf, vStart, "[", "]")
    } else {
      // 数字/布尔/null：扫到 , 或 } 为止（保守处理，这里用不到）
      const m = buf.slice(vStart).match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/)
      if (m) vEnd = vStart + m[0].length
    }

    if (vEnd < 0) continue

    try {
      result[k] = JSON.parse(buf.slice(vStart, vEnd))
    } catch {
      // 解析失败，可能是内部还有未闭合的嵌套，跳过
    }
  }

  return result as Partial<T>
}

/** 便捷：step1 字段顺序 */
export const STEP1_KEYS = [
  "valueLead",
  "officialDefinition",
  "source",
  "essence",
  "dims",
  "glossaryTerms",
] as const

/** 便捷：step2 字段顺序 — 场景选择（与 schema 一致） */
export const STEP2_KEYS = [
  "intro",
  "applicable",
  "inapplicable",
  "selectionCriteria",
  "selectionConditions",
] as const

/** 便捷：step3 字段顺序 — 深入原理（与 schema 一致） */
export const STEP3_KEYS = [
  "principle",
  "math",
] as const

/** 便捷：step4 字段顺序 — 本质总结（与 schema 一致） */
export const STEP4_KEYS = [
  "oneLiner",
  "anchor",
  "contrastPair",
  "frameworkNote",
  "takeaway",
] as const
