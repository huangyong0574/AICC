import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sparkles, Unlink, Target, Clock,
  Check, ShieldCheck, ArrowDown, ArrowRight
} from "lucide-react"
import { SiteHeader } from "./SiteHeader"
import type { NavPage } from "./SiteHeader"

/* ------------------------------------------------------------------ */
/* TOC Scroll-spy Hook                                                  */
/* ------------------------------------------------------------------ */
function useTocSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "")

  useEffect(() => {
    const elements = ids.map(id => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    )
    elements.forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [ids])

  return active
}

/* ------------------------------------------------------------------ */
/* Brand Mark                                                           */
/* ------------------------------------------------------------------ */
function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.46 }}
      className="inline-flex items-center justify-center rounded-[calc(var(--radius)-2px)] bg-foreground text-background font-mono font-semibold flex-shrink-0"
    >
      A
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */
export function LetterHome({ onEnter, onNavigate }: { onEnter: () => void; onNavigate: (page: NavPage) => void }) {
  const tocIds = ["section-1", "section-2", "section-3", "section-4"]
  const active = useTocSpy(tocIds)
  const mainRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const toc = [
    { id: "section-1", num: "01", label: "症状" },
    { id: "section-2", num: "02", label: "信念" },
    { id: "section-3", num: "03", label: "自省" },
    { id: "section-4", num: "04", label: "防腐" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ fontFeatureSettings: "'rlig' 1, 'calt' 1" }}>

      <SiteHeader activePage="letter" onNavigate={onNavigate} />

      {/* ======== HERO ======== */}
      <section className="relative py-32 md:py-36 text-center overflow-hidden">
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at center, hsl(var(--foreground)/0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 60% 60% at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 60% at center, black 30%, transparent 80%)",
          }}
        />
        <div className="relative z-10 max-w-screen-xl mx-auto px-6">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-[0.02em] px-3 py-1.5 border border-border rounded-full bg-background text-foreground mb-7">
            <Sparkles className="w-3 h-3" />
            A COGNITION PROTOCOL · v1.0
          </span>
          <h1
            className="text-[clamp(2rem,5.6vw,4.5rem)] font-semibold tracking-[-0.045em] leading-[1.05] mb-7 whitespace-nowrap"
            style={{
              background: "linear-gradient(180deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)/0.75) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            献给和我一样的 AI 认知长期进化者
          </h1>
          <p className="text-[clamp(0.95rem,1.3vw,1.05rem)] text-muted-foreground leading-[1.7] max-w-[520px] mx-auto mb-9">
            一份关于「输出你的理解，而非 AI 的理解」的诚实约定
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={() => scrollToSection("section-1")}
              className="inline-flex items-center gap-2 h-12 px-7 text-[15px] font-medium rounded-[calc(var(--radius)-2px)] bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              开始阅读
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2 h-12 px-7 text-[15px] font-medium rounded-[calc(var(--radius)-2px)] border border-border bg-transparent text-foreground hover:bg-accent transition-colors"
            >
              进入 AICC
            </button>
          </div>
        </div>
      </section>

      {/* ======== MAIN ======== */}
      <main ref={mainRef} className="pb-16 pt-20">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-[220px_1fr] gap-[72px] items-start lg:grid-cols-[220px_1fr] md:grid-cols-1 md:gap-8">

          {/* TOC */}
          <aside className="sticky top-24 self-start hidden lg:block">
            <div className="text-[11px] font-mono font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3 pb-3 border-b border-border">
              目录
            </div>
            <ol className="list-none p-0 space-y-0.5">
              {toc.map(({ id, num, label }) => (
                <li key={id}>
                  <button
                    onClick={() => scrollToSection(id)}
                    className={`w-full text-left grid gap-2.5 items-baseline px-2.5 py-2 text-[13px] rounded-[calc(var(--radius)-2px)] transition-all border-l-2 -ml-0.5 ${
                      active === id
                        ? "text-foreground border-l-foreground font-medium"
                        : "text-muted-foreground border-l-transparent hover:text-foreground hover:bg-accent"
                    }`}
                    style={{ gridTemplateColumns: "24px 1fr" }}
                  >
                    <span className={`font-mono text-[11px] ${active === id ? "text-foreground" : "text-muted-foreground"}`}>
                      {num}
                    </span>
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          {/* CONTENT */}
          <div className="max-w-[720px] min-w-0">

            {/* Section 01 — 症状 */}
            <section id="section-1" className="pb-16">
              <header className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-2 bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)] font-mono text-[11px] font-semibold tracking-[0.02em]">
                    01
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Symptom · 症状
                  </span>
                </div>
                <p className="text-[14px] text-muted-foreground mb-1.5 tracking-[-0.005em]">和我一样，</p>
                <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.3]">
                  渴望 AI 认知进化但正经历这些：
                </h2>
              </header>
              <div className="grid gap-2">
                {[
                  { icon: Unlink, title: "AI 认知断裂", desc: "阅读 LLM 论文或 AI 技术论文的算法原理与数学公式晦涩难懂，认知负荷高到想让你放弃……", pin: "01" },
                  { icon: Target, title: "AI 认知单点", desc: "理解一个 AI 技术点往往顾不上与已有知识点链接，忽略行业应用场景的匹配。", pin: "02" },
                  { icon: Clock, title: "AI 认知丢失", desc: "通过 ChatBox 等学习完某个知识点，信息丢失到遗忘，无法形成长期复利。", pin: "03" },
                ].map(({ icon: Icon, title, desc, pin }) => (
                  <article
                    key={pin}
                    className="grid gap-4 items-start p-5 border border-border rounded-[var(--radius)] bg-card hover:border-foreground/35 hover:bg-accent/40 transition-all"
                    style={{ gridTemplateColumns: "40px 1fr auto" }}
                  >
                    <div className="w-10 h-10 bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)] inline-flex items-center justify-center flex-shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold tracking-[-0.005em] mb-1">{title}</div>
                      <div className="text-[13.5px] leading-[1.7] text-muted-foreground">{desc}</div>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground pt-0.5">{pin}</div>
                  </article>
                ))}
              </div>
            </section>

            {/* Section 02 — 信念 */}
            <section id="section-2" className="py-16 border-t border-border">
              <header className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-2 bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)] font-mono text-[11px] font-semibold tracking-[0.02em]">
                    02
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Belief · 信念
                  </span>
                </div>
                <p className="text-[14px] text-muted-foreground mb-1.5 tracking-[-0.005em]">和我一样，</p>
                <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.3]">
                  如果你相信以下 3 个判断
                </h2>
              </header>
              <div className="grid gap-2">
                {[
                  { seq: "01", text: <>AI 认知是行业工作者的<span className="font-semibold px-1.5 bg-secondary rounded">认知基石</span></> },
                  { seq: "02", text: <>AI 时代可以构建自己的<span className="font-semibold px-1.5 bg-secondary rounded">第二大脑</span></> },
                  { seq: "03", text: <>AI 时代时刻<span className="font-semibold px-1.5 bg-secondary rounded">警惕 AI 外包你的理解</span></> },
                ].map(({ seq, text }) => (
                  <div
                    key={seq}
                    className="grid gap-4 items-center p-4 px-5 border border-border rounded-[var(--radius)] bg-card hover:border-foreground/35 transition-colors"
                    style={{ gridTemplateColumns: "36px 1fr auto" }}
                  >
                    <span className="w-9 h-9 rounded-full bg-foreground text-background inline-flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </span>
                    <p className="text-[15px] leading-[1.6]">{text}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">{seq}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 03 — 自省 */}
            <section id="section-3" className="py-16 border-t border-border">
              <header className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-2 bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)] font-mono text-[11px] font-semibold tracking-[0.02em]">
                    03
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Honesty · 自省
                  </span>
                </div>
                <p className="text-[14px] text-muted-foreground mb-1.5 tracking-[-0.005em]">和我一样，</p>
                <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.3]">
                  如果你诚实面对人性的弱点
                </h2>
              </header>
              <div className="bg-muted border border-border rounded-[var(--radius)] p-2">
                {[
                  { marker: "i", text: "期待短期的正向及时反馈" },
                  { marker: "ii", text: "问了 AI 就觉得自己学会了" },
                  { marker: "iii", text: "想让利益方看看我在学习" },
                ].map(({ marker, text }, i) => (
                  <div
                    key={marker}
                    className={`grid gap-3.5 items-center p-3.5 px-3.5 rounded-[calc(var(--radius)-2px)] ${i > 0 ? "border-t border-border" : ""}`}
                    style={{ gridTemplateColumns: "28px 1fr" }}
                  >
                    <span className="w-7 h-7 rounded-full bg-background border border-border text-muted-foreground inline-flex items-center justify-center font-mono text-[11px] font-semibold flex-shrink-0">
                      {marker}
                    </span>
                    <p className="text-[14.5px] text-foreground/82 leading-[1.6] italic">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 04 — 防腐 */}
            <section id="section-4" className="py-16 border-t border-border">
              <header className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-2 bg-secondary text-secondary-foreground rounded-[calc(var(--radius)-2px)] font-mono text-[11px] font-semibold tracking-[0.02em]">
                    04
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    Practice · 防腐
                  </span>
                </div>
                <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.3]">
                  防腐行为设计
                </h2>
                <p className="mt-2.5 text-[15px] text-muted-foreground leading-[1.7]">
                  输出你的理解、非 AI 的理解，分享你的进步同不足。
                </p>
              </header>

              {/* Practice callout */}
              <div
                className="relative rounded-[var(--radius)] overflow-hidden text-background"
                style={{ background: "hsl(var(--foreground))", paddingTop: "28px", paddingLeft: "28px", paddingRight: "28px", paddingBottom: "8px" }}
              >
                {/* dot pattern */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle at center, hsl(var(--background)/0.06) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                    maskImage: "radial-gradient(ellipse 100% 60% at top right, black 0%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse 100% 60% at top right, black 0%, transparent 70%)",
                  }}
                />
                <div className="relative z-10">
                  {/* callout head */}
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b" style={{ borderColor: "hsl(var(--background)/0.15)" }}>
                    <ShieldCheck className="w-[18px] h-[18px] opacity-85" style={{ color: "hsl(var(--background))" }} />
                    <span className="text-[14px] font-semibold tracking-[0.01em]" style={{ color: "hsl(var(--background))" }}>
                      三条防腐行为约定
                    </span>
                    <span className="ml-auto font-mono text-[10.5px] tracking-[0.16em]" style={{ color: "hsl(var(--background)/0.6)" }}>
                      PROTOCOL
                    </span>
                  </div>

                  {[
                    {
                      step: "01",
                      content: (
                        <>
                          如果请 AI <strong style={{ fontWeight: 600, background: "hsl(var(--background)/0.1)", padding: "0 4px", borderRadius: 3 }}>教学</strong>，
                          那么请认为理解后{" "}
                          <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12.5px", padding: "1px 6px", background: "hsl(var(--background)/0.16)", borderRadius: 4 }}>24 小时</code>
                          {" "}后再产出 MD。
                        </>
                      ),
                    },
                    {
                      step: "02",
                      content: (
                        <>
                          如果请 AI <strong style={{ fontWeight: 600, background: "hsl(var(--background)/0.1)", padding: "0 4px", borderRadius: 3 }}>反馈</strong>，
                          要让 AI{" "}
                          <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12.5px", padding: "1px 6px", background: "hsl(var(--background)/0.16)", borderRadius: 4 }}>做评价题</code>
                          {" "}而不是让 AI 做问答题，同样认为理解后{" "}
                          <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12.5px", padding: "1px 6px", background: "hsl(var(--background)/0.16)", borderRadius: 4 }}>24 小时</code>
                          {" "}后再产出 MD。
                        </>
                      ),
                    },
                    {
                      step: "03",
                      content: (
                        <>
                          如果 AI 更新知识图谱，
                          <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12.5px", padding: "1px 6px", background: "hsl(var(--background)/0.16)", borderRadius: 4 }}>每一周 LLM 审计知识库和知识图谱</code>
                          ，检查是否有知识冲突，并让 AI{" "}
                          <strong style={{ fontWeight: 600, background: "hsl(var(--background)/0.1)", padding: "0 4px", borderRadius: 3 }}>提问和评价定稿</strong>
                          ，分享你的认知基线。
                        </>
                      ),
                    },
                  ].map(({ step, content }, i) => (
                    <div
                      key={step}
                      className="grid gap-4 items-start py-5"
                      style={{
                        gridTemplateColumns: "28px 1fr",
                        borderTop: i > 0 ? "1px solid hsl(var(--background)/0.1)" : undefined,
                      }}
                    >
                      <span
                        className="w-7 h-7 inline-flex items-center justify-center font-mono text-[11px] font-semibold rounded-[calc(var(--radius)-2px)] flex-shrink-0 mt-0.5"
                        style={{ background: "hsl(var(--background)/0.12)", color: "hsl(var(--background))" }}
                      >
                        {step}
                      </span>
                      <p className="text-[14.5px] leading-[1.75]" style={{ color: "hsl(var(--background)/0.94)" }}>
                        {content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ======== CTA ======== */}
            <div id="cta" className="mt-16 p-12 text-center border border-border rounded-[calc(var(--radius)+2px)] bg-card">
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-4">
                If You Are Like Me
              </p>
              <p className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold tracking-[-0.02em] leading-[1.4] mb-7">
                不要靠意志力，要用机制对抗腐蚀。
              </p>
              <Button size="lg" onClick={onEnter} className="px-7 h-12 text-[15px]">
                进入 AICC 学习系统
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="mt-5 text-[13px] text-muted-foreground">很欢迎你的批评、挑战与补充</p>
            </div>

          </div>
        </div>
      </main>

      {/* ======== FOOTER ======== */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <BrandMark size={22} />
            <span>AICC · A Cognition Protocol</span>
          </div>
          <div className="font-mono text-[12px] text-muted-foreground">
            v1.0 · 2026 · 05
          </div>
        </div>
      </footer>

    </div>
  )
}
