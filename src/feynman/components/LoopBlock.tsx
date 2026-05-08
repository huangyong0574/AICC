import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Sparkles, Clock } from "lucide-react"
import type { LoopCheck } from "../types"

/**
 * 步骤末尾的闭环问题占位。
 * 本轮只做展示 + 输入占位，下一轮接入 LLM 评价。
 */
export function LoopBlock({
  loop,
  stepLabel,
}: {
  loop: LoopCheck
  stepLabel: string
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {stepLabel} 闭环小练习
          </span>
        </div>
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground font-mono text-[10px]">
          <Clock className="h-3 w-3 mr-1" />
          下一轮开放 LLM 评价
        </Badge>
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
        {loop.prompt}
      </div>

      <Textarea
        placeholder="先别急，想 30 秒再用自己的话写一写……（此处为占位，暂不触发评价）"
        className="min-h-[90px] text-xs"
        disabled
      />

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>当前版本：输入占位；下一轮会加入 LLM 评分 + 下一步解锁逻辑</span>
      </div>
    </div>
  )
}
