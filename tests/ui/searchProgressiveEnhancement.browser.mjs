import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const origin = process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321';
const evidence = process.env.SEARCH_EVIDENCE;
if (evidence) fs.mkdirSync(evidence, { recursive: true });
const rows = [];
try {
  for (const width of [390, 1280]) for (const height of [360, 844])
  for (const colorScheme of ['light', 'dark']) for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height }, colorScheme, reducedMotion });
    try {
      const page = await context.newPage();
      await page.goto(origin + '/search/');
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => {
        const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        const dialog = document.querySelector('[data-search-dialog]');
        return {
          actualTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          dialogOpen: dialog.open, initialized: dialog.dataset.searchInitialized || null,
          header: box(document.querySelector('[data-header]')), fallback: box(document.querySelector('.search-route-fallback')),
          clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
          visibleDialogControls: [...dialog.querySelectorAll('input,button,.site-search__footer')].filter(e => e.getClientRects().length).length,
        };
      });
      assert.equal(state.dialogOpen, false);
      assert.equal(state.initialized, null);
      assert.equal(state.visibleDialogControls, 0);
      assert.equal(state.actualTheme, 'light', 'No-JS retains the approved default-light contract');
      assert.ok(state.fallback.y >= state.header.bottom, 'Fallback clears the Header');
      assert.ok(state.scrollWidth <= state.clientWidth + 1);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-search-dialog]').evaluate(e => e.open), false);
      const navigation = [];
      for (const route of ['/projects/', '/notes/', '/resume/']) {
        await page.goto(origin + '/search/');
        const link = page.locator('.search-route-fallback a[href="' + route + '"]');
        assert.equal(await link.isVisible(), true);
        await link.focus();
        const focused = await link.evaluate(e => { const r = e.getBoundingClientRect(); return { active: document.activeElement === e, outline: getComputedStyle(e).outlineStyle, top: r.top, bottom: r.bottom }; });
        assert.equal(focused.active, true);
        await Promise.all([page.waitForURL(origin + route), page.keyboard.press('Enter')]);
        assert.equal(new URL(page.url()).pathname, route, 'Native keyboard navigation');
        await page.goto(origin + '/search/');
        await page.locator('.search-route-fallback a[href="' + route + '"]').click();
        assert.equal(new URL(page.url()).pathname, route, 'Native pointer navigation');
        navigation.push({ route, keyboard: true, pointer: true, focused });
      }
      await page.goto(origin + '/search/');
      await page.keyboard.press('Tab');
      // A closed dialog must never trap keyboard focus.
      for (let i = 0; i < 16; i++) {
        assert.equal(await page.evaluate(() => !!document.activeElement.closest('[data-search-dialog]')), false);
        await page.keyboard.press('Tab');
      }
      await page.goto(origin + '/search/');
      await page.evaluate(() => document.fonts.ready);
      const name = 'nojs-' + width + 'x' + height + '-' + colorScheme + '-' + reducedMotion + '.png';
      if (evidence) await page.screenshot({ path: path.join(evidence, name) });
      rows.push({ context: { javaScriptEnabled: false, width, height, colorScheme, reducedMotion }, state, navigation, screenshot: name });
    } finally { await context.close(); }
  }
  if (evidence) fs.writeFileSync(path.join(evidence, 'NOJS-AFTER.json'), JSON.stringify({ rows }, null, 2) + '\n');
  console.log('PASS: 16 true-JS-disabled states; 48 pointer + 48 keyboard native navigations; no inactive Search controls or trapped dialog focus.');
} finally { await browser.close(); }