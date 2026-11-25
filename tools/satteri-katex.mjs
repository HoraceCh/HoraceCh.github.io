import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { fromHtml } from 'hast-util-from-html';

export const katexOptions = Object.freeze({
  output: 'htmlAndMathml', trust: false, throwOnError: true,
  strict: 'warn', maxExpand: 1000, maxSize: 20,
  // Reserved for legacy source compatibility; each expression gets its own macro table.
  macros: Object.freeze({ '\\textless': '\\lt' }),
});
const key = 'horaceMath';
const tag = 'horace-math-placeholder';

function preserve(node, ctx) {
  const expressions = ctx.data[key] ??= [];
  const offset = node.position.start.offset;
  const display = node.type === 'math' ||
    Buffer.from(ctx.source).subarray(offset, offset + 2).toString() === '$$';
  const id = String(expressions.length);
  expressions.push({ tex: node.value, display, position: node.position });
  ctx.replaceNode(node, {
    type: 'inlineCode', value: '',
    data: { hName: tag, hProperties: { 'data-horace-math-id': id } },
  });
}
function guardHeading(heading, ctx) {
  function findMath(node) {
    if (node.type === 'math' || node.type === 'inlineMath') return node;
    for (const child of node.children ?? []) {
      const math = findMath(child);
      if (math) return math;
    }
  }
  const math = findMath(heading);
  if (!math) return;
  const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '<unknown Markdown>';
  const { line, column } = math.position.start;
  throw new Error(file + ':' + line + ':' + column + ': Math in headings is unsupported. Move the formula into the note body.');
}

export const mathMdast = {
  name: 'horace-math-preserve', heading: guardHeading, math: preserve, inlineMath: preserve,
};

export function renderExpression(expression, fileURL) {
  try {
    const denied = expression.tex.match(/\\(?:href|url|includegraphics|htmlClass|htmlId|htmlStyle|htmlData)\b/g);
    if (denied) throw new Error('Untrusted TeX command denied: ' + [...new Set(denied)].join(', '));
    return katex.renderToString(expression.tex, {
      ...katexOptions, macros: { ...katexOptions.macros }, displayMode: expression.display,
    });
  } catch (cause) {
    const file = fileURL ? fileURLToPath(fileURL) : '<unknown Markdown>';
    const { line, column } = expression.position.start;
    throw new Error(file + ':' + line + ':' + column + ': KaTeX: ' +
      JSON.stringify(expression.tex) + ': ' + cause.message, { cause });
  }
}
export const mathHast = {
  name: 'horace-math-render',
  element: {
    filter: [tag],
    visit(node, ctx) {
      const id = node.properties['data-horace-math-id'];
      const expression = ctx.data[key]?.[Number(id)];
      if (!expression || String(Number(id)) !== id) throw new Error('Invalid math placeholder');
      const html = renderExpression(expression, ctx.fileURL);
      const children = fromHtml(html, { fragment: true }).children;
      function excludeDuplicates(item) {
        if (item.type !== 'element') return;
        if (item.tagName === 'annotation' || item.properties.className?.includes('katex-html')) {
          item.properties['data-pagefind-ignore'] = '';
        }
        item.children.forEach(excludeDuplicates);
      }
      children.forEach(excludeDuplicates);
      ctx.replaceNode(node, {
        type: 'element', tagName: 'span',
        properties: {
          className: [expression.display ? 'horace-math-display' : 'horace-math-inline'],
          ...(expression.display ? { tabIndex: 0, role: 'group', ariaLabel: 'Scrollable mathematical equation' } : {}),
        },
        children,
      });
    },
  },
};
