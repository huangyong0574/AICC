/**
 * SVG 模板渲染器：根据 LLM 返回的结构化数据生成精致 SVG
 * 支持 5 种布局：flowchart / comparison / hierarchy / cycle / architecture
 */

import type { ConceptDiagram } from "../types"

/** 配色方案（shadcn 风格） */
const COLORS = {
  primary: "#3b82f6",
  primaryLight: "#eff6ff",
  success: "#10b981",
  successLight: "#ecfdf5",
  warning: "#f59e0b",
  warningLight: "#fffbeb",
  muted: "#6b7280",
  mutedLight: "#f9fafb",
  text: "#1e293b",
  textSecondary: "#64748b",
  stroke: "#e2e8f0",
  bg: "#ffffff",
}

/** 节点尺寸 */
const NODE_W = 150
const NODE_H = 72
const NODE_RX = 12
const FONT_TITLE = 13
const FONT_SUB = 11

/**
 * 渲染 SVG：根据模板类型 + 节点数据
 */
export function renderDiagramSvg(data: ConceptDiagram): string {
  const { templateType, nodes, edges } = data
  void edges

  switch (templateType) {
    case "flowchart":
      return renderFlowchart(nodes, edges)
    case "comparison":
      return renderComparison(nodes, edges)
    case "hierarchy":
      return renderHierarchy(nodes, edges)
    case "cycle":
      return renderCycle(nodes, edges)
    case "architecture":
      return renderArchitecture(nodes, edges)
    default:
      return renderFlowchart(nodes, edges)
  }
}

/** 1. 流程图模板：线性/分支流程 */
function renderFlowchart(nodes: ConceptDiagram["nodes"], edges: ConceptDiagram["edges"]): string {
  const W = 680
  const H = 340
  const startY = 140

  // 自动计算节点 X 坐标（水平排列）
  const nodePositions = nodes.map((node, i) => ({
    ...node,
    x: 60 + i * 160,
    y: startY,
  }))

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${W}" height="${H}" fill="${COLORS.bg}" rx="8"/>`

  // 渲染箭头标记
  svg += `<defs><marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">`
  svg += `<path d="M0 0 L10 4 L0 8 Z" fill="${COLORS.muted}"/>`
  svg += `</marker></defs>`

  // 渲染节点
  for (const node of nodePositions) {
    const color = node.color || COLORS.primary
    const lightBg = getLightColor(color)

    svg += `<g transform="translate(${node.x}, ${node.y})">`
    svg += `<rect width="${NODE_W}" height="${NODE_H}" rx="${NODE_RX}" fill="${lightBg}" stroke="${color}" stroke-width="2"/>`
    svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 - 4}" text-anchor="middle" font-size="${FONT_TITLE}" fill="${COLORS.text}" font-family="system-ui, -apple-system, sans-serif" font-weight="600">${node.label}</text>`
    if (node.sublabel) {
      svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 + 16}" text-anchor="middle" font-size="${FONT_SUB}" fill="${COLORS.textSecondary}" font-family="system-ui, -apple-system, sans-serif">${node.sublabel}</text>`
    }
    svg += `</g>`
  }

  // 渲染边
  for (const edge of edges) {
    const fromNode = nodePositions.find(n => n.id === edge.from)
    const toNode = nodePositions.find(n => n.id === edge.to)
    if (!fromNode || !toNode) continue

    const x1 = fromNode.x + NODE_W
    const y1 = fromNode.y + NODE_H / 2
    const x2 = toNode.x
    const y2 = toNode.y + NODE_H / 2

    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.muted}" stroke-width="2" marker-end="url(#arrow)"/>`

    // 箭头标签
    if (edge.label) {
      const mx = (x1 + x2) / 2
      const my = y1 - 8
      svg += `<rect x="${mx - 30}" y="${my - 10}" width="60" height="20" rx="4" fill="${COLORS.bg}" stroke="${COLORS.stroke}" stroke-width="1"/>`
      svg += `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="10" fill="${COLORS.textSecondary}" font-family="system-ui, -apple-system, sans-serif">${edge.label}</text>`
    }
  }

  svg += `</svg>`
  return svg
}

