import { useState, useCallback } from 'react'
import { QuestionInput } from './components/QuestionInput'
import { ProcessingOverlay } from './components/ProcessingOverlay'
import { FourLayerContent } from './components/FourLayerContent'
import { MaterialGenerator } from './components/MaterialGenerator'
import { FeynmanCheck } from './components/FeynmanCheck'
import { KnowledgeGraphView } from './components/KnowledgeGraphView'
import { sampleResult } from './data/mockData'
import { Layers, BookOpen, Network, PenLine, RotateCcw } from 'lucide-react'
import { cn } from './lib/utils'

type AppState = 'input' | 'processing' | 'result'
type ResultTab = 'layers' | 'materials' | 'feynman' | 'graph'

function App() {
  const [appState, setAppState] = useState<AppState>('input')
  const [query, setQuery] = useState('')
  const [processingStep, setProcessingStep] = useState(0)
  const [activeTab, setActiveTab] = useState<ResultTab>('layers')

  const handleSubmit = useCallback((q: string) => {
    setQuery(q)
    setAppState('processing')
    setProcessingStep(0)

    // Simulate four processing steps
    const stepDuration = 900
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        setProcessingStep(i + 1)
        if (i === 3) {
          setTimeout(() => {
            setAppState('result')
            setActiveTab('layers')
          }, 600)
        }
      }, (i + 1) * stepDuration)
    }
  }, [])

  const handleReset = () => {
    setAppState('input')
    setQuery('')
    setProcessingStep(0)
  }

  const tabs: { id: ResultTab; label: string; icon: typeof Layers }[] = [
    { id: 'layers', label: '四层解构', icon: Layers },
    { id: 'materials', label: '业务素材', icon: BookOpen },
    { id: 'feynman', label: '费曼自检', icon: PenLine },
    { id: 'graph', label: '知识图谱', icon: Network },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ─── Input State ─── */}
      {appState === 'input' && (
        <QuestionInput onSubmit={handleSubmit} isProcessing={false} />
      )}

      {/* ─── Processing State ─── */}
      {appState === 'processing' && (
        <div className="min-h-screen flex items-center justify-center">
          <ProcessingOverlay currentStep={processingStep} totalSteps={4} />
        </div>
      )}

      {/* ─── Result State ─── */}
      {appState === 'result' && (
        <div className="animate-fade-in">
          {/* Top bar */}
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  新问题
                </button>
                <div className="h-4 w-px bg-border flex-shrink-0" />
                <p className="text-sm text-foreground truncate">{query}</p>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="max-w-4xl mx-auto px-6">
              <div className="flex gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                        isActive
                          ? 'text-foreground border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border-light'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </header>

          {/* Content area */}
          <main className="max-w-4xl mx-auto px-6 py-8">
            {activeTab === 'layers' && (
              <FourLayerContent layers={sampleResult.layers} />
            )}
            {activeTab === 'materials' && (
              <MaterialGenerator materials={sampleResult.materials} />
            )}
            {activeTab === 'feynman' && (
              <FeynmanCheck items={sampleResult.feynmanChecks} />
            )}
            {activeTab === 'graph' && (
              <KnowledgeGraphView nodes={sampleResult.graphNodes} />
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App
