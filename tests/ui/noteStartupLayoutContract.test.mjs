import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Note Outline defers startup geometry and keeps bounded scrollspy updates', async () => {
  const outline = await readFile('src/components/notes/NoteOutline.astro', 'utf8');

  assert.match(outline, /dataset\.scrollspyInitialized === 'true'/, 'repeated setup must be ignored');
  assert.match(outline, /outline\.dataset\.scrollspyInitialized = 'true'/);
  assert.match(outline, /const initializeAfterPaint = \(\) => \{\s*updateActiveHeading\(\);/);
  assert.match(
    outline,
    /requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame\(initializeAfterPaint\);\s*\}\)/,
    'the first heading measurement must wait until the frame after an initial paint opportunity',
  );

  const initializationCall = outline.indexOf('updateActiveHeading();', outline.indexOf('const initializeAfterPaint'));
  const firstListener = outline.indexOf("window.addEventListener('scroll'");
  assert.ok(initializationCall > 0 && firstListener > initializationCall, 'startup update and listeners stay inside deferred initialization');

  assert.match(outline, /addEventListener\('scroll', requestActiveHeadingUpdate, \{ passive: true \}\)/);
  assert.match(outline, /addEventListener\('resize', requestActiveHeadingUpdate\)/);
  assert.match(outline, /addEventListener\('hashchange', requestActiveHeadingUpdate\)/);
  assert.match(outline, /if \(frameId\) \{\s*return;\s*\}/, 'event-driven updates must remain one-frame bounded');
  assert.match(outline, /frameId = window\.requestAnimationFrame\(updateActiveHeading\)/);
  assert.match(outline, /getBoundingClientRect\(\)\.top <= activationLine/);
  assert.match(outline, /activeLink\?\.scrollIntoView\(\{ block: 'nearest', inline: 'nearest', behavior: 'auto' \}\)/);

  const beforeDeferredInitialization = outline.slice(0, outline.indexOf('const initializeAfterPaint'));
  const setupTail = beforeDeferredInitialization.slice(beforeDeferredInitialization.lastIndexOf('const requestActiveHeadingUpdate'));
  assert.doesNotMatch(setupTail, /^\s*updateActiveHeading\(\);\s*$/m, 'setup must not synchronously measure headings');

  for (const forbidden of ['setTimeout(', 'setInterval(', 'requestIdleCallback(', 'IntersectionObserver(']) {
    assert.doesNotMatch(outline, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
