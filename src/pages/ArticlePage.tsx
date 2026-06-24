import { useState, useEffect, useRef } from "react"
import { SiteHeader } from "./SiteHeader"
import type { NavPage } from "./SiteHeader"
import { FileX, Calendar, Clock, FileText } from "lucide-react"
import hljs from "highlight.js/lib/core"
import python from "highlight.js/lib/languages/python"
import {
  parseFrontmatter,
  renderArticlePage,
  countWords,
  fmtDate,
  type Frontmatter,
  type TocHeading,
} from "../lib/markdown"
import { fetchArticle } from "../lib/vault"
import { cleanArticleBody } from "../lib/publishArticle"

hljs.registerLanguage("python", python)

interface ArticlePageProps {
  slug: string
  onNavigate: (page: NavPage) => void
  /** 编辑本文（仅本地发布的文章可编辑）→ 打开编辑器载入此 slug */
  onEdit?: (slug: string) => void
}

interface ArticleData {
  meta: Frontmatter
  html: string
  headings: TocHeading[]
  words: number
}

const DRAFT_PREFIX = "aicc-article-md:"

export function ArticlePage({ slug, onNavigate, onEdit }: ArticlePageProps) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [data, setData] = useState<ArticleData | null>(null)
  const [editable, setEditable] = useState(false)   // 来自本地草稿（app 发布）= 可编辑
  const [activeId, setActiveId] = useState("")
  const [progress, setProgress] = useState(0)
  const bodyRef = useRef<HTMLElement | null>(null)

  // ── 加载文章 ──
  useEffect(() => {
    if (!slug) {
      setState("error")
      setErrorMsg("未指定文章 slug")
      return
    }
    setState("loading")
    setEditable(false)
    let cancelled = false

    const build = (raw: string) => {
      // 本地/静态来源含 frontmatter：保留 frontmatter 给 parseFrontmatter，仅剥机器「## 融合」块（含 [[ 才剥，避免误伤同名小节）
      const stripped = /##\s*融合\s*\n[\s\S]*\[\[/.test(raw) ? raw.replace(/\n*##\s*融合\s*\n[\s\S]*$/, "").trimEnd() : raw
      const { meta, content } = parseFrontmatter(stripped)
      const { html, headings } = renderArticlePage(content)
      if (cancelled) return
      setData({ meta, html, headings, words: countWords(content) })
      setState("ok")
      document.title = `${meta.title || slug} — AICC`
    }

    ;(async () => {
      // A 档双向同步：始终先试 vault 读最新（Obsidian 改完→网页打开即见）。
      // fetchArticle 自带探测：无 Gateway / vault 无此文 → 返回 null 自动回退；不依赖竞态的 vaultEnabled()。
      const a = await fetchArticle(slug)
      if (a && !cancelled) {
        const content = cleanArticleBody(a.body)
        const { html, headings } = renderArticlePage(content)
        setEditable(true)
        setData({
          meta: { title: a.title, subtitle: a.subtitle, category: a.category, date: a.date, status: a.status, tags: a.tags } as Frontmatter,
          html, headings, words: countWords(content),
        })
        setState("ok")
        document.title = `${a.title || slug} — AICC`
        return
      }

      // 回退 1) 本地草稿（编辑器发布的）
      const draft = typeof window !== "undefined" ? localStorage.getItem(DRAFT_PREFIX + slug) : null
      if (draft) { setEditable(true); build(draft); return }

      // 回退 2) 公共 content 目录的 markdown（ECS/纯静态）
      try {
        const r = await fetch(`/content/${slug}.md`)
        if (!r.ok) throw new Error(`找不到文章 content/${slug}.md（HTTP ${r.status}）`)
        const raw = await r.text()
        if (raw.includes('<div id="root">') && raw.includes("/src/main.tsx")) {
          throw new Error(`文章 "${slug}" 尚未发布。可在编辑器粘贴 Markdown 后发布，或在 public/content/ 放入 ${slug}.md。`)
        }
        build(raw)
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setState("error")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  // ── 挂载后：语法高亮 + 复制按钮 ──
  useEffect(() => {
    if (state !== "ok" || !bodyRef.current) return
    const container = bodyRef.current
    container.querySelectorAll<HTMLElement>("pre code").forEach((el) => {
      try {
        hljs.highlightElement(el)
      } catch {
        /* 未注册语言时跳过 */
      }
    })
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-copy]") as HTMLElement | null
      if (!btn) return
      const code = btn.closest(".code-block")?.querySelector("code")?.textContent || ""
      navigator.clipboard?.writeText(code).then(() => {
        const prev = btn.textContent
        btn.textContent = "DONE"
        setTimeout(() => {
          btn.textContent = prev || "COPY"
        }, 2000)
      })
    }
    container.addEventListener("click", onClick)
    return () => container.removeEventListener("click", onClick)
  }, [state, data])

  // ── 滚动监听：TOC 高亮 + 阅读进度 ──
  useEffect(() => {
    if (state !== "ok") return
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".article-page .section-block[id]"),
    )
    let io: IntersectionObserver | null = null
    if (sections.length) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) setActiveId((en.target as HTMLElement).id)
          })
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
      )
      sections.forEach((s) => io!.observe(s))
    }
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => {
      io?.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [state, data])

  const meta = data?.meta || {}
  const title = meta.title || slug.replace(/-/g, " ")
  const subtitle = meta.subtitle || meta.description || ""
  const date = fmtDate(meta.date)
  const category = meta.category || ""
  const tags = Array.isArray(meta.tags) ? meta.tags : []
  const status = meta.status || "草稿"
  const words = data?.words || 0
  const readtime = meta.readtime || `${Math.ceil(words / 300)} min`
  const headings = data?.headings || []

  return (
    <div className="article-page min-h-screen bg-background text-foreground">
      <style>{ARTICLE_CSS}</style>
      <SiteHeader activePage="article" onNavigate={onNavigate} />

      <main>
        <div className="container">
          {state === "loading" && (
            <div className="loading-state">
              <div className="spinner" />
              <p>正在加载文章…</p>
            </div>
          )}

          {state === "error" && (
            <div className="error-state">
              <div className="icon">
                <FileX style={{ width: 32, height: 32 }} />
              </div>
              <h2>加载失败</h2>
              <p>{errorMsg}</p>
            </div>
          )}

          {state === "ok" && data && (
            <>
              <nav className="breadcrumb" aria-label="面包屑">
                <button onClick={() => onNavigate("radar")}>AICC</button>
                <span className="sep">/</span>
                {category && (
                  <>
                    <button onClick={() => onNavigate("radar")}>{category}</button>
                    <span className="sep">/</span>
                  </>
                )}
                <span className="current">{title}</span>
              </nav>

              <header className="article-hero">
                <div className="badge-row">
                  {category && <span className="badge badge-secondary">{category}</span>}
                  <span className="badge">
                    <span className="dot" />
                    {status}
                  </span>
                  {editable && onEdit && (
                    <button className="edit-btn" onClick={() => onEdit(slug)}>✎ 编辑文章</button>
                  )}
                </div>
                <h1>{title}</h1>
                {subtitle && <p className="subtitle">{subtitle}</p>}
                <div className="meta-bar">
                  {date && (
                    <span className="item">
                      <Calendar />
                      <strong>{date}</strong>
                    </span>
                  )}
                  <span className="item">
                    <Clock />
                    <strong>{readtime}</strong> 阅读
                  </span>
                  <span className="item">
                    <FileText />
                    <strong>{words.toLocaleString()}</strong> 字
                  </span>
                </div>
              </header>

              <div className="article-layout">
                {headings.length > 1 ? (
                  <aside className="article-toc">
                    <div className="toc-label">目录</div>
                    <ol>
                      {headings.map((h, i) => (
                        <li key={h.id}>
                          <a href={`#${h.id}`} className={activeId === h.id ? "active" : ""}>
                            <span className="toc-num">{String(i + 1).padStart(2, "0")}</span>
                            <span>{h.text}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                    <div className="toc-progress">
                      <div className="toc-progress-label">
                        <span>READING</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="toc-progress-bar">
                        <div className="fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </aside>
                ) : (
                  <div />
                )}

                <article
                  className="article-body"
                  ref={bodyRef}
                  dangerouslySetInnerHTML={{
                    __html:
                      data.html +
                      (tags.length
                        ? `<div class="article-tags">${tags
                            .map((t) => `<span class="tag">#${t}</span>`)
                            .join("")}</div>`
                        : ""),
                  }}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span
              className="brand-mark"
              style={{
                width: 22,
                height: 22,
                fontSize: 11,
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              A
            </span>
            <span>AICC · AI Cognition Connector</span>
          </div>
          <div className="footer-meta">v1.0</div>
        </div>
      </footer>
    </div>
  )
}

/* 端口自 aicc-html-bundle/article.html，作用域收敛到 .article-page */
const ARTICLE_CSS = `
.article-page .container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.article-page main{padding:28px 0 96px}
.article-page .breadcrumb{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:12px;color:hsl(var(--muted-foreground));margin-bottom:32px}
.article-page .breadcrumb button{background:none;border:none;cursor:pointer;font:inherit;color:hsl(var(--muted-foreground));transition:color 0.15s ease}
.article-page .breadcrumb button:hover{color:hsl(var(--foreground))}
.article-page .breadcrumb .sep{opacity:0.4}
.article-page .breadcrumb .current{color:hsl(var(--foreground))}
.article-page .edit-btn{margin-left:8px;cursor:pointer;font-family:var(--font-mono);font-size:12px;color:hsl(var(--frontier));background:none;border:1px solid hsl(var(--frontier)/0.4);border-radius:9999px;padding:3px 12px;transition:background 0.15s ease}
.article-page .edit-btn:hover{background:hsl(var(--frontier)/0.1)}

.article-page .article-hero{max-width:760px;margin:0 auto 56px;text-align:center}
.article-page .article-hero .badge-row{display:inline-flex;align-items:center;gap:8px;margin-bottom:24px}
.article-page .badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;font-family:var(--font-mono);font-size:11px;font-weight:500;letter-spacing:0.02em;border-radius:9999px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--foreground));line-height:1.4}
.article-page .badge.badge-secondary{background:hsl(var(--secondary));border-color:transparent}
.article-page .badge .dot{width:6px;height:6px;border-radius:9999px;background:hsl(142 76% 36%)}
.article-page .article-hero h1{font-size:clamp(1.875rem,4vw,2.625rem);font-weight:600;letter-spacing:-0.025em;line-height:1.2;margin-bottom:16px}
.article-page .article-hero .subtitle{font-size:1.0625rem;color:hsl(var(--muted-foreground));max-width:580px;margin:0 auto;line-height:1.7}
.article-page .meta-bar{display:flex;align-items:center;justify-content:center;gap:0;margin-top:32px;border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden;background:hsl(var(--card));flex-wrap:wrap}
.article-page .meta-bar .item{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;font-family:var(--font-mono);font-size:12px;color:hsl(var(--muted-foreground));border-right:1px solid hsl(var(--border))}
.article-page .meta-bar .item:last-child{border-right:none}
.article-page .meta-bar .item strong{color:hsl(var(--foreground));font-weight:600}
.article-page .meta-bar .item svg{width:13px;height:13px}

.article-page .article-layout{display:grid;grid-template-columns:220px 1fr;gap:72px;align-items:start}
@media (max-width:1024px){.article-page .article-layout{grid-template-columns:1fr;gap:32px}.article-page .article-toc{display:none}}
.article-page .article-toc{position:sticky;top:96px}
.article-page .toc-label{font-family:var(--font-mono);font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid hsl(var(--border))}
.article-page .article-toc ol{list-style:none;padding:0}
.article-page .article-toc li{margin:1px 0}
.article-page .article-toc a{display:grid;grid-template-columns:24px 1fr;gap:8px;align-items:baseline;padding:7px 10px;font-size:13px;color:hsl(var(--muted-foreground));border-radius:calc(var(--radius) - 2px);transition:all 0.15s ease;border-left:2px solid transparent;margin-left:-2px}
.article-page .article-toc a:hover{color:hsl(var(--foreground));background:hsl(var(--accent))}
.article-page .article-toc a.active{color:hsl(var(--foreground));border-left-color:hsl(var(--primary));font-weight:500}
.article-page .article-toc a .toc-num{font-family:var(--font-mono);font-size:10px;color:hsl(var(--muted-foreground))}
.article-page .article-toc a.active .toc-num{color:hsl(var(--foreground))}
.article-page .toc-progress{margin-top:20px;padding-top:16px;border-top:1px solid hsl(var(--border))}
.article-page .toc-progress-label{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:8px;display:flex;justify-content:space-between}
.article-page .toc-progress-bar{height:4px;background:hsl(var(--secondary));border-radius:9999px;overflow:hidden}
.article-page .toc-progress-bar .fill{height:100%;background:hsl(var(--primary));transition:width 0.2s ease}

.article-page .article-body{max-width:720px;min-width:0}
.article-page .section-block{margin-bottom:64px;scroll-margin-top:80px}
.article-page .section-header{margin-bottom:24px}
.article-page .section-meta{display:inline-flex;align-items:center;gap:10px;margin-bottom:10px}
.article-page .step-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:calc(var(--radius) - 2px);font-family:var(--font-mono);font-size:12px;font-weight:600}
.article-page .step-kicker{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground))}
.article-page .section-block h2{font-size:clamp(1.375rem,2.4vw,1.75rem);font-weight:600;letter-spacing:-0.02em;line-height:1.3;margin-bottom:6px}
.article-page .article-body h3{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em;line-height:1.4;margin:32px 0 14px;padding-top:20px;border-top:1px solid hsl(var(--border))}
.article-page .article-body h4{font-size:1rem;font-weight:600;margin:20px 0 8px}
.article-page .article-body p{font-size:15.5px;line-height:1.8;color:hsl(var(--foreground)/0.88);margin-bottom:16px}
.article-page .article-body strong{font-weight:600;color:hsl(var(--foreground))}
.article-page .article-body em{font-style:italic}
.article-page .article-body a{color:hsl(var(--foreground));text-decoration:underline;text-decoration-color:hsl(var(--border));text-underline-offset:3px;transition:text-decoration-color 0.15s ease}
.article-page .article-body a:hover{text-decoration-color:hsl(var(--foreground))}
.article-page .article-body :not(pre) > code{font-family:var(--font-mono);font-size:13.5px;padding:2px 7px;background:hsl(var(--secondary));color:hsl(var(--secondary-foreground));border-radius:4px;border:1px solid hsl(var(--border))}
.article-page .code-block{margin:24px 0;border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden;background:hsl(var(--card))}
.article-page .code-head{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:hsl(var(--muted));border-bottom:1px solid hsl(var(--border));font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));letter-spacing:0.06em}
.article-page .code-head .lang{display:inline-flex;align-items:center;gap:6px;text-transform:uppercase}
.article-page .code-head .lang svg{width:12px;height:12px}
.article-page .code-head .copy-btn{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:10px;color:hsl(var(--muted-foreground));background:none;border:1px solid hsl(var(--border));padding:2px 8px;border-radius:4px;cursor:pointer;transition:all 0.15s ease}
.article-page .code-head .copy-btn:hover{background:hsl(var(--background));color:hsl(var(--foreground))}
.article-page .article-body pre{margin:0;padding:16px 18px;font-family:var(--font-mono);font-size:13px;line-height:1.65;color:hsl(var(--foreground)/0.92);background:hsl(var(--card));overflow-x:auto;border:none;border-radius:0}
.article-page .article-body pre code{padding:0;background:none;font-size:inherit;border-radius:0;border:none}
.article-page .article-body ul,.article-page .article-body ol{padding-left:0;list-style:none;margin:16px 0}
.article-page .article-body ul li,.article-page .article-body ol li{padding-left:22px;position:relative;margin-bottom:10px;font-size:15.5px;line-height:1.8;color:hsl(var(--foreground)/0.88)}
.article-page .article-body ul li::before{content:'';position:absolute;left:4px;top:14px;width:5px;height:5px;background:hsl(var(--foreground));border-radius:9999px}
.article-page .article-body ol{counter-reset:list-counter}
.article-page .article-body ol li{counter-increment:list-counter}
.article-page .article-body ol li::before{content:counter(list-counter);position:absolute;left:0;top:2px;font-family:var(--font-mono);font-size:12px;font-weight:600;color:hsl(var(--muted-foreground));width:18px;text-align:center}
.article-page .article-body blockquote{margin:24px 0;padding:24px 28px;background:hsl(var(--secondary));border-left:3px solid hsl(var(--foreground));border-radius:var(--radius)}
.article-page .article-body blockquote p{font-family:var(--font-serif);font-size:16.5px;line-height:1.85;color:hsl(var(--foreground));margin-bottom:10px}
.article-page .article-body blockquote p:last-child{margin-bottom:0}
.article-page .callout{margin:24px 0;padding:24px 28px;border-radius:var(--radius);border:1px solid hsl(var(--border));position:relative;overflow:hidden}
.article-page .callout-title{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:12px;font-weight:600}
.article-page .callout-title svg{width:14px;height:14px}
.article-page .callout-note{background:hsl(var(--secondary))}
.article-page .callout-warning{background:hsl(48 96% 96%);border-color:hsl(48 80% 70%)}
.dark .article-page .callout-warning{background:hsl(48 30% 10%);border-color:hsl(48 40% 25%)}
.article-page .callout-important{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-color:transparent}
.article-page .callout-important .callout-title{color:hsl(var(--primary-foreground)/0.7)}
.article-page .callout-important p{color:hsl(var(--primary-foreground));font-size:16.5px;line-height:1.7}
.article-page .callout-important p+p{margin-top:10px;font-size:14.5px;color:hsl(var(--primary-foreground)/0.78)}
.article-page .article-body table{width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden}
.article-page .article-body th{padding:10px 16px;background:hsl(var(--muted));font-weight:600;font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.04em;text-transform:uppercase;color:hsl(var(--muted-foreground));text-align:left;border-bottom:1px solid hsl(var(--border))}
.article-page .article-body td{padding:10px 16px;border-bottom:1px solid hsl(var(--border));color:hsl(var(--foreground)/0.88)}
.article-page .article-body tr:last-child td{border-bottom:none}
.article-page .article-body hr{border:none;border-top:1px solid hsl(var(--border));margin:48px 0}
.article-page .article-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:56px;padding-top:28px;border-top:1px solid hsl(var(--border))}
.article-page .article-tags .tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));background:hsl(var(--secondary));border-radius:9999px;border:1px solid hsl(var(--border))}

