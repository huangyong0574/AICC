import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen, Layers, Lightbulb, Gauge, Sigma, DollarSign,
  Loader2, CheckCircle2, ChevronDown, Play, ArrowRight, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import type {
  QaEntry, QaKey, LlmConfig,
  BackgroundAnswer, PrincipleAnswer, AnalogyAnswer, EngineeringAnswer, MathAnswer, BusinessAnswer,
} from "../types"
import { QA_ORDER } from "../types"
import { callQaStream } from "../lib/llm"
import { getDefaultQuestion } from "../lib/prompts"
import { TimelineView } from "./views/TimelineView"
import { PrincipleView } from "./views/PrincipleView"
import { AnalogyView } from "./views/AnalogyView"
import { EngineeringView } from "./views/EngineeringView"
import { MathView } from "./views/MathView"
import { BusinessView } from "./views/BusinessView"

const META: Record<QaKey, { num: number; title: string; subtitle: string; icon: any; tone: string }> = {
  background:  { num: 1, title: "初步理解，看完这部分，你吹两句是没问题的！",     subtitle: "时间轴 · 以 Transformer 为起点", icon: BookOpen, tone: "layer1" },
  principle:   { num: 2, title: "原理与可视化",   subtitle: "动画演示 + 步骤备注",             icon: Layers,   tone: "layer2" },
  analogy:     { num: 3, title: "通俗类比",       subtitle: "非技术人一听就懂",                 icon: Lightbulb,tone: "layer3" },
  engineering: { num: 4, title: "工程价值",       subtitle: "指标对比 · 落地成本",             icon: Gauge,    tone: "layer4" },
  math:        { num: 5, title: "数学与流程",     subtitle: "公式 · 训练/推理变量生命周期",   icon: Sigma,    tone: "layer1" },
  business:    { num: 6, title: "商业价值（MaaS）",subtitle: "API 计费 · 用户体验 · 适配度",  icon: DollarSign,tone: "layer2" },
}

const TONE_WRAP: Record<string, string> = {
  layer1: "bg-layer1/15 text-layer1",
  layer2: "bg-layer2/15 text-layer2",
  layer3: "bg-layer3/15 text-layer3",
  layer4: "bg-layer4/15 text-layer4",
}

function emptyQa(): QaEntry[] {
  return QA_ORDER.map(k => ({ key: k, question: getDefaultQuestion(k), answer: null, streaming: false, confirmed: false }))
}

