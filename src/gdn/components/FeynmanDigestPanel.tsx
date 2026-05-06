import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Building2, Users, Code2, Loader2, Wand2, Network, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { FeynmanAnswers, FeynmanDigest, FeynmanReviewItem, LlmConfig } from "../types"
import { FEYNMAN_ROLES } from "../types"
import { callFeynmanReview } from "../lib/llm"
import { upsertGraph } from "../lib/storage"

const ICONS: Record<string, any> = { biz: Users, cto: Building2, dev: Code2 }

/** 步骤讲解内容的最小上下文投影：只要 key + answer 即可给 LLM 参考 */
export type DigestContext = Array<{ key: string; answer: any }>

export function FeynmanDigestPanel({
  topic,
  rawQuestion,
  context,
  cfg,
  onDigest,
}: {
  topic: string
  rawQuestion: string
  context: DigestContext
  cfg: LlmConfig
  onDigest: (d: FeynmanDigest) => void
}) {
  const [answers, setAnswers] = useState<FeynmanAnswers>({ biz: "", cto: "", dev: "" })
  const [loading, setLoading] = useState(false)
  const [digest, setDigest] = useState<FeynmanDigest | null>(null)

  const hasAny = Object.values(answers).some(v => v.trim().length > 0)

  async function submit() {
    if (!hasAny) return toast.error("请至少回答一个角色的问题（只有回答过的才会存到知识图谱）")
    if (!cfg.apiKey) return toast.error("请先配置 API Key")
    setLoading(true)
    try {
      const { reviews, graph } = await callFeynmanReview(rawQuestion, topic, context, answers, cfg)
      const d: FeynmanDigest = { answers, reviews, graphDelta: graph }
      setDigest(d)
      upsertGraph(graph)
      onDigest(d)
      toast.success(`已评估并挂载到知识图谱：${graph.concept} ← ${graph.parent}`)
    } catch (e: any) {
      toast.error(e.message || "评估失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
            <Brain className="h-4 w-4" />
          </div>
          费曼内化 · 用自己的话讲给三类听众
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="text-xs text-muted-foreground border-l-2 border-foreground/20 pl-3">
          只有 <b className="text-foreground">写出文字</b> 的回答才会沉淀到知识图谱。空着的角色会被记为"未作答"。
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEYNMAN_ROLES.map(r => {
            const Icon = ICONS[r.key]
            return (
              <div key={r.key} className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-foreground" />
                  <div className="text-sm font-medium">{r.label}</div>
                </div>
                <div className="text-[11px] text-muted-foreground">{r.hint}</div>
                <Textarea
                  value={answers[r.key]}
                  onChange={e => setAnswers({ ...answers, [r.key]: e.target.value })}
                  placeholder="用 TA 能听懂的语言讲……"
                  className="min-h-[120px] text-xs"
                />
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end">
          <Button variant="glow" onClick={submit} disabled={loading || !hasAny}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            提交 · LLM 评估 + 图谱挂载
          </Button>
        </div>

        {digest && <DigestResult digest={digest} />}
      </CardContent>
    </Card>
  )
}

function DigestResult({ digest }: { digest: FeynmanDigest }) {
  return (
    <div className="animate-fade-in-up rounded-lg border border-success/30 bg-success/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-success text-sm">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">评估完成 · 已挂到知识图谱</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {digest.reviews.map(r => <ReviewCard key={r.role} r={r} />)}
      </div>

      <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-primary text-sm mb-2">
          <Network className="h-4 w-4" />
          <span className="font-medium">知识图谱挂载</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <KV label="概念">{digest.graphDelta.concept}</KV>
          <KV label="父节点">{digest.graphDelta.parent}</KV>
          <KV label="关系" span>{digest.graphDelta.relation}</KV>
          <KV label="精髓" span>{digest.graphDelta.oneLine}</KV>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {digest.graphDelta.tags.map((t, i) => (
            <Badge key={i} variant="outline" className="font-mono text-[10px]">{t}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ r }: { r: FeynmanReviewItem }) {
  const label = FEYNMAN_ROLES.find(x => x.key === r.role)?.label || r.role
  const Icon = ICONS[r.role] || Brain
  const scoreClass = r.score >= 80 ? "text-success" : r.score >= 60 ? "text-warning" : "text-destructive"
  return (
    <div className="rounded-md border border-border/60 bg-background/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-lg font-bold font-mono ${scoreClass}`}>{r.score}</span>
      </div>
      <div className="text-xs text-foreground/80">{r.oneLine}</div>
      <MiniList title="到位" items={r.strengths} tone="success" />
      <MiniList title="缺口" items={r.gaps} tone="warning" />
      <MiniList title="追问" items={r.followups} tone="primary" />
    </div>
  )
}

function MiniList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" | "primary" }) {
  if (!items || items.length === 0) return null
  const map = {
    success: "text-success",
    warning: "text-warning",
    primary: "text-primary",
  }
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wider ${map[tone]} mb-0.5`}>{title}</div>
      <ul className="space-y-0.5">
        {items.map((x, i) => (
          <li key={i} className="text-[11px] text-foreground/80 flex gap-1">
            <span className="text-muted-foreground">·</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KV({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? "col-span-2 md:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground/90">{children}</div>
    </div>
  )
}
