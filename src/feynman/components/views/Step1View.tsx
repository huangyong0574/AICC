import type { Step1Answer } from "../../types"
import { AlertCircle, Lightbulb, MessageCircle, ExternalLink } from "lucide-react"
import { StreamingSection } from "../StreamingSection"
import { RichText } from "../RichText"

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
      {/* ① 价值铺垫：优先精致类比叙事（痛点两难 → 换个思路 → 金句），缺则回退 valueLead */}
      <StreamingSection
        icon={<AlertCircle className="h-4 w-4 text-warning" />}
        title="1. 我们先打个比方"
        tone="warning"
        ready={!!(d.analogy || d.valueLead)}
        streaming={streaming}
        loadingText="正在从生活化案例入手，组织通俗类比…"
        skeletonLines={3}
      >
        {d.analogy ? (
          <div className="space-y-3.5">
            {d.analogy.title && (
              <div className="text-[12px] font-medium tracking-wide text-muted-foreground">{d.analogy.title}</div>
            )}
            {d.analogy.lead && (
              <p className="text-sm leading-relaxed text-foreground/90">
                <RichText text={d.analogy.lead} />
              </p>
            )}
            {!!d.analogy.dilemmas?.length && (
              <div className="divide-y divide-border rounded-lg border border-border bg-muted/30">
                {d.analogy.dilemmas.map((di, i) => (
                  <div key={i} className="flex gap-3 px-3 py-2.5">
                    <span className="min-w-[3.25rem] shrink-0 text-[12px] font-semibold text-muted-foreground">{di.label}</span>
                    <span className="text-[13px] leading-relaxed text-foreground/80">{di.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-[11px] tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />换个思路<span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-3">
              <span className="w-[3px] shrink-0 rounded-full bg-emerald-500" />
              <div className="space-y-1">
                {d.analogy.resolveTitle && (
                  <div className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">{d.analogy.resolveTitle}</div>
                )}
                {d.analogy.resolve && (
                  <p className="text-[13px] leading-relaxed text-foreground/85">
                    <RichText text={d.analogy.resolve} />
                  </p>
                )}
              </div>
            </div>
            {d.analogy.quote && (
              <figure className="py-1 text-center">
                <span className="mx-auto block h-px w-8 bg-border" />
                <p className="my-3 text-[17px] font-medium leading-relaxed text-foreground" style={{ fontFamily: "Georgia, 'Songti SC', serif" }}>
                  {d.analogy.quote}
                </p>
                {d.analogy.quoteCaption && (
                  <figcaption className="text-[12px] text-muted-foreground">{d.analogy.quoteCaption}</figcaption>
                )}
              </figure>
            )}
          </div>
        ) : d.valueLead ? (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            <RichText text={d.valueLead} />
          </p>
        ) : null}
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
              <RichText text={d.officialDefinition} />
            </p>
            {d.route && <RouteDiagram route={d.route} />}
            {d.source && (
              <div className="pt-2 border-t border-border/30 mt-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">引用论文</div>
                <div className="flex items-center gap-1.5">
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
                    <span className="text-foreground/80"><RichText text={g.plainHint} /></span>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-primary shrink-0 mt-0.5">
                      技术视角
                    </span>
                    <span className="text-foreground/60"><RichText text={g.techNote} /></span>
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

/** 机制路由图：入口 → 关键判断节点 → 多分支（泛化渲染设计稿 route 图；tone 决定分支配色） */
const ROUTE_TONE: Record<"ok" | "warn" | "danger", { text: string; dot: string }> = {
  ok: { text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  warn: { text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  danger: { text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
}

function RouteDiagram({ route }: { route: NonNullable<Step1Answer["route"]> }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-4">
      {/* 入口 → 判断节点 */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] text-foreground/80">{route.entry}</span>
        <span className="text-muted-foreground/50">→</span>
        <span className="rounded-lg border border-primary bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground">{route.gate}</span>
      </div>
      {/* 分支 */}
      <div className="mt-3.5 flex flex-wrap gap-3">
        {route.branches.map((b, i) => {
          const tone = ROUTE_TONE[b.tone] ?? ROUTE_TONE.ok
          return (
            <div key={i} className="min-w-[150px] flex-1 rounded-[10px] border border-border bg-card p-3">
              <div className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold ${tone.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {b.label}
              </div>
              <code className="font-mono text-[13px] font-semibold text-foreground">{b.target}</code>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{b.note}</div>
            </div>
          )
        })}
      </div>
      {route.note && <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">{route.note}</p>}
    </div>
  )
}
