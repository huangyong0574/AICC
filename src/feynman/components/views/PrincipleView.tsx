import type { PrincipleAnswer } from "../../types"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { MechanismAnim } from "../MechanismAnim"
import { Formula } from "../Formula"
import { RichText } from "../RichText"
import { GenericFlowAnim } from "./animations/GenericFlowAnim"
import { AttentionOnTwoAnim } from "./animations/AttentionOnTwoAnim"
import { MambaSsmAnim } from "./animations/MambaSsmAnim"
import { MoeRouteAnim } from "./animations/MoeRouteAnim"

export function PrincipleView({ data }: { data: PrincipleAnswer }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
        <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground/90"><RichText text={data.coreIdea} /></div>
      </div>

      {/* 机制图：优先 LLM 动态 SVG，fallback 到预制动画 */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 overflow-hidden">
        {data.svg ? (
          <div
            className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[320px]"
            dangerouslySetInnerHTML={{ __html: data.svg }}
          />
        ) : (
          renderAnim(data.animationKey)
        )}
      </div>

      {/* 步骤列表 */}
      <ol className="space-y-2">
        {data.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-mono">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.label}</span>
                {s.symbol && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    <Formula tex={s.symbol} inline />
                  </Badge>
                )}
              </div>
              <div className="text-xs text-foreground/80 mt-0.5"><RichText text={s.desc} /></div>
            </div>
          </li>
        ))}
      </ol>

      <div className="text-[11px] text-muted-foreground italic border-l-2 border-primary/40 pl-3">
        关键点：<RichText text={data.note} />
      </div>
    </div>
  )
}

function renderAnim(key?: PrincipleAnswer["animationKey"]) {
  switch (key) {
    case "gdn-gate":      return <MechanismAnim />
    case "attention-on2": return <AttentionOnTwoAnim />
    case "mamba-ssm":     return <MambaSsmAnim />
    case "moe-route":     return <MoeRouteAnim />
    default:              return <GenericFlowAnim />
  }
}
