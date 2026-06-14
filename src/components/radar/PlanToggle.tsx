import { Check, Plus } from 'lucide-react'

interface PlanToggleProps {
  active: boolean
  onClick: () => void
}

export function PlanToggle({ active, onClick }: PlanToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'inline-flex items-center gap-1.5 h-8 rounded-full border font-medium text-[12.5px] whitespace-nowrap transition-all bg-primary text-primary-foreground border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] active:scale-[0.97]'
          : 'inline-flex items-center gap-1.5 h-8 rounded-full border font-medium text-[12.5px] whitespace-nowrap transition-all bg-card text-foreground border-border hover:bg-accent hover:border-foreground/30 active:scale-[0.97]'
      }
      style={{ padding: '0 12px' }}
    >
      {active ? <Check style={{ width: 13, height: 13 }} /> : <Plus style={{ width: 13, height: 13 }} />}
      {active ? '已在计划中' : '加入深入计划'}
    </button>
  )
}
