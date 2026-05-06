import { useEffect, useState } from 'react'
import type { ChartConfig } from '@/data/mockData'

interface DynamicChartProps {
  config: ChartConfig
  layerLevel: number
}

const layerColorVars: Record<number, string> = {
  1: '--layer-1',
  2: '--layer-2',
  3: '--layer-3',
  4: '--layer-4',
}

export function DynamicChart({ config, layerLevel }: DynamicChartProps) {
  const colorVar = layerColorVars[layerLevel] || '--primary'

  switch (config.type) {
    case 'dual-compare':
      return <DualCompare data={config.data as DualCompareData} title={config.title} colorVar={colorVar} />
    case 'scenario-bar':
      return <ScenarioBar data={config.data as ScenarioBarData} title={config.title} colorVar={colorVar} />
    case 'process-flow':
      return <ProcessFlow data={config.data as ProcessFlowData} title={config.title} colorVar={colorVar} />
    case 'recursive-transform':
      return <RecursiveTransform data={config.data as RecursiveTransformData} title={config.title} colorVar={colorVar} />
    default:
      return null
  }
}

/* ─── Dual Compare ─── */
interface DualCompareData {
  left: { label: string; items: { label: string; value: number; unit: string }[] }
  right: { label: string; items: { label: string; value: number; unit: string }[] }
}

function DualCompare({ data, title, colorVar }: { data: DualCompareData; title: string; colorVar: string }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="rounded-lg border border-border/50 bg-background-secondary/40 p-5">
      <p className="text-xs font-medium text-muted-foreground mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-6">
        {[data.left, data.right].map((side, sideIdx) => (
          <div key={sideIdx}>
            <p className="text-sm font-medium text-foreground mb-3 text-center">{side.label}</p>
            <div className="space-y-3">
              {side.items.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value}{item.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animate ? `${item.value}%` : '0%',
                        background: sideIdx === 0
                          ? 'hsl(var(--muted-foreground) / 0.4)'
                          : `hsl(var(${colorVar}))`,
                        transitionDelay: `${i * 120}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Scenario Bar ─── */
interface ScenarioBarData {
  bars: { label: string; before: number; after: number; unit: string }[]
}

function ScenarioBar({ data, title, colorVar }: { data: ScenarioBarData; title: string; colorVar: string }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="rounded-lg border border-border/50 bg-background-secondary/40 p-5">
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-muted-foreground/40 inline-block" /> 增强前
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: `hsl(var(${colorVar}))` }} /> 增强后
        </span>
      </div>
      <div className="space-y-4">
        {data.bars.map((bar, i) => (
          <div key={i}>
            <p className="text-xs text-foreground mb-2">{bar.label}</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex gap-1">
                {/* Before */}
                <div className="h-5 rounded bg-muted-foreground/20 relative overflow-hidden" style={{ width: '100%' }}>
                  <div
                    className="h-full rounded transition-all duration-800 ease-out"
                    style={{
                      width: animate ? `${bar.before}%` : '0%',
                      background: 'hsl(var(--muted-foreground) / 0.35)',
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    {bar.before}{bar.unit}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex gap-1">
                {/* After */}
                <div className="h-5 rounded bg-muted/60 relative overflow-hidden" style={{ width: '100%' }}>
                  <div
                    className="h-full rounded transition-all duration-800 ease-out"
                    style={{
                      width: animate ? `${bar.after}%` : '0%',
                      background: `hsl(var(${colorVar}))`,
                      transitionDelay: `${i * 100 + 300}ms`,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-foreground font-medium">
                    {bar.after}{bar.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Process Flow ─── */
interface ProcessFlowData {
  steps: { id: string; label: string; desc: string }[]
}

function ProcessFlow({ data, title, colorVar }: { data: ProcessFlowData; title: string; colorVar: string }) {
  const [revealed, setRevealed] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= data.steps.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 300)
    return () => clearInterval(interval)
  }, [data.steps.length])

  return (
    <div className="rounded-lg border border-border/50 bg-background-secondary/40 p-5">
      <p className="text-xs font-medium text-muted-foreground mb-5">{title}</p>
      <div className="space-y-0">
        {data.steps.map((step, i) => {
          const isRevealed = i < revealed
          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 flex-shrink-0"
                  style={{
                    borderColor: isRevealed ? `hsl(var(${colorVar}))` : 'hsl(var(--border))',
                    background: isRevealed ? `hsl(var(${colorVar}) / 0.15)` : 'transparent',
                    color: isRevealed ? `hsl(var(${colorVar}))` : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {i + 1}
                </div>
                {i < data.steps.length - 1 && (
                  <div
                    className="w-0.5 h-8 transition-all duration-500"
                    style={{
                      background: isRevealed ? `hsl(var(${colorVar}) / 0.3)` : 'hsl(var(--border))',
                    }}
                  />
                )}
              </div>
              {/* Content */}
              <div
                className="pb-4 transition-all duration-300"
                style={{ opacity: isRevealed ? 1 : 0.3, transform: isRevealed ? 'translateX(0)' : 'translateX(8px)' }}
              >
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Recursive Transform ─── */
interface RecursiveTransformData {
  transforms: { from: string; to: string; formula: string }[]
}

function RecursiveTransform({ data, title, colorVar }: { data: RecursiveTransformData; title: string; colorVar: string }) {
  const [revealed, setRevealed] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= data.transforms.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 500)
    return () => clearInterval(interval)
  }, [data.transforms.length])

  return (
    <div className="rounded-lg border border-border/50 bg-background-secondary/40 p-5">
      <p className="text-xs font-medium text-muted-foreground mb-5">{title}</p>
      <div className="space-y-4">
        {data.transforms.map((t, i) => {
          const isRevealed = i < revealed
          return (
            <div
              key={i}
              className="transition-all duration-500"
              style={{ opacity: isRevealed ? 1 : 0.15, transform: isRevealed ? 'translateY(0)' : 'translateY(12px)' }}
            >
              <div className="flex items-center gap-3">
                {/* From */}
                <div className="px-3 py-1.5 rounded-md border border-border text-xs text-foreground bg-card min-w-[80px] text-center">
                  {t.from}
                </div>
                {/* Arrow */}
                <svg width="32" height="12" viewBox="0 0 32 12" className="flex-shrink-0">
                  <line x1="0" y1="6" x2="24" y2="6" stroke={`hsl(var(${colorVar}))`} strokeWidth="1.5" />
                  <polygon points="24,2 32,6 24,10" fill={`hsl(var(${colorVar}))`} />
                </svg>
                {/* To */}
                <div
                  className="px-3 py-1.5 rounded-md border text-xs font-medium min-w-[80px] text-center"
                  style={{
                    borderColor: `hsl(var(${colorVar}) / 0.4)`,
                    background: `hsl(var(${colorVar}) / 0.1)`,
                    color: `hsl(var(${colorVar}))`,
                  }}
                >
                  {t.to}
                </div>
              </div>
              {/* Formula */}
              <div className="ml-11 mt-1.5">
                <code
                  className="text-xs px-2 py-1 rounded bg-background/80 border border-border/50"
                  style={{ color: `hsl(var(${colorVar}) / 0.8)` }}
                >
                  {t.formula}
                </code>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
