import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectPublicationModel, selectHomepageProjects } from '../../src/utils/projectPublication.ts';

function project(id: string, data: Record<string, unknown> = {}) {
  return { id, data: { date: new Date('2026-01-01'), visibility: 'public', ...data } } as never;
}

test('legacy Project resolves compatibility fields and defaults published', () => {
  const model = createProjectPublicationModel([project('legacy-project.md')]);
  assert.equal(model.all[0].id, 'legacy-project');
  assert.equal(model.all[0].slug, 'legacy-project');
  assert.equal(model.all[0].published, true);
  assert.deepEqual(model.issues.filter((item) => item.severity === 'warning').map((item) => item.field).sort(), ['id', 'published', 'slug']);
});

test('publication and visibility determine Project sets', () => {
  const model = createProjectPublicationModel([
    project('unpublished.md', { id: 'unpublished', slug: 'unpublished', published: false }),
    project('hidden.md', { id: 'hidden', slug: 'hidden', published: true, visibility: 'hidden' }),
  ]);
  assert.deepEqual(model.routable.map((item) => item.id), ['hidden']);
  assert.deepEqual(model.listed, []);
});

test('explicit identities win and invalid or nested fallbacks fail', () => {
  const model = createProjectPublicationModel([
    project('old-name.md', { id: 'stable-id', slug: 'public-name' }),
    project('bad.md', { id: 'Bad_ID', slug: 'bad/slug' }),
    project('nested/project.md'),
  ]);
  assert.equal(model.all[0].id, 'stable-id');
  assert.equal(model.all[0].slug, 'public-name');
  assert.deepEqual(model.issues.filter((item) => item.severity === 'error').map((item) => item.code).sort(), ['invalid-project-id', 'invalid-project-slug', 'unresolvable-project-id', 'unresolvable-project-slug', 'unroutable-published-project', 'unroutable-published-project']);
});

test('duplicate Project identities fail', () => {
  const ids = createProjectPublicationModel([project('a.md', { id: 'same', slug: 'a' }), project('b.md', { id: 'same', slug: 'b' })]);
  const slugs = createProjectPublicationModel([project('a.md', { id: 'a', slug: 'same' }), project('b.md', { id: 'b', slug: 'same' })]);
  assert.ok(ids.issues.some((item) => item.code === 'duplicate-project-id'));
  assert.ok(slugs.issues.some((item) => item.code === 'duplicate-project-slug'));
});

test('Project sorting and homepage selection are deterministic', () => {
  const model = createProjectPublicationModel([
    project('late.md', { id: 'late', slug: 'late', order: 2, date: new Date('2025-01-01') }),
    project('first.md', { id: 'first', slug: 'first', order: 1, date: new Date('2024-01-01') }),
    project('new.md', { id: 'new', slug: 'new', order: 2, date: new Date('2026-01-01') }),
    project('hidden.md', { id: 'hidden', slug: 'hidden', visibility: 'hidden' }),
    project('off.md', { id: 'off', slug: 'off', published: false }),
  ]);
  assert.deepEqual(model.routable.map((item) => item.id), ['first', 'new', 'late', 'hidden']);
  assert.deepEqual(selectHomepageProjects(model, ['new', 'hidden', 'off', 'first']).map((item) => item.id), ['new', 'first']);
});
