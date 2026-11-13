import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: false });
const rows = [];
try {
  const page = await browser.newPage();
  for (const route of ['/', '/about/', '/projects/robomaster-2026-engineering-robot/', '/notes/', '/notes/ai-assisted-literature-workflow/']) {
    for (const width of [178, 179, 180, 181, 182, 320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto((process.env.HARDENING_ORIGIN || 'http://127.0.0.1:4321') + route);
      await page.evaluate(() => document.fonts.ready);
      rows.push(await page.evaluate(() => {
        const r = document.querySelector('[data-header] summary').getBoundingClientRect();
        return { route: location.pathname, width: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, menuLeft: r.left, menuRight: r.right };
      }));
    }
  }
  if (process.env.HARDENING_RESULTS) fs.writeFileSync(process.env.HARDENING_RESULTS, JSON.stringify(rows, null, 2));
  // Home stress content is outside this repair; retain its measured 178px extent.
  for (const r of rows.filter(r => r.route === '/' && r.width < 183)) assert.equal(r.scroll, 178, 'Home stress content remains unchanged');
  for (const route of [...new Set(rows.map(r => r.route))]) {
    assert.deepEqual(rows.filter(r => r.route === route && ((r.route !== '/' && r.scroll > r.client + 1) || r.menuLeft < 5 || r.menuRight > r.client - 5)), [], 'Reachable Menu and contained document: ' + route);
  }
  await page.setViewportSize({ width: 179, height: 360 });
  await page.goto((process.env.HARDENING_ORIGIN || 'http://127.0.0.1:4321') + '/');
  await page.locator('header summary').focus();
  await page.keyboard.press('Enter');
  const focusFailures = [];
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const e = document.activeElement;
      const r = e.getBoundingClientRect();
      const c = document.querySelector('.hc-header__panel-scroll').getBoundingClientRect();
      return { text: e.textContent.trim(), visible: r.top >= c.top + 5 && r.bottom <= c.bottom - 5 };
    });
    if (!result.visible) focusFailures.push(result);
  }
  assert.deepEqual(focusFailures, [], 'Menu focus remains inside its local scrollport');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('header summary').evaluate(e => e === document.activeElement && !e.closest('details').open), true);
} finally { await browser.close(); }
