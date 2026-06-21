import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bookmark, Check, FileText, Lightbulb, Loader2, RefreshCw, Settings, Sparkles } from 'lucide-react'
import { SiteHeader, type NavPage } from './SiteHeader'
import { useLatestRadarWeek } from '../data/radarData'
import { loadNotes, loadCfg } from '../feynman/lib/storage'
import { callTopics, type GenTopic, type TopicAngle } from '../feynman/lib/llm'
import { SettingsDialog } from '../feynman/components/SettingsDialog'
import type { Note, LlmConfig } from '../feynman/types'
import { Button } from '@/components/ui/button'

/**
 * CreationPage — 创作（认知闭环最后一环）
 *  选题约稿：用户「全部历史已闭环知识点（跨周）× 近期行业趋势」→ LLM 生成面向「AI Native 组织转型客户」的
 *  融合/对比型选题（角度 + 客户共鸣度 + 行业钩子 + 可调用的多个闭环知识点）；门槛不足锁定（宁缺毋滥）。
 *  → 写作台（钉选题 + 自己写）。素材引用 / AI 陪练 / 发布闭环见 creation-writing-desk。
 *  已闭环 = 费曼内化完成的笔记（有 feynman digest 或四步全确认）。
 */
interface CreationPageProps {
  onNavigate: (page: NavPage) => void
  topicId?: string
}

interface Topic {
  id: string
  angle: TopicAngle
  title: string
  dek: string
  potential: number              // 客户共鸣度 1–5
  hook?: { text: string; sourceUrl?: string }
  conceptIds: string[]
  conceptTitles: string[]        // 可调用的闭环知识点（chips）
}

const UNLOCK_MIN = 2  // 门槛：已闭环知识点少于此数时锁定（宁缺毋滥，无底料不约稿）
const CACHE_KEY = 'aicc-creation-topics'

// 角度配色（5 类面向转型客户的决策视角，结构化 + 固定模板）
const ANGLE_STYLE: Record<TopicAngle, string> = {
  战略抉择: 'border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] text-[hsl(var(--destructive))]',
  组织变革: 'border-[hsl(var(--layer-4)/0.35)] bg-[hsl(var(--layer-4)/0.1)] text-[hsl(var(--layer-4))]',
  能力跃迁: 'border-[hsl(var(--layer-3)/0.35)] bg-[hsl(var(--layer-3)/0.1)] text-[hsl(var(--layer-3))]',
  落地治理: 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] text-[hsl(var(--warning))]',
  趋势预判: 'border-[hsl(var(--mature)/0.3)] bg-[hsl(var(--mature)/0.08)] text-[hsl(var(--mature))]',
}

// 从已闭环 Note 取「精髓」喂给选题 LLM：一句话本质 → 类比金句 → valueLead 兜底
function conceptEssence(note: Note): { id: string; topic: string; essence: string } {
  const steps = note.steps || []
  const ans = (k: string) => steps.find(s => s.key === k)?.answer as any
  const s4 = ans('step4')
  const s1 = ans('step1')
  const essence = s4?.oneLiner || s1?.analogy?.quote || (s1?.valueLead ? String(s1.valueLead) : note.topic)
  return { id: note.conceptId || note.id, topic: note.topic, essence: String(essence).slice(0, 120) }
}

function loadTopicCache(sig: string): Topic[] | null {
  try {
    const r = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return r && r.sig === sig && Array.isArray(r.topics) ? r.topics : null
  } catch { return null }
}
function saveTopicCache(sig: string, topics: Topic[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sig, generatedAt: Date.now(), topics })) } catch { /* quota */ }
}

