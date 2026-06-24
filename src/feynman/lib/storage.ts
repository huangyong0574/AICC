import type { LlmConfig, Note, GraphDelta } from "../types"
import { vaultEnabled, putNote, deleteVaultNote } from "../../lib/vault"

const LLM_KEY = "aicc-llm-cfg"
const NOTES_KEY = "aicc-feynman-notes"
const GRAPH_KEY = "aicc-feynman-graph"  // 用户内化过的概念（用于知识图谱挂载）

// 一次性迁移：旧 gdn_* 键 → 新 aicc-* 键（保留用户已存的 key / 笔记 / 图谱，不丢数据）
;(() => {
  if (typeof localStorage === "undefined") return
  const moves: Array<[string, string]> = [
    ["gdn_llm_cfg_v3", LLM_KEY],
    ["gdn_notes_v3", NOTES_KEY],
    ["gdn_graph_v3", GRAPH_KEY],
  ]
  for (const [oldK, newK] of moves) {
    try {
      if (localStorage.getItem(newK) == null) {
        const old = localStorage.getItem(oldK)
        if (old != null) localStorage.setItem(newK, old)
      }
    } catch {
      /* ignore */
    }
  }
})()

export const DEFAULT_CFG: LlmConfig = {
  apiKey: "",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "deepseek-v4-flash",
}

export function loadCfg(): LlmConfig {
  try {
    // 优先从 localStorage 读取
    const raw = localStorage.getItem(LLM_KEY)
    if (raw) {
      const cached = { ...DEFAULT_CFG, ...JSON.parse(raw) } as LlmConfig
      // 迁移：旧默认 model 升级为当前默认 model（deepseek-v4-flash）
      // 注意：仅迁移已下线的旧默认；deepseek-v4-pro 是 SettingsDialog 提供的有效「更强」选项，不能在此降级
      const LEGACY_MODELS = ["qwen3.6-plus", "qwen-plus"]
      if (LEGACY_MODELS.includes(cached.model)) {
        cached.model = DEFAULT_CFG.model
        try { localStorage.setItem(LLM_KEY, JSON.stringify(cached)) } catch {}
      }
      return cached
    }

    // 如果没有，尝试从 .env.local.json 加载（开发环境）
    // 注意：这需要 Vite 的 json 导入支持
    return { ...DEFAULT_CFG }
  } catch {
    return { ...DEFAULT_CFG }
  }
}
export function saveCfg(cfg: LlmConfig) {
  localStorage.setItem(LLM_KEY, JSON.stringify(cfg))
}

// ---- Notes ----
export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
export function saveNotes(list: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(list))
}
export function addNote(note: Note) {
  const list = loadNotes()
  const idx = list.findIndex(n => n.id === note.id)
  if (idx >= 0) list[idx] = note
  else list.unshift(note)
  saveNotes(list)
  // 数据唯一来源：费曼笔记 write-through 进 vault（JSON 无损），不只存浏览器
  if (vaultEnabled()) putNote(note as unknown as Record<string, unknown>).catch(() => {})
}

/** 按原始问题文本查找已完成的离线缓存（含费曼内化结果的笔记） */
export function findCachedNote(rawQuestion: string): Note | undefined {
  const q = rawQuestion.trim()
  if (!q) return undefined
  return loadNotes().find(
    n => n.rawQuestion.trim() === q && n.feynman && n.steps?.length === 4,
  )
}

/** 按 conceptId 查笔记（含中途草稿，不要求完成）——费曼页据此恢复学习进度 */
export function findNoteByConceptId(conceptId: string): Note | undefined {
  const id = conceptId?.trim()
  if (!id) return undefined
  return loadNotes().find(n => n.conceptId === id)
}

export function deleteNote(id: string) {
  saveNotes(loadNotes().filter(n => n.id !== id))
  if (vaultEnabled()) deleteVaultNote(id).catch(() => {})
}
export function clearNotes() {
  saveNotes([])
}

// ---- Graph Deltas（以 Transformer 为基线的挂载项）----
export function loadGraph(): GraphDelta[] {
  try {
    const raw = localStorage.getItem(GRAPH_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
export function saveGraph(list: GraphDelta[]) {
  localStorage.setItem(GRAPH_KEY, JSON.stringify(list))
}
export function upsertGraph(delta: GraphDelta) {
  const list = loadGraph()
  const idx = list.findIndex(g => g.concept === delta.concept)
  if (idx >= 0) list[idx] = delta
  else list.push(delta)
  saveGraph(list)
}
export function clearGraph() {
  saveGraph([])
}
