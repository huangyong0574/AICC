import { useState, useMemo } from 'react'
import { Network } from 'lucide-react'
import type { GraphNode } from '@/data/mockData'

interface KnowledgeGraphViewProps {
  nodes: GraphNode[]
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  value: { color: 'var(--layer-1)', label: '商业价值' },
  app: { color: 'var(--layer-2)', label: '应用场景' },
  eng: { color: 'var(--layer-3)', label: '工程机制' },
  math: { color: 'var(--layer-4)', label: '数学本质' },
  concept: { color: 'var(--primary)', label: '核心概念' },
}

function simpleLayout(nodes: GraphNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const categoryGroups: Record<string, string[]> = {}

  nodes.forEach((n) => {
    if (!categoryGroups[n.category]) categoryGroups[n.category] = []
    categoryGroups[n.category].push(n.id)
  })

  // Arrange by category in concentric layers
  const categoryOrder = ['concept', 'value', 'app', 'eng', 'math']
  const cx = 350
  const cy = 220

  categoryOrder.forEach((cat, catIdx) => {
    const ids = categoryGroups[cat] || []
    const radius = cat === 'concept' ? 0 : 80 + catIdx * 55
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / Math.max(ids.length, 1) - Math.PI / 2 + catIdx * 0.3
      positions[id] = {
        x: cx + (ids.length === 1 && cat === 'concept' ? 0 : radius * Math.cos(angle)),
        y: cy + (ids.length === 1 && cat === 'concept' ? 0 : radius * Math.sin(angle)),
      }
    })
  })

  return positions
}

export function KnowledgeGraphView({ nodes }: KnowledgeGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const positions = useMemo(() => simpleLayout(nodes), [nodes])

  const svgW = 700
  const svgH = 440

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const n = nodes.find((x) => x.id === selectedNode)
    return new Set(n?.connections || [])
  }, [selectedNode, nodes])

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          知识图谱
        </h3>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: `hsl(${cfg.color})` }} />
              <span className="text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="p-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {/* Connections */}
          {nodes.map((node) =>
            node.connections.map((targetId) => {
              const from = positions[node.id]
              const to = positions[targetId]
              if (!from || !to) return null
              const isHighlighted =
                selectedNode &&
                ((node.id === selectedNode && selectedConnections.has(targetId)) ||
                  (targetId === selectedNode && selectedConnections.has(node.id)))
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={
                    isHighlighted
                      ? `hsl(${categoryConfig[node.category]?.color || 'var(--border)'})`
                      : 'hsl(var(--border))'
                  }
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={isHighlighted ? undefined : '4 3'}
                  opacity={selectedNode ? (isHighlighted ? 0.8 : 0.15) : 0.4}
                  style={{ transition: 'all 0.3s ease' }}
                />
              )
            })
          )}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id]
            if (!pos) return null
            const cfg = categoryConfig[node.category] || categoryConfig.concept
            const isSelected = selectedNode === node.id
            const isConnected = selectedConnections.has(node.id)
            const dimmed = selectedNode && !isSelected && !isConnected

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                className="cursor-pointer"
                style={{ transition: 'opacity 0.3s ease' }}
                opacity={dimmed ? 0.2 : 1}
              >
                {/* Glow */}
                {isSelected && (
                  <circle
                    cx={pos.x} cy={pos.y} r={32}
                    fill={`hsl(${cfg.color} / 0.15)`}
                  />
                )}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isSelected ? 24 : 20}
                  fill={`hsl(${cfg.color} / ${isSelected ? 0.9 : 0.7})`}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(0 0% 100%)"
                  fontSize="9"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label.length > 5 ? node.label.slice(0, 4) + '..' : node.label}
                </text>
                {/* Full label below */}
                <text
                  x={pos.x} y={pos.y + (isSelected ? 34 : 30)}
                  textAnchor="middle"
                  fill={`hsl(${cfg.color})`}
                  fontSize="10"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
