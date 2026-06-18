import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRadarWeekById } from '../data/radarData'
import { RadarCard } from '../components/radar/RadarCard'
import { RadarHero } from '../components/radar/RadarHero'
import { RadarToolbar, type RadarFilter } from '../components/radar/RadarToolbar'
import { RadarBriefing } from '../components/radar/RadarBriefing'
import { SiteHeader, type NavPage } from './SiteHeader'
import { useCognition } from '../lib/cognition'

interface RadarPageProps {
  onNavigate: (page: NavPage) => void
  /** 进费曼（开始 / 继续 / 复习）；由 main.handleOpenFeynman 处理 in-plan→learning + 深链 */
  onOpenFeynman: (id: string) => void
  /** 要展示的周；缺省取最新周 */
  weekId?: string
}

export function RadarPage({ onNavigate, onOpenFeynman, weekId: weekIdProp }: RadarPageProps) {
  const [filter, setFilter] = useState<RadarFilter>('all')
  const { map, addToPlan, remove } = useCognition()

  const { week } = useRadarWeekById(weekIdProp)
  const { insights, weekId, dateRange } = week
  const total = insights.length

  // 计划状态来自认知状态机（aicc-cognition-state，state ≠ discovered 即在计划中）
  const inPlan = useCallback(
    (id: string) => !!map[id] && map[id].state !== 'discovered',
    [map],
  )

  const togglePlan = useCallback(
    (id: string) => {
      const state = map[id]?.state
      if (state && state !== 'discovered') {
        // 仅「待启动(in-plan)」可在雷达页一键移除；学习中/已成稿含有学习进度或文章关联，
        // 必须二次确认，避免误点一下就静默删掉这些数据。
        if (state !== 'in-plan') {
          const label = state === 'learning' ? '学习中' : '已成稿'
          if (
            typeof window !== 'undefined' &&
            !window.confirm(`该认知点处于「${label}」，移除会丢失其学习进度 / 文章关联。确定移除？`)
          )
            return
        }
        remove(id)
      } else {
        const insight = insights.find(i => i.id === id)
        addToPlan(id, {
          title: insight?.title || id,
          titleEn: insight?.eyebrow,
          sourceWeek: weekId,
        })
      }
    },
    [map, remove, addToPlan, insights, weekId],
  )

  const planCount = useMemo(() => insights.filter(i => inPlan(i.id)).length, [insights, inPlan])

  const handleClearPlan = useCallback(() => {
    // 只清空「待启动」，学习中 / 已成稿（含进度与文章关联）保留，避免误清掉已完成的工作。
    const removable = insights.filter(i => map[i.id]?.state === 'in-plan')
    if (removable.length === 0) return
    if (typeof window !== 'undefined' && !window.confirm('确定要清空本周「待启动」的认知点吗？学习中 / 已成稿不受影响。')) return
    removable.forEach(i => remove(i.id))
  }, [insights, map, remove])

  const frontierCount = useMemo(
    () => insights.filter(i => i.maturity === 'frontier').length,
    [insights],
  )
  const matureCount = total - frontierCount

  // 全局进度细分：学习中 / 已掌握（供 toolbar「在学 X · 已掌握 Y」一目了然）
  const learningCount = useMemo(
    () => insights.filter(i => map[i.id]?.state === 'learning').length,
    [insights, map],
  )
  const masteredCount = useMemo(
    () => insights.filter(i => map[i.id]?.state === 'published').length,
    [insights, map],
  )

  const filtered = useMemo(
    () => (filter === 'all' ? insights : insights.filter(i => i.maturity === filter)),
    [insights, filter],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePage="radar" onNavigate={onNavigate} />

      <main className="py-16 sm:py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <button
            onClick={() => onNavigate('radar')}
            className="inline-flex items-center gap-1.5 mb-6 font-mono text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> 认知雷达归档
          </button>
          <RadarHero weekId={weekId} dateRange={dateRange} />

          <RadarToolbar
            filter={filter}
            onFilterChange={setFilter}
            planCount={planCount}
            total={total}
            frontierCount={frontierCount}
            matureCount={matureCount}
            learningCount={learningCount}
            masteredCount={masteredCount}
            onClearPlan={handleClearPlan}
          />

          <section className="grid grid-cols-1 gap-6">
            {filtered.map(insight => (
              <RadarCard
                key={insight.id}
                insight={insight}
                state={map[insight.id]?.state}
                progress={map[insight.id]?.progress}
                onTogglePlan={() => togglePlan(insight.id)}
                onOpenFeynman={() => onOpenFeynman(insight.id)}
              />
            ))}
          </section>

          <RadarBriefing week={week} />
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
