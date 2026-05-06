import { useState } from 'react'
import { CheckCircle2, Circle, PenLine, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeynmanCheckItem } from '@/data/mockData'

interface FeynmanCheckProps {
  items: FeynmanCheckItem[]
}

export function FeynmanCheck({ items }: FeynmanCheckProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedWrite, setExpandedWrite] = useState<Record<string, boolean>>({})

  const total = items.length
  const done = Object.values(checked).filter(Boolean).length

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <PenLine className="w-4 h-4 text-accent" />
              费曼自检
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              用自己的话能讲清楚，才是真的懂了——无评分、无压力，只是帮你确认
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{done}/{total}</span>
          </div>
        </div>
      </div>

      {/* Check items */}
      <div className="divide-y divide-border/30">
        {items.map((item) => {
          const isChecked = checked[item.id]
          const isWriteOpen = expandedWrite[item.id]

          return (
            <div key={item.id} className="feynman-check">
              <div className="px-6 py-4">
                <div className="flex gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Circle className="w-5 h-5 text-border-light" />
                    )}
                  </button>

                  <div className="flex-1">
                    {/* Scenario badge */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      {item.scenario}
                    </span>
                    {/* Question */}
                    <p className={cn(
                      'text-sm mt-2 leading-relaxed transition-colors',
                      isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                      {item.question}
                    </p>

                    {/* Write prompt (expandable) */}
                    {item.writePrompt && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedWrite((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className="flex items-center gap-1 text-xs text-accent hover:text-accent-glow transition-colors"
                        >
                          <PenLine className="w-3 h-3" />
                          {item.writePrompt}
                          <ChevronDown className={cn('w-3 h-3 transition-transform', isWriteOpen && 'rotate-180')} />
                        </button>
                        {isWriteOpen && (
                          <textarea
                            value={notes[item.id] || ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="写下你的理解..."
                            rows={3}
                            className="mt-2 w-full p-3 rounded-lg bg-background-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/50 resize-none transition-colors"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
