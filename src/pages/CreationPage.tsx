import { useMemo, useState } from 'react'
import { ArrowLeft, Bookmark, Check, FileText, Lightbulb, Lock, Sparkles } from 'lucide-react'
import { SiteHeader, type NavPage } from './SiteHeader'
import { useLatestRadarWeek } from '../data/radarData'
import { loadNotes } from '../feynman/lib/storage'
import type { Note } from '../feynman/types'
import { Button } from '@/components/ui/button'

/**
 * CreationPage — 创作（认知闭环最后一环）
 *  选题约稿（已闭环知识点 × 雷达行业动态 → 选题；门槛不足则锁定）→ 写作台（钉选题 + 自己写）。
 *  闭环：认知雷达 发现 → 深度计划/学习 内化 → 创作 发布 → 回写雷达。
 *  数据口径：已闭环 = 费曼内化完成的笔记（有 feynman digest 或四步全确认）。
 *  本阶段：选题约稿视图（真实数据驱动）+ 写作台基础编辑；素材引用/AI 陪练/发布闭环/LLM 选题见后续阶段。
 */
interface CreationPageProps {
  onNavigate: (page: NavPage) => void
  /** 深链 /creation?topic= 钉住的选题 id */
  topicId?: string
}

interface Topic {
  id: string
  topic: string        // 知识点名
  title: string        // 选题标题
  dek: string          // 选题副述
  hook?: string        // 行业钩子（来自雷达 news）
  note: Note
}

const UNLOCK_MIN = 2  // 门槛：已闭环知识点少于此数时，更多选题锁定（宁缺毋滥）

export function CreationPage({ onNavigate, topicId }: CreationPageProps) {
  const { week } = useLatestRadarWeek()
  const closed = useMemo(
    () => loadNotes().filter(n => n.feynman || (n.steps?.filter(s => s.confirmed).length ?? 0) === 4),
    [],
  )
  const news = week.news ?? []
  const topics = useMemo<Topic[]>(
    () =>
      closed.map((n, i) => ({
        id: n.conceptId || n.id,
        topic: n.topic,
        title: `从「${n.topic}」出发，写一篇讲得透的深度文`,
        dek: '你已吃透它的原理与类比，正好有资格把它讲清、讲透、讲出观点。',
        hook: news.length ? news[i % news.length]?.title : undefined,
        note: n,
      })),
    [closed, news],
  )

  const [view, setView] = useState<'topics' | 'desk'>(topicId ? 'desk' : 'topics')
  const [pinned, setPinned] = useState<Topic | null>(
    topicId ? topics.find(t => t.id === topicId) ?? null : null,
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePage="creation" onNavigate={onNavigate} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {view === 'desk' && pinned ? (
          <DeskView pinned={pinned} onBack={() => setView('topics')} />
        ) : (
          <TopicsView
            topics={topics}
            closedCount={closed.length}
            hasNews={news.length > 0}
            onPlan={() => onNavigate('plan')}
            onOpen={t => {
              setPinned(t)
              setView('desk')
              window.scrollTo({ top: 0 })
            }}
          />
        )}
      </main>
    </div>
  )
}

/* ───────── 选题约稿视图 ───────── */
function TopicsView({
  topics,
  closedCount,
  hasNews,
  onOpen,
  onPlan,
}: {
  topics: Topic[]
  closedCount: number
  hasNews: boolean
  onOpen: (t: Topic) => void
  onPlan: () => void
}) {
  return (
    <>
      <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">CREATION · 选题约稿</div>
      <h1 className="mt-1.5 text-[1.45rem] font-semibold tracking-tight">从你已闭环的知识点，找到值得写的选题</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        AI 只负责找角度、给时机、点素材——<span className="text-foreground/80">文章你自己写。</span>
      </p>

      {/* 取材自：已闭环 × 行业动态 */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-[12px]">
        <span className="text-muted-foreground">取材自</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--mature)/0.3)] bg-[hsl(var(--mature)/0.08)] px-2.5 py-1 font-medium text-[hsl(var(--mature))]">
          <Check className="h-3 w-3" />已闭环 {closedCount} 个知识点
        </span>
        <span className="text-border">×</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
          本周行业动态{hasNews ? '' : '（暂无）'}
        </span>
      </div>

      {closedCount === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
          <Lightbulb className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground/80">还没有已闭环的知识点。</p>
          <p className="mt-1 text-[13px] text-muted-foreground">先去深度计划学透、内化一个知识点，创作才会向你约稿——有底料才动笔。</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onPlan}>去深度计划 →</Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          {topics.map(t => (
            <TopicCard key={t.id} topic={t} onOpen={onOpen} />
          ))}
          {closedCount < UNLOCK_MIN && (
            <div className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-[hsl(var(--border))] bg-card px-4 py-3 text-[12.5px] leading-snug text-muted-foreground">
              <Lock className="h-[15px] w-[15px] shrink-0" />
              <span>
                更多「对撞型」选题需再闭环 <b className="text-foreground/70">{UNLOCK_MIN - closedCount}</b> 个相邻知识点解锁——选题宁缺毋滥，有底料才约稿。
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function TopicCard({ topic, onOpen }: { topic: Topic; onOpen: (t: Topic) => void }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-5 pt-4">
        <span className="inline-block rounded-md border border-[hsl(var(--mature)/0.3)] bg-[hsl(var(--mature)/0.08)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--mature))]">
          已闭环 · 可写
        </span>
        <h2 className="mt-2.5 text-[1.05rem] font-semibold leading-snug">{topic.title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{topic.dek}</p>
      </div>
      {topic.hook && (
        <div className="mx-5 mt-3.5 rounded-lg border border-border/70 bg-background px-3 py-2.5">
          <div className="text-[11px] text-muted-foreground">为什么现在 · 行业钩子</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-foreground/80">
            <Sparkles className="h-3 w-3 shrink-0 text-warning" />
            {topic.hook}
          </div>
        </div>
      )}
      <div className="mx-5 mt-3">
        <div className="text-[11px] text-muted-foreground">可调用你的闭环笔记</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border px-2.5 py-1 text-[12px] text-foreground/70">⬡ {topic.topic}</span>
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

/* ───────── 写作台视图（阶段1：钉选题 + 基础编辑 + 字数；素材引用/陪练/发布见后续阶段） ───────── */
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
          {pinned.hook && <div className="mt-1 text-[11.5px] text-muted-foreground">钩子 · {pinned.hook}</div>}
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
        写作台基础版已就位 · 我的素材引用 / AI 陪练 / 发布并闭环将在后续阶段接入
      </p>
    </>
  )
}
