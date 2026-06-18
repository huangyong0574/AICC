import { ArrowRight, Building2, Check, Cpu, ExternalLink, Plus, RotateCcw, Target } from 'lucide-react'
import type { RadarInsight } from '../../data/radarData'
import type { CognitionStateValue } from '../../lib/cognition'
import { MaturityPill } from './MaturityPill'

interface RadarCardProps {
  insight: RadarInsight
  /** 认知状态（undefined = 未加入 / discovered） */
  state?: CognitionStateValue
  /** learning 阶段费曼已确认步数（0–4） */
  progress?: number
  /** discovered → 加入深入计划 */
  onTogglePlan: () => void
  /** in-plan / learning / published → 进费曼（开始 / 继续 / 复习） */
  onOpenFeynman: () => void
}

export function RadarCard({ insight, state, progress, onTogglePlan, onOpenFeynman }: RadarCardProps) {
  // 仅「学习中」卡保留绿色 accent（左竖条 + 描边 + rail 底色），其余中性，状态靠底栏 CTA 区分
  const isLearning = state === 'learning'
  const cardCls = isLearning
    ? 'relative bg-card border border-[hsl(var(--mature)/0.5)] rounded-[var(--radius)] overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:border-foreground/20 hover:-translate-y-px hover:shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.15),0_2px_6px_hsl(var(--foreground)/0.04)] shadow-[inset_3px_0_0_hsl(var(--mature)),0_4px_16px_-8px_hsl(var(--mature)/0.18)]'
    : 'relative bg-card border border-border rounded-[var(--radius)] overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:border-foreground/20 hover:-translate-y-px hover:shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.15),0_2px_6px_hsl(var(--foreground)/0.04)]'
  const railBg = isLearning ? 'bg-[hsl(var(--mature)/0.06)]' : 'bg-secondary/50'

  return (
    <article className={cardCls}>
      <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] min-h-full">
        {/* Rail */}
        <div
          className={`${railBg} border-border flex flex-row sm:flex-col items-center justify-between sm:justify-between text-center gap-3 sm:gap-5 sm:py-9 sm:px-3.5 sm:pb-7 px-[18px] py-3.5 sm:border-r border-b sm:border-b-0`}
        >
          <div>
            <div className="font-mono font-medium tracking-[-0.05em] text-foreground leading-none text-[28px] sm:text-[44px] [font-feature-settings:'tnum'_1]">
              {String(insight.index).padStart(2, '0')}
            </div>
            <div className="hidden sm:block font-mono text-[9.5px] font-medium tracking-[0.22em] uppercase text-muted-foreground mt-2.5">
              Insight
            </div>
          </div>
          <MaturityPill maturity={insight.maturity} />
        </div>

        {/* Body */}
        <div className="p-6 sm:py-8 sm:px-9 sm:pb-7 min-w-0">
          <span className="block font-mono text-[10.5px] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">
            {insight.eyebrow}
          </span>
          <h2 className="text-[1.3rem] sm:text-[1.6rem] font-semibold tracking-[-0.025em] leading-[1.2] mb-1">
            {insight.title}
          </h2>
          <div className="text-[1rem] sm:text-[1.0625rem] font-normal text-foreground leading-[1.65] my-[18px] sm:mb-7 pl-[18px] border-l-2 border-foreground tracking-[-0.005em]">
            {insight.tagline}
          </div>

          <div className="mt-[22px]">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2.5">
              <Cpu style={{ width: 11, height: 11 }} />
              核心原理
            </div>
            <p className="text-[0.9375rem] leading-[1.78] tracking-[0.005em]" style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
              {insight.corePrinciple}
            </p>
          </div>

          <div className="mt-[22px]">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2.5">
              <Target style={{ width: 11, height: 11 }} />
              为什么重要
            </div>
            <p className="text-[0.9375rem] leading-[1.78] tracking-[0.005em]" style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
              {insight.whyMatters}
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 mt-7 pt-5 border-t border-dashed border-border">
            <div className="inline-flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground flex-wrap">
              <Building2 style={{ width: 12, height: 12 }} />
              <span className="font-semibold text-foreground">{insight.org}</span>
              <span className="text-border">·</span>
              <span>{insight.dateRange}</span>
            </div>
            <a
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11.5px] text-foreground border-b border-border pb-px transition-[color,border-color] hover:border-foreground"
            >
              <ExternalLink style={{ width: 12, height: 12 }} />
              原文链接
            </a>
            <StatusCTA state={state} progress={progress} onAdd={onTogglePlan} onOpen={onOpenFeynman} />
          </div>
        </div>
      </div>
    </article>
  )
}

/** 底栏状态机入口：四态各司其职（加入 / 开始学习 / 继续学习 N/4 / 已掌握·复习） */
function StatusCTA({
  state,
  progress,
  onAdd,
  onOpen,
}: {
  state?: CognitionStateValue
  progress?: number
  onAdd: () => void
  onOpen: () => void
}) {
  const ghostBtn =
    'inline-flex items-center gap-1.5 h-8 rounded-full border font-medium text-[12.5px] whitespace-nowrap transition-all bg-card text-foreground border-border hover:bg-accent hover:border-foreground/30 active:scale-[0.97]'
  const primaryBtn =
    'inline-flex items-center gap-1.5 h-8 rounded-full border border-primary bg-primary text-primary-foreground font-medium text-[12.5px] whitespace-nowrap transition-all hover:opacity-90 active:scale-[0.97]'

  // discovered / 未加入
  if (!state || state === 'discovered') {
    return (
      <button type="button" onClick={onAdd} className={ghostBtn} style={{ padding: '0 12px' }}>
        <Plus style={{ width: 13, height: 13 }} />
        加入深入计划
      </button>
    )
  }

  // in-plan：已加入待启动
  if (state === 'in-plan') {
    return (
      <button type="button" onClick={onOpen} className={primaryBtn} style={{ padding: '0 14px' }}>
        开始学习
        <ArrowRight style={{ width: 13, height: 13 }} />
      </button>
    )
  }

  // published：已掌握 + 复习
  if (state === 'published') {
    return (
      <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-[hsl(var(--mature))]">
          <Check style={{ width: 13, height: 13 }} />
          已掌握
        </span>
        <button type="button" onClick={onOpen} className={ghostBtn} style={{ padding: '0 12px' }}>
          <RotateCcw style={{ width: 12, height: 12 }} />
          复习
        </button>
      </span>
    )
  }

  // learning：迷你进度条（4 步，learning 绿）+ 继续学习 · N/4
  const done = Math.max(0, Math.min(4, progress ?? 0))
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className="hidden sm:flex items-center gap-1" aria-hidden>
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className="rounded-full"
            style={{ width: 14, height: 4, background: i < done ? 'hsl(var(--mature))' : 'hsl(var(--border))' }}
          />
        ))}
      </span>
      <button type="button" onClick={onOpen} className={primaryBtn} style={{ padding: '0 14px' }}>
        继续学习 · {done}/4
        <ArrowRight style={{ width: 13, height: 13 }} />
      </button>
    </span>
  )
}
