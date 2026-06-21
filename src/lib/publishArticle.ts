// 成稿发布的共享落库逻辑（编辑器 EditorPage 与 创作写作台 CreationPage 同源，避免双实现漂移）。
// 仅负责 localStorage 落库 + 文章连边；认知状态机 upsert（published）由调用方用 useCognition() 完成。

export const DRAFT_PREFIX = "aicc-article-md:"
export const PUBLISHED_INDEX = "aicc-published-articles"
export const EDGES_KEY = "aicc-creation-edges"

export function slugify(text: string): string {
  return text
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50)
}

export interface PublishedEntry {
  slug: string
  title: string
  subtitle?: string
  category?: string
  date?: string
  status?: string
  tags?: string[]
  conceptIds?: string[]   // 该文融合的认知点（写作台多概念；编辑器单概念时可空）
}

export interface ArticleEdge {
  slug: string
  title: string
  conceptIds: string[]    // ≥2 个 → 在图谱上两两连边
  at: number
}

export interface PublishInput extends PublishedEntry {
  markdown: string        // 完整文章 Markdown（含 frontmatter）
}

/**
 * 落库一篇文章：写 markdown 原文 + 更新已发布索引 + （≥2 概念时）写文章连边。
 * @returns false = 用户在 slug 冲突时取消；true = 已落库（含 localStorage 不可用时的容忍）。
 */
export function publishArticleToStorage(input: PublishInput): boolean {
  const slug = input.slug.trim()
  if (!slug) throw new Error("slug 必填")
  try {
    const idxRaw = localStorage.getItem(PUBLISHED_INDEX)
    const idx: PublishedEntry[] = idxRaw ? JSON.parse(idxRaw) : []
    const clash = idx.find((e) => e.slug === slug)
    if (
      clash &&
      typeof window !== "undefined" &&
      !window.confirm(`已存在 slug 为「${slug}」的文章（${clash.title || ""}），继续发布将覆盖它。确定？`)
    ) {
      return false
    }
    localStorage.setItem(DRAFT_PREFIX + slug, input.markdown)
    const entry: PublishedEntry = {
      slug,
      title: input.title,
      subtitle: input.subtitle || "",
      category: input.category || "",
      date: input.date || new Date().toISOString().slice(0, 10),
      status: input.status || "草稿",
      tags: input.tags || [],
      conceptIds: input.conceptIds || [],
    }
    localStorage.setItem(PUBLISHED_INDEX, JSON.stringify([entry, ...idx.filter((e) => e.slug !== slug)]))

    // 闭环连边：一篇文融合 ≥2 个概念 → 记一条「文章连边」，GraphPage 据此在概念间画边
    const ids = (input.conceptIds || []).filter(Boolean)
    if (ids.length >= 2) {
      const edgesRaw = localStorage.getItem(EDGES_KEY)
      const edges: ArticleEdge[] = edgesRaw ? JSON.parse(edgesRaw) : []
      const next: ArticleEdge[] = [
        { slug, title: input.title, conceptIds: ids, at: Date.now() },
        ...edges.filter((e) => e.slug !== slug),
      ]
      localStorage.setItem(EDGES_KEY, JSON.stringify(next))
    }
    return true
  } catch {
    return true // localStorage 不可用：当作已发布（调用方仍可下载 .md 兜底）
  }
}

/** 读已发布文章的 Markdown 原文（再修改时预填） */
export function loadPublishedMarkdown(slug: string): string | null {
  try { return localStorage.getItem(DRAFT_PREFIX + slug) } catch { return null }
}

/** 按 conceptId 找其已发布文章（再修改入口：该选题已 published 时预填） */
export function findPublishedByConceptId(conceptId: string): PublishedEntry | null {
  try {
    const idxRaw = localStorage.getItem(PUBLISHED_INDEX)
    const idx: PublishedEntry[] = idxRaw ? JSON.parse(idxRaw) : []
    return idx.find((e) => (e.conceptIds || []).includes(conceptId)) || null
  } catch { return null }
}

/** 读全部文章连边（GraphPage 渲染概念间「成文连接」） */
export function loadArticleEdges(): ArticleEdge[] {
  try {
    const raw = localStorage.getItem(EDGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