/** 2. 对比图模板：左右对比/新旧对比 */
function renderComparison(nodes: ConceptDiagram["nodes"], _edges: ConceptDiagram["edges"]): string {
  void _edges
  const W = 680
  const H = 340

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${W}" height="${H}" fill="${COLORS.bg}" rx="8"/>`

  // 左右两个大框
  const leftX = 40
  const rightX = 350
  const boxW = 290
  const boxH = 280

  svg += `<rect x="${leftX}" y="30" width="${boxW}" height="${boxH}" rx="12" fill="${COLORS.primaryLight}" stroke="${COLORS.primary}" stroke-width="1.5"/>`
  svg += `<rect x="${rightX}" y="30" width="${boxW}" height="${boxH}" rx="12" fill="${COLORS.successLight}" stroke="${COLORS.success}" stroke-width="1.5"/>`

  // 标题
  svg += `<text x="${leftX + boxW / 2}" y="60" text-anchor="middle" font-size="15" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="700">${nodes[0]?.label || "旧方案"}</text>`
  svg += `<text x="${rightX + boxW / 2}" y="60" text-anchor="middle" font-size="15" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="700">${nodes[1]?.label || "新方案"}</text>`

  // 节点内容
  const leftNodes = nodes.filter((_, i) => i % 2 === 0).slice(1)
  const rightNodes = nodes.filter((_, i) => i % 2 === 1).slice(1)

  leftNodes.forEach((node, i) => {
    const y = 90 + i * 55
    svg += `<g transform="translate(${leftX + 20}, ${y})">`
    svg += `<rect width="${boxW - 40}" height="45" rx="8" fill="${COLORS.bg}" stroke="${COLORS.stroke}" stroke-width="1"/>`
    svg += `<text x="12" y="27" font-size="12" fill="${COLORS.text}" font-family="system-ui, sans-serif">${node.label}</text>`
    svg += `</g>`
  })

  rightNodes.forEach((node, i) => {
    const y = 90 + i * 55
    svg += `<g transform="translate(${rightX + 20}, ${y})">`
    svg += `<rect width="${boxW - 40}" height="45" rx="8" fill="${COLORS.bg}" stroke="${COLORS.stroke}" stroke-width="1"/>`
    svg += `<text x="12" y="27" font-size="12" fill="${COLORS.text}" font-family="system-ui, sans-serif">${node.label}</text>`
    svg += `</g>`
  })

  // VS 标记
  svg += `<circle cx="${W / 2}" cy="${H / 2}" r="24" fill="${COLORS.bg}" stroke="${COLORS.muted}" stroke-width="2"/>`
  svg += `<text x="${W / 2}" y="${H / 2 + 5}" text-anchor="middle" font-size="14" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="800">VS</text>`

  svg += `</svg>`
  return svg
}

/** 3. 层级图模板：树状/金字塔 */
function renderHierarchy(nodes: ConceptDiagram["nodes"], edges: ConceptDiagram["edges"]): string {
  const W = 680
  const H = 340

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${W}" height="${H}" fill="${COLORS.bg}" rx="8"/>`

  svg += `<defs><marker id="arrow-h" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">`
  svg += `<path d="M0 0 L8 3 L0 6 Z" fill="${COLORS.muted}"/>`
  svg += `</marker></defs>`

  // 3 层布局：1-2-1 或 1-3-1
  const layers = [
    nodes.slice(0, 1),
    nodes.slice(1, 3),
    nodes.slice(3, 4),
  ]

  const layerY = [50, 140, 240]
  const layerCenters = [W / 2, W / 2, W / 2]

  const nodePositions = layers.flatMap((layer, li) =>
    layer.map((node, ni) => ({
      ...node,
      x: layerCenters[li] - (layer.length * NODE_W) / 2 + ni * (NODE_W + 20),
      y: layerY[li],
    }))
  )

  // 渲染节点
  for (const node of nodePositions) {
    const color = node.color || COLORS.primary
    const lightBg = getLightColor(color)

    svg += `<g transform="translate(${node.x}, ${node.y})">`
    svg += `<rect width="${NODE_W}" height="${NODE_H}" rx="${NODE_RX}" fill="${lightBg}" stroke="${color}" stroke-width="2"/>`
    svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 - 4}" text-anchor="middle" font-size="${FONT_TITLE}" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="600">${node.label}</text>`
    if (node.sublabel) {
      svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 + 16}" text-anchor="middle" font-size="${FONT_SUB}" fill="${COLORS.textSecondary}" font-family="system-ui, sans-serif">${node.sublabel}</text>`
    }
    svg += `</g>`
  }

  // 渲染边（简化：上下层连接）
  for (const edge of edges) {
    const from = nodePositions.find(n => n.id === edge.from)
    const to = nodePositions.find(n => n.id === edge.to)
    if (!from || !to) continue

    const x1 = from.x + NODE_W / 2
    const y1 = from.y + NODE_H
    const x2 = to.x + NODE_W / 2
    const y2 = to.y

    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.muted}" stroke-width="1.5" marker-end="url(#arrow-h)"/>`
  }

  svg += `</svg>`
  return svg
}

