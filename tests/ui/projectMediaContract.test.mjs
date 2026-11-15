import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getProjectMedia } from '../../src/data/projectMedia.ts';

const approved = [
  ['ai-retrieval-tool', 'ai-retrieval-ui', [1200, 1311], [
    '4192ef01974376462d4891afa851f999072de211c1cb47547242f60cd51162a1',
    '013aa00c057f9c6be05ebffbe4713a77ad8c2af19f5ff9df899ccf9bdb2495cb',
    '454b4312538474d5b097ba73543d934e1d710ed398d39f413c5724766265bbe7',
  ]],
  ['robomaster-2026-engineering-robot', 'rm26-robot', [1200, 800], [
    '87e0f6e021caf9ff60f4cac8b8d92a7eaec60fd154ffed1c0e919b9487178a47',
    '73589d304e6791968148dd18d4481d73404af531dfd3465a2d8e0b7a0dcd0c93',
    '610cb0c90a847c861668e6d34e36ac8b16cabdbe11500e4899786c2ccaf8fbae',
  ]],
];

test('presentation media is restricted to the two approved stable Project IDs', () => {
  for (const id of ['robotic-arm-mechanical-design', 'mechanical-design-portfolio',
    'vla-embodied-ai-learning-system', 'ai-assisted-learning-workflow',
    'robotics-control-project-placeholder', 'toString', '', 'AI-RETRIEVAL-TOOL']) {
    assert.equal(getProjectMedia(id), undefined, id);
  }
});

test('missing approved derivatives omit only the optional presentation', () => {
  for (const [id] of approved) assert.equal(getProjectMedia(id, 'tests/ui/fixtures'), undefined);
});

test('M1 resolves the exact admitted derivative bytes and source dimensions', async () => {
  for (const [id, family, dimensions, hashes] of approved) {
    const media = getProjectMedia(id);
    assert.ok(media);
    assert.equal(media.src, '/images/home/' + family + '-1200.webp');
    assert.deepEqual([media.width, media.height], dimensions);
    const sources = media.srcset.split(', ');
    assert.equal(sources.length, 3);
    for (const [index, width] of [480, 768, 1200].entries()) {
      assert.equal(sources[index], '/images/home/' + family + '-' + width + '.webp ' + width + 'w');
      const buffer = await readFile('astro-public/images/home/' + family + '-' + width + '.webp');
      assert.equal(createHash('sha256').update(buffer).digest('hex'), hashes[index]);
    }
  }
});

test('built browse opts in only approved images after copy and before independent resources', async () => {
  const html = await readFile('dist/projects/index.html', 'utf8');
  const cards = [...html.matchAll(/<article class="card project-card">([\s\S]*?)<\/article>/g)].map(m => m[1]);
  assert.equal(cards.length, 5);
  assert.equal(cards.filter(card => card.includes('<img ')).length, 2);
  for (const card of cards) {
    const href = card.match(/<h3><a href="([^"]+)">/)?.[1];
    const media = approved.map(([id]) => [id, getProjectMedia(id)])
      .find(([id]) => href === '/projects/' + id + '/')?.[1];
    if (!media) {
      assert.doesNotMatch(card, /<img\b|project-card-media/);
      continue;
    }
    assert.equal((card.match(/<img\b/g) ?? []).length, 1);
    assert.ok(card.indexOf('</p>') < card.indexOf('<img '));
    assert.ok(card.indexOf('<img ') < card.indexOf('class="card-links"'));
    assert.match(card, /loading="lazy" decoding="async"/);
    assert.match(card, /sizes="auto, 360px"/);
    assert.ok(card.includes('alt="' + media.alt + '"'));
    assert.ok(card.includes('width="' + media.width + '" height="' + media.height + '"'));
    for (const [anchor] of card.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) {
      assert.doesNotMatch(anchor, /<img\b/);
    }
  }
});
