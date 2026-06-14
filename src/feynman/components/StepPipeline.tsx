import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, Target, Layers, Gem,
  Loader2, CheckCircle2, ChevronDown, AlertCircle, Zap,
} from "lucide-react"
import { toast } from "sonner"
import type {
  StepEntry, StepKey, LlmConfig,
  Step1Answer, Step2Answer, Step3Answer, Step4Answer, GlossaryTerm,
} from "../types"
import { STEP_ORDER } from "../types"
import { callStep } from "../lib/llm"
import { getDefaultStepQuestion } from "../lib/prompts"
import { extractCompletedFields, STEP1_KEYS, STEP2_KEYS, STEP3_KEYS, STEP4_KEYS } from "../lib/partialJson"
import { Step1View } from "./views/Step1View"
import { Step2View } from "./views/Step2View"
import { Step3View } from "./views/Step3View"
import { Step4View } from "./views/Step4View"

const META: Record<StepKey, { num: number; title: string; subtitle: string; icon: any; tone: string; level: string; levelTitle: string; levelQ: string }> = {
  step1: { num: 1, title: "L1 类比理解", subtitle: "生活化类比 · 专业定义 · 术语拆解", icon: Sparkles, tone: "layer1", level: "L1", levelTitle: "类比理解", levelQ: "它是什么？" },
  step2: { num: 2, title: "L2 场景边界", subtitle: "适用场景 · 不适用场景 · 选型标准", icon: Target, tone: "layer2", level: "L2", levelTitle: "场景边界", levelQ: "哪里能用？" },
  step3: { num: 3, title: "L3 深入原理", subtitle: "分步原理 · 动画示意 · 数学演算", icon: Layers, tone: "layer3", level: "L3", levelTitle: "深入原理", levelQ: "怎么做到的？" },
  step4: { num: 4, title: "L4 本质总结", subtitle: "一句本质 · 锚点类比 · 对比 · 要点", icon: Gem, tone: "layer4", level: "L4", levelTitle: "本质总结", levelQ: "一句话说清" },
}

const TONE_WRAP: Record<string, string> = {
  layer1: "bg-layer1/15 text-layer1",
  layer2: "bg-layer2/15 text-layer2",
  layer3: "bg-layer3/15 text-layer3",
  layer4: "bg-layer4/15 text-layer4",
}

export function emptySteps(): StepEntry[] {
  return STEP_ORDER.map(k => ({
    key: k,
    question: getDefaultStepQuestion(k),
    answer: null,
    streaming: false,
    confirmed: false,
  }))
}

