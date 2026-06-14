// 简单验证脚本：截图 /radar 页面 + 控制台错误捕获
import { chromium } from 'playwright'

const URL = 'http://localhost:5180/radar'
const OUT_FULL = '/Users/huangyong/Desktop/AICC/test-screenshots/radar-verify-full.png'
const OUT_TOP = '/Users/huangyong/Desktop/AICC/test-screenshots/radar-verify-top.png'
const OUT_DARK = '/Users/huangyong/Desktop/AICC/test-screenshots/radar-verify-dark.png'

const errors = []

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`)
})
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })

// 验证关键元素存在
const heroKicker = await page.locator('text=WEEKLY RADAR · 2026-W22 · LIVE').count()
const h1Text = await page.locator('h1').first().textContent()
const cardCount = await page.locator('article').count()
const filterChips = await page.locator('button:has-text("全部")').count()
const inPlanBtn = await page.locator('button:has-text("加入深入计划")').count()
const navTab = await page.locator('button:has-text("认知雷达")').count()

console.log('=== /radar 渲染验证 ===')
console.log('Kicker 文案存在:', heroKicker > 0)
console.log('H1 内容:', h1Text)
console.log('article 卡片数:', cardCount)
console.log('全部筛选 chip:', filterChips > 0)
console.log('加入深入计划按钮数:', inPlanBtn)
console.log('导航 认知雷达 tab:', navTab)
console.log('控制台错误数:', errors.length)
if (errors.length) errors.forEach(e => console.log(e))

// 顶部截图
await page.screenshot({ path: OUT_TOP, clip: { x: 0, y: 0, width: 1280, height: 900 } })
// 全页截图
await page.screenshot({ path: OUT_FULL, fullPage: true })
console.log('已保存截图:', OUT_TOP, OUT_FULL)

// 点击 "研究前沿" filter chip
const frontierChip = page.locator('button:has-text("研究前沿")').first()
if (await frontierChip.count()) {
  await frontierChip.click()
  await page.waitForTimeout(200)
  const visibleCount = await page.locator('article:visible').count()
  console.log('研究前沿筛选后可见卡片数:', visibleCount)
}
// 切回全部
await page.locator('button:has-text("全部")').first().click()
await page.waitForTimeout(200)

// 点击第 1 张卡片的 "加入深入计划"
const firstAdd = page.locator('button:has-text("加入深入计划")').first()
await firstAdd.click()
await page.waitForTimeout(200)
// 读取 Toolbar 计划摘要（用 first() 限定到 toolbar 内的深入计划文字）
const planSummary = await page.locator('div').filter({ hasText: '深入计划' }).filter({ hasText: '全部' }).first().textContent().catch(() => null)
// 用 Toolbar 唯一标识的"深入计划" + " / 7" 抓取
const planCountEl = await page.locator('span', { hasText: /\d+ \/ 7/ }).first().textContent()
console.log('加入计划后 Toolbar 计数元素:', planCountEl)
console.log('加入计划后 Toolbar 摘要:', planSummary?.replace(/\s+/g, ' '))

// 切到深色模式
const themeBtn = page.locator('button[aria-label="切换主题"]')
await themeBtn.click()
await page.waitForTimeout(300)
await page.screenshot({ path: OUT_DARK, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 900 } })
console.log('已保存深色模式截图:', OUT_DARK)

await browser.close()
console.log('=== 验证完成 ===')
