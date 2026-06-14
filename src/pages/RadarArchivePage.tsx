import { useMemo } from "react"
import { BookmarkCheck, ArrowRight, Calendar } from "lucide-react"
import { SiteHeader, type NavPage } from "./SiteHeader"
import { useRadarArchive, type RadarArchiveWeek } from "../data/radarData"
import { useCognition } from "../lib/cognition"

interface RadarArchivePageProps {
  onNavigate: (page: NavPage) => void
  onOpenWeek: (weekId: string) => void
}

/* 由本周认知点派生归档卡片标题（取前 3 个英文 eyebrow） */
function deriveTitle(week: RadarArchiveWeek): string {
  const eyebrows = week.insights.slice(0, 3).map((i) => i.eyebrow).filter(Boolean)
  return eyebrows.join("、") || week.weekId
}

export function RadarArchivePage({ onNavigate, onOpenWeek }: RadarArchivePageProps) {
  const { weeks } = useRadarArchive()
  const { map } = useCognition()

  /* 每周已加入计划数：id 形如 {weekId}-NN-slug，state ≠ discovered 即在计划 */
  const planCountOf = useMemo(
    () => (weekId: string) =>
      Object.keys(map).filter(
        (k) => k.startsWith(weekId + "-") && map[k] && map[k].state !== "discovered",
      ).length,
    [map],
  )

  const latestUpdate = weeks[0]?.generatedAt || weeks[0]?.dateRange || ""

  return (
    <div className="radar-archive min-h-screen bg-background text-foreground">
      <style>{ARCHIVE_CSS}</style>
      <SiteHeader activePage="radar" onNavigate={onNavigate} />

      <main>
        <div className="container">
          <section className="page-hero">
            <div className="hero-kicker">
              <span className="pulse" />
              <span>Weekly Archive · 持续更新</span>
            </div>
            <h1>认知雷达 · 归档</h1>
            <p className="lede">
              每周一篇，记录这一周从 60+ 视频与论文中沉淀下的 AI 工程认知点。点击进入任意一期，查看当时的雷达扫描结果，并可将认知点加入深度学习计划。
            </p>
          </section>

          <div className="archive-meta">
            <span>
              <span className="count">{weeks.length}</span> 期
            </span>
            {latestUpdate && (
              <>
                <span>·</span>
                <span>最近更新 {latestUpdate}</span>
              </>
            )}
          </div>

          <div className="timeline">
            {weeks.map((week, idx) => {
              const frontier = week.insights.filter((i) => i.maturity === "frontier").length
              const mature = week.insights.filter((i) => i.maturity === "mature").length
              const experimental = week.insights.filter((i) => i.maturity === "experimental").length
              const planned = planCountOf(week.weekId)
              return (
                <article key={week.weekId} className={`week-item ${idx === 0 ? "latest" : ""}`}>
                  <button className="week-card" onClick={() => onOpenWeek(week.weekId)}>
                    <div className="week-head">
                      <div>
                        <div className="week-id">
                          {week.weekId}
                          {idx === 0 ? " · Latest" : ""}
                        </div>
                        <h2 className="week-title">{deriveTitle(week)}</h2>
                      </div>
                      <div className="week-range">{week.dateRange}</div>
                    </div>

                    <div className="week-stats">
                      <span className="stat">
                        <span className="num">{week.insights.length}</span>认知点
                      </span>
                      <span className="stat">
                        <span className="dot frontier" />
                        <span className="num">{frontier}</span>研究前沿
                      </span>
                      <span className="stat">
                        <span className="dot mature" />
                        <span className="num">{mature}</span>成熟可用
                      </span>
                      {experimental > 0 && (
                        <span className="stat">
                          <span className="dot experimental" />
                          <span className="num">{experimental}</span>概念验证
                        </span>
                      )}
                      <span className="stat">
                        <BookmarkCheck style={{ width: 13, height: 13 }} />
                        <span className="num">{planned}</span>已加入计划
                      </span>
                    </div>

                    <div className="week-tags">
                      {week.insights.slice(0, 5).map((i) => (
                        <span key={i.id} className="tag">
                          {i.eyebrow}
                        </span>
                      ))}
                    </div>

                    <div className="week-cta">
                      查看本期雷达 <ArrowRight />
                    </div>
                  </button>
                </article>
              )
            })}
          </div>

          <div className="empty-state">
            <Calendar />
            <div style={{ marginBottom: 4, fontSize: 14 }}>新一期认知雷达每周一发布</div>
            <div style={{ fontSize: 12 }}>由 ai-cognitive-radar 自动扫描沉淀，落入归档</div>
          </div>
        </div>
      </main>

      <footer className="archive-footer">
        <div className="container">AICC · Cognition Radar Archive · 持续累积，每周演进</div>
      </footer>
    </div>
  )
}

