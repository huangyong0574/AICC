import { marked } from "marked"
import yaml from "js-yaml"

/* ──────────────────────────────────────────────────────────────
 * AICC 文章渲染管线（编辑器 & 文章页共用）
 * 把 Obsidian 风格 Markdown（带 frontmatter / [!callout] / 多级标题）
 * 渲染成与 aicc-html-bundle 文章页一致的 HTML 结构：
 *   - 每个 <h2> 起一个 .section-block
 *   - > [!note] / [!warning] / [!important] / [!tip] / [!tldr] → callout
 * 渲染版本无关（基于 DOM 后处理，不依赖 marked renderer 私有 API）
 * ────────────────────────────────────────────────────────────── */

marked.setOptions({ breaks: true, gfm: true })

export interface Frontmatter {
  title?: string
  subtitle?: string
  description?: string
  date?: string
  category?: string
  tags?: string[]
  status?: string
  readtime?: string
  [k: string]: unknown
}

export function parseFrontmatter(text: string): { meta: Frontmatter; content: string } {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, content: text }
  try {
    return { meta: (yaml.load(m[1]) as Frontmatter) || {}, content: m[2] }
  } catch {
    return { meta: {}, content: text }
  }
}

/** frontmatter 里的 date 可能被 js-yaml 解析成 Date 对象，统一格式化为 YYYY-MM-DD */
export function fmtDate(d: unknown): string {
  if (!d) return ""
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  const s = String(d)
  const m = s.match(/\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : s.slice(0, 10)
}

export function countWords(text: string): number {
  return text
    .replace(/[#*_`[\]()>~\-|{}\n\r]/g, "")
    .replace(/\s+/g, "").length
}

const ICON = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

const CALLOUT_ICONS: Record<string, string> = {
  note: ICON('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  warning: ICON('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  important: ICON('<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>'),
  tip: ICON('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
  tldr: ICON('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),
}

function slugifyHeading(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50)
}

function transformCallouts(root: HTMLElement, doc: Document) {
  root.querySelectorAll("blockquote").forEach((bq) => {
    const first = bq.firstElementChild
    if (!first || first.tagName !== "P") return
    const m = (first.textContent || "").match(/^\[!(\w+)\]\s*(.*)$/)
    if (!m) return
    const type = m[1].toLowerCase()
    const title = m[2] || type.toUpperCase()
    first.remove()
    const body = bq.innerHTML
    const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.note
    const cls = ["important", "tldr"].includes(type)
      ? "callout callout-important"
      : type === "warning"
        ? "callout callout-warning"
        : "callout callout-note"
    const div = doc.createElement("div")
    div.className = cls
    div.innerHTML = `<div class="callout-title">${icon}${title}</div>${body}`
    bq.replaceWith(div)
  })
}

/** Markdown 正文 → 文章页 HTML（section-block + callout 后处理）—— 编辑器预览用（简版） */
export function renderArticleBody(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return rawHtml

  const doc = new DOMParser().parseFromString(`<div id="aicc-root">${rawHtml}</div>`, "text/html")
  const root = doc.getElementById("aicc-root")
  if (!root) return rawHtml

  transformCallouts(root, doc)

  // 按 h2 切分 section-block
  const out = doc.createElement("div")
  let current: HTMLElement | null = null
  Array.from(root.childNodes).forEach((node) => {
    const el = node as HTMLElement
    if (node.nodeType === 1 && el.tagName === "H2") {
      current = doc.createElement("div")
      current.className = "section-block"
      current.id = slugifyHeading(el.textContent || "")
      current.appendChild(node)
      out.appendChild(current)
    } else if (current) {
      current.appendChild(node)
    } else {
      out.appendChild(node)
    }
  })

  return out.innerHTML
}

export interface TocHeading {
  id: string
  text: string
}

const CODE_ICON =
  ICON('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>')

/**
 * Markdown 正文 → 文章页富 HTML（带 step-num 段头、代码块工具栏、callout）。
 * 返回 headings 供目录(TOC)与滚动高亮使用。语法高亮在组件挂载后由 highlight.js 处理。
 */
export function renderArticlePage(markdown: string): { html: string; headings: TocHeading[] } {
  const rawHtml = marked.parse(markdown, { async: false }) as string
  const headings: TocHeading[] = []
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return { html: rawHtml, headings }

  const doc = new DOMParser().parseFromString(`<div id="aicc-root">${rawHtml}</div>`, "text/html")
  const root = doc.getElementById("aicc-root")
  if (!root) return { html: rawHtml, headings }

  transformCallouts(root, doc)

  // 代码块 → .code-block（带语言标签 + 复制按钮）
  root.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code")
    if (!code) return
    const langClass = Array.from(code.classList).find((c) => c.startsWith("language-"))
    const lang = langClass ? langClass.slice("language-".length) : "code"
    const block = doc.createElement("div")
    block.className = "code-block"
    const head = doc.createElement("div")
    head.className = "code-head"
    head.innerHTML = `<span class="lang">${CODE_ICON}${lang.toUpperCase()}</span><button class="copy-btn" data-copy type="button">COPY</button>`
    pre.replaceWith(block)
    block.appendChild(head)
    block.appendChild(pre)
  })

  // 按 h2 切分 section-block（富段头：step-num + kicker）
  const out = doc.createElement("div")
  let current: HTMLElement | null = null
  let n = 0
  Array.from(root.childNodes).forEach((node) => {
    const el = node as HTMLElement
    if (node.nodeType === 1 && el.tagName === "H2") {
      n++
      const num = String(n).padStart(2, "0")
      const id = slugifyHeading(el.textContent || "")
      headings.push({ id, text: el.textContent || "" })
      current = doc.createElement("div")
      current.className = "section-block"
      current.id = id
      const header = doc.createElement("div")
      header.className = "section-header"
      header.innerHTML = `<div class="section-meta"><span class="step-num">${num}</span><span class="step-kicker">Section · ${num}</span></div>`
      const h2 = doc.createElement("h2")
      h2.id = id
      h2.innerHTML = el.innerHTML
      header.appendChild(h2)
      current.appendChild(header)
      out.appendChild(current)
    } else if (current) {
      current.appendChild(node)
    } else {
      out.appendChild(node)
    }
  })

  return { html: out.innerHTML, headings }
}
