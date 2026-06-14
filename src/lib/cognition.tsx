import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

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

export type CognitionStateValue = "discovered" | "in-plan" | "learning" | "published"

/** 计划页/雷达页里参与流转的“非发现”状态 */
export const PLANNED_STATES: CognitionStateValue[] = ["in-plan", "learning", "published"]

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
}

export type CognitionMap = Record<string, CognitionItem>

export const STATE_LABELS: Record<CognitionStateValue, string> = {
  discovered: "已发现",
  "in-plan": "待启动",
  learning: "学习中",
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
    () => ({ map, upsert, setState, addToPlan, remove, plannedItems }),
    [map, upsert, setState, addToPlan, remove, plannedItems],
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
