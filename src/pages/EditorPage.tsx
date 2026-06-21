import { useMemo, useRef, useState, type DragEvent } from "react"
import {
  ArrowLeft,
  Sun,
  Moon,
  Trash2,
  Rocket,
  Eye,
  Calendar,
  Clock,
  FileText,
  Download,
  Check,
  CheckCircle,
} from "lucide-react"
import { useDarkModeShared } from "./SiteHeader"
import { parseFrontmatter, countWords, renderArticleBody, fmtDate, type Frontmatter } from "../lib/markdown"
import { useCognition } from "../lib/cognition"
import { slugify, publishArticleToStorage } from "../lib/publishArticle"

interface EditorPageProps {
  onBack: () => void
  /** 来自费曼工作台的认知点 id（发布时置为 published 并回写 slug） */
  conceptId?: string
  /** 发布成功后跳到文章页预览（可选） */
  onPublished?: (slug: string) => void
}

export function EditorPage({ onBack, conceptId, onPublished }: EditorPageProps) {
  const [dark, toggleDark] = useDarkModeShared()
  const { upsert } = useCognition()
  const [raw, setRaw] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pubSlug, setPubSlug] = useState("")
  const [pubTitle, setPubTitle] = useState("")
  const [pubCategory, setPubCategory] = useState("")
  const toastTimer = useRef<number | undefined>(undefined)

  const { meta, bodyHtml, words } = useMemo(() => {
    const trimmed = raw.trim()
    if (!trimmed) return { meta: {} as Frontmatter, bodyHtml: "", words: 0 }
    const { meta, content } = parseFrontmatter(raw)
    return { meta, bodyHtml: renderArticleBody(content), words: countWords(content) }
  }, [raw])

  const hasContent = raw.trim().length > 0
  const title = meta.title || "未命名文章"
  const subtitle = meta.subtitle || meta.description || ""
  const date = fmtDate(meta.date)
  const category = meta.category || ""
  const tags = Array.isArray(meta.tags) ? meta.tags : []
  const status = meta.status || "草稿"
  const readtime = meta.readtime || `${Math.ceil(words / 300)} min`

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  function handleDrop(e: DragEvent<HTMLTextAreaElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRaw(String(ev.target?.result || ""))
      showToast("已加载 " + file.name)
    }
    reader.readAsText(file)
  }

  function openDialog() {
    const t = meta.title || "未命名文章"
    setPubSlug(slugify(t))
    setPubTitle(t)
    setPubCategory(meta.category || "")
    setDialogOpen(true)
  }

  function downloadMd(slug: string) {
    const blob = new Blob([raw], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = (slug || "article") + ".md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function confirmPublish() {
    const slug = pubSlug.trim()
    // slug 必填：避免空标题静默落到字面量 "article" 而互相覆盖
    if (!slug) {
      showToast("请填写文件名 (slug)")
      return
    }
    // 共享落库（含同名 slug 覆盖二次确认）；返回 false = 用户取消
    const ok = publishArticleToStorage({
      slug,
      markdown: raw,
      title: pubTitle || title,
      subtitle,
      category: pubCategory || category,
      date: date || undefined,
      status,
      tags,
      conceptIds: conceptId ? [conceptId] : [],
    })
    if (!ok) return
    // learning → published：回写认知状态机，计划页/图谱即时联动
    if (conceptId) {
      upsert(conceptId, { title: pubTitle || title, slug, state: "published" })
    }
    downloadMd(slug)
    setDialogOpen(false)
    showToast("已发布 → 文章页 ?slug=" + slug)
    onPublished?.(slug)
  }

  return (
    <div className="editor-page">
      <style>{EDITOR_CSS}</style>

      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left">
          <button className="brand" onClick={onBack}>
            <span className="brand-mark">A</span>
            <span>AICC</span>
          </button>
          <span className="header-sep" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>文章编辑器</span>
          <span className="header-sep" />
          <span className={`status-badge ${hasContent ? "has-content" : ""}`}>
            <span className="dot" />
            <span>{hasContent ? "预览就绪" : "等待输入"}</span>
          </span>
        </div>
        <div className="app-header-right">
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft /> 返回
          </button>
          <button className="btn btn-ghost" onClick={toggleDark} title="切换主题">
            {dark ? <Moon /> : <Sun />}
          </button>
          <button className="btn btn-outline" onClick={() => setRaw("")} title="清空">
            <Trash2 /> 清空
          </button>
          <button
            className="btn btn-primary"
            disabled={!hasContent}
            onClick={openDialog}
            title="预览通过后发布为文章页"
          >
            <Rocket /> 发布文章
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="app-body">
        {/* Editor */}
        <div className="editor-pane">
          <div className="editor-toolbar">
            <span className="toolbar-label">Markdown</span>
            <span className="toolbar-meta">{words} 字</span>
          </div>
          <textarea
            className="editor-textarea"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            spellCheck={false}
            placeholder={`粘贴你的 Obsidian Markdown 内容…

格式示例：
---
title: 文章标题
subtitle: 一句话摘要
date: 2026-05-24
category: 分类
tags: [tag1, tag2]
status: 已定稿
---

## 第一节

正文内容…`}
          />
        </div>

        {/* Preview */}
        <div className="preview-pane">
          <div className="preview-toolbar">
            <span className="toolbar-label">文章页预览</span>
            <span className="toolbar-meta">{hasContent ? title : ""}</span>
          </div>
          <div className="preview-scroll">
            {!hasContent ? (
              <div className="preview-empty">
                <div className="icon">
                  <Eye />
                </div>
                <p>
                  在左侧粘贴 Markdown 内容
                  <br />
                  这里实时预览 AICC 文章页效果
                </p>
              </div>
            ) : (
              <div className="preview-article">
                <div className="container">
                  <header className="article-hero">
                    <div className="badge-row">
                      {category && <span className="badge badge-secondary">{category}</span>}
                      <span className="badge">
                        <span className="dot" />
                        {status}
                      </span>
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
                  <article
                    className="article-body"
                    dangerouslySetInnerHTML={{
                      __html:
                        bodyHtml +
                        (tags.length
                          ? `<div class="article-tags">${tags
                              .map((t) => `<span class="tag">#${t}</span>`)
                              .join("")}</div>`
                          : ""),
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PUBLISH DIALOG */}
      {dialogOpen && (
        <div
          className="dialog-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false)
          }}
        >
          <div className="dialog">
            <div className="dialog-header">
              <h2>发布为 AICC 文章页</h2>
              <p>确认信息后，文章将保存到本地（localStorage）并可通过文章页 ?slug= 访问。</p>
            </div>
            <div className="dialog-body">
              <div className="dialog-field">
                <label>文件名 (slug)</label>
                <input value={pubSlug} onChange={(e) => setPubSlug(e.target.value)} placeholder="flash-attention" />
                <div className="hint">访问地址：article?slug={pubSlug || "___"}</div>
              </div>
              <div className="dialog-field">
                <label>确认标题</label>
                <input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} placeholder="文章标题" />
              </div>
              <div className="dialog-field">
                <label>分类</label>
                <input
                  value={pubCategory}
                  onChange={(e) => setPubCategory(e.target.value)}
                  placeholder="如：LLM 算法原理"
                />
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-outline" onClick={() => setDialogOpen(false)}>
                取消
              </button>
              <button className="btn btn-outline" onClick={() => downloadMd(pubSlug)}>
                <Download /> 下载 .md
              </button>
              <button className="btn btn-primary" onClick={confirmPublish}>
                <Check /> 确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast ${toast ? "show" : ""}`}>
        <CheckCircle />
        <span>{toast}</span>
      </div>
    </div>
  )
}

/* 端口自 aicc-html-bundle/aicc-editor.html，作用域收敛到 .editor-page */
const EDITOR_CSS = `
.editor-page{display:flex;flex-direction:column;height:100vh;background:hsl(var(--background));color:hsl(var(--foreground));font-size:14px;line-height:1.5}
.editor-page button{font-family:inherit}
.editor-page .app-header{height:52px;min-height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid hsl(var(--border));background:hsl(var(--background));z-index:100}
.editor-page .app-header-left{display:inline-flex;align-items:center;gap:12px}
.editor-page .brand{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14px;background:none;border:none;cursor:pointer;color:inherit}
.editor-page .brand-mark{width:24px;height:24px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-weight:600;font-size:11px}
.editor-page .header-sep{width:1px;height:20px;background:hsl(var(--border))}
.editor-page .status-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));padding:3px 10px;background:hsl(var(--secondary));border-radius:9999px}
.editor-page .status-badge .dot{width:6px;height:6px;border-radius:9999px;background:hsl(var(--muted-foreground));transition:background 0.2s ease}
.editor-page .status-badge.has-content .dot{background:hsl(142 76% 36%)}
.editor-page .app-header-right{display:inline-flex;align-items:center;gap:6px}
.editor-page .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 12px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid transparent;cursor:pointer;white-space:nowrap;background:transparent;color:hsl(var(--foreground));transition:all 0.15s ease}
.editor-page .btn-ghost:hover{background:hsl(var(--accent))}
.editor-page .btn-outline{border-color:hsl(var(--border))}
.editor-page .btn-outline:hover{background:hsl(var(--accent))}
.editor-page .btn-primary{background:hsl(var(--primary));color:hsl(var(--primary-foreground))}
.editor-page .btn-primary:hover{opacity:0.9}
.editor-page .btn-primary:disabled{opacity:0.4;cursor:not-allowed}
.editor-page .btn svg{width:13px;height:13px}
.editor-page .app-body{flex:1;display:flex;overflow:hidden}
.editor-page .editor-pane{width:50%;display:flex;flex-direction:column;border-right:1px solid hsl(var(--border))}
.editor-page .editor-toolbar,.editor-page .preview-toolbar{height:36px;min-height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid hsl(var(--border));background:hsl(var(--muted)/0.4)}
.editor-page .toolbar-label{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:hsl(var(--muted-foreground))}
.editor-page .toolbar-meta{font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground))}
.editor-page .editor-textarea{flex:1;width:100%;padding:20px 24px;font-family:var(--font-mono);font-size:13px;line-height:1.75;color:hsl(var(--foreground));background:hsl(var(--background));border:none;outline:none;resize:none;tab-size:2}
.editor-page .editor-textarea::placeholder{color:hsl(var(--muted-foreground)/0.6)}
.editor-page .preview-pane{width:50%;display:flex;flex-direction:column;overflow:hidden}
.editor-page .preview-scroll{flex:1;overflow-y:auto;background:hsl(var(--background))}
.editor-page .preview-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:hsl(var(--muted-foreground));text-align:center;padding:40px}
.editor-page .preview-empty .icon{margin-bottom:12px;opacity:0.4}
.editor-page .preview-empty .icon svg{width:28px;height:28px}
.editor-page .preview-empty p{font-size:13px;line-height:1.6}

.editor-page .preview-article{padding:32px 28px 80px}
.editor-page .preview-article .container{max-width:720px;margin:0 auto}
.editor-page .article-hero{margin-bottom:48px}
.editor-page .article-hero .badge-row{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px}
.editor-page .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;border-radius:9999px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--foreground))}
.editor-page .badge.badge-secondary{background:hsl(var(--secondary));border-color:transparent}
.editor-page .badge .dot{width:5px;height:5px;border-radius:9999px;background:hsl(142 76% 36%)}
.editor-page .article-hero h1{font-size:clamp(1.5rem,3vw,2rem);font-weight:600;letter-spacing:-0.025em;line-height:1.25;margin-bottom:12px}
.editor-page .article-hero .subtitle{font-size:0.9375rem;color:hsl(var(--muted-foreground));line-height:1.7}
.editor-page .meta-bar{display:flex;align-items:center;gap:0;margin-top:24px;border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden;background:hsl(var(--card));flex-wrap:wrap}
.editor-page .meta-bar .item{display:inline-flex;align-items:center;gap:6px;padding:10px 14px;font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));border-right:1px solid hsl(var(--border))}
.editor-page .meta-bar .item:last-child{border-right:none}
.editor-page .meta-bar .item strong{color:hsl(var(--foreground));font-weight:600}
.editor-page .meta-bar .item svg{width:12px;height:12px}
.editor-page .article-body{margin-top:40px}
.editor-page .section-block{margin-bottom:48px}
.editor-page .section-block h2{font-size:clamp(1.25rem,2vw,1.5rem);font-weight:600;letter-spacing:-0.015em;line-height:1.3;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid hsl(var(--border))}
.editor-page .article-body h3{font-size:1.0625rem;font-weight:600;margin:24px 0 10px}
.editor-page .article-body h4{font-size:0.9375rem;font-weight:600;margin:18px 0 8px}
.editor-page .article-body p{font-size:14.5px;line-height:1.8;color:hsl(var(--foreground)/0.88);margin-bottom:14px}
.editor-page .article-body strong{font-weight:600;color:hsl(var(--foreground))}
.editor-page .article-body code{font-family:var(--font-mono);font-size:12.5px;padding:1px 5px;background:hsl(var(--secondary));color:hsl(var(--secondary-foreground));border-radius:3px}
.editor-page .article-body pre{margin:16px 0;padding:14px 16px;font-family:var(--font-mono);font-size:12.5px;line-height:1.65;color:hsl(var(--foreground)/0.92);background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:var(--radius);overflow-x:auto}
.editor-page .article-body pre code{padding:0;background:none;font-size:inherit}
.editor-page .article-body ul,.editor-page .article-body ol{padding-left:0;list-style:none;margin:14px 0}
.editor-page .article-body ul li,.editor-page .article-body ol li{padding-left:20px;position:relative;margin-bottom:6px;font-size:14.5px;line-height:1.8;color:hsl(var(--foreground)/0.88)}
.editor-page .article-body ul li::before{content:'';position:absolute;left:4px;top:13px;width:4px;height:4px;background:hsl(var(--foreground));border-radius:9999px}
.editor-page .article-body ol{counter-reset:lc}
.editor-page .article-body ol li{counter-increment:lc}
.editor-page .article-body ol li::before{content:counter(lc);position:absolute;left:0;top:0;font-family:var(--font-mono);font-size:11px;font-weight:600;color:hsl(var(--muted-foreground))}
.editor-page .article-body blockquote{margin:16px 0;padding:18px 22px;background:hsl(var(--secondary));border-left:3px solid hsl(var(--foreground));border-radius:var(--radius)}
.editor-page .article-body blockquote p{font-family:var(--font-serif);font-size:15px;line-height:1.85;color:hsl(var(--foreground));margin-bottom:6px}
.editor-page .article-body blockquote p:last-child{margin-bottom:0}
.editor-page .callout{margin:16px 0;padding:18px 22px;border-radius:var(--radius);border:1px solid hsl(var(--border))}
.editor-page .callout-title{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:8px;font-weight:600}
.editor-page .callout-title svg{width:13px;height:13px}
.editor-page .callout-note{background:hsl(var(--secondary))}
.editor-page .callout-important{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-color:transparent}
.editor-page .callout-important .callout-title{color:hsl(var(--primary-foreground)/0.7)}
.editor-page .callout-important p{color:hsl(var(--primary-foreground))}
.editor-page .callout-warning{background:hsl(48 96% 95%);border-color:hsl(48 96% 70%)}
.dark .editor-page .callout-warning{background:hsl(48 30% 12%);border-color:hsl(48 40% 30%)}
.editor-page .article-body hr{border:none;border-top:1px solid hsl(var(--border));margin:32px 0}
.editor-page .article-body table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
.editor-page .article-body th,.editor-page .article-body td{padding:8px 12px;border:1px solid hsl(var(--border));text-align:left}
.editor-page .article-body th{background:hsl(var(--muted));font-weight:600;font-family:var(--font-mono);font-size:11px}
.editor-page .article-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:40px;padding-top:20px;border-top:1px solid hsl(var(--border))}
.editor-page .tag{padding:3px 9px;font-family:var(--font-mono);font-size:10.5px;color:hsl(var(--muted-foreground));background:hsl(var(--secondary));border-radius:9999px}

.editor-page .dialog-overlay{position:fixed;inset:0;background:hsl(var(--foreground)/0.4);display:none;align-items:center;justify-content:center;z-index:200}
.editor-page .dialog-overlay.open{display:flex}
.editor-page .dialog{background:hsl(var(--background));border:1px solid hsl(var(--border));border-radius:calc(var(--radius) + 4px);width:460px;max-width:90vw;box-shadow:0 16px 48px hsl(var(--foreground)/0.12);overflow:hidden}
.editor-page .dialog-header{padding:20px 24px 0}
.editor-page .dialog-header h2{font-size:16px;font-weight:600;margin-bottom:4px}
.editor-page .dialog-header p{font-size:13px;color:hsl(var(--muted-foreground));line-height:1.5}
.editor-page .dialog-body{padding:20px 24px}
.editor-page .dialog-field{margin-bottom:16px}
.editor-page .dialog-field label{display:block;font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:6px}
.editor-page .dialog-field input{width:100%;height:34px;padding:0 10px;font-family:var(--font-sans);font-size:13px;color:hsl(var(--foreground));background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:6px;outline:none}
.editor-page .dialog-field input:focus{border-color:hsl(var(--ring));box-shadow:0 0 0 2px hsl(var(--ring)/0.1)}
.editor-page .dialog-field .hint{margin-top:4px;font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground))}
.editor-page .dialog-footer{padding:16px 24px;border-top:1px solid hsl(var(--border));display:flex;justify-content:flex-end;gap:8px;background:hsl(var(--muted)/0.3)}
.editor-page .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(10px);padding:10px 18px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:8px;font-size:12.5px;font-weight:500;opacity:0;transition:all 0.2s ease;z-index:300;pointer-events:none;display:inline-flex;align-items:center;gap:8px}
.editor-page .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.editor-page .toast svg{width:14px;height:14px}
`
