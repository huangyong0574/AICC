// MoE 路由：输入 token 被路由到 Top-K 专家，展示负载不均
import { useEffect, useState } from "react"

const EXPERTS = ["E1", "E2", "E3", "E4", "E5", "E6"]
const TOKENS = [
  { label: "t₁", top: [0, 2] },
  { label: "t₂", top: [0, 1] },
  { label: "t₃", top: [0, 3] },
  { label: "t₄", top: [2, 5] },
  { label: "t₅", top: [0, 2] },
  { label: "t₆", top: [1, 4] },
]

export function MoeRouteAnim() {
  const [cur, setCur] = useState(0)
  const [loads, setLoads] = useState<number[]>(() => EXPERTS.map(() => 0))

  useEffect(() => {
    setLoads(EXPERTS.map(() => 0))
    let i = 0
    const id = setInterval(() => {
      setCur(i)
      setLoads(prev => {
        const next = [...prev]
        TOKENS[i].top.forEach(k => (next[k] += 1))
        return next
      })
      i++
      if (i >= TOKENS.length) {
        clearInterval(id)
        setTimeout(() => {
          setLoads(EXPERTS.map(() => 0))
          setCur(-1)
        }, 1500)
      }
    }, 700)
    return () => clearInterval(id)
  }, [])

  const maxLoad = Math.max(1, ...loads)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* 左：token 流 */}
        <div>
          <div className="text-[11px] text-muted-foreground mb-1.5">Token 流</div>
          <div className="space-y-1">
            {TOKENS.map((t, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs font-mono transition-all ${
                  i === cur ? "text-primary scale-110" : i < cur ? "text-muted-foreground/60" : "text-muted-foreground"
                }`}
              >
                <span className="w-6">{t.label}</span>
                {i === cur && <span className="text-[10px] text-foreground">→ {t.top.map(k => EXPERTS[k]).join(", ")}</span>}
              </div>
            ))}
          </div>
        </div>
        {/* 右：专家负载条 */}
        <div>
          <div className="text-[11px] text-muted-foreground mb-1.5">专家负载（Top-2 路由）</div>
          <div className="space-y-1.5">
            {EXPERTS.map((e, i) => {
              const w = (loads[i] / maxLoad) * 100
              const hot = loads[i] >= 3
              return (
                <div key={e} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-mono text-muted-foreground">{e}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full transition-all ${hot ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <span className={`w-6 font-mono ${hot ? "text-warning" : "text-foreground/70"}`}>{loads[i]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-warning/80 border-l-2 border-warning/60 pl-2">
        专家 E1 被抢爆（热门），E6 几乎闲置 —— 这就是"负载不均"问题
      </div>
    </div>
  )
}
