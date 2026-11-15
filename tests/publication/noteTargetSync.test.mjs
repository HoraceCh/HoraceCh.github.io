import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const script = path.resolve('tools/sync-obsidian-notes.mjs');
const manifest = 'assets/.obsidian-notes-sync-manifest.json';
const note = (slug, body) => `---\ntitle: ${slug}\nslug: ${slug}\ndate: 2026-01-01\n---\n${body}\n`;
async function sync(root, args = []) {
  return run(process.execPath, [script, '--source', 'source', '--out', 'out', '--assets', 'assets', ...args], { cwd: root });
}
async function snapshot(root) {
  const files = {};
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) await walk(file);
      else files[path.relative(root, file)] = (await readFile(file)).toString('base64');
    }
  }
  await walk(root);
  return files;
}
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'note-target-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'source/group'), { recursive: true });
  await writeFile(path.join(root, 'source/group/a.md'), note('a', '# Alpha\n\n![image](a.png)'));
  await writeFile(path.join(root, 'source/group/a.png'), 'a image');
  await writeFile(path.join(root, 'source/b.md'), note('b', '# Beta\n\n![image](b.png)\n\n## Shared Heading'));
  await writeFile(path.join(root, 'source/b.png'), 'b image');
  await sync(root);
  return root;
}

test('target updates one note and preserves unrelated bytes, assets, manifest metadata and order', async t => {
  const root = await fixture(t);
  const old = await snapshot(root);
  const m = JSON.parse(await readFile(path.join(root, manifest), 'utf8'));
  m.extra = { retained: true }; m.noteRecords[1].extra = 'retained record';
  await writeFile(path.join(root, manifest), JSON.stringify(m, null, 2) + '\n');
  const manifestBefore = await readFile(path.join(root, manifest), 'utf8');
  await writeFile(path.join(root, 'source/group/a.md'), note('a', '# Updated\n\n![image](a.png)\n\n[[b#Shared Heading]]'));
  const result = await sync(root, ['--target', 'group\\a.md']);
  const next = await snapshot(root);
  for (const p of Object.keys(old).filter(p => p.startsWith('out') && p !== path.join('out','a.md') || p.startsWith('assets') && p !== path.normalize(manifest))) assert.equal(next[p], old[p], p);
  assert.equal(await readFile(path.join(root, manifest), 'utf8'), manifestBefore);
  assert.match(await readFile(path.join(root, 'out/a.md'), 'utf8'), /\/notes\/b\/#shared-heading/);
  assert.match(result.stdout, /unchanged assets\//);
  const before = await snapshot(root);
  await sync(root, ['--target', 'group/a.md']);
  assert.deepEqual(await snapshot(root), before, 'second target sync is byte-idempotent');
});

test('dry-run has zero mutations including target cleanup and manifest migration', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'source/group/a.md'), note('renamed', '# Changed'));
  const before = await snapshot(root);
  const result = await sync(root, ['--target', 'group/a.md', '--dry-run']);
  assert.deepEqual(await snapshot(root), before);
  assert.match(result.stdout, /would remove out\/a.md/);
  assert.match(result.stdout, /would write out\/renamed.md/);
});

test('slug migration removes only manifest-owned previous output and assets', async t => {
  const root = await fixture(t);
  const other = await readFile(path.join(root, 'out/b.md'));
  await writeFile(path.join(root, 'assets/a/untracked.txt'), 'keep unknown file');
  await writeFile(path.join(root, 'source/group/a.md'), note('renamed', '# Changed'));
  await sync(root, ['--target', 'group/a.md']);
  await assert.rejects(readFile(path.join(root, 'out/a.md')), { code: 'ENOENT' });
  await assert.rejects(readFile(path.join(root, 'assets/a/a.png')), { code: 'ENOENT' });
  assert.equal(await readFile(path.join(root, 'assets/a/untracked.txt'), 'utf8'), 'keep unknown file');
  assert.deepEqual(await readFile(path.join(root, 'out/b.md')), other);
  assert.equal(await readFile(path.join(root, 'assets/b/b.png'), 'utf8'), 'b image');
  const m = JSON.parse(await readFile(path.join(root, manifest), 'utf8'));
  assert.equal(m.noteRecords.length, 2);
  assert.deepEqual(m.notes, ['out/b.md','out/renamed.md']);
  assert.deepEqual(m.assets, ['assets/b/b.png']);
});

