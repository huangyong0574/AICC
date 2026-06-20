import type { ReactNode } from "react"

/** eyebrow 段落表头（对齐设计稿）：编号 — 标签 ———— 右侧关键词 */
export function Eyebrow({ no, label, keyword }: { no: string; label: string; keyword?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
        {no} — {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      {keyword && (
        <span className="shrink-0 max-w-[55%] truncate text-[12px] text-muted-foreground">{keyword}</span>
      )}
    </div>
  )
}

/** 块级表头（对齐设计稿 .block .bh）：方框图标 + 加粗标题 */
export function BlockHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M3 16v3a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3" />
      </svg>
      <span className="text-[13px] font-semibold text-foreground">{children}</span>
    </div>
  )
}

/** 圆圈图标表头（对齐设计稿 适用/不适用）：圆圈 ✓/✗ + 中文标签 + 英文副标 */
export function IconHead({ tone, label, caption }: { tone: "ok" | "bad"; label: string; caption?: string }) {
  const cls = tone === "ok" ? "border-success text-success" : "border-destructive text-destructive"
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] ${cls}`}>
        {tone === "ok" ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
        )}
      </span>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      {caption && <span className="text-[11px] tracking-[0.1em] text-muted-foreground">{caption}</span>}
    </div>
  )
}
