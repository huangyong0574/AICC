import type { EngineeringAnswer } from "../../types"
import { TrendingUp, TrendingDown, Minus, Gauge, Info } from "lucide-react"

export function EngineeringView({ data }: { data: EngineeringAnswer }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-success/30 bg-success/5 p-3 flex items-start gap-2">
        <Gauge className="h-4 w-4 text-success shrink-0 mt-0.5" />
        <div className="text-sm text-foreground/90">{data.summary}</div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/60 bg-muted/20">
              <th className="text-left py-2 px-3">指标</th>
              <th className="text-left py-2 px-3">基线 (Transformer)</th>
              <th className="text-left py-2 px-3">当前方案</th>
              <th className="text-left py-2 px-3">变化</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m, i) => {
              const favorClass = m.favor === "up" ? "text-success" : m.favor === "down" ? "text-destructive" : "text-muted-foreground"
              const FavorIcon = m.favor === "up" ? TrendingUp : m.favor === "down" ? TrendingDown : Minus
              return (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <td className="py-2 px-3 font-medium">{m.name}</td>
                  <td className="py-2 px-3 text-muted-foreground font-mono text-xs">{m.baseline}</td>
                  <td className="py-2 px-3 text-foreground font-mono text-xs">{m.current}</td>
                  <td className={`py-2 px-3 ${favorClass} flex items-center gap-1.5 font-mono text-xs`}>
                    <FavorIcon className="h-3.5 w-3.5" />
                    {m.delta}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-warning/30 bg-warning/5 p-3 flex items-start gap-2 text-xs">
        <Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
        <div className="text-foreground/80">落地提示：{data.deployNote}</div>
      </div>
    </div>
  )
}
