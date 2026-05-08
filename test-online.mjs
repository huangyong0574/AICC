import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/Users/huangyong/Desktop/AICC/test-screenshots/online';
const TEST_URL = 'http://101.37.128.102';

async function run() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const results = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [browser error] ${msg.text()}`);
    }
  });

  try {
    // === Phase 1: 首屏加载 ===
    console.log('Phase 1: 首屏加载');
    await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-homepage.png') });
    results.push({ phase: 1, status: 'PASS', desc: '首屏加载成功' });

    // === Phase 2: 设置离线模式 ===
    console.log('Phase 2: 设置离线模式');
    await page.evaluate(() => {
      const cfg = JSON.parse(localStorage.getItem('gdn_llm_cfg_v3') || '{}');
      cfg.offlineMock = true;
      localStorage.setItem('gdn_llm_cfg_v3', JSON.stringify(cfg));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // dismiss any dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-offline-mode.png') });
    results.push({ phase: 2, status: 'PASS', desc: '离线模式已启用' });

    // === Phase 3: 输入概念 ===
    console.log('Phase 3: 输入概念');
    const textarea = page.locator('textarea').first();
    await textarea.fill('GDN');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-input.png') });
    results.push({ phase: 3, status: 'PASS', desc: '概念输入成功' });

    // === Phase 4: 开场提问 ===
    console.log('Phase 4: 开场提问');
    const startBtn = page.locator('button:has-text("开始讲解")');
    await startBtn.click();
    await page.waitForTimeout(5000);
    const warmupBtn = page.locator('button:has-text("我看完了，开始讲解")');
    await warmupBtn.waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-warmup.png'), fullPage: true });
    results.push({ phase: 4, status: 'PASS', desc: '费曼预热问题已显示' });

    // === Phase 5: 确认预热 → 步骤1 ===
    console.log('Phase 5: 确认预热 → 步骤1');
    await warmupBtn.click();
    await page.waitForTimeout(8000);
    let collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-step1.png'), fullPage: true });
    results.push({ phase: 5, status: 'PASS', desc: '步骤1内容已生成' });

    // === Phase 6: 步骤1 Takeaway ===
    console.log('Phase 6: 步骤1 Takeaway');
    await collectBtn.click();
    await page.waitForTimeout(2000);
    let dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    // 验证弹窗标题
    const modalTitle = page.locator('text="一句话带走"');
    const titleVisible = await modalTitle.isVisible();
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '06-step1-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(8000);
    results.push({ phase: 6, status: titleVisible ? 'PASS' : 'WARN', desc: `步骤1 Takeaway弹窗 (标题:${titleVisible})` });

    // === Phase 7: 步骤2 Takeaway ===
    console.log('Phase 7: 步骤2 Takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '07-step2-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(8000);
    results.push({ phase: 7, status: 'PASS', desc: '步骤2 Takeaway弹窗' });

    // === Phase 8: 步骤3 Takeaway ===
    console.log('Phase 8: 步骤3 Takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '08-step3-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(8000);
    results.push({ phase: 8, status: 'PASS', desc: '步骤3 Takeaway弹窗' });

    // === Phase 9: 步骤4 Takeaway ===
    console.log('Phase 9: 步骤4 Takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '09-step4-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(5000);
    results.push({ phase: 9, status: 'PASS', desc: '步骤4 Takeaway弹窗' });

    // === Phase 10: 费曼内化面板 ===
    console.log('Phase 10: 费曼内化面板');
    const feynmanTitle = page.locator('text=费曼内化').first();
    await feynmanTitle.waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '10-feynman-panel.png'), fullPage: true });
    results.push({ phase: 10, status: 'PASS', desc: '费曼内化面板已显示' });

    // === Phase 11: 验证预填充 ===
    console.log('Phase 11: 验证预填充');
    const textareas = page.locator('textarea');
    const count = await textareas.count();
    let filledCount = 0;
    for (let i = 0; i < count; i++) {
      const val = await textareas.nth(i).inputValue();
      if (val.trim().length > 10) filledCount++;
    }
    console.log(`  Found ${count} textareas, ${filledCount} pre-filled`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '11-prefilled.png'), fullPage: true });
    results.push({ phase: 11, status: filledCount >= 3 ? 'PASS' : 'WARN', desc: `${filledCount}/3 答案已预填充` });

    // === Phase 12: 最终截图 ===
    console.log('Phase 12: 最终截图');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '12-final.png'), fullPage: true });
    results.push({ phase: 12, status: 'PASS', desc: '全流程测试完成' });

  } catch (err) {
    console.error('FAIL:', err.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'ERROR.png'), fullPage: true });
    results.push({ phase: '?', status: 'FAIL', desc: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n========== ONLINE E2E TEST REPORT ==========');
  console.log(`  URL: ${TEST_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('---------------------------------------------');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${icon} Phase ${r.phase}: ${r.desc}`);
  }
  const allPass = results.every(r => r.status === 'PASS');
  const hasFail = results.some(r => r.status === 'FAIL');
  console.log('---------------------------------------------');
  console.log(`  Result: ${hasFail ? '❌ FAIL' : allPass ? '✅ ALL PASS' : '⚠️  PASS with warnings'}`);
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);
  console.log('=============================================\n');
}

run();
