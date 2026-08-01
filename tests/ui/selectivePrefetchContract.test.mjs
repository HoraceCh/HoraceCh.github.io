import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const approvedSourceCounts = new Map([
  ['src/components/Header.astro', 2],
  ['src/components/notes/NoteProperties.astro', 1],
  ['src/pages/index.astro', 1],
  ['src/pages/notes/index.astro', 2],
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(target) : target;
  }));
  return files.flat();
}

function anchorTags(source) {
  return source.match(/<a\b[^>]*>/g) ?? [];
}

function prefetchAnchors(source) {
  return anchorTags(source).filter((tag) => /\bdata-astro-prefetch="hover"/.test(tag));
}

test('selective prefetch stays explicit, intent-based, and limited to approved source surfaces', async () => {
  const sourcePaths = (await collectFiles('src')).filter((file) => /\.(?:astro|js|mjs|ts)$/.test(file));
  const sourceEntries = await Promise.all(sourcePaths.map(async (file) => [
    file.replaceAll('\\', '/'),
    await readFile(file, 'utf8'),
  ]));
  const sourceByPath = new Map(sourceEntries);
  const config = await readFile('astro.config.mjs', 'utf8');

  assert.match(
    config,
    /prefetch:\s*\{\s*prefetchAll:\s*false,\s*defaultStrategy:\s*['"]hover['"],?\s*\}/s,
  );
  assert.doesNotMatch(config, /prefetchAll:\s*true/);
  assert.doesNotMatch(config, /@astrojs\/prefetch|ClientRouter|astro:transitions/);

  const actualSourceCounts = new Map();
  for (const [file, source] of sourceEntries) {
    const count = prefetchAnchors(source).length;
    if (count > 0) actualSourceCounts.set(file, count);
  }
  assert.deepEqual(actualSourceCounts, approvedSourceCounts);

  const header = sourceByPath.get('src/components/Header.astro');
  const home = sourceByPath.get('src/pages/index.astro');
  const noteCard = sourceByPath.get('src/components/NoteCard.astro');
  const noteList = sourceByPath.get('src/components/NoteList.astro');
  const notesIndex = sourceByPath.get('src/pages/notes/index.astro');
  const noteProperties = sourceByPath.get('src/components/notes/NoteProperties.astro');
  assert.match(header, /class="site-brand"[^>]*data-astro-prefetch="hover"/);
  assert.match(header, /links\.map[\s\S]*?<a href=\{link\.href\}[^>]*data-astro-prefetch="hover"/);
  assert.match(home, /class="work-card"[^>]*data-astro-prefetch="hover"/);
  assert.match(noteCard, /prefetch\?: boolean/);
  assert.match(noteCard, /prefetch = false/);
  assert.match(noteCard, /data-astro-prefetch=\{prefetch \? ['"]hover['"] : undefined\}/);
  assert.match(noteList, /prefetch\?: boolean/);
  assert.match(noteList, /prefetch = false/);
  assert.match(noteList, /<NoteCard[\s\S]*?prefetch=\{prefetch\}[\s\S]*?\/>/);
  assert.match(notesIndex, /<NoteList\b[^>]*prefetch=\{true\}[^>]*\/>/);
  assert.equal(prefetchAnchors(notesIndex).length, 2);
  assert.match(
    noteProperties,
    /relatedNotes\.map[\s\S]*?<a href=\{item\.href\} data-astro-prefetch="hover"/,
  );
  assert.doesNotMatch(
    noteProperties.match(/prerequisites\.map[\s\S]*?<\/ul>/)?.[0] ?? '',
    /data-astro-prefetch/,
  );

  const changedRuntimeSources = [
    header,
    home,
    noteCard,
    noteList,
    notesIndex,
    noteProperties,
  ].join('\n');
  assert.doesNotMatch(changedRuntimeSources, /data-astro-prefetch="(?:viewport|load|tap)"/);
  assert.doesNotMatch(
    changedRuntimeSources,
    /ClientRouter|astro:transitions|document\.startViewTransition|new\s+IntersectionObserver|rel=["']prefetch|fetch\s*\(/,
  );
  assert.doesNotMatch(changedRuntimeSources, /addEventListener\(\s*['"](?:click|pointerdown|pointerup)['"]/);

  for (const [, source] of sourceEntries) {
    for (const anchor of prefetchAnchors(source)) {
      assert.doesNotMatch(anchor, /href=["'](?:#|https?:|mailto:|tel:)/i);
      assert.doesNotMatch(anchor, /\bdownload\b/i);
    }
  }

  const noteCardCallSites = sourceEntries
    .filter(([, source]) => /<NoteCard\b/.test(source))
    .map(([file]) => file);
  assert.deepEqual(noteCardCallSites, ['src/components/NoteList.astro']);

  const noteListCallSites = sourceEntries.flatMap(([file, source]) =>
    [...source.matchAll(/<NoteList\b[\s\S]*?\/>/g)].map((match) => ({ file, tag: match[0] })));
  assert.equal(noteListCallSites.length, 7);
  for (const { file, tag } of noteListCallSites) {
    if (file === 'src/pages/notes/index.astro') {
      assert.match(tag, /prefetch=\{true\}/);
    } else {
      assert.doesNotMatch(tag, /\bprefetch=/, `unapproved NoteList context opted into prefetch: ${file}`);
    }
  }

  const layout = sourceByPath.get('src/layouts/Layout.astro');
  assert.match(layout, /<a class="skip-link" href="#main-content">/);
  assert.doesNotMatch(
    layout.match(/<a class="skip-link"[^>]*>/)?.[0] ?? '',
    /data-astro-prefetch/,
  );

  const transitionCss = await readFile('src/styles/global.css', 'utf8');
  assert.match(transitionCss, /animation:\s*site-main-exit 110ms/);
  assert.match(transitionCss, /animation:\s*site-main-enter 180ms/);
  assert.match(transitionCss, /translateY\(-4px\)/);
  assert.match(transitionCss, /translateY\(4px\)/);
});

test('built HTML exposes hover prefetch only on eligible page-navigation anchors', async () => {
  const [home, notes, relatedNote] = await Promise.all([
    readFile('dist/index.html', 'utf8'),
    readFile('dist/notes/index.html', 'utf8'),
    readFile('dist/notes/starting-this-personal-website/index.html', 'utf8'),
  ]);

  for (const html of [home, notes, relatedNote]) {
    assert.match(html, /<script[^>]+type="module"[^>]+src="\/_astro\/page\.[^"]+\.js"/);
    const eligible = prefetchAnchors(html);
    assert.ok(eligible.length > 0);
    for (const anchor of eligible) {
      const href = anchor.match(/\bhref="([^"]+)"/)?.[1];
      assert.ok(href?.startsWith('/'), `prefetched link must be same-origin: ${anchor}`);
      assert.ok(!href.includes('#'), `fragment link must not be prefetched: ${anchor}`);
      assert.doesNotMatch(anchor, /\bdownload\b/i);
    }

    const skipLink = anchorTags(html).find((tag) => /class="skip-link"/.test(tag));
    assert.ok(skipLink);
    assert.doesNotMatch(skipLink, /data-astro-prefetch/);
  }

  const homeWorkLinks = anchorTags(home).filter((tag) => /class="work-card"/.test(tag));
  assert.ok(homeWorkLinks.length > 0);
  assert.ok(homeWorkLinks.every((tag) => /data-astro-prefetch="hover"/.test(tag)));

  const noteEntryLinks = anchorTags(notes).filter((tag) =>
    /class="compact-note(?:\s|")/.test(tag) || /data-astro-prefetch="hover"[^>]*href="\/notes\//.test(tag));
  assert.ok(noteEntryLinks.length > 0);
  assert.ok(noteEntryLinks.every((tag) => /data-astro-prefetch="hover"/.test(tag)));

  const notesIndexCards = notes.match(/<article class="card note-card">[\s\S]*?<\/article>/g) ?? [];
  assert.ok(notesIndexCards.length > 0);
  assert.ok(notesIndexCards.every((card) => /data-astro-prefetch="hover"/.test(card)));

  const filterFiles = (await collectFiles('dist/notes')).filter((file) =>
    /\/notes\/(?:categories|collections|paths|status|tags|types)\/.+\/index\.html$/.test(file.replaceAll('\\', '/')));
  assert.ok(filterFiles.length > 0);
  let filterCardCount = 0;
  for (const file of filterFiles) {
    const html = await readFile(file, 'utf8');
    const cards = html.match(/<article class="card note-card">[\s\S]*?<\/article>/g) ?? [];
    filterCardCount += cards.length;
    assert.ok(cards.every((card) => !/data-astro-prefetch/.test(card)), file);
  }
  assert.ok(filterCardCount > 0);

  const filterLinks = anchorTags(notes).filter((tag) =>
    /href="\/notes\/(?:categories|collections|paths|status|tags|types)\//.test(tag));
  assert.ok(filterLinks.length > 0);
  assert.ok(filterLinks.every((tag) => !/data-astro-prefetch/.test(tag)));

  const relatedHeadingIndex = relatedNote.indexOf('<h3>Related notes</h3>');
  assert.notEqual(relatedHeadingIndex, -1);
  const relatedSection = relatedNote.slice(relatedHeadingIndex, relatedNote.indexOf('</ul>', relatedHeadingIndex));
  assert.match(relatedSection, /<a href="\/notes\/[^"]+\/" data-astro-prefetch="hover">/);

  const fragmentLinks = anchorTags(relatedNote).filter((tag) => /\bhref="#/.test(tag));
  assert.ok(fragmentLinks.length > 0);
  assert.ok(fragmentLinks.every((tag) => !/data-astro-prefetch/.test(tag)));

  const externalLinks = [...home, notes, relatedNote]
    .flatMap((html) => anchorTags(html))
    .filter((tag) => /\bhref="https?:\/\//i.test(tag));
  assert.ok(externalLinks.length > 0);
  assert.ok(externalLinks.every((tag) => !/data-astro-prefetch/.test(tag)));
});
