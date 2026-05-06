import { useState, useEffect } from 'react'
import {
  DollarSign,
  BarChart3,
  Cog,
  Sigma,
  ChevronDown,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LayerContent } from '@/data/mockData'
import { DynamicChart } from './DynamicChart'

interface FourLayerContentProps {
  layers: LayerContent[]
}

const layerMeta: Record<number, {
  icon: typeof DollarSign
  colorClass: string
  cardClass: string
  badgeBg: string
  dotColor: string
}> = {
  1: { icon: DollarSign, colorClass: 'text-layer1', cardClass: 'layer-card-1', badgeBg: 'bg-layer1-muted text-layer1', dotColor: 'bg-layer1' },
  2: { icon: BarChart3, colorClass: 'text-layer2', cardClass: 'layer-card-2', badgeBg: 'bg-layer2-muted text-layer2', dotColor: 'bg-layer2' },
  3: { icon: Cog, colorClass: 'text-layer3', cardClass: 'layer-card-3', badgeBg: 'bg-layer3-muted text-layer3', dotColor: 'bg-layer3' },
  4: { icon: Sigma, colorClass: 'text-layer4', cardClass: 'layer-card-4', badgeBg: 'bg-layer4-muted text-layer4', dotColor: 'bg-layer4' },
}

export function FourLayerContent({ layers }: FourLayerContentProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ l1: true })
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])

  // Progressive reveal
  useEffect(() => {
    layers.forEach((layer, i) => {
      setTimeout(() => {
        setVisibleLayers((prev) => [...prev, layer.id])
      }, i * 400)
    })
  }, [layers])

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-5">
      {layers.map((layer) => {
        const meta = layerMeta[layer.level]
        const Icon = meta.icon
        const isVisible = visibleLayers.includes(layer.id)
        const isOpen = expanded[layer.id]

        if (!isVisible) return null

        return (
          <div
            key={layer.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(layer.level - 1) * 0.08}s` }}
          >
            <div className={cn('rounded-xl overflow-hidden border border-border', meta.cardClass)}>
              {/* Header */}
              <button
                onClick={() => toggle(layer.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-card-hover/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', meta.badgeBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', meta.badgeBg)}>
                        第 {layer.level} 层
                      </span>
                      <h3 className="font-semibold text-foreground">{layer.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{layer.subtitle}</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-6 pb-6 space-y-6 border-t border-border/50 pt-5">
                  {/* Analogy */}
                  <div className="flex gap-3 p-4 rounded-lg bg-background-secondary/60">
                    <Lightbulb className={cn('w-5 h-5 mt-0.5 flex-shrink-0', meta.colorClass)} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">直觉类比</p>
                      <p className="text-sm text-foreground leading-relaxed">{layer.analogy}</p>
                    </div>
                  </div>

                  {/* Dynamic chart */}
                  <DynamicChart config={layer.chart} layerLevel={layer.level} />

                  {/* Conclusion */}
                  <div className="p-4 rounded-lg border border-border/50 bg-background/60">
                    <p className="text-xs font-medium text-muted-foreground mb-2">核心结论</p>
                    <p className="text-sm text-foreground leading-relaxed">{layer.conclusion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
