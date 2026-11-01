import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile('dist/contact/index.html', 'utf8');
const article = html.match(/<article class="identity-page contact-page">([\s\S]*?)<\/article>/)?.[1];
const text = value => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

test('Contact exposes only the approved native email and GitHub endpoints in priority order', () => {
  assert.ok(article);
  assert.deepEqual([...article.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)].map(([,attrs,label]) => {
    assert.doesNotMatch(attrs, /target=|download|onclick|role=|tabindex=/i);
    return [attrs.match(/href="([^"]+)"/)?.[1], text(label)];
  }), [
    ['mailto:horacebuddle@gmail.com', 'horacebuddle@gmail.com'],
    ['https://github.com/HoraceCh', 'GitHub · HoraceCh'],
  ]);
  assert.doesNotMatch(article, /<form|<input|<button|<script|astro-island|LinkedIn|Personal site|href="\/contact\//i);
});

test('Contact retains exact C2 reading hierarchy and identity without prototype chrome', () => {
  assert.deepEqual([...article.matchAll(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/g)].map(([,level,label]) => [level,text(label)]), [['1','Let’s talk.'],['2','Email'],['2','GitHub']]);
  assert.deepEqual([...article.matchAll(/<p\b[^>]*>(.*?)<\/p>/g)].map(([,value]) => text(value)), [
    'Contact',
    'I’m HAO CHEN (Horace Chan). For project discussions, research-learning exchanges, or internship conversations, email is the most direct way to reach me.',
    'Project, research-learning, and internship conversations.',
    'Public code and project context.',
    'A short introduction, your topic, and a relevant link are helpful.',
  ]);
  assert.doesNotMatch(html, /review-status|NON-PRODUCTION PROPOSAL|noindex,nofollow/);
  assert.match(html, /<title>Contact \| Horace Chan<\/title>/);
  const descriptions = [...html.matchAll(/<meta (?:name="(?:description|twitter:description)"|property="og:description") content="([^"]*)"/g)].map(([,value]) => value);
  assert.deepEqual(descriptions, Array(3).fill('Email and GitHub contact links for HAO CHEN (Horace Chan).'));
  assert.match(html, /rel="canonical" href="https:\/\/horacech.github.io\/contact\/"/);
});

test('Contact preserves page-local wrapping and visible focus without a runtime or global style override', async () => {
  const source = await readFile('src/pages/contact.astro', 'utf8');
  const css = await readFile('src/styles/contact-v3.css', 'utf8');
  assert.match(source, /import Layout from/);
  assert.doesNotMatch(source, /<script|on:|client:|preventDefault/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /a:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--accent\);[^}]*outline-offset:\s*4px/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /(?:^|[;{]\s*)(?:outline:\s*(?:none|0)|animation:|transform:|zoom:)|@keyframes/m);
  const global = await readFile('src/styles/global.css', 'utf8');
  assert.match(global, /a\[href\]:focus-visible,[\s\S]*?summary:focus-visible\s*\)\s*\{\s*border-radius:\s*4px/);
});
