import { useMemo } from "react"
import { SiteHeader, type NavPage } from "./SiteHeader"
import { useCognition, type CognitionStateValue } from "../lib/cognition"
import { radarWeekData } from "../data/radarData"

interface GraphPageProps {
  onNavigate: (page: NavPage) => void
}

type NodeState = CognitionStateValue

interface GraphNode {
  id: string
  num: string
  titleEn: string
  title: string
  cluster: string
}

/* 节点来自本周雷达数据（与认知状态机同一份 id），按成熟度聚类 */
const CLUSTER_LABEL: Record<string, string> = {
  frontier: "FRONTIER",
  mature: "MATURE",
}

const NODES: GraphNode[] = radarWeekData.insights.map((ins) => ({
  id: ins.id,
  num: String(ins.index).padStart(2, "0"),
  titleEn: ins.eyebrow,
  title: ins.title,
  cluster: ins.maturity,
}))

function nodeColor(state: NodeState): string {
  if (state === "in-plan") return "hsl(var(--frontier))"
  if (state === "learning") return "hsl(var(--learning))"
  if (state === "published") return "hsl(var(--published))"
  return "hsl(var(--muted-foreground) / 0.4)"
}

const VIEW_W = 1200
const VIEW_H = 560

export function GraphPage({ onNavigate }: GraphPageProps) {
  const { map } = useCognition()

  // 聚类中心 + 节点布局（仅依赖静态 NODES，与状态无关）
  const { clusters, positions } = useMemo(() => {
    const byCluster: Record<string, GraphNode[]> = {}
    NODES.forEach((n) => {
      ;(byCluster[n.cluster] ||= []).push(n)
    })
    const names = Object.keys(byCluster)
    const centers: Record<string, { x: number; y: number }> = {}
    names.forEach((c, i) => {
      // 横向均匀铺开各聚类
      const x = VIEW_W * ((i + 1) / (names.length + 1))
      centers[c] = { x, y: VIEW_H / 2 - 10 }
    })
    const pos: Record<string, { x: number; y: number }> = {}
    names.forEach((c) => {
      const arr = byCluster[c]
      const ctr = centers[c]
      const radius = 92
      arr.forEach((n, i) => {
        const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2
        pos[n.id] = { x: ctr.x + Math.cos(angle) * radius, y: ctr.y + Math.sin(angle) * radius }
      })
    })
    return {
      clusters: names.map((c) => ({ name: c, center: centers[c] })),
      positions: pos,
    }
  }, [])

  const stateOf = (id: string): NodeState => map[id]?.state || "discovered"
  const activatedCount = NODES.filter((n) => stateOf(n.id) !== "discovered").length

  return (
    <div className="graph-page min-h-screen bg-background text-foreground">
      <style>{GRAPH_CSS}</style>
      <SiteHeader activePage="graph" onNavigate={onNavigate} />

      <main>
        <div className="container">
          <section className="page-hero">
            <div className="hero-kicker">
              <span className="pulse" />
              <span>Knowledge Graph · 累积视图</span>
            </div>
            <h1>累积图谱</h1>
            <p className="lede">
              把每周雷达的认知点沉淀为长期的知识网络。已加入计划的节点用色彩突出，未涉及的保持灰色，便于一眼看出“我学到了什么，缺什么”。
            </p>
          </section>

          <div className="toolbar">
            <div className="legend">
              <span className="legend-item"><span className="legend-dot discovered" />未加入</span>
              <span className="legend-item"><span className="legend-dot in-plan" />待启动</span>
              <span className="legend-item"><span className="legend-dot learning" />学习中</span>
              <span className="legend-item"><span className="legend-dot published" />已成稿</span>
            </div>
            <div className="toolbar-meta">{NODES.length} 节点 · {activatedCount} 已激活</div>
          </div>

          <div className="graph-frame">
            <svg className="graph-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
              {/* cluster halos + labels */}
              {clusters.map((c) => (
                <g key={`halo-${c.name}`}>
                  <circle
                    cx={c.center.x}
                    cy={c.center.y}
                    r={150}
                    fill="hsl(var(--secondary) / 0.5)"
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={c.center.x}
                    y={c.center.y - 158}
                    textAnchor="middle"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2, fill: "hsl(var(--muted-foreground))" }}
                  >
                    {CLUSTER_LABEL[c.name] || c.name.toUpperCase()}
                  </text>
                </g>
              ))}

              {/* connection lines: center → node */}
              {clusters.map((c) =>
                NODES.filter((n) => n.cluster === c.name).map((n) => {
                  const p = positions[n.id]
                  return (
                    <line
                      key={`line-${n.id}`}
                      x1={c.center.x}
                      y1={c.center.y}
                      x2={p.x}
                      y2={p.y}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                  )
                }),
              )}

              {/* nodes */}
              {NODES.map((n) => {
                const p = positions[n.id]
                const st = stateOf(n.id)
                const color = nodeColor(st)
                const r = st === "discovered" ? 11 : 14
                return (
                  <g key={n.id} style={{ cursor: "pointer" }} onClick={() => onNavigate("radar")}>
                    <title>{`${n.titleEn} · ${n.title} (${st})`}</title>
                    {st !== "discovered" && (
                      <circle cx={p.x} cy={p.y} r={r + 5} fill={color} opacity={0.18} />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill={st === "discovered" ? "hsl(var(--background))" : color}
                      stroke={st === "discovered" ? "hsl(var(--muted-foreground) / 0.5)" : color}
                      strokeWidth={1.5}
                      strokeDasharray={st === "discovered" ? "3 3" : undefined}
                    />
                    <text
                      x={p.x}
                      y={p.y + 4}
                      textAnchor="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 600,
                        fill: st === "discovered" ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                      }}
                    >
                      {n.num}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + r + 16}
                      textAnchor="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fill: st === "discovered" ? "hsl(var(--muted-foreground) / 0.7)" : "hsl(var(--foreground))",
                      }}
                    >
                      {n.titleEn}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <section className="week-section">
            <h2>
              {radarWeekData.weekId} <span className="badge">{radarWeekData.dateRange}</span>
            </h2>
            <div className="week-strip">
              {NODES.map((n) => {
                const st = stateOf(n.id)
                return (
                  <button key={n.id} className={`node-chip ${st}`} onClick={() => onNavigate("radar")}>
                    <span className="node-num">{n.num}</span>
                    <div className="node-body">
                      <div className="node-en">{n.titleEn}</div>
                      <div className="node-title">{n.title}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      <footer className="graph-footer">
        <div className="container">AICC · Cumulative Knowledge Graph · 每周累积，持续生长</div>
      </footer>
    </div>
  )
}

/* 端口自 aicc-html-bundle/graph.html，作用域收敛到 .graph-page */
const GRAPH_CSS = `
.graph-page .container{max-width:1280px;margin:0 auto;padding:0 1.5rem}
.graph-page main{padding:64px 0 96px}
.graph-page .page-hero{margin-bottom:32px}
.graph-page .hero-kicker{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:18px}
.graph-page .hero-kicker .pulse{width:6px;height:6px;border-radius:9999px;background:hsl(var(--mature));box-shadow:0 0 0 4px hsl(var(--mature)/0.15)}
.graph-page .page-hero h1{font-size:clamp(2.25rem,5vw,3.5rem);font-weight:600;letter-spacing:-0.04em;line-height:1.05;margin-bottom:18px}
.graph-page .page-hero .lede{max-width:62ch;color:hsl(var(--muted-foreground));font-size:15.5px;line-height:1.7}
.graph-page .toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid hsl(var(--border));flex-wrap:wrap}
.graph-page .legend{display:inline-flex;align-items:center;gap:18px;flex-wrap:wrap;font-size:12px;color:hsl(var(--muted-foreground))}
.graph-page .legend-item{display:inline-flex;align-items:center;gap:6px}
.graph-page .legend-dot{width:10px;height:10px;border-radius:9999px}
.graph-page .legend-dot.discovered{background:hsl(var(--muted-foreground)/0.3);border:1px dashed hsl(var(--muted-foreground)/0.5)}
.graph-page .legend-dot.in-plan{background:hsl(var(--frontier))}
.graph-page .legend-dot.learning{background:hsl(var(--learning))}
.graph-page .legend-dot.published{background:hsl(var(--published))}
.graph-page .toolbar-meta{font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));letter-spacing:0.04em}
.graph-page .graph-frame{border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card));position:relative;overflow:hidden}
.graph-page .graph-svg{display:block;width:100%;height:560px}
.graph-page .week-section{margin-top:36px}
.graph-page .week-section h2{font-size:1rem;font-weight:600;letter-spacing:-0.01em;margin-bottom:14px;color:hsl(var(--foreground));display:inline-flex;align-items:center;gap:10px}
.graph-page .week-section h2 .badge{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground));padding:2px 8px;border:1px solid hsl(var(--border));border-radius:9999px;font-weight:500}
.graph-page .week-strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.graph-page .node-chip{display:grid;grid-template-columns:32px 1fr;gap:10px;align-items:center;padding:12px 14px;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card));transition:all 0.15s ease;cursor:pointer;text-align:left}
.graph-page .node-chip:hover{border-color:hsl(var(--foreground)/0.2);transform:translateY(-1px);box-shadow:0 4px 12px -6px hsl(var(--foreground)/0.12)}
.graph-page .node-chip.discovered{opacity:0.5;filter:grayscale(0.6)}
.graph-page .node-num{width:32px;height:32px;border-radius:9999px;background:hsl(var(--secondary));display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:600;color:hsl(var(--foreground));font-feature-settings:'tnum' 1}
.graph-page .node-chip.in-plan .node-num{background:hsl(var(--frontier)/0.15);color:hsl(var(--frontier))}
.graph-page .node-chip.learning .node-num{background:hsl(var(--learning)/0.15);color:hsl(var(--learning))}
.graph-page .node-chip.published .node-num{background:hsl(var(--published)/0.15);color:hsl(var(--published))}
.graph-page .node-body{min-width:0}
.graph-page .node-en{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.graph-page .node-title{font-size:13px;font-weight:500;color:hsl(var(--foreground));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.graph-page .graph-footer{border-top:1px solid hsl(var(--border));padding:24px 0;font-size:12px;color:hsl(var(--muted-foreground));font-family:var(--font-mono);letter-spacing:0.04em;margin-top:48px}
`
