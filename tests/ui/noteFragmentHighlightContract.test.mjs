import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Note fragments receive bounded meaningful-block feedback without replacing native navigation', async () => {
  const [runtime, page, css] = await Promise.all([
    readFile('src/scripts/noteFragmentHighlight.ts', 'utf8'),
    readFile('src/pages/notes/[slug].astro', 'utf8'),
    readFile('src/styles/global.css', 'utf8'),
  ]);

  assert.match(page, /import \{ installNoteFragmentHighlight \} from '\.\.\/\.\.\/scripts\/noteFragmentHighlight'/);
  assert.match(page, /installNoteFragmentHighlight\(\)/);
  assert.match(page, /data-note-prose/);

  assert.match(runtime, /document\.getElementById\(fragment\) \?\? findNamedTarget\(prose, fragment\)/);
  assert.match(runtime, /CSS\.escape\(fragment\)/, 'named anchors must use a safely escaped fallback');
  assert.match(runtime, /h2, h3, h4, h5, h6, p, li, tr, dt, dd, blockquote, pre/);
  assert.match(runtime, /prose\.contains\(fragmentTarget\)/);
  assert.match(runtime, /activeTarget\?\.classList\.remove\(feedbackClass\)/);
  assert.match(runtime, /requestAnimationFrame/);
  assert.match(runtime, /fragmentRetryLimit = 3/);
  assert.match(runtime, /feedbackDuration = 2400/);

  const scheduleFeedback = runtime.match(
    /const scheduleFeedback = \(attemptsRemaining = fragmentRetryLimit\) => \{[\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(scheduleFeedback, 'fragment feedback scheduler must remain present');
  assert.ok(
    scheduleFeedback.indexOf('clearFeedback();') < scheduleFeedback.indexOf('window.requestAnimationFrame'),
    'every valid or invalid fragment activation must clear stale feedback before bounded resolution begins',
  );
  assert.match(scheduleFeedback, /scheduleFeedback\(attemptsRemaining - 1\)/, 'missing targets retain bounded retries');

  assert.match(runtime, /window\.addEventListener\('hashchange'/);
  assert.match(runtime, /document\.addEventListener\('click'/);
  assert.match(runtime, /destination\.pathname !== current\.pathname/);
  assert.match(runtime, /document\.addEventListener\('astro:page-load'/);
  assert.match(runtime, /document\.addEventListener\('astro:before-swap'/);
  assert.match(runtime, /disposeSession\?\.\(\)/);
  assert.match(runtime, /removeEventListener\('click'/);
  assert.match(runtime, /removeEventListener\('hashchange'/);

  assert.match(runtime, /isOutsideViewport\(target\)/);
  assert.match(runtime, /block: 'nearest'/);
  assert.match(runtime, /inline: 'nearest'/);
  assert.match(runtime, /behavior: reduceMotion \? 'auto' : 'smooth'/);

  for (const forbidden of ['preventDefault(', 'pushState(', 'replaceState(', 'location.hash =', 'innerHTML']) {
    assert.doesNotMatch(runtime, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(css, /@keyframes note-fragment-feedback/);
  assert.match(css, /tr\.is-note-fragment-target > :is\(th, td\)/);
  assert.match(css, /animation: note-fragment-feedback 2\.4s ease-out both/);
  assert.match(css, /inset 3px 0 0 color-mix\(in srgb, var\(--notes-interactive\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.is-note-fragment-target[\s\S]*?animation: none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.is-note-fragment-target[\s\S]*?transition: none/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*?outline: 2px solid CanvasText/);
});


// The mobile Note rule appears later than header.css. Its specificity must
// never lower the fixed Header reservation for native H2/H3 destinations.
test('Note H2/H3 fragments retain the shared Header reservation over later mobile rhythm rules', async () => {
  const [header, global] = await Promise.all([
    readFile('src/styles/header.css', 'utf8'),
    readFile('src/styles/global.css', 'utf8'),
  ]);
  const reservation = header.match(/body:has\(\[data-header\]\) :is\(\[id\],a,button,input,summary\),\s*body:has\(\[data-header\]\) \.note-prose :is\(h2,h3\)\[id\]\s*\{([^}]+)\}/)?.[1];
  assert.ok(reservation, 'Note headings need their own stronger selector in the existing shared reservation rule');
  assert.match(reservation, /scroll-margin-top:\s*calc\(105px \+ env\(safe-area-inset-top,0px\)\)/);
  assert.doesNotMatch(reservation, /!important/);
  assert.match(global, /@media \(max-width: 420px\)[\s\S]*?\.note-prose :is\(h2, h3\)\[id\]/);
  // Header Note selector specificity (0,3,2) outranks the late mobile
  // .note-prose :is(h2, h3)[id] rule (0,2,1), regardless of stylesheet order.
});
