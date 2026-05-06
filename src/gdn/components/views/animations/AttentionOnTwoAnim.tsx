// Attention 的 O(N²)：每个 token 都要看所有 token，连线密度随 N 爆炸
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

export function AttentionOnTwoAnim() {
  const [n, setN] = useState(4)
  const tokens = Array.from({ length: n }).map((_, i) => i)
  const conns = n * n

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Token 数：<span className="text-foreground font-mono">{n}</span> · 连线：<span className="text-warning font-mono">{conns}</span></div>
        <div className="flex gap-1">
          {[2, 4, 6, 8].map(v => (
            <Button key={v} variant={v === n ? "default" : "outline"} size="sm" onClick={() => setN(v)} className="h-7 w-7 p-0 font-mono text-xs">
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative h-48 rounded-md border border-border/60 bg-background/40 overflow-hidden">
        <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full">
          {/* 连线 */}
          {tokens.map(i =>
            tokens.map(j => {
              const x1 = 40 + (320 / Math.max(1, n - 1)) * i
              const x2 = 40 + (320 / Math.max(1, n - 1)) * j
              return (
                <line key={`${i}-${j}`} x1={x1} y1="50" x2={x2} y2="130" stroke="hsl(var(--warning))" strokeOpacity="0.25" strokeWidth="1" />
              )
            }),
          )}
          {/* 上排 token */}
          {tokens.map(i => {
            const x = 40 + (320 / Math.max(1, n - 1)) * i
            return (
              <g key={`t-${i}`}>
                <circle cx={x} cy="50" r="10" fill="hsl(var(--primary))" fillOpacity="0.85" />
                <text x={x} y="54" textAnchor="middle" fontSize="9" fill="hsl(var(--primary-foreground))" className="font-mono">{i + 1}</text>
              </g>
            )
          })}
          {/* 下排 token */}
          {tokens.map(i => {
            const x = 40 + (320 / Math.max(1, n - 1)) * i
            return (
              <g key={`b-${i}`}>
                <circle cx={x} cy="130" r="10" fill="hsl(var(--accent))" fillOpacity="0.85" />
                <text x={x} y="134" textAnchor="middle" fontSize="9" fill="hsl(var(--accent-foreground))" className="font-mono">{i + 1}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Play className="h-3 w-3" />
        <span>调大 N，观察连线呈平方级增长 —— 这就是 Attention O(N²) 的本质</span>
      </div>
    </div>
  )
}
