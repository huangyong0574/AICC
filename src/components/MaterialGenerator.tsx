import { useState } from 'react'
import {
  MessageSquare,
  FileText,
  Shield,
  Calculator,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MaterialTemplate } from '@/data/mockData'

interface MaterialGeneratorProps {
  materials: MaterialTemplate[]
}

const iconMap: Record<string, typeof MessageSquare> = {
  messageSquare: MessageSquare,
  fileText: FileText,
  shield: Shield,
  calculator: Calculator,
}

const typeLabels: Record<string, string> = {
  pitch: '话术',
  proposal: '方案',
  qa: 'Q&A',
  calculator: '测算',
}

export function MaterialGenerator({ materials }: MaterialGeneratorProps) {
  const [activeMat, setActiveMat] = useState(materials[0]?.id)
  const [fills, setFills] = useState<Record<string, Record<number, string>>>({})
  const [copied, setCopied] = useState(false)

  const handleFillChange = (matId: string, segIdx: number, value: string) => {
    setFills((prev) => ({
      ...prev,
      [matId]: { ...prev[matId], [segIdx]: value },
    }))
  }

  const getRenderedText = (mat: MaterialTemplate): string => {
    return mat.segments
      .map((seg, i) => {
        if (typeof seg === 'string') return seg
        return fills[mat.id]?.[i] || seg.placeholder
      })
      .join('')
  }

  const handleCopy = (mat: MaterialTemplate) => {
    navigator.clipboard.writeText(getRenderedText(mat))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-layer1" />
          业务素材工坊
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          带入你的客户上下文，填入空白处即可直接用于 PPT / Word
        </p>
      </div>

      {/* Material tabs */}
      <div className="flex border-b border-border/50 overflow-x-auto">
        {materials.map((mat) => {
          const Icon = iconMap[mat.icon] || FileText
          const isActive = activeMat === mat.id
          return (
            <button
              key={mat.id}
              onClick={() => setActiveMat(mat.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                isActive
                  ? 'text-layer1 border-layer1'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {mat.title}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-layer1-muted text-layer1' : 'bg-muted text-muted-foreground'
              )}>
                {typeLabels[mat.type]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active material content */}
      {materials.map((mat) => {
        if (mat.id !== activeMat) return null
        return (
          <div key={mat.id} className="p-6">
            {/* Rendered text with fill-in-blanks */}
            <div className="p-5 rounded-lg bg-background-secondary/60 text-sm leading-[2] text-foreground whitespace-pre-line">
              {mat.segments.map((seg, i) => {
                if (typeof seg === 'string') {
                  return <span key={i}>{seg}</span>
                }
                const fillValue = fills[mat.id]?.[i] || ''
                return (
                  <input
                    key={i}
                    type="text"
                    value={fillValue}
                    onChange={(e) => handleFillChange(mat.id, i, e.target.value)}
                    placeholder={seg.hint}
                    className="fill-blank mx-1 text-sm"
                    style={{ width: `${Math.max(seg.hint.length * 14, 120)}px` }}
                  />
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => handleCopy(mat)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-card-hover transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制全文'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
