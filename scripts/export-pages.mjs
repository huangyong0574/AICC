// 导出当前工程「实际渲染后」各页面的完整 HTML（含 dev 注入的 <style>，自包含可独立打开）。
// 用途：把 design/ 的旧 mockup 更新为真实页面基线。费曼页真实跑完四步再导出。
// 用法：先启动 dev（localhost:5188），再：
//   node scripts/export-pages.mjs            # 全部页面
//   node scripts/export-pages.mjs feynman    # 只重跑费曼（含认知差）
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const BASE = process.env.BASE_URL || 'http://localhost:5188'
const OUT = 'design/live'
const KEY = process.env.DASHSCOPE_API_KEY || '' // 绝不在脚本硬编码 key；跑费曼前 export DASHSCOPE_API_KEY=...
const CID = '2026-W25-01-mythos-class-safeguards'
const ONLY = process.argv[2] // 'feynman' = 只重跑费曼

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
page.on('dialog', d => d.accept().catch(() => {}))
await mkdir(OUT, { recursive: true })

await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(({ KEY, CID }) => {
  localStorage.setItem('aicc-llm-cfg', JSON.stringify({ apiKey: KEY, baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'deepseek-v4-pro' }))
  localStorage.setItem('aicc-cognition-state', JSON.stringify({ [CID]: { state: 'learning', title: '高能力模型的风险降级护栏', sourceWeek: '2026-W25', addedAt: 1781000000000 } }))
  localStorage.removeItem('aicc-feynman-notes')
}, { KEY, CID })

if (!ONLY || ONLY === 'static') {
  console.log('▶ 静态页导出')
  for (const p of STATIC_PAGES) {
    await page.goto(BASE + p.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dump(page, p.name)
  }
}

if (!ONLY || ONLY === 'feynman') {
  console.log('▶ 费曼页：真实跑四步（填猜想 → 产生认知差）')
  await page.evaluate((CID) => sessionStorage.setItem('aicc-active-concept', CID), CID)
  await page.goto(BASE + '/feynman', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('[aria-label="Close"], button:has-text("Close")').first().click({ timeout: 3000 }).catch(() => {})
  const restart = page.locator('button:has-text("重新开始")').first()
  if (await restart.count()) { await restart.click().catch(() => {}); await page.waitForTimeout(800) }
  await page.locator('button:has-text("开始讲解")').first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(5000)
  await page.locator('[aria-label="Close"], button:has-text("Close")').first().click({ timeout: 3000 }).catch(() => {})
  await page.locator('button:has-text("我看完了")').first().click({ timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(2000)

  const guesses = [
    '我猜是模型自己判断到危险，就自动切换到更安全的小模型',
    '我猜适用于网络安全、生化等高风险领域，日常创作不触发',
    '我猜是模型每走一步看一眼屏幕，再决定下一步动作',
    '我猜本质就是把能力和安全分开，各管各的',
  ]
  for (let i = 0; i < 4; i++) {
    console.log('  step', i + 1, '（填猜想 → 揭晓 + 认知差）')
    const predict = page.locator('textarea').first()
    await predict.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
    if (await predict.count()) await predict.fill(guesses[i]).catch(() => {})
    const submit = page.locator('button:has-text("提交猜想")').first()
    if (await submit.count()) await submit.click().catch(() => {})
    const collect = page.locator('button:has-text("我收走了")').first()
    await collect.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(5000) // 等认知差 callGap 渲染完
    await collect.click()
    await page.waitForTimeout(1500)
    const ta = page.locator('textarea').last()
    if (await ta.count()) await ta.fill(`第${i + 1}步的收获（导出基线占位）`).catch(() => {})
    await page.locator('button:has-text("带走")').first().click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(2500)
  }

  // 跑完四步后所有卡片会折叠：展开全部，让四步完整内容（含认知差/类比/route/blueprint/本质）都进 HTML
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    document.querySelectorAll('svg').forEach(svg => {
      const cls = svg.getAttribute('class') || ''
      if (cls.includes('chevron-down') && cls.includes('-rotate-90')) {
        svg.closest('button')?.click()
      }
    })
  })
  await page.waitForTimeout(1500)
  await dump(page, 'feynman')
}

await browser.close()
console.log('DONE')
