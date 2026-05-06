import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Code, 
  Lightbulb,
  ExternalLink,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeItem {
  title: string
  content: string
  tags?: string[]
}

interface KnowledgeLayer {
  id: string
  name: string
  description: string
  icon: string
  layer: 'core' | 'technical' | 'extended'
  items: KnowledgeItem[]
}

interface KnowledgeLayersProps {
  layers: KnowledgeLayer[]
  query: string
}

const layerConfig = {
  core: {
    icon: BookOpen,
    color: 'primary',
    label: '核心概念',
    description: '基础知识与核心原理',
  },
  technical: {
    icon: Code,
    color: 'accent',
    label: '技术细节',
    description: '深入技术实现与架构',
  },
  extended: {
    icon: Lightbulb,
    color: 'success',
    label: '扩展知识',
    description: '相关技术与应用场景',
  },
}

const iconMap = {
  book: BookOpen,
  code: Code,
  lightbulb: Lightbulb,
}

export function KnowledgeLayers({ layers, query }: KnowledgeLayersProps) {
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    core: true,
    technical: false,
    extended: false,
  })

  const toggleLayer = (id: string) => {
    setExpandedLayers(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Query display */}
      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground mb-1">探索问题</p>
        <p className="text-lg font-medium text-foreground">{query}</p>
      </div>

      {/* Layer sections */}
      {layers.map((layer, layerIndex) => {
        const config = layerConfig[layer.layer]
        const Icon = iconMap[layer.icon as keyof typeof iconMap] || config.icon
        const isExpanded = expandedLayers[layer.id]
        
        return (
          <div 
            key={layer.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${layerIndex * 0.1}s` }}
          >
            <div className={cn(
              'glass-card rounded-xl overflow-hidden',
              `layer-${layer.layer}`
            )}>
              {/* Layer header */}
              <button
                onClick={() => toggleLayer(layer.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    layer.layer === 'core' && 'bg-primary/20 text-primary',
                    layer.layer === 'technical' && 'bg-accent/20 text-accent',
                    layer.layer === 'extended' && 'bg-success/20 text-success'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {layer.items.length} 个知识点
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Layer content */}
              {isExpanded && (
                <div className="border-t border-border p-5 space-y-4">
                  {layer.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-4 rounded-lg bg-background-secondary hover:bg-card-hover transition-colors"
                    >
                      <h4 className="font-medium text-foreground mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.tags.map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
