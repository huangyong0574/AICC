import type { Step1Answer } from "../../types"
import { AlertCircle, Lightbulb, MessageCircle, ExternalLink } from "lucide-react"
import { StreamingSection } from "../StreamingSection"
import { Formula } from "../Formula"

/**
 * 解析文本中的 **高亮** 和 $公式$ 标记，返回 React 节点数组。
 * 支持混合：普通文本 / **加粗高亮** / $LaTeX公式$
 */
function renderRichText(text: string) {
  const tokens = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g)
  return tokens.map((tok, i) => {
    if (tok.startsWith("$") && tok.endsWith("$")) {
      const latex = tok.slice(1, -1)
      return <Formula key={i} tex={latex} inline className="mx-0.5" />
    }
    if (tok.startsWith("**") && tok.endsWith("**")) {
      const inner = tok.slice(2, -2)
      return (
        <mark key={i} className="bg-warning/20 text-warning-foreground font-semibold px-0.5 rounded-sm">
          {inner}
        </mark>
      )
    }
    return <span key={i}>{tok}</span>
  })
}

/** 解析文本中的 **高亮** 标记（不含公式），用于 valueLead */
function renderHighlighted(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-warning/20 text-warning-foreground font-semibold px-0.5 rounded-sm">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/**
 * Step1View 支持渐进式渲染：
 * - 当 streaming=true 时，data 可能是 Partial<Step1Answer>（只含已写完的字段）
 * - 已就绪的段落渲染真实内容，未就绪的段落显示骨架 + 角色化叙事加载文案
 * - streaming=false 时回退为完整渲染（data 必须完整）
 */
export function Step1View({
  data,
  streaming = false,
}: {
  data: Partial<Step1Answer> | null
  streaming?: boolean
}) {
  const d = data ?? {}

  return (
    <div className="space-y-5">
      {/* ① 价值铺垫 */}
      <StreamingSection
        icon={<AlertCircle className="h-4 w-4 text-warning" />}
        title="1. 我们先打个比方"
        tone="warning"
        ready={!!d.valueLead}
        streaming={streaming}
        loadingText="正在从生活化案例入手，组织通俗类比…"
        skeletonLines={3}
      >
        {d.valueLead && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {renderHighlighted(d.valueLead)}
          </p>
        )}
      </StreamingSection>

      {/* ② 专业定义 */}
      <StreamingSection
        icon={<Lightbulb className="h-4 w-4 text-primary" />}
        title="2. 技术视角的定义："
        tone="primary"
        ready={!!d.officialDefinition}
        streaming={streaming}
        loadingText="正在查阅论文与权威定义…"
        skeletonLines={2}
      >
        {d.officialDefinition && (
          <div className="space-y-2">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {renderRichText(d.officialDefinition)}
            </p>
            {d.source && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-border/30 mt-3">
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                <a
                  href={d.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary truncate"
                  title={d.source.url}
                >
                  {d.source.title}
                </a>
              </div>
            )}
          </div>
        )}
      </StreamingSection>

      {/* ③ 术语拆解 */}
      <StreamingSection
        icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        title="3. 猜到你这些词可能不太熟悉，先帮你弥合认知断裂点^_^"
        tone="muted"
        ready={!!d.glossaryTerms && d.glossaryTerms.length > 0}
        streaming={streaming}
        loadingText="正在拆解陌生术语，弥合认知断裂点…"
        skeletonLines={4}
      >
        {d.glossaryTerms && d.glossaryTerms.length > 0 && (
          <div className="space-y-3">
            {d.glossaryTerms.map((g, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-card p-3">
                <code className="font-mono text-xs font-bold text-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {g.term}
                </code>
                <div className="mt-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-warning shrink-0 mt-0.5">
                      通俗类比
                    </span>
                    <span className="text-foreground/80">{g.plainHint}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-primary shrink-0 mt-0.5">
                      技术视角
                    </span>
                    <span className="text-foreground/60">{g.techNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StreamingSection>
    </div>
  )
}
