import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { FeynmanApp } from './feynman/FeynmanApp'
import { LetterHome } from './pages/LetterHome'
import { Dashboard } from './pages/Dashboard'
import { ArticlePage } from './pages/ArticlePage'
import { RadarPage } from './pages/RadarPage'
import { PlanPage } from './pages/PlanPage'
import { EditorPage } from './pages/EditorPage'
import { GraphPage } from './pages/GraphPage'
import { CognitionProvider, useCognition } from './lib/cognition'
import type { NavPage } from './pages/SiteHeader'
import './index.css'

type AppPage = 'letter' | 'dashboard' | 'graph' | 'article' | 'feynman' | 'radar' | 'plan' | 'editor'

/** 跨刷新保留"当前认知点"，使 learning → published 回写不因整页重载而断链 */
const ACTIVE_CONCEPT_KEY = 'aicc-active-concept'

/* ── URL ↔ AppPage 映射 ── */
function pathToState(pathname: string): { page: AppPage; slug: string } {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/' || p === '/philosophy') return { page: 'letter', slug: '' }
  if (p === '/dashboard') return { page: 'dashboard', slug: '' }
  if (p === '/graph') return { page: 'graph', slug: '' }
  if (p === '/feynman') return { page: 'feynman', slug: '' }
  if (p === '/radar') return { page: 'radar', slug: '' }
  if (p === '/plan') return { page: 'plan', slug: '' }
  if (p === '/editor') return { page: 'editor', slug: '' }
  if (p.startsWith('/article/')) {
    const slug = p.slice('/article/'.length)
    return { page: 'article', slug: slug || 'flash-attention' }
  }
  return { page: 'letter', slug: '' }
}

function stateToPath(page: AppPage, slug: string): string {
  if (page === 'letter') return '/'
  if (page === 'dashboard') return '/dashboard'
  if (page === 'graph') return '/graph'
  if (page === 'feynman') return '/feynman'
  if (page === 'radar') return '/radar'
  if (page === 'plan') return '/plan'
  if (page === 'editor') return '/editor'
  if (page === 'article') return '/article/' + slug
  return '/'
}

function App() {
  const { setState, map } = useCognition()
  const [page, setPage] = useState<AppPage>(() => pathToState(location.pathname).page)
  const [articleSlug, setArticleSlug] = useState<string>(() => pathToState(location.pathname).slug || 'flash-attention')
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
      const { page: p, slug } = pathToState(location.pathname)
      setPage(p)
      if (slug) setArticleSlug(slug)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigateTo = useCallback((newPage: AppPage, slug?: string) => {
    const s = slug || articleSlug
    if (newPage === 'article' && slug) setArticleSlug(slug)
    setPage(newPage)
    const path = stateToPath(newPage, newPage === 'article' ? s : '')
    if (location.pathname !== path) {
      history.pushState(null, '', path)
    }
  }, [articleSlug])

  const handleNavigate = useCallback((nav: NavPage) => {
    if (nav === 'letter') navigateTo('letter')
    else if (nav === 'dashboard') navigateTo('dashboard')
    else if (nav === 'graph') navigateTo('graph')
    else if (nav === 'radar') navigateTo('radar')
    else if (nav === 'plan') navigateTo('plan')
    else if (nav === 'editor') {
      // 顶部导航的「编辑器」是通用入口（写任意文章），不绑定认知点：清空 conceptId，
      // 避免误把无关文章发布回写到上一个学习中的认知点。
      setActiveConcept('')
      navigateTo('editor')
    }
  }, [navigateTo, setActiveConcept])

  const handleOpenArticle = useCallback((slug: string) => {
    navigateTo('article', slug)
  }, [navigateTo])

  // in-plan → learning：记住认知点、置为「学习中」，再进费曼工作台
  const handleOpenFeynman = useCallback((id: string) => {
    if (id) {
      setActiveConcept(id)
      setState(id, 'learning')
    }
    navigateTo('feynman')
  }, [navigateTo, setState, setActiveConcept])

  // 费曼学习完成 → 去成稿编辑器（携带认知点 id，发布时回写 published）
  const handleGoToEditor = useCallback((id?: string) => {
    if (id) setActiveConcept(id)
    navigateTo('editor')
  }, [navigateTo, setActiveConcept])

  if (page === 'letter') {
    return <LetterHome onEnter={() => navigateTo('dashboard')} onNavigate={handleNavigate} />
  }
  if (page === 'dashboard') {
    return (
      <Dashboard
        onNavigate={handleNavigate}
        onOpenArticle={handleOpenArticle}
      />
    )
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
  if (page === 'radar') {
    return <RadarPage onNavigate={handleNavigate} />
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
        onBack={() => navigateTo('dashboard')}
        onPublished={(slug) => {
          // 发布完成：清空 conceptId，避免下一次进编辑器误写到这个已成稿的认知点
          setActiveConcept('')
          navigateTo('article', slug)
        }}
      />
    )
  }
  // 费曼学习工作台：携带认知点上下文，完成后可一键去成稿
  return (
    <FeynmanApp
      conceptId={activeConceptId}
      initialQuestion={activeConceptId ? (map[activeConceptId]?.title || '') : ''}
      onGoToEditor={handleGoToEditor}
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
