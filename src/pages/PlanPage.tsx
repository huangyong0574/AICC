import { useMemo, useState } from "react"
import {
  Layers,
  Bookmark,
  Loader,
  CheckCircle2,
  BookmarkPlus,
  BookmarkCheck,
  BookOpen,
  X,
  Radar,
} from "lucide-react"
import { SiteHeader, type NavPage } from "./SiteHeader"
import { useCognition, STATE_LABELS, type CognitionStateValue } from "../lib/cognition"

interface PlanPageProps {
  onNavigate: (page: NavPage) => void
  onOpenArticle: (slug: string) => void
  onOpenFeynman: (id: string) => void
}

type FilterValue = "all" | CognitionStateValue

const FILTERS: { value: FilterValue; label: string; dot?: string }[] = [
  { value: "all", label: "全部" },
  { value: "in-plan", label: "待启动", dot: "in-plan" },
  { value: "learning", label: "学习中", dot: "learning" },
  { value: "published", label: "已成稿", dot: "published" },
]

/* 把 id（如 2026-W24-02-flash-attention）拆成周 / 序号 / 英文标题兜底 */
function parseId(id: string) {
  const m = id.match(/^(\d{4}-W\d{2})-(\d{2})/)
  const week = m ? m[1] : ""
  const idx = m ? m[2] : ""
  // 带 W 周前缀的 id 取第 4 段起做英文兜底；纯 slug（如 dynamic-workflows）则美化整个 id
  const enFallback = (m ? id.split("-").slice(3) : id.split("-"))
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { week, idx, enFallback }
}

