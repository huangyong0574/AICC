import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

/**
 * LaTeX 公式渲染组件
 * - 自动把常见的纯符号写法（如 S_t = S_{t-1} k_t^T）补全为 LaTeX
 * - inline=true 行内渲染；默认块级渲染（居中显示）
 */
export function Formula({
  tex,
  inline = false,
  className = "",
}: {
  tex: string
  inline?: boolean
  className?: string
}) {
  const html = useMemo(() => {
    const normalized = normalizeTex(tex)
    try {
      return katex.renderToString(normalized, {
        displayMode: !inline,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      })
    } catch {
      return `<span class="font-mono text-sm">${escapeHtml(tex)}</span>`
    }
  }, [tex, inline])

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** 标准化常见写法 */
function normalizeTex(input: string): string {
  let s = input.trim()
  // 去除可能的 Markdown 代码块围栏
  s = s.replace(/^```[\w]*\n?|\n?```$/g, "")
  // 去除 $ 或 $$ 包装
  s = s.replace(/^\$\$?|\$\$?$/g, "").trim()
  // k_t^T / k_t^\top → k_t^{\top}；兼容 a^T
  s = s.replace(/\^T(?![a-zA-Z])/g, "^{\\top}")
  s = s.replace(/\^\\top\b/g, "^{\\top}")
  // 对下标形如 S_{t-1} 保留；裸露 S_t 等单字符下标已是合法 LaTeX
  return s
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
