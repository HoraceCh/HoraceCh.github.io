import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('HC-27 keeps mobile outline native, meaningful, and before prose', async () => {
  const route = await readFile('src/pages/notes/[slug].astro', 'utf8');
  const outlineGate = route.indexOf('outlineItems.length >= 2');
  const mobileOutline = route.indexOf('data-mobile-note-outline');
  const mobileDetails = route.lastIndexOf('<details', mobileOutline);
  const readingLayout = route.indexOf('<div class="note-reading-layout">');
  const essentialMetadata = route.indexOf('class="note-essential-metadata"');

  assert.ok(
    outlineGate >= 0 && essentialMetadata >= 0 && essentialMetadata < mobileDetails && mobileDetails > outlineGate && mobileDetails < readingLayout,
  );
  assert.match(route.slice(mobileDetails, readingLayout), /<details[^>]*data-mobile-note-outline/);
  assert.match(route.slice(mobileDetails, readingLayout), /<summary>On this page<\/summary>/);
  assert.match(route.slice(mobileDetails, readingLayout), /<NoteOutline outline=\{outlineItems\} \/>/);
});

test('HC-27 orders sidepane Properties, Outline, and Backlinks without a duplicate mobile sidepane outline', async () => {
  const route = await readFile('src/pages/notes/[slug].astro', 'utf8');
  const sidepane = await readFile('src/components/notes/NoteSidepane.astro', 'utf8');
  const css = await readFile('src/styles/global.css', 'utf8');

  assert.ok(route.indexOf('<NoteSidepane') < route.indexOf('slot="properties"'));
  assert.ok(sidepane.indexOf('note-sidepane-properties') < sidepane.indexOf('note-outline-section'));
  assert.ok(sidepane.indexOf('note-outline-section') < sidepane.indexOf('note-backlinks-section'));
  assert.match(sidepane, /<details class="note-sidepane-section note-sidepane-properties">\s*<summary>Properties<\/summary>/);
  assert.match(css, /\.note-reading-layout\s*\{[\s\S]*grid-template-areas:\s*"content sidepane";/);
  assert.match(css, /\.note-sidepane-properties \.note-context\s*\{[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;/);
  assert.match(css, /\.note-mobile-outline\s*\{\s*display:\s*none;/);
  const stacked = css.slice(css.indexOf('@media (max-width: 980px)'), css.indexOf('@media (max-width: 720px)'));
  assert.match(stacked, /\.note-mobile-outline\s*\{[\s\S]*display:\s*block;/);
  assert.match(stacked, /\.note-sidepane \.note-outline-section\s*\{\s*display:\s*none;/);
});

test('HC-27 preserves native fragment behavior while collapsing mobile outline and focusing the target', async () => {
  const outline = await readFile('src/components/notes/NoteOutline.astro', 'utf8');
  const css = await readFile('src/styles/global.css', 'utf8');

  assert.match(outline, /document\.addEventListener\('click'/);
  assert.match(outline, /target\.closest\('\[data-note-outline\] a\[href\^="#"\]'\)/);
  assert.match(outline, /mobileOutline\.open = false/);
  assert.match(outline, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(outline, /new Map<string, HTMLAnchorElement\[\]>/);
  assert.match(css, /\.note-prose :is\(h2, h3\)\[id\]\s*\{[\s\S]*scroll-margin-top:/);
  assert.match(css, /\.note-sidepane-section summary,[\s\S]*\.note-outline-item a,[\s\S]*min-height: 44px/);
  assert.match(css, /prefers-reduced-motion/);
});
