import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, Trash2, Info } from "lucide-react"
import { loadGraph, clearGraph } from "../lib/storage"
import type { GraphDelta } from "../types"

interface LayoutNode {
  id: string
  label: string
  isRoot?: boolean
  x: number
  y: number
  tags?: string[]
  relation?: string
  oneLine?: string
}

const ROOT_LABEL = "Transformer"

function layout(deltas: GraphDelta[]): { nodes: LayoutNode[]; edges: { a: string; b: string; label: string }[] } {
  const cx = 260
  const cy = 230
  const rootNode: LayoutNode = { id: ROOT_LABEL, label: ROOT_LABEL, isRoot: true, x: cx, y: cy }
  const n = deltas.length
  const R = 170
  const children: LayoutNode[] = deltas.map((d, i) => {
    const angle = n === 1 ? -Math.PI / 2 : (i / n) * Math.PI * 2 - Math.PI / 2
    return {
      id: d.concept,
      label: d.concept,
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
      tags: d.tags,
      relation: d.relation,
      oneLine: d.oneLine,
    }
  })
  const edges = deltas.map(d => ({ a: ROOT_LABEL, b: d.concept, label: d.relation || "" }))
  return { nodes: [rootNode, ...children], edges }
}

export function GraphDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [deltas, setDeltas] = useState<GraphDelta[]>([])
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    if (open) setDeltas(loadGraph())
  }, [open])

  const { nodes, edges } = useMemo(() => layout(deltas), [deltas])
  const selected = useMemo(() => deltas.find(d => d.concept === hover), [deltas, hover])

  function onClear() {
    if (!confirm("确定清空整个知识图谱？")) return
    clearGraph()
    setDeltas([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-4 w-4 text-foreground" />
            知识图谱 · 以 Transformer 为基线
            <Badge variant="outline" className="ml-2 font-mono text-[10px]">{deltas.length} 概念</Badge>
          </DialogTitle>
          <DialogDescription>
            每次费曼内化后，当前概念会挂到 Transformer 之下作为认知节点。悬停节点查看关系与精髓。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClear} disabled={deltas.length === 0}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            清空图谱
          </Button>
        </div>

        {deltas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground text-sm py-16 gap-2">
            <Network className="h-8 w-8 opacity-40" />
            <div>先走完六问 + 费曼内化，新的概念才会挂上来</div>
            <div className="text-[11px]">（基线节点 Transformer 需要与至少一个子概念产生关系才会显示）</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
              <svg viewBox="0 0 520 460" className="w-full h-auto">
                <defs>
                  <radialGradient id="root-g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.75" />
                  </radialGradient>
                  <radialGradient id="child-g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--background-tertiary))" stopOpacity="1" />
                  </radialGradient>
                </defs>

                {edges.map((e, i) => {
                  const a = nodes.find(n => n.id === e.a)!
                  const b = nodes.find(n => n.id === e.b)!
                  const mx = (a.x + b.x) / 2
                  const my = (a.y + b.y) / 2
                  return (
                    <g key={i}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth="1.5" />
                      {e.label && (
                        <text x={mx} y={my - 4} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                          {e.label.length > 10 ? e.label.slice(0, 10) + "…" : e.label}
                        </text>
                      )}
                    </g>
                  )
                })}

                {nodes.map(n => {
                  if (n.isRoot) {
                    return (
                      <g key={n.id}>
                        <circle cx={n.x} cy={n.y} r="36" fill="url(#root-g)" stroke="hsl(var(--foreground))" strokeWidth="2" />
                        <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize="12" fill="hsl(var(--background))" className="font-bold">{n.label}</text>
                        <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize="8" fill="hsl(var(--background))" opacity="0.7">基线</text>
                      </g>
                    )
                  }
                  const active = hover === n.id
                  return (
                    <g key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                      <circle
                        cx={n.x} cy={n.y}
                        r={active ? 30 : 26}
                        fill="url(#child-g)"
                        stroke="hsl(var(--foreground))"
                        strokeWidth={active ? 2 : 1}
                        style={{ transition: "r 0.2s" }}
                      />
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" className="font-medium">
                        {n.label.length > 6 ? n.label.slice(0, 6) + "…" : n.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            <aside className="rounded-lg border border-border/60 bg-card/40 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Info className="h-3 w-3" />
                节点详情
              </div>
              {selected ? (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">概念</div>
                    <div className="font-semibold text-foreground">{selected.concept}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">与 {selected.parent} 的关系</div>
                    <div className="text-foreground/90">{selected.relation}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">一句话精髓</div>
                    <div className="text-foreground/90">{selected.oneLine}</div>
                  </div>
                  {selected.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags.map((t, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">悬停左侧节点查看详情</div>
              )}
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
