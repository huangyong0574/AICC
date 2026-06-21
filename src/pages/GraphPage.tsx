import { useMemo } from "react"
import { SiteHeader, type NavPage } from "./SiteHeader"
import { useCognition, type CognitionStateValue } from "../lib/cognition"
import { useRadarArchive } from "../data/radarData"
import { loadArticleEdges } from "../lib/publishArticle"

interface GraphPageProps {
  onNavigate: (page: NavPage) => void
}

type NodeState = CognitionStateValue

interface GraphNode {
  /** 代表 id（最新一周的那条） */
  id: string
  /** 同一概念在各周出现的全部 id（按 slug 去重后聚合，用于取最远状态） */
  ids: string[]
  num: string
  titleEn: string
  title: string
  cluster: string
}

/* 节点 = 跨周累积的全部认知点（按概念 slug 去重），按"来源周"聚类 */
const STATE_RANK: Record<NodeState, number> = {
  discovered: 0,
  "in-plan": 1,
  learning: 2,
  published: 3,
}

/** 概念 slug：去掉 id 的 `{weekId}-{NN}-` 前缀 */
function conceptSlug(id: string): string {
  return id.replace(/^\d{4}-W\d{2}-\d{2}-/, "")
}

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
  const { weeks } = useRadarArchive()

  // 跨周累积所有认知点，按概念 slug 去重（同名概念合并为一个节点，聚合其全部周 id）
  const NODES: GraphNode[] = useMemo(() => {
    const bySlug = new Map<string, { ids: string[]; titleEn: string; title: string; cluster: string }>()
    for (const w of weeks) {
      for (const ins of w.insights) {
        const slug = conceptSlug(ins.id)
        const existing = bySlug.get(slug)
        if (existing) existing.ids.push(ins.id)
        else
          bySlug.set(slug, {
            ids: [ins.id],
            titleEn: ins.eyebrow,
            title: ins.title,
            cluster: ins.id.match(/^\d{4}-W\d{2}/)?.[0] ?? ins.maturity,
          })
      }
    }
    return Array.from(bySlug.values()).map((n, i) => ({
      id: n.ids[0],
      ids: n.ids,
      num: String(i + 1).padStart(2, "0"),
      titleEn: n.titleEn,
      title: n.title,
      cluster: n.cluster,
    }))
  }, [weeks])

  // 节点状态 = 其所有周 id 中最远的状态（discovered<in-plan<learning<published）
  const stateOf = useMemo(() => {
    return (node: GraphNode): NodeState => {
      let best: NodeState = "discovered"
      for (const id of node.ids) {
        const s = map[id]?.state
        if (s && STATE_RANK[s] > STATE_RANK[best]) best = s
      }
      return best
    }
  }, [map])

  // 第二大脑成长总览（真实数据，取代旧工作台的硬编码数字）
  const growth = useMemo(() => {
    const items = Object.values(map)
    const published = items.filter((v) => v.state === "published").length
    const learning = items.filter((v) => v.state === "learning").length
    const addedAts = items.map((v) => v.addedAt).filter((t): t is number => !!t)
    const days =
      addedAts.length > 0
        ? Math.max(1, Math.ceil((Date.now() - Math.min(...addedAts)) / 86400000))
        : 0
    return { published, learning, concepts: NODES.length, days }
  }, [map, NODES])

  // 聚类中心 + 节点布局（依赖 NODES，随最新一周数据变化）
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
  }, [NODES])

  // 关系边：费曼内化产出的 concept→parent；父节点排在底部一行
  const { relEdges, parentNodes } = useMemo(() => {
    const relOf = (n: GraphNode) => {
      for (const id of n.ids) {
        const r = map[id]?.relation
        if (r?.parent) return r
      }
      return null
    }
    const related = NODES.map((n) => ({ n, rel: relOf(n) })).filter((x) => x.rel) as Array<{
      n: GraphNode
      rel: { parent: string; text: string }
    }>
    const parents = Array.from(new Set(related.map((x) => x.rel.parent)))
    const pPos: Record<string, { x: number; y: number }> = {}
    parents.forEach((p, i) => {
      pPos[p] = { x: VIEW_W * ((i + 1) / (parents.length + 1)), y: VIEW_H - 24 }
    })
    const edges = related
      .map((x) => ({ id: x.n.id, from: positions[x.n.id], to: pPos[x.rel.parent] }))
      .filter((e) => e.from && e.to)
    return { relEdges: edges, parentNodes: parents.map((p) => ({ name: p, ...pPos[p] })) }
  }, [NODES, map, positions])

  // 文章连边：发布一篇融合多概念的成稿 → 在这些概念间画「成文连接」（学=节点，写=连边）
  const articleEdges = useMemo(() => {
    const posOf = (cid: string) => {
      const node = NODES.find((n) => n.ids.includes(cid) || conceptSlug(n.id) === conceptSlug(cid))
      return node ? positions[node.id] : undefined
    }
    const segs: Array<{ key: string; from: { x: number; y: number }; to: { x: number; y: number }; title: string }> = []
    for (const e of loadArticleEdges()) {
      const pts = e.conceptIds.map(posOf).filter((p): p is { x: number; y: number } => !!p)
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          segs.push({ key: `art-${e.slug}-${i}-${j}`, from: pts[i], to: pts[j], title: e.title })
    }
    return segs
  }, [NODES, positions])

  const activatedCount = NODES.filter((n) => stateOf(n) !== "discovered").length

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
            <h1>累积图谱 · 第二大脑正在生长</h1>
            <p className="lede">
              把每周雷达的认知点沉淀为长期的知识网络。已加入计划的节点用色彩突出，未涉及的保持灰色，便于一眼看出“我学到了什么，缺什么”。
            </p>
          </section>

          <div className="growth-grid">
            <div className="growth-card">
              <div className="g-label">累积概念</div>
              <div className="g-value">{growth.concepts}</div>
              <div className="g-sub">跨周去重</div>
            </div>
            <div className="growth-card published">
              <div className="g-label">已成稿</div>
              <div className="g-value">{growth.published}</div>
              <div className="g-sub">费曼定稿</div>
            </div>
            <div className="growth-card learning">
              <div className="g-label">学习中</div>
              <div className="g-value">{growth.learning}</div>
              <div className="g-sub">费曼工作台进行</div>
            </div>
            <div className="growth-card">
              <div className="g-label">积累天数</div>
              <div className="g-value">{growth.days}</div>
              <div className="g-sub">自首次加入计划</div>
            </div>
          </div>

          <div className="toolbar">
            <div className="legend">
              <span className="legend-item"><span className="legend-dot discovered" />未加入</span>
              <span className="legend-item"><span className="legend-dot in-plan" />待启动</span>
              <span className="legend-item"><span className="legend-dot learning" />学习中</span>
              <span className="legend-item"><span className="legend-dot published" />已成稿</span>
            </div>
            <div className="toolbar-meta">{NODES.length} 节点 · {activatedCount} 已激活{articleEdges.length > 0 ? ` · ${articleEdges.length} 成文连接` : ''}</div>
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
                    {c.name}
                  </text>
                </g>
              ))}

              {/* 关系边：费曼内化产出的 concept→parent（虚线）；底部父节点 hub */}
              {relEdges.map((e) => (
                <line
                  key={`rel-${e.id}`}
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke="hsl(var(--published))"
                  strokeWidth={1.4}
                  strokeDasharray="4 5"
                  opacity={0.5}
                />
              ))}
              {parentNodes.map((p) => (
                <g key={`parent-${p.name}`}>
                  <rect x={p.x - 54} y={p.y - 14} width={108} height={28} rx={14} fill="hsl(var(--secondary))" stroke="hsl(var(--border))" />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}>
                    {p.name}
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

              {/* 文章连边：成文把多个概念连起来（实线，区别于费曼关系虚线） */}
              {articleEdges.map((e) => (
                <line key={e.key} x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke="hsl(var(--frontier))" strokeWidth={1.8} opacity={0.55}>
                  <title>{`成文连接 · ${e.title}`}</title>
                </line>
              ))}

              {/* nodes */}
              {NODES.map((n) => {
                const p = positions[n.id]
                const st = stateOf(n)
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
              全部认知点 <span className="badge">{NODES.length} 个 · 跨周累积</span>
            </h2>
            <div className="week-strip">
              {NODES.map((n) => {
                const st = stateOf(n)
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
.graph-page .growth-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:0 0 32px}
@media(max-width:768px){.graph-page .growth-grid{grid-template-columns:repeat(2,1fr)}}
.graph-page .growth-card{padding:18px 20px;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card))}
.graph-page .growth-card .g-label{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:10px}
.graph-page .growth-card .g-value{font-family:var(--font-mono);font-size:34px;font-weight:500;letter-spacing:-0.04em;line-height:1;color:hsl(var(--foreground));font-feature-settings:'tnum' 1}
.graph-page .growth-card .g-sub{margin-top:6px;font-size:11.5px;color:hsl(var(--muted-foreground))}
.graph-page .growth-card.published .g-value{color:hsl(var(--published))}
.graph-page .growth-card.learning .g-value{color:hsl(var(--learning))}
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
