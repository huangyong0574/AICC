import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Bookmark, Check, FileText, Lightbulb, Loader2, RefreshCw, Settings, Sparkles } from 'lucide-react'
import { SiteHeader, type NavPage } from './SiteHeader'
import { useLatestRadarWeek } from '../data/radarData'
import { loadNotes, loadCfg } from '../feynman/lib/storage'
import { callTopics, callSparring, type GenTopic, type TopicAngle, type SparringMode } from '../feynman/lib/llm'
import { SettingsDialog } from '../feynman/components/SettingsDialog'
import { useCognition } from '../lib/cognition'
import { isLlmReady } from '@/lib/gateway'
import { renderArticleBody } from '../lib/markdown'
import { publishArticleToStorage, slugify, loadPublishedMarkdown, findPublishedByConceptId } from '../lib/publishArticle'
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

// 「我的素材」：从已闭环 Note 派生 原理/类比/本质（点击引用进正文，不替用户成句）
interface Material { kind: '原理' | '类比' | '本质'; text: string; source: string }
function extractMaterials(note: Note): Material[] {
  const steps = note.steps || []
  const ans = (k: string) => steps.find(s => s.key === k)?.answer as any
  const s1 = ans('step1'), s3 = ans('step3'), s4 = ans('step4')
  const out: Material[] = []
  const principle = s3?.principle?.coreIdea
    || (s3?.principle?.blueprint?.nodes ? s3.principle.blueprint.nodes.map((n: any) => n.label).filter(Boolean).join(' → ') : '')
  if (principle) out.push({ kind: '原理', text: String(principle).slice(0, 140), source: note.topic })
  const analogy = s1?.analogy?.quote || (s1?.valueLead ? String(s1.valueLead).split(/[。！？\n]/)[0] : '')
  if (analogy) out.push({ kind: '类比', text: String(analogy).slice(0, 140), source: note.topic })
  if (s4?.oneLiner) out.push({ kind: '本质', text: String(s4.oneLiner).slice(0, 140), source: note.topic })
  return out
}

