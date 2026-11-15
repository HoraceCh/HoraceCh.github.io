import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Home contract matches Project-only selection and retained Note compatibility', () => {
  const contract = fs.readFileSync('docs/CONTENT_PUBLICATION_CONTRACT.md', 'utf8');
  assert.ok(contract.includes('src/data/home-v2.json.workIds'));
  assert.ok(contract.includes('current Home is Project-only'));
  assert.ok(contract.includes('does not consume Note slots'));
  assert.ok(contract.includes('selectHomepageNotes'));
  assert.ok(!contract.includes('homepage currently selects'));
  assert.ok(contract.includes('unpublished Note is excluded from public listings'));
  assert.ok(fs.readFileSync('src/pages/index.astro', 'utf8').includes('ids={content.workIds}'));
  assert.ok(fs.readFileSync('src/components/home/SelectedWorks.astro', 'utf8').includes('selectHomepageProjects(model, ids)'));
});

test('Home authority has self-contained direction instead of absent relative links', () => {
  const section = fs.readFileSync('docs/design/UI_DESIGN.md', 'utf8').split('## 16. Home v2 scoped successor')[1].split('\n## ')[0];
  assert.ok(!section.includes('](home-v2/README.md)'));
  assert.ok(!section.includes('](home-v2/decision-register.md)'));
  assert.ok(section.includes('external historical evidence, not committed documents'));
  assert.ok(section.includes('Selected Works B, Honors A'));
});

test('standalone Header fixture copies committed admitted bytes for both themes', t => {
  fs.mkdirSync('.npm-cache', { recursive: true });
  const scratch = fs.mkdtempSync(path.resolve('.npm-cache/pr39-header-'));
  const root = path.join(scratch, 'fixture');
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  execFileSync(process.execPath, ['tests/ui/headerFixture.mjs', '--output', root], { encoding: 'utf8' });
  const records = JSON.parse(fs.readFileSync('docs/design/home-v2/integration/asset-admission.json', 'utf8'));
  for (const record of records) {
    const bytes = fs.readFileSync(path.join(root, 'public/images/home', path.basename(record.destination)));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
  }
  for (const theme of ['light', 'dark']) {
    const output = fs.readFileSync(path.join(root, 'src/pages', 'hc235-' + theme + '.astro'), 'utf8');
    assert.ok(output.includes('RoboMaster 2026 engineering robot photographed'));
    assert.ok(!output.includes('docs/design/home-v2/assets/'));
  }
});
