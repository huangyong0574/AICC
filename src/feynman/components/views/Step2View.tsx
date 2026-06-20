import type { Step2Answer, ScenarioCard } from "../../types"
import { StreamingSection } from "../StreamingSection"
import { RichText } from "../RichText"
import { Eyebrow, IconHead } from "./SectionHeader"

/**
 * Step2View — L2 场景边界（premium 版，对齐 aicc_scenario_boundary_premium.html）
 * 编辑体表头（eyebrow / 圆圈图标）+ 中性卡片 + 信号格评级 + 选型条件 chips
 * 支持渐进式渲染
 */
export function Step2View({
  data,
  streaming = false,
}: {
  data: Partial<Step2Answer> | null
  streaming?: boolean
}) {
  const d = data ?? {}

  return (
    <div className="space-y-7">
      {/* 00 场景导读 */}
      <StreamingSection
        icon={null}
        title="00 — 场景导读"
        tone="primary"
        variant="plain"
        header={<Eyebrow no="00" label="场景导读" />}
        ready={!!d.intro}
        streaming={streaming}
        loadingText="正在分析该技术的适用边界…"
        skeletonLines={3}
      >
        {d.intro && (
          <p className="text-[14.5px] leading-[1.85] text-foreground/80">
            <RichText text={d.intro} />
          </p>
        )}
      </StreamingSection>

      {/* 适用场景 */}
      <StreamingSection
        icon={null}
        title="适用场景"
        tone="success"
        variant="plain"
        header={<IconHead tone="ok" label="适用场景" caption="WHERE IT FITS" />}
        ready={!!d.applicable && d.applicable.length > 0}
        streaming={streaming}
        loadingText="正在列举适用的业务场景…"
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

      {/* 不适用场景 */}
      <StreamingSection
        icon={null}
        title="不适用场景"
        tone="destructive"
        variant="plain"
        header={<IconHead tone="bad" label="不适用场景" caption="WHERE IT DOESN'T" />}
        ready={!!d.inapplicable && d.inapplicable.length > 0}
        streaming={streaming}
        loadingText="正在分析不适用的场景…"
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

      {/* 04 选型决策标准 */}
      <StreamingSection
        icon={null}
        title="04 — 选型决策标准"
        tone="muted"
        variant="plain"
        header={<Eyebrow no="04" label="选型决策标准" />}
        ready={!!d.selectionCriteria}
        streaming={streaming}
        loadingText="正在总结选型决策标准…"
        skeletonLines={2}
      >
        {d.selectionCriteria && (
          <p className="mb-3 text-[13.5px] leading-relaxed text-foreground/80">
            <RichText text={d.selectionCriteria} />
          </p>
        )}
        {!!d.selectionConditions?.length && (
          <div className="flex flex-wrap gap-2">
            {d.selectionConditions.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-[12.5px] text-foreground/80"
              >
                <span className="font-serif italic text-muted-foreground" style={{ fontFamily: "Georgia, 'Songti SC', serif" }}>{i + 1}</span>
                {c}
              </span>
            ))}
          </div>
        )}
      </StreamingSection>
    </div>
  )
}

/** fit → 信号格评级（格数 + 颜色 + 文字色，对齐设计稿） */
const FIT_META: Record<ScenarioCard["fit"], { label: string; bars: number; barColor: string; text: string }> = {
  excellent: { label: "极佳", bars: 3, barColor: "hsl(var(--success))", text: "text-success" },
  good: { label: "适合", bars: 2, barColor: "hsl(var(--success))", text: "text-success" },
  neutral: { label: "一般", bars: 2, barColor: "hsl(var(--muted-foreground))", text: "text-muted-foreground" },
  poor: { label: "较差", bars: 1, barColor: "hsl(var(--warning))", text: "text-warning" },
  unsuitable: { label: "不宜", bars: 1, barColor: "hsl(var(--destructive))", text: "text-destructive" },
}

function FitRating({ fit }: { fit: ScenarioCard["fit"] }) {
  const m = FIT_META[fit] ?? FIT_META.neutral
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold ${m.text}`}>
      <span className="inline-flex items-end gap-[1.5px]">
        {[0, 1, 2].map(i => (
          <i
            key={i}
            className="h-[9px] w-[3px] rounded-[1px]"
            style={{ background: i < m.bars ? m.barColor : "hsl(var(--border))" }}
          />
        ))}
      </span>
      {m.label}
    </span>
  )
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
  const m = FIT_META[card.fit] ?? FIT_META.neutral
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 animate-fade-in-up transition-shadow hover:shadow-sm"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-foreground">{card.scenario}</span>
        <FitRating fit={card.fit} />
      </div>
      <p className="mb-2.5 text-[12.5px] leading-relaxed text-foreground/70"><RichText text={card.description} /></p>
      <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className={`mr-1 font-medium ${m.text}`}>{positive ? "Why" : "Why not"}</span>
        <RichText text={card.reason} />
      </p>
      {card.example && (
        <p className="border-l-2 border-border pl-2.5 text-[12px] italic leading-relaxed text-muted-foreground/80">
          <RichText text={card.example} />
        </p>
      )}
    </div>
  )
}
