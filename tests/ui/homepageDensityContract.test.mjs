import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('current Home keeps one identity, native actions and naturally flowing lower sections', async () => {
  const [html, hero, css] = await Promise.all([
    readFile('dist/index.html', 'utf8'),
    readFile('src/components/home/EditorialHero.astro', 'utf8'),
    readFile('src/styles/home-v2.css', 'utf8'),
  ]);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.equal((html.match(/class="home-v2-hero__copy"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /identity-plate|Profile snapshot|focus-strip|home-approach|home-hub/);
  assert.match(hero, /Mechanical engineering, robotic systems, intelligent control/);
  assert.match(hero, /href="#selected-works">Explore my work/);
  assert.match(hero, /href="\/about\/">About me/);
  let previous = -1;
  for (const id of ['home-v2-title', 'recent-news', 'selected-works', 'honors']) {
    const current = html.indexOf('id="' + id + '"');
    assert.ok(current > previous, id + ' preserves approved reading order');
    previous = current;
  }
  assert.ok(html.indexOf('<footer') > previous);
  assert.match(css, /\.home-v2 \.home-v2-hero \{ min-block-size:calc\(100svh - var\(--home-v2-header-reservation\)\); \}/);
  const lowerSectionRules = [...css.matchAll(/([^{}]*\.home-v2-section[^{}]*)\{([^{}]*)\}/g)];
  assert.ok(lowerSectionRules.length > 0);
  for (const [, , declarations] of lowerSectionRules) {
    assert.doesNotMatch(declarations, /(?:height|block-size):\s*(?:100|calc\(100)(?:s|d)?vh|position:\s*(?:fixed|absolute)|display:\s*none/);
  }
  assert.match(css, /\.home-v2 \.home-v2-hero__actions \{ display: flex; flex-wrap: wrap;/);
  assert.match(css, /\.home-v2 \.home-v2-hero h1 span \{ display: block; overflow-wrap: anywhere;/);
});
