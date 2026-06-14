interface RadarHeroProps {
  weekId: string
  dateRange: string
}

export function RadarHero({ weekId, dateRange }: RadarHeroProps) {
  return (
    <section className="mb-11">
      <div className="inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground mb-[18px]">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--mature))] animate-radar-pulse"
          aria-hidden
        />
        WEEKLY RADAR · {weekId} · LIVE
      </div>
      <h1
        className="font-semibold tracking-[-0.04em] leading-[1.05] mb-[18px]"
        style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}
      >
        本周深度认知点
        <span className="block mt-3 font-mono font-normal text-[0.32em] text-muted-foreground tracking-[0.02em]">
          <span className="opacity-50">—&nbsp;</span>
          {dateRange}
        </span>
      </h1>
    </section>
  )
}
