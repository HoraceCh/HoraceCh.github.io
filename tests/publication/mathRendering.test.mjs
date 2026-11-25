import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { markdownToHtml } from 'satteri';
import { mathMdast, mathHast } from '../../tools/satteri-katex.mjs';

const fixtures = JSON.parse(readFileSync(new URL('../fixtures/math-rendering-r1.json', import.meta.url), 'utf8'));
const fileURL = new URL('../fixtures/math-rendering-r1.md', import.meta.url);
const render = (markdown) => markdownToHtml(markdown, {
  fileURL,
  features: { math: { singleDollarTextMath: true } },
  mdastPlugins: [mathMdast],
  hastPlugins: [mathHast],
}).html;

const sourceFormulas = fixtures.filter(({ name }) => /:\d+$/.test(name));

test('all 98 Publish formulas produce visual HTML and accessible MathML', async (t) => {
  assert.equal(sourceFormulas.length, 98);
  for (const { name, markdown } of sourceFormulas) {
    await t.test(name, () => {
      const html = render(markdown);
      assert.match(html, /class="katex-html"/);
      assert.match(html, /class="katex-mathml"/);
      assert.match(html, /<math\b/);
      const mode = markdown.startsWith('$$') ? 'display' : 'inline';
      assert.match(html, new RegExp('class="horace-math-' + mode + '"'));
    });
  }
});

test('the reserved textless command renders as a less-than relation', () => {
  const withoutSource = (html) => html.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g, '');
  assert.equal(withoutSource(render('$a \\textless b$')), withoutSource(render('$a \\lt b$')));
  assert.throws(() => render('$\\newcommand{\\textless}{X}\\textless$'), /KaTeX:.*textless/);
});

test('macro definitions remain local to each formula, including in a single document', () => {
  assert.match(render('$\\gdef\\rOneMacro{Z}\\rOneMacro$'), /<mi>Z<\/mi>/);
  assert.throws(
    () => render('$\\gdef\\rOneMacro{Z}\\rOneMacro$ then $\\rOneMacro$'),
    /KaTeX:.*Undefined control sequence/,
  );
});

test('invalid commands fail with the Markdown file, line and column', () => {
  assert.throws(
    () => render('First paragraph.\n\nBefore $\\notARealCommand{x}$'),
    /math-rendering-r1\.md:3:8: KaTeX:.*Undefined control sequence/,
  );
});

test('commands that load resources or authorize HTML remain denied', () => {
  for (const command of [
    '\\href{https://example.invalid}{x}',
    '\\url{https://example.invalid}',
    '\\includegraphics{https://example.invalid/image.png}',
    '\\htmlClass{example}{x}',
  ]) {
    assert.throws(() => render('$' + command + '$'), /math-rendering-r1\.md:1:1: KaTeX:.*denied/);
  }
});

test('literal dollars and code stay outside the math renderer', () => {
  const cases = fixtures.filter(({ name }) =>
    name.startsWith('literal ') || ['escaped dollars', 'unmatched', 'inline code', 'fenced code'].includes(name),
  );
  assert.equal(cases.length, 6);
  for (const { name, markdown } of cases) {
    const html = render(markdown);
    assert.doesNotMatch(html, /katex|<math\b/, name);
    assert.match(html, /\$/, name);
    if (name.endsWith('code')) assert.match(html, /<code\b/, name);
  }
});

test('math in headings fails before incorrect heading metadata can be emitted', () => {
  assert.throws(() => render('## Heading $x^2$'), /math-rendering-r1\.md:1:12: Math in headings is unsupported/);
  assert.throws(() => render('### Heading **$x^2$**'), /Math in headings is unsupported/);
  assert.match(render('## Heading with code \u0060$x$\u0060'), /<h2\b.*<code>\$x\$<\/code>/);
});
