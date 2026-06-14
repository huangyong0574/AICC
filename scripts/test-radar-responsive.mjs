// 响应式 + 深色全页截图
import { chromium } from 'playwright'

const URL = 'http://localhost:5180/radar'

const browser = await chromium.launch()

// 1. Mobile portrait
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  // 清空计划后再截图
  await page.evaluate(() => localStorage.removeItem('aicc-deep-plan'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.screenshot({ path: '/Users/huangyong/Desktop/AICC/test-screenshots/radar-mobile.png', fullPage: true })
  await ctx.close()
  console.log('已保存 mobile 全页截图')
}

// 2. Tablet
{
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('aicc-deep-plan'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.screenshot({ path: '/Users/huangyong/Desktop/AICC/test-screenshots/radar-tablet.png', fullPage: false, clip: { x: 0, y: 0, width: 900, height: 1200 } })
  await ctx.close()
  console.log('已保存 tablet 截图')
}

// 3. Desktop full page light
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('aicc-deep-plan'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.screenshot({ path: '/Users/huangyong/Desktop/AICC/test-screenshots/radar-desktop-full.png', fullPage: true })
  await ctx.close()
  console.log('已保存 desktop 全页截图')
}

await browser.close()
console.log('完成')