export function PlanPage({ onNavigate, onOpenArticle, onOpenFeynman }: PlanPageProps) {
  const { plannedItems, remove } = useCognition()
  const [filter, setFilter] = useState<FilterValue>("all")

  const items = plannedItems()
  const counts = useMemo(
    () => ({
      total: items.length,
      "in-plan": items.filter((i) => i.state === "in-plan").length,
      learning: items.filter((i) => i.state === "learning").length,
      published: items.filter((i) => i.state === "published").length,
    }),
    [items],
  )

  const visible = filter === "all" ? items : items.filter((i) => i.state === filter)

  return (
    <div className="plan-page min-h-screen bg-background text-foreground">
      <style>{PLAN_CSS}</style>
      <SiteHeader activePage="plan" onNavigate={onNavigate} />

      <main>
        <div className="container">
          <section className="page-hero">
            <div className="hero-kicker">
              <span className="pulse" />
              <span>Deep Learning Plan · 跨周累积</span>
            </div>
            <h1>我的深度计划</h1>
            <p className="lede">
              从每周雷达中挑选出值得深入的认知点，沉淀到这里。配合费曼学习法工作台，把“知道”转化为“能讲清楚”。
            </p>
          </section>

          <div className="summary-grid">
            <div className="stat-card">
              <div className="label">
                <Layers /> 计划总数
              </div>
              <div className="value">{counts.total}</div>
              <div className="sub">跨周累积</div>
            </div>
            <div className="stat-card in-plan">
              <div className="label">
                <Bookmark /> 待启动
              </div>
              <div className="value">{counts["in-plan"]}</div>
              <div className="sub">已加入，未开始</div>
            </div>
            <div className="stat-card learning">
              <div className="label">
                <Loader /> 学习中
              </div>
              <div className="value">{counts.learning}</div>
              <div className="sub">费曼工作台进行中</div>
            </div>
            <div className="stat-card published">
              <div className="label">
                <CheckCircle2 /> 已成稿
              </div>
              <div className="value">{counts.published}</div>
              <div className="sub">已生成文章</div>
            </div>
          </div>

          <div className="toolbar">
            <div className="filter-group">
              <span className="filter-label">筛选</span>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip ${filter === f.value ? "active" : ""}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.dot && <span className={`dot ${f.dot}`} />}
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "hsl(var(--muted-foreground))",
                  letterSpacing: "0.04em",
                }}
              >
                按加入时间排序 · 新→旧
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="计划列表为空"
              desc="从认知雷达页面挑选感兴趣的认知点，点击“加入深度计划”，它们将出现在这里。"
              onGoRadar={() => onNavigate("radar")}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title="该筛选条件下没有项"
              desc="尝试切换筛选条件，或前往认知雷达加入新的认知点。"
              onGoRadar={() => onNavigate("radar")}
            />
          ) : (
            <div className="plan-list">
              {visible.map((item) => {
                const { week, idx, enFallback } = parseId(item.id)
                const enTitle = item.titleEn || enFallback
                const zhTitle = item.title || item.id
                const sourceWeek = item.sourceWeek || week

                return (
                  <article key={item.id} className={`plan-item is-${item.state}`}>
                    <div className="plan-num">
                      {sourceWeek}
                      {idx && <strong>· {idx}</strong>}
                    </div>
                    <div className="plan-body">
                      <div className="plan-en">{enTitle}</div>
                      <div className="plan-title">{zhTitle}</div>
                      <div className="plan-meta">
                        <span className="badge">
                          <span className={`dot ${item.state}`} />
                          {STATE_LABELS[item.state]}
                        </span>
                        {sourceWeek && <span>来源：{sourceWeek} 雷达</span>}
                        {item.addedAt && (
                          <span>加入：{new Date(item.addedAt).toLocaleDateString("zh-CN")}</span>
                        )}
                      </div>
                    </div>
                    <div className="plan-actions">
                      {item.state === "in-plan" && (
                        <button className="btn primary" onClick={() => onOpenFeynman(item.id)}>
                          <BookmarkCheck /> 开始费曼学习
                        </button>
                      )}
                      {item.state === "learning" && (
                        <button className="btn primary" onClick={() => onOpenFeynman(item.id)}>
                          <Loader /> 继续学习
                        </button>
                      )}
                      {item.state === "published" &&
                        (item.slug ? (
                          <button className="btn primary" onClick={() => onOpenArticle(item.slug!)}>
                            <BookOpen /> 查看文章
                          </button>
                        ) : (
                          <button className="btn" disabled title="未关联文章 slug">
                            <BookOpen /> 文章缺失
                          </button>
                        ))}
                      <button
                        className="btn btn-remove"
                        title="移除"
                        onClick={() => remove(item.id)}
                      >
                        <X />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="plan-footer">
        <div className="container">AICC · Deep Learning Plan · 数据存储于本地浏览器</div>
      </footer>
    </div>
  )
}

function EmptyState({
  title,
  desc,
  onGoRadar,
}: {
  title: string
  desc: string
  onGoRadar: () => void
}) {
  return (
    <div className="empty-state">
      <div className="icon-wrap">
        <BookmarkPlus />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button className="btn primary" onClick={onGoRadar}>
        <Radar /> 前往认知雷达
      </button>
    </div>
  )
}

/* 端口自 aicc-html-bundle/plan.html，作用域收敛到 .plan-page */
const PLAN_CSS = `
.plan-page .container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.plan-page main{padding:64px 0 96px}
.plan-page .page-hero{margin-bottom:36px}
.plan-page .hero-kicker{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:18px}
.plan-page .hero-kicker .pulse{width:6px;height:6px;border-radius:9999px;background:hsl(var(--learning));box-shadow:0 0 0 4px hsl(var(--learning)/0.15);animation:plan-pulse 2s ease-in-out infinite}
@keyframes plan-pulse{0%,100%{box-shadow:0 0 0 4px hsl(var(--learning)/0.15)}50%{box-shadow:0 0 0 8px hsl(var(--learning)/0.05)}}
.plan-page .page-hero h1{font-size:clamp(2.25rem,5vw,3.5rem);font-weight:600;letter-spacing:-0.04em;line-height:1.05;margin-bottom:18px}
.plan-page .page-hero .lede{max-width:62ch;color:hsl(var(--muted-foreground));font-size:15.5px;line-height:1.7}

.plan-page .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0 36px}
@media (max-width:768px){.plan-page .summary-grid{grid-template-columns:repeat(2,1fr)}}
.plan-page .stat-card{padding:18px 20px;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card))}
.plan-page .stat-card .label{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:10px;display:inline-flex;align-items:center;gap:6px}
.plan-page .stat-card .label svg{width:12px;height:12px}
.plan-page .stat-card .value{font-family:var(--font-mono);font-size:34px;font-weight:500;letter-spacing:-0.04em;line-height:1;color:hsl(var(--foreground));font-feature-settings:'tnum' 1}
.plan-page .stat-card .sub{margin-top:6px;font-size:11.5px;color:hsl(var(--muted-foreground))}
.plan-page .stat-card.in-plan .value{color:hsl(var(--frontier))}
.plan-page .stat-card.learning .value{color:hsl(var(--learning))}
.plan-page .stat-card.published .value{color:hsl(var(--published))}

.plan-page .toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid hsl(var(--border));flex-wrap:wrap}
.plan-page .filter-group{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.plan-page .filter-label{font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-right:8px}
.plan-page .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:12.5px;font-weight:500;color:hsl(var(--muted-foreground));border:1px solid hsl(var(--border));border-radius:9999px;background:hsl(var(--card));transition:all 0.15s ease;cursor:pointer}
.plan-page .chip:hover{color:hsl(var(--foreground));background:hsl(var(--accent))}
.plan-page .chip.active{color:hsl(var(--primary-foreground));background:hsl(var(--primary));border-color:hsl(var(--primary))}
.plan-page .chip .dot{width:6px;height:6px;border-radius:9999px}
.plan-page .chip .dot.in-plan{background:hsl(var(--frontier))}
.plan-page .chip .dot.learning{background:hsl(var(--learning))}
.plan-page .chip .dot.published{background:hsl(var(--published))}

.plan-page .plan-list{display:grid;grid-template-columns:1fr;gap:14px}
.plan-page .plan-item{display:grid;grid-template-columns:80px 1fr auto;gap:18px;padding:18px 22px;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card));align-items:center;transition:border-color 0.18s ease,box-shadow 0.18s ease,transform 0.18s ease}
.plan-page .plan-item:hover{border-color:hsl(var(--foreground)/0.18);box-shadow:0 8px 24px -12px hsl(var(--foreground)/0.15);transform:translateY(-1px)}
.plan-page .plan-item.is-published{border-color:hsl(var(--published)/0.4);background:hsl(var(--published)/0.04)}
.plan-page .plan-item.is-learning{border-left:3px solid hsl(var(--learning))}
.plan-page .plan-num{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground));text-align:left;line-height:1.4;font-feature-settings:'tnum' 1}
.plan-page .plan-num strong{display:block;font-size:13px;color:hsl(var(--foreground));font-weight:600;letter-spacing:0.04em;margin-top:2px}
.plan-page .plan-body{min-width:0}
.plan-page .plan-en{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:4px}
.plan-page .plan-title{font-size:1.05rem;font-weight:600;letter-spacing:-0.01em;color:hsl(var(--foreground));margin-bottom:8px}
.plan-page .plan-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:hsl(var(--muted-foreground));align-items:center}
.plan-page .plan-meta .badge{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border:1px solid hsl(var(--border));border-radius:9999px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.04em}
.plan-page .plan-meta .badge .dot{width:5px;height:5px;border-radius:9999px}
.plan-page .plan-meta .badge .dot.in-plan{background:hsl(var(--frontier))}
.plan-page .plan-meta .badge .dot.learning{background:hsl(var(--learning))}
.plan-page .plan-meta .badge .dot.published{background:hsl(var(--published))}

.plan-page .plan-actions{display:inline-flex;align-items:center;gap:8px;flex-shrink:0}
.plan-page .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;font-size:13px;font-weight:500;border-radius:calc(var(--radius) - 2px);border:1px solid hsl(var(--border));background:hsl(var(--background));color:hsl(var(--foreground));transition:all 0.15s ease;white-space:nowrap;cursor:pointer}
.plan-page .btn:hover{background:hsl(var(--accent))}
.plan-page .btn.primary{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-color:hsl(var(--primary))}
.plan-page .btn.primary:hover{background:hsl(var(--primary)/0.9)}
.plan-page .btn svg{width:13px;height:13px}
.plan-page .btn-remove{padding:8px;color:hsl(var(--muted-foreground))}
.plan-page .btn-remove:hover{color:hsl(var(--frontier));background:hsl(var(--frontier)/0.08)}

.plan-page .empty-state{padding:64px 24px;text-align:center;border:1px dashed hsl(var(--border));border-radius:var(--radius);color:hsl(var(--muted-foreground))}
.plan-page .empty-state .icon-wrap{width:56px;height:56px;border-radius:9999px;background:hsl(var(--secondary));display:inline-flex;align-items:center;justify-content:center;margin-bottom:18px}
.plan-page .empty-state .icon-wrap svg{width:24px;height:24px;color:hsl(var(--muted-foreground))}
.plan-page .empty-state h3{font-size:1.1rem;font-weight:600;color:hsl(var(--foreground));margin-bottom:8px}
.plan-page .empty-state p{max-width:46ch;margin:0 auto 18px;font-size:14px}
.plan-page .empty-state .btn{margin:0 auto}

.plan-page .plan-footer{border-top:1px solid hsl(var(--border));padding:24px 0;font-size:12px;color:hsl(var(--muted-foreground));font-family:var(--font-mono);letter-spacing:0.04em;margin-top:48px}
`
