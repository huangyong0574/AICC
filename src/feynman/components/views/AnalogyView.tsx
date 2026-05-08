import type { AnalogyAnswer } from "../../types"
import { Badge } from "@/components/ui/badge"
import { Factory, Home, BookOpen, UtensilsCrossed, TrafficCone } from "lucide-react"

const DIAGRAMS = {
  scene:   { Icon: Home,             nodes: ["主角", "动作", "结果"] },
  factory: { Icon: Factory,          nodes: ["原料", "流水线", "成品"] },
  library: { Icon: BookOpen,         nodes: ["索书", "查阅", "借出"] },
  kitchen: { Icon: UtensilsCrossed,  nodes: ["食材", "加工", "菜品"] },
  traffic: { Icon: TrafficCone,      nodes: ["车流", "路口", "出口"] },
} as const

// 给 lucide 里不存在的图标做 fallback
const TrafficCone2 = TrafficCone

export function AnalogyView({ data }: { data: AnalogyAnswer }) {
  const hint = (data.diagramHint || "scene") as keyof typeof DIAGRAMS
  const d = DIAGRAMS[hint] || DIAGRAMS.scene
  const Icon = d.Icon

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-foreground" />
          <span className="font-semibold text-foreground">{data.title}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{data.story}</p>
      </div>

      {/* 示意图：三节点卡通方框 */}
      <div className="rounded-md border border-border bg-background-secondary p-5">
        <div className="text-[11px] text-muted-foreground mb-3 uppercase tracking-wider">示意图 · {hint}</div>
        <div className="flex items-center justify-around">
          {d.nodes.map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                className="relative h-20 w-20 rounded-md bg-background border border-border flex flex-col items-center justify-center gap-1 shadow-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <Icon className="h-5 w-5 text-foreground/70" />
                <div className="text-[11px] font-medium">{label}</div>
              </div>
              {i < d.nodes.length - 1 && <div className="text-xl text-muted-foreground/60 mx-3">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 映射表 */}
      <div className="flex flex-wrap gap-2">
        {data.mapping.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className="border-border text-foreground bg-background">{m.real}</Badge>
            <span className="text-muted-foreground">↔</span>
            <Badge variant="outline" className="border-foreground/40 text-background bg-foreground">{m.tech}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// 兜底保留 import 避免 treeshake
export const __keep = TrafficCone2
