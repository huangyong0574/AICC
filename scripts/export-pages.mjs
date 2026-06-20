// 导出当前工程「实际渲染后」各页面的完整 HTML（含 dev 注入的 <style>，自包含可独立打开）。
// 用途：把 design/ 的旧 mockup 更新为真实页面基线。费曼页真实跑完四步再导出。
// 用法：先启动 dev（localhost:5188），再 `node scripts/export-pages.mjs`。
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const BASE = process.env.BASE_URL || 'http://localhost:5188'
const OUT = 'design/live'
const KEY = process.env.DASHSCOPE_API_KEY || '***DASHSCOPE_KEY_REVOKED***'
const CID = '2026-W25-01-mythos-class-safeguards'

const STATIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'radar-archive', path: '/radar' },
  { name: 'radar-week', path: '/radar/2026-W25' },
  { name: 'creation', path: '/creation' },
  { name: 'graph', path: '/graph' },
  { name: 'plan', path: '/plan' },
  { name: 'editor', path: '/editor' },
]

async function dump(page, name) {
  const html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML)
  await writeFile(join(OUT, name + '.html'), html, 'utf8')
  console.log('  ✓ saved', name + '.html', (html.length / 1024).toFixed(0) + 'KB')
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
const page = await ctx.newPage()
await mkdir(OUT, { recursive: true })

// 注入 LLM 配置 + 一个 learning 概念（供费曼/计划/雷达呈现真实状态）
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(({ KEY, CID }) => {
  localStorage.setItem('aicc-llm-cfg', JSON.stringify({ apiKey: KEY, baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'deepseek-v4-pro' }))
  localStorage.setItem('aicc-cognition-state', JSON.stringify({ [CID]: { state: 'learning', title: '高能力模型的风险降级护栏', sourceWeek: '2026-W25', addedAt: 1781000000000 } }))
  localStorage.removeItem('aicc-feynman-notes')
}, { KEY, CID })

console.log('▶ 静态页导出')
for (const p of STATIC_PAGES) {
  await page.goto(BASE + p.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await dump(page, p.name)
}

console.log('▶ 费曼页：真实跑四步')
await page.evaluate((CID) => sessionStorage.setItem('aicc-active-concept', CID), CID)
await page.goto(BASE + '/feynman', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
// 关设置弹窗
await page.locator('[aria-label="Close"], button:has-text("Close")').first().click({ timeout: 3000 }).catch(() => {})
// 开始讲解（若是恢复态则先重新开始）
const restart = page.locator('button:has-text("重新开始")').first()
if (await restart.count()) { page.on('dialog', d => d.accept()); await restart.click().catch(() => {}) ; await page.waitForTimeout(800) }
await page.locator('button:has-text("开始讲解")').first().click({ timeout: 8000 }).catch(() => {})
await page.waitForTimeout(5000)
await page.locator('[aria-label="Close"], button:has-text("Close")').first().click({ timeout: 3000 }).catch(() => {})
// 我看完了
await page.locator('button:has-text("我看完了")').first().click({ timeout: 25000 }).catch(() => {})
await page.waitForTimeout(2000)
// 四步：不确定直接看 → 等揭晓 → 我收走了 → 带走弹窗填+下一步
for (let i = 0; i < 4; i++) {
  console.log('  step', i + 1)
  const skip = page.locator('button:has-text("不确定，直接看")').first()
  await skip.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {})
  if (await skip.count()) await skip.click().catch(() => {})
  const collect = page.locator('button:has-text("我收走了")').first()
  await collect.waitFor({ state: 'visible', timeout: 90000 })
  await collect.click()
  await page.waitForTimeout(1500)
  const ta = page.locator('textarea').last()
  if (await ta.count()) await ta.fill(`第${i + 1}步的收获（导出基线占位）`).catch(() => {})
  await page.locator('button:has-text("带走")').first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(2500)
}
await page.waitForTimeout(2000)
await dump(page, 'feynman')

await browser.close()
console.log('DONE')
