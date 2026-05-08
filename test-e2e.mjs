import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/Users/huangyong/Desktop/AICC/test-screenshots';
const TEST_URL = 'http://localhost:5174';

async function run() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const results = [];

  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`  [browser ${msg.type()}] ${msg.text()}`);
    }
  });

  try {
    // Step 0: Set offline mode
    console.log('Step 0: Set offline mode via localStorage');
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
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '00-settings.png') });
    results.push({ step: 0, status: 'PASS', desc: 'Offline mode set' });

    // Step 1: Enter GDN
    console.log('Step 1: Enter GDN');
    const textarea = page.locator('textarea').first();
    await textarea.fill('GDN');
    await page.waitForTimeout(500);
    results.push({ step: 1, status: 'PASS', desc: 'GDN entered' });

    // Step 2: Click start → warmup
    console.log('Step 2: Click start');
    const startBtn = page.locator('button:has-text("开始讲解")');
    await startBtn.click();
    await page.waitForTimeout(4000);
    results.push({ step: 2, status: 'PASS', desc: 'Warmup loaded' });

    // Step 3: Confirm warmup → Step1 generates
    console.log('Step 3: Confirm warmup → Step1 generates');
    const warmupBtn = page.locator('button:has-text("我看完了，开始讲解")');
    await warmupBtn.click();
    await page.waitForTimeout(6000);
    let collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-step1-done.png'), fullPage: true });
    results.push({ step: 3, status: 'PASS', desc: 'Step1 done' });

    // === Step1 Takeaway Modal ===
    console.log('Step 4: Step1 takeaway modal');
    await collectBtn.click();
    await page.waitForTimeout(2000);
    let modal = page.locator('text="一句话带走"');
    let dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    if (await modal.isVisible() && await dismissBtn.isVisible()) {
      await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-step1-modal.png') });
      results.push({ step: 4, status: 'PASS', desc: 'Step1 takeaway modal shown' });
      await dismissBtn.click();
      await page.waitForTimeout(6000);
    } else {
      throw new Error('Step1 takeaway modal not shown');
    }

    // === Step2 completes → takeaway modal ===
    console.log('Step 5: Step2 takeaway modal');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 20000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-step2-done.png'), fullPage: true });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    modal = page.locator('text="一句话带走"');
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    if (await modal.isVisible() && await dismissBtn.isVisible()) {
      await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-step2-modal.png') });
      results.push({ step: 5, status: 'PASS', desc: 'Step2 takeaway modal shown' });
      await dismissBtn.click();
      await page.waitForTimeout(6000);
    } else {
      throw new Error('Step2 takeaway modal not shown');
    }

    // === Step3 completes → takeaway modal ===
    console.log('Step 6: Step3 takeaway modal');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '06-step3-done.png'), fullPage: true });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    modal = page.locator('text="一句话带走"');
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    if (await modal.isVisible() && await dismissBtn.isVisible()) {
      await page.screenshot({ path: join(SCREENSHOTS_DIR, '06-step3-modal.png') });
      results.push({ step: 6, status: 'PASS', desc: 'Step3 takeaway modal shown' });
      await dismissBtn.click();
      await page.waitForTimeout(6000);
    } else {
      throw new Error('Step3 takeaway modal not shown');
    }

    // === Step4 completes → takeaway modal ===
    console.log('Step 7: Step4 takeaway modal');
    collectBtn = page.locator('button:has-text("我收走了")').first();
    await collectBtn.waitFor({ state: 'visible', timeout: 30000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '07-step4-done.png'), fullPage: true });
    await collectBtn.click();
    await page.waitForTimeout(2000);
    modal = page.locator('text="一句话带走"');
    dismissBtn = page.locator('button:has-text("好的，那我带走！")');
    if (await modal.isVisible() && await dismissBtn.isVisible()) {
      await page.screenshot({ path: join(SCREENSHOTS_DIR, '07-step4-modal.png') });
      results.push({ step: 7, status: 'PASS', desc: 'Step4 takeaway modal shown' });
      await dismissBtn.click();
      await page.waitForTimeout(2000);
    } else {
      throw new Error('Step4 takeaway modal not shown');
    }

    // Final screenshot
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '08-all-done.png'), fullPage: true });
    results.push({ step: 8, status: 'PASS', desc: 'All 4 steps completed with modals' });

  } catch (err) {
    console.error('FAIL:', err.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'ERROR.png'), fullPage: true });
    results.push({ step: '?', status: 'FAIL', desc: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n========== TEST REPORT ==========');
  for (const r of results) {
    console.log(`  [${r.status}] Step ${r.step}: ${r.desc}`);
  }
  const allPass = results.every(r => r.status === 'PASS');
  console.log(`\n  Result: ${allPass ? '✅ ALL PASS' : '⚠️  CHECK RESULTS'}`);
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);
  console.log('=================================\n');
}

run();
