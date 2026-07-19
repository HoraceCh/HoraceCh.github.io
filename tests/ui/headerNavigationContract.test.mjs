import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mobile header reveals current and focused links without collateral document scrolling', async () => {
  const [header, css] = await Promise.all([
    readFile('src/components/Header.astro', 'utf8'),
    readFile('src/styles/global.css', 'utf8'),
  ]);

  assert.match(header, /querySelector<HTMLElement>\('\[aria-current="page"\]'\)/);
  assert.match(header, /addEventListener\('focusin'/);
  assert.match(
    header,
    /scrollIntoView\(\{ behavior: 'auto', block: 'nearest', inline: 'nearest' \}\)/,
    'reveal must be immediate and use logical nearest alignment',
  );
  assert.match(header, /const documentScroll = \{ left: window\.scrollX, top: window\.scrollY \}/);
  assert.match(header, /window\.scrollTo\(\{ \.\.\.documentScroll, behavior: 'auto' \}\)/);

  const mobileNav = css.match(/@media \(max-width: 720px\)[\s\S]*?\.site-nav \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(mobileNav, /flex-wrap: nowrap/);
  assert.match(mobileNav, /overflow-x: auto/);
  assert.match(mobileNav, /padding: 6px 6px 8px/);
  assert.match(mobileNav, /scroll-padding-inline: 6px/);
});
