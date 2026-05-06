import { Check, Loader2, Brain, Database, Filter, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProcessingStep {
  id: string
  label: string
  description: string
  icon: string
}

interface ProcessingFlowProps {
  steps: ProcessingStep[]
  currentStep: number
}

const iconMap = {
  brain: Brain,
  database: Database,
  filter: Filter,
  fileText: FileText,
}

export function ProcessingFlow({ steps, currentStep }: ProcessingFlowProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        知识处理流程
      </h3>
      
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const Icon = iconMap[step.icon as keyof typeof iconMap]
          const isCompleted = currentStep > index + 1
          const isActive = currentStep === index + 1
          const isPending = currentStep <= index
          
          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-full w-full h-0.5 -translate-y-1/2 z-0">
                  <div className={cn(
                    'h-full transition-all duration-500',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )} />
                  {isActive && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary animate-flow-line"
                      style={{ 
                        backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 8px, transparent 8px, transparent 16px)',
                        backgroundSize: '100% 100%'
                      }}
                    />
                  )}
                </div>
              )}
              
              {/* Step card */}
              <div className={cn(
                'relative z-10 rounded-lg p-4 border transition-all',
                isActive && 'border-primary bg-primary/10 step-active',
                isCompleted && 'border-border-light bg-card',
                isPending && 'border-border bg-card/50'
              )}>
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto transition-all',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-success text-success-foreground',
                  isPending && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <p className={cn(
                  'text-sm font-medium text-center',
                  isActive && 'text-primary',
                  isCompleted && 'text-foreground',
                  isPending && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
