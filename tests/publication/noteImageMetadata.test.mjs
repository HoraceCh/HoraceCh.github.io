import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generatedNoteAssetFallback } from '../../astro.config.mjs';
import {
  addNoteImageGeometryToHtml,
  clearNoteImageMetadataCache,
  dimensionsForBuffer,
  readNoteImageMetadata,
  resolveNoteAssetPath,
} from '../../tools/note-image-metadata.mjs';

function png(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function gif(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.write('GIF89a', 0, 'ascii');
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);
  return buffer;
}

function jpeg(width, height, marker = 0xc0, orientation) {
  const segments = [Buffer.from([0xff, 0xd8])];
  if (orientation) {
    const exif = Buffer.alloc(32);
    exif.write('Exif\0\0', 0, 'binary');
    exif.write('II', 6, 'ascii');
    exif.writeUInt16LE(42, 8);
    exif.writeUInt32LE(8, 10);
    exif.writeUInt16LE(1, 14);
    exif.writeUInt16LE(0x0112, 16);
    exif.writeUInt16LE(3, 18);
    exif.writeUInt32LE(1, 20);
    exif.writeUInt16LE(orientation, 24);
    const app1 = Buffer.alloc(exif.length + 4);
    app1.set([0xff, 0xe1]);
    app1.writeUInt16BE(exif.length + 2, 2);
    exif.copy(app1, 4);
    segments.push(app1);
  }
  const sof = Buffer.alloc(10);
  sof.set([0xff, marker]);
  sof.writeUInt16BE(8, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  sof[9] = 0;
  segments.push(sof, Buffer.from([0xff, 0xd9]));
  return Buffer.concat(segments);
}

function webpChunk(type, data) {
  const chunk = Buffer.alloc(8 + data.length + (data.length % 2));
  chunk.write(type, 0, 'ascii');
  chunk.writeUInt32LE(data.length, 4);
  data.copy(chunk, 8);
  const riff = Buffer.alloc(12);
  riff.write('RIFF', 0, 'ascii');
  riff.writeUInt32LE(chunk.length + 4, 4);
  riff.write('WEBP', 8, 'ascii');
  return Buffer.concat([riff, chunk]);
}

test('reads PNG, baseline/progressive JPEG, GIF, and EXIF-oriented JPEG dimensions', () => {
  assert.deepEqual(dimensionsForBuffer(png(640, 480), '.png'), { width: 640, height: 480 });
  assert.deepEqual(dimensionsForBuffer(gif(320, 200), '.gif'), { width: 320, height: 200 });
  assert.deepEqual(dimensionsForBuffer(jpeg(800, 600, 0xc0), '.jpg'), { width: 800, height: 600 });
  assert.deepEqual(dimensionsForBuffer(jpeg(800, 600, 0xc2), '.jpeg'), { width: 800, height: 600 });
  assert.deepEqual(dimensionsForBuffer(jpeg(800, 600, 0xc0, 6), '.jpg'), { width: 600, height: 800 });
});

test('reads WebP VP8, VP8L, and VP8X dimensions', () => {
  const vp8 = Buffer.alloc(10);
  vp8.set([0x9d, 0x01, 0x2a], 3);
  vp8.writeUInt16LE(500, 6);
  vp8.writeUInt16LE(300, 8);
  assert.deepEqual(dimensionsForBuffer(webpChunk('VP8 ', vp8), '.webp'), { width: 500, height: 300 });

  const vp8l = Buffer.from([0x2f, 0xf3, 0x40, 0x1f, 0x00]);
  assert.deepEqual(dimensionsForBuffer(webpChunk('VP8L', vp8l), '.webp'), { width: 244, height: 126 });

  const vp8x = Buffer.alloc(10);
  vp8x.writeUIntLE(999, 4, 3);
  vp8x.writeUIntLE(599, 7, 3);
  assert.deepEqual(dimensionsForBuffer(webpChunk('VP8X', vp8x), '.webp'), { width: 1000, height: 600 });
});

test('reads SVG numeric/px dimensions, viewBox fallback, and one-dimension ratios', () => {
  const svg = (value) => dimensionsForBuffer(Buffer.from(value), '.svg');
  assert.deepEqual(svg('<svg width="120" height="80px"/>'), { width: 120, height: 80 });
  assert.deepEqual(svg('<svg viewBox="0 0 300 150"/>'), { width: 300, height: 150 });
  assert.deepEqual(svg('<svg width="400" viewBox="0 0 200 100"/>'), { width: 400, height: 200 });
  assert.deepEqual(svg('<svg height="90px" viewBox="0 0 200 100"/>'), { width: 180, height: 90 });
});

test('rejects corrupt, unsupported, zero-dimension, and unusable SVG inputs', () => {
  assert.throws(() => dimensionsForBuffer(Buffer.from('bad'), '.png'), /corrupt or truncated PNG/);
  assert.throws(() => dimensionsForBuffer(Buffer.from('bad'), '.jpg'), /corrupt or truncated JPEG/);
  assert.throws(() => dimensionsForBuffer(Buffer.from('bad'), '.webp'), /corrupt or truncated WebP/);
  assert.throws(() => dimensionsForBuffer(Buffer.from('bad'), '.gif'), /corrupt or truncated GIF/);
  assert.throws(() => dimensionsForBuffer(Buffer.from('bad'), '.tiff'), /unsupported image format/);
  assert.throws(() => dimensionsForBuffer(png(0, 2), '.png'), /invalid width/);
  assert.throws(
    () => dimensionsForBuffer(Buffer.from('<svg width="100%" height="50%"/>'), '.svg'),
    /percentage-only SVG dimensions require a usable viewBox/,
  );
  assert.throws(
    () => dimensionsForBuffer(Buffer.from('<svg width="0" height="10" viewBox="0 0 100 10"/>'), '.svg'),
    /SVG has invalid width/,
  );
});

test('resolves only contained Note asset paths and reports URL plus filesystem path', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'note-image-metadata-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'slug'));
  await writeFile(path.join(root, 'slug', 'image.png'), png(20, 10));

  clearNoteImageMetadataCache();
  assert.deepEqual(readNoteImageMetadata('/notes-assets/slug/image.png', { assetRoot: root }), { width: 20, height: 10 });
  await writeFile(path.join(root, 'slug', 'image.png'), png(99, 88));
  assert.deepEqual(readNoteImageMetadata('/notes-assets/slug/image.png', { assetRoot: root }), { width: 20, height: 10 });

  assert.throws(
    () => resolveNoteAssetPath('/notes-assets/../outside.png', root),
    (error) => error.message.includes('/notes-assets/../outside.png') && error.message.includes(path.resolve(root, '..', 'outside.png')),
  );
  await writeFile(path.join(root, 'bad.bmp'), Buffer.from('BM'));
  await writeFile(path.join(root, 'bad.avif'), Buffer.from('avif'));
  await writeFile(path.join(root, 'bad.tiff'), Buffer.from('tiff'));
  await writeFile(path.join(root, 'corrupt.png'), Buffer.from('png'));
  await writeFile(path.join(root, 'zero.png'), png(0, 10));
  await writeFile(path.join(root, 'bad.svg'), Buffer.from('<svg width="100%" height="50%"/>'));

  const failures = new Map([
    ['/notes-assets/bad.bmp', /BMP dimensions are not supported/],
    ['/notes-assets/bad.avif', /AVIF dimensions are not supported/],
    ['/notes-assets/bad.tiff', /unsupported image format/],
    ['/notes-assets/corrupt.png', /corrupt or truncated PNG/],
    ['/notes-assets/zero.png', /invalid width/],
    ['/notes-assets/bad.svg', /percentage-only SVG dimensions require a usable viewBox/],
  ]);
  for (const [url, pattern] of failures) {
    const resolved = path.join(root, path.basename(url));
    assert.throws(
      () => readNoteImageMetadata(url, { assetRoot: root }),
      (error) => error.message.includes(url) && error.message.includes(resolved) && pattern.test(error.message),
      url,
    );
  }
});

