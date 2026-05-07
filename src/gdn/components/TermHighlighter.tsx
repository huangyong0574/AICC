import { useMemo } from "react"
import type { GlossaryTerm } from "../types"
import { RichText } from "./RichText"

/**
 * D1: 术语悬浮提示组件
 * 扫描文本中出现的已知术语，hover 时显示通俗 + 技术双重释义
 * 文本段自动支持 **高亮** 和 $公式$ 渲染
 */
export function TermHighlighter({
  text,
  terms,
}: {
  text: string
  terms: GlossaryTerm[]
}) {
  const parts = useMemo(() => {
    if (!terms || terms.length === 0) return [{ type: "text" as const, value: text }]
    // 按长度降序排列，优先匹配长术语
    const sorted = [...terms].sort((a, b) => b.term.length - a.term.length)
    const pattern = sorted.map(t => escapeRegex(t.term)).join("|")
    const regex = new RegExp(`(${pattern})`, "g")
    const result: Array<{ type: "text" | "term"; value: string; term?: GlossaryTerm }> = []
    let lastIdx = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push({ type: "text", value: text.slice(lastIdx, match.index) })
      }
      const matched = match[1]
      const termObj = sorted.find(t => t.term === matched)
      result.push({ type: "term", value: matched, term: termObj })
      lastIdx = regex.lastIndex
    }
    if (lastIdx < text.length) {
      result.push({ type: "text", value: text.slice(lastIdx) })
    }
    return result
  }, [text, terms])

  return (
    <span>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <RichText key={i} text={p.value} />
        ) : (
          <TermChip key={i} term={p.term!} />
        ),
      )}
    </span>
  )
}

function TermChip({ term }: { term: GlossaryTerm }) {
  return (
    <span className="relative inline-block group/term">
      <span className="border-b border-dashed border-primary/50 text-primary/90 cursor-help font-medium">
        {term.term}
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg opacity-0 group-hover/term:opacity-100 transition-opacity duration-150">
        <span className="block font-medium text-foreground mb-1">{term.term}</span>
        <span className="block text-foreground/80 mb-1.5">{term.plainHint}</span>
        <span className="block text-muted-foreground text-[10px] border-t border-border/60 pt-1.5">{term.techNote}</span>
      </span>
    </span>
  )
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
