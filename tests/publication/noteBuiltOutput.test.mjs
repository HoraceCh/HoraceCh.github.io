import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function noteHtml(slug) {
  return readFile(path.resolve('dist/notes', slug, 'index.html'), 'utf8');
}

async function collectNoteHtml(directory = path.resolve('dist/notes')) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectNoteHtml(target));
    else if (entry.name === 'index.html') files.push(target);
  }
  return files;
}

function idsOf(html) {
  return Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => decodeURIComponent(match[1]));
}

function attributeOf(tag, name) {
  return tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find(Boolean);
}

test('every built local Note asset image reserves positive intrinsic geometry', async () => {
  const files = await collectNoteHtml();
  let localImageCount = 0;

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const src = attributeOf(tag, 'src');
      if (!src?.startsWith('/notes-assets/')) continue;
      localImageCount += 1;
      const width = Number(attributeOf(tag, 'width'));
      const height = Number(attributeOf(tag, 'height'));
      assert.ok(Number.isInteger(width) && width > 0, `${file}: missing positive width on ${src}`);
      assert.ok(Number.isInteger(height) && height > 0, `${file}: missing positive height on ${src}`);
    }
  }

  assert.ok(localImageCount > 0, 'expected at least one built /notes-assets/ image');
});

test('five structurally distinct Notes keep language, heading, and clean-reader contracts', async () => {
  const expectations = new Map([
    ['c-pointers', 'zh-CN'],
    ['c-arrays', 'zh-CN'],
    ['tree-binary-tree', 'zh-CN'],
    ['004', 'zh-CN'],
    ['ai-assisted-literature-workflow', 'en'],
  ]);

  for (const [slug, language] of expectations) {
    const html = await noteHtml(slug);
    const ids = idsOf(html);
    const readerText = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<[^>]+>/g, ' ');
    assert.match(html, new RegExp(`<html lang="${language}"`), slug);
    assert.match(html, new RegExp(`<article[^>]+lang="${language}"`), slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug);
    assert.equal(ids.length, new Set(ids).size, slug);
    assert.doesNotMatch(readerText, /\[![A-Z]+\]|(?:ATTENTION|EXAMPLE):\s*&gt;/, slug);
  }

  assert.match(await readFile(path.resolve('dist/index.html'), 'utf8'), /<html lang="en"/);
});

test('built Note fragments and 004 summary metadata resolve without Obsidian markup', async () => {
  const files = await collectNoteHtml();
  const htmlByFile = new Map(await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])));

  for (const [file, html] of htmlByFile) {
    const ownIds = new Set(idsOf(html));
    for (const match of html.matchAll(/href="((?:\/notes\/([^"#?]+)\/)?#([^"]*))"/g)) {
      let targetIds = ownIds;
      if (match[2]) {
        const targetFile = path.resolve('dist/notes', match[2], 'index.html');
        assert.ok(htmlByFile.has(targetFile), `${file}: ${match[1]}`);
        targetIds = new Set(idsOf(htmlByFile.get(targetFile)));
      }
      const fragment = decodeURIComponent(match[3]);
      assert.ok(fragment && targetIds.has(fragment), `${file}: ${match[1]}`);
    }
  }

  const detail = await noteHtml('004');
  const index = await readFile(path.resolve('dist/notes/index.html'), 'utf8');
  const descriptions = [
    detail.match(/<meta name="description" content="([^"]*)"/)?.[1],
    detail.match(/<meta property="og:description" content="([^"]*)"/)?.[1],
    detail.match(/<meta name="twitter:description" content="([^"]*)"/)?.[1],
  ];
  assert.ok(descriptions.every(Boolean));
  assert.equal(new Set(descriptions).size, 1);
  assert.doesNotMatch(descriptions[0], /!\[\[|\]\]/);
  assert.doesNotMatch(detail, /!\[\[ScienceDirect/);
  assert.doesNotMatch(index, /!\[\[ScienceDirect/);
});
