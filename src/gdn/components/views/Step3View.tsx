import type { Step3Answer } from "../../types"
import { TrendingUp, TrendingDown, Minus, Gauge, DollarSign } from "lucide-react"
import { StreamingSection } from "../StreamingSection"

/**
 * Step3View 支持渐进式渲染：
 * - streaming=true 时 data 可能是 Partial<Step3Answer>
 * - 对比表因为有自定义表头样式，已就绪时使用 hideHeader 模式接管布局
 */
export function Step3View({
  data,
  streaming = false,
}: {
  data: Partial<Step3Answer> | null
  streaming?: boolean
}) {
  const d = data ?? {}

  return (
    <div className="space-y-5">
      {/* ① 工程收益总结 */}
      <StreamingSection
        icon={<Gauge className="h-4 w-4 text-success" />}
        title="1. 工程收益总结（面向 AI 应用开发 / 运维）"
        tone="success"
        ready={!!d.engSummary}
        streaming={streaming}
        loadingText="正在提炼工程收益亮点…"
        skeletonLines={3}
      >
        {d.engSummary && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {d.engSummary}
          </p>
        )}
      </StreamingSection>

      {/* ② 工程收益对比表（自带表头，走 hideHeader） */}
      <StreamingSection
        icon={<Gauge className="h-4 w-4 text-primary" />}
        title="2. 工程收益对比表（基于演进前）"
        tone="muted"
        ready={!!d.engMetrics && d.engMetrics.length > 0}
        streaming={streaming}
        loadingText="正在组织工程指标对比…"
        skeletonLines={4}
        hideHeader={!!d.engMetrics && d.engMetrics.length > 0}
      >
        {d.engMetrics && d.engMetrics.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-b border-border/60">
              2. 工程收益对比表（基于演进前）
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/60 bg-muted/10">
                  <th className="text-left py-2 px-3">指标</th>
                  <th className="text-left py-2 px-3">基线 (Transformer)</th>
                  <th className="text-left py-2 px-3">当前方案</th>
                  <th className="text-left py-2 px-3">变化</th>
                </tr>
              </thead>
              <tbody>
                {d.engMetrics.map((m, i) => {
                  const favorClass =
                    m.favor === "up"
                      ? "text-success"
                      : m.favor === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  const FavorIcon =
                    m.favor === "up" ? TrendingUp : m.favor === "down" ? TrendingDown : Minus
                  return (
                    <tr
                      key={i}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
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
        )}
      </StreamingSection>

      {/* ③ 业务价值总结 */}
      <StreamingSection
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        title="3. 业务价值总结（面向 MaaS API 客户，可隐射高管）"
        tone="primary"
        ready={!!d.bizSummary}
        streaming={streaming}
        loadingText="正在撰写业务价值故事…"
        skeletonLines={3}
      >
        {d.bizSummary && (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {d.bizSummary}
          </p>
        )}
      </StreamingSection>

      {/* ④ 业务价值对比表 */}
      <StreamingSection
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        title="4. MaaS 场景业务价值对比（基于演进前）"
        tone="muted"
        ready={!!d.bizScenarios && d.bizScenarios.length > 0}
        streaming={streaming}
        loadingText="正在枚举 MaaS 场景对比…"
        skeletonLines={4}
        hideHeader={!!d.bizScenarios && d.bizScenarios.length > 0}
      >
        {d.bizScenarios && d.bizScenarios.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-b border-border/60 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              4. MaaS 场景业务价值对比（基于演进前）
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
                {d.bizScenarios.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <td className="py-2 px-3 font-medium">{s.scenario}</td>
                    <td className="py-2 px-3 text-foreground text-xs font-mono">{s.apiCostDelta}</td>
                    <td className="py-2 px-3 text-foreground/90 text-xs">{s.uxDelta}</td>
                    <td className="py-2 px-3 text-foreground/90 text-xs">{s.bizFit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StreamingSection>

      {/* ⑤ 闭环提示（静态，始终显示） */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          5. 闭环练习 · 回到开头的费曼 3 问
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed">
          步骤3 的闭环就是回答开头预热出现的 <b>3 个费曼问题</b>（业务总监 / CTO / 开发者视角）。
          请先确认本步骤，然后在页面底部的 <b>费曼内化</b> 面板提交答案，LLM 会评价并把认知挂到知识图谱。
        </div>
      </div>
    </div>
  )
}
