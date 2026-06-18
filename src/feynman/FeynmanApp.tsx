import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Toaster, toast } from "sonner"
import {
  Settings, Play, MessageCircle, Brain, SquarePen, ArrowLeft,
} from "lucide-react"
import { SiteHeader, type NavPage } from "../pages/SiteHeader"

import type { FeynmanDigest, GraphDelta, LlmConfig, Note, StepEntry, FeynmanWarmupQuestion } from "./types"
import { DEFAULT_CFG, loadCfg, addNote, findCachedNote } from "./lib/storage"
import { callFeynmanWarmup } from "./lib/llm"

import { FeynmanPrime } from "./components/FeynmanPrime"
import { StepPipeline, emptySteps } from "./components/StepPipeline"
import { FeynmanProgress } from "./components/FeynmanProgress"
import { FeynmanDigestPanel } from "./components/FeynmanDigestPanel"
import { SettingsDialog } from "./components/SettingsDialog"
import { useLatestRadarWeek, useRadarWeekById } from "../data/radarData"

function genId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

interface FeynmanAppProps {
  /** 来自深度计划的认知点 id（用于 learning → published 流转） */
  conceptId?: string
  /** 进入时预填的问题（认知点中文标题） */
  initialQuestion?: string
  /** 学习完成后跳转到成稿编辑器，携带认知点 id */
  onGoToEditor?: (id?: string) => void
  /** 平台全局导航（套 AICC SiteHeader 用） */
  onNavigate?: (page: NavPage) => void
  /** 费曼内化完成时回调：把图谱关系（concept→parent）回写平台认知状态 */
  onInternalized?: (id: string, delta: GraphDelta) => void
}

