import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotePublicationModel, parseNotePublicationOverrides, selectHomepageNotes } from '../../src/utils/notePublication.ts';

function note(id: string, data: Record<string, unknown> = {}) {
  return { id, data: { description: 'Generated summary', date: new Date('2026-01-01'), featured: false, draft: false, ...data } } as never;
}
function parsed(value: unknown) { return parseNotePublicationOverrides(JSON.stringify(value)); }
function codes(result: ReturnType<typeof parseNotePublicationOverrides>) { return result.issues.map((item) => item.code); }

test('valid artifacts include empty and canonical example records', () => {
  assert.deepEqual(parseNotePublicationOverrides('{"formatVersion":1,"records":[]}').artifact.records, []);
  const result = parsed({ formatVersion: 1, records: [{ slug: 'ai-assisted-literature-workflow', homepageSlot: 'selected-work-03', publicSummary: 'A cautious process.' }] });
  assert.equal(result.issues.length, 0);
  assert.equal(result.artifact.records[0].homepageSlot, 'selected-work-03');
});

test('parser reports malformed artifacts and every invalid contract category', () => {
  assert.ok(codes(parseNotePublicationOverrides('{')).includes('malformed-note-publication-json'));
  assert.ok(codes(parsed({ formatVersion: 2, records: [] })).includes('unsupported-note-publication-version'));
  assert.ok(codes(parsed({ formatVersion: 1, extra: true, records: [] })).includes('unknown-note-artifact-field'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', extra: true }] })).includes('unknown-note-record-field'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [null] })).includes('invalid-note-publication-record'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one' }, { slug: 'one' }] })).includes('duplicate-note-override-slug'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', homepageSlot: 'selected-work-01' }, { slug: 'two', homepageSlot: 'selected-work-01' }] })).includes('duplicate-note-homepage-slot'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', visibility: 'private', order: 1.5, homepageSlot: 'wrong', publicSummary: ' padded ' }] })).includes('invalid-note-visibility'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', visibility: 'private', order: 1.5, homepageSlot: 'wrong', publicSummary: ' padded ' }] })).includes('invalid-note-order'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', visibility: 'private', order: 1.5, homepageSlot: 'wrong', publicSummary: ' padded ' }] })).includes('invalid-note-homepage-slot'));
  assert.ok(codes(parsed({ formatVersion: 1, records: [{ slug: 'one', visibility: 'private', order: 1.5, homepageSlot: 'wrong', publicSummary: ' padded ' }] })).includes('invalid-note-public-summary'));
});

test('noncanonical ordering and orphan records warn without retargeting', () => {
  const overrides = parsed({ formatVersion: 1, records: [{ slug: 'zeta' }, { slug: 'alpha' }] });
  assert.ok(codes(overrides).includes('noncanonical-note-override-order'));
  const model = createNotePublicationModel([note('different.md')], overrides);
  assert.ok(model.issues.some((item) => item.code === 'orphan-note-override'));
  assert.equal(model.all[0].data.published, true);
});

test('Note defaults, overrides, and sets preserve source data', () => {
  const draft = note('draft.md', { draft: true });
  const normal = note('normal.md', { featured: true, order: 7 });
  const artifact = parsed({ formatVersion: 1, records: [
    { slug: 'normal', published: false },
    { slug: 'hidden', visibility: 'hidden' },
    { slug: 'secondary', visibility: 'secondary', homepageSlot: 'selected-work-01' },
  ] });
  const model = createNotePublicationModel([draft, normal, note('hidden.md'), note('secondary.md')], artifact);
  assert.equal(model.all.find((item) => item.slug === 'draft')?.data.published, false);
  assert.equal(model.all.find((item) => item.slug === 'normal')?.data.featured, true);
  assert.equal((normal as { data: { published?: boolean } }).data.published, undefined);
  assert.deepEqual(model.routable.map((item) => item.slug).sort(), ['hidden', 'secondary']);
  assert.deepEqual(model.discoverable.map((item) => item.slug), ['secondary']);
  assert.deepEqual(model.homepage, []);
});

test('homepage slot and deterministic comparators govern selection', () => {
  const artifact = parsed({ formatVersion: 1, records: [
    { slug: 'later', homepageSlot: 'selected-work-02', order: 2 },
    { slug: 'first', homepageSlot: 'selected-work-01', order: 1 },
  ] });
  const model = createNotePublicationModel([note('later.md', { date: new Date('2025-01-01') }), note('first.md', { date: new Date('2026-01-01') })], artifact);
  assert.deepEqual(selectHomepageNotes(model).map((item) => item.slug), ['first', 'later']);
  assert.deepEqual([...model.all].sort((a, b) => a.data.order! - b.data.order!).map((item) => item.slug), ['first', 'later']);
  assert.deepEqual([...model.all].sort((a, b) => b.data.date!.valueOf() - a.data.date!.valueOf()).map((item) => item.slug), ['first', 'later']);
});
