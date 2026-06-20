import { useId } from "react"
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

/** 机制 blueprint 固定模板（手绘风 SVG，对齐设计稿）：垂直主链（方框 + mono code，核心节点蓝高亮）
 *  + SVG 连线箭头 + 可选侧输入（横向汇入）+ 可选虚线循环回路。取代 LLM 自由生成 SVG，跨概念统一风格。 */
function BlueprintDiagram({ bp }: { bp: NonNullable<PrincipleAnswer["blueprint"]> }) {
  const rawId = useId()
  const arrowId = `bp-arrow-${rawId.replace(/:/g, "")}`
  const nodes = bp.nodes || []
  const n = nodes.length
  if (n === 0) return null

  const W = 600
  const boxW = 212
  const boxH = 50
  const gap = 26
  const top = 14
  const hasSide = !!bp.sideInput
  const cx = hasSide ? 324 : 300
  const boxX = cx - boxW / 2
  const nodeY = (i: number) => top + i * (boxH + gap)
  const chainBottom = nodeY(n - 1) + boxH
  const H = chainBottom + 14
  const cy0 = nodeY(0) + boxH / 2
  const cyN = nodeY(n - 1) + boxH / 2
  const channelX = boxX + boxW + 40
  const stroke = "hsl(var(--muted-foreground) / 0.4)"

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="机制流程图">
      <defs>
        <marker id={arrowId} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L7 4 L0 8 z" fill="hsl(var(--muted-foreground) / 0.55)" />
        </marker>
      </defs>

      {/* 主链竖直连接箭头 */}
      {nodes.slice(0, -1).map((_, i) => (
        <line
          key={`ln${i}`}
          x1={cx} y1={nodeY(i) + boxH} x2={cx} y2={nodeY(i + 1)}
          stroke={stroke} strokeWidth="1.4" markerEnd={`url(#${arrowId})`}
        />
      ))}

      {/* 侧输入：横向汇入主链顶节点 */}
      {bp.sideInput && (
        <g>
          <rect x="18" y={cy0 - 20} width="130" height="40" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x="83" y={cy0 - 2} textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">{bp.sideInput.label}</text>
          {bp.sideInput.sub && (
            <text x="83" y={cy0 + 12} textAnchor="middle" fontSize="9.5" fill="hsl(var(--muted-foreground))">{bp.sideInput.sub}</text>
          )}
          <line x1="148" y1={cy0} x2={boxX} y2={cy0} stroke={stroke} strokeWidth="1.4" markerEnd={`url(#${arrowId})`} />
        </g>
      )}

      {/* 循环回路：从末节点绕右侧虚线回到首节点 */}
      {bp.loop && (
        <g>
          <path
            d={`M${boxX + boxW} ${cyN} H${channelX} V${cy0} H${boxX + boxW}`}
            fill="none" stroke={stroke} strokeWidth="1.4" strokeDasharray="5 4" markerEnd={`url(#${arrowId})`}
          />
          <text
            x={channelX + 12} y={(cy0 + cyN) / 2}
            textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))"
            transform={`rotate(90 ${channelX + 12} ${(cy0 + cyN) / 2})`}
          >
            ↻ {bp.loop.label}
          </text>
        </g>
      )}

      {/* 节点方框 */}
      {nodes.map((node, i) => {
        const y = nodeY(i)
        const hi = !!node.highlight
        return (
          <g key={`nd${i}`}>
            <rect
              x={boxX} y={y} width={boxW} height={boxH} rx="9"
              fill={hi ? "#185fa5" : "hsl(var(--card))"}
              stroke={hi ? "#185fa5" : "hsl(var(--border))"}
            />
            <text
              x={cx} y={node.code ? y + 21 : y + 30}
              textAnchor="middle" fontSize="13" fontWeight="500"
              fill={hi ? "#ffffff" : "hsl(var(--foreground))"}
            >
              {node.label}
            </text>
            {node.code && (
              <text
                x={cx} y={y + 37}
                textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace"
                fill={hi ? "#bcd6f0" : "hsl(var(--muted-foreground))"}
              >
                {node.code}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
