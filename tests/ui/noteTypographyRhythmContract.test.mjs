import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

function extractRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing rule for ${selector}`);
  return match[1];
}

test('Notes typography keeps editorial roles local and within the HC-25 rhythm', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const root = extractRule(css, ':root');
  const noteArticle = extractRule(css, '.note-article');
  const title = extractRule(css, '.note-header h1');
  const lead = extractRule(css, '.note-header .lead');
  const prose = extractRule(css, '.note-prose');
  const proseHeadings = extractRule(css, '.note-prose :is(h1, h2, h3, h4)');
  const h2 = extractRule(css, '.note-prose h2');
  const h3 = extractRule(css, '.note-prose h3');
  const mobile = css.slice(css.indexOf('@media (max-width: 640px)'));

  assert.match(root, /--note-font-body:[\s\S]*Source Serif 4[\s\S]*Georgia[\s\S]*serif;/);
  assert.match(root, /--note-font-ui:[\s\S]*Inter[\s\S]*sans-serif;/);
  assert.match(root, /--note-font-mono:[\s\S]*JetBrains Mono[\s\S]*monospace;/);
  assert.match(noteArticle, /font-family:\s*var\(--note-font-ui\);/);
  assert.match(title, /font-family:\s*var\(--note-font-body\);[\s\S]*font-size:\s*clamp\(2\.625rem, 4\.5vw, 3rem\);[\s\S]*font-weight:\s*600;[\s\S]*line-height:\s*1\.15;/);
  assert.match(lead, /font-family:\s*var\(--note-font-body\);[\s\S]*font-size:\s*1\.0625rem;[\s\S]*line-height:\s*1\.65;/);
  assert.match(prose, /font-family:\s*var\(--note-font-body\);[\s\S]*font-size:\s*1rem;[\s\S]*line-height:\s*1\.72;/);
  assert.match(proseHeadings, /font-family:\s*var\(--note-font-body\);[\s\S]*font-weight:\s*600;[\s\S]*line-height:\s*1\.3;/);
  assert.match(h2, /margin-top:\s*2\.5rem;[\s\S]*border-top:\s*1px solid var\(--line\);[\s\S]*font-size:\s*clamp\(1\.5rem, 2\.2vw, 1\.625rem\);/);
  assert.match(h3, /font-size:\s*clamp\(1\.125rem, 1\.5vw, 1\.25rem\);/);
  assert.match(mobile, /\.note-header h1[\s\S]*font-size:\s*clamp\(2rem, 10vw, 2\.25rem\);/);
  assert.match(mobile, /\.note-prose h2[\s\S]*font-size:\s*clamp\(1\.375rem, 7vw, 1\.5rem\);/);
  assert.match(mobile, /\.note-prose h3[\s\S]*font-size:\s*1\.125rem;/);
  assert.match(css, /max-inline-size:\s*min\(100%, 70ch\);/);
  assert.match(css, /\.note-prose a\s*\{[\s\S]*overflow-wrap:\s*anywhere;/);
  assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body|h1|h2|h3|p)\s*\{[^}]*var\(--note-font-body\)/m);
});