/* 端口自 aicc-html-bundle/radar/index.html，作用域收敛到 .radar-archive */
const ARCHIVE_CSS = `
.radar-archive .container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.radar-archive main{padding:64px 0 96px}
.radar-archive .page-hero{margin-bottom:44px}
.radar-archive .hero-kicker{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:18px}
.radar-archive .hero-kicker .pulse{width:6px;height:6px;border-radius:9999px;background:hsl(var(--mature));box-shadow:0 0 0 4px hsl(var(--mature)/0.15);animation:ra-pulse 2s ease-in-out infinite}
@keyframes ra-pulse{0%,100%{box-shadow:0 0 0 4px hsl(var(--mature)/0.15)}50%{box-shadow:0 0 0 8px hsl(var(--mature)/0.05)}}
.radar-archive .page-hero h1{font-size:clamp(2.25rem,5vw,3.5rem);font-weight:600;letter-spacing:-0.04em;line-height:1.05;margin-bottom:18px}
.radar-archive .page-hero .lede{max-width:62ch;color:hsl(var(--muted-foreground));font-size:15.5px;line-height:1.7}
.radar-archive .archive-meta{display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:18px;border-bottom:1px solid hsl(var(--border));font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));letter-spacing:0.04em}
.radar-archive .archive-meta .count{color:hsl(var(--foreground));font-weight:600}
.radar-archive .timeline{position:relative;padding-left:32px}
.radar-archive .timeline::before{content:'';position:absolute;left:7px;top:8px;bottom:8px;width:1px;background:hsl(var(--border))}
.radar-archive .week-item{position:relative;padding:0 0 20px}
.radar-archive .week-item::before{content:'';position:absolute;left:-32px;top:24px;width:15px;height:15px;border-radius:9999px;background:hsl(var(--background));border:2px solid hsl(var(--border))}
.radar-archive .week-item.latest::before{border-color:hsl(var(--mature));background:hsl(var(--mature)/0.15);box-shadow:0 0 0 4px hsl(var(--mature)/0.1)}
.radar-archive .week-card{display:block;width:100%;text-align:left;cursor:pointer;padding:22px 26px;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card));transition:border-color 0.18s ease,box-shadow 0.18s ease,transform 0.18s ease}
.radar-archive .week-card:hover{border-color:hsl(var(--foreground)/0.18);box-shadow:0 8px 24px -12px hsl(var(--foreground)/0.15);transform:translateY(-1px)}
.radar-archive .week-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:10px;flex-wrap:wrap}
.radar-archive .week-id{font-family:var(--font-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:hsl(var(--muted-foreground))}
.radar-archive .week-title{font-size:1.25rem;font-weight:600;letter-spacing:-0.02em;color:hsl(var(--foreground));margin-top:2px}
.radar-archive .week-range{font-family:var(--font-mono);font-size:12px;color:hsl(var(--muted-foreground))}
.radar-archive .week-stats{display:flex;gap:18px;margin:14px 0 4px;flex-wrap:wrap}
.radar-archive .stat{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:hsl(var(--muted-foreground))}
.radar-archive .stat .num{font-family:var(--font-mono);font-weight:600;color:hsl(var(--foreground));font-feature-settings:'tnum' 1}
.radar-archive .stat .dot{width:6px;height:6px;border-radius:9999px}
.radar-archive .stat .dot.frontier{background:hsl(var(--frontier))}
.radar-archive .stat .dot.mature{background:hsl(var(--mature))}
.radar-archive .stat .dot.experimental{background:hsl(var(--experimental))}
.radar-archive .week-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.radar-archive .tag{display:inline-flex;align-items:center;padding:3px 10px;font-size:11.5px;color:hsl(var(--muted-foreground));border:1px solid hsl(var(--border));border-radius:9999px;background:hsl(var(--background));font-family:var(--font-mono);letter-spacing:0.02em}
.radar-archive .week-cta{display:inline-flex;align-items:center;gap:6px;margin-top:18px;font-size:13px;font-weight:500;color:hsl(var(--foreground))}
.radar-archive .week-cta svg{width:14px;height:14px;transition:transform 0.15s ease}
.radar-archive .week-card:hover .week-cta svg{transform:translateX(3px)}
.radar-archive .empty-state{padding:32px 24px;text-align:center;border:1px dashed hsl(var(--border));border-radius:var(--radius);color:hsl(var(--muted-foreground));margin-top:8px}
.radar-archive .empty-state svg{width:28px;height:28px;margin-bottom:10px;opacity:0.6}
.radar-archive .archive-footer{border-top:1px solid hsl(var(--border));padding:24px 0;font-size:12px;color:hsl(var(--muted-foreground));font-family:var(--font-mono);letter-spacing:0.04em;margin-top:48px}
`
