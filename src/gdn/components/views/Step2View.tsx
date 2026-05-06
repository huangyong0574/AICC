import type { Step2Answer, TimelineNodeV2 } from "../../types"
import { AlertCircle, ArrowRight, Layers, Sigma } from "lucide-react"
import { PrincipleView } from "./PrincipleView"
import { MathView } from "./MathView"
import { Formula } from "../Formula"
import { LoopBlock } from "../LoopBlock"
import { StreamingSection } from "../StreamingSection"

/**
 * Step2View 支持渐进式渲染：
 * - streaming=true 时 data 可能是 Partial<Step2Answer>，已就绪段落渲染真实内容
 * - 未就绪段落走骨架 + 叙事加载文案
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
    <div className="space-y-5">
      {/* ① 扩展版时间轴 */}
      <StreamingSection
        icon={<AlertCircle className="h-4 w-4 text-primary" />}
        title="1. 技术演进时间轴（算法 + 公式 + 问题 + 限制）"
        tone="muted"
        ready={!!d.timeline && d.timeline.length > 0}
        streaming={streaming}
        loadingText="正在梳理技术演进脉络…"
        skeletonLines={3}
      >
        <TimelineV2 nodes={d.timeline || []} />
      </StreamingSection>

      {/* ② 分步静态帧 */}
      <StreamingSection
        icon={<Layers className="h-4 w-4 text-primary" />}
        title="2. 分步静态帧 · 当前技术实现原理"
        tone="muted"
        ready={!!d.principle}
        streaming={streaming}
        loadingText="正在拆解分步原理…"
        skeletonLines={4}
      >
        {d.principle && <PrincipleView data={d.principle} />}
      </StreamingSection>

      {/* ③ 数学 + token 演算 */}
      <StreamingSection
        icon={<Sigma className="h-4 w-4 text-primary" />}
        title="3. 数学本质 · 真实 token 代入演算"
        tone="muted"
        ready={!!d.math}
        streaming={streaming}
        loadingText="正在代入 token 做数学演算…"
        skeletonLines={3}
      >
        {d.math && <MathView data={d.math} />}
      </StreamingSection>

      {/* ④ 闭环问题 */}
      <StreamingSection
        icon={<AlertCircle className="h-4 w-4 text-primary" />}
        title="4. 闭环问题"
        tone="primary"
        ready={!!d.loop}
        streaming={streaming}
        loadingText="正在布置闭环思考题…"
        skeletonLines={2}
        hideHeader={!!d.loop}
      >
        {d.loop && <LoopBlock loop={d.loop} stepLabel="步骤2" />}
      </StreamingSection>
    </div>
  )
}

function TimelineV2({ nodes }: { nodes: TimelineNodeV2[] }) {
  if (!nodes || nodes.length === 0) return <div className="text-xs text-muted-foreground">暂无时间轴数据</div>

  const dotColors = [
    "bg-muted-foreground/30 ring-muted-foreground/10",
    "bg-muted-foreground/50 ring-muted-foreground/15",
    "bg-primary/60 ring-primary/15",
    "bg-primary ring-primary/25",
  ]
  const labelColors = [
    "text-muted-foreground/50",
    "text-muted-foreground/70",
    "text-primary/80",
    "text-primary",
  ]
  const cardBorders = [
    "border-muted-foreground/20",
    "border-muted-foreground/30",
    "border-primary/30",
    "border-primary/40",
  ]

  return (
    <div className="relative overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-start gap-0 min-w-[640px] pr-4">
        {nodes.map((t, i) => {
          const idx = Math.min(i, dotColors.length - 1)
          const isLast = i === nodes.length - 1
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center relative animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {i > 0 && (
                <div
                  className={`absolute top-3 left-0 right-1/2 h-px z-0 ${
                    i === 1
                      ? "bg-gradient-to-r from-transparent via-muted-foreground/30 to-muted-foreground/40"
                      : i === 2
                      ? "bg-gradient-to-r from-muted-foreground/40 via-primary/30 to-primary/40"
                      : "bg-gradient-to-r from-primary/40 to-primary/60"
                  }`}
                  style={{ width: "calc(100%)" }}
                />
              )}

              <div className={`relative z-10 h-6 w-6 rounded-full ${dotColors[idx]} ring-4 ring-offset-2 ring-offset-card flex items-center justify-center transition-transform duration-300 hover:scale-125`}>
                <span className={`text-[9px] font-mono font-bold ${labelColors[idx]}`}>
                  {(t.era || "").slice(-2)}
                </span>
              </div>

              <div className={`mt-3 w-full mx-1 rounded-lg border ${cardBorders[idx]} bg-background/80 p-2.5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="text-xs font-semibold text-foreground mb-1">{t.tech}</div>
                {t.algo && (
                  <div className="text-[10px] text-foreground/70 leading-snug mb-1.5">{t.algo}</div>
                )}
                {t.formula && (
                  <div className="rounded bg-muted/40 px-1.5 py-1 mb-1.5 overflow-x-auto">
                    <Formula tex={t.formula} inline />
                  </div>
                )}
                {t.problem && (
                  <div className="text-[10px] leading-tight mb-1 flex items-start gap-1">
                    <span className="shrink-0 mt-0.5 text-destructive/80">·</span>
                    <span className="text-foreground/70"><span className="text-destructive/80 mr-1">问题：</span>{t.problem}</span>
                  </div>
                )}
                {t.valueLimit && (
                  <div className="text-[10px] leading-tight mb-1 flex items-start gap-1">
                    <span className="shrink-0 mt-0.5 text-warning/80">·</span>
                    <span className="text-foreground/70"><span className="text-warning/80 mr-1">限制：</span>{t.valueLimit}</span>
                  </div>
                )}
                {t.nextDriver && (
                  <div className="text-[10px] leading-tight flex items-start gap-1">
                    <ArrowRight className="h-2.5 w-2.5 shrink-0 mt-0.5 text-primary/80" />
                    <span className="text-foreground/70">{t.nextDriver}</span>
                  </div>
                )}
              </div>

              {isLast && (
                <div className="absolute top-3 left-1/2 right-0 h-px bg-gradient-to-r from-primary/60 to-transparent" style={{ width: "50%" }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
