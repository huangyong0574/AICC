import type { ReactNode } from "react"

type Tone = "warning" | "primary" | "muted" | "success" | "destructive"

/**
 * 流式分段外壳：已就绪渲染 children，否则渲染骨架 + 叙事加载文案 + 跳动圆点。
 * 步骤1/2/3 共用，保证视觉语言一致。
 */
export function StreamingSection({
  icon,
  title,
  tone,
  ready,
  streaming,
  loadingText,
  skeletonLines,
  hideHeader,
  header,
  variant = "card",
  children,
}: {
  icon: ReactNode
  title: string
  tone: Tone
  ready: boolean
  streaming: boolean
  loadingText: string
  skeletonLines: number
  /** 已就绪时是否隐藏外壳（如 LoopBlock 自带外壳） */
  hideHeader?: boolean
  /** 自定义表头（如 eyebrow 编号样式）；提供时取代默认 icon+title 表头 */
  header?: ReactNode
  /** card=带边框卡片（默认）；plain=无边框开放编辑体（对齐设计稿 L1 排版） */
  variant?: "card" | "plain"
  children: ReactNode
}) {
  if (ready && hideHeader) return <>{children}</>
  if (!ready && !streaming) return null

  const plain = variant === "plain"
  const wrapCls = plain
    ? "animate-fade-in-up"
    : `${wrapperCls(tone)}${ready ? "" : " relative overflow-hidden animate-fade-in-up"}`

  const renderHeader = () =>
    header ? (
      <div className={plain ? "mb-3.5" : "mb-2"}>{header}</div>
    ) : (
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-semibold ${toneTextCls(tone)} uppercase tracking-wider`}>
          {title}
        </span>
        {!ready && (
          <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
            <BouncingDots />
            <span>{loadingText}</span>
          </span>
        )}
      </div>
    )

  return (
    <div
      className={wrapCls}
      {...(!ready ? { "aria-busy": "true", "data-loading-section": title } : {})}
    >
      {renderHeader()}
      {ready ? (
        children
      ) : (
        <>
          {header && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <BouncingDots />
              <span>{loadingText}</span>
            </div>
          )}
          <div className="space-y-2">
            {Array.from({ length: skeletonLines }).map((_, i) => (
              <div
                key={i}
                className="h-3 rounded bg-muted/60 animate-pulse"
                style={{
                  width: `${95 - i * 8}%`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function BouncingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  )
}

function wrapperCls(tone: Tone) {
  switch (tone) {
    case "warning":
      return "rounded-lg border border-warning/30 bg-warning/5 p-4"
    case "primary":
      return "rounded-lg border border-primary/30 bg-primary/5 p-4"
    case "success":
      return "rounded-lg border border-success/30 bg-success/5 p-4"
    case "destructive":
      return "rounded-lg border border-destructive/30 bg-destructive/5 p-4"
    case "muted":
      return "rounded-lg border border-border/60 bg-card/40 p-4"
  }
}

function toneTextCls(tone: Tone) {
  switch (tone) {
    case "warning":
      return "text-warning"
    case "primary":
      return "text-primary"
    case "success":
      return "text-success"
    case "destructive":
      return "text-destructive"
    case "muted":
      return "text-muted-foreground"
  }
}
