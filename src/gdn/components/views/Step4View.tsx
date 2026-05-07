import type { Step4Answer, GlossaryTerm } from "../../types"
import { Gem, Anchor, ArrowLeftRight, BookOpen, Sparkles } from "lucide-react"
import { StreamingSection } from "../StreamingSection"
import { TermHighlighter } from "../TermHighlighter"

/**
 * Step4View — L4 本质总结（McKinsey/BCG 汇报风格）
 * 支持渐进式渲染
 */
export function Step4View({
  data,
  streaming = false,
  glossaryTerms = [],
}: {
  data: Partial<Step4Answer> | null
  streaming?: boolean
  glossaryTerms?: GlossaryTerm[]
}) {
  const d = data ?? {}

  return (
    <div className="space-y-5">
      {/* 1 一句话本质 */}
      <StreamingSection
        icon={<Gem className="h-4 w-4 text-primary" />}
        title="1. 一句话本质"
        tone="primary"
        ready={!!d.oneLiner}
        streaming={streaming}
        loadingText="正在提炼一句话本质定义..."
        skeletonLines={1}
      >
        {d.oneLiner && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
            <p className="text-base font-bold text-foreground leading-relaxed text-center">
              {d.oneLiner}
            </p>
          </div>
        )}
      </StreamingSection>

      {/* 2 锚定句 */}
      <StreamingSection
        icon={<Anchor className="h-4 w-4 text-foreground/70" />}
        title="2. 认知锚定"
        tone="muted"
        ready={!!d.anchor}
        streaming={streaming}
        loadingText="正在构建记忆锚点..."
        skeletonLines={2}
      >
        {d.anchor && (
          <p className="text-sm text-foreground/85 leading-relaxed italic border-l-3 border-primary/50 pl-3">
            <TermHighlighter text={d.anchor} terms={glossaryTerms} />
          </p>
        )}
      </StreamingSection>

      {/* 3 对比对 */}
      <StreamingSection
        icon={<ArrowLeftRight className="h-4 w-4 text-primary" />}
        title="3. 认知翻转对比"
        tone="primary"
        ready={!!d.contrastPair}
        streaming={streaming}
        loadingText="正在构造学前/学后对比..."
        skeletonLines={2}
      >
        {d.contrastPair && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive/60" />
              <div className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1.5 pl-2">
                Before · 学前误区
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed line-through decoration-destructive/30 pl-2">
                {d.contrastPair.before}
              </p>
            </div>
            <div className="rounded-lg border border-success/40 bg-success/5 p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-success/70" />
              <div className="text-[10px] font-bold text-success uppercase tracking-wider mb-1.5 pl-2">
                After · 学后正解
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium pl-2">
                {d.contrastPair.after}
              </p>
            </div>
          </div>
        )}
      </StreamingSection>

      {/* 4 框架备注 */}
      <StreamingSection
        icon={<BookOpen className="h-4 w-4 text-foreground/70" />}
        title="4. 框架归位"
        tone="muted"
        ready={!!d.frameworkNote}
        streaming={streaming}
        loadingText="正在整理知识框架位置..."
        skeletonLines={2}
      >
        {d.frameworkNote && (
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            <TermHighlighter text={d.frameworkNote} terms={glossaryTerms} />
          </p>
        )}
      </StreamingSection>

      {/* 5 三条 Takeaway */}
      <StreamingSection
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        title="5. Key Takeaways"
        tone="primary"
        ready={!!d.takeaway && d.takeaway.length > 0}
        streaming={streaming}
        loadingText="正在凝练核心要点..."
        skeletonLines={3}
      >
        {d.takeaway && d.takeaway.length > 0 && (
          <div className="space-y-2">
            {d.takeaway.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground/90 leading-relaxed font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </StreamingSection>
    </div>
  )
}
