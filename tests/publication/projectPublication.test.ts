import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProjectPublicationModel,
  ProjectPublicationContractError,
  selectHomepageProjects,
} from '../../src/utils/projectPublication.ts';

function project(id: string, data: Record<string, unknown> = {}) {
  return { id, data: { date: new Date('2026-01-01'), visibility: 'public', ...data } } as never;
}

test('explicit Project identity and publication fields are used directly', () => {
  const model = createProjectPublicationModel([project('source-name.md', { id: 'stable-id', slug: 'public-name', published: true })]);
  assert.deepEqual(model.all.map(({ id, slug, published }) => ({ id, slug, published })), [
    { id: 'stable-id', slug: 'public-name', published: true },
  ]);
});

test('publication and visibility determine Project sets', () => {
  const model = createProjectPublicationModel([
    project('unpublished.md', { id: 'unpublished', slug: 'unpublished', published: false }),
    project('hidden.md', { id: 'hidden', slug: 'hidden', published: true, visibility: 'hidden' }),
  ]);
  assert.deepEqual(model.routable.map((item) => item.id), ['hidden']);
  assert.deepEqual(model.listed, []);
});

test('missing explicit Project fields are rejected without defaults or inference', () => {
  for (const [field, data] of [
    ['id', { slug: 'project', published: true }],
    ['slug', { id: 'project', published: true }],
    ['published', { id: 'project', slug: 'project' }],
  ] as const) {
    assert.throws(
      () => createProjectPublicationModel([project('filename-only.md', data)]),
      (error: unknown) => error instanceof ProjectPublicationContractError && error.issues.some((issue) => issue.code === `missing-project-${field}`),
    );
  }
});

test('invalid explicit Project identities are rejected', () => {
  assert.throws(
    () => createProjectPublicationModel([project('bad.md', { id: 'Bad_ID', slug: 'bad/slug', published: true })]),
    (error: unknown) => error instanceof ProjectPublicationContractError
      && error.issues.some((issue) => issue.code === 'invalid-project-id')
      && error.issues.some((issue) => issue.code === 'invalid-project-slug'),
  );
});

test('duplicate explicit Project IDs and slugs fail', () => {
  const ids = createProjectPublicationModel([
    project('a.md', { id: 'same', slug: 'a', published: true }),
    project('b.md', { id: 'same', slug: 'b', published: true }),
  ]);
  const slugs = createProjectPublicationModel([
    project('a.md', { id: 'a', slug: 'same', published: true }),
    project('b.md', { id: 'b', slug: 'same', published: true }),
  ]);
  assert.ok(ids.issues.some((item) => item.code === 'duplicate-project-id'));
  assert.ok(slugs.issues.some((item) => item.code === 'duplicate-project-slug'));
  assert.ok(slugs.issues.some((item) => item.code === 'duplicate-project-route'));
});

test('Project sorting is deterministic and homepage selection preserves requested order', () => {
  const model = createProjectPublicationModel([
    project('late.md', { id: 'late', slug: 'late', published: true, order: 2, date: new Date('2025-01-01') }),
    project('first.md', { id: 'first', slug: 'first', published: true, order: 1, date: new Date('2024-01-01') }),
    project('new.md', { id: 'new', slug: 'new', published: true, order: 2, date: new Date('2026-01-01') }),
    project('hidden.md', { id: 'hidden', slug: 'hidden', published: true, visibility: 'hidden' }),
    project('off.md', { id: 'off', slug: 'off', published: false }),
  ]);
  assert.deepEqual(model.routable.map((item) => item.id), ['first', 'new', 'late', 'hidden']);
  assert.deepEqual(selectHomepageProjects(model, ['new', 'missing', 'hidden', 'off', 'first']).map((item) => item.id), ['new', 'first']);
});

test('source Project entries are not mutated', () => {
  const entry = project('source.md', { id: 'source', slug: 'source', published: true });
  const before = structuredClone(entry);
  createProjectPublicationModel([entry]);
  assert.deepEqual(entry, before);
});
