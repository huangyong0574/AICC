import { useState } from 'react'
import { Search, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'

interface SearchSectionProps {
  onSearch: (query: string) => void
  isLoading: boolean
  placeholder?: string
}

export function SearchSection({ onSearch, isLoading, placeholder }: SearchSectionProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSearch(inputValue.trim())
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
          
          <div className="relative glass-card rounded-xl p-2">
            <div className="flex items-center gap-2">
              <div className="pl-4">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3 px-2 text-base"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                variant="glow"
                size="lg"
                disabled={isLoading || !inputValue.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    探索知识
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['什么是 Transformer？', 'LLM 的训练流程', '注意力机制详解', 'RAG 架构是什么？'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInputValue(suggestion)
              onSearch(suggestion)
            }}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-sm bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border-light transition-all disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
