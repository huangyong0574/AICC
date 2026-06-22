import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { FeynmanApp } from './feynman/FeynmanApp'
import { LetterHome } from './pages/LetterHome'
import { ArticlePage } from './pages/ArticlePage'
import { RadarPage } from './pages/RadarPage'
import { RadarArchivePage } from './pages/RadarArchivePage'
import { PlanPage } from './pages/PlanPage'
import { EditorPage } from './pages/EditorPage'
import { CreationPage } from './pages/CreationPage'
import { GraphPage } from './pages/GraphPage'
import { CognitionProvider, useCognition } from './lib/cognition'
import { probeGateway } from './lib/gateway'
import { initVault } from './lib/vault'
import { hydrateFromVault } from './lib/vaultSync'
import type { NavPage } from './pages/SiteHeader'
import './index.css'

// 启动：①探测 Gateway（key 是否服务端就绪）②探测 vault ③从 vault 重建 localStorage 缓存（vault 权威）
void (async () => {
  await probeGateway()
  await initVault()
  await hydrateFromVault()
})()

type AppPage = 'letter' | 'graph' | 'article' | 'feynman' | 'radar-archive' | 'radar' | 'plan' | 'editor' | 'creation'

/** 跨刷新保留"当前认知点"，使 learning → published 回写不因整页重载而断链 */
const ACTIVE_CONCEPT_KEY = 'aicc-active-concept'

/* ── URL ↔ AppPage 映射 ──
 * 第二参数 param：article 时为 slug，radar 时为 weekId。 */
function pathToState(pathname: string): { page: AppPage; slug: string; week: string } {
  const p = pathname.replace(/\/+$/, '') || '/'
  const none = { slug: '', week: '' }
  if (p === '/' || p === '/philosophy') return { page: 'letter', ...none }
  // 认知工作台已下线：旧 /dashboard 链接重定向到雷达归档
  if (p === '/dashboard') return { page: 'radar-archive', ...none }
  if (p === '/graph') return { page: 'graph', ...none }
  if (p === '/feynman') return { page: 'feynman', ...none }
  if (p === '/radar') return { page: 'radar-archive', ...none }
  if (p.startsWith('/radar/')) return { page: 'radar', slug: '', week: p.slice('/radar/'.length) }
  if (p === '/plan') return { page: 'plan', ...none }
  if (p === '/editor') return { page: 'editor', ...none }
  if (p === '/creation') return { page: 'creation', ...none }
  if (p.startsWith('/article/')) {
    const slug = p.slice('/article/'.length)
    return { page: 'article', slug: slug || 'flash-attention', week: '' }
  }
  return { page: 'letter', ...none }
}

function stateToPath(page: AppPage, slug: string, week: string): string {
  if (page === 'letter') return '/'
  if (page === 'graph') return '/graph'
  if (page === 'feynman') return '/feynman'
  if (page === 'radar-archive') return '/radar'
  if (page === 'radar') return week ? '/radar/' + week : '/radar'
  if (page === 'plan') return '/plan'
  if (page === 'editor') return '/editor'
  if (page === 'creation') return '/creation'
  if (page === 'article') return '/article/' + slug
  return '/'
}

const BRAND = 'AICC'
// 路由 → 浏览器标签标题（letter 用品牌全称，其余拼 "<页名> · AICC"）
const PAGE_TITLES: Record<AppPage, string> = {
  letter: 'AICC · AI Cognition Connector',
  'radar-archive': '认知雷达',
  radar: '认知雷达',
  plan: '深度计划',
  feynman: '费曼工作台',
  editor: '成稿编辑器',
  creation: '创作',
  graph: '认知图谱',
  article: '文章',
}

