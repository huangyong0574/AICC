import { useState } from 'react'
import { Network, ExternalLink } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  category: string
  connections: string[]
}

interface KnowledgeGraphProps {
  nodes: GraphNode[]
}

const categoryColors: Record<string, string> = {
  core: 'bg-primary',
  technique: 'bg-accent',
  application: 'bg-success',
  concept: 'bg-warning',
}

const categoryLabels: Record<string, string> = {
  core: '核心',
  technique: '技术',
  application: '应用',
  concept: '概念',
}

export function KnowledgeGraph({ nodes }: KnowledgeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Simple force-directed-like layout visualization
  const svgWidth = 600
  const svgHeight = 400
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          知识关联图谱
        </h3>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${categoryColors[key]}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg bg-background-secondary overflow-hidden border border-border">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          {/* Connection lines */}
          {nodes.map((node) =>
            node.connections.map((targetId) => {
              const target = nodes.find((n) => n.id === targetId)
              if (!target) return null
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.x * svgWidth}
                  y1={node.y * svgHeight}
                  x2={target.x * svgWidth}
                  y2={target.y * svgHeight}
                  stroke="hsl(var(--border-light))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              )
            })
          )}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id
            const isHighlighted = selectedNode && 
              nodes.find(n => n.id === selectedNode)?.connections.includes(node.id)
            
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                className="cursor-pointer"
                style={{ transition: 'all 0.3s ease' }}
              >
                <circle
                  cx={node.x * svgWidth}
                  cy={node.y * svgHeight}
                  r={isSelected ? 28 : 24}
                  className={categoryColors[node.category]}
                  fill="currentColor"
                  opacity={selectedNode && !isSelected && !isHighlighted ? 0.3 : 0.8}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <circle
                  cx={node.x * svgWidth}
                  cy={node.y * svgHeight}
                  r={isSelected ? 32 : 28}
                  fill="none"
                  stroke="currentColor"
                  className={categoryColors[node.category]}
                  strokeWidth={isSelected ? 2 : 0}
                  opacity={isSelected ? 0.5 : 0}
                />
                <text
                  x={node.x * svgWidth}
                  y={node.y * svgHeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(var(--primary-foreground))"
                  fontSize="10"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label.length > 6 ? node.label.slice(0, 5) + '...' : node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Selected node info */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 glass-card rounded-lg p-4 animate-fade-in-up">
            {(() => {
              const node = nodes.find(n => n.id === selectedNode)
              if (!node) return null
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{node.label}</h4>
                    <button className="text-xs text-primary hover:text-primary-glow flex items-center gap-1">
                      查看详情 <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    关联节点: {node.connections.length} 个
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
