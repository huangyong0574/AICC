/**
 * 认知导航条：6 个认知节点 + 水平轨道进度指示
 * 节点：开场提问 → 类比理解 → 场景边界 → 深入原理 → 本质总结 → 开场提问闭环
 */

type NodeStatus = "completed" | "active" | "pending"

interface CognitiveNode {
  label: string
}

const NODES: CognitiveNode[] = [
  { label: "开场提问" },
  { label: "类比理解" },
  { label: "场景边界" },
  { label: "深入原理" },
  { label: "本质总结" },
  { label: "开场提问闭环" },
]

export function CognitiveNavBar({
  currentNode,
  completedNodes,
}: {
  currentNode: number // 1-6
  completedNodes: number[] // e.g. [1,2,3]
}) {
  function getStatus(idx: number): NodeStatus {
    const n = idx + 1
    if (completedNodes.includes(n)) return "completed"
    if (n === currentNode) return "active"
    return "pending"
  }

  // Determine the furthest completed segment for track coloring
  const maxCompleted = completedNodes.length > 0 ? Math.max(...completedNodes) : 0

  return (
    <div className="sticky top-14 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 h-12 flex items-center">
        {/* Track with nodes */}
        <div className="flex-1 flex items-center">
          {NODES.map((node, i) => {
            const status = getStatus(i)
            const isLast = i === NODES.length - 1

            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Node */}
                <div className="flex flex-col items-center gap-0.5">
                  {/* Circle */}
                  <div
                    className={`
                      w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                      ${status === "completed"
                        ? "bg-foreground border-foreground"
                        : status === "active"
                          ? "bg-foreground border-foreground animate-pulse"
                          : "bg-transparent border-muted-foreground/40"
                      }
                    `}
                  />
                  {/* Label */}
                  <span
                    className={`
                      text-[10px] leading-tight whitespace-nowrap transition-all duration-300
                      ${status === "completed"
                        ? "text-foreground/80"
                        : status === "active"
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground/50"
                      }
                      ${i > 0 && i < NODES.length - 1 ? "hidden sm:block" : ""}
                    `}
                  >
                    {node.label}
                  </span>
                </div>

                {/* Connector line (not after last node) */}
                {!isLast && (
                  <div
                    className={`
                      flex-1 h-[2px] mx-1 rounded-full transition-all duration-500
                      ${i + 1 < maxCompleted
                        ? "bg-foreground"
                        : i + 1 === maxCompleted && currentNode > maxCompleted
                          ? "bg-foreground/50"
                          : "bg-muted-foreground/20"
                      }
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
