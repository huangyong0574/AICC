import type { LlmConfig, Note, GraphDelta } from "../types"

const LLM_KEY = "gdn_llm_cfg_v3"
const NOTES_KEY = "gdn_notes_v3"
const GRAPH_KEY = "gdn_graph_v3"  // 用户内化过的概念（用于知识图谱挂载）

export const DEFAULT_CFG: LlmConfig = {
  apiKey: "",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen3.6-plus",
  offlineMock: false,
}

export function loadCfg(): LlmConfig {
  try {
    const raw = localStorage.getItem(LLM_KEY)
    if (!raw) return { ...DEFAULT_CFG }
    return { ...DEFAULT_CFG, ...JSON.parse(raw) }
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
}
export function deleteNote(id: string) {
  saveNotes(loadNotes().filter(n => n.id !== id))
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
