import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Notes discovery hides zero-count registry entries without removing direct taxonomy routes', async () => {
  const [index, explore, archive, categories, paths, types, statuses] = await Promise.all([
    readFile('src/pages/notes/index.astro', 'utf8'),
    readFile('src/pages/notes/explore/index.astro', 'utf8'),
    readFile('src/pages/notes/archive/index.astro', 'utf8'),
    readFile('src/pages/notes/categories/[category].astro', 'utf8'),
    readFile('src/pages/notes/paths/[path].astro', 'utf8'),
    readFile('src/pages/notes/types/[type].astro', 'utf8'),
    readFile('src/pages/notes/status/[status].astro', 'utf8'),
  ]);

  assert.match(explore, /function populated<T extends \{ count: number \}>/);
  assert.match(explore, /items\.filter\(\(item\) => item\.count > 0\)/);
  for (const countSet of ['categories', 'pathCounts', 'typeCounts', 'statusCounts']) {
    const renamed = countSet.replace('pathCounts', 'paths').replace('typeCounts', 'types').replace('statusCounts', 'statuses');
    assert.match(explore, new RegExp(`populated\\(${renamed}\\)`));
  }
  assert.match(explore, /label="Tags" items=\{tags\}/, 'tag discovery remains governed by published tags');

  const sectionOrder = ['Start Here', 'Primary Structure', 'Second Level', 'Recent Notes', 'Key Browse Paths', 'Search Notes', 'Explore all browse paths'];
  let previousIndex = -1;
  for (const marker of sectionOrder) {
    const markerIndex = index.indexOf(marker);
    assert.ok(markerIndex > previousIndex, `${marker} must follow the preceding discovery section`);
    previousIndex = markerIndex;
  }
  assert.match(index, /const recentNotes = ordinaryNotes\.slice\(0, 5\)/);
  assert.match(index, /href="\/notes\/explore\/"/);
  assert.match(index, /href="\/notes\/archive\/"/);
  assert.match(index, /<button type="button" disabled aria-describedby="notes-search-description">Search planned<\/button>/);
  assert.doesNotMatch(index, /\/search\//, 'HC-28 must not preempt HC-56 with a search route');
  assert.doesNotMatch(index, /<BrowsePills|<NoteList/, 'the landing page must not expand full taxonomy or archive inventories');
  assert.match(archive, /<NoteList notes=\{ordinaryNotes\}/);

  assert.match(categories, /return categoryDefinitions\.map/);
  assert.match(categories, /emptyMessage="No public notes in this category yet\."/);
  assert.match(paths, /return pathDefinitions\.map/);
  assert.match(paths, /emptyMessage="No public notes in this path yet\."/);
  assert.match(types, /return Object\.entries\(typeLabels\)\.map/);
  assert.match(types, /emptyMessage="No public notes use this type yet\."/);
  assert.match(statuses, /return Object\.entries\(statusDescriptions\)\.map/);
  assert.match(statuses, /emptyMessage="No public notes have this status yet\."/);
});
