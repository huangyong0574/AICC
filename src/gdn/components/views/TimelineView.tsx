import type { BackgroundAnswer } from "../../types"
import { ArrowRight, AlertCircle, Lightbulb, MessageCircle, Code2 } from "lucide-react"

export function TimelineView({ data }: { data: BackgroundAnswer }) {
  return (
    <div className="space-y-5">

      {/* ① 价值铺垫：揭示矛盾/痛点 */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold text-warning uppercase tracking-wider">1. 我们先打个比方</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{data.valueLead}</p>
      </div>

      {/* ② 专业定义：权威来源 */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">2. 技术视角的定义：</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{data.officialDefinition}</p>
      </div>

      {/* ③ 术语拆解：大白话 + 技术含义 */}
      {data.glossaryTerms.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-background-secondary p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3. 猜到你这些词可能不太熟悉，先帮你弥合认知断裂点^_^</span>
          </div>
          <div className="space-y-3">
            {data.glossaryTerms.map((g, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-card p-3">
                <code className="font-mono text-xs font-bold text-foreground bg-muted/40 px-1.5 py-0.5 rounded">{g.term}</code>
                <div className="mt-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-warning shrink-0 mt-0.5">通俗类比</span>
                    <span className="text-foreground/80">{g.plainHint}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-primary shrink-0 mt-0.5">技术视角</span>
                    <span className="text-foreground/60">{g.techNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ④ 总结升华 + 时间轴 */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">4. 总结一下：官方定义 + 行业问题</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed mb-4 whitespace-pre-line">{data.summary}</p>

        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5 border-t border-border/40 pt-3">
          <AlertCircle className="h-3 w-3" />
          技术演进时间轴（以 Transformer 为起点）
        </div>

        {/* 横向时间轴 */}
        <div className="relative overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex items-start gap-0 min-w-[480px] pr-4">
            {data.timeline.map((t, i) => {
              // 颜色渐进：从淡到浓
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
              const idx = Math.min(i, dotColors.length - 1)
              const isLast = i === data.timeline.length - 1

              return (
                <div key={i} className="flex-1 flex flex-col items-center relative animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  {/* 连接线（除最后一个节点右侧） */}
                  {i > 0 && (
                    <div className={`absolute top-3 left-0 right-1/2 h-px z-0 ${i === 1 ? "bg-gradient-to-r from-transparent via-muted-foreground/30 to-muted-foreground/40" : i === 2 ? "bg-gradient-to-r from-muted-foreground/40 via-primary/30 to-primary/40" : "bg-gradient-to-r from-primary/40 to-primary/60"}`} style={{ width: "calc(100%)" }} />
                  )}

                  {/* 节点圆点 */}
                  <div className={`relative z-10 h-6 w-6 rounded-full ${dotColors[idx]} ring-4 ring-offset-2 ring-offset-card flex items-center justify-center transition-transform duration-300 hover:scale-125`}>
                    <span className={`text-[9px] font-mono font-bold ${labelColors[idx]}`}>{t.era.slice(-2)}</span>
                  </div>

                  {/* 卡片 */}
                  <div className={`mt-3 w-full mx-1 rounded-lg border ${cardBorders[idx]} bg-background/80 p-2.5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                    <div className="text-xs font-semibold text-foreground mb-1">{t.tech}</div>
                    {t.problem && (
                      <div className="text-[10px] text-destructive/80 leading-tight mb-1 flex items-start gap-1">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span className="text-foreground/70">{t.problem}</span>
                      </div>
                    )}
                    {t.nextDriver && (
                      <div className="text-[10px] text-primary/80 leading-tight flex items-start gap-1">
                        <ArrowRight className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                        <span className="text-foreground/70">{t.nextDriver}</span>
                      </div>
                    )}
                  </div>

                  {/* 最后一个节点后的渐变收尾 */}
                  {isLast && (
                    <div className="absolute top-3 left-1/2 right-0 h-px bg-gradient-to-r from-primary/60 to-transparent" style={{ width: "50%" }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
