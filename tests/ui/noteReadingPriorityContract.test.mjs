import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const representativeRoutes = ['tree-binary-tree', 'gcd-lcm', '004', 'c-pointers', '001'];

function extractBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing ${marker}`);
  const openIndex = source.indexOf('{', markerIndex + marker.length);
  assert.notEqual(openIndex, -1, `missing opening brace for ${marker}`);

  let depth = 1;
  for (let index = openIndex + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openIndex + 1, index);
  }

  assert.fail(`missing closing brace for ${marker}`);
}

function extractRule(source, selector) {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`);
  const match = source.match(pattern);
  assert.ok(match, `missing rule for ${selector}`);
  return match[1];
}

test('Note detail source and built output prioritize prose before supporting context', async () => {
  const route = await readFile('src/pages/notes/[slug].astro', 'utf8');
  const layoutStart = route.indexOf('<div class="note-reading-layout">');
  const layoutEnd = route.indexOf('</article>', layoutStart);
  assert.ok(layoutStart >= 0 && layoutEnd > layoutStart, 'Note reading layout must remain inside the article');

  const layout = route.slice(layoutStart, layoutEnd);
  const proseIndex = layout.indexOf('class="note-prose"');
  const propertiesIndex = layout.indexOf('class="note-properties-slot"');
  const sidepaneIndex = layout.indexOf('<NoteSidepane');
  assert.ok(proseIndex >= 0 && proseIndex < propertiesIndex && propertiesIndex < sidepaneIndex);
  assert.ok(route.indexOf('class="note-header"') < layoutStart, 'breadcrumb, title, and summary must remain before prose');

  for (const slug of representativeRoutes) {
    const html = await readFile(`dist/notes/${slug}/index.html`, 'utf8');
    const builtProse = html.indexOf('class="note-prose"');
    const builtProperties = html.indexOf('class="note-properties-slot"');
    const builtSidepane = html.indexOf('class="note-sidepane"');
    assert.ok(
      builtProse >= 0 && builtProse < builtProperties && builtProperties < builtSidepane,
      `${slug} must render prose, Properties, then sidepane`,
    );
  }
});

test('Note CSS separates long-form measure from full-width technical content', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const desktopGrid = extractRule(css, '.note-reading-layout');
  assert.match(desktopGrid, /grid-template-areas:\s*"content sidepane"\s*"properties sidepane";/);
  assert.match(desktopGrid, /grid-template-columns:\s*minmax\(0, 760px\) minmax\(260px, 320px\);/);
  assert.match(desktopGrid, /gap:\s*0 40px;/);

  const stacked = extractBlock(css, '@media (max-width: 980px)');
  const stackedGrid = extractRule(stacked, '.note-reading-layout');
  assert.match(stackedGrid, /grid-template-areas:\s*"content"\s*"properties"\s*"sidepane";/);

  const measureSelector = '.note-prose > :is(p, ul, ol, blockquote):not(:has(:is(img, picture, figure, table, pre, .note-code-block)))';
  const measureRule = extractRule(css, measureSelector);
  assert.match(measureRule, /max-inline-size:\s*min\(100%, 70ch\);/);
  assert.doesNotMatch(measureRule, /margin-inline|margin-left|margin-right|text-align/);

  const measureRules = [...css.matchAll(/([^{}]+)\{[^{}]*max-inline-size:\s*min\(100%, 70ch\);[^{}]*\}/g)];
  assert.equal(measureRules.length, 1, 'reading measure must have one Note-scoped owner');
  assert.match(measureRules[0][1], /^\s*\.note-prose\s*>/);

  assert.match(extractRule(css, '.note-prose img'), /max-width:\s*100%;[\s\S]*height:\s*auto;/);
  assert.match(extractRule(css, '.note-prose pre'), /overflow-x:\s*auto;/);
  assert.match(extractRule(css, '.note-prose table'), /overflow-x:\s*auto;[\s\S]*width:\s*100%;/);
  assert.doesNotMatch(extractRule(css, '.note-prose .note-code-block'), /max-(?:inline-)?size|max-width/);
  assert.doesNotMatch(css, /(?:^|\})\s*:is\(p, li, ul, ol, blockquote\)[^{]*\{[^}]*70ch/m);
});

test('Outline reveal preserves document scroll and retains bounded deferred scrollspy behavior', async () => {
  const outline = await readFile('src/components/notes/NoteOutline.astro', 'utf8');
  const reveal = extractBlock(outline, 'const revealActiveLink = (activeLink) =>');
  assert.match(reveal, /const documentScrollLeft = window\.scrollX;/);
  assert.match(reveal, /const documentScrollTop = window\.scrollY;/);
  assert.ok(reveal.indexOf('scrollIntoView') < reveal.indexOf('window.scrollTo'));
  assert.match(reveal, /scrollIntoView\(\{ block: 'nearest', inline: 'nearest', behavior: 'auto' \}\)/);
  assert.match(reveal, /window\.scrollTo\(\{ left: documentScrollLeft, top: documentScrollTop, behavior: 'auto' \}\)/);
  assert.match(outline, /revealActiveLink\(activeLink\)/);

  assert.match(outline, /dataset\.scrollspyInitialized === 'true'/);
  assert.match(outline, /frameId = window\.requestAnimationFrame\(updateActiveHeading\)/);
  assert.match(
    outline,
    /window\.requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame\(initializeAfterPaint\);\s*\}\)/,
  );
  assert.deepEqual(
    [...outline.matchAll(/(?:window\.)?addEventListener\('([^']+)'/g)].map((match) => match[1]),
    ['scroll', 'resize', 'hashchange'],
  );
  assert.doesNotMatch(outline, /setTimeout|setInterval|requestIdleCallback|IntersectionObserver/);
});

test('S2 transition and prefetch contracts remain exact', async () => {
  const [css, config, header, home, notes, properties] = await Promise.all([
    readFile('src/styles/global.css', 'utf8'),
    readFile('astro.config.mjs', 'utf8'),
    readFile('src/components/Header.astro', 'utf8'),
    readFile('src/pages/index.astro', 'utf8'),
    readFile('src/pages/notes/index.astro', 'utf8'),
    readFile('src/components/notes/NoteProperties.astro', 'utf8'),
  ]);

  assert.match(css, /view-transition-name:\s*site-header/);
  assert.match(css, /view-transition-name:\s*site-main/);
  assert.match(css, /animation:\s*site-main-exit 110ms/);
  assert.match(css, /animation:\s*site-main-enter 180ms/);
  assert.match(css, /translateY\(-4px\)/);
  assert.match(css, /translateY\(4px\)/);
  assert.match(config, /prefetch:\s*\{\s*prefetchAll:\s*false,\s*defaultStrategy:\s*['"]hover['"]/s);

  for (const source of [header, home, notes, properties]) {
    assert.match(source, /data-astro-prefetch="hover"/);
  }
});
