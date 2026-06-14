// 端到端验证：深色模式 + 筛选 + 清空 + 重新加入
import { chromium } from 'playwright'

const URL = 'http://localhost:5180/radar'
const errors = []

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`))
page.on('console', msg => msg.type() === 'error' && errors.push(`[console.error] ${msg.text()}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('aicc-deep-plan'))
await page.reload({ waitUntil: 'networkidle' })

// 切到深色
await page.click('button[aria-label="切换主题"]')
await page.waitForTimeout(300)

// 验证 dark class 已应用
const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
console.log('深色模式已启用:', isDark)

// 切到「成熟可用」
await page.click('button:has-text("成熟可用")')
await page.waitForTimeout(200)
const matureCount = await page.locator('article:visible').count()
console.log('成熟可用筛选卡片数（应为 3）:', matureCount)

// 切到「研究前沿」
await page.click('button:has-text("研究前沿")')
await page.waitForTimeout(200)
const frontierCount = await page.locator('article:visible').count()
console.log('研究前沿筛选卡片数（应为 4）:', frontierCount)

// 切回「全部」
await page.click('button:has-text("全部")')
await page.waitForTimeout(200)
const allCount = await page.locator('article:visible').count()
console.log('全部筛选卡片数（应为 7）:', allCount)

// 加入 3 张卡到计划
const addBtns = await page.locator('button:has-text("加入深入计划")').all()
for (let i = 0; i < 3; i++) {
  await addBtns[i].click()
  await page.waitForTimeout(50)
}
const planCount = await page.locator('span', { hasText: /\d+ \/ 7/ }).first().textContent()
console.log('加入 3 项后计划计数（应为 3 / 7）:', planCount)

// 验证 localStorage 写入
const stored = await page.evaluate(() => localStorage.getItem('aicc-deep-plan'))
console.log('localStorage 持久化:', stored)

// 切到"研究前沿"，验证 in-plan 卡片是否带有 in-plan 视觉样式
await page.click('button:has-text("研究前沿")')
await page.waitForTimeout(200)
const inPlanClassCount = await page.locator('article[class*="mature"]').count() // 检查带 green inset border 的卡片
const inPlanClassCount2 = await page.locator('article.shadow-\\[inset_3px_0_0').count()
console.log('研究前沿筛选下 in-plan 卡片数（应有 2，因为 1/2/3/6 中我们加入了 1/2/3）:', inPlanClassCount2)

// 点击「清空计划」（需要接受 confirm 对话框）
page.once('dialog', dialog => dialog.accept())
await page.click('button[aria-label="清空计划"]')
await page.waitForTimeout(200)
const afterClear = await page.locator('span', { hasText: /\d+ \/ 7/ }).first().textContent()
console.log('清空后计划计数（应为 0 / 7）:', afterClear)

// 切回浅色
await page.click('button:has-text("全部")')
await page.waitForTimeout(150)
await page.click('button[aria-label="切换主题"]')
await page.waitForTimeout(300)
await page.screenshot({ path: '/Users/huangyong/Desktop/AICC/test-screenshots/radar-e2e-final.png', clip: { x: 0, y: 0, width: 1280, height: 900 } })

console.log('控制台错误数:', errors.length)
errors.forEach(e => console.log(e))
console.log('=== E2E 完成 ===')

await browser.close()
