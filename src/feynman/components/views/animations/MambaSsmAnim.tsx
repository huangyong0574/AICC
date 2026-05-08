// Mamba / SSM：状态 h 沿时间步递推，每步接收 x_t 更新 h_t，输出 y_t
import { useEffect, useState } from "react"

export function MambaSsmAnim() {
  const [t, setT] = useState(0)
  const steps = 6

  useEffect(() => {
    const id = setInterval(() => setT(p => (p + 1) % (steps + 1)), 900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">状态空间模型：<span className="font-mono text-foreground">h_t = A·h_{"{t-1}"} + B·x_t</span>，<span className="font-mono text-foreground">y_t = C·h_t</span></div>
      <div className="relative h-40 rounded-md border border-border/60 bg-background/40 p-3 overflow-hidden">
        <svg viewBox="0 0 480 140" className="h-full w-full">
          {/* 时间轴线 */}
          <line x1="20" y1="70" x2="460" y2="70" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.3" strokeDasharray="3 3" />
          {Array.from({ length: steps }).map((_, i) => {
            const x = 40 + (i * 400) / (steps - 1)
            const active = i <= t
            const hl = i === t
            return (
              <g key={i}>
                {/* x_t 向下箭头 */}
                <line x1={x} y1="15" x2={x} y2="55" stroke={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeOpacity={active ? 0.9 : 0.3} strokeWidth={hl ? 2 : 1} />
                <text x={x} y="12" textAnchor="middle" fontSize="10" fill={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} className="font-mono">x{i + 1}</text>

                {/* 状态 h_t */}
                <rect x={x - 14} y="60" width="28" height="20" rx="5" fill={hl ? "hsl(var(--accent))" : active ? "hsl(var(--accent))" : "hsl(var(--muted))"} fillOpacity={hl ? 0.9 : active ? 0.4 : 0.2} stroke="hsl(var(--accent))" strokeOpacity={active ? 0.8 : 0.3} />
                <text x={x} y="74" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))" className="font-mono">h{i + 1}</text>

                {/* y_t 向下箭头 */}
                <line x1={x} y1="85" x2={x} y2="120" stroke={active ? "hsl(var(--success))" : "hsl(var(--muted-foreground))"} strokeOpacity={active ? 0.9 : 0.3} strokeWidth={hl ? 2 : 1} />
                <text x={x} y="132" textAnchor="middle" fontSize="10" fill={active ? "hsl(var(--success))" : "hsl(var(--muted-foreground))"} className="font-mono">y{i + 1}</text>

                {/* 递推箭头 */}
                {i < steps - 1 && (
                  <line x1={x + 14} y1="70" x2={40 + ((i + 1) * 400) / (steps - 1) - 14} y2="70" stroke="hsl(var(--accent))" strokeOpacity={active ? 0.8 : 0.2} strokeWidth="1.5" markerEnd="url(#arr-ssm)" />
                )}
              </g>
            )
          })}
          <defs>
            <marker id="arr-ssm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--accent))" />
            </marker>
          </defs>
        </svg>
      </div>
      <div className="text-[11px] text-muted-foreground">每一步只带着一个状态 h 向前走，算力随 N 线性增长</div>
    </div>
  )
}
