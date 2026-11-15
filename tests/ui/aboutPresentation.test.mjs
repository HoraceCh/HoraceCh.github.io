import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile('dist/about/index.html', 'utf8');
const article = html.match(/<article class="identity-page about-page">([\s\S]*?)<\/article>/)?.[1];
const text = value => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

test('About preserves approved identity, personal contribution, and learning boundaries in reading order', () => {
  assert.ok(article);
  const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, value]) => text(value));
  assert.deepEqual(paragraphs, ["About","I’m HAO CHEN (Horace Chan), a Robotics Engineering undergraduate. My engineering experience includes mechanical design and robot integration.","As a core team member on the RoboMaster 2026 engineering robot, I contributed to wheel design, assembly, and robot integration.","Read the project","I am studying embodied AI, Vision-Language-Action models, and robot control. I am interested in AI-assisted workflows for paper reading, academic retrieval, and organizing technical notes.","I use this site to document projects, technical notes, and learning as the work develops.","For project discussions or learning exchanges, get in touch."]);
  assert.deepEqual([...article.matchAll(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/g)].map(([,level,value]) => [level,text(value)]), [['1',"Engineering background, research direction."]]);
  assert.doesNotMatch(article, /<script|astro-island|<iframe|<form/);
});

test('About keeps six native contextual anchors including the intentional project repetition', () => {
  const anchors = [...article.matchAll(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map(([,href,label]) => ({label:text(label),href}));
  assert.deepEqual(anchors, [{"label":"RoboMaster 2026 engineering robot","href":"/projects/robomaster-2026-engineering-robot/"},{"label":"Read the project","href":"/projects/robomaster-2026-engineering-robot/"},{"label":"RoboMaster 2026 engineering robot","href":"/projects/robomaster-2026-engineering-robot/"},{"label":"AI_RETRIEVAL_X / Information-Retrieval-Tool","href":"/projects/ai-retrieval-tool/"},{"label":"Learning notes","href":"/notes/"},{"label":"get in touch","href":"/contact/"}]);
  assert.match(article, /<nav class="context-links" aria-label="Work and learning">/);
});

test('About metadata identifies the approved current major consistently', () => {
  assert.match(html, /<title>About \| Horace Chan<\/title>/);
  const descriptions = [...html.matchAll(/<meta (?:name="(?:description|twitter:description)"|property="og:description") content="([^"]*)"/g)].map(([,value]) => value);
  assert.deepEqual(descriptions, Array(3).fill("HAO CHEN (Horace Chan): Robotics Engineering background, engineering contributions, and current learning in robotics and embodied AI."));
  assert.match(html, /rel="canonical" href="https:\/\/horacech.github.io\/about\/"/);
});