export function StepPipeline({
  rawQuestion,
  cfg,
  value,
  onChange,
  onAllDone,
  onTakeaway,
}: {
  rawQuestion: string
  cfg: LlmConfig
  value: StepEntry[]
  onChange: (next: StepEntry[]) => void
  onAllDone?: (list: StepEntry[]) => void
  onTakeaway?: (stepKey: string, takeaway: string) => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [streamBuf, setStreamBuf] = useState<string>("")
  const abortRef = useRef<AbortController | null>(null)
  const autoStartedRef = useRef(false)

  // 用 ref 追踪最新 value，避免闭包过期导致 confirmed 状态丢失
  const valueRef = useRef(value)
  valueRef.current = value

  // Takeaway 弹窗状态
  const [takeawayText, setTakeawayText] = useState("")
  const [showTakeaway, setShowTakeaway] = useState(false)
  const pendingNextRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!value || value.length === 0) {
      onChange(emptySteps())
      return
    }
    if (!rawQuestion.trim()) return
    if (autoStartedRef.current) return
    const first = value[0]
    if (!first.answer && !first.streaming) {
      autoStartedRef.current = true
      runOne(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawQuestion])

  function update(idx: number, patch: Partial<StepEntry>) {
    const next = valueRef.current.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    onChange(next)
    return next
  }

  async function runOne(idx: number) {
    if (!cfg.apiKey) {
      toast.error("请先设置 API Key")
      return
    }
    const cur = value[idx]
    if (!cur) return
    setActiveIdx(idx)
    setStreamBuf("")
    const prev = value.slice(0, idx)
    update(idx, { streaming: true, error: undefined, answer: null })
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    try {
      const parsed = await callStep(
        cur.key as StepKey,
        rawQuestion,
        prev,
        cfg,
        (acc: string) => setStreamBuf(acc),
        abortRef.current.signal,
      )
      const next = update(idx, { streaming: false, answer: parsed as any, confirmed: false })
      setStreamBuf("")
      if (idx === STEP_ORDER.length - 1 && onAllDone) onAllDone(next)
    } catch (e: any) {
      const isAbort =
        e?.name === "AbortError" ||
        /aborted|AbortError/i.test(e?.message || "")
      if (isAbort) {
        update(idx, { streaming: false })
        setStreamBuf("")
        return
      }
      update(idx, { streaming: false, error: e.message || "调用失败" })
      setStreamBuf("")
      toast.error(`步骤 ${idx + 1} 失败：${e.message || ""}`)
    }
  }

  /** 从已完成步骤数据中提取一句话认知收获 */
  function extractCognitiveGain(entry: StepEntry): string {
    const a = entry.answer as any
    if (!a) return ""
    switch (entry.key) {
      case "step1":
        if (a.takeaway) return a.takeaway
        const match = (a.valueLead || "").match(/\*\*(.+?)\*\*/)
        return match ? `核心类比：${match[1]}` : (a.valueLead || "").slice(0, 40)
      case "step2":
        if (a.takeaway) return a.takeaway
        return a.selectionCriteria ? `选型判据：${a.selectionCriteria.slice(0, 50)}` : ""
      case "step3":
        if (a.takeaway) return a.takeaway
        return a.principle?.coreIdea ? `核心机制：${a.principle.coreIdea.slice(0, 50)}` : ""
      case "step4":
        if (typeof a.takeaway === "string") return a.takeaway
        if (Array.isArray(a.takeaway)) return a.takeaway.join("；")
        return a.oneLiner || ""
      default:
        return ""
    }
  }

  /** 进入下一步的实际逻辑（从弹窗回调或直接调用） */
  function proceedToNext(idx: number, next: StepEntry[]) {
    if (idx < STEP_ORDER.length - 1) {
      const nextEntry = next[idx + 1]
      if (!nextEntry.answer && !nextEntry.streaming) {
        runOne(idx + 1)
      } else {
        setActiveIdx(idx + 1)
      }
    } else {
      if (onAllDone) onAllDone(next)
      toast.success("四大步骤讲解完成，去底部做费曼内化吧")
    }
  }

  function confirmAndNext(idx: number) {
    const next = update(idx, { confirmed: true })
    const gain = extractCognitiveGain(next[idx])

    if (gain) {
      setTakeawayText(gain)
      setShowTakeaway(true)
      pendingNextRef.current = () => proceedToNext(idx, next)
      // 通知外层：传递 stepKey + takeaway
      if (onTakeaway) onTakeaway(STEP_ORDER[idx], gain)
      return
    }

    // fallback：无 takeaway 时直接进入下一步
    proceedToNext(idx, next)
  }

  function handleTakeawayDismiss() {
    setShowTakeaway(false)
    if (pendingNextRef.current) {
      pendingNextRef.current()
      pendingNextRef.current = null
    }
  }

  // D1: 从 step1 answer 提取 glossaryTerms 供后续步骤使用
  const glossaryTerms: GlossaryTerm[] = (value[0]?.answer as Step1Answer)?.glossaryTerms || []

  return (
    <div className="space-y-5">
      {value.map((q, i) => (
        <StepCard
          key={q.key}
          idx={i}
          entry={q}
          active={i === activeIdx}
          streamBuf={i === activeIdx && q.streaming ? streamBuf : ""}
          glossaryTerms={i > 0 ? glossaryTerms : []}
          onRerun={() => runOne(i)}
          onConfirm={() => confirmAndNext(i)}
        />
      ))}

      {/* Takeaway 居中弹窗 */}
      {showTakeaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 max-w-md w-full rounded-2xl bg-background shadow-2xl overflow-hidden animate-scale-in">
            {/* 顶部渐变光条 */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
            <div className="p-6 space-y-5">
              {/* 图标 */}
              <div className="flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-100 ring-1 ring-amber-200/60">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              {/* 标题 + 正文 */}
              <div className="space-y-3">
                <div className="text-center text-base font-bold text-foreground">一句话带走</div>
                <div className="text-[15px] text-foreground/85 leading-relaxed font-medium text-center">
                  {takeawayText}
                </div>
              </div>
              {/* 按钮 */}
              <Button
                variant="glow"
                className="w-full"
                onClick={handleTakeawayDismiss}
              >
                好的，那我带走！
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepCard({
  idx, entry, active, streamBuf, glossaryTerms, onRerun, onConfirm,
}: {
  idx: number
  entry: StepEntry
  active: boolean
  streamBuf: string
  glossaryTerms: GlossaryTerm[]
  onRerun: () => void
  onConfirm: () => void
}) {
  void idx
  const meta = META[entry.key]
  const Icon = meta.icon
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (entry.confirmed) setExpanded(false)
  }, [entry.confirmed])

  return (
    <Card className={`animate-fade-in-up ${active && entry.streaming ? "ring-2 ring-primary/40" : ""}`}>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE_WRAP[meta.tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${TONE_WRAP[meta.tone]}`}>
                {meta.level}
              </span>
              <span className="font-semibold">{meta.levelTitle}</span>
              <span className="text-sm text-muted-foreground font-normal">{meta.levelQ}</span>
              {entry.streaming && <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />生成中</Badge>}
              {entry.answer && !entry.streaming && !entry.confirmed && <Badge variant="outline" className="border-warning/40 text-warning bg-warning/5 text-[10px]">待确认</Badge>}
              {entry.confirmed && <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />已确认</Badge>}
            </div>
            {meta.subtitle && <div className="text-xs font-normal text-muted-foreground mt-0.5">{meta.subtitle}</div>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(v => !v)} className="h-7 w-7">
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-5 space-y-4">
          {/* 四大步骤流式阶段均走分段骨架渐进式渲染，不再显示原 JSON 小黑框 */}
          {entry.streaming && entry.key === "step1" && (
            <Step1View
              data={extractCompletedFields<Step1Answer>(streamBuf, STEP1_KEYS) as Partial<Step1Answer>}
              streaming
            />
          )}
          {entry.streaming && entry.key === "step2" && (
            <Step2View
              data={extractCompletedFields<Step2Answer>(streamBuf, STEP2_KEYS) as Partial<Step2Answer>}
              streaming
            />
          )}
          {entry.streaming && entry.key === "step3" && (
            <Step3View
              data={extractCompletedFields<Step3Answer>(streamBuf, STEP3_KEYS) as Partial<Step3Answer>}
              streaming
            />
          )}
          {entry.streaming && entry.key === "step4" && (
            <Step4View
              data={extractCompletedFields<Step4Answer>(streamBuf, STEP4_KEYS) as Partial<Step4Answer>}
              streaming
            />
          )}

          {entry.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{entry.error}</div>
              <Button variant="outline" size="sm" onClick={onRerun}>重试</Button>
            </div>
          )}

          {entry.answer && !entry.streaming && (
            <>
              {renderView(entry, glossaryTerms)}
              {!entry.confirmed && (
                <div className="flex justify-end pt-3 border-t border-border/50">
                  <Button variant="glow" size="sm" onClick={onConfirm}>
                    <Zap className="mr-1.5 h-4 w-4" />
                    我收走了
                  </Button>
                </div>
              )}
            </>
          )}

          {!entry.answer && !entry.streaming && !entry.error && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              等待上一步确认后自动生成…
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function renderView(entry: StepEntry, glossaryTerms: GlossaryTerm[]) {
  switch (entry.key) {
    case "step1": return <Step1View data={entry.answer as Step1Answer} streaming={false} />
    case "step2": return <Step2View data={entry.answer as Step2Answer} streaming={false} glossaryTerms={glossaryTerms} />
    case "step3": return <Step3View data={entry.answer as Step3Answer} streaming={false} glossaryTerms={glossaryTerms} />
    case "step4": return <Step4View data={entry.answer as Step4Answer} streaming={false} glossaryTerms={glossaryTerms} />
    default: return null
  }
}