// 组装成稿 Markdown（含 frontmatter，与文章页/发布同格式）
function buildArticleMd(title: string, body: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `---\ntitle: ${title}\ndate: ${today}\nstatus: 已发布\ncategory: 创作\n---\n\n${body}`
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
    if (!isLlmReady(cfg)) { setErr('no-key'); setShowSettings(true); return }
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
          <DeskView pinned={pinned} onBack={() => setView('topics')} notes={closed} cfg={cfg} />
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

/* ───────── 写作台视图：富文本编辑 + 素材引用 + AI陪练 + 草稿 + 发布/再改（闭环图谱） ───────── */
const SPAR_MODES: SparringMode[] = ['反方', '缺论据', '事实核查', '读者之问']
const SPAR_LABEL: Record<SparringMode, string> = { 反方: '找反方观点', 缺论据: '哪里缺论据', 事实核查: '事实核查', 读者之问: '读者之问' }

function DeskView({ pinned, onBack, notes, cfg }: { pinned: Topic; onBack: () => void; notes: Note[]; cfg: LlmConfig }) {
  const { upsert } = useCognition()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const draftKey = `aicc-creation-draft:${pinned.id}`
  const publishedEntry = useMemo(() => {
    for (const id of pinned.conceptIds) { const e = findPublishedByConceptId(id); if (e) return e }
    return null
  }, [pinned])

  const [title, setTitle] = useState(pinned.title)
  const [body, setBody] = useState('')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [restore, setRestore] = useState<{ title: string; body: string } | null>(null)
  const [spar, setSpar] = useState<{ mode: SparringMode; text: string } | null>(null)
  const [sparLoading, setSparLoading] = useState<SparringMode | null>(null)
  const [sparErr, setSparErr] = useState<string | null>(null)
  const [published, setPublished] = useState(!!publishedEntry)
  const saveTimer = useRef<number | undefined>(undefined)

  // 进入：有草稿 → 提示「继续/重新开始」；否则若已发布 → 预填已发布正文（再修改）
  useEffect(() => {
    try {
      const d = localStorage.getItem(draftKey)
      if (d) { const p = JSON.parse(d); setRestore({ title: p.title || pinned.title, body: p.body || '' }); return }
    } catch { /* ignore */ }
    if (publishedEntry) {
      const md = loadPublishedMarkdown(publishedEntry.slug) || ''
      const m = md.match(/^---[\s\S]*?---\s*([\s\S]*)$/)
      setBody((m ? m[1] : md).trim())
      setTitle(publishedEntry.title || pinned.title)
    }
  }, []) // 仅挂载

  // 草稿防抖自动存（选择继续/重开前不存，避免覆盖待恢复草稿）
  useEffect(() => {
    if (restore) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ title, body, updatedAt: Date.now() })) } catch { /* quota */ }
    }, 400)
    return () => window.clearTimeout(saveTimer.current)
  }, [title, body, restore, draftKey])

  const wordCount = (title + body).replace(/\s/g, '').length
  const materials = useMemo(
    () => pinned.conceptIds.flatMap(id => { const n = notes.find(x => (x.conceptId || x.id) === id); return n ? extractMaterials(n) : [] }),
    [pinned, notes],
  )

  function applyFormat(prefix: string, suffix = prefix, placeholder = '文字') {
    const ta = taRef.current; if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = body.slice(s, e) || placeholder
    setBody(body.slice(0, s) + prefix + sel + suffix + body.slice(e))
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = s + prefix.length; ta.selectionEnd = s + prefix.length + sel.length })
  }
  function insertBlock(text: string) {
    const ta = taRef.current
    const at = ta ? ta.selectionStart : body.length
    const pre = body.slice(0, at)
    const lead = at === 0 || pre.endsWith('\n') ? '' : '\n'
    setBody(pre + lead + text + '\n' + body.slice(at))
  }

  async function runSpar(mode: SparringMode) {
    if (!body.trim()) { setSparErr('先写点正文，再让我挑刺'); return }
    if (!isLlmReady(cfg)) { setSparErr('LLM 未就绪（本地 Gateway 未配置 key 或未填 API Key）'); return }
    setSparLoading(mode); setSparErr(null)
    try { setSpar({ mode, text: await callSparring(mode, body, cfg) }) }
    catch (e: any) { setSparErr(e?.message || 'AI 陪练失败') }
    finally { setSparLoading(null) }
  }

  function publish() {
    if (!title.trim() || !body.trim()) return
    const slug = publishedEntry?.slug || slugify(title)
    const ok = publishArticleToStorage({ slug, markdown: buildArticleMd(title, body), title, category: '创作', status: '已发布', conceptIds: pinned.conceptIds })
    if (!ok) return
    pinned.conceptIds.forEach(id => upsert(id, { title, slug, state: 'published' }))
    try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
    setPublished(true)
  }

  return (
    <>
      <style>{DESK_CSS}</style>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft style={{ width: 14, height: 14 }} /> 选题约稿
      </button>

      {/* 钉住的选题 */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
        <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-snug">{pinned.title}</div>
          {pinned.hook?.text && <div className="mt-1 text-[11.5px] text-muted-foreground">钩子 · {pinned.hook.text}</div>}
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">{published ? '已成文 · 可再改' : '已钉选题'}</span>
      </div>

      {/* 草稿恢复提示 */}
      {restore && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-2.5 text-[12.5px]">
          <span className="text-muted-foreground">发现上次草稿（{restore.body.replace(/\s/g, '').length} 字）</span>
          <button className="ml-auto rounded-md border border-border px-2.5 py-1 hover:bg-accent" onClick={() => { setTitle(restore.title); setBody(restore.body); setRestore(null) }}>继续</button>
          <button className="rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground" onClick={() => { try { localStorage.removeItem(draftKey) } catch { /* */ } setRestore(null) }}>重新开始</button>
        </div>
      )}

      {/* 编辑器 */}
      <div className="mt-3.5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-3 py-2 text-[12px] text-muted-foreground">
          <button className={`rounded px-2 py-1 ${tab === 'write' ? 'bg-secondary text-foreground' : ''}`} onClick={() => setTab('write')}>编辑</button>
          <button className={`rounded px-2 py-1 ${tab === 'preview' ? 'bg-secondary text-foreground' : ''}`} onClick={() => setTab('preview')}>预览</button>
          {tab === 'write' && <span className="mx-1 h-4 w-px bg-border" />}
          {tab === 'write' && (
            <span className="flex items-center gap-1">
              <button className="desk-tb" title="加粗" onClick={() => applyFormat('**')}><b>B</b></button>
              <button className="desk-tb" title="二级标题" onClick={() => insertBlock('## 小标题')}>H2</button>
              <button className="desk-tb" title="引用" onClick={() => insertBlock('> 引用')}>❝</button>
              <button className="desk-tb" title="列表" onClick={() => insertBlock('- 列表项')}>•</button>
              <button className="desk-tb" title="链接" onClick={() => applyFormat('[', '](https://)', '链接文字')}>🔗</button>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono"><FileText className="h-3.5 w-3.5" />{wordCount} 字</span>
        </div>
        <div className="px-5 py-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="给文章起个标题…" className="w-full bg-transparent text-[1.15rem] font-semibold outline-none placeholder:text-muted-foreground/50" />
          {tab === 'write' ? (
            <textarea ref={taRef} value={body} onChange={e => setBody(e.target.value)} placeholder="用你自己的话写下去——AI 不替你成句。支持 Markdown。" className="mt-3 min-h-[300px] w-full resize-y bg-transparent font-mono text-[13.5px] leading-[1.9] text-foreground/90 outline-none placeholder:text-muted-foreground/50" />
          ) : (
            <div className="cre-prose mt-3 min-h-[300px]" dangerouslySetInnerHTML={{ __html: renderArticleBody(body) || '<p style="color:var(--muted-foreground)">（空）</p>' }} />
          )}
        </div>
      </div>

      {/* 我的素材 */}
      {materials.length > 0 && (
        <div className="mt-3.5 rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Bookmark className="h-3.5 w-3.5" />我的素材 · 来自已闭环笔记<span className="ml-auto text-[11px]">点击引用，不替你成句</span></div>
          <div className="mt-2.5 space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-background px-3 py-2 text-[12.5px]">
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">{m.kind}</span>
                <span className="min-w-0 flex-1 leading-relaxed text-foreground/80">{m.text}</span>
                <button className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent" onClick={() => insertBlock(`> ${m.text}\n> \n> — 引自 · ${m.kind} · ${m.source}`)}>引用</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 陪练 */}
      <div className="mt-3.5 rounded-xl border border-border bg-card px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />AI 陪练 · 只挑刺，不代笔</div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SPAR_MODES.map(mode => (
            <button key={mode} disabled={!!sparLoading} onClick={() => runSpar(mode)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-[12.5px] transition-colors hover:bg-accent disabled:opacity-50">
              {sparLoading === mode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{SPAR_LABEL[mode]}
            </button>
          ))}
        </div>
        {sparErr && <p className="mt-2.5 text-[12px] text-[hsl(var(--destructive))]">{sparErr}</p>}
        {spar && (
          <div className="mt-2.5 rounded-lg border border-border/70 bg-background px-3.5 py-3">
            <div className="text-[11px] text-muted-foreground">陪练 · {SPAR_LABEL[spar.mode]}（仅供你参考，不会写进正文）</div>
            <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">{spar.text}</div>
          </div>
        )}
      </div>

      {/* 底栏：发布 / 再改 */}
      <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-[12px] text-muted-foreground">草稿自动存于本地 · {wordCount} 字{published ? ' · 已成文（再发为覆盖更新）' : ''}</span>
        <Button variant="default" size="sm" className="ml-auto" disabled={!title.trim() || !body.trim()} onClick={publish}>
          <Check className="mr-1.5 h-4 w-4" />{published ? '更新并重新成文' : '发布并闭环'}
        </Button>
      </div>
    </>
  )
}

const DESK_CSS = `
.desk-tb{min-width:26px;height:26px;padding:0 6px;border:1px solid hsl(var(--border));border-radius:5px;font-size:12px;line-height:1;display:inline-flex;align-items:center;justify-content:center}
.desk-tb:hover{background:hsl(var(--accent))}
.cre-prose h2{font-size:1.15rem;font-weight:600;margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid hsl(var(--border))}
.cre-prose h3{font-size:1rem;font-weight:600;margin:14px 0 8px}
.cre-prose p{font-size:14px;line-height:1.85;color:hsl(var(--foreground)/0.88);margin:0 0 12px}
.cre-prose strong{font-weight:600}
.cre-prose ul,.cre-prose ol{margin:10px 0;padding-left:20px}
.cre-prose li{font-size:14px;line-height:1.8;margin-bottom:5px}
.cre-prose blockquote{margin:14px 0;padding:12px 16px;background:hsl(var(--secondary));border-left:3px solid hsl(var(--foreground));border-radius:6px}
.cre-prose blockquote p{font-family:var(--font-serif);margin:0}
.cre-prose code{font-family:var(--font-mono);font-size:12.5px;padding:1px 5px;background:hsl(var(--secondary));border-radius:3px}
.cre-prose a{color:hsl(var(--primary));text-decoration:underline}
`
