import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const assets = [
  { path: 'astro-public/favicon.png', dimensions: [64, 64], maxBytes: 25_000 },
  { path: 'astro-public/favicon-dark.png', dimensions: [64, 64], maxBytes: 25_000 },
  { path: 'astro-public/apple-touch-icon.png', dimensions: [180, 180], maxBytes: 100_000 },
  { path: 'astro-public/assets/profile-mark.png', dimensions: [554, 554], maxBytes: 250_000 },
];

test('public identity images are role-sized, referenced once, and byte-distinct', async () => {
  const [layout, home, ...buffers] = await Promise.all([
    readFile('src/layouts/Layout.astro', 'utf8'),
    readFile('src/pages/index.astro', 'utf8'),
    ...assets.map((asset) => readFile(asset.path)),
  ]);

  assets.forEach((asset, index) => {
    const buffer = buffers[index];
    assert.deepEqual(pngDimensions(buffer), asset.dimensions, `${asset.path} has the wrong intrinsic dimensions`);
    assert.ok(buffer.byteLength <= asset.maxBytes, `${asset.path} exceeds its role-sized byte budget`);
  });

  const hashes = buffers.map((buffer) => createHash('sha256').update(buffer).digest('hex'));
  assert.equal(new Set(hashes).size, hashes.length, 'separate public image URLs must not serve duplicate bytes');
  assert.match(layout, /sizes="64x64" href="\/favicon\.png"/);
  assert.match(layout, /sizes="64x64" href="\/favicon-dark\.png"/);
  assert.match(layout, /sizes="180x180" href="\/apple-touch-icon\.png"/);
  assert.equal((layout.match(/href="\/favicon\.png"/g) ?? []).length, 1, 'favicon URL must not be duplicated');
  assert.doesNotMatch(
    home,
    /\/assets\/profile-mark\.png/,
    'Home must not render the retired profile portrait asset',
  );
});

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG', 'asset must be a PNG');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