test('built Note HTML geometry preserves alt and ignores remote images', () => {
  const input = '<img src="/notes-assets/tree-binary-tree/5.png" alt="tree"><img src="https://example.com/remote.png" alt="remote">';
  const output = addNoteImageGeometryToHtml(input);
  const [local, remote] = output.match(/<img\b[^>]*>/g);
  assert.match(local, /alt="tree"/);
  assert.match(local, /width="\d+"/);
  assert.match(local, /height="\d+"/);
  assert.match(local, /loading="lazy"/);
  assert.match(local, /decoding="async"/);
  assert.equal(remote, '<img src="https://example.com/remote.png" alt="remote">');
});

test('generated Note fallback uses an explicit sentinel and writes the full image contract', () => {
  const plugin = generatedNoteAssetFallback();
  const publicUrl = '/notes-assets/tree-binary-tree/5.png';
  const encoded = Buffer.from(publicUrl, 'utf8').toString('base64url');
  const moduleCode = plugin.load(`\0generated-note-asset:${encoded ? `data=${encoded}` : ''}`);
  assert.match(moduleCode, /__generatedNoteAssetFallback/);
  assert.match(moduleCode, /"width":\d+/);
  assert.match(moduleCode, /"height":\d+/);

  const runtime = 'before; image = await getImage({ ...decodedImagePath, src: imported });; after';
  const id = path.resolve('node_modules/astro/dist/content/runtime.js');
  const transformed = plugin.transform(runtime, id).code;
  assert.match(transformed, /imported\?\.__generatedNoteAssetFallback === true/);
  assert.match(transformed, /alt: decodedImagePath\.alt/);
  assert.match(transformed, /width: imported\.width/);
  assert.match(transformed, /height: imported\.height/);
  assert.match(transformed, /loading: "lazy"/);
  assert.match(transformed, /decoding: "async"/);
  assert.throws(
    () => plugin.transform('changed runtime', id),
    /Astro content image runtime contract changed/,
  );
});
