// ============================================================
// 离线预览 Fixtures
// 数据来源：2026-05-05 真实 LLM 调用样本（主题：GDN / Gated Delta Network）
// 使用方式：设置面板开启「离线预览」后，llm.ts 各入口将直接读取本文件，
// 不再触达真实 API，便于快速调试 UI。
// ============================================================

import type {
  Step1Answer, Step2Answer, Step3Answer,
  FeynmanReviewItem, GraphDelta,
} from "../types"

// JSON 文件结构：{ _meta, data }
import warmupRaw from "./data/feynman-warmup-sample.json"
import step1Raw from "./data/step1-sample.json"
import step2Raw from "./data/step2-sample.json"
import step3Raw from "./data/step3-sample.json"
import reviewRaw from "./data/feynman-review-sample.json"

// ------------------------------------------------------------
// 数据解包（从 {_meta,data} 中取出 data 部分）
// ------------------------------------------------------------

export const FIXTURE_WARMUP: Array<{ role: "biz" | "cto" | "dev"; question: string }> =
  warmupRaw.data as any

export const FIXTURE_STEP1: Step1Answer = step1Raw.data as any
export const FIXTURE_STEP2: Step2Answer = step2Raw.data as any
export const FIXTURE_STEP3: Step3Answer = step3Raw.data as any

export const FIXTURE_REVIEW: { reviews: FeynmanReviewItem[]; graph: GraphDelta } = {
  reviews: (reviewRaw.data as any).reviews as FeynmanReviewItem[],
  graph: (reviewRaw.data as any).graph as GraphDelta,
}

// ------------------------------------------------------------
// 主题提示：该 fixture 只针对 GDN 定制
// ------------------------------------------------------------
export const FIXTURE_TOPIC = "GDN（Gated Delta Network）"

// ------------------------------------------------------------
// 流式模拟：把已解析对象分片喂给 onText，模拟 SSE 打字机体验
//   - 默认 50 个切片，每片 30ms（整体约 1.5s）
//   - 可通过 VITE 环境变量/运行参数调整，但这里保持常量即可
// ------------------------------------------------------------

export async function simulateStream(
  data: unknown,
  onText: (accumulated: string) => void,
  opts?: { chunks?: number; intervalMs?: number; signal?: AbortSignal },
): Promise<void> {
  const full = JSON.stringify(data)
  const chunks = Math.max(1, opts?.chunks ?? 50)
  const interval = Math.max(0, opts?.intervalMs ?? 30)
  const step = Math.ceil(full.length / chunks)

  for (let i = 1; i <= chunks; i++) {
    if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError")
    const partial = full.slice(0, Math.min(i * step, full.length))
    onText(partial)
    if (i < chunks) await sleep(interval, opts?.signal)
  }
  // 最后确保吐完整串
  onText(full)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    }, { once: true })
  })
}

/** 统一的"假装在思考"延时 */
export function mockDelay(ms = 400, signal?: AbortSignal): Promise<void> {
  return sleep(ms, signal)
}
