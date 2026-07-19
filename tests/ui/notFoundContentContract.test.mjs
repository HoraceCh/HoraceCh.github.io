import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('404 copy is durable and retains all recovery destinations', async () => {
  const source = await readFile('src/pages/404.astro', 'utf8');
  const normalized = source.replace(/\s+/g, ' ');

  assert.match(
    normalized,
    /The requested page could not be found\. It may have moved, or the address may be incorrect\. Use one of the links below to continue\./,
  );
  assert.doesNotMatch(normalized, /site is being prepared/i);
  assert.match(source, /<LinkButton href="\/" label="Home"/);
  assert.match(source, /<LinkButton href="\/projects\/" label="Projects"/);
  assert.match(source, /<LinkButton href="\/notes\/" label="Notes"/);
});
