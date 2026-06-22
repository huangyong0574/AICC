// 本地 Gateway 模式检测：判断 LLM 是否经本地 Gateway 就绪（key 在服务端，浏览器无需持 key）。
// - dist 模式（npm run aicc）：Gateway 在页面注入 window.__AICC_KEY_READY__，同步可知。
// - dev 模式（npm run dev + npm run gateway）：异步探测 /api/health 的 keyConfigured。
// - 都没有（纯静态旧部署，如 ECS 阅读页）：回落「浏览器持 key」旧模式，由 cfg.apiKey 决定。

type Win = Window & { __AICC_TOKEN__?: string; __AICC_KEY_READY__?: boolean }

let gatewayKeyReady: boolean =
  typeof window !== "undefined" && (window as Win).__AICC_KEY_READY__ === true

let probed = false

/** 单用户 token（dist 模式由 Gateway 注入），调 /api/llm、/api/health 时携带。 */
export function gatewayToken(): string {
  return (typeof window !== "undefined" && (window as Win).__AICC_TOKEN__) || ""
}

/** 本地 Gateway 是否已配置 key（服务端持 key）。 */
export function gatewayKeyConfigured(): boolean {
  return gatewayKeyReady
}

/** LLM 是否就绪：本地 Gateway 已配置 key，或浏览器本地填了 key（旧模式）。 */
export function isLlmReady(cfg: { apiKey?: string } | null | undefined): boolean {
  return gatewayKeyReady || !!cfg?.apiKey
}

/** 启动时探测一次（dev 模式用；dist 模式靠注入标志已同步可知，直接早退）。 */
export async function probeGateway(): Promise<void> {
  if (probed) return
  probed = true
  if (gatewayKeyReady) return
  try {
    const r = await fetch("/api/health")
    if (r.ok) {
      const j = await r.json()
      gatewayKeyReady = !!j.keyConfigured
    }
  } catch {
    /* 无 Gateway：保持旧模式（由 cfg.apiKey 决定） */
  }
}
