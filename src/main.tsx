import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { FeynmanApp } from './feynman/FeynmanApp'
import { LetterHome } from './pages/LetterHome'
import { Dashboard } from './pages/Dashboard'
import { ArticlePage } from './pages/ArticlePage'
import { RadarPage } from './pages/RadarPage'
import type { NavPage } from './pages/SiteHeader'
import './index.css'

type AppPage = 'letter' | 'dashboard' | 'graph' | 'article' | 'feynman' | 'radar'

/* ── URL ↔ AppPage 映射 ── */
function pathToState(pathname: string): { page: AppPage; slug: string } {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/' || p === '/philosophy') return { page: 'letter', slug: '' }
  if (p === '/dashboard') return { page: 'dashboard', slug: '' }
  if (p === '/graph') return { page: 'graph', slug: '' }
  if (p === '/feynman') return { page: 'feynman', slug: '' }
  if (p === '/radar') return { page: 'radar', slug: '' }
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
  if (page === 'article') return '/article/' + slug
  return '/'
}

function App() {
  const [page, setPage] = useState<AppPage>(() => pathToState(location.pathname).page)
  const [articleSlug, setArticleSlug] = useState<string>(() => pathToState(location.pathname).slug || 'flash-attention')

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
  }, [navigateTo])

  const handleOpenArticle = useCallback((slug: string) => {
    navigateTo('article', slug)
  }, [navigateTo])

  if (page === 'letter') {
    return <LetterHome onEnter={() => navigateTo('dashboard')} onNavigate={handleNavigate} />
  }
  if (page === 'dashboard' || page === 'graph') {
    return (
      <Dashboard
        activePage={page}
        onNavigate={handleNavigate}
        onOpenArticle={handleOpenArticle}
      />
    )
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
  return <FeynmanApp />
}

// 注：不使用 React.StrictMode。
// 原因：开发环境下 StrictMode 会让 useEffect 双跑，导致每道问题调用两次联网 LLM，
// 浪费 token，并触发 AbortController 竞态（"signal is aborted without reason"）。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)

// 小技巧：避免 React 导入未使用的 lint 告警
void React
