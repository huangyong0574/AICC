import { Formula } from "./Formula"

/**
 * RichText - LLM 文本统一渲染组件
 * 解析 **高亮关键词** 和 $LaTeX公式$ 标记：
 * - **...**  → 加粗主色文字
 * - $...$    → KaTeX 行内公式
 * - 其余     → 普通文本
 *
 * 用法: <RichText text={data.someField} />
 */
export function RichText({ text }: { text: string }) {
  if (!text) return null
  const tokens = splitRichTokens(text)
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === "formula") {
          return <Formula key={i} tex={tok.content} inline className="mx-0.5" />
        }
        if (tok.type === "bold") {
          return (
            <mark key={i} className="text-primary font-bold bg-transparent">
              {tok.content}
            </mark>
          )
        }
        return <span key={i}>{tok.content}</span>
      })}
    </>
  )
}

export type RichToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "formula"; content: string }

/**
 * 将文本拆分为 text / bold / formula 三类 token。
 * 正则说明:
 *  - \$[^$]+\$    匹配 $...$（内部不含 $）
 *  - \*\*.+?\*\*  匹配 **...**（非贪婪，允许内部含 *）
 */
export function splitRichTokens(text: string): RichToken[] {
  // 同时匹配 $ 公式 和 ** 加粗
  const regex = /(\$[^$]+\$|\*\*.+?\*\*)/g
  const result: RichToken[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // 前置普通文本
    if (match.index > lastIdx) {
      result.push({ type: "text", content: text.slice(lastIdx, match.index) })
    }
    const raw = match[1]
    if (raw.startsWith("$") && raw.endsWith("$")) {
      result.push({ type: "formula", content: raw.slice(1, -1) })
    } else {
      // **...**
      result.push({ type: "bold", content: raw.slice(2, -2) })
    }
    lastIdx = regex.lastIndex
  }
  // 尾部普通文本
  if (lastIdx < text.length) {
    result.push({ type: "text", content: text.slice(lastIdx) })
  }
  return result
}
