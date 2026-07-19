import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const script = path.resolve('tools/sync-obsidian-notes.mjs');

async function runSync(cwd) {
  return execFileAsync(
    process.execPath,
    [script, '--source', 'source', '--out', 'out', '--assets', 'assets'],
    { cwd, encoding: 'utf8' },
  );
}

function descriptionOf(markdown) {
  return JSON.parse(markdown.match(/^description:\s*(.+)$/m)?.[1] ?? 'null');
}

test('sanitizes every description source and falls through embed-only candidates to prose', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'note-description-normalization-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'source'), { recursive: true });

  await writeFile(
    path.join(root, 'source', 'embed-only.md'),
    [
      '---',
      'description: "![[cover.png]]"',
      '---',
      '![[lead.png]]',
      '',
      '# Section heading is not a summary',
      '',
      'Readable **research prose** with a [[target|useful label]].',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(root, 'source', 'mixed.md'),
    [
      '---',
      'summary: "A mixed ![[diagram.png]] summary with [context](https://example.com)."',
      '---',
      'Body fallback should not replace explicit prose.',
      '',
    ].join('\n'),
  );
  await writeFile(path.join(root, 'source', 'empty.md'), '![[only-image.png]]\n');
  await writeFile(
    path.join(root, 'source', 'callout-table.md'),
    [
      '> [!abstract] Summary',
      '> Introductory prose.',
      '>',
      '> | Type | Use |',
      '> | --- | --- |',
      '> | struct | grouped data |',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(root, 'source', 'math-summary.md'),
    [
      '---',
      'description: "Ranges are $[0,1)$, $[a,b)$, and $[a,b]$."',
      '---',
      'Body fallback should not replace explicit prose.',
      '',
    ].join('\n'),
  );

  const firstRun = await runSync(root);
  assert.equal(firstRun.stderr, '');

  const embedOnly = await readFile(path.join(root, 'out', 'embed-only.md'), 'utf8');
  const mixed = await readFile(path.join(root, 'out', 'mixed.md'), 'utf8');
  const empty = await readFile(path.join(root, 'out', 'empty.md'), 'utf8');
  const calloutTable = await readFile(path.join(root, 'out', 'callout-table.md'), 'utf8');
  const mathSummary = await readFile(path.join(root, 'out', 'math-summary.md'), 'utf8');
  assert.equal(descriptionOf(embedOnly), 'Readable research prose with a useful label.');
  assert.equal(descriptionOf(mixed), 'A mixed summary with context.');
  assert.equal(descriptionOf(empty), 'Working note synced from Obsidian Publish.');
  assert.equal(descriptionOf(calloutTable), 'Summary Introductory prose. Type Use struct grouped data');
  assert.equal(descriptionOf(mathSummary), 'Ranges are [0,1), [a,b), and [a,b].');

  for (const markdown of [embedOnly, mixed, empty, calloutTable, mathSummary]) {
    assert.doesNotMatch(descriptionOf(markdown), /!\[\[|\]\]|\[[^\]]+]\(|(?:^|\s)>|\||\$/);
  }

  const secondRun = await runSync(root);
  assert.match(secondRun.stdout, /unchanged out\/embed-only\.md/);
  assert.match(secondRun.stdout, /unchanged out\/mixed\.md/);
  assert.match(secondRun.stdout, /unchanged out\/empty\.md/);
  assert.match(secondRun.stdout, /unchanged out\/callout-table\.md/);
  assert.match(secondRun.stdout, /unchanged out\/math-summary\.md/);
});
