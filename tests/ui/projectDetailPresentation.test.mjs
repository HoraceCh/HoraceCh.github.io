import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';

const root = process.env.HC246_OUTPUT_ROOT ?? 'dist';
const cases = [
  ['ai-retrieval-tool', 'Public repository', 'https://github.com/HoraceCh/Information-Retrieval-Tool', 1311],
  ['robomaster-2026-engineering-robot', 'Team engineering repository', 'https://github.com/HoraceCh/26-EngBot', 800],
];

test('approved detail figures follow complete narrative and precede separately labeled evidence', async () => {
  for (const [id, label, url, height] of cases) {
    const html = await readFile(`${root}/projects/${id}/index.html`, 'utf8');
    const article = html.match(/<article class="article project-detail"[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article);
    assert.equal((article.match(/<figure\b/g) ?? []).length, 1);
    assert.ok(article.lastIndexOf('</p>', article.indexOf('class="project-figure"')) < article.indexOf('<figure'));
    assert.ok(article.indexOf('<figure') < article.indexOf('class="project-evidence"'));
    assert.match(article, new RegExp(`width="1200" height="${height}"`));
    assert.match(article, /loading="lazy" decoding="async"/);
    assert.match(article, /Open full-size image in new tab/);
    assert.ok(article.includes(label));
    assert.equal(article.split(`href="${url}"`).length - 1, 2, 'original resource and exact Evidence destination both remain');
    assert.match(article, /opens in new tab/);
    assert.match(article, /evidence-type[^>]*>repository</);
    assert.match(article, /project-figure[^>]*data-pagefind-ignore="all"/);
    assert.match(article, /project-evidence[^>]*data-pagefind-ignore="all"/);
    assert.doesNotMatch(article, /<figcaption|<script|astro-island/);
    const imageAnchor = [...article.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].find(([a]) => a.includes('Open full-size image in new tab'))?.[0];
    assert.ok(imageAnchor);
    assert.match(imageAnchor, /target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(imageAnchor, /<img/);
  }
});

test('auxiliary detail media cannot add automatic Pagefind image metadata or body text', async () => {
  const fragments = await readdir(`${root}/pagefind/fragment`);
  let found = 0;
  for (const file of fragments) {
    const decoded = gunzipSync(await readFile(`${root}/pagefind/fragment/${file}`)).toString();
    const record = JSON.parse(decoded.slice(decoded.indexOf('{')));
    if (!cases.some(([id]) => record.url === `/projects/${id}/`)) continue;
    found++;
    assert.equal(record.meta.image, undefined);
    assert.equal(record.meta.image_alt, undefined);
    assert.doesNotMatch(record.content, /Open full-size image in new tab|opens in new tab|Team engineering repository|Public repository/);
    assert.ok(record.anchors.every(anchor => anchor.text !== 'Evidence'));
  }
  assert.equal(found, 2);
});

test('text-only details omit absent figure and Evidence modules', async () => {
  for (const id of ['ai-assisted-learning-workflow', 'vla-embodied-ai-learning-system', 'mechanical-design-portfolio']) {
    const html = await readFile(`${root}/projects/${id}/index.html`, 'utf8');
    assert.doesNotMatch(html, /<figure\b|class="project-evidence"|<h2[^>]*>Evidence</);
  }
});
