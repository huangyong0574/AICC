import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Toaster, toast } from "sonner"
import {
  Sparkles, Settings, Library, Network, Play, Zap, MessageCircle,
} from "lucide-react"

import type { FeynmanDigest, LlmConfig, Note, StepEntry, FeynmanWarmupQuestion } from "./types"
import { DEFAULT_CFG, loadCfg } from "./lib/storage"
import { callFeynmanWarmup } from "./lib/llm"

import { FeynmanPrime } from "./components/FeynmanPrime"
import { StepPipeline, emptySteps } from "./components/StepPipeline"
import { FeynmanDigestPanel } from "./components/FeynmanDigestPanel"
import { ExportBar } from "./components/ExportBar"
import { SettingsDialog } from "./components/SettingsDialog"
import { LibraryDialog } from "./components/LibraryDialog"
import { GraphDialog } from "./components/GraphDialog"

const EXAMPLES = [
  "什么是 GDN（Gated Delta Network）？",
  "Transformer 的 Attention 为什么是 O(N²)？",
  "Mamba / 状态空间模型（SSM）和 RNN 的区别",
  "MoE（混合专家）的路由为什么有负载不均？",
]

function genId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function GdnApp() {
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
  const allConfirmed = steps.length === 3 && confirmedCnt === 3

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
    if (started && !confirm("重新开始会清空当前三大步骤进度，确定？")) return
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
              <div className="text-sm font-semibold leading-tight tracking-tight">你的AI认知教练</div>
              <div className="text-[10px] text-muted-foreground font-mono leading-tight">三大步骤流式 · 费曼内化 · Transformer 基线图谱</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cfg.offlineMock && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" title="当前使用内置 GDN 样本数据，未调用真实 LLM">
                <Zap className="h-3 w-3" />
                离线预览
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowLibrary(true)}>
              <Library className="mr-1.5 h-4 w-4" />
              笔记库
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowGraph(true)}>
              <Network className="mr-1.5 h-4 w-4" />
              图谱
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="mr-1.5 h-4 w-4" />
              设置
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-background-secondary px-8 py-12 text-center">
          <div className="relative max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-4 rounded-full border-border text-muted-foreground bg-background font-normal">
              <Zap className="mr-1 h-3 w-3" />
              面向客户一线的MaaS从业者
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight spectrum-text mb-4 whitespace-nowrap">
              算法实验到客户一线的认知桥梁
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-nowrap">
              学习的终点不是记住多少道理，而是过上更好的生活、拥有更多选择权、掌控自己的人生！
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
                placeholder="例：什么是 GDN（Gated Delta Network）？"
                className="min-h-[90px]"
                disabled={started}
              />
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-muted-foreground">示例：</span>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => !started && setRawQuestion(ex)}
                    disabled={started}
                    className="rounded-full border border-border/60 bg-card/40 px-2.5 py-0.5 text-foreground/70 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <div className="text-[11px] text-muted-foreground font-mono">
                {started ? (
                  <>进度：已确认 <span className="text-primary">{confirmedCnt}/3</span> {feynman ? "· 已内化" : allConfirmed ? "· 待内化" : ""}</>
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
              />
            )}

            {allConfirmed && (
              <FeynmanDigestPanel
                topic={currentNote.topic}
                rawQuestion={rawQuestion}
                context={steps.map(s => ({ key: s.key, answer: s.answer }))}
                cfg={cfg}
                onDigest={setFeynman}
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
