// vault 同步：write-through（认知点/成稿变更 → 写 .md）+ 启动 hydrate（vault → localStorage 缓存）。
// 设计：vault 权威、localStorage 缓存。hydrate 安全合并——vault 覆盖同名字段、绝不删除本地独有项（迁移前不破坏现有数据）。
import { putConcept, putArticle, fetchConcepts, fetchArticles, vaultEnabled } from "./vault"
import { findNoteByConceptId } from "../feynman/lib/storage"
import type { CognitionItem, CognitionMap, CognitionStateValue } from "./cognition"
import type { Step4Answer } from "../feynman/types"

const STATE_KEY = "aicc-cognition-state"
const PLAN_KEY = "aicc-deep-plan"
const PUBLISHED_INDEX = "aicc-published-articles"
const DRAFT_PREFIX = "aicc-article-md:"
const EDGES_KEY = "aicc-creation-edges"

function readCognition(): CognitionMap {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") as CognitionMap } catch { return {} }
}

/** 概念 write-through：把 in-plan+ 概念（含费曼蒸馏）写进 vault。fire-and-forget。 */
export function syncConceptToVault(id: string, item: CognitionItem | undefined): void {
  if (!vaultEnabled() || !item || item.state === "discovered") return
  const note = findNoteByConceptId(id)
  const step4 = note?.steps?.find((s) => s.key === "step4")?.answer as Step4Answer | null | undefined
  const gd = note?.feynman?.graphDelta
  void putConcept({
    id,
    title: item.title,
    titleEn: item.titleEn,
    status: item.state,
    sourceWeek: item.sourceWeek,
    maturity: typeof item.progress === "number" ? item.progress : undefined,
    slug: item.slug,
    tags: item.relation?.tags || gd?.tags,
    parent: item.relation?.parent || gd?.parent,
    relationText: item.relation?.text || gd?.relation,
    oneLine: item.relation?.oneLine || step4?.oneLiner || gd?.oneLine,
    takeaway: step4?.takeaway,
    frameworkNote: step4?.frameworkNote,
  })
}

export interface ArticleSyncEntry {
  slug: string; title: string; subtitle?: string; category?: string
  date?: string; status?: string; tags?: string[]; conceptIds?: string[]
}

/** 成稿 write-through：写文章 .md（融合链接由认知点标题解析）。fire-and-forget。 */
export function syncArticleToVault(entry: ArticleSyncEntry, markdown: string): void {
  if (!vaultEnabled()) return
  const map = readCognition()
  const conceptLinks = (entry.conceptIds || []).map((cid) => map[cid]?.title || cid)
  void putArticle({ ...entry, markdown, conceptLinks })
}

/** 启动 hydrate：vault → localStorage（安全合并）。完成后派发 focus 让 CognitionProvider 重读。 */
export async function hydrateFromVault(): Promise<void> {
  if (!vaultEnabled()) return
  const [concepts, articles] = await Promise.all([fetchConcepts(), fetchArticles()])
  let changed = false

  if (concepts.length) {
    const map = readCognition()
    for (const c of concepts) {
      if (!c.id) continue
      const prev = map[c.id]
      const hasRel = c.parent || c.relationText || c.oneLine
      map[c.id] = {
        ...prev,
        title: c.title || prev?.title || c.id,
        titleEn: c.titleEn ?? prev?.titleEn,
        state: ((c.status as CognitionStateValue) || prev?.state || "in-plan"),
        sourceWeek: c.sourceWeek ?? prev?.sourceWeek,
        slug: c.slug ?? prev?.slug,
        progress: typeof c.maturity === "number" ? c.maturity : prev?.progress,
        relation: hasRel
          ? {
              parent: c.parent || prev?.relation?.parent || "",
              text: c.relationText || prev?.relation?.text || "",
              tags: c.tags || prev?.relation?.tags,
              oneLine: c.oneLine || prev?.relation?.oneLine,
            }
          : prev?.relation,
      }
    }
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(map))
      const planIds = Object.entries(map).filter(([, v]) => v?.state && v.state !== "discovered").map(([id]) => id)
      localStorage.setItem(PLAN_KEY, JSON.stringify(planIds))
      changed = true
    } catch { /* localStorage 不可用 */ }
  }

  if (articles.length) {
    try {
      const idxRaw = localStorage.getItem(PUBLISHED_INDEX)
      const idx: Array<{ slug: string }> = idxRaw ? JSON.parse(idxRaw) : []
      const bySlug = new Map<string, unknown>(idx.map((e) => [e.slug, e]))
      for (const a of articles) {
        bySlug.set(a.slug, {
          slug: a.slug, title: a.title, subtitle: a.subtitle || "", category: a.category || "",
          date: a.date || "", status: a.status || "草稿", tags: a.tags || [], conceptIds: a.conceptIds || [],
        })
        // 文章正文：仅在本地缺失时回填（保留本地再编辑的完整原文，避免被 vault body 降级覆盖）
        if (a.body != null && localStorage.getItem(DRAFT_PREFIX + a.slug) == null) {
          localStorage.setItem(DRAFT_PREFIX + a.slug, a.body)
        }
      }
      localStorage.setItem(PUBLISHED_INDEX, JSON.stringify([...bySlug.values()]))
      // 融合连边从 vault 文章重建（成文连接 = 文章 concept-ids ≥2 两两相连）：
      // 让应用内图谱的边也 vault 溯源、不再依赖独立的 aicc-creation-edges 数据源
      const edges = articles
        .filter((a) => (a.conceptIds || []).length >= 2)
        .map((a) => ({ slug: a.slug, title: a.title, conceptIds: a.conceptIds || [], at: 0 }))
      localStorage.setItem(EDGES_KEY, JSON.stringify(edges))
      changed = true
    } catch { /* localStorage 不可用 */ }
  }

  if (changed && typeof window !== "undefined") window.dispatchEvent(new Event("focus"))
}