for (const place of ['previous', 'destination']) test(`unmarked ${place} output fails before any mutation`, async t => {
  const root = await fixture(t);
  if (place === 'destination') await writeFile(path.join(root, 'source/group/a.md'), note('renamed', '# Changed'));
  await writeFile(path.join(root, place === 'previous' ? 'out/a.md' : 'out/renamed.md'), '# Hand-written\n');
  const before = await snapshot(root);
  await assert.rejects(sync(root, ['--target','group/a.md']), /ownership|generated|hand-written/i);
  assert.deepEqual(await snapshot(root), before);
});

for (const kind of ['missing','invalid-json','wrong-shape','duplicate-source','unsafe-output','asset-outside']) test(`target fails closed on ${kind} manifest`, async t => {
  const root = await fixture(t);
  const file = path.join(root,manifest);
  const m = JSON.parse(await readFile(file,'utf8'));
  if (kind === 'missing') await rm(file);
  else if (kind === 'invalid-json') await writeFile(file,'{bad');
  else {
    if (kind === 'wrong-shape') m.noteRecords = {};
    if (kind === 'duplicate-source') m.noteRecords[1].sourcePath = m.noteRecords[0].sourcePath;
    if (kind === 'unsafe-output') m.noteRecords[0].output = '../outside.md';
    if (kind === 'asset-outside') m.assets.push('../outside.png');
    await writeFile(file, JSON.stringify(m));
  }
  const before = await snapshot(root);
  await assert.rejects(sync(root,['--target','group/a.md']), /manifest|ownership/i);
  assert.deepEqual(await snapshot(root),before);
});

test('new target can initialize an empty output collection without a manifest', async t => {
  const root=await fixture(t);
  await rm(path.join(root,'out'),{recursive:true}); await rm(path.join(root,'assets'),{recursive:true});
  await sync(root,['--target','group/a.md']);
  const m=JSON.parse(await readFile(path.join(root,manifest),'utf8'));
  assert.deepEqual(m.notes,['out/a.md']); assert.equal(m.noteRecords.length,1);
});

for (const target of ['../b.md','/b.md','C:\\b.md','C:b.md','group/../b.md','group//a.md','a.md','missing.md','.hidden.md','private/a.md','00 RAW LIST.md','AGENTS.override.md','draft.md','template.md']) test(`rejects unsafe, ineligible or inexact target ${target}`, async t => {
  const root=await fixture(t);
  if (['.hidden.md','00 RAW LIST.md','AGENTS.override.md','draft.md','template.md'].includes(target)) await writeFile(path.join(root,'source',target),note('x','# Private'));
  const before=await snapshot(root);
  await assert.rejects(sync(root,['--target',target]), /target|eligible|relative/i);
  assert.deepEqual(await snapshot(root),before);
});

test('rejects frontmatter draft and publish false targets', async t => {
  const root=await fixture(t);
  for (const field of ['publish: false','draft: true']) {
    await writeFile(path.join(root,'source/group/a.md'),`---\n${field}\n---\n# Hidden\n`);
    const before=await snapshot(root);
    await assert.rejects(sync(root,['--target','group/a.md']),/eligible|target/i);
    assert.deepEqual(await snapshot(root),before);
  }
});

test('rejects duplicate target and clean with target', async t => {
  const root=await fixture(t);
  for (const args of [['--target','group/a.md','--target','b.md'],['--clean','--target','group/a.md']]) {
    const before=await snapshot(root);
    await assert.rejects(sync(root,args),/target|clean/i);
    assert.deepEqual(await snapshot(root),before);
  }
});