export function CreationPage({ onNavigate, topicId }: CreationPageProps) {
  const { week } = useLatestRadarWeek()
  const closed = useMemo(
    () => loadNotes().filter(n => n.feynman || (n.steps?.filter(s => s.confirmed).length ?? 0) === 4),
    [],
  )
  // 全部历史已闭环知识点（跨周），按时间新→旧，集大时控量喂 LLM
  const conceptList = useMemo(
    () => [...closed]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 15)
      .map(conceptEssence),
    [closed],
  )
  const sig = useMemo(() => conceptList.map(c => c.id).slice().sort().join('|'), [conceptList])
  const trends = useMemo(
    () => [
      ...(week.news ?? []).map(n => n.title),
      ...(week.insights ?? []).map(i => i.title + (i.tagline ? '：' + i.tagline : '')),
    ].filter(Boolean).slice(0, 14),
    [week],
  )

  const [cfg, setCfg] = useState<LlmConfig>(() => loadCfg())
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const generate = useCallback(async (force: boolean) => {
    if (conceptList.length < UNLOCK_MIN) return
    if (!force) {
      const cached = loadTopicCache(sig)
      if (cached && cached.length) { setTopics(cached); setErr(null); return }
    }
    if (!cfg.apiKey) { setErr('no-key'); setShowSettings(true); return }
    setLoading(true); setErr(null)
    try {
      const gen: GenTopic[] = await callTopics(conceptList, trends, cfg)
      const ts: Topic[] = gen.map((g, i) => ({
        id: `gen-${i}-${g.conceptIds.join('-')}`.slice(0, 64),
        angle: g.angle, title: g.title, dek: g.dek, potential: g.potential, hook: g.hook,
        conceptIds: g.conceptIds,
        conceptTitles: g.conceptIds.map(id => conceptList.find(c => c.id === id)?.topic || id),
      }))
      setTopics(ts)
      saveTopicCache(sig, ts)
    } catch (e: any) {
      setErr(e?.message || '选题生成失败')
    } finally {
      setLoading(false)
    }
  }, [conceptList, sig, trends, cfg])

  // 挂载 / 闭环集合变化 / 配置变化 时：读缓存或生成
  useEffect(() => { generate(false) }, [generate])

  const [view, setView] = useState<'topics' | 'desk'>(topicId ? 'desk' : 'topics')
  const [pinned, setPinned] = useState<Topic | null>(null)
  useEffect(() => {
    if (topicId) { const t = topics.find(x => x.id === topicId); if (t) { setPinned(t); setView('desk') } }
  }, [topicId, topics])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePage="creation" onNavigate={onNavigate} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {view === 'desk' && pinned ? (
          <DeskView pinned={pinned} onBack={() => setView('topics')} />
        ) : (
          <TopicsView
            topics={topics}
            closedCount={conceptList.length}
            hasTrends={trends.length > 0}
            loading={loading}
            err={err}
            onRegen={() => generate(true)}
            onOpenSettings={() => setShowSettings(true)}
            onPlan={() => onNavigate('plan')}
            onOpen={t => { setPinned(t); setView('desk'); window.scrollTo({ top: 0 }) }}
          />
        )}
      </main>
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} onSaved={setCfg} />
    </div>
  )
}

/* ───────── 选题约稿视图 ───────── */
function TopicsView({
  topics, closedCount, hasTrends, loading, err, onRegen, onOpenSettings, onOpen, onPlan,
}: {
  topics: Topic[]
  closedCount: number
  hasTrends: boolean
  loading: boolean
  err: string | null
  onRegen: () => void
  onOpenSettings: () => void
  onOpen: (t: Topic) => void
  onPlan: () => void
}) {
  return (
    <>
      <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">CREATION · 选题约稿</div>
      <h1 className="mt-1.5 text-[1.45rem] font-semibold tracking-tight">从你已闭环的知识点，找到值得写的选题</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        AI 融合你的认知 × 行业趋势，给面向转型客户的角度——<span className="text-foreground/80">文章你自己写。</span>
      </p>

      {/* 取材自：全部已闭环 × 近期趋势 + 换一批 */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-[12px]">
        <span className="text-muted-foreground">取材自</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--mature)/0.3)] bg-[hsl(var(--mature)/0.08)] px-2.5 py-1 font-medium text-[hsl(var(--mature))]">
          <Check className="h-3 w-3" />已闭环 {closedCount} 个知识点
        </span>
        <span className="text-border">×</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
          近期行业趋势{hasTrends ? '' : '（暂无）'}
        </span>
        {closedCount >= UNLOCK_MIN && (
          <button
            onClick={onRegen}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] text-foreground/70 transition-colors hover:text-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            换一批
          </button>
        )}
      </div>

      {closedCount < UNLOCK_MIN ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
          <Lightbulb className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground/80">已闭环知识点不足（{closedCount}/{UNLOCK_MIN}）。</p>
          <p className="mt-1 text-[13px] text-muted-foreground">选题需要融合多个你已吃透的知识点——先去深度计划再内化 {UNLOCK_MIN - closedCount} 个，创作才会向你约稿。</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onPlan}>去深度计划 →</Button>
        </div>
      ) : err === 'no-key' ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
          <Settings className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground/80">选题由 LLM 实时生成，需要先配置百炼 API Key。</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onOpenSettings}>去设置 →</Button>
        </div>
      ) : loading && topics.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-3 text-[13px] text-muted-foreground">正在融合你的认知与行业趋势，生成面向转型客户的选题…</p>
        </div>
      ) : err ? (
        <div className="mt-6 rounded-xl border border-dashed border-[hsl(var(--destructive)/0.4)] bg-card px-5 py-8 text-center">
          <p className="text-sm text-[hsl(var(--destructive))]">选题生成失败</p>
          <p className="mt-1 text-[12px] text-muted-foreground">{err}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onRegen}>重试</Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          {topics.map(t => <TopicCard key={t.id} topic={t} onOpen={onOpen} />)}
        </div>
      )}
    </>
  )
}

