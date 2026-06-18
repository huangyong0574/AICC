import type { StepEntry } from "../types"
import { Button } from "@/components/ui/button"

/**
 * 费曼四步进度（对齐 aicc_deep_learning.html 新 UI）：顶部 stepper 步骤条 + 进度环 header（标题 + 重新开始）+ seg 分段条。
 * 进入四步后替代旧的 CognitiveNavBar(6 节点) + Input Card 进度行，统一进度可视化。
 */
const STEP_LABELS = ["类比理解", "场景边界", "深入原理", "本质总结"]
const RING_C = 97.4 // 2πr, r=15.5

export function FeynmanProgress({
  steps, topic, onReset, sourceWeek,
}: {
  steps: StepEntry[]
  topic?: string
  onReset?: () => void
  sourceWeek?: string
}) {
  const total = STEP_LABELS.length
  const done = steps.filter(s => s.confirmed).length
  const curIdx = steps.findIndex(s => !s.confirmed)
  const cur = curIdx === -1 ? total : curIdx
  const offset = (RING_C - (RING_C * done) / total).toFixed(1)

  return (
    <div className="space-y-3">
      {/* stepper 步骤条 */}
      <div className="flex items-center overflow-x-auto pb-1">
        {STEP_LABELS.map((lbl, i) => {
          const isDone = !!steps[i]?.confirmed
          const isCurrent = i === cur && !isDone
          const on = isDone || isCurrent
          return (
            <div key={i} className="flex shrink-0 items-center">
              <span
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-semibold ${
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className={`ml-2 whitespace-nowrap text-[12px] ${on ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {lbl}
              </span>
              {i < total - 1 && <span className={`mx-2 h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`} />}
            </div>
          )
        })}
      </div>

      {/* 进度环 header card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.2" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3.2" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset .4s ease" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[12px] font-semibold">{done}/{total}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{topic || "本次认知点"}</div>
            <div className="text-[12px] text-muted-foreground">
              四步穿透学习 · 已完成 {done}/{total}
              {done === total ? " · 待内化" : ""}
              {sourceWeek ? ` · 来源 ${sourceWeek} 雷达` : ""}
            </div>
          </div>
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              重新开始
            </Button>
          )}
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                steps[i]?.confirmed ? "bg-primary" : i === cur ? "bg-muted-foreground/40" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
