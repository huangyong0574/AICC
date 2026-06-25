import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { syncConceptToVault } from "./vaultSync"

/* ──────────────────────────────────────────────────────────────
 * AICC 认知状态机（与 aicc-html-bundle 共享同一份 localStorage 模型）
 *
 *   discovered（雷达发现）
 *      → in-plan（加入深度计划）
 *      → learning（费曼学习中）
 *      → published（已成稿）
 *
 * 存储：
 *   aicc-cognition-state  —— 核心 map：{ [id]: CognitionItem }
 *   aicc-deep-plan        —— 派生：所有 state ≠ discovered 的 id 列表
 * ────────────────────────────────────────────────────────────── */

// discovered（雷达发现）→ in-plan（加入计划）→ learning（费曼学习中）→ internalized（费曼内化完成·已闭环）→ published（融合成文·已成稿）
export type CognitionStateValue = "discovered" | "in-plan" | "learning" | "internalized" | "published"

/** 计划页/雷达页里参与流转的“非发现”状态 */
export const PLANNED_STATES: CognitionStateValue[] = ["in-plan", "learning", "internalized", "published"]

export interface CognitionItem {
  state: CognitionStateValue
  title: string
  titleEn?: string
  /** 成稿后对应文章的 slug（article?slug=） */
  slug?: string
  /** 加入计划的时间戳（ms） */
  addedAt?: number
  /** 来源周，如 2026-06-12 */
  sourceWeek?: string
  /** 来源雷达快照文件名，如 2026-06-12.html */
  sourceFile?: string
  /** learning 阶段费曼已确认步数（0–4）；FeynmanApp 实时写回，雷达 learning 卡据此显示「N/4」+ 迷你进度条 */
  progress?: number
  /** 费曼内化产出的图谱关系（用于认知图谱的关系边）：concept → parent */
  relation?: { parent: string; text: string; tags?: string[]; oneLine?: string }
}

export type CognitionMap = Record<string, CognitionItem>

export const STATE_LABELS: Record<CognitionStateValue, string> = {
  discovered: "已发现",
  "in-plan": "待启动",
  learning: "学习中",
  internalized: "已闭环",
  published: "已成稿",
}

const STATE_KEY = "aicc-cognition-state"
const PLAN_KEY = "aicc-deep-plan"

function readState(): CognitionMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as CognitionMap) : {}
  } catch {
    return {}
  }
}

function persist(map: CognitionMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(STATE_KEY, JSON.stringify(map))
  // 派生 deep-plan：所有非 discovered 的 id
  const planIds = Object.entries(map)
    .filter(([, v]) => v && v.state && v.state !== "discovered")
    .map(([id]) => id)
  localStorage.setItem(PLAN_KEY, JSON.stringify(planIds))
}

interface CognitionContextValue {
  map: CognitionMap
  /** 合并写入一个认知点（部分字段） */
  upsert: (id: string, patch: Partial<CognitionItem> & { title: string }) => void
  /** 仅切换状态；切到非 discovered 且原本没有 addedAt 时补时间戳 */
  setState: (id: string, state: CognitionStateValue) => void
  /** 写 learning 进度（0–4）；值未变或条目不存在时返回原 map（不触发 re-render，避免费曼↔雷达回写循环） */
  setProgress: (id: string, progress: number) => void
  /** 加入深度计划（discovered → in-plan） */
  addToPlan: (id: string, meta: Partial<CognitionItem> & { title: string }) => void
  /** 从计划中移除（彻底删除该条目） */
  remove: (id: string) => void
  /** 返回参与流转（非 discovered）的条目，按 addedAt 新→旧 */
  plannedItems: () => Array<CognitionItem & { id: string }>
}

const CognitionContext = createContext<CognitionContextValue | null>(null)

export function CognitionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<CognitionMap>(() => readState())

  // 跨标签页 / 回到本页时同步
  useEffect(() => {
    const sync = () => setMap(readState())
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
    }
  }, [])

  const commit = useCallback((next: CognitionMap) => {
    persist(next)
    setMap(next)
  }, [])

  const upsert = useCallback<CognitionContextValue["upsert"]>(
    (id, patch) => {
      setMap((prev) => {
        const next = { ...prev, [id]: { ...prev[id], ...patch } as CognitionItem }
        persist(next)
        syncConceptToVault(id, next[id])
        return next
      })
    },
    [],
  )

  const setState = useCallback<CognitionContextValue["setState"]>((id, state) => {
    setMap((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      const addedAt =
        state !== "discovered" && !existing.addedAt ? Date.now() : existing.addedAt
      const next = { ...prev, [id]: { ...existing, state, addedAt } }
      persist(next)
      syncConceptToVault(id, next[id])
      return next
    })
  }, [])

  const setProgress = useCallback<CognitionContextValue["setProgress"]>((id, progress) => {
    setMap((prev) => {
      const existing = prev[id]
      // 条目不存在或进度未变：返回原引用，不触发 re-render（FeynmanApp 的 onProgress effect 才不会回环）
      if (!existing || existing.progress === progress) return prev
      const next = { ...prev, [id]: { ...existing, progress } }
      persist(next)
      return next
    })
  }, [])

  const addToPlan = useCallback<CognitionContextValue["addToPlan"]>((id, meta) => {
    setMap((prev) => {
      const existing = prev[id]
      const next: CognitionMap = {
        ...prev,
        [id]: {
          ...existing,
          ...meta,
          state: "in-plan",
          addedAt: existing?.addedAt ?? Date.now(),
        },
      }
      persist(next)
      syncConceptToVault(id, next[id])
      return next
    })
  }, [])

  const remove = useCallback<CognitionContextValue["remove"]>((id) => {
    setMap((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      persist(next)
      return next
    })
  }, [])

  const plannedItems = useCallback<CognitionContextValue["plannedItems"]>(() => {
    return Object.entries(map)
      .filter(([, v]) => v && v.state && v.state !== "discovered")
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
  }, [map])

  const value = useMemo<CognitionContextValue>(
    () => ({ map, upsert, setState, setProgress, addToPlan, remove, plannedItems }),
    [map, upsert, setState, setProgress, addToPlan, remove, plannedItems],
  )

  // commit 暴露给需要批量写的极少数场景（当前未直接用，保留以防 lint 抱怨）
  void commit

  return <CognitionContext.Provider value={value}>{children}</CognitionContext.Provider>
}

export function useCognition(): CognitionContextValue {
  const ctx = useContext(CognitionContext)
  if (!ctx) throw new Error("useCognition 必须在 <CognitionProvider> 内使用")
  return ctx
}
