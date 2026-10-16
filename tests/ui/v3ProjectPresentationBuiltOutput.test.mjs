import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projects = [
  ['featured-projects', ['/projects/ai-retrieval-tool/']],
  ['learning-projects', ['/projects/ai-assisted-learning-workflow/', '/projects/vla-embodied-ai-learning-system/']],
  ['secondary-projects', ['/projects/mechanical-design-portfolio/']],
];

function assertSeparateAnchors(html) {
  let open = false;
  for (const [tag] of html.matchAll(/<\/?a\b[^>]*>/g)) {
    if (tag.startsWith('</')) {
      assert.equal(open, true, 'anchor closes after opening');
      open = false;
    } else {
      assert.equal(open, false, 'anchors must not nest');
      open = true;
    }
  }
  assert.equal(open, false, 'all anchors close');
}

test('Projects preserves ordered partitions and independent project actions', async () => {
  const html = await readFile('dist/projects/index.html', 'utf8');
  const sections = [...html.matchAll(/<section class="section" aria-labelledby="([^"]+)">([\s\S]*?)<\/section>/g)];
  assert.deepEqual(sections.map((match) => match[1]), projects.map(([id]) => id));

  for (const [index, [, hrefs]] of projects.entries()) {
    const cards = [...sections[index][2].matchAll(/<article class="card project-card">([\s\S]*?)<\/article>/g)]
      .map((match) => match[1]);
    assert.deepEqual(cards.map((card) => card.match(/<h3><a href="([^"]+)">/)?.[1]), hrefs);
    for (const card of cards) {
      assertSeparateAnchors(card);
      assert.match(card, /^<h3><a href="\/projects\/[^"]+\/">[^<]+<\/a><\/h3><div class="card-meta">/);
      assert.ok(card.indexOf('class="card-links"') === -1 || card.indexOf('class="card-links"') < card.indexOf('class="tag-list"'));
    }
  }

  assert.match(sections[0][2], /href="https:\/\/github.com\/HoraceCh\/Information-Retrieval-Tool" target="_blank" rel="noopener noreferrer"/);
  assert.match(sections[1][2], /href="\/notes\/ai-assisted-literature-workflow\/">Notes<\/a>/);
  assert.match(sections[1][2], /href="\/notes\/openvla-reading-template\/">Notes<\/a>/);
  assert.doesNotMatch(sections[0][2], /<span>in progress<\/span>/);
  assert.match(sections[1][2], /<span>learning system<\/span>/);
  assert.doesNotMatch(sections[2][2], /<span>planned<\/span>/);
});

test('Project details retain actions, distinct maturity, and supporting metadata', async () => {
  for (const [, hrefs] of projects) {
    for (const href of hrefs) {
      const html = await readFile(`dist${href}index.html`, 'utf8');
      const article = html.match(/<article class="article project-detail"[^>]*>([\s\S]*?)<\/article>/)?.[1];
      assert.ok(article, `${href} has a detail article`);
      assertSeparateAnchors(article);
      assert.ok(article.indexOf('type-project-entity-title') < article.indexOf('project-detail-state'));
      assert.ok(article.indexOf('project-detail-state') < article.indexOf('class="lead"'));
      assert.ok(article.indexOf('class="lead"') < article.indexOf('project-detail-context'));
      assert.match(article, /project-detail-context[^>]*>[\s\S]*?<span>Tools: [^<]+<\/span>/);
    }
  }

  const featured = await readFile('dist/projects/ai-retrieval-tool/index.html', 'utf8');
  assert.match(featured, /href="https:\/\/github.com\/HoraceCh\/Information-Retrieval-Tool" target="_blank" rel="noopener noreferrer">GitHub<\/a>/);
  assert.doesNotMatch(featured, /<span>in progress<\/span>/);

  const learning = await readFile('dist/projects/vla-embodied-ai-learning-system/index.html', 'utf8');
  assert.match(learning, /<span>learning system<\/span>/);
  assert.match(learning, /href="\/notes\/openvla-reading-template\/">Related Notes<\/a>/);
});
