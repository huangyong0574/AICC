import type { Step3Answer, GlossaryTerm } from "../../types"
import { Layers, Sigma } from "lucide-react"
import { PrincipleView } from "./PrincipleView"
import { MathView } from "./MathView"
import { StreamingSection } from "../StreamingSection"

/**
 * Step3View — L3 深入原理
 * 支持渐进式渲染：streaming=true 时 data 可能是 Partial<Step3Answer>
 */
export function Step3View({
  data,
  streaming = false,
  glossaryTerms: _glossaryTerms = [],
}: {
  data: Partial<Step3Answer> | null
  streaming?: boolean
  glossaryTerms?: GlossaryTerm[]
}) {
  const d = data ?? {}

  return (
    <div className="space-y-5">
      {/* 1 分步静态帧 + 动画示意 */}
      <StreamingSection
        icon={<Layers className="h-4 w-4 text-primary" />}
        title="1. 分步静态帧 - 当前技术实现原理"
        tone="muted"
        ready={!!d.principle}
        streaming={streaming}
        loadingText="正在拆解分步原理..."
        skeletonLines={4}
      >
        {d.principle && <PrincipleView data={d.principle} />}
      </StreamingSection>

      {/* 2 数学 + token 演算 */}
      <StreamingSection
        icon={<Sigma className="h-4 w-4 text-primary" />}
        title="2. 数学本质 - 真实 token 代入演算"
        tone="muted"
        ready={!!d.math}
        streaming={streaming}
        loadingText="正在代入 token 做数学演算..."
        skeletonLines={3}
      >
        {d.math && <MathView data={d.math} />}
      </StreamingSection>
    </div>
  )
}
