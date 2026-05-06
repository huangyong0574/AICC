import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Users, Building2, Code2 } from "lucide-react"
import { FEYNMAN_ROLES } from "../types"
import type { FeynmanWarmupQuestion } from "../types"

const ICONS: Record<string, any> = {
  biz: Users,
  cto: Building2,
  dev: Code2,
}

/**
 * 费曼预热卡：学习者在看六问讲解之前先看到这 3 个问题，
 * 让 TA 带着问题去听讲解（不需要立即作答，讲完后会回到 FeynmanDigest 填答案）。
 * 
 * @param questions LLM 动态生成的 3 个预热问题（可选，未加载时显示骨架屏）
 * @param loading 是否正在加载问题
 */
export function FeynmanPrime({
  questions,
  loading,
}: {
  questions?: FeynmanWarmupQuestion[]
  loading?: boolean
}) {
  // 合并 FEYNMAN_ROLES 和动态问题
  const merged = FEYNMAN_ROLES.map(r => ({
    ...r,
    question: questions?.find(q => q.role === r.key)?.question,
  }))

  // 渐进式显示：LLM 一次性返回 3 条，但前端逐条展示，减少等待感
  const [visibleCount, setVisibleCount] = useState(0)
  useEffect(() => {
    if (!questions || questions.length === 0) {
      setVisibleCount(0)
      return
    }
    // 第一条立即显示
    setVisibleCount(1)
    const t1 = setTimeout(() => setVisibleCount(2), 400)
    const t2 = setTimeout(() => setVisibleCount(3), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [questions])

  return (
    <Card className="border-border bg-background-secondary">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
            <Brain className="h-4 w-4" />
          </div>
          10分钟后，轻松回答客户的3个问题
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {/* 提前展示角色标签 + 逐条加载指示器 */}
            {merged.map((r, i) => {
              const Icon = ICONS[r.key]
              // loading 期间 + visibleCount 未达到此条时，显示骨架
              const isReady = questions?.some(q => q.role === r.key) && (i < visibleCount)
              return (
                <div
                  key={r.key}
                  className="group rounded-xl border border-border bg-card overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* 角色标签 — 顶部，始终显示 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/50">
                    <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-muted/80 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="text-xs text-muted-foreground leading-snug">{r.label}</div>
                    <Badge variant="outline" className="ml-auto font-mono text-[10px] px-2 py-0 border-primary/30 text-primary">
                      Q{i + 1}
                    </Badge>
                  </div>

                  {/* 问题区域 — 加载中显示骨架 + 进度文案 */}
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/[0.02] to-transparent border-l-[3px] border-primary/20 min-h-[3.5rem]">
                    {!isReady ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs">{r.loadingText}</span>
                      </div>
                    ) : (
                      <div className="text-[15px] font-semibold text-foreground leading-relaxed tracking-tight">
                        "{r.question}"
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {merged.map((r, i) => {
              const Icon = ICONS[r.key]
              // 非 loading 状态也要渐进式显示
              const isVisible = i < visibleCount
              if (!isVisible) return null
              return (
                <div
                  key={r.key}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  {/* 角色标签 — 顶部，小字号浅灰 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/50">
                    <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-muted/80 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="text-xs text-muted-foreground leading-snug">{r.label}</div>
                    <Badge variant="outline" className="ml-auto font-mono text-[10px] px-2 py-0 border-primary/30 text-primary">
                      Q{i + 1}
                    </Badge>
                  </div>

                  {/* 问题主体 — 下方，大字号、深色、带左色条 */}
                  {r.question && (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/[0.03] to-transparent border-l-[3px] border-primary/50">
                      <div className="text-[15px] font-semibold text-foreground leading-relaxed tracking-tight">
                        "{r.question}"
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
