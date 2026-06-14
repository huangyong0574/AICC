import { useState, useEffect } from "react"
import { SiteHeader } from "./SiteHeader"
import type { NavPage } from "./SiteHeader"
import { AlertTriangle } from "lucide-react"

interface ArticlePageProps {
  slug: string
  onNavigate: (page: NavPage) => void
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-muted-foreground" style={{ minHeight: 400 }}>
      <div className="rounded-full" style={{ width: 24, height: 24, marginBottom: 16, border: "2px solid hsl(var(--border))", borderTopColor: "hsl(var(--foreground))", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 14 }}>正在加载文章…</p>
    </div>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground" style={{ minHeight: 400, padding: "0 24px" }}>
      <AlertTriangle style={{ width: 32, height: 32, marginBottom: 16 }} />
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, maxWidth: 420, lineHeight: 1.6 }}>{message}</p>
    </div>
  )
}

export function ArticlePage({ slug, onNavigate }: ArticlePageProps) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [html, setHtml] = useState("")
  const [htmlStyles, setHtmlStyles] = useState("")

  useEffect(() => {
    if (!slug) { setState("error"); setErrorMsg("未指定文章 slug"); return }
    setState("loading")
    fetch(`/content/${slug}.html`)
      .then(r => {
        if (!r.ok) throw new Error(`找不到文章 content/${slug}.html（HTTP ${r.status}）`)
        return r.text()
      })
      .then(raw => {
        // Vite dev server 会把 404 fallback 到 index.html（HTTP 200），需检测 SPA 入口标记
        if (raw.includes('<div id="root">') && raw.includes('/src/main.tsx')) {
          throw new Error(`文章 "${slug}" 尚未发布。请等待 HTML 由 co-work 生成后再访问。`)
        }
        const parser = new DOMParser()
        const doc = parser.parseFromString(raw, "text/html")
        const styles = Array.from(doc.querySelectorAll("style"))
          .map(s => s.textContent || "")
          .join("\n")
        const body = doc.body
        body.querySelector(".site-header")?.remove()
        body.querySelector(".site-footer")?.remove()
        if (!body.querySelector("h1, h2, article, main, section")) {
          throw new Error(`文章 "${slug}" 内容为空或非合法 HTML 文章`)
        }
        setHtmlStyles(styles)
        setHtml(body.innerHTML)
        setState("ok")
        document.title = doc.title || `${slug} — AICC`
      })
      .catch(err => { setErrorMsg(err.message); setState("error") })
  }, [slug])

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFeatureSettings: "'rlig' 1, 'calt' 1" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <SiteHeader activePage="article" onNavigate={onNavigate} />

      <main>
        <div className="max-w-screen-xl mx-auto px-6">
          {state === "loading" && <LoadingState />}
          {state === "error" && <ErrorState title="加载失败" message={errorMsg} />}
          {state === "ok" && (
            <>
              {htmlStyles && <style dangerouslySetInnerHTML={{ __html: htmlStyles }} />}
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border" style={{ padding: "28px 0", marginTop: 80 }}>
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center justify-center font-mono font-semibold text-[11px] rounded-[calc(var(--radius)-2px)]" style={{ width: 22, height: 22, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>A</span>
            AICC · 你的 AI 认知工作台
          </div>
          <div className="font-mono text-[12px] text-muted-foreground">v1.0</div>
        </div>
      </footer>
    </div>
  )
}
