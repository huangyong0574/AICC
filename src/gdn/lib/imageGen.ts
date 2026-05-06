/**
 * 通义万相文生图 API 封装
 * 用于步骤1 概念示意图生成
 */

import type { LlmConfig } from "../types"

/** 通义万相 API 基础配置 */
const WANX_BASE_URL = "https://dashscope.aliyuncs.com/api/v1"
const WANX_MODEL = "wanx-v1"

/**
 * 调用通义万相生成图片
 * @param prompt 文生图 prompt（英文，描述画面）
 * @param cfg LLM 配置（复用 API Key）
 * @returns Base64 data URI 或图片 URL
 */
export async function generateConceptImage(
  prompt: string,
  cfg: LlmConfig,
): Promise<string> {
  if (!cfg.apiKey) throw new Error("请先在设置里填入 API Key")

  const res = await fetch(`${WANX_BASE_URL}/services/aigc/text2image/image-synthesis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.apiKey}`,
      "X-DashScope-Async": "enable", // 异步任务模式
    },
    body: JSON.stringify({
      model: WANX_MODEL,
      input: {
        prompt: prompt,
        negative_prompt: "text, watermark, signature, blurry, low quality, distorted",
      },
      parameters: {
        style: "<auto>", // 自动选择风格
        size: "1024*1024", // 图片尺寸
        n: 1, // 生成1张
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`通义万相调用失败 (${res.status}): ${errText}`)
  }

  const data = await res.json()

  // 异步任务模式：返回 task_id，需要轮询结果
  if (data.output?.task_id) {
    return await pollTaskResult(data.output.task_id, cfg.apiKey)
  }

  // 同步模式（如果返回了直接结果）
  if (data.output?.results?.[0]?.url) {
    return data.output.results[0].url
  }

  throw new Error("通义万相返回格式异常")
}

/**
 * 轮询异步任务结果
 */
async function pollTaskResult(
  taskId: string,
  apiKey: string,
  maxRetries = 30,
  intervalMs = 2000,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    await sleep(intervalMs)

    const res = await fetch(`${WANX_BASE_URL}/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!res.ok) continue

    const data = await res.json()
    const status = data.output?.task_status

    if (status === "SUCCEEDED") {
      // 成功：返回图片 URL
      return data.output.results?.[0]?.url || ""
    }

    if (status === "FAILED") {
      throw new Error(`图片生成失败: ${data.output.message || "未知错误"}`)
    }

    // PENDING / RUNNING：继续轮询
  }

  throw new Error("图片生成超时，请稍后重试")
}

/** 简单延时 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