function App() {
  const { setState, setProgress, map, upsert } = useCognition()
  const [page, setPage] = useState<AppPage>(() => pathToState(location.pathname).page)
  const [articleSlug, setArticleSlug] = useState<string>(() => pathToState(location.pathname).slug || 'flash-attention')
  // 当前查看的雷达周（'' = 最新周）。深链 /radar/<week> 时从 URL 初始化。
  const [radarWeek, setRadarWeek] = useState<string>(() => pathToState(location.pathname).week)
  // 当前正在学习/成稿的认知点 id（驱动 in-plan → learning → published 流转）
  // 持久化到 sessionStorage：刷新 /editor、/feynman 或直达 URL 时仍能拿到 conceptId 完成 published 回写。
  const [activeConceptId, setActiveConceptId] = useState<string>(
    () => (typeof window !== 'undefined' && sessionStorage.getItem(ACTIVE_CONCEPT_KEY)) || '',
  )
  const setActiveConcept = useCallback((id: string) => {
    setActiveConceptId(id)
    if (typeof window === 'undefined') return
    if (id) sessionStorage.setItem(ACTIVE_CONCEPT_KEY, id)
    else sessionStorage.removeItem(ACTIVE_CONCEPT_KEY)
  }, [])

  // 监听浏览器前进/后退
  useEffect(() => {
    const onPopState = () => {
      const { page: p, slug, week } = pathToState(location.pathname)
      setPage(p)
      if (slug) setArticleSlug(slug)
      setRadarWeek(week)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // 按路由设置浏览器标签标题（书签 / 多标签页可辨识；深链与前进后退同样生效）
  // 注：article 标题由 ArticlePage 用真实文章标题设置，这里对其早退、让其接管（避免双写/闪烁）
  useEffect(() => {
    if (page === 'article') return
    const base = PAGE_TITLES[page]
    let title = page === 'letter' ? base : `${base} · ${BRAND}`
    if (page === 'radar' && radarWeek) title = `${base} · ${radarWeek} · ${BRAND}`
    document.title = title
  }, [page, radarWeek])

  // param：article 时为 slug，radar 时为 weekId
  const navigateTo = useCallback((newPage: AppPage, param?: string) => {
    if (newPage === 'article' && param) setArticleSlug(param)
    if (newPage === 'radar') setRadarWeek(param || '')
    setPage(newPage)
    const path = stateToPath(
      newPage,
      newPage === 'article' ? (param || articleSlug) : '',
      newPage === 'radar' ? (param || '') : '',
    )
    if (location.pathname !== path) {
      history.pushState(null, '', path)
    }
  }, [articleSlug])

  const handleNavigate = useCallback((nav: NavPage) => {
    if (nav === 'letter') navigateTo('letter')
    else if (nav === 'graph') navigateTo('graph')
    else if (nav === 'radar') navigateTo('radar-archive')
    else if (nav === 'plan') navigateTo('plan')
    else if (nav === 'editor') {
      // 「编辑器」现为内部成稿入口（不在导航暴露）：清空 conceptId，避免误回写
      setActiveConcept('')
      navigateTo('editor')
    }
    else if (nav === 'creation') navigateTo('creation')
  }, [navigateTo, setActiveConcept])

  const handleOpenArticle = useCallback((slug: string) => {
    navigateTo('article', slug)
  }, [navigateTo])

  // 归档页 → 进入某一周切片
  const handleOpenWeek = useCallback((weekId: string) => {
    navigateTo('radar', weekId)
  }, [navigateTo])

  // in-plan → learning：记住认知点、置为「学习中」，再进费曼工作台
  const handleOpenFeynman = useCallback((id: string) => {
    if (id) {
      setActiveConcept(id)
      // 复习已成稿（published）不降级回 learning；其余（in-plan / learning）进入即标记学习中
      if (map[id]?.state !== 'published') setState(id, 'learning')
    }
    navigateTo('feynman')
  }, [navigateTo, setState, setActiveConcept, map])

  // 费曼学习完成 → 去成稿编辑器（携带认知点 id，发布时回写 published）
  const handleGoToEditor = useCallback((id?: string) => {
    if (id) setActiveConcept(id)
    navigateTo('editor')
  }, [navigateTo, setActiveConcept])

  // 费曼内化完成 → 把图谱关系（concept→parent）回写到平台认知状态，供认知图谱渲染关系边
  const handleInternalized = useCallback(
    (id: string, delta: { parent: string; relation: string; tags?: string[]; oneLine?: string }) => {
      if (!id || !delta?.parent) return
      const existing = map[id]
      upsert(id, {
        title: existing?.title || id,
        relation: { parent: delta.parent, text: delta.relation, tags: delta.tags, oneLine: delta.oneLine },
      })
    },
    [upsert, map],
  )

  if (page === 'letter') {
    return <LetterHome onEnter={() => navigateTo('radar-archive')} onNavigate={handleNavigate} />
  }
  if (page === 'graph') {
    return <GraphPage onNavigate={handleNavigate} />
  }
  if (page === 'article') {
    return (
      <ArticlePage
        slug={articleSlug}
        onNavigate={handleNavigate}
      />
    )
  }
  if (page === 'radar-archive') {
    return <RadarArchivePage onNavigate={handleNavigate} onOpenWeek={handleOpenWeek} />
  }
  if (page === 'radar') {
    return <RadarPage weekId={radarWeek} onNavigate={handleNavigate} onOpenFeynman={handleOpenFeynman} />
  }
  if (page === 'plan') {
    return (
      <PlanPage
        onNavigate={handleNavigate}
        onOpenArticle={handleOpenArticle}
        onOpenFeynman={handleOpenFeynman}
      />
    )
  }
  if (page === 'editor') {
    return (
      <EditorPage
        conceptId={activeConceptId}
        onBack={() => navigateTo('radar-archive')}
        onPublished={(slug) => {
          // 发布完成：清空 conceptId，避免下一次进编辑器误写到这个已成稿的认知点
          setActiveConcept('')
          navigateTo('article', slug)
        }}
      />
    )
  }
  if (page === 'creation') {
    return <CreationPage onNavigate={handleNavigate} />
  }
  // 费曼学习工作台：携带认知点上下文，完成后可一键去成稿
  return (
    <FeynmanApp
      conceptId={activeConceptId}
      initialQuestion={activeConceptId ? (map[activeConceptId]?.title || '') : ''}
      onGoToEditor={handleGoToEditor}
      onNavigate={handleNavigate}
      onInternalized={handleInternalized}
      onProgress={setProgress}
    />
  )
}

// 注：不使用 React.StrictMode。
// 原因：开发环境下 StrictMode 会让 useEffect 双跑，导致每道问题调用两次联网 LLM，
// 浪费 token，并触发 AbortController 竞态（"signal is aborted without reason"）。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <CognitionProvider>
    <App />
  </CognitionProvider>,
)

// 小技巧：避免 React 导入未使用的 lint 告警
void React
