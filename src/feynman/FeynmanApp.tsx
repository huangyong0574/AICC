import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Toaster, toast } from "sonner"
import {
  Sparkles, Settings, Library, Network, Play, Zap, MessageCircle, Brain,
} from "lucide-react"

import type { FeynmanDigest, LlmConfig, Note, StepEntry, FeynmanWarmupQuestion } from "./types"
import { DEFAULT_CFG, loadCfg, addNote, findCachedNote } from "./lib/storage"
import { callFeynmanWarmup } from "./lib/llm"

import { FeynmanPrime } from "./components/FeynmanPrime"
import { StepPipeline, emptySteps } from "./components/StepPipeline"
import { FeynmanDigestPanel } from "./components/FeynmanDigestPanel"
import { ExportBar } from "./components/ExportBar"
import { CognitiveNavBar } from "./components/CognitiveNavBar"
import { SettingsDialog } from "./components/SettingsDialog"
import { LibraryDialog } from "./components/LibraryDialog"
import { GraphDialog } from "./components/GraphDialog"
import { ALGORITHM_CONCEPTS } from "./data/algorithm-concepts"

/** 从知识图谱中随机抽取 N 个概念作为示例（每次刷新页面随机） */
function pickExamples(count: number) {
  const shuffled = [...ALGORITHM_CONCEPTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(c => ({ label: c.label, url: c.url }))
}

const EXAMPLES = pickExamples(5)

function genId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function FeynmanApp() {
  const [cfg, setCfg] = useState<LlmConfig>(DEFAULT_CFG)
  const [rawQuestion, setRawQuestion] = useState("")
  const [topic, setTopic] = useState("")
  const [tagsInput, setTagsInput] = useState("")

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
  const [showLibrary, setShowLibrary] = useState(false)
  const [showGraph, setShowGraph] = useState(false)

  useEffect(() => {
    const c = loadCfg()
    setCfg(c)
    if (!c.apiKey && !c.offlineMock) {
      setTimeout(() => setShowSettings(true), 500)
    }
  }, [])

  const tags = useMemo(
    () => tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    [tagsInput],
  )

  const confirmedCnt = steps.filter(s => s.confirmed).length
  const allConfirmed = steps.length === 4 && confirmedCnt === 4

  // Cognitive nav bar state computation (6 nodes)
  // 开场提问(1) → 类比理解(2) → 场景边界(3) → 深入原理(4) → 本质总结(5) → 开场提问闭环(6)
  const cognitiveState = useMemo(() => {
    const completed: number[] = []
    let current = 1

    // Node 1 (开场提问): completed when warmup confirmed
    if (warmupConfirmed) {
      completed.push(1)
      current = 2
    }
    // Node 2 (类比理解): completed when step1 confirmed
    if (steps[0]?.confirmed) {
      completed.push(2)
      current = 3
    }
    // Node 3 (场景边界): completed when step2 confirmed
    if (steps[1]?.confirmed) {
      completed.push(3)
      current = 4
    }
    // Node 4 (深入原理): completed when step3 confirmed
    if (steps[2]?.confirmed) {
      completed.push(4)
      current = 5
    }
    // Node 5 (本质总结): completed when step4 confirmed
    if (steps[3]?.confirmed) {
      completed.push(5)
      current = 6
    }
    // Node 6 (开场提问闭环): completed when feynman digest done
    if (feynman) {
      completed.push(6)
      current = 6
    }

    return { current, completed }
  }, [steps, feynman, warmupConfirmed])

  function onStart() {
    if (!rawQuestion.trim()) {
      toast.error("先写下你想讲透的 AI 概念问题")
      return
    }
    if (!cfg.apiKey && !cfg.offlineMock) {
      toast.error("请先在右上角设置 API Key（或开启离线预览）")
      setShowSettings(true)
      return
    }
    if (!topic.trim()) {
      setTopic(rawQuestion.slice(0, 24))
    }

    // 检查本地缓存：如果之前已完成过同一问题，直接复用离线资料
    const cached = findCachedNote(rawQuestion)
    if (cached) {
      loadFromNote(cached)
      setWarmupQuestions(cached.warmupQuestions || [])
      setWarmupConfirmed(true)
      toast.success("已从本地离线资料加载，无需再次调用 LLM")
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-md bg-foreground flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight tracking-tight">AI算法概念费曼学习法</div>
              <div className="text-[10px] text-muted-foreground font-mono leading-tight">1页+3个问题+4个步骤 = 1个概念小闭环</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cfg.offlineMock && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" title="当前使用内置 GDN 样本数据，未调用真实 LLM">
                <Zap className="h-3 w-3" />
                离线预览
              </Badge>
            )}
            <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed relative" title="待上线">
              <Library className="mr-1.5 h-4 w-4" />
              笔记库
              <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-muted-foreground/15 text-muted-foreground px-1 py-px rounded-full leading-tight font-medium">soon</span>
            </Button>
            <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed relative" title="待上线">
              <Network className="mr-1.5 h-4 w-4" />
              图谱
              <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-muted-foreground/15 text-muted-foreground px-1 py-px rounded-full leading-tight font-medium">soon</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="mr-1.5 h-4 w-4" />
              设置
            </Button>
          </div>
        </div>
      </header>

      {/* Cognitive Navigation Bar - appears once learning started */}
      {started && (
        <CognitiveNavBar
          currentNode={cognitiveState.current}
          completedNodes={cognitiveState.completed}
        />
      )}

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Hero */}
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

        {/* Input Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
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
                <span className="text-muted-foreground shrink-0">示例：</span>
                {EXAMPLES.map((ex, i) => (
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
              <StepPipeline
                rawQuestion={rawQuestion}
                cfg={cfg}
                value={steps}
                onChange={setSteps}
                onTakeaway={handleTakeaway}
              />
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
                  // 费曼评估完成后，自动保存为离线资料
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
                  toast.success("整份资料已保存为离线资料，下次提问相同问题将直接加载")
                }}
              />
            )}

            {(allConfirmed || steps.some(s => s.confirmed)) && (
              <Card>
                <CardContent className="pt-5 space-y-3">
                  <div className="text-xs text-muted-foreground">素材导出 / 沉淀</div>
                  <ExportBar note={currentNote} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        <footer className="text-center text-[11px] text-muted-foreground py-6">
          Built with <span className="text-foreground">shadcn/ui · Radix UI · Tailwind</span> · 笔记仅存浏览器 localStorage
        </footer>
      </main>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} onSaved={setCfg} />
      <LibraryDialog open={showLibrary} onOpenChange={setShowLibrary} onLoad={loadFromNote} />
      <GraphDialog open={showGraph} onOpenChange={setShowGraph} />
    </div>
  )
}