.article-page .site-footer{border-top:1px solid hsl(var(--border));padding:28px 0;margin-top:80px}
.article-page .footer-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.article-page .footer-brand{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:hsl(var(--muted-foreground))}
.article-page .footer-brand .brand-mark{display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-weight:600;border-radius:calc(var(--radius) - 2px)}
.article-page .footer-meta{font-family:var(--font-mono);font-size:12px;color:hsl(var(--muted-foreground))}

.article-page .loading-state,.article-page .error-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;text-align:center;color:hsl(var(--muted-foreground))}
.article-page .loading-state .spinner{width:24px;height:24px;border:2px solid hsl(var(--border));border-top-color:hsl(var(--foreground));border-radius:9999px;animation:article-spin 0.8s linear infinite;margin-bottom:16px}
@keyframes article-spin{to{transform:rotate(360deg)}}
.article-page .error-state .icon{margin-bottom:16px}
.article-page .error-state h2{font-size:18px;font-weight:600;color:hsl(var(--foreground));margin-bottom:8px}
.article-page .error-state p{font-size:14px;max-width:420px;line-height:1.6}

/* highlight.js — 主题自适应（亮/暗）token 配色 */
.article-page .hljs-comment,.article-page .hljs-quote{color:hsl(var(--muted-foreground));font-style:italic}
.article-page .hljs-keyword,.article-page .hljs-selector-tag,.article-page .hljs-literal,.article-page .hljs-built_in,.article-page .hljs-type{color:hsl(var(--foreground));font-weight:600}
.article-page .hljs-string,.article-page .hljs-attr,.article-page .hljs-meta .hljs-string{color:hsl(142 45% 38%)}
.dark .article-page .hljs-string,.dark .article-page .hljs-attr{color:hsl(142 50% 62%)}
.article-page .hljs-number,.article-page .hljs-title,.article-page .hljs-title.function_,.article-page .hljs-section{color:hsl(217 60% 48%)}
.dark .article-page .hljs-number,.dark .article-page .hljs-title,.dark .article-page .hljs-title.function_{color:hsl(217 70% 68%)}
.article-page .hljs-params{color:hsl(var(--foreground)/0.9)}
.article-page .hljs-meta,.article-page .hljs-decorator{color:hsl(280 40% 55%)}
`
