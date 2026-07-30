import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const extractBlock = (source, marker) => {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing ${marker}`);

  const openIndex = source.indexOf('{', markerIndex + marker.length);
  assert.notEqual(openIndex, -1, `missing opening brace for ${marker}`);

  let depth = 1;
  for (let index = openIndex + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) {
      return {
        body: source.slice(openIndex + 1, index),
        full: source.slice(markerIndex, index + 1),
      };
    }
  }

  assert.fail(`missing closing brace for ${marker}`);
};

const extractRule = (source, selector) => {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`, 'g');
  const matches = [...source.matchAll(pattern)];
  assert.ok(matches.length > 0, `missing rule for ${selector}`);
  return matches.at(-1)[1];
};

test('native document transitions stay progressive, bounded, and CSS-only', async () => {
  const [css, layout] = await Promise.all([
    readFile('src/styles/global.css', 'utf8'),
    readFile('src/layouts/Layout.astro', 'utf8'),
  ]);

  const noPreference = extractBlock(css, '@media (prefers-reduced-motion: no-preference)');
  assert.match(noPreference.body, /@view-transition\s*\{\s*navigation:\s*auto;\s*\}/);
  assert.doesNotMatch(css.replace(noPreference.full, ''), /@view-transition/,
    'reduced-motion users must not be opted into cross-document transitions');

  assert.match(noPreference.body, /\.site-header\s*\{[^}]*view-transition-name:\s*site-header;/s);
  assert.match(noPreference.body, /\.site-main\s*\{[^}]*view-transition-name:\s*site-main;/s);
  const transitionNames = [...css.matchAll(/view-transition-name:\s*([\w-]+)/g)].map((match) => match[1]);
  assert.deepEqual(transitionNames.sort(), ['site-header', 'site-main']);
  assert.doesNotMatch(css, /view-transition-name:\s*match-element/);

  for (const pseudo of [
    '::view-transition-group(root)',
    '::view-transition-old(root)',
    '::view-transition-new(root)',
    '::view-transition-group(site-header)',
    '::view-transition-old(site-header)',
    '::view-transition-new(site-header)',
    '::view-transition-group(site-main)',
  ]) {
    assert.match(noPreference.body, new RegExp(`${pseudo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?animation:\\s*none;`));
  }

  const oldMain = extractRule(noPreference.body, '::view-transition-old(site-main)');
  const newMain = extractRule(noPreference.body, '::view-transition-new(site-main)');
  assert.match(oldMain, /animation:\s*site-main-exit 110ms cubic-bezier\(0\.4, 0, 1, 1\) both;/);
  assert.match(newMain, /animation:\s*site-main-enter 180ms cubic-bezier\(0, 0, 0\.2, 1\) both;/);

  for (const [name, expectedTranslation] of [['site-main-exit', '-4px'], ['site-main-enter', '4px']]) {
    const keyframes = extractBlock(css, `@keyframes ${name}`).body;
    assert.match(keyframes, /opacity:/);
    assert.match(keyframes, new RegExp(`translateY\\(${expectedTranslation.replace('-', '\\-')}\\)`));
    assert.doesNotMatch(keyframes, /\b(?:scale|translateX|width|height|padding|margin|line-height)\b/);

    const animatedProperties = [...keyframes.matchAll(/^\s*([\w-]+):/gm)].map((match) => match[1]);
    assert.ok(animatedProperties.length > 0);
    assert.ok(animatedProperties.every((property) => ['opacity', 'transform'].includes(property)));
  }

  assert.doesNotMatch(css, /transition:\s*all\b/);
  assert.doesNotMatch(layout, /ClientRouter|astro:transitions|document\.startViewTransition|pageswap|pagereveal/);
  assert.doesNotMatch(layout, /addEventListener\(\s*['"]click['"]/);
  assert.doesNotMatch(layout, /<meta[^>]+view-transition/i);
});