export function QaPipeline({
  rawQuestion,
  cfg,
  value,
  onChange,
  onAllDone,
}: {
  rawQuestion: string
  cfg: LlmConfig
  value: QaEntry[]
  onChange: (next: QaEntry[]) => void
  onAllDone?: (list: QaEntry[]) => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [streamBuf, setStreamBuf] = useState<string>("")
  const abortRef = useRef<AbortController | null>(null)
  // StrictMode 下 useEffect 会双跑，这里用 ref 保证第 0 问只自动启动一次
  const autoStartedRef = useRef(false)

  useEffect(() => {
    // 首次开跑：如果 qa 全空，自动 run 第 0 题
    if (!value || value.length === 0) {
      onChange(emptyQa())
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

  function update(idx: number, patch: Partial<QaEntry>) {
    const next = value.map((q, i) => (i === idx ? { ...q, ...patch } : q))
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
    const prev = value.slice(0, idx) // 只把已完成问题作为历史
    update(idx, { streaming: true, error: undefined, answer: null })
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    try {
      const parsed = await callQaStream(
        cur.key as any,
        rawQuestion,
        prev,
        cfg,
        (acc: string) => setStreamBuf(acc),
        abortRef.current.signal,
      )
      const next = update(idx, { streaming: false, answer: parsed as any, confirmed: false })
      setStreamBuf("")
      // 如果是最后一题，允许外层感知
      if (idx === QA_ORDER.length - 1 && onAllDone) onAllDone(next)
    } catch (e: any) {
      // 用户/竞态主动中断（StrictMode 双跑、点击重试覆盖前一次请求等）不视为业务错误
      const isAbort =
        e?.name === "AbortError" ||
        /aborted|AbortError/i.test(e?.message || "")
      if (isAbort) {
        // 只清 streaming 状态，不写 error、不弹 toast
        update(idx, { streaming: false })
        setStreamBuf("")
        return
      }
      update(idx, { streaming: false, error: e.message || "调用失败" })
      setStreamBuf("")
      toast.error(`第 ${idx + 1} 问失败：${e.message || ""}`)
    }
  }

  function confirmAndNext(idx: number) {
    const next = update(idx, { confirmed: true })
    if (idx < QA_ORDER.length - 1) {
      const nextEntry = next[idx + 1]
      if (!nextEntry.answer && !nextEntry.streaming) {
        runOne(idx + 1)
      } else {
        setActiveIdx(idx + 1)
      }
    } else {
      if (onAllDone) onAllDone(next)
      toast.success("六问讲解完成，去底部做费曼内化吧")
    }
  }

  return (
    <div className="space-y-5">
      {value.map((q, i) => (
        <QaCard
          key={q.key}
          idx={i}
          entry={q}
          active={i === activeIdx}
          streamBuf={i === activeIdx && q.streaming ? streamBuf : ""}
          onRerun={() => runOne(i)}
          onConfirm={() => confirmAndNext(i)}
        />
      ))}
    </div>
  )
}

function QaCard({
  idx, entry, active, streamBuf, onRerun, onConfirm,
}: {
  idx: number
  entry: QaEntry
  active: boolean
  streamBuf: string
  onRerun: () => void
  onConfirm: () => void
}) {
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
              <span className="text-xs font-mono text-muted-foreground">步骤{meta.num}</span>
              <span className="font-semibold">{meta.title}</span>
              {entry.streaming && <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />生成中</Badge>}
              {entry.answer && !entry.streaming && !entry.confirmed && <Badge variant="outline" className="border-warning/40 text-warning bg-warning/5 text-[10px]">待确认</Badge>}
              {entry.confirmed && <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />已确认</Badge>}
            </div>
            <div className="text-xs font-normal text-muted-foreground mt-0.5">{meta.subtitle}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(v => !v)} className="h-7 w-7">
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-5 space-y-4">

          {/* 流式进度文本 */}
          {entry.streaming && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 max-h-[120px] overflow-auto font-mono text-[11px] text-primary/80 whitespace-pre-wrap">
              {streamBuf || "等待 LLM 响应…"}
            </div>
          )}

          {/* 错误 */}
          {entry.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{entry.error}</div>
              <Button variant="outline" size="sm" onClick={onRerun}>重试</Button>
            </div>
          )}

          {/* 正式渲染 */}
          {entry.answer && !entry.streaming && (
            <>
              {renderView(entry)}
              {!entry.confirmed && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-[11px] text-muted-foreground">读懂这段了吗？确认后才会进入下一问</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onRerun}>重新生成</Button>
                    <Button variant="glow" size="sm" onClick={onConfirm}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      确认，继续第 {idx + 2 > 6 ? "—" : idx + 2} 问
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 空态（没有 answer，也没在 streaming，也没错误）：手动启动 */}
          {!entry.answer && !entry.streaming && !entry.error && (
            <div className="flex items-center justify-center py-6">
              <Button variant="outline" size="sm" onClick={onRerun} disabled={idx > 0 /* 未达此题时禁用 */ && !(entry as any).__allow}>
                <Play className="mr-1.5 h-4 w-4" />
                生成第 {idx + 1} 问
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function renderView(entry: QaEntry) {
  switch (entry.key) {
    case "background":  return <TimelineView   data={entry.answer as BackgroundAnswer} />
    case "principle":   return <PrincipleView  data={entry.answer as PrincipleAnswer} />
    case "analogy":     return <AnalogyView    data={entry.answer as AnalogyAnswer} />
    case "engineering": return <EngineeringView data={entry.answer as EngineeringAnswer} />
    case "math":        return <MathView       data={entry.answer as MathAnswer} />
    case "business":    return <BusinessView   data={entry.answer as BusinessAnswer} />
    default: return null
  }
}

export { emptyQa }
