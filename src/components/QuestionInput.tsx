import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, ArrowRight } from 'lucide-react'
import { quickSuggestions } from '@/data/mockData'

interface QuestionInputProps {
  onSubmit: (query: string) => void
  isProcessing: boolean
}

export function QuestionInput({ onSubmit, isProcessing }: QuestionInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isProcessing) inputRef.current?.focus()
  }, [isProcessing])

  const handleSubmit = () => {
    const q = value.trim()
    if (q && !isProcessing) {
      onSubmit(q)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'var(--gradient-layer-spectrum)', filter: 'blur(120px)' }}
      />

      {/* Title */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          <span className="spectrum-text">逐层拆解</span>
          <span className="text-foreground">，一问即懂</span>
        </h1>
        <p className="text-foreground-muted text-lg max-w-lg mx-auto leading-relaxed">
          输入你的 AI 技术问题，系统将按商业→应用→工程→数学四层递进为你解构
        </p>
      </div>

      {/* Input area */}
      <div className="w-full max-w-2xl relative z-10">
        <div className="relative group">
          {/* Hover glow */}
          <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{ background: 'var(--gradient-layer-spectrum)', padding: '1px' }}
          >
            <div className="w-full h-full rounded-2xl bg-card" />
          </div>

          <div className="relative glass-card rounded-2xl p-3">
            <div className="flex items-start gap-3">
              <div className="pt-3 pl-2">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的 AI 技术问题..."
                rows={2}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-2 px-1 text-base resize-none leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !value.trim()}
                className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: value.trim() ? 'var(--gradient-layer-spectrum)' : 'hsl(var(--muted))',
                  color: value.trim() ? 'hsl(0 0% 100%)' : 'hsl(var(--muted-foreground))',
                }}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    解构中
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始探索
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {quickSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setValue(s)
                onSubmit(s)
              }}
              disabled={isProcessing}
              className="px-4 py-2 rounded-full text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border-light hover:bg-card-hover transition-all disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Micro-help */}
        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          Enter 发送 · 四层递进：客户价值 → 应用表现 → 工程机制 → 数学本质
        </p>
      </div>
    </div>
  )
}
