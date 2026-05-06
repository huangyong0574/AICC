import type { BusinessAnswer } from "../../types"
import { DollarSign, ListChecks } from "lucide-react"

export function BusinessView({ data }: { data: BusinessAnswer }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-muted/50 p-3">
        <div className="text-sm font-medium text-foreground">{data.oneLine}</div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-b border-border/60 flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" />
          MaaS 场景收益对比
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground border-b border-border/40">
              <th className="text-left py-2 px-3">场景</th>
              <th className="text-left py-2 px-3">API 计费</th>
              <th className="text-left py-2 px-3">用户体验</th>
              <th className="text-left py-2 px-3">业务适配</th>
            </tr>
          </thead>
          <tbody>
            {data.scenarios.map((s, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <td className="py-2 px-3 font-medium">{s.scenario}</td>
                <td className="py-2 px-3 text-foreground text-xs font-mono">{s.apiCostDelta}</td>
                <td className="py-2 px-3 text-foreground/90 text-xs">{s.uxDelta}</td>
                <td className="py-2 px-3 text-foreground/90 text-xs">{s.bizFit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-success/30 bg-success/5 p-3 flex items-start gap-2 text-sm">
        <ListChecks className="h-4 w-4 text-success shrink-0 mt-0.5" />
        <div className="text-foreground/90">
          <span className="text-xs text-muted-foreground mr-1.5">建议优先尝试：</span>
          {data.recommendation}
        </div>
      </div>
    </div>
  )
}
