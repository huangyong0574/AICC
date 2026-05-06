import type { Step1Answer } from "../../types"
import { AlertCircle, Lightbulb, MessageCircle, Sparkles } from "lucide-react"
import { LoopBlock } from "../LoopBlock"
import { StreamingSection } from "../StreamingSection"
import { renderDiagramSvg } from "../../lib/svgRenderer"
import { useMemo } from "react"

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

  // 当 diagram 有 templateType + nodes + edges 时，自动生成 SVG
  const diagramWithSvg = useMemo(() => {
    if (!d.diagram) return d.diagram
    if (d.diagram.svg) return d.diagram // 已经有 SVG（fixture/mock 数据）
    if (!d.diagram.templateType || !d.diagram.nodes?.length) return d.diagram

    // 调用渲染器生成 SVG
    return {
      ...d.diagram,
      svg: renderDiagramSvg(d.diagram),
    }
  }, [d.diagram])

  return (
    <div className="space-y-5">
      {/* ① 价值铺垫 */}
      <StreamingSection
        icon={<AlertCircle className="h-4 w-4 text-warning" />}
        title="1. 我们先打个比方"
        tone="warning"
        ready={!!d.valueLead}
        streaming={streaming}
        loadingText="正在从生活化案例入手，组织通俗类比…"
        skeletonLines={3}
      >
        {d.valueLead && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {d.valueLead}
          </p>
        )}
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
          <p className="text-sm text-foreground/90 leading-relaxed">{d.officialDefinition}</p>
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
                    <span className="text-foreground/80">{g.plainHint}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-primary shrink-0 mt-0.5">
                      技术视角
                    </span>
                    <span className="text-foreground/60">{g.techNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StreamingSection>

      {/* ④ 概念示意图（SVG 模板渲染） */}
      <StreamingSection
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        title="4. 概念示意图"
        tone="primary"
        ready={!!d.diagram}
        streaming={streaming}
        loadingText="正在绘制示意图…"
        skeletonLines={3}
      >
        {diagramWithSvg && diagramWithSvg.svg && (
          <>
            <div
              className="rounded-lg border border-border/40 bg-card/30 p-4 flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: diagramWithSvg.svg }}
            />
            {diagramWithSvg.caption && (
              <div className="mt-3 text-[12px] text-foreground/80 italic border-l-2 border-primary/40 pl-3">
                {diagramWithSvg.caption}
              </div>
            )}
          </>
        )}
      </StreamingSection>

      {/* ⑤ 闭环问题 */}
      <StreamingSection
        icon={<MessageCircle className="h-4 w-4 text-primary" />}
        title="5. 闭环问题"
        tone="primary"
        ready={!!d.loop}
        streaming={streaming}
        loadingText="正在布置闭环思考题…"
        skeletonLines={2}
        hideHeader={!!d.loop}
      >
        {d.loop && <LoopBlock loop={d.loop} stepLabel="步骤1" />}
      </StreamingSection>
    </div>
  )
}

