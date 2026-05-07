import type { Step2Answer, ScenarioCard, GlossaryTerm } from "../../types"
import { CheckCircle2, XCircle, Target } from "lucide-react"
import { StreamingSection } from "../StreamingSection"
import { TermHighlighter } from "../TermHighlighter"
import { RichText } from "../RichText"

/**
 * Step2View — L2 场景选择
 * 双列卡片布局：适用场景 vs 不适用场景
 * 支持渐进式渲染
 */
export function Step2View({
  data,
  streaming = false,
  glossaryTerms = [],
}: {
  data: Partial<Step2Answer> | null
  streaming?: boolean
  glossaryTerms?: GlossaryTerm[]
}) {
  const d = data ?? {}

  return (
    <div className="space-y-5">
      {/* 1 场景导读 */}
      <StreamingSection
        icon={<Target className="h-4 w-4 text-primary" />}
        title="1. 场景导读"
        tone="primary"
        ready={!!d.intro}
        streaming={streaming}
        loadingText="正在分析该技术的适用边界..."
        skeletonLines={3}
      >
        {d.intro && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            <TermHighlighter text={d.intro} terms={glossaryTerms} />
          </p>
        )}
      </StreamingSection>

      {/* 2 适用场景 */}
      <StreamingSection
        icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        title="2. 适用场景"
        tone="success"
        ready={!!d.applicable && d.applicable.length > 0}
        streaming={streaming}
        loadingText="正在列举适用的业务场景..."
        skeletonLines={4}
      >
        {d.applicable && d.applicable.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {d.applicable.map((card, i) => (
              <ScenarioCardView key={i} card={card} index={i} positive />
            ))}
          </div>
        )}
      </StreamingSection>

      {/* 3 不适用场景 */}
      <StreamingSection
        icon={<XCircle className="h-4 w-4 text-destructive" />}
        title="3. 不适用场景"
        tone="destructive"
        ready={!!d.inapplicable && d.inapplicable.length > 0}
        streaming={streaming}
        loadingText="正在分析不适用的场景..."
        skeletonLines={4}
      >
        {d.inapplicable && d.inapplicable.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {d.inapplicable.map((card, i) => (
              <ScenarioCardView key={i} card={card} index={i} positive={false} />
            ))}
          </div>
        )}
      </StreamingSection>

      {/* 4 选型标准 */}
      <StreamingSection
        icon={<Target className="h-4 w-4 text-primary" />}
        title="4. 选型决策标准"
        tone="muted"
        ready={!!d.selectionCriteria}
        streaming={streaming}
        loadingText="正在总结选型决策标准..."
        skeletonLines={2}
      >
        {d.selectionCriteria && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            <TermHighlighter text={d.selectionCriteria} terms={glossaryTerms} />
          </p>
        )}
      </StreamingSection>
    </div>
  )
}

const FIT_CONFIG: Record<ScenarioCard["fit"], { label: string; color: string; bg: string }> = {
  excellent: { label: "极佳", color: "text-success", bg: "bg-success/10 border-success/30" },
  good: { label: "适合", color: "text-success/80", bg: "bg-success/5 border-success/20" },
  neutral: { label: "一般", color: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
  poor: { label: "较差", color: "text-warning", bg: "bg-warning/5 border-warning/20" },
  unsuitable: { label: "不宜", color: "text-destructive", bg: "bg-destructive/5 border-destructive/20" },
}

function ScenarioCardView({
  card,
  index,
  positive,
}: {
  card: ScenarioCard
  index: number
  positive: boolean
}) {
  const fitCfg = FIT_CONFIG[card.fit] || FIT_CONFIG.neutral

  return (
    <div
      className={`rounded-lg border p-3.5 ${fitCfg.bg} animate-fade-in-up transition-shadow hover:shadow-md`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">{card.scenario}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fitCfg.color} bg-background/60`}>
          {fitCfg.label}
        </span>
      </div>
      <p className="text-xs text-foreground/70 leading-relaxed mb-2"><RichText text={card.description} /></p>
      <div className="text-xs leading-snug">
        <span className={`font-medium ${positive ? "text-success/80" : "text-destructive/80"} mr-1`}>
          {positive ? "Why:" : "Why not:"}
        </span>
        <span className="text-foreground/70"><RichText text={card.reason} /></span>
      </div>
      {card.example && (
        <div className="mt-1.5 text-[11px] text-foreground/60 italic border-l-2 border-primary/30 pl-2">
          <RichText text={card.example} />
        </div>
      )}
    </div>
  )
}
