import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('selected homepage work exposes content-type-specific native action labels', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const works = html.match(/<section[^>]*id="selected-works"[\s\S]*?<\/section>/)?.[0];
  assert.ok(works, 'approved Home retains Selected Works');
  const rows = [...works.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => match[1]);
  assert.equal(rows.length, 2, 'Home curates exactly two Projects under the admitted Home contract');
  const expected = ['/projects/robomaster-2026-engineering-robot/', '/projects/ai-retrieval-tool/'];
  for (const [index, row] of rows.entries()) {
    const titleHref = row.match(/<h3\b[^>]*><a href="([^"]+)"/)?.[1];
    assert.equal(titleHref, expected[index]);
    const actions = row.match(/<div class="project-actions"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(actions);
    assert.match(actions, new RegExp('href="' + expected[index] + '"[^>]*>View project <span aria-hidden="true"[^>]*>'));
    assert.match(actions, /href="https:\/\/github.com\/[^"]+" target="_blank" rel="noopener noreferrer"[^>]*>Repository/);
    assert.doesNotMatch(actions, /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
    assert.doesNotMatch(row, /class="card-action"|>View<\/a>/);
  }
  // Notes are no longer a Home slot. Their actual reusable consumer retains a
  // descriptive Note title link, rather than inventing a third Home card.
  const noteCard = await readFile('src/components/NoteCard.astro', 'utf8');
  assert.match(noteCard, /<h3><a href=\{href\}[^>]*>\{title\}<\/a><\/h3>/);
  assert.doesNotMatch(noteCard, />View<\/a>/);
});
