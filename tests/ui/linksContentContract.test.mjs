import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Links page describes its real content without placeholder-only sections', async () => {
  const source = await readFile('src/pages/links.astro', 'utf8');

  assert.match(source, /description="Sites I follow and details for exchanging links\."/);
  assert.match(source, /A small list of sites I follow, together with details for exchanging links\./);
  assert.doesNotMatch(source, /Research \/ Learning Communities/);
  assert.doesNotMatch(source, /Tools &amp; Resources/);
  assert.doesNotMatch(source, /Resource links will be added when they become useful and stable\./);

  assert.match(source, /<h2>Friends \| Links I Follow<\/h2>/);
  assert.match(source, /<h2>Link Exchange<\/h2>/);
  assert.match(source, /<h2>Link Format<\/h2>/);
  assert.match(source, /<h2>Link Notes<\/h2>/);
  assert.match(source, /target="_blank" rel="noopener noreferrer"/);
});
