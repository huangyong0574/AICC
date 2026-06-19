import { useEffect, useState } from "react"
import { Network, Radar, Search, Sun, Moon, ScrollText, BookmarkCheck, SquarePen } from "lucide-react"

export type NavPage = "letter" | "graph" | "article" | "radar" | "plan" | "editor" | "creation"

interface SiteHeaderProps {
  activePage: NavPage
  onNavigate: (page: NavPage) => void
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("aicc-theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("aicc-theme", dark ? "dark" : "light")
  }, [dark])
  return [dark, () => setDark(d => !d)] as const
}

export function useDarkModeShared() {
  return useDarkMode()
}

export function SiteHeader({ activePage, onNavigate }: SiteHeaderProps) {
  const [dark, toggleDark] = useDarkMode()

  const navTabs = [
    { id: "letter" as NavPage, icon: ScrollText, label: "产品文化" },
    { id: "radar" as NavPage, icon: Radar, label: "认知雷达" },
    { id: "plan" as NavPage, icon: BookmarkCheck, label: "深度计划" },
    { id: "graph" as NavPage, icon: Network, label: "认知图谱" },
    { id: "creation" as NavPage, icon: SquarePen, label: "创作" },
  ]

  const isActive = (id: NavPage) => {
    // 文章页归属于认知雷达体系（文章是某认知点的成稿产物）
    if (activePage === "article" && id === "radar") return true
    // 编辑器/成稿是创作体系的一部分，归属「创作」tab
    if (activePage === "editor" && id === "creation") return true
    return activePage === id
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "hsl(var(--background) / 0.85)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate("radar")}
          className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-[-0.01em]"
        >
          <span
            className="inline-flex items-center justify-center rounded-[calc(var(--radius)-2px)] font-mono font-semibold text-[13px]"
            style={{ width: 28, height: 28, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            A
          </span>
          <span>AICC</span>
          <span
            className="font-mono text-[11px] text-muted-foreground border border-border rounded-[calc(var(--radius)-2px)] ml-1"
            style={{ padding: "2px 8px" }}
          >
            v1.0
          </span>
        </button>

        {/* Nav tabs */}
        <nav
          className="hidden md:inline-flex items-center gap-0.5 rounded-[calc(var(--radius)-2px)]"
          style={{ background: "hsl(var(--secondary))", padding: 4 }}
          aria-label="主导航"
        >
          {navTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-1.5 text-[13px] font-medium rounded-[calc(var(--radius)-4px)] transition-all ${
                isActive(id)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ padding: "6px 14px" }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 inline-flex items-center justify-center border border-transparent bg-transparent text-foreground rounded-[calc(var(--radius)-2px)] hover:bg-accent transition-colors"
            aria-label="搜索"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={toggleDark}
            className="w-9 h-9 inline-flex items-center justify-center border border-transparent bg-transparent text-foreground rounded-[calc(var(--radius)-2px)] hover:bg-accent transition-colors"
            aria-label="切换主题"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
