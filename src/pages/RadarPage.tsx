import { useCallback, useEffect, useMemo, useState } from 'react'
import { radarWeekData } from '../data/radarData'
import { RadarCard } from '../components/radar/RadarCard'
import { RadarHero } from '../components/radar/RadarHero'
import { RadarToolbar, type RadarFilter } from '../components/radar/RadarToolbar'
import { SiteHeader, type NavPage } from './SiteHeader'

interface RadarPageProps {
  onNavigate: (page: NavPage) => void
}

const PLAN_STORAGE_KEY = 'aicc-deep-plan'

function readPlanFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? new Set(arr.filter((v): v is string => typeof v === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

function writePlanToStorage(plan: Set<string>) {
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify([...plan]))
  } catch {
    /* localStorage 写入失败静默 */
  }
}

export function RadarPage({ onNavigate }: RadarPageProps) {
  const [filter, setFilter] = useState<RadarFilter>('all')
  const [plan, setPlan] = useState<Set<string>>(() => readPlanFromStorage())

  // 跨 Tab 同步：监听 storage 事件
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLAN_STORAGE_KEY) {
        setPlan(readPlanFromStorage())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const togglePlan = useCallback((id: string) => {
    setPlan(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      writePlanToStorage(next)
      return next
    })
  }, [])

  const handleClearPlan = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('确定要清空本周深入计划吗？')) return
    setPlan(new Set())
    writePlanToStorage(new Set())
  }, [])

  const { insights, weekId, dateRange } = radarWeekData
  const total = insights.length

  const frontierCount = useMemo(
    () => insights.filter(i => i.maturity === 'frontier').length,
    [insights],
  )
  const matureCount = total - frontierCount

  const filtered = useMemo(
    () => (filter === 'all' ? insights : insights.filter(i => i.maturity === filter)),
    [insights, filter],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePage="radar" onNavigate={onNavigate} />

      <main className="py-16 sm:py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <RadarHero weekId={weekId} dateRange={dateRange} />

          <RadarToolbar
            filter={filter}
            onFilterChange={setFilter}
            planCount={plan.size}
            total={total}
            frontierCount={frontierCount}
            matureCount={matureCount}
            onClearPlan={handleClearPlan}
          />

          <section className="grid grid-cols-1 gap-6">
            {filtered.map(insight => (
              <RadarCard
                key={insight.id}
                insight={insight}
                inPlan={plan.has(insight.id)}
                onTogglePlan={() => togglePlan(insight.id)}
              />
            ))}
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4 font-mono text-[11.5px] text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[calc(var(--radius)-2px)] font-mono font-semibold text-[11px]"
              style={{ width: 22, height: 22, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              A
            </span>
            <span>AICC · 本周认知雷达</span>
          </div>
          <div>由 AI 认知雷达自动生成 · 覆盖 {dateRange}</div>
          <div>v1.0 · {weekId}</div>
        </div>
      </footer>
    </div>
  )
}
