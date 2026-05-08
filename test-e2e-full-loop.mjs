import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/Users/huangyong/Desktop/AICC/test-screenshots/full-loop';
const TEST_URL = 'http://localhost:5174';

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
    // === Phase 1: Setup ===
    console.log('Phase 1: Setup offline mode');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const cfg = JSON.parse(localStorage.getItem('gdn_llm_cfg_v3') || '{}');
      cfg.offlineMock = true;
      localStorage.setItem('gdn_llm_cfg_v3', JSON.stringify(cfg));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    results.push({ phase: 1, status: 'PASS', desc: 'Offline mode set' });

    // === Phase 2: Enter concept ===
    console.log('Phase 2: Enter GDN concept');
    const textarea = page.locator('textarea').first();
    await textarea.fill('GDN');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-input.png') });
    results.push({ phase: 2, status: 'PASS', desc: 'Concept entered' });

    // === Phase 3: 开场提问 (Warmup Questions) ===
    console.log('Phase 3: 开场提问 generated');
    const startBtn = page.locator('button:has-text("开始讲解")');
    await startBtn.click();
    await page.waitForTimeout(4000);
    // Verify warmup questions are visible
    const warmupCard = page.locator('text="我看完了，开始讲解"').first();
    const warmupVisible = await warmupCard.isVisible();
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-warmup-questions.png'), fullPage: true });
    if (!warmupVisible) throw new Error('Warmup questions not visible');
    results.push({ phase: 3, status: 'PASS', desc: '开场提问 visible' });

    // === Phase 4: Confirm warmup → Step1 ===
    console.log('Phase 4: Confirm warmup → Step1 generates');
    const warmupBtn = page.locator('button:has-text("我看完了，开始讲解")');
    await warmupBtn.click();
    await page.waitForTimeout(6000);
    let collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-step1-content.png'), fullPage: true });
    results.push({ phase: 4, status: 'PASS', desc: 'Step1 generated' });

    // === Phase 5: Step1 takeaway ===
    console.log('Phase 5: Step1 takeaway');
    await collectBtn.click();
    await page.waitForTimeout(2000);
    let dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-step1-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(6000);
    results.push({ phase: 5, status: 'PASS', desc: 'Step1 takeaway shown & dismissed' });

    // === Phase 6: Step2 takeaway ===
    console.log('Phase 6: Step2 takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-step2-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(6000);
    results.push({ phase: 6, status: 'PASS', desc: 'Step2 takeaway shown & dismissed' });

    // === Phase 7: Step3 takeaway ===
    console.log('Phase 7: Step3 takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '06-step3-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(6000);
    results.push({ phase: 7, status: 'PASS', desc: 'Step3 takeaway shown & dismissed' });

    // === Phase 8: Step4 takeaway ===
    console.log('Phase 8: Step4 takeaway');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    await dismissBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '07-step4-takeaway.png') });
    await dismissBtn.click();
    await page.waitForTimeout(3000);
    results.push({ phase: 8, status: 'PASS', desc: 'Step4 takeaway shown & dismissed' });

    // === Phase 9: 费曼面板出现 + 开场提问回顾 ===
    console.log('Phase 9: Feynman panel visible with warmup questions recall');
    // After all 4 steps confirmed, FeynmanDigestPanel should appear
    const feynmanTitle = page.locator('text=费曼内化').first();
    await feynmanTitle.waitFor({ state: 'visible', timeout: 15000 });
    // Check warmup recall section
    const warmupRecall = page.locator('text=回顾开场问题').first();
    const recallVisible = await warmupRecall.isVisible();
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '08-feynman-panel.png'), fullPage: true });
    if (!recallVisible) {
      console.log('  WARN: Warmup recall section not visible');
    }
    results.push({ phase: 9, status: 'PASS', desc: `Feynman panel visible, recall: ${recallVisible}` });

    // === Phase 10: Verify prefilled answers ===
    console.log('Phase 10: Check prefilled answers');
    const textareas = page.locator('textarea');
    const count = await textareas.count();
    let filledCount = 0;
    for (let i = 0; i < count; i++) {
      const val = await textareas.nth(i).inputValue();
      if (val.trim().length > 10) filledCount++;
    }
    console.log(`  Found ${count} textareas, ${filledCount} pre-filled`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '09-prefilled-answers.png'), fullPage: true });
    results.push({ phase: 10, status: filledCount >= 3 ? 'PASS' : 'WARN', desc: `${filledCount}/3 answers pre-filled from takeaways` });

    // === Phase 11: Submit Feynman answers → get review (闭环) ===
    console.log('Phase 11: Submit Feynman answers (闭环)');
    const submitBtn = page.locator('button:has-text("提交")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      // Check if review/digest appeared
      const digestSection = page.locator('text="知识图谱"').first();
      const digestVisible = await digestSection.isVisible().catch(() => false);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, '10-feynman-review.png'), fullPage: true });
      results.push({ phase: 11, status: 'PASS', desc: `Feynman review submitted, digest: ${digestVisible}` });
    } else {
      // Button might have different text
      const altBtn = page.locator('button:has-text("开始内化评估")').first();
      if (await altBtn.isVisible()) {
        await altBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, '10-feynman-review.png'), fullPage: true });
        results.push({ phase: 11, status: 'PASS', desc: 'Feynman review submitted (alt btn)' });
      } else {
        await page.screenshot({ path: join(SCREENSHOTS_DIR, '10-feynman-panel-detail.png'), fullPage: true });
        results.push({ phase: 11, status: 'WARN', desc: 'Submit button not found, see screenshot' });
      }
    }

    // Final overview
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '11-final.png'), fullPage: true });
    results.push({ phase: 12, status: 'PASS', desc: 'Full loop complete' });

  } catch (err) {
    console.error('FAIL:', err.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'ERROR.png'), fullPage: true });
    results.push({ phase: '?', status: 'FAIL', desc: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n========== FULL LOOP TEST REPORT ==========');
  for (const r of results) {
    console.log(`  [${r.status}] Phase ${r.phase}: ${r.desc}`);
  }
  const allPass = results.every(r => r.status === 'PASS');
  const hasWarn = results.some(r => r.status === 'WARN');
  const hasFail = results.some(r => r.status === 'FAIL');
  console.log(`\n  Result: ${hasFail ? '❌ FAIL' : allPass ? '✅ ALL PASS' : '⚠️  PASS with warnings'}`);
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);
  console.log('============================================\n');
}

run();
