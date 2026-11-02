import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: false });
try {
  const page = await browser.newPage();
  const trustedEscapes = [];
  await page.exposeFunction('recordEscape', trusted => trustedEscapes.push(trusted));
  await page.addInitScript(() => document.addEventListener('keydown', e => { if (e.key === 'Escape') window.recordEscape(e.isTrusted); }, true));
  await page.goto(process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321/');
  for (const query of ['robot', '信息', '龘靐齉', '']) {
    await page.locator('[data-search-trigger]').first().click();
    await page.locator('[data-search-input]').fill(query);
    if (query) await page.waitForFunction(() => !document.querySelector('[data-search-status]').textContent.includes('Searching'));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-search-dialog]').open, null, { timeout: 1500 });
    await page.waitForFunction(() => document.body.style.overflow !== 'hidden', null, { timeout: 1500 });
    assert.equal(await page.locator('[data-search-input]').inputValue(), '');
    assert.equal(await page.locator('[data-search-results] a').count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.equal(await page.locator('[data-search-trigger]').first().evaluate(e => e === document.activeElement), true);
  }
  assert.ok(trustedEscapes.length >= 4 && trustedEscapes.every(Boolean));
  await page.goto(process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321/');
  let releaseClose;
  const closeGate = new Promise(resolve => { releaseClose = resolve; });
  await page.route('**/pagefind/**', async route => { await closeGate; await route.continue(); });
  await page.locator('[data-search-trigger]').first().click();
  await page.locator('[data-search-input]').fill('robot');
  await page.locator('[data-search-close]').click();
  await page.waitForFunction(() => !document.querySelector('dialog').open && document.body.style.overflow !== 'hidden');
  releaseClose();
  await page.waitForFunction(() => document.querySelector('[data-search-results] a'));
  await page.locator('[data-search-trigger]').first().click();
  assert.equal(await page.locator('[data-search-input]').inputValue(), 'robot');
  assert.ok(await page.locator('[data-search-results] a').count() > 0);
  await page.keyboard.press('Escape');
  await page.unroute('**/pagefind/**');
  await page.goto(process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321/');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/pagefind/**', async route => { await gate; await route.continue(); });
  await page.locator('[data-search-trigger]').first().click();
  await page.locator('[data-search-input]').fill('robot');
  assert.equal(await page.locator('[data-search-status]').textContent(), 'Searching…');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog').open && document.body.style.overflow !== 'hidden');
  release();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-search-results] a').count(), 0);
  assert.equal(await page.locator('[data-search-status]').textContent(), '');
  await page.locator('[data-search-trigger]').first().click();
  assert.equal(await page.locator('[data-search-input]').inputValue(), '');
  await page.locator('[data-search-input]').fill('robot');
  await page.waitForFunction(() => document.querySelector('[data-search-results] a'));
  // Supplemental guard checks only; these do not certify actual IME operation.
  await page.locator('[data-search-input]').dispatchEvent('compositionstart');
  await page.keyboard.press('Escape');
  await page.locator('dialog').dispatchEvent('cancel', { cancelable: true });
  assert.equal(await page.locator('dialog').evaluate(e => e.open), true);
  await page.locator('[data-search-input]').dispatchEvent('compositionend');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog').open);
  console.log('4 trusted state regressions, pending late-result suppression, supplemental composition guard passed.');

  const failurePage = async () => {
    const p = await browser.newPage();
    await p.addInitScript(() => {
      const held = [];
      let holding = false;
      let releasing = false;
      window.addEventListener('message', event => {
        if (!releasing && holding && event.data?.type === 'hc56:results') {
          event.stopImmediatePropagation();
          held.push(event);
        }
      }, true);
      window.hc256Transport = {
        hold: () => { holding = true; },
        count: () => held.length,
        release: newest => {
          const batch = held.splice(newest ? -2 : 0, 2);
          releasing = true;
          for (const event of batch) window.dispatchEvent(new MessageEvent('message', {
            data: event.data, origin: event.origin, source: event.source,
          }));
          releasing = false;
        },
      };
    });
    await p.route('**/pagefind/**', route => route.abort());
    await p.goto(process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321/');
    await p.locator('[data-search-trigger]').first().click();
    await p.locator('[data-search-input]').fill('robot');
    await p.waitForFunction(() => document.querySelector('[data-search-status]').textContent.startsWith('Search is unavailable'));
    await p.unroute('**/pagefind/**');
    return p;
  };
  const waitCount = (p, n) => p.waitForFunction(n => document.querySelectorAll('.search-result').length === n, n);
  for (const scenario of ['success', 'edited', 'cleared', 'repeated', 'pending-edit', 'pending-clear', 'close', 'escape']) {
    const p = await failurePage();
    const retry = p.locator('[data-search-retry]');
    const field = p.locator('[data-search-input]');
    if (scenario === 'edited' || scenario === 'cleared') {
      // Change without an input event to prove Retry reads the current trimmed value itself.
      await field.evaluate((e, value) => { e.value = value; }, scenario === 'edited' ? '  信息  ' : '');
    }
    if (['repeated', 'pending-edit', 'pending-clear', 'close', 'escape'].includes(scenario)) await p.evaluate(() => window.hc256Transport.hold());
    await retry.focus();
    await p.keyboard.press('Enter');
    assert.equal(await field.evaluate(e => e === document.activeElement), true, 'Retry disappearing keeps useful input focus');
    if (scenario === 'cleared') {
      assert.equal(await p.locator('[data-search-status]').textContent(), '');
      assert.equal(await p.locator('.search-result').count(), 0);
      assert.equal(await p.locator('[data-search-message-title]').textContent(), 'Find a project or a note');
    } else if (scenario === 'edited' || scenario === 'success') {
      await waitCount(p, scenario === 'edited' ? 10 : 7);
    } else {
      await p.waitForFunction(() => window.hc256Transport.count() === 2);
      if (scenario === 'repeated') await retry.dispatchEvent('click');
      if (scenario === 'pending-edit') await field.fill('信息');
      if (scenario === 'pending-clear') await field.fill('');
      if (scenario === 'repeated' || scenario === 'pending-edit') {
        await p.waitForFunction(() => window.hc256Transport.count() === 4);
        await p.evaluate(() => window.hc256Transport.release(true));
        await waitCount(p, scenario === 'pending-edit' ? 10 : 7);
        const current = await p.locator('[data-search-results]').textContent();
        await p.evaluate(() => window.hc256Transport.release(false));
        await p.evaluate(() => new Promise(r => requestAnimationFrame(r)));
        assert.equal(await p.locator('[data-search-results]').textContent(), current, 'old Retry cannot overwrite a later request');
      } else {
        if (scenario === 'pending-clear') {
          await p.evaluate(() => window.hc256Transport.release(false));
          await p.evaluate(() => new Promise(r => requestAnimationFrame(r)));
          assert.equal(await p.locator('.search-result').count(), 0);
          assert.equal(await field.inputValue(), '');
          assert.equal(await p.locator('[data-search-status]').textContent(), '');
          await p.close();
          console.log('Real coordinator Retry scenario passed: ' + scenario);
          continue;
        }
        if (scenario === 'close') await p.locator('[data-search-close]').click();
        else await p.keyboard.press('Escape');
        await p.waitForFunction(() => !document.querySelector('dialog').open && document.body.style.overflow !== 'hidden');
        await p.evaluate(() => window.hc256Transport.release(false));
        if (scenario === 'close') {
          await waitCount(p, 7);
          await p.locator('[data-search-trigger]').first().click();
          assert.equal(await field.inputValue(), 'robot');
        } else {
          await p.evaluate(() => new Promise(r => requestAnimationFrame(r)));
          assert.equal(await p.locator('.search-result').count(), 0);
          assert.equal(await field.inputValue(), '');
          assert.equal(await p.locator('[data-search-status]').textContent(), '');
        }
      }
    }
    await p.close();
    console.log('Real coordinator Retry scenario passed: ' + scenario);
  }


  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 360 }]) {
    const p = await browser.newPage({ viewport: size });
    await p.goto(process.env.SEARCH_ORIGIN || 'http://127.0.0.1:4321/');
    await p.locator('[data-search-trigger]').first().click();
    await p.locator('[data-search-input]').fill('robot');
    await p.waitForFunction(() => document.querySelectorAll('.search-result').length === 7);
    const header = await p.locator('.site-search__header').boundingBox();
    const footer = await p.locator('.site-search__footer').boundingBox();
    for (let i = 0; i < 7; i++) {
      await p.keyboard.press('ArrowDown');
      const visible = await p.evaluate(() => {
        const link = document.activeElement, row = link.getBoundingClientRect();
        const body = link.closest('.site-search__body').getBoundingClientRect();
        const title = link.querySelector('strong').getBoundingClientRect();
        return row.height > body.height - 12
          ? title.top >= body.top && title.bottom <= body.bottom
          : row.top >= body.top + 5 && row.bottom <= body.bottom - 5;
      });
      assert.equal(visible, true, 'handled arrows preserve the complete fitting row outline or a tall row title');
    }
    assert.deepEqual(await p.locator('.site-search__header').boundingBox(), header);
    assert.deepEqual(await p.locator('.site-search__footer').boundingBox(), footer);
    await p.keyboard.press('Tab');
    assert.equal(await p.locator('[data-search-close]').evaluate(e => e === document.activeElement), true);
    await p.close();
  }
  console.log('14 trusted Arrow focus bounds, tall rows and stationary header/footer passed.');

} finally { await browser.close(); }
