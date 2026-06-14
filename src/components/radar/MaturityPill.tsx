import type { Maturity } from '../../data/radarData'

interface MaturityPillProps {
  maturity: Maturity
}

const config: Record<Maturity, { label: string; className: string }> = {
  frontier: {
    label: '研究前沿',
    className: 'border-[hsl(var(--frontier))]/30 text-foreground',
  },
  mature: {
    label: '成熟可用',
    className: 'border-[hsl(var(--mature))]/30 text-foreground',
  },
}

export function MaturityPill({ maturity }: MaturityPillProps) {
  const { label, className } = config[maturity]
  const dotClass = maturity === 'frontier' ? 'bg-[hsl(var(--frontier))]' : 'bg-[hsl(var(--mature))]'
  const dotShadow =
    maturity === 'frontier'
      ? 'shadow-[0_0_0_3px_hsl(var(--frontier)/0.15)]'
      : 'shadow-[0_0_0_3px_hsl(var(--mature)/0.15)]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-background font-mono text-[10px] font-medium tracking-[0.02em] whitespace-nowrap ${className}`}
      style={{ padding: '4px 9px' }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} ${dotShadow}`} />
      {label}
    </span>
  )
}