test('rejects target symlink escape', async t => {
  const root=await fixture(t);
  await mkdir(path.join(root,'outside'));
  await writeFile(path.join(root,'outside/escape.md'),note('escape','# Outside source'));
  await symlink(path.join(root,'outside'),path.join(root,'source/linked'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(sync(root,['--target','linked/escape.md']),/target|eligible|symlink/i);
});

test('full index still disambiguates colliding slugs during a targeted update', async t => {
  const root=await fixture(t);
  await writeFile(path.join(root,'source/other.md'),note('a','# Other'));
  await sync(root,['--target','group/a.md']);
  const m=JSON.parse(await readFile(path.join(root,manifest),'utf8'));
  assert.equal(m.noteRecords.find(r=>r.sourcePath==='group/a.md').slug,'group-a');
});

test('missing target assets cannot trigger removal of previously owned assets', async t => {
  const root=await fixture(t);
  await rm(path.join(root,'source/group/a.png'));
  const before=await snapshot(root);
  await assert.rejects(sync(root,['--target','group/a.md']),/asset/i);
  assert.deepEqual(await snapshot(root),before);
});

test('target output symlink cannot redirect writes outside output root', async t => {
  const root=await fixture(t);
  await mkdir(path.join(root,'outside'));
  await writeFile(path.join(root,'outside/a.md'),'# Keep\n');
  await rm(path.join(root,'out'),{recursive:true});
  await symlink(path.join(root,'outside'),path.join(root,'out'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(sync(root,['--target','group/a.md']),/symlink|ownership/i);
  assert.equal(await readFile(path.join(root,'outside/a.md'),'utf8'),'# Keep\n');
});

test('official target generation retains corrected Python fill guidance and expressions', async t => {
  const root=await fixture(t);
  const lines=[
    '>>>print("{:=>10}".format(123))     # >代表右对齐，长度为10，不够时以 = 字符重复填充',
    '=======123',
    '>>>print("{:=<20}".format(123))     # <代表左对齐，长度为20，不够时以 = 字符重复填充',
    '123=================',
  ];
  await writeFile(path.join(root,'source/group/a.md'),note('a','```python\n'+lines.join('\n')+'\n```'));
  await sync(root,['--target','group/a.md']);
  const output=await readFile(path.join(root,'out/a.md'),'utf8');
  for(const line of lines) assert.ok(output.includes(line));
  assert.doesNotMatch(output,/===填充|<mark>/);
  await sync(root,['--target','group/a.md']);
  assert.equal(await readFile(path.join(root,'out/a.md'),'utf8'),output);
});

test('marker without frontmatter cannot establish generated output ownership', async t => {
  const root=await fixture(t);
  await writeFile(path.join(root,'out/a.md'),'<!-- Generated by scripts/sync-obsidian-notes.mjs from Obsidian Publish. Do not edit by hand. -->\n\nHand-written content without frontmatter.\n');
  const before=await snapshot(root);
  await assert.rejects(sync(root,['--target','group/a.md']),/frontmatter|ownership|generated/i);
  assert.deepEqual(await snapshot(root),before);
});

test('slug migration retains unrelated order in an existing noncanonical manifest', async t => {
  const root=await fixture(t);
  await writeFile(path.join(root,'source/c.md'),note('c','# Third\n\n![image](c.png)'));
  await writeFile(path.join(root,'source/c.png'),'c image');
  await sync(root);
  const file=path.join(root,manifest),m=JSON.parse(await readFile(file,'utf8'));
  for(const key of ['notes','noteRecords','assets']) m[key].reverse();
  m.extra={preserve:'unknown metadata'};
  await writeFile(file,JSON.stringify(m,null,2)+'\n');
  await writeFile(path.join(root,'source/b.md'),note('bb','# Beta\n\n![image](b.png)\n\n## Shared Heading'));
  await sync(root,['--target','b.md']);
  const next=JSON.parse(await readFile(file,'utf8'));
  assert.deepEqual(next.notes,['out/c.md','out/bb.md','out/a.md']);
  assert.deepEqual(next.noteRecords.map(r=>r.slug),['c','bb','a']);
  assert.deepEqual(next.assets,['assets/c/c.png','assets/bb/b.png','assets/a/a.png']);
  assert.deepEqual(next.extra,m.extra);
  const before=await snapshot(root);
  await sync(root,['--target','b.md']);
  assert.deepEqual(await snapshot(root),before);
});
