import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Archive renders ordered, complete note rows and retains the index list', async () => {
  const html = await readFile('dist/notes/archive/index.html', 'utf8');
  const rows = [...html.matchAll(/<article class="archive-note-row">([\s\S]*?)<\/article>/g)]
    .map((match) => match[1]);
  const count = Number(html.match(/(\d+) public individual notes?\./)?.[1]);
  assert.ok(rows.length > 0);
  assert.equal(rows.length, count, 'the complete ordinary-note set appears once');

  const hrefs = rows.map((row) => {
    const title = row.match(/<h4><a href="(\/notes\/[^"#?]+\/)">([^<]+)<\/a><\/h4>/);
    assert.ok(title, 'each row has a canonical primary title link');
    assert.ok(title[2].trim(), 'the full title is present');
    assert.match(row, /<p class="archive-note-meta"><span>[^<]+<\/span><span>[A-Z][a-z]{2} \d{1,2}, \d{4} \/ [^<]+<\/span><\/p>/);
    assert.doesNotMatch(row, /class="(?:card|status-badge)/);
    return title[1];
  });
  assert.equal(new Set(hrefs).size, hrefs.length, 'ordinary note links are unique');
  assert.match(html, /<section class="archive-note-group" aria-labelledby="archive-category-0"><h3 id="archive-category-0">[^<]+<\/h3>/);
  assert.match(html, /<div class="compact-note-list">/, 'the separate index list remains');
  assert.match(html, /class="compact-note compact-note-muted" href="\/notes\/[^"#?]+\/"/);
});
