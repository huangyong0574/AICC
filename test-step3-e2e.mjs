/**
 * E2E 测试 v2：等待 Step3 完整生成完毕后再截图
 * 关键改进：等 Step3 的"我收走了"按钮出现后再截图 SVG
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/Users/huangyong/Desktop/AICC/test-screenshots/step3-e2e';
const TEST_URL = 'http://localhost:5180';
const API_CONFIG = {
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "deepseek-v4-flash",
  offlineMock: false
};

const CONCEPTS = ['LoRA', 'Ring Attention', 'MoE（混合专家）'];

async function waitAndClick(page, selector, timeout = 120000) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout });
  await el.click();
  return el;
}

async function testConcept(page, concept, index) {
  const slug = concept.replace(/[（）\s]+/g, '-').toLowerCase();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[${index + 1}/3] 测试概念: ${concept}`);
  console.log('='.repeat(50));

  // Navigate and configure
  await page.goto(TEST_URL, { waitUntil: 'networkidle' });
  await page.evaluate((cfg) => {
    localStorage.setItem('gdn_llm_cfg_v3', JSON.stringify(cfg));
  }, API_CONFIG);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Close any modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Input concept
  console.log('  → 输入概念...');
  const textarea = page.locator('textarea').first();
  await textarea.fill(concept);

  // Click start
  await waitAndClick(page, 'button:has-text("开始讲解")');
  console.log('  → 已点击"开始讲解"');

  // Wait for warmup and click through
  console.log('  → 等待预热问题...');
  await waitAndClick(page, 'button:has-text("我看完了，开始讲解")', 90000);
  console.log('  → 已确认预热');

  // Wait for Step1 to complete
  console.log('  → 等待 Step1 生成...');
  await waitAndClick(page, 'button:has-text("我收走了")', 120000);
  await page.waitForTimeout(1500);
  const dismissBtn1 = page.locator('button:has-text("好的，那我带走")');
  try {
    await dismissBtn1.waitFor({ state: 'visible', timeout: 8000 });
    await dismissBtn1.click();
  } catch (e) {
    const altBtn = page.locator('button:has-text("继续")').first();
    try { await altBtn.click(); } catch {}
  }
  console.log('  → Step1 完成');

  // Wait for Step2
  console.log('  → 等待 Step2 生成...');
  await page.waitForTimeout(3000);
  await waitAndClick(page, 'button:has-text("我收走了")', 120000);
  await page.waitForTimeout(1500);
  const dismissBtn2 = page.locator('button:has-text("好的，那我带走")');
  try {
    await dismissBtn2.waitFor({ state: 'visible', timeout: 8000 });
    await dismissBtn2.click();
  } catch (e) {
    const altBtn2 = page.locator('button:has-text("继续")').first();
    try { await altBtn2.click(); } catch {}
  }
  console.log('  → Step2 完成');

  // === 关键：等待 Step3 完全生成 ===
  console.log('  → 等待 Step3 完整生成（需要 60-120s）...');
  
  // Step3 完成的标志是"我收走了"按钮再次出现
  const step3DoneBtn = page.locator('button:has-text("我收走了")').first();
  try {
    await step3DoneBtn.waitFor({ state: 'visible', timeout: 180000 });
    console.log('  → Step3 完全生成完毕 ✓');
  } catch (e) {
    console.log('  → 等"我收走了"超时，检查当前状态...');
  }
  
  await page.waitForTimeout(2000);

  // 检测 LLM 生成的 SVG（viewBox 含 600 320）
  const svgInfo = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    const results = [];
    for (const svg of svgs) {
      const vb = svg.getAttribute('viewBox') || '';
      const hasRects = svg.querySelectorAll('rect').length;
      const hasTexts = svg.querySelectorAll('text').length;
      if (hasRects >= 2 && hasTexts >= 2) {
        results.push({ viewBox: vb, rects: hasRects, texts: hasTexts });
      }
    }
    return results;
  });
  
  const svgFound = svgInfo.length > 0;
  console.log(`  → SVG 检测: ${svgFound ? '✓ 找到机制图' : '✗ 未找到'}`, svgInfo);

  // 滚动到 SVG 区域并截图
  if (svgFound) {
    // 找到有 rect 和 text 子元素的 SVG（排除 icon SVGs）
    const mechSvg = page.locator('svg:has(rect):has(text)').first();
    try {
      await mechSvg.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      
      // 截取 SVG 所在的容器
      const container = mechSvg.locator('..');  // parent
      await container.screenshot({
        path: join(SCREENSHOTS_DIR, `${slug}-svg-diagram.png`)
      });
      console.log(`  → SVG 图表截图: ${slug}-svg-diagram.png`);
    } catch (e) {
      // fallback: 截取视口
      await page.screenshot({
        path: join(SCREENSHOTS_DIR, `${slug}-svg-diagram.png`)
      });
      console.log(`  → 截取当前视口: ${slug}-svg-diagram.png`);
    }
  } else {
    // 没有 SVG，截取 Step3 区域查看状态
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, `${slug}-svg-diagram.png`),
      fullPage: true
    });
    console.log('  → 保存全页截图用于调试');
  }

  // 全页面截图备份
  await page.screenshot({
    path: join(SCREENSHOTS_DIR, `${slug}-full.png`),
    fullPage: true
  });

  return svgFound;
}

async function run() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      console.log(`  [console.error] ${msg.text().slice(0, 200)}`);
    }
  });

  const results = [];
  for (let i = 0; i < CONCEPTS.length; i++) {
    try {
      const success = await testConcept(page, CONCEPTS[i], i);
      results.push({ concept: CONCEPTS[i], svgRendered: success });
    } catch (err) {
      console.error(`  ✗ FAIL: ${err.message}`);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, `error-${i}.png`), fullPage: true });
      results.push({ concept: CONCEPTS[i], svgRendered: false, error: err.message });
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总:');
  console.log('='.repeat(50));
  results.forEach(r => {
    const status = r.svgRendered ? '✓ SVG 渲染成功' : '✗ SVG 未渲染';
    console.log(`  ${r.concept}: ${status}${r.error ? ` (${r.error})` : ''}`);
  });
  console.log(`\n截图保存目录: ${SCREENSHOTS_DIR}`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
