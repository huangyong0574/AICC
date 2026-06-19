import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles, Target, Layers, Gem,
  Loader2, CheckCircle2, ChevronDown, AlertCircle, Zap, X,
} from "lucide-react"
import { toast } from "sonner"
import type {
  StepEntry, StepKey, StepGap, LlmConfig,
  Step1Answer, Step2Answer, Step3Answer, Step4Answer, GlossaryTerm,
} from "../types"
import { STEP_ORDER } from "../types"
import { callStep, callGap } from "../lib/llm"
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
  grounding,
  cfg,
  value,
  onChange,
  onAllDone,
  onTakeaway,
}: {
  rawQuestion: string
  /** 认知雷达对该概念的权威原文/提炼，用作讲解与认知差评测的事实依据 */
  grounding?: string
  cfg: LlmConfig
  value: StepEntry[]
  onChange: (next: StepEntry[]) => void
  onAllDone?: (list: StepEntry[]) => void
  onTakeaway?: (stepKey: string, takeaway: string) => void
}) {
  // 恢复学习时 value 已含已确认步：初始定位到第一个未确认步，避免停在已确认的 step1 导致无法进入下一步
  const [activeIdx, setActiveIdx] = useState(() => {
    const i = value.findIndex(s => !s.confirmed)
    return i < 0 ? Math.max(0, value.length - 1) : i
  })
  const [streamBuf, setStreamBuf] = useState<string>("")
  const abortRef = useRef<AbortController | null>(null)
  const autoStartedRef = useRef(false)

  // 用 ref 追踪最新 value，避免闭包过期导致 confirmed 状态丢失
  const valueRef = useRef(value)
  valueRef.current = value

  // Takeaway 弹窗状态：takeawayText = 用户手写；aiHint = AI 提炼参考（可一键填入）
  const [takeawayText, setTakeawayText] = useState("")
  const [aiHint, setAiHint] = useState("")
  const [showTakeaway, setShowTakeaway] = useState(false)
  const pendingNextRef = useRef<(() => void) | null>(null)
  const pendingStepRef = useRef<StepKey | null>(null)

  useEffect(() => {
    if (!value || value.length === 0) {
      onChange(emptySteps())
      return
    }
    // 先猜后揭：不再自动生成首步；step0 进入「预测」阶段，等用户写下猜想后才揭晓
    void autoStartedRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawQuestion])

  function update(idx: number, patch: Partial<StepEntry>) {
    const next = valueRef.current.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    onChange(next)
    return next
  }

  /** 先猜后揭：提交猜想后才生成该步（空猜想=「不确定，直接看」，跳过认知差） */
  function submitPrediction(idx: number, prediction: string) {
    runOne(idx, prediction)
  }

  async function runOne(idx: number, prediction?: string) {
    if (!cfg.apiKey) {
      toast.error("请先设置 API Key")
      return
    }
    const cur = valueRef.current[idx]
    if (!cur) return
    setActiveIdx(idx)
    setStreamBuf("")
    const prev = valueRef.current.slice(0, idx)
    // 同一 tick 写入 prediction + streaming，避免分两次 update 被 valueRef 过期值覆盖
    update(idx, { streaming: true, error: undefined, answer: null, gap: undefined, ...(prediction !== undefined ? { prediction } : {}) })
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
        grounding,
      )
      const next = update(idx, { streaming: false, answer: parsed as any, confirmed: false })
      setStreamBuf("")
      if (idx === STEP_ORDER.length - 1 && onAllDone) onAllDone(next)
      // 认知差：若用户写过猜想，对比猜想与揭晓答案，标出命中/遗漏/偏差
      const pred = (prediction ?? valueRef.current[idx]?.prediction ?? "").trim()
      if (pred) {
        callGap(cur.key as StepKey, rawQuestion, pred, parsed, cfg, grounding)
          .then(gap => update(idx, { gap }))
          .catch(() => {})
      }
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

  /** 进入下一步：先猜后揭——只切换到下一步的「预测」阶段，等用户写猜想后才揭晓 */
  function proceedToNext(idx: number, next: StepEntry[]) {
    if (idx < STEP_ORDER.length - 1) {
      setActiveIdx(idx + 1)
    } else {
      if (onAllDone) onAllDone(next)
      toast.success("四大步骤讲解完成，去底部做费曼内化吧")
    }
  }

  function confirmAndNext(idx: number) {
    const next = update(idx, { confirmed: true })
    // AI 提炼仅作参考草稿；让用户用自己的话写"带走"（输出倒逼输入）
    setAiHint(extractCognitiveGain(next[idx]) || "")
    setTakeawayText("")
    setShowTakeaway(true)
    pendingStepRef.current = STEP_ORDER[idx]
    pendingNextRef.current = () => proceedToNext(idx, next)
  }

  function handleTakeawayDismiss() {
    // 带走的是用户手写的 takeaway（而非 AI 自动提取）
    if (onTakeaway && pendingStepRef.current) onTakeaway(pendingStepRef.current, takeawayText.trim())
    pendingStepRef.current = null
    setShowTakeaway(false)
    if (pendingNextRef.current) {
      pendingNextRef.current()
      pendingNextRef.current = null
    }
  }

  // 关闭弹窗 = 取消本次「带走」：回退该步确认（不进下一步、不存 takeaway），用户可稍后重新点确认
  function handleTakeawayClose() {
    if (pendingStepRef.current) {
      const idx = STEP_ORDER.indexOf(pendingStepRef.current)
      if (idx >= 0) update(idx, { confirmed: false })
    }
    pendingStepRef.current = null
    pendingNextRef.current = null
    setTakeawayText("")
    setShowTakeaway(false)
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
          onSubmitPrediction={(text) => submitPrediction(i, text)}
        />
      ))}

      {/* Takeaway 居中弹窗 */}
      {showTakeaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative mx-4 max-w-md w-full rounded-2xl bg-background shadow-2xl overflow-hidden animate-scale-in">
            {/* 顶部渐变光条 */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
            {/* 关闭按钮：取消本次「带走」，不进下一步 */}
            <button
              type="button"
              onClick={handleTakeawayClose}
              aria-label="关闭"
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-6 space-y-5">
              {/* 图标 */}
              <div className="flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-100 ring-1 ring-amber-200/60">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              {/* 标题：让用户自己写（输出倒逼输入） */}
              <div className="space-y-1.5">
                <div className="text-center text-base font-bold text-foreground">用你自己的话，写一句「带走」</div>
                <div className="text-center text-xs text-muted-foreground">费曼精髓 · 先自己提炼，再对照 AI</div>
              </div>
              <Textarea
                value={takeawayText}
                onChange={e => setTakeawayText(e.target.value)}
                placeholder="这一步我最大的收获是…（用自己的话）"
                className="min-h-[84px]"
                autoFocus
              />
              {aiHint && (
                <button
                  type="button"
                  onClick={() => setTakeawayText(aiHint)}
                  className="w-full text-left text-[12px] text-muted-foreground rounded-lg border border-border/60 bg-muted/40 px-3 py-2 hover:border-amber-300/60 hover:text-foreground transition-colors"
                >
                  <span className="text-amber-600 font-medium">AI 参考</span>：{aiHint}　<span className="underline underline-offset-2">点击填入</span>
                </button>
              )}
              {/* 必须写一句才能带走 —— 内化每一步 */}
              <Button
                variant="glow"
                className="w-full"
                onClick={handleTakeawayDismiss}
                disabled={!takeawayText.trim()}
              >
                带走，下一步
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepCard({
  idx, entry, active, streamBuf, glossaryTerms, onRerun, onConfirm, onSubmitPrediction,
}: {
  idx: number
  entry: StepEntry
  active: boolean
  streamBuf: string
  glossaryTerms: GlossaryTerm[]
  onRerun: () => void
  onConfirm: () => void
  onSubmitPrediction: (text: string) => void
}) {
  void idx
  const meta = META[entry.key]
  const Icon = meta.icon
  const [expanded, setExpanded] = useState(true)
  const [predictDraft, setPredictDraft] = useState("")
  // 先猜后揭：本步处于「预测」阶段——当前激活、未生成、未揭晓、尚未提交猜想
  const inPredict = active && !entry.answer && !entry.streaming && !entry.error && entry.prediction === undefined

  useEffect(() => {
    // 确认即折叠；被取消（如关闭「带走」弹窗回退确认）则重新展开，便于重新查看/确认
    setExpanded(!entry.confirmed)
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
              {entry.streaming && <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />{(entry.key === "step1" || entry.key === "step2") ? "联网检索中…" : "生成中"}</Badge>}
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
              {entry.prediction !== undefined && entry.prediction.trim() !== "" && (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[12.5px]">
                  <span className="text-muted-foreground">你的猜想：</span>
                  <span className="text-foreground/80">{entry.prediction}</span>
                </div>
              )}
              {entry.gap && <GapPanel gap={entry.gap} />}
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

          {/* 先猜后揭：预测阶段——先写猜想，提交后才揭晓 AI 解答 */}
          {inPredict && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">先写下你的猜想 —— {meta.levelQ}</div>
              <div className="text-xs text-muted-foreground">费曼·先猜后揭：先输出你的理解，再对照 AI 看「命中 / 遗漏 / 偏差」。</div>
              <Textarea
                value={predictDraft}
                onChange={e => setPredictDraft(e.target.value)}
                placeholder={`我猜，关于这一步……（用自己的话）`}
                className="min-h-[84px]"
              />
              <div className="flex items-center gap-2">
                <Button variant="glow" size="sm" disabled={!predictDraft.trim()} onClick={() => onSubmitPrediction(predictDraft.trim())}>
                  提交猜想，揭晓
                </Button>
                <button
                  type="button"
                  onClick={() => onSubmitPrediction("")}
                  className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  不确定，直接看
                </button>
              </div>
            </div>
          )}

          {!entry.answer && !entry.streaming && !entry.error && !inPredict && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              确认上一步后，进入本步
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

/** 认知差面板（先猜后揭）：对照猜想，标出命中/遗漏/偏差（三色 badge 行，对齐新 UI 设计稿） */
function GapPanel({ gap }: { gap: StepGap }) {
  const rows = [
    { label: "命中", items: gap.hit, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "遗漏", items: gap.miss, cls: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "偏差", items: gap.wrong, cls: "text-red-700 bg-red-50 border-red-200" },
  ].filter(r => r.items && r.items.length)
  if (!rows.length) return null
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-muted-foreground tracking-[0.02em]">认知差 · 对照你的猜想（基于认知雷达原文评判）</div>
      <div className="flex flex-col gap-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${r.cls}`}>{r.label}</span>
            <span className="text-[13px] leading-relaxed text-foreground/80">{r.items.join("　·　")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