/** 4. 循环图模板：环形流程 */
function renderCycle(nodes: ConceptDiagram["nodes"], _edges: ConceptDiagram["edges"]): string {
  void _edges
  const W = 680
  const H = 340
  const cx = W / 2
  const cy = H / 2
  const radius = 100

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${W}" height="${H}" fill="${COLORS.bg}" rx="8"/>`

  svg += `<defs><marker id="arrow-c" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">`
  svg += `<path d="M0 0 L8 3 L0 6 Z" fill="${COLORS.muted}"/>`
  svg += `</marker></defs>`

  // 环形节点
  const nodePositions = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
    const x = cx + radius * Math.cos(angle) - NODE_W / 2
    const y = cy + radius * Math.sin(angle) - NODE_H / 2
    return { ...node, x, y, angle }
  })

  // 渲染节点
  for (const node of nodePositions) {
    const color = node.color || COLORS.primary
    const lightBg = getLightColor(color)

    svg += `<g transform="translate(${node.x}, ${node.y})">`
    svg += `<rect width="${NODE_W}" height="${NODE_H}" rx="${NODE_RX}" fill="${lightBg}" stroke="${color}" stroke-width="2"/>`
    svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 - 4}" text-anchor="middle" font-size="${FONT_TITLE}" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="600">${node.label}</text>`
    if (node.sublabel) {
      svg += `<text x="${NODE_W / 2}" y="${NODE_H / 2 + 16}" text-anchor="middle" font-size="${FONT_SUB}" fill="${COLORS.textSecondary}" font-family="system-ui, sans-serif">${node.sublabel}</text>`
    }
    svg += `</g>`
  }

  // 环形箭头
  for (let i = 0; i < nodePositions.length; i++) {
    const curr = nodePositions[i]
    const next = nodePositions[(i + 1) % nodePositions.length]

    const x1 = curr.x + NODE_W / 2 + (NODE_W / 2 + 5) * Math.cos(curr.angle + 0.3)
    const y1 = curr.y + NODE_H / 2 + (NODE_H / 2 + 5) * Math.sin(curr.angle + 0.3)
    const x2 = next.x + NODE_W / 2 - (NODE_W / 2 + 5) * Math.cos(next.angle - 0.3)
    const y2 = next.y + NODE_H / 2 - (NODE_H / 2 + 5) * Math.sin(next.angle - 0.3)

    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.muted}" stroke-width="2" marker-end="url(#arrow-c)"/>`
  }

  // 中心文字
  svg += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="14" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="700">持续迭代</text>`

  svg += `</svg>`
  return svg
}

/** 5. 架构图模板：分层系统架构 */
function renderArchitecture(nodes: ConceptDiagram["nodes"], _edges: ConceptDiagram["edges"]): string {
  void _edges
  const W = 680
  const H = 360

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${W}" height="${H}" fill="${COLORS.bg}" rx="8"/>`

  // 3 层架构：输入层 → 处理层 → 输出层
  const layers = [
    nodes.slice(0, Math.ceil(nodes.length / 3)),
    nodes.slice(Math.ceil(nodes.length / 3), Math.ceil(nodes.length * 2 / 3)),
    nodes.slice(Math.ceil(nodes.length * 2 / 3)),
  ]

  const layerBg = [COLORS.primaryLight, COLORS.warningLight, COLORS.successLight]
  const layerStroke = [COLORS.primary, COLORS.warning, COLORS.success]
  const layerLabels = ["输入层", "处理层", "输出层"]

  const layerH = 90
  const layerGap = 15

  layers.forEach((layer, li) => {
    const y = 20 + li * (layerH + layerGap)
    const boxW = W - 80

    // 层背景
    svg += `<rect x="40" y="${y}" width="${boxW}" height="${layerH}" rx="10" fill="${layerBg[li]}" stroke="${layerStroke[li]}" stroke-width="1.5"/>`
    svg += `<text x="55" y="${y + 18}" font-size="11" fill="${layerStroke[li]}" font-family="system-ui, sans-serif" font-weight="600">${layerLabels[li]}</text>`

    // 层内节点
    const nodeW = (boxW - 20 - (layer.length - 1) * 10) / layer.length
    layer.forEach((node, ni) => {
      const x = 50 + ni * (nodeW + 10)
      const ny = y + 28

      svg += `<g transform="translate(${x}, ${ny})">`
      svg += `<rect width="${nodeW}" height="48" rx="6" fill="${COLORS.bg}" stroke="${layerStroke[li]}" stroke-width="1"/>`
      svg += `<text x="${nodeW / 2}" y="28" text-anchor="middle" font-size="12" fill="${COLORS.text}" font-family="system-ui, sans-serif" font-weight="600">${node.label}</text>`
      svg += `</g>`
    })
  })

  // 层间箭头（简化：居中垂直连接）
  for (let li = 0; li < layers.length - 1; li++) {
    const y1 = 20 + li * (layerH + layerGap) + layerH
    const y2 = y1 + layerGap
    svg += `<line x1="${W / 2}" y1="${y1}" x2="${W / 2}" y2="${y2}" stroke="${COLORS.muted}" stroke-width="2" marker-end="url(#arrow-h)"/>`
  }

  svg += `<defs><marker id="arrow-h" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">`
  svg += `<path d="M0 0 L8 3 L0 6 Z" fill="${COLORS.muted}"/>`
  svg += `</marker></defs>`

  svg += `</svg>`
  return svg
}

/** 辅助：根据主色获取浅色背景 */
function getLightColor(color: string): string {
  const map: Record<string, string> = {
    [COLORS.primary]: COLORS.primaryLight,
    [COLORS.success]: COLORS.successLight,
    [COLORS.warning]: COLORS.warningLight,
    [COLORS.muted]: COLORS.mutedLight,
  }
  return map[color] || COLORS.primaryLight
}
