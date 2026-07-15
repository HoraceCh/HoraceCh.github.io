import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNoteBacklinksIndex, type NoteBacklinkEntry, type NoteBacklinkTarget } from '../../src/utils/noteBacklinks.ts';

function note(slug: string, body = '', aliases?: string[]): NoteBacklinkEntry {
  return { id: `${slug}.md`, body, data: { title: `${slug} title`, aliases } };
}

function target(slug: string, aliases?: string[]): NoteBacklinkTarget {
  return { slug, title: `${slug} title`, aliases };
}

function index({ sources, known, routable }: { sources: NoteBacklinkEntry[]; known: string[]; routable: string[] }) {
  const allTargets = new Map(known.map((slug) => [slug, target(slug)]));
  const routableTargets = new Map(routable.map((slug) => [slug, target(slug)]));
  return buildNoteBacklinksIndex({ sources, knownTargets: allTargets, routableTargets });
}

test('indexes public sources and public targets without mutation', () => {
  const source = note('source', 'See [[target]].');
  const result = index({ sources: [source], known: ['source', 'target'], routable: ['source', 'target'] });
  assert.equal(result.backlinksBySlug.target.length, 1);
  assert.equal(result.backlinksBySlug.target[0].sourceSlug, 'source');
  assert.equal(result.issues.length, 0);
  assert.equal(source.data.aliases, undefined);
});

test('skips unpublished sources before parsing or exposing public link data', () => {
  const unpublishedSource = note('unpublished-source', '[[target]] and [[unpublished-target]]', ['private-alias']);
  unpublishedSource.data.title = 'Private source title';

  const result = index({
    sources: [
      note('public-source', '[[target]]'),
      unpublishedSource,
    ],
    known: ['public-source', 'unpublished-source', 'target', 'unpublished-target'],
    routable: ['public-source', 'target'],
  });
  assert.deepEqual(result.backlinksBySlug.target.map((link) => link.sourceSlug), ['public-source']);
  assert.equal(result.backlinksBySlug['unpublished-source'], undefined);
  assert.equal(result.outgoingLinksBySlug['unpublished-source'], undefined);
  assert.equal(result.backlinksBySlug.target.length, 1);
  assert.equal(result.issues.length, 0);
  assert.equal(JSON.stringify(result).includes('unpublished-source'), false);
  assert.equal(JSON.stringify(result).includes('Private source title'), false);
  assert.equal(JSON.stringify(result).includes('private-alias'), false);
});

test('aggregates published links to known unavailable targets without exposing them', () => {
  const result = index({
    sources: [note('source-a', '[[unpublished]] and [[another-unpublished]].'), note('source-b', '[Target](/notes/unpublished/#top)')],
    known: ['source-a', 'source-b', 'unpublished', 'another-unpublished'],
    routable: ['source-a', 'source-b'],
  });
  assert.equal(result.issues.length, 3);
  assert.deepEqual(result.issues.map((issue) => issue.code), Array(3).fill('published-link-to-unpublished-note'));
  assert.equal(result.backlinksBySlug.unpublished, undefined);
  assert.equal(result.outgoingLinksBySlug['source-a'].length, 0);
});

test('hidden and secondary published targets remain valid', () => {
  const result = index({
    sources: [note('source', '[[hidden]] and [[secondary]].')],
    known: ['source', 'hidden', 'secondary'],
    routable: ['source', 'hidden', 'secondary'],
  });
  assert.equal(result.issues.length, 0);
  assert.equal(result.backlinksBySlug.hidden.length, 1);
  assert.equal(result.backlinksBySlug.secondary.length, 1);
});

test('hidden and secondary routable sources contribute backlinks', () => {
  const result = index({
    sources: [note('hidden-source', '[[target]]'), note('secondary-source', '[[target]]')],
    known: ['hidden-source', 'secondary-source', 'target'],
    routable: ['hidden-source', 'secondary-source', 'target'],
  });
  assert.deepEqual(result.backlinksBySlug.target.map((link) => link.sourceSlug), ['hidden-source', 'secondary-source']);
  assert.deepEqual(Object.keys(result.outgoingLinksBySlug), ['hidden-source', 'secondary-source']);
  assert.equal(result.issues.length, 0);
});

test('normalizes aliases, heading fragments, markdown routes, query strings, and fragments', () => {
  const sources = [note('source', '[[alias-target|label]] [[heading-target#section|heading]] [Route](/notes/route-target/) [Fragment](/notes/fragment-target?view=full#section)')];
  const knownTargets = new Map([
    ['source', target('source')],
    ['alias-target', target('alias-target', ['alias-target'])],
    ['heading-target', target('heading-target')],
    ['route-target', target('route-target')],
    ['fragment-target', target('fragment-target')],
  ]);
  const result = buildNoteBacklinksIndex({ sources, knownTargets, routableTargets: new Map(knownTargets) });
  for (const slug of ['alias-target', 'heading-target', 'route-target', 'fragment-target']) {
    assert.equal(result.backlinksBySlug[slug].length, 1);
  }
  assert.equal(result.issues.length, 0);
});

test('preserves unresolved behavior and ignores non-content or non-Note syntax', () => {
  const result = index({
    sources: [note('source', [
      '[[missing-note]]',
      '`[[unpublished]]`',
      '\\[[unpublished]]',
      '```md',
      '[[unpublished]]',
      '```',
      '<!-- Generated by scripts/sync-obsidian-notes.mjs [[unpublished]] -->',
      '[External](https://example.com/notes/unpublished)',
      '![Asset](/assets/unpublished.png)',
    ].join('\n'))],
    known: ['source', 'unpublished'],
    routable: ['source'],
  });
  assert.equal(result.unresolvedLinks.length, 1);
  assert.equal(result.unresolvedLinks[0].target, 'missing-note');
  assert.equal(result.issues.length, 0);
});

test('ignores frontmatter link-like values', () => {
  const result = index({
    sources: [note('source', '---\nrelated: [[unpublished]]\n---\nVisible text.')],
    known: ['source', 'unpublished'],
    routable: ['source'],
  });
  assert.equal(result.issues.length, 0);
});
