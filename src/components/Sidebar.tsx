import { useState } from 'react'
import { 
  Search, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockHistory } from '@/data/mockData'

interface SidebarProps {
  onHistorySelect: (id: string) => void
  selectedId: string | null
}

export function Sidebar({ onHistorySelect, selectedId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'topics'>('history')

  return (
    <aside className="w-72 border-r border-border bg-background-secondary flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AI Explorer</h2>
            <p className="text-xs text-muted-foreground">知识探索平台</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={cn(
            'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
            activeTab === 'history' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('history')}
        >
          <Clock className="w-4 h-4" />
          历史记录
        </button>
        <button
          className={cn(
            'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
            activeTab === 'topics' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('topics')}
        >
          <BookOpen className="w-4 h-4" />
          热门主题
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'history' ? (
          mockHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => onHistorySelect(item.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-all hover:bg-card-hover group',
                selectedId === item.id && 'bg-card-hover border border-border-light'
              )}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {item.query}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.time}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        ) : (
          <div className="space-y-2">
            {['Transformer 架构', '大语言模型训练', '强化学习', '计算机视觉', '自然语言处理', '生成式 AI'].map((topic) => (
              <button
                key={topic}
                className="w-full text-left p-3 rounded-lg transition-all hover:bg-card-hover border border-transparent hover:border-border"
              >
                <p className="text-sm text-foreground">{topic}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          知识库已同步 · 12,458 条知识
        </div>
      </div>
    </aside>
  )
}
