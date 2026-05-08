import { useState } from "react"
import type { MathAnswer } from "../../types"
import { Badge } from "@/components/ui/badge"
import { Sigma, GraduationCap, Rocket, Lightbulb, Calculator, ChevronDown } from "lucide-react"
import { Formula } from "../Formula"
import { RichText } from "../RichText"

export function MathView({ data }: { data: MathAnswer }) {
  const [calcOpen, setCalcOpen] = useState(false)
  return (
    <div className="space-y-4">
      {/* 公式区 */}
      <div className="rounded-md border border-border bg-muted/50 p-5">
        <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Sigma className="h-3 w-3" />
          核心公式
        </div>
        <div className="text-center text-foreground overflow-x-auto">
          <Formula tex={data.formula} />
        </div>
      </div>

      <div className="rounded-md border border-border bg-background-secondary p-3 flex items-start gap-2 text-sm">
        <Lightbulb className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
        <div className="text-foreground/90"><RichText text={data.intuition} /></div>
      </div>

      {/* 代入 token 演算 — 默认折叠，只展示摘要 */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <button
          type="button"
          onClick={() => setCalcOpen(!calcOpen)}
          className="w-full flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">代入实际 token 演算</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-primary transition-transform duration-200 ${calcOpen ? "rotate-180" : ""}`} />
        </button>
        {!calcOpen && (
          <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
            {data.calculationExample.slice(0, 100)}…
          </p>
        )}
        {calcOpen && (
          <div className="mt-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-line font-mono bg-card/60 rounded-md p-3 border border-border/40 animate-fade-in-up">
            <RichText text={data.calculationExample} />
          </div>
        )}
      </div>

      {/* 变量表 */}
      <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-b border-border/60">变量在训练 vs 推理阶段的角色</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground border-b border-border/40">
              <th className="text-left py-2 px-3">变量</th>
              <th className="text-left py-2 px-3">含义</th>
              <th className="text-left py-2 px-3">训练阶段</th>
              <th className="text-left py-2 px-3">推理阶段</th>
            </tr>
          </thead>
          <tbody>
            {data.variables.map((v, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                <td className="py-2 px-3">
                  <Badge variant="outline" className="text-[11px] px-2">
                    <Formula tex={v.symbol} inline />
                  </Badge>
                </td>
                <td className="py-2 px-3 text-foreground/80 text-xs"><RichText text={v.meaning} /></td>
                <td className="py-2 px-3 text-foreground/90 text-xs"><RichText text={v.trainRole} /></td>
                <td className="py-2 px-3 text-foreground/90 text-xs"><RichText text={v.inferRole} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 训练 / 推理两栏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-background-secondary p-3">
          <div className="flex items-center gap-2 mb-2 text-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="font-medium text-sm">训练阶段</span>
          </div>
          <div className="text-xs leading-relaxed text-foreground/80"><RichText text={data.trainFlow} /></div>
        </div>
        <div className="rounded-md border border-border bg-background-secondary p-3">
          <div className="flex items-center gap-2 mb-2 text-foreground">
            <Rocket className="h-4 w-4" />
            <span className="font-medium text-sm">推理阶段</span>
          </div>
          <div className="text-xs leading-relaxed text-foreground/80"><RichText text={data.inferFlow} /></div>
        </div>
      </div>
    </div>
  )
}
