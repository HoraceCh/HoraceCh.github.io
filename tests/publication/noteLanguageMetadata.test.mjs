import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const script = path.resolve('tools/sync-obsidian-notes.mjs');

async function runSync(cwd, extraArgs = []) {
  return execFileAsync(
    process.execPath,
    [script, '--source', 'source', '--out', 'out', '--assets', 'assets', ...extraArgs],
    { cwd, encoding: 'utf8' },
  );
}

function languageOf(markdown) {
  return JSON.parse(markdown.match(/^language:\s*(.+)$/m)?.[1] ?? 'null');
}

test('emits constrained language metadata with conservative English fallback', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'note-language-metadata-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'source'), { recursive: true });

  await writeFile(
    path.join(root, 'source', 'chinese.md'),
    '# 指针基础\n\n这是一篇以中文为主的学习笔记，介绍指针变量、内存地址、数组访问以及函数参数之间的关系。\n',
  );
  await writeFile(
    path.join(root, 'source', 'english.md'),
    '# Retrieval workflow\n\nA concise English note about retrieval, evidence, and reproducible research.\n',
  );
  await writeFile(
    path.join(root, 'source', 'api-heavy-chinese.md'),
    [
      '# Python 标准库',
      '',
      '这是一篇以中文叙述为主的学习笔记，说明随机数函数的用途、返回范围、参数含义以及常见使用方式。',
      '常用接口包括 random.random、random.uniform、random.randint、random.randrange、numpy.ndarray、pandas.DataFrame 和 matplotlib.pyplot。',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(root, 'source', 'explicit.md'),
    ['---', 'lang: zh-Hans', '---', '# Explicit override', '', 'English body with an explicit language declaration.', ''].join('\n'),
  );
  await writeFile(
    path.join(root, 'source', 'explicit-english.md'),
    ['---', 'language: en-US', '---', '# 显式英文', '', '即使正文主要使用中文，显式语言设置仍然必须保持最高优先级。', ''].join('\n'),
  );

  const firstRun = await runSync(root);
  assert.match(firstRun.stdout, /Warnings: none/);
  assert.equal(languageOf(await readFile(path.join(root, 'out', 'chinese.md'), 'utf8')), 'zh-CN');
  assert.equal(languageOf(await readFile(path.join(root, 'out', 'api-heavy-chinese.md'), 'utf8')), 'zh-CN');
  assert.equal(languageOf(await readFile(path.join(root, 'out', 'english.md'), 'utf8')), 'en');
  assert.equal(languageOf(await readFile(path.join(root, 'out', 'explicit.md'), 'utf8')), 'zh-CN');
  assert.equal(languageOf(await readFile(path.join(root, 'out', 'explicit-english.md'), 'utf8')), 'en');

  const englishPath = path.join(root, 'out', 'english.md');
  const stableDatedEnglish = (await readFile(englishPath, 'utf8')).replace(/^date:.*$/m, 'date: 2020-01-02');
  await writeFile(englishPath, stableDatedEnglish);
  const secondRun = await runSync(root);
  assert.match(secondRun.stdout, /unchanged out\/chinese\.md/);
  assert.match(secondRun.stdout, /unchanged out\/api-heavy-chinese\.md/);
  assert.match(secondRun.stdout, /unchanged out\/english\.md/);
  assert.match(secondRun.stdout, /unchanged out\/explicit\.md/);
  assert.match(secondRun.stdout, /unchanged out\/explicit-english\.md/);
  assert.match(await readFile(englishPath, 'utf8'), /^date: 2020-01-02$/m);
});

test('schema and Note integration pass language to document and article semantics', async () => {
  const [schema, layout, notePage] = await Promise.all([
    readFile(path.resolve('src/content.config.ts'), 'utf8'),
    readFile(path.resolve('src/layouts/Layout.astro'), 'utf8'),
    readFile(path.resolve('src/pages/notes/[slug].astro'), 'utf8'),
  ]);

  assert.match(schema, /language:\s*z\.enum\(\['en', 'zh-CN'\]\)\.default\('en'\)/);
  assert.match(layout, /lang\?: 'en' \| 'zh-CN'/);
  assert.match(layout, /<html lang=\{lang\}>/);
  assert.match(notePage, /<Layout[^>]+lang=\{note\.data\.language\}/);
  assert.match(notePage, /<article[^>]+lang=\{note\.data\.language\}/);
});
