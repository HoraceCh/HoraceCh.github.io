import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('selected homepage work exposes content-type-specific action labels', async () => {
  const source = await readFile('src/pages/index.astro', 'utf8');

  const projectLabels = source.match(/actionLabel: 'View project'/g) ?? [];
  assert.equal(projectLabels.length, 2, 'both curated Project cards must explicitly label their action');
  assert.match(source, /selectedWorkNote\.data\.title,\s+actionLabel: 'Read note'/);
  assert.match(source, /<span class="card-action">\{item\.actionLabel\}/);
  assert.doesNotMatch(source, /<span class="card-action">View project/);
});
