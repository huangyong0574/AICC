import { Loader2 } from 'lucide-react'

interface ProcessingOverlayProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { label: '理解问题意图', desc: '解析你的问题，识别核心概念' },
  { label: '四层结构化拆解', desc: '按商业→应用→工程→数学递进分解' },
  { label: '生成业务素材', desc: '输出可直接使用的话术与方案框架' },
  { label: '构建知识关联', desc: '连接概念节点，生成图谱' },
]

export function ProcessingOverlay({ currentStep }: ProcessingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-2 border-border" />
        <div
          className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: 'hsl(var(--layer-1))',
            borderRightColor: 'hsl(var(--layer-2))',
          }}
        />
        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-foreground-muted animate-spin" style={{ animationDirection: 'reverse' }} />
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-sm">
        {steps.map((step, i) => {
          const isActive = i === currentStep
          const isDone = i < currentStep
          const isPending = i > currentStep
          return (
            <div
              key={i}
              className="flex items-center gap-3 transition-all duration-300"
              style={{ opacity: isPending ? 0.3 : 1 }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? `hsl(var(--layer-${i + 1}))`
                    : isActive
                    ? `hsl(var(--layer-${i + 1}) / 0.2)`
                    : 'hsl(var(--muted))',
                  color: isDone
                    ? 'hsl(0 0% 100%)'
                    : isActive
                    ? `hsl(var(--layer-${i + 1}))`
                    : 'hsl(var(--muted-foreground))',
                  boxShadow: isActive ? `0 0 16px hsl(var(--layer-${i + 1}) / 0.4)` : 'none',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
