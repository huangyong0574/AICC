import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

// GDN 机制动态演示：5 个 token 流 + 门控 + 状态仓库 + Query
const TOKENS = [
  { label: "token₁", value: "k₁v₁", g: 0.85, tip: "重要信息 · 大开门" },
  { label: "token₂", value: "k₂v₂", g: 0.25, tip: "常规信息 · 微开门" },
  { label: "token₃", value: "k₃v₃", g: 0.6, tip: "中等重要 · 半开门" },
  { label: "token₄", value: "k₄v₄", g: 0.1, tip: "噪声 · 几乎关闭" },
  { label: "token₅", value: "k₅v₅", g: 0.75, tip: "关键线索 · 开门" },
]

export function MechanismAnim() {
  const [step, setStep] = useState(-1) // -1: idle, 0..4: tokens, 5: query, 6: done
  const [gate, setGate] = useState(0)
  const [capacity, setCapacity] = useState(0)
  const [att, setAtt] = useState(0)
  const [gdn, setGdn] = useState(0)
  const [label, setLabel] = useState("准备播放……")
  const [seed, setSeed] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    clearAll()
    run()
    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  function clearAll() {
    timers.current.forEach(t => clearTimeout(t))
    timers.current = []
  }

  function run() {
    setStep(-1)
    setGate(0)
    setCapacity(0)
    setAtt(0)
    setGdn(0)
    setLabel("准备播放……")
    let s = 0
    let S = 0
    let attAcc = 0
    let gdnAcc = 0

    const playStep = () => {
      if (s >= TOKENS.length) {
        setStep(5)
        setLabel("查询到达：投影 o = S·q，不需遍历历史，直接从状态仓库出结果")
        timers.current.push(
          window.setTimeout(() => {
            setStep(6)
            setLabel(`播放完成 · Attention 共 ${attAcc} 次计算 vs GDN 仅 ${gdnAcc} 次，点「▶ 重播」再来一遍`)
          }, 2200),
        )
        return
      }
      const t = TOKENS[s]
      setStep(s)
      timers.current.push(
        window.setTimeout(() => setGate(t.g), 500),
      )
      timers.current.push(
        window.setTimeout(() => {
          const v = 20 + Math.random() * 10
          S = (1 - t.g) * S + t.g * v
          const pct = Math.min(100, Math.round(S * 1.8))
          setCapacity(pct)
          attAcc += s + 1
          gdnAcc += 1
          setAtt(attAcc)
          setGdn(gdnAcc)
          setLabel(`第 ${s + 1}/${TOKENS.length} 步：${t.tip} → S 按 g=${t.g.toFixed(2)} 写入`)
        }, 900),
      )
      s += 1
      timers.current.push(window.setTimeout(playStep, 1900))
    }
    timers.current.push(window.setTimeout(playStep, 400))
  }

  const currentTok = step >= 0 && step < TOKENS.length ? TOKENS[step] : null

  return (
    <div className="rounded-lg border border-border/60 bg-gradient-to-b from-card/60 to-background/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-primary flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          GDN 核心机制 · 动态演示
        </div>
        <Button variant="outline" size="sm" onClick={() => setSeed(x => x + 1)}>
          <Play className="mr-1 h-3 w-3" /> 重播
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1.6fr] gap-4 items-center">
        {/* Token 队列 */}
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            {currentTok && (
              <div
                key={step}
                className="flex flex-col items-center justify-center w-20 h-12 rounded-lg text-[11px] text-white shadow-lg animate-[fade-in-up_0.8s_cubic-bezier(.25,.8,.25,1)]"
                style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))" }}
              >
                <div className="font-bold">{currentTok.label}</div>
                <div className="opacity-80">{currentTok.value}</div>
              </div>
            )}
            {step === 5 && (
              <div
                key="q"
                className="flex flex-col items-center justify-center w-20 h-12 rounded-lg text-[11px] text-white shadow-lg animate-[fade-in-up_0.8s_cubic-bezier(.25,.8,.25,1)]"
                style={{ background: "linear-gradient(135deg,hsl(var(--warning)),hsl(var(--accent)))" }}
              >
                <div className="font-bold">query</div>
                <div className="opacity-80">q</div>
              </div>
            )}
          </div>
          <div className="absolute -top-1 left-0 text-[10px] text-muted-foreground">输入 token</div>
        </div>

        {/* 门控 */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-foreground">门控 gₜ</div>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="126"
              strokeDashoffset={126 * (1 - gate)}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset .7s ease" }}
            />
          </svg>
          <div className="text-[11px] font-semibold text-foreground">{gate.toFixed(2)}</div>
        </div>

        {/* 状态仓库 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] text-primary">状态仓库 Sₜ = (1−gₜ)·Sₜ₋₁ + gₜ·kₜvₜᵀ</div>
            <div className="text-[10px] text-muted-foreground">容量 {capacity}%</div>
          </div>
          <div className="h-5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${capacity}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--warning)))",
              }}
            />
          </div>
          {step >= 5 && (
            <div
              key={`beam-${seed}`}
              className="mt-2 h-[3px] rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--warning)) 40%, #fff)",
                boxShadow: "0 0 12px hsl(var(--warning))",
                animation: "expand-width 1.1s ease forwards",
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        <div className="text-xs text-foreground/80 min-h-[28px] leading-relaxed">{label}</div>
        {step >= 5 && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning animate-fade-in-up">
            <div className="font-semibold">o = S · q</div>
            <div className="text-[10px] opacity-80">直接查表，无需回望</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
          <div className="text-destructive font-medium">传统 Attention</div>
          <div className="text-foreground/70 font-mono">累计：{att} 次</div>
          <div className="text-[10px] text-muted-foreground">每步重扫全部历史 · O(N²)</div>
        </div>
        <div className="rounded-md border border-success/30 bg-success/5 p-2.5">
          <div className="text-success font-medium">GDN</div>
          <div className="text-foreground/70 font-mono">累计：{gdn} 次</div>
          <div className="text-[10px] text-muted-foreground">每步仅更新状态 · O(N)</div>
        </div>
      </div>
    </div>
  )
}
