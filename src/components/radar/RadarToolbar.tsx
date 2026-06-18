import { Bookmark, Layers, X } from 'lucide-react'

export type RadarFilter = 'all' | 'frontier' | 'mature'

interface RadarToolbarProps {
  filter: RadarFilter
  onFilterChange: (filter: RadarFilter) => void
  planCount: number
  total: number
  frontierCount: number
  matureCount: number
  /** 学习中条目数（learning） */
  learningCount: number
  /** 已掌握条目数（published） */
  masteredCount: number
  onClearPlan: () => void
}

export function RadarToolbar({
  filter,
  onFilterChange,
  planCount,
  total,
  frontierCount,
  matureCount,
  learningCount,
  masteredCount,
  onClearPlan,
}: RadarToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-7 pb-[18px] border-b border-border flex-wrap">
      {/* Filter chips */}
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground mr-2">
          FILTER
        </span>

        <FilterChip
          active={filter === 'all'}
          onClick={() => onFilterChange('all')}
          label={
            <>
              <Layers style={{ width: 12, height: 12 }} />
              全部 <span className="opacity-50">·</span> {total}
            </>
          }
        />
        <FilterChip
          active={filter === 'frontier'}
          onClick={() => onFilterChange('frontier')}
          label={
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--frontier))]" />
              研究前沿 · {frontierCount}
            </>
          }
        />
        <FilterChip
          active={filter === 'mature'}
          onClick={() => onFilterChange('mature')}
          label={
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--mature))]" />
              成熟可用 · {matureCount}
            </>
          }
        />
      </div>

      {/* Plan summary：全局进度（已加入 N/total）+ 在学/已掌握细分，一目了然 */}
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 border border-border rounded-full bg-card text-[12.5px] text-muted-foreground">
        <Bookmark style={{ width: 13, height: 13 }} className="text-foreground" />
        <span>深入计划</span>
        <span className="font-mono font-semibold text-foreground">
          {planCount} / {total}
        </span>
        <span
          className="block bg-secondary rounded-[2px] overflow-hidden"
          style={{ width: 64, height: 4 }}
          aria-hidden
        >
          <span
            className="block h-full bg-[hsl(var(--mature))] transition-[width] duration-300"
            style={{ width: total > 0 ? `${(planCount / total) * 100}%` : 0 }}
          />
        </span>
        {(learningCount > 0 || masteredCount > 0) && (
          <span className="font-mono text-[11px] whitespace-nowrap">
            {learningCount > 0 && <span style={{ color: 'hsl(var(--mature))' }}>在学 {learningCount}</span>}
            {learningCount > 0 && masteredCount > 0 && <span className="opacity-40"> · </span>}
            {masteredCount > 0 && <span style={{ color: 'hsl(var(--mature))' }}>已掌握 {masteredCount}</span>}
          </span>
        )}
        <button
          type="button"
          onClick={onClearPlan}
          title="清空计划"
          aria-label="清空计划"
          className="ml-1 p-[2px] text-muted-foreground rounded-[calc(var(--radius)-2px)] hover:text-foreground hover:bg-accent transition-colors"
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  )
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  label: React.ReactNode
}

function FilterChip({ active, onClick, label }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-medium border transition-all bg-primary text-primary-foreground border-primary'
          : 'inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-medium border transition-all bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent'
      }
      style={{ padding: '6px 12px' }}
    >
      {label}
    </button>
  )
}
