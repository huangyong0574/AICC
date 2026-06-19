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

      {/* 机制图：优先结构化 blueprint（固定蓝色闭环模板）→ LLM SVG → 预制动画 */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 overflow-hidden">
        {data.blueprint ? (
          <BlueprintDiagram bp={data.blueprint} />
        ) : data.svg ? (
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

/** 机制 blueprint 固定模板：垂直主链（节点 + mono code，核心节点蓝高亮）+ 可选侧输入 + 可选循环回路。
 *  取代 LLM 自由生成 SVG，所有概念统一「蓝色闭环」风格（对齐设计稿）。 */
function BlueprintDiagram({ bp }: { bp: NonNullable<PrincipleAnswer["blueprint"]> }) {
  return (
    <div className="flex items-stretch gap-3 py-1">
      {bp.sideInput && (
        <div className="flex shrink-0 items-center">
          <div className="max-w-[120px] rounded-lg border border-border bg-background px-3 py-2 text-center">
            <div className="text-[12px] text-foreground/70">{bp.sideInput.label}</div>
            {bp.sideInput.sub && <div className="mt-0.5 text-[9.5px] text-muted-foreground">{bp.sideInput.sub}</div>}
          </div>
          <span className="mx-1.5 text-lg text-muted-foreground/40">→</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-center">
        {bp.nodes.map((n, i) => (
          <div key={i} className="flex w-full flex-col items-center">
            <div
              className={`w-full max-w-[280px] rounded-lg border px-4 py-2.5 text-center ${
                n.highlight ? "border-[#185fa5] bg-[#185fa5] text-white" : "border-border bg-card text-foreground"
              }`}
            >
              <div className="text-[13px] font-medium leading-tight">{n.label}</div>
              {n.code && (
                <div className={`mt-0.5 font-mono text-[10px] ${n.highlight ? "text-blue-100" : "text-muted-foreground"}`}>
                  {n.code}
                </div>
              )}
            </div>
            {i < bp.nodes.length - 1 && <span className="my-1 text-base leading-none text-muted-foreground/40">↓</span>}
          </div>
        ))}
      </div>
      {bp.loop && (
        <div className="flex shrink-0 items-center">
          <div className="mx-1 h-full border-l border-dashed border-border" />
          <span className="text-[10.5px] tracking-wide text-muted-foreground" style={{ writingMode: "vertical-rl" }}>
            ↻ {bp.loop.label}
          </span>
        </div>
      )}
    </div>
  )
}
