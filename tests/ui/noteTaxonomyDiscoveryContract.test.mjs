import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Notes discovery hides zero-count registry entries without removing direct taxonomy routes', async () => {
  const [index, categories, paths, types, statuses] = await Promise.all([
    readFile('src/pages/notes/index.astro', 'utf8'),
    readFile('src/pages/notes/categories/[category].astro', 'utf8'),
    readFile('src/pages/notes/paths/[path].astro', 'utf8'),
    readFile('src/pages/notes/types/[type].astro', 'utf8'),
    readFile('src/pages/notes/status/[status].astro', 'utf8'),
  ]);

  assert.match(index, /function primaryDiscoveryItems<T extends \{ count: number \}>/);
  assert.match(index, /items\.filter\(\(item\) => item\.count > 0\)/);
  for (const countSet of ['categories', 'pathCounts', 'typeCounts', 'statusCounts']) {
    assert.match(index, new RegExp(`primaryDiscoveryItems\\(${countSet}\\)`));
  }
  assert.match(index, /label="Tags" items=\{tagCounts\}/, 'tag discovery remains governed by published tags');

  assert.match(categories, /return categoryDefinitions\.map/);
  assert.match(categories, /emptyMessage="No public notes in this category yet\."/);
  assert.match(paths, /return pathDefinitions\.map/);
  assert.match(paths, /emptyMessage="No public notes in this path yet\."/);
  assert.match(types, /return Object\.entries\(typeLabels\)\.map/);
  assert.match(types, /emptyMessage="No public notes use this type yet\."/);
  assert.match(statuses, /return Object\.entries\(statusDescriptions\)\.map/);
  assert.match(statuses, /emptyMessage="No public notes have this status yet\."/);
});
