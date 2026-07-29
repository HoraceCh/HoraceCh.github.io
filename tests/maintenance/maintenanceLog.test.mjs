import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import { createRecord, newCorrelationId, rebuildIndex, validateRepository } from '../../tools/maintenance-log.mjs';

const execFileAsync = promisify(execFile);
const script = path.resolve('tools/maintenance-log.mjs');
const templates = path.resolve('.agents/maintenance/templates');

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'maintenance-log-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const maintenance = path.join(root, '.agents', 'maintenance');
  await mkdir(path.join(maintenance, 'templates'), { recursive: true });
  await mkdir(path.join(maintenance, 'events'), { recursive: true });
  await mkdir(path.join(maintenance, 'incidents'), { recursive: true });
  await copyFile(path.join(templates, 'event.md'), path.join(maintenance, 'templates', 'event.md'));
  await copyFile(path.join(templates, 'incident.md'), path.join(maintenance, 'templates', 'incident.md'));
  return { root, maintenance };
}

async function run(root, args) {
  return execFileAsync(process.execPath, [script, ...args, '--root', root], { encoding: 'utf8' });
}

async function createEvent(root, extra = []) {
  return run(root, [
    'create',
    '--occurred-at',
    '2026-07-28T10:00:00Z',
    '--recorded-at',
    '2026-07-28T10:01:00Z',
    '--summary',
    'Test maintenance event',
    '--affected-path',
    '.agents/rules.md',
    ...extra,
  ]);
}

async function expectInvalid(t, mutate, expected) {
  const { root, maintenance } = await fixture(t);
  await createEvent(root);
  const recordPath = path.join(maintenance, 'events', 'WEB-20260728-0001.md');
  const source = await readFile(recordPath, 'utf8');
  await writeFile(recordPath, mutate(source), 'utf8');
  await assert.rejects(run(root, ['validate']), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, expected);
    return true;
  });
}

test('creates unique event and incident IDs from templates and validates them', async (t) => {
  const { root } = await fixture(t);
  const first = await createEvent(root);
  assert.match(first.stdout, /Created WEB-20260728-0001/);

  const second = await createEvent(root, ['--kind', 'governance', '--category', 'agent-governance']);
  assert.match(second.stdout, /Created WEB-20260728-0002/);

  const incident = await run(root, [
    'create',
    '--incident',
    '--occurred-at',
    '2026-07-28T10:02:00+00:00',
    '--recorded-at',
    '2026-07-28T10:03:00Z',
    '--summary',
    'Test incident',
    '--affected-path',
    'tools/maintenance-log.mjs',
  ]);
  assert.match(incident.stdout, /Created WEB-INC-20260728-0001/);

  const validation = await validateRepository(root);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.records.length, 3);
});

test('rejects duplicate IDs with a non-zero CLI exit', async (t) => {
  const { root, maintenance } = await fixture(t);
  await createEvent(root);
  const source = path.join(maintenance, 'events', 'WEB-20260728-0001.md');
  await copyFile(source, path.join(maintenance, 'events', 'duplicate.md'));

  await assert.rejects(run(root, ['validate']), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /duplicate event_id WEB-20260728-0001/);
    return true;
  });
});

test('rejects invalid enums', async (t) => {
  await expectInvalid(t, (text) => text.replace('status: "planned"', 'status: "unknown"'), /status must be one of/);
});

test('rejects timestamps without an explicit timezone', async (t) => {
  await expectInvalid(
    t,
    (text) => text.replace('occurred_at: "2026-07-28T10:00:00Z"', 'occurred_at: "2026-07-28T10:00:00"'),
    /occurred_at must be an ISO 8601 timestamp with an explicit timezone/,
  );
});

test('rejects invalid cross-system correlation IDs', async (t) => {
  await expectInvalid(t, (text) => text.replace('correlation_id: ""', 'correlation_id: "REL-123"'), /correlation_id must be empty or use the canonical XREL- format/);
});

test('rejects Windows absolute paths in public records', async (t) => {
  await expectInvalid(
    t,
    (text) => text.replace('[".agents/rules.md"]', '["C:\\\\Users\\\\person\\\\private.md"]'),
    /Windows absolute path|unsafe repository path/,
  );
});

test('rejects unsafe public events and credential-shaped assignments', async (t) => {
  await expectInvalid(t, (text) => text.replace('public_safe: true', 'public_safe: false'), /public_safe must be true/);
  for (const assignment of [
    'password=visible-example',
    'token=visible-example',
    'secret=visible-example',
    'oauth_token=visible-example',
    'credential=visible-example',
  ]) {
    await expectInvalid(t, (text) => text.replace('## Notes\n\nNone.', `## Notes\n\n${assignment}`), /credential-shaped assignment/);
  }
});

test('generates valid collision-resistant correlation IDs', () => {
  const first = newCorrelationId('2026-07-28T00:00:00Z');
  const second = newCorrelationId('2026-07-28T00:00:00Z');
  assert.match(first, /^XREL-20260728-[A-Z0-9]{12}$/);
  assert.notEqual(first, second);
});

test('rebuilds the generated index deterministically from canonical records', async (t) => {
  const { root, maintenance } = await fixture(t);
  await createEvent(root);
  const first = await rebuildIndex(root);
  const firstFile = await readFile(path.join(maintenance, 'index.md'));
  const second = await rebuildIndex(root);
  const secondFile = await readFile(path.join(maintenance, 'index.md'));

  assert.equal(first.output, second.output);
  assert.deepEqual(firstFile, secondFile);
  assert.equal(secondFile.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false);
  assert.equal(secondFile.includes(0x0d), false);
  assert.equal(secondFile.toString('utf8').match(/\n+$/)?.[0], '\n');
  const secondText = secondFile.toString('utf8');
  assert.match(secondText, /Generated by tools\/maintenance-log\.mjs/);
  assert.match(secondText, /\[WEB-20260728-0001\]\(events\/WEB-20260728-0001\.md\)/);
  assert.match(secondText, /Legacy System Maintenance Log v1/);
});

test('canonicalizes CRLF templates and record output bytes', async (t) => {
  const { root, maintenance } = await fixture(t);
  const templatePath = path.join(maintenance, 'templates', 'event.md');
  const template = await readFile(templatePath, 'utf8');
  await writeFile(templatePath, `\uFEFF${template.replaceAll('\n', '\r\n')}\r\n`, 'utf8');

  const created = await createRecord(root, {
    'occurred-at': '2026-07-28T10:00:00Z',
    'recorded-at': '2026-07-28T10:01:00Z',
    summary: 'Canonical record output',
    'affected-path': '.agents/rules.md',
  });
  const record = await readFile(created.filePath);

  assert.equal(record.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false);
  assert.equal(record.includes(0x0d), false);
  assert.equal(record.toString('utf8').match(/\n+$/)?.[0], '\n');
});

test('applies LF attributes to direct and nested maintenance Markdown paths', async () => {
  const { stdout } = await execFileAsync('git', [
    'check-attr',
    'text',
    'eol',
    '--',
    '.agents/maintenance/index.md',
    '.agents/maintenance/events/WEB-20260728-0001.md',
  ]);

  assert.match(stdout, /\.agents\/maintenance\/index\.md: text: set/);
  assert.match(stdout, /\.agents\/maintenance\/index\.md: eol: lf/);
  assert.match(stdout, /\.agents\/maintenance\/events\/WEB-20260728-0001\.md: text: set/);
  assert.match(stdout, /\.agents\/maintenance\/events\/WEB-20260728-0001\.md: eol: lf/);
});
