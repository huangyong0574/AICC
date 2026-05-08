/**
 * 测试 Step3 动态 SVG 机制图渲染
 * 离线模式下验证 GDN mock 数据中的 SVG 正确渲染
 * 然后用真实 LLM 测试 Ring Attention 和 LoRA 的 SVG 生成
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/Users/huangyong/Desktop/AICC/test-screenshots/step3-svg';
const TEST_URL = 'http://localhost:5180';

async function run() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [err] ${msg.text()}`);
  });

  try {
    // === 离线模式下验证 GDN SVG 渲染 ===
    console.log('=== 测试 GDN（离线 mock SVG） ===');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const cfg = JSON.parse(localStorage.getItem('gdn_llm_cfg_v3') || '{}');
      cfg.offlineMock = true;
      localStorage.setItem('gdn_llm_cfg_v3', JSON.stringify(cfg));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 输入 GDN 并启动
    const textarea = page.locator('textarea').first();
    await textarea.fill('GDN（Gated Delta Network）');
    const startBtn = page.locator('button:has-text("开始讲解")');
    await startBtn.click();
    await page.waitForTimeout(4000);

    // 确认预热
    const warmupBtn = page.locator('button:has-text("我看完了，开始讲解")');
    await warmupBtn.waitFor({ state: 'visible', timeout: 10000 });
    await warmupBtn.click();
    await page.waitForTimeout(8000);

    // 确认 Step1
    let collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    let dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dismissBtn.click();
    await page.waitForTimeout(8000);

    // 确认 Step2
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dismissBtn.click();
    await page.waitForTimeout(8000);

    // Step3 应该出现了 - 这里有 SVG 图
    console.log('  等待 Step3 渲染...');
    await page.waitForTimeout(5000);

    // 检查 SVG 是否被渲染
    const svgElement = page.locator('.rounded-lg.border svg').first();
    const svgVisible = await svgElement.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`  SVG 元素可见: ${svgVisible}`);

    // 截图 Step3 区域
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-gdn-step3-svg.png'), fullPage: true });
    
    // 尝试截取 SVG 区域
    if (svgVisible) {
      const svgBox = await svgElement.boundingBox();
      if (svgBox) {
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, '01-gdn-svg-detail.png'),
          clip: { x: Math.max(0, svgBox.x - 20), y: Math.max(0, svgBox.y - 20), width: svgBox.width + 40, height: svgBox.height + 40 }
        });
      }
    }

    console.log('  GDN SVG 测试完成 ✓');

    // === 现在用真实 LLM 测试 Ring Attention 和 LoRA ===
    // 检查是否有 API key 配置
    const hasApiKey = await page.evaluate(() => {
      const cfg = JSON.parse(localStorage.getItem('gdn_llm_cfg_v3') || '{}');
      return !!(cfg.apiKey && cfg.apiKey.length > 5);
    });

    if (hasApiKey) {
      console.log('\n=== 检测到 API Key，将进行真实 LLM 测试 ===');
      // 关闭离线模式
      await page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('gdn_llm_cfg_v3') || '{}');
        cfg.offlineMock = false;
        localStorage.setItem('gdn_llm_cfg_v3', JSON.stringify(cfg));
      });

      for (const concept of ['Ring Attention', 'LoRA']) {
        console.log(`\n  测试概念: ${concept}`);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const ta = page.locator('textarea').first();
        await ta.fill(concept);
        const btn = page.locator('button:has-text("开始讲解")');
        await btn.click();
        
        // 等待并完成预热
        const wb = page.locator('button:has-text("我看完了，开始讲解")');
        await wb.waitFor({ state: 'visible', timeout: 60000 });
        await wb.click();

        // 等待 Step1 → 确认 → Step2 → 确认 → Step3 出现
        for (let step = 1; step <= 2; step++) {
          const cb = page.locator('button:has-text("我收走了")').first();
          await cb.waitFor({ state: 'visible', timeout: 60000 });
          await cb.click();
          await page.waitForTimeout(2000);
          const db = page.locator('button:has-text("好的，那我带走！")');
          await db.waitFor({ state: 'visible', timeout: 5000 });
          await db.click();
          await page.waitForTimeout(10000);
        }

        // 等待 Step3 SVG 渲染
        await page.waitForTimeout(15000);
        const svg3 = page.locator('.rounded-lg.border svg').first();
        const svg3Visible = await svg3.isVisible({ timeout: 15000 }).catch(() => false);
        console.log(`  ${concept} SVG 可见: ${svg3Visible}`);

        const fileName = concept.replace(/\s+/g, '-').toLowerCase();
        await page.screenshot({ path: join(SCREENSHOTS_DIR, `02-${fileName}-step3.png`), fullPage: true });
        
        if (svg3Visible) {
          const box = await svg3.boundingBox();
          if (box) {
            await page.screenshot({
              path: join(SCREENSHOTS_DIR, `02-${fileName}-svg-detail.png`),
              clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 }
            });
          }
        }
      }
    } else {
      console.log('\n  未配置 API Key，跳过真实 LLM 测试');
      console.log('  （请在浏览器设置中填入百炼 API Key 后重新运行）');
    }

  } catch (err) {
    console.error('FAIL:', err.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }

  console.log(`\n截图保存: ${SCREENSHOTS_DIR}`);
}

run();
