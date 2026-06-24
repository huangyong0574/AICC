// 认知存储 vault 客户端：经本地 Gateway 读写 .md（key/文件 IO 都在服务端）。
// vault 为权威、localStorage 为缓存。无 Gateway（纯静态部署）时整体禁用、回落纯 localStorage。
import { gatewayToken } from "./gateway"

function vh(): Record<string, string> {
  const t = gatewayToken()
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}

export interface VaultStatus { configured: boolean; dir: string; concepts: number; articles: number; notes?: number; drafts?: number }
export interface VaultConcept {
  id: string; title: string; titleEn?: string; status?: string; sourceWeek?: string
  maturity?: number; slug?: string; tags?: string[]; parent?: string; relationText?: string; oneLine?: string
}
export interface VaultArticle {
  slug: string; title: string; subtitle?: string; category?: string; date?: string
  status?: string; tags?: string[]; conceptIds?: string[]; body: string
}

let _enabled = false
/** vault 是否可用（已探测到 Gateway 的 /api/vault/status）。同步读，供 write-through 闸门。 */
export function vaultEnabled(): boolean { return _enabled }

/** 启动探测一次：能拿到 status 即启用 vault。 */
export async function initVault(): Promise<void> {
  try {
    const r = await fetch("/api/vault/status", { headers: vh() })
    if (r.ok) { const s = await r.json(); _enabled = !!s?.configured }
    else _enabled = false
  } catch { _enabled = false }
}

export async function fetchVaultStatus(): Promise<VaultStatus | null> {
  try { const r = await fetch("/api/vault/status", { headers: vh() }); return r.ok ? r.json() : null } catch { return null }
}
export async function fetchConcepts(): Promise<VaultConcept[]> {
  try { const r = await fetch("/api/vault/concepts", { headers: vh() }); return r.ok ? r.json() : [] } catch { return [] }
}
export async function fetchArticles(): Promise<VaultArticle[]> {
  try { const r = await fetch("/api/vault/articles", { headers: vh() }); return r.ok ? r.json() : [] } catch { return [] }
}
/** 取 vault 里某篇成稿的最新版（A 档双向同步：Obsidian 改完，网页打开读回）。无则 null。 */
export async function fetchArticle(slug: string): Promise<VaultArticle | null> {
  if (!slug) return null
  try { return (await fetchArticles()).find((a) => a.slug === slug) || null } catch { return null }
}
export async function putConcept(payload: Record<string, unknown>): Promise<boolean> {
  try { const r = await fetch("/api/vault/concept", { method: "PUT", headers: vh(), body: JSON.stringify(payload) }); return r.ok } catch { return false }
}
export async function putArticle(payload: Record<string, unknown>): Promise<boolean> {
  try { const r = await fetch("/api/vault/article", { method: "PUT", headers: vh(), body: JSON.stringify(payload) }); return r.ok } catch { return false }
}

// ── 费曼笔记（JSON 无损）+ 创作草稿：数据唯一来源落 vault ──
export async function fetchNotes(): Promise<unknown[]> {
  try { const r = await fetch("/api/vault/notes", { headers: vh() }); return r.ok ? r.json() : [] } catch { return [] }
}
export async function putNote(note: Record<string, unknown>): Promise<boolean> {
  try { const r = await fetch("/api/vault/note", { method: "PUT", headers: vh(), body: JSON.stringify(note) }); return r.ok } catch { return false }
}
export async function deleteVaultNote(id: string): Promise<boolean> {
  try { const r = await fetch(`/api/vault/note?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: vh() }); return r.ok } catch { return false }
}
export async function fetchDrafts(): Promise<Record<string, string>> {
  try { const r = await fetch("/api/vault/drafts", { headers: vh() }); return r.ok ? r.json() : {} } catch { return {} }
}
export async function putDraft(topicId: string, body: string): Promise<boolean> {
  try { const r = await fetch("/api/vault/draft", { method: "PUT", headers: vh(), body: JSON.stringify({ topicId, body }) }); return r.ok } catch { return false }
}
export async function deleteVaultDraft(topicId: string): Promise<boolean> {
  try { const r = await fetch(`/api/vault/draft?topicId=${encodeURIComponent(topicId)}`, { method: "DELETE", headers: vh() }); return r.ok } catch { return false }
}
