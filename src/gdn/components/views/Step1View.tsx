import type { Step1Answer } from "../../types"
import { AlertCircle, Lightbulb, MessageCircle, Sparkles, Loader2 } from "lucide-react"
import { LoopBlock } from "../LoopBlock"
import { StreamingSection } from "../StreamingSection"
import { useEffect, useState } from "react"
import { loadCfg } from "../../lib/storage"
import { generateConceptImage } from "../../lib/imageGen"

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

  // 异步生成图片（LLM 返回 prompt 后触发）
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (!d.diagram?.prompt || imageUrl || imageGenerating) return

    const generate = async () => {
      setImageGenerating(true)
      setImageError(null)
      try {
        const cfg = loadCfg()
        const url = await generateConceptImage(d.diagram!.prompt, cfg)
        setImageUrl(url)
      } catch (e: any) {
        setImageError(e.message || "图片生成失败")
      } finally {
        setImageGenerating(false)
      }
    }

    generate()
  }, [d.diagram?.prompt])

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

      {/* ④ 概念示意图（通义万相生成精致插画） */}
      <StreamingSection
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        title="4. 概念示意图"
        tone="primary"
        ready={!!d.diagram}
        streaming={streaming}
        loadingText="正在构思画面…"
        skeletonLines={3}
      >
        {d.diagram && (
          <>
            {/* 图片加载区 */}
            <div className="rounded-lg border border-border/40 bg-card/30 overflow-hidden">
              {imageGenerating && (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">正在生成精致插图…</span>
                  <span className="text-[11px] text-muted-foreground/60">预计 5-10 秒</span>
                </div>
              )}

              {imageError && (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-center p-6">
                  <span className="text-xs text-destructive">{imageError}</span>
                  <button
                    onClick={() => {
                      setImageUrl(null)
                      setImageGenerating(false)
                      setImageError(null)
                    }}
                    className="text-xs text-primary underline hover:no-underline"
                  >
                    重试
                  </button>
                </div>
              )}

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Concept illustration"
                  className="w-full h-auto object-cover animate-fade-in"
                  onLoad={(e) => {
                    // 图片加载完成后淡入
                    e.currentTarget.style.opacity = "1"
                  }}
                  style={{ opacity: 0, transition: "opacity 0.5s ease-in" }}
                />
              )}

              {!imageGenerating && !imageError && !imageUrl && (
                <div className="h-64 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">等待画面生成…</span>
                </div>
              )}
            </div>

            {/* 图片下方点睛文案 */}
            {d.diagram.caption && (
              <div className="mt-3 text-[12px] text-foreground/80 italic border-l-2 border-primary/40 pl-3">
                {d.diagram.caption}
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

