import type { Maturity } from '../../data/radarData'

interface MaturityPillProps {
  maturity: Maturity
}

const config: Record<Maturity, { label: string; cssVar: string }> = {
  frontier: { label: '研究前沿', cssVar: 'frontier' },
  mature: { label: '成熟可用', cssVar: 'mature' },
  experimental: { label: '概念验证', cssVar: 'experimental' },
}

export function MaturityPill({ maturity }: MaturityPillProps) {
  const { label, cssVar } = config[maturity] ?? config.frontier
  const className = `border-[hsl(var(--${cssVar}))]/30 text-foreground`
  const dotClass = `bg-[hsl(var(--${cssVar}))]`
  const dotShadow = `shadow-[0_0_0_3px_hsl(var(--${cssVar})/0.15)]`

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