function PotentialDots({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      客户共鸣
      <span className="flex items-end gap-[2px]">
        {[1, 2, 3, 4, 5].map(i => (
          <i key={i} className={`w-[3px] rounded-[1px] ${i <= n ? 'h-[9px] bg-foreground/70' : 'h-[6px] bg-border'}`} />
        ))}
      </span>
    </span>
  )
}

function TopicCard({ topic, onOpen }: { topic: Topic; onOpen: (t: Topic) => void }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ANGLE_STYLE[topic.angle]}`}>
            {topic.angle}
          </span>
          <span className="ml-auto"><PotentialDots n={topic.potential} /></span>
        </div>
        <h2 className="mt-2.5 text-[1.05rem] font-semibold leading-snug">{topic.title}</h2>
        {topic.dek && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{topic.dek}</p>}
      </div>
      {topic.hook?.text && (
        <div className="mx-5 mt-3.5 rounded-lg border border-border/70 bg-background px-3 py-2.5">
          <div className="text-[11px] text-muted-foreground">为什么现在 · 行业钩子</div>
          <div className="mt-1 flex items-start gap-1.5 text-[12.5px] text-foreground/80">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
            {topic.hook.text}
          </div>
        </div>
      )}
      <div className="mx-5 mt-3">
        <div className="text-[11px] text-muted-foreground">可调用你的闭环笔记</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {topic.conceptTitles.map((c, i) => (
            <span key={i} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-foreground/70">⬡ {c}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2.5 border-t border-border/60 bg-background px-5 py-3">
        <Button variant="default" size="sm" className="ml-auto" onClick={() => onOpen(topic)}>
          就这个，我来写 →
        </Button>
      </div>
    </article>
  )
}

/* ───────── 写作台视图（阶段1：钉选题 + 基础编辑 + 字数；素材引用/陪练/发布见 creation-writing-desk） ───────── */
function DeskView({ pinned, onBack }: { pinned: Topic; onBack: () => void }) {
  const [title, setTitle] = useState(pinned.title)
  const [body, setBody] = useState('')
  const wordCount = (title + body).replace(/\s/g, '').length

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> 选题约稿
      </button>

      {/* 钉住的选题 */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
        <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-snug">{pinned.title}</div>
          {pinned.hook?.text && <div className="mt-1 text-[11.5px] text-muted-foreground">钩子 · {pinned.hook.text}</div>}
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">已钉选题</span>
      </div>

      {/* 编辑器 */}
      <div className="mt-3.5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5 text-[12px] text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> 正文 · 你的表达
          <span className="ml-auto font-mono">{wordCount} 字</span>
        </div>
        <div className="px-5 py-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="给文章起个标题…"
            className="w-full bg-transparent text-[1.15rem] font-semibold outline-none placeholder:text-muted-foreground/50"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="用你自己的话写下去——AI 不替你成句。"
            className="mt-3 min-h-[260px] w-full resize-y bg-transparent text-[14px] leading-[1.9] text-foreground/90 outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-muted-foreground">
        写作台基础版已就位 · 我的素材引用 / AI 陪练 / 发布并闭环见 creation-writing-desk
      </p>
    </>
  )
}