export function FeynmanApp({ conceptId, initialQuestion, onGoToEditor, onNavigate, onInternalized }: FeynmanAppProps = {}) {
  const [cfg, setCfg] = useState<LlmConfig>(DEFAULT_CFG)
  const [rawQuestion, setRawQuestion] = useState(initialQuestion ?? "")
  const [topic, setTopic] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  // 自由模式示例：取自最新一周认知雷达（弃用旧 30 概念库）
  const { week: radarWeek } = useLatestRadarWeek()
  const exampleConcepts = useMemo(
    () => radarWeek.insights.slice(0, 5).map(i => ({ label: i.title, url: i.sourceUrl })),
    [radarWeek],
  )

  // grounding：从 conceptId 所在周的雷达数据查回该认知点的原文/提炼，
  // 作为四步讲解与「认知差」评测的事实依据（需求2：评测依赖雷达原文，而非纯 LLM 现场重编）
  const conceptWeekId = conceptId?.match(/^\d{4}-W\d{2}/)?.[0]
  const { week: conceptRadarWeek } = useRadarWeekById(conceptWeekId)
  const grounding = useMemo(() => {
    if (!conceptId) return undefined
    const it = conceptRadarWeek.insights.find(i => i.id === conceptId)
    if (!it) return undefined
    return [
      `概念：${it.title}（${it.eyebrow}）`,
      `一句话：${it.tagline}`,
      `核心原理：${it.corePrinciple}`,
      `为什么重要：${it.whyMatters}`,
      it.org ? `来源机构：${it.org}` : "",
      it.sourceUrl ? `原文链接：${it.sourceUrl}` : "",
    ].filter(Boolean).join("\n")
  }, [conceptId, conceptRadarWeek])

  const [started, setStarted] = useState(false)
  const [noteId, setNoteId] = useState<string>("")
  const [steps, setSteps] = useState<StepEntry[]>([])
  const [feynman, setFeynman] = useState<FeynmanDigest | null>(null)

  // 费曼预热
  const [warmupQuestions, setWarmupQuestions] = useState<FeynmanWarmupQuestion[]>([])
  const [warmupLoading, setWarmupLoading] = useState(false)
  const [warmupConfirmed, setWarmupConfirmed] = useState(false)

  // 各步骤 takeaway → 预填费曼三问
  const [stepTakeaways, setStepTakeaways] = useState<Record<string, string>>({})
  const handleTakeaway = (stepKey: string, text: string) => {
    setStepTakeaways(prev => ({ ...prev, [stepKey]: text }))
  }

  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const c = loadCfg()
    setCfg(c)
    if (!c.apiKey) {
      setTimeout(() => setShowSettings(true), 500)
    }
  }, [])

  const tags = useMemo(
    () => tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    [tagsInput],
  )

  const confirmedCnt = steps.filter(s => s.confirmed).length
  const allConfirmed = steps.length === 4 && confirmedCnt === 4

  // （已移除 CognitiveNavBar 的 cognitiveState 计算——四步进度改由 FeynmanProgress 基于 steps 渲染）

  function onStart() {
    if (!rawQuestion.trim()) {
      toast.error("先写下你想讲透的 AI 概念问题")
      return
    }
    if (!cfg.apiKey) {
      toast.error("请先在右上角设置 API Key（本产品需连接 LLM）")
      setShowSettings(true)
      return
    }
    if (!topic.trim()) {
      setTopic(rawQuestion.slice(0, 24))
    }

    // 检查本地缓存：如果之前已完成过同一问题，直接复用此前的真实 LLM 结果
    const cached = findCachedNote(rawQuestion)
    if (cached) {
      loadFromNote(cached)
      setWarmupQuestions(cached.warmupQuestions || [])
      setWarmupConfirmed(true)
      toast.success("已从本地缓存加载（此前已生成），无需重复调用 LLM")
      return
    }

    setNoteId(genId())
    setSteps(emptySteps())
    setFeynman(null)
    setWarmupQuestions([])
    setWarmupLoading(true)
    setWarmupConfirmed(false)
    setStarted(true)

    // 调用 LLM 生成费曼预热问题
    callFeynmanWarmup(rawQuestion, cfg)
      .then(questions => {
        setWarmupQuestions(questions)
        // 第一个问题返回后就关闭 loading，后续问题逐个“跳出来”
        setWarmupLoading(false)
      })
      .catch(err => {
        toast.error(`预热问题生成失败：${err.message}`)
        setWarmupLoading(false)
      })

    setTimeout(() => {
      document.getElementById("prime-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)
  }

  function onReset() {
    if (started && !confirm("重新开始会清空当前四大步骤进度，确定？")) return
    setStarted(false)
    setSteps([])
    setFeynman(null)
    setNoteId("")
  }

  function loadFromNote(n: Note) {
    setRawQuestion(n.rawQuestion)
    setTopic(n.topic)
    setTagsInput(n.tags.join(", "))
    setSteps(n.steps || [])
    setFeynman(n.feynman || null)
    setNoteId(n.id)
    setStarted(true)
    if (!n.steps || n.steps.length === 0) {
      toast.message(`载入的是旧版六问笔记：${n.topic}，请重新开始一次以生成三步结构`)
    } else {
      toast.success(`已载入：${n.topic}`)
    }
    setTimeout(() => {
      document.getElementById("prime-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const currentNote: Note = {
    id: noteId || genId(),
    topic: topic.trim() || rawQuestion.slice(0, 24),
    rawQuestion,
    steps,
    warmupQuestions: warmupQuestions.length > 0 ? warmupQuestions : undefined,
    feynman: feynman || undefined,
    tags,
    createdAt: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" theme="light" richColors />

      {/* AICC 全局导航壳（学习页不再是飞地） */}
      <SiteHeader activePage="plan" onNavigate={onNavigate ?? (() => {})} />

      {/* 来源上下文条：从哪来、学的哪个认知点、来源哪一周 */}
      <div className="border-b border-border bg-background/60">
        <div className="mx-auto max-w-6xl px-6 min-h-[44px] py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 text-[12.5px] min-w-0">
            <button
              onClick={() => onNavigate?.("plan")}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 深度计划
            </button>
            {conceptId && (
              <>
                <span className="text-border">/</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] shrink-0"
                  style={{ background: "hsl(var(--learning) / 0.12)", color: "hsl(var(--learning))" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--learning))" }} />
                  学习中
                </span>
                <span className="font-medium truncate">{initialQuestion || conceptId}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conceptId && /^\d{4}-W\d{2}/.test(conceptId) && (
              <span className="font-mono text-[11px] text-muted-foreground">
                来源 · {conceptId.match(/^\d{4}-W\d{2}/)?.[0]} 雷达
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="mr-1.5 h-4 w-4" />
              设置
            </Button>
          </div>
        </div>
      </div>


      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Hero —— 仅自由模式展示；概念模式已由来源上下文条 + 锁定卡片定位，无需营销大图 */}
        {!conceptId && (
          <section className="relative overflow-hidden rounded-xl border border-border bg-background-secondary px-8 py-12 text-center">
            <div className="relative max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-4 rounded-full border-border text-muted-foreground bg-background font-normal">
                <Brain className="mr-1 h-3 w-3" />
                AI算法概念费曼学习法
              </Badge>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight spectrum-text mb-4 whitespace-nowrap">
                如果你不能简单地解释它，你就没有真正理解它！
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-nowrap">
                你是否和我一样，看到个算法概念很好奇，但是看论文又很难理解，期望这个网页对你有点帮助
              </p>
            </div>
          </section>
        )}

        {/* Input Card —— 仅 warmup 前显示；进入四步后由 FeynmanProgress 接管标题/进度/重新开始 */}
        {!warmupConfirmed && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {conceptId ? (
              /* 概念模式：认知点已从深度计划带入并确定，锁定展示（不再是可搜索/可编辑的输入） */
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" />本次要穿透学习的认知点（来自深度计划）
                </label>
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-foreground">{rawQuestion || initialQuestion || conceptId}</span>
                  {!started && onNavigate && (
                    <button
                      onClick={() => onNavigate("plan")}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
                    >
                      换一个
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 自由模式：未带概念时才提供输入 + 示例 */
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" />你想穿透讲明白的 AI 概念（一句话提问）
                </label>
                <Textarea
                  value={rawQuestion}
                  onChange={e => setRawQuestion(e.target.value)}
                  placeholder="输入一个算法概念，如：GDN（Gated Delta Network）"
                  className="min-h-[90px]"
                  disabled={started}
                />
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-muted-foreground shrink-0">示例（本周雷达）：</span>
                  {exampleConcepts.map((ex, i) => (
                    <span key={i} className="relative group/ex">
                      <button
                        onClick={() => !started && setRawQuestion(ex.label)}
                        disabled={started}
                        className="rounded-full border border-border/60 bg-card/40 px-2.5 py-0.5 text-foreground/70 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ex.label}
                      </button>
                      <a
                        href={ex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pointer-events-none group-hover/ex:pointer-events-auto absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[10px] text-muted-foreground shadow-md opacity-0 group-hover/ex:opacity-100 transition-opacity duration-150 hover:text-primary"
                      >
                        {ex.url.length > 50 ? ex.url.slice(0, 50) + "…" : ex.url}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4">
              <div className="text-[11px] text-muted-foreground font-mono">
                {started ? (
                  <>进度：已确认 <span className="text-primary">{confirmedCnt}/4</span> {feynman ? "· 已内化" : allConfirmed ? "· 待内化" : ""}</>
                ) : (
                  <>未开始讲解</>
                )}
              </div>
              <div className="flex gap-2">
                {started && (
                  <Button variant="outline" size="sm" onClick={onReset}>
                    重新开始
                  </Button>
                )}
                {!started && (
                  <Button variant="glow" size="lg" onClick={onStart}>
                    <Play className="mr-2 h-4 w-4" />
                    开始讲解
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* 已开始：预热 → 六问 → 内化 → 导出 */}
        {started && (
          <>
            <div id="prime-anchor" />
            <FeynmanPrime questions={warmupQuestions} loading={warmupLoading} />

            {/* 用户确认看完预热后，才显示六问管线 */}
            {!warmupConfirmed && warmupQuestions.length > 0 && (
              <div className="flex justify-center py-4">
                <Button variant="glow" size="lg" onClick={() => setWarmupConfirmed(true)}>
                  <Play className="mr-2 h-4 w-4" />
                  我看完了，开始讲解
                </Button>
              </div>
            )}

            {warmupConfirmed && (
              <>
                <FeynmanProgress steps={steps} topic={rawQuestion || initialQuestion} onReset={onReset} sourceWeek={conceptWeekId} />
                <StepPipeline
                  rawQuestion={rawQuestion}
                  grounding={grounding}
                  cfg={cfg}
                  value={steps}
                  onChange={setSteps}
                  onTakeaway={handleTakeaway}
                />
              </>
            )}

            {allConfirmed && (
              <FeynmanDigestPanel
                topic={currentNote.topic}
                rawQuestion={rawQuestion}
                context={steps.map(s => ({ key: s.key, answer: s.answer }))}
                cfg={cfg}
                warmupQuestions={warmupQuestions}
                prefills={{ biz: stepTakeaways.step1, dev: stepTakeaways.step2, internal: stepTakeaways.step3 }}
                onDigest={(d) => {
                  setFeynman(d)
                  // 内化产出的图谱关系回写平台认知状态（驱动认知图谱关系边）
                  if (conceptId && d.graphDelta) onInternalized?.(conceptId, d.graphDelta)
                  // 费曼评估完成后，自动保存为本地缓存
                  const note: Note = {
                    id: noteId || genId(),
                    topic: topic.trim() || rawQuestion.slice(0, 24),
                    rawQuestion,
                    steps,
                    warmupQuestions: warmupQuestions.length > 0 ? warmupQuestions : undefined,
                    feynman: d,
                    tags,
                    createdAt: new Date().toISOString(),
                  }
                  addNote(note)
                  toast.success("整份资料已存入本地缓存，下次提问相同问题将直接加载")
                }}
              />
            )}

            {/* 内化前置成成稿门槛：四步确认后，必须先完成费曼内化三问，才解锁「去成稿」 */}
            {onGoToEditor && allConfirmed && !feynman && (
              <Card className="border-dashed">
                <CardContent className="pt-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">成稿前，先完成上方「费曼内化三问」</span>
                  —— 输出倒逼输入：你能讲清、经评分，才算真懂，才能成文。
                </CardContent>
              </Card>
            )}

            {/* 内化完成 → 整理成文：进入成稿编辑器（learning → published 入口） */}
            {onGoToEditor && feynman && (
              <Card className="border-primary/30">
                <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">已讲透？整理成文，沉淀为文章</div>
                    <div className="text-xs text-muted-foreground">
                      费曼内化已完成，进入成稿编辑器把它写成文章，发布后该认知点将标记为「已成稿」。
                    </div>
                  </div>
                  <Button variant="glow" size="lg" onClick={() => onGoToEditor(conceptId)}>
                    <SquarePen className="mr-2 h-4 w-4" />
                    去成稿
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <footer className="text-center text-[11px] text-muted-foreground py-6 font-mono tracking-[0.04em]">
          AICC · 费曼学习（learning 阶段）· 笔记仅存浏览器 localStorage
        </footer>
      </main>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} onSaved={setCfg} />
    </div>
  )
}
