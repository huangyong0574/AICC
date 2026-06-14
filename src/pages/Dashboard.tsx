import { useState, useEffect } from "react"
import { FileText, Folder, GitFork, Flame, Bot, Cpu, GraduationCap, ArrowRight, Calendar, Clock, Settings2, ArrowUpRight, Radar } from "lucide-react"
import { SiteHeader } from "./SiteHeader"
import type { NavPage } from "./SiteHeader"
import { useCognition } from "../lib/cognition"
import { useLatestRadarWeek } from "../data/radarData"

interface ArticleEntry {
  slug: string
  title: string
  subtitle: string
  category: string
  date: string
  status: string
  tags: string[]
  readtime?: string
}

interface DashboardProps {
  onNavigate: (page: NavPage) => void
  onOpenArticle: (slug: string) => void
}

function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-semibold flex-shrink-0 rounded-[calc(var(--radius)-2px)]"
      style={{ width: size, height: size, fontSize: size * 0.5, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
    >
      A
    </span>
  )
}

export function Dashboard({ onNavigate, onOpenArticle }: DashboardProps) {
  const [articles, setArticles] = useState<ArticleEntry[]>([])
  const { map } = useCognition()

  const { week: radarWeek } = useLatestRadarWeek()
  // 本周雷达·深入计划：节点来自最新一周雷达，命中认知状态机（state ≠ discovered）即“在计划”
  const radarNodes = radarWeek.insights.map((ins) => ({
    id: ins.id,
    num: String(ins.index).padStart(2, "0"),
    label: ins.eyebrow,
    inPlan: !!map[ins.id] && map[ins.id].state !== "discovered",
  }))
  const radarPlanCount = radarNodes.filter((n) => n.inPlan).length

  useEffect(() => {
    fetch("/content/articles.json")
      .then(r => r.json())
      .then((data: ArticleEntry[]) => setArticles(data))
      .catch(() => setArticles([]))
  }, [])


  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFeatureSettings: "'rlig' 1, 'calt' 1" }}>
      <SiteHeader activePage="dashboard" onNavigate={onNavigate} />

      <main style={{ padding: "48px 0 96px" }}>
        <div className="max-w-screen-xl mx-auto px-6">

          {/* ======== PAGE HERO ======== */}
          <section style={{ marginBottom: 56 }}>
            {/* Kicker */}
            <div
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground"
              style={{ marginBottom: 14 }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: 6, height: 6,
                  background: "hsl(142 76% 36%)",
                  boxShadow: "0 0 0 4px hsl(142 76% 36% / 0.15)",
                }}
              />
              WORKBENCH · 你的认知工作台
            </div>
            <h1
              className="font-semibold tracking-[-0.03em] leading-[1.15]"
              style={{ fontSize: "clamp(1.875rem, 4vw, 2.625rem)", marginBottom: 12 }}
            >
              第二大脑 · 正在生长
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: "1rem", maxWidth: 560, lineHeight: 1.7 }}>
              这里收纳着你已用费曼学习法定稿的 AI 认知，三个分类、N 篇文章、一张正在迭代的知识图谱。
            </p>

            {/* Stats bar */}
            <div
              className="grid border border-border rounded-[var(--radius)] overflow-hidden bg-card"
              style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 32 }}
            >
              {[
                { icon: FileText, label: "定稿文章", value: "24", meta: "本月 +6" },
                { icon: Folder, label: "分类", value: "3", meta: "支柱稳定" },
                { icon: GitFork, label: "知识节点", value: "142", meta: "38 条强关联" },
                { icon: Flame, label: "复利天数", value: "87", meta: "连续产出中" },
              ].map(({ icon: Icon, label, value, meta }, i) => (
                <div
                  key={label}
                  className="border-border"
                  style={{ padding: "18px 22px", borderRight: i < 3 ? "1px solid hsl(var(--border))" : undefined }}
                >
                  <div className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground" style={{ marginBottom: 8 }}>
                    <Icon style={{ width: 12, height: 12 }} />
                    {label}
                  </div>
                  <div className="font-semibold tracking-[-0.02em] leading-[1.1]" style={{ fontSize: 26 }}>{value}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>{meta}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ======== SECTION 01 · 分类 ======== */}
          <section style={{ marginBottom: 64 }} id="categories">
            <div
              className="flex items-end justify-between gap-6 border-b border-border"
              style={{ marginBottom: 24, paddingBottom: 16 }}
            >
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: 8 }}>
                  <span
                    className="inline-flex items-center justify-center font-mono text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)]"
                    style={{ height: 22, padding: "0 8px" }}
                  >
                    01
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Categories · 三个认知支柱
                  </span>
                </div>
                <h2 className="font-semibold tracking-[-0.015em] leading-[1.3]" style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}>
                  分类
                </h2>
              </div>
              <button onClick={() => scrollTo("articles")} className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium bg-transparent text-foreground rounded-[calc(var(--radius)-2px)] hover:bg-accent transition-colors flex-shrink-0">
                管理分类
                <Settings2 style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                {
                  icon: Bot, count: 9, nameCn: "全球热门 Agent 产品", nameEn: "Global Agent Products",
                  desc: "追踪 Cursor、Claude Code、Devin、Lovable 等头部 Agent 产品的形态、范式与协作模式。",
                  latest: "最新 · Claude Code Skills 工程手册",
                },
                {
                  icon: Cpu, count: 11, nameCn: "LLM 算法原理", nameEn: "LLM Algorithm Principles",
                  desc: "从 Transformer 到 Flash Attention，从 RoPE 到测试时计算，把抽象论文拆成可解释的认知单元。",
                  latest: "最新 · Flash Attention 2 / 3 工程差异",
                },
                {
                  icon: GraduationCap, count: 4, nameCn: "AI Native 工作学习", nameEn: "AI Native Workflow",
                  desc: "第二大脑构筑、Obsidian + Claude 工作流、费曼学习法重述——把 AI 嵌进日常的方法论。",
                  latest: "最新 · 如何评价你与 AI 的协作密度",
                },
              ].map(({ icon: Icon, count, nameCn, nameEn, desc, latest }) => (
                <article
                  key={nameCn}
                  onClick={() => scrollTo("articles")}
                  className="relative flex flex-col bg-card border border-border rounded-[var(--radius)] overflow-hidden cursor-pointer transition-all duration-200 hover:border-foreground/45 hover:-translate-y-0.5"
                  style={{ padding: "22px 24px 20px", minHeight: 220 }}
                >
                  {/* top-right glow */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: 0, right: 0, width: 120, height: 120,
                      background: "radial-gradient(circle at top right, hsl(var(--foreground) / 0.04), transparent 70%)",
                    }}
                  />
                  <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
                    <div
                      className="inline-flex items-center justify-center bg-secondary text-secondary-foreground border border-border rounded-[calc(var(--radius)-2px)]"
                      style={{ width: 40, height: 40 }}
                    >
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="inline-flex items-baseline gap-1 font-mono text-muted-foreground">
                      <span className="font-semibold text-foreground" style={{ fontSize: 18 }}>{count}</span>
                      <span style={{ fontSize: 11 }}>篇</span>
                    </div>
                  </div>
                  <div className="font-semibold tracking-[-0.01em]" style={{ fontSize: "1.0625rem", marginBottom: 2 }}>{nameCn}</div>
                  <div className="font-mono text-muted-foreground tracking-[0.02em]" style={{ fontSize: 11.5, marginBottom: 12 }}>{nameEn}</div>
                  <p className="text-muted-foreground leading-[1.65]" style={{ fontSize: 13.5, marginBottom: "auto" }}>{desc}</p>
                  <div
                    className="flex items-center justify-between border-t border-dashed border-border text-muted-foreground"
                    style={{ marginTop: 18, paddingTop: 14, fontSize: 12 }}
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">{latest}</span>
                    <span className="ml-2.5 text-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5">
                      <ArrowRight style={{ width: 13, height: 13 }} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ======== SECTION 02 · 文章 ======== */}
          <section style={{ marginBottom: 64 }} id="articles">
            <div
              className="flex items-end justify-between gap-6 border-b border-border"
              style={{ marginBottom: 24, paddingBottom: 16 }}
            >
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: 8 }}>
                  <span
                    className="inline-flex items-center justify-center font-mono text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)]"
                    style={{ height: 22, padding: "0 8px" }}
                  >
                    02
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Articles · 已定稿的认知
                  </span>
                </div>
                <h2 className="font-semibold tracking-[-0.015em] leading-[1.3]" style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}>
                  最新文章
                </h2>
              </div>
              <button onClick={() => scrollTo("articles")} className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium bg-transparent text-foreground border border-border rounded-[calc(var(--radius)-2px)] hover:bg-accent transition-colors flex-shrink-0">
                查看全部
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {articles.map((article) => (
                <article
                  key={article.slug}
                  className="flex flex-col bg-card border border-border rounded-[var(--radius)] transition-all duration-150 cursor-pointer hover:border-foreground/40 hover:bg-accent/40"
                  style={{ padding: "20px 22px" }}
                  onClick={() => onOpenArticle(article.slug)}
                >
                  <div className="flex items-center justify-between gap-3" style={{ marginBottom: 10 }}>
                    <span
                      className="font-mono text-[10.5px] tracking-[0.04em] bg-secondary text-secondary-foreground rounded-full"
                      style={{ padding: "2px 8px" }}
                    >
                      {article.category}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground">
                      <span
                        className="rounded-full"
                        style={{
                          width: 6, height: 6,
                          background: article.status === "已定稿" ? "hsl(142 76% 36%)" : "hsl(var(--muted-foreground))",
                        }}
                      />
                      {article.status}
                    </span>
                  </div>
                  <h3
                    className="font-semibold tracking-[-0.005em] leading-[1.45]"
                    style={{ fontSize: 15.5, marginBottom: 8 }}
                  >
                    {article.title}
                  </h3>
                  <p
                    className="text-muted-foreground leading-[1.65]"
                    style={{
                      fontSize: 13.5, marginBottom: 16,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                    }}
                  >
                    {article.subtitle}
                  </p>
                  <div
                    className="flex items-center gap-3.5 border-t border-border font-mono text-[11px] text-muted-foreground"
                    style={{ marginTop: "auto", paddingTop: 12 }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar style={{ width: 12, height: 12 }} />{article.date}
                    </span>
                    {article.readtime && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock style={{ width: 12, height: 12 }} />{article.readtime}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-foreground">
                      <ArrowRight style={{ width: 13, height: 13 }} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ======== SECTION 03 · 知识图谱 ======== */}
          <section style={{ marginBottom: 64 }} id="graph">
            <div
              className="flex items-end justify-between gap-6 border-b border-border"
              style={{ marginBottom: 24, paddingBottom: 16 }}
            >
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: 8 }}>
                  <span
                    className="inline-flex items-center justify-center font-mono text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)]"
                    style={{ height: 22, padding: "0 8px" }}
                  >
                    03
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Knowledge Graph · 你的认知版图
                  </span>
                </div>
                <h2 className="font-semibold tracking-[-0.015em] leading-[1.3]" style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}>
                  知识图谱
                </h2>
              </div>
              <button onClick={() => onNavigate("graph")} className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium bg-foreground text-background rounded-[calc(var(--radius)-2px)] hover:opacity-90 transition-opacity flex-shrink-0">
                进入完整图谱
                <ArrowUpRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-border bg-background" style={{ padding: "14px 18px" }}>
                <div className="inline-flex items-center gap-3 font-mono text-[11.5px] text-muted-foreground">
                  <span><strong className="text-foreground font-semibold">142</strong> 个节点</span>
                  <span>·</span>
                  <span><strong className="text-foreground font-semibold">38</strong> 条强关联</span>
                  <span>·</span>
                  <span>更新于 <strong className="text-foreground font-semibold">2 小时前</strong></span>
                </div>
                <div className="hidden md:inline-flex items-center gap-3.5 font-mono text-[10.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 12, height: 12, background: "hsl(var(--foreground))" }} />分类
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-full border" style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: "hsl(var(--foreground))", background: "transparent" }} />文章
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 5, height: 5, background: "hsl(var(--muted-foreground))" }} />概念
                  </span>
                </div>
              </div>

              {/* Graph canvas */}
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: "16 / 9",
                  background: "radial-gradient(circle at 50% 50%, hsl(var(--foreground) / 0.03), transparent 70%), hsl(var(--background))",
                }}
              >
                <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" aria-label="知识图谱预览" style={{ width: "100%", height: "100%", display: "block" }}>
                  <g>
                    {/* LLM cluster edges */}
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="220" y1="170" x2="140" y2="100" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="220" y1="170" x2="120" y2="200" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="220" y1="170" x2="170" y2="270" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="220" y1="170" x2="290" y2="90" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="220" y1="170" x2="310" y2="220" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="140" y1="100" x2="80" y2="50" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="120" y1="200" x2="60" y2="260" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="170" y1="270" x2="100" y2="340" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="290" y1="90" x2="370" y2="60" />
                    {/* Agent cluster edges */}
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="560" y1="160" x2="490" y2="90" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="560" y1="160" x2="640" y2="100" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="560" y1="160" x2="680" y2="200" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="560" y1="160" x2="500" y2="240" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="490" y1="90" x2="420" y2="40" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="640" y1="100" x2="720" y2="50" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="680" y1="200" x2="745" y2="265" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="500" y1="240" x2="430" y2="300" />
                    {/* AI Native cluster edges */}
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="400" y1="340" x2="330" y2="370" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="400" y1="340" x2="470" y2="370" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="400" y1="340" x2="400" y2="410" />
                    <line stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1.2" fill="none" x1="400" y1="340" x2="350" y2="290" />
                    {/* Cross-cluster bridges */}
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="310" y1="220" x2="500" y2="240" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" x1="350" y1="290" x2="430" y2="300" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" strokeDasharray="3,3" x1="290" y1="90" x2="490" y2="90" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" strokeDasharray="3,3" x1="170" y1="270" x2="400" y2="340" />
                    <line stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" fill="none" strokeDasharray="3,3" x1="500" y1="240" x2="400" y2="340" />
                  </g>
                  {/* Concept (small) nodes */}
                  <g fill="hsl(var(--muted-foreground))">
                    <circle cx="80" cy="50" r="3" /><circle cx="60" cy="260" r="3" /><circle cx="100" cy="340" r="3" />
                    <circle cx="370" cy="60" r="3" /><circle cx="420" cy="40" r="3" /><circle cx="720" cy="50" r="3" />
                    <circle cx="745" cy="265" r="3" /><circle cx="430" cy="300" r="3" />
                  </g>
                  {/* Article (medium) nodes */}
                  <g>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="140" cy="100" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="140" y="86" textAnchor="middle">Flash Attn</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="120" cy="200" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="100" y="218" textAnchor="end">RoPE</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="170" cy="270" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="170" y="288" textAnchor="middle">Test-Time</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="290" cy="90" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="290" y="76" textAnchor="middle">o1 范式</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="310" cy="220" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="328" y="224" textAnchor="start">MoE</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="490" cy="90" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="490" y="76" textAnchor="middle">Cursor</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="640" cy="100" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="640" y="86" textAnchor="middle">Claude Code</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="680" cy="200" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="694" y="204" textAnchor="start">Devin</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="500" cy="240" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="486" y="244" textAnchor="end">Lovable</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="330" cy="370" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="316" y="374" textAnchor="end">第二大脑</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="470" cy="370" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="484" y="374" textAnchor="start">协作密度</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="350" cy="290" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="350" y="277" textAnchor="middle">Obsidian</text>
                    <circle fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.4" cx="400" cy="410" r="7" />
                    <text style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fill: "hsl(var(--muted-foreground))" }} x="400" y="430" textAnchor="middle">费曼法</text>
                  </g>
                  {/* Category hubs (large) */}
                  <g>
                    <circle fill="hsl(var(--primary))" cx="220" cy="170" r="16" />
                    <text style={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} x="220" y="148" textAnchor="middle">LLM 算法</text>
                    <circle fill="hsl(var(--primary))" cx="560" cy="160" r="16" />
                    <text style={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} x="560" y="138" textAnchor="middle">Agent 产品</text>
                    <circle fill="hsl(var(--primary))" cx="400" cy="340" r="16" />
                    <text style={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} x="400" y="318" textAnchor="middle">AI Native</text>
                  </g>
                </svg>
              </div>

              {/* ===== Weekly Radar · Deep-Plan strip ===== */}
              <div className="dash-radar-strip">
                <style>{RADAR_STRIP_CSS}</style>
                <div className="rs-head">
                  <div className="rs-title">
                    <Radar style={{ width: 14, height: 14 }} />
                    本周雷达 · 深入计划
                    <span className="rs-kicker">{radarWeek.weekId}</span>
                  </div>
                  <div className="rs-meta">
                    已选 <span className="num">{radarPlanCount}</span> / {radarNodes.length} ·{" "}
                    <button onClick={() => onNavigate("radar")} className="rs-link">
                      前往雷达页选择 →
                    </button>
                  </div>
                </div>
                <div className="rs-nodes">
                  {radarNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onNavigate("radar")}
                      className={`rs-node ${n.inPlan ? "in-plan" : ""}`}
                    >
                      <span className="rs-node-dot" />
                      <span className="rs-node-num">{n.num}</span>
                      <span className="rs-node-label">{n.label}</span>
                    </button>
                  ))}
                </div>
                {radarPlanCount === 0 && (
                  <div className="rs-empty">尚未选择本周深入认知点 · 未学习节点已置灰</div>
                )}
              </div>

              {/* Graph footer stats */}
              <div className="grid border-t border-border" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {[
                  { v: "3", l: "认知支柱（分类）" },
                  { v: "24", l: "文章节点" },
                  { v: "115", l: "概念节点 · 含跨域桥接" },
                ].map(({ v, l }, i) => (
                  <div
                    key={l}
                    className="flex items-baseline gap-2.5 border-border"
                    style={{ padding: "14px 18px", borderRight: i < 2 ? "1px solid hsl(var(--border))" : undefined }}
                  >
                    <span className="font-mono font-semibold text-foreground" style={{ fontSize: 18 }}>{v}</span>
                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border" style={{ padding: "28px 0", marginTop: 64 }}>
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <BrandMark size={22} />
            <span>AICC · 你的 AI 认知工作台</span>
          </div>
          <div className="font-mono text-[12px] text-muted-foreground">v1.0 · Last sync 2 小时前</div>
        </div>
      </footer>
    </div>
  )
}

/* 端口自 aicc-html-bundle/aicc-dashboard.html 的 radar-strip，作用域收敛到 .dash-radar-strip */
const RADAR_STRIP_CSS = `
.dash-radar-strip{border-top:1px solid hsl(var(--border));padding:18px 22px 22px;background:hsl(var(--background))}
.dash-radar-strip .rs-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}
.dash-radar-strip .rs-title{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:-0.01em}
.dash-radar-strip .rs-kicker{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-left:6px;padding:2px 8px;border:1px solid hsl(var(--border));border-radius:calc(var(--radius) - 2px)}
.dash-radar-strip .rs-meta{font-family:var(--font-mono);font-size:11px;color:hsl(var(--muted-foreground));display:inline-flex;align-items:center;gap:8px}
.dash-radar-strip .rs-meta .num{color:hsl(var(--foreground));font-weight:600}
.dash-radar-strip .rs-link{background:none;border:none;cursor:pointer;font-family:inherit;font-size:inherit;color:hsl(var(--foreground));border-bottom:1px solid hsl(var(--border));padding:0 0 1px;transition:border-color 0.15s}
.dash-radar-strip .rs-link:hover{border-color:hsl(var(--foreground))}
.dash-radar-strip .rs-nodes{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
@media (max-width:880px){.dash-radar-strip .rs-nodes{grid-template-columns:repeat(4,1fr)}}
@media (max-width:540px){.dash-radar-strip .rs-nodes{grid-template-columns:repeat(2,1fr)}}
.dash-radar-strip .rs-node{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px 12px;border:1px solid hsl(var(--border));border-radius:calc(var(--radius) - 2px);background:hsl(var(--card));text-align:center;transition:all 0.18s ease;opacity:0.45;filter:grayscale(0.6);cursor:pointer}
.dash-radar-strip .rs-node:hover{opacity:0.75}
.dash-radar-strip .rs-node.in-plan{opacity:1;filter:none;border-color:hsl(142 71% 38% / 0.5);background:linear-gradient(180deg,hsl(142 71% 38% / 0.04),hsl(var(--card)));box-shadow:0 0 0 3px hsl(142 71% 38% / 0.06)}
.dark .dash-radar-strip .rs-node.in-plan{border-color:hsl(142 71% 50% / 0.5);background:linear-gradient(180deg,hsl(142 71% 50% / 0.06),hsl(var(--card)));box-shadow:0 0 0 3px hsl(142 71% 50% / 0.08)}
.dash-radar-strip .rs-node-dot{position:relative;width:10px;height:10px;border-radius:9999px;background:hsl(var(--muted-foreground))}
.dash-radar-strip .rs-node.in-plan .rs-node-dot{background:hsl(142 71% 38%);box-shadow:0 0 0 4px hsl(142 71% 38% / 0.18)}
.dark .dash-radar-strip .rs-node.in-plan .rs-node-dot{background:hsl(142 71% 50%);box-shadow:0 0 0 4px hsl(142 71% 50% / 0.2)}
.dash-radar-strip .rs-node-num{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:0.08em;color:hsl(var(--muted-foreground))}
.dash-radar-strip .rs-node-label{font-size:12px;font-weight:500;line-height:1.35;color:hsl(var(--foreground));word-break:break-word}
.dash-radar-strip .rs-node.in-plan .rs-node-label{font-weight:600}
.dash-radar-strip .rs-empty{font-size:12.5px;color:hsl(var(--muted-foreground));margin-top:12px;padding:10px 12px;border:1px dashed hsl(var(--border));border-radius:calc(var(--radius) - 2px);text-align:center}
`
