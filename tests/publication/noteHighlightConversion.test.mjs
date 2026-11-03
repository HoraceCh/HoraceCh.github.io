import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const script = path.resolve('tools/sync-obsidian-notes.mjs');
const cases = [
  ['inline HTML opening before table', 'Intro <code>\n| op | val |\n| --- | --- |\n| ==literal== | ==literal== |\n</code> ==After==', 'Intro <code>\n| op | val |\n| --- | --- |\n| ==literal== | ==literal== |\n</code> <mark>After</mark>'],
  ['HTML tag inside backtick span', 'Intro `<code>`\n\n| op | val |\n| --- | --- |\n| ==literal== | ==literal== |', 'Intro `<code>`\n\n| op | val |\n| --- | --- |\n| <mark>literal</mark> | <mark>literal</mark> |'],
  ['HTML block containing table syntax', '<pre>\n| op | val |\n| --- | --- |\n| ==literal== | ==literal== |\n</pre>\n\n==After==', '<pre>\n| op | val |\n| --- | --- |\n| ==literal== | ==literal== |\n</pre>\n\n<mark>After</mark>'],
  ['HTML block containing fence syntax', '<pre>\n~~~\n==literal==\n~~~\n==still literal==\n</pre> ==After==', '<pre>\n~~~\n==literal==\n~~~\n==still literal==\n</pre> <mark>After</mark>'],
  ['table ends before fenced code', '| A | B |\n| --- | --- |\n| text | text |\n\n~~~c\na == b\n~~~\n\n==Alpha | Beta==', '| A | B |\n| --- | --- |\n| text | text |\n\n~~~c\na == b\n~~~\n\n<mark>Alpha | Beta</mark>'],
  ['bare table operators', '| operator | example |\n| --- | --- |\n| == | A == B |\n| != | A != B |\n\n==Valid==', '| operator | example |\n| --- | --- |\n| == | A == B |\n| != | A != B |\n\n<mark>Valid</mark>'],
  ['operators across table rows', '| Code | Meaning |\n| --- | --- |\n| A == B | equal |\n| C == D | ==equal== |', '| Code | Meaning |\n| --- | --- |\n| A == B | equal |\n| C == D | <mark>equal</mark> |'],
  ['escaped table pipe', '| A | B |\n| --- | --- |\n| ==Alpha \\| Beta== | prose |', '| A | B |\n| --- | --- |\n| <mark>Alpha \\| Beta</mark> | prose |'],
  ['pipe in ordinary prose', '==Alpha | Beta==', '<mark>Alpha | Beta</mark>'],
  ['single character highlights', '| Any | ==\u6216== |\n| All | ==\u4e0e== |', '| Any | <mark>\u6216</mark> |\n| All | <mark>\u4e0e</mark> |'],
  ['paragraph continuation', 'Paragraph\n    ==highlight==', 'Paragraph\n    <mark>highlight</mark>'],
  ['fenced comparisons', '```c\nif (a == b) {}\nif (c == d) {}\n```', '```c\nif (a == b) {}\nif (c == d) {}\n```'],
  ['separate fences', '```c\nif (a == b) {}\n```\n\nProse.\n\n```c\nif (c == d) {}\n```', '```c\nif (a == b) {}\n```\n\nProse.\n\n```c\nif (c == d) {}\n```'],
  ['inline and adjacent prose', '==Before== `a == b && c == d` ==after==', '<mark>Before</mark> `a == b && c == d` <mark>after</mark>'],
  ['table code', '| Code | Meaning |\n| --- | --- |\n| `p1 == p2` | ==equal== |\n| `p3 == p4` | other |', '| Code | Meaning |\n| --- | --- |\n| `p1 == p2` | <mark>equal</mark> |\n| `p3 == p4` | other |'],
  ['long tilde fence', '~~~~C title="sample"\na == b\n~~~\nc == d\n~~~~~\n==After==', '~~~~c title="sample"\na == b\n~~~\nc == d\n~~~~~\n<mark>After</mark>'],
  ['long backtick fence', '````Cpp\na == b\n```\nc == d\n`````\n==After==', '````cpp\na == b\n```\nc == d\n`````\n<mark>After</mark>'],
  ['nested callout fence', '> [!TIP]\n> > ~~~C\n> > a == b\n> > c == d\n> > ~~~\n\n==After==', '> **TIP**\n> > ~~~c\n> > a == b\n> > c == d\n> > ~~~\n\n<mark>After</mark>'],
  ['backticks inside code span', '==Before== ``a `tick` == b && c == d`` ==after==', '<mark>Before</mark> ``a `tick` == b && c == d`` <mark>after</mark>'],
  ['unequal backtick runs', '``a ``` == b && c == d`` ==after==', '``a ``` == b && c == d`` <mark>after</mark>'],
  ['multiline code span', '`a == b\nc == d`\n\n==After==', '`a == b\nc == d`\n\n<mark>After</mark>'],
  ['unclosed fence', '~~~c\na == b\nc == d\n==still code==', '~~~c\na == b\nc == d\n==still code=='],
  ['quote boundary closes fence', '> ~~~c\n> a == b && c == d\n\n==After==', '> ~~~c\n> a == b && c == d\n\n<mark>After</mark>'],
  ['unmatched inline delimiter is prose', '`unclosed ==highlight==', '`unclosed <mark>highlight</mark>'],
  ['multiline prose', '==highlight\non two lines==', '<mark>highlight\non two lines</mark>'],
  ['no highlight across code', '==before\n```c\na == b\n```\nafter==', '==before\n```c\na == b\n```\nafter=='],
  ['HTML code literals', '<pre><code>a == b\nc == d</code></pre>\n\n<code>a == b && c == d</code> ==after==', '<pre><code>a == b\nc == d</code></pre>\n\n<code>a == b && c == d</code> <mark>after</mark>'],
  ['unclosed HTML code', '<pre>\na == b\nc == d', '<pre>\na == b\nc == d'],
  ['indented code', 'Code:\n\n    a == b\n    c == d\n\n==After==', 'Code:\n\n    a == b\n    c == d\n\n<mark>After</mark>'],
  ['callout and link prose', '> [!NOTE] ==Title==\n> ==Body== [link](https://example.com)', '> **NOTE: <mark>Title</mark>**\n> <mark>Body</mark> [link](https://example.com)'],
];

for (const [name, input, expected] of cases) {
  test(`highlight conversion preserves ${name}`, async (t) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'note-highlight-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, 'source'));
    await writeFile(path.join(root, 'source', 'example.md'), `${input}\n`);
    const args = [script, '--source', 'source', '--out', 'out', '--assets', 'assets'];
    await run(process.execPath, [...args, '--dry-run'], { cwd: root });
    assert.deepEqual((await readdir(root)).sort(), ['source']);
    await run(process.execPath, args, { cwd: root });
    const output = await readFile(path.join(root, 'out', 'example.md'), 'utf8');
    const body = output.split('Do not edit by hand. -->\n\n')[1];
    assert.equal(body.trimEnd(), expected, `input:\n${input}`);
  });
}
