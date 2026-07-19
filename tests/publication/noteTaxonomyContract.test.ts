import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import test from 'node:test';
import { categoryDefinitions } from '../../src/utils/notes.ts';
import { slugify } from '../../src/utils/slugify.ts';

type PublicationOverride = { slug: string; published?: boolean };

test('every published Note category has one canonical generated category route', async () => {
  const notesRoot = resolve('src/content/notes');
  const overrides = JSON.parse(await readFile(resolve('src/data/note-publication-overrides.json'), 'utf8')) as {
    records: PublicationOverride[];
  };
  const overridesBySlug = new Map(overrides.records.map((record) => [record.slug, record]));
  const categoryNames = new Set(categoryDefinitions.map((category) => category.name));
  const routes = categoryDefinitions.map((category) => slugify(category.name));

  assert.equal(categoryNames.size, categoryDefinitions.length, 'category display names must be unique');
  assert.equal(new Set(routes).size, routes.length, 'category display names must map to unique route slugs');
  assert.ok(routes.every((route) => route.length > 0), 'every category must have a non-empty route slug');

  const publishedNotes = [];
  for (const path of await markdownFiles(notesRoot)) {
    const source = await readFile(path, 'utf8');
    const slug = relative(notesRoot, path).replace(/\\/g, '/').replace(/\.mdx?$/, '').replace(/\/index$/, '');
    const category = frontmatterScalar(source, 'category');
    const draft = frontmatterScalar(source, 'draft') === 'true';
    const published = overridesBySlug.get(slug)?.published ?? !draft;
    if (published) publishedNotes.push({ slug, category });
  }

  const undefinedCategories = publishedNotes.filter((note) => !categoryNames.has(note.category));
  assert.deepEqual(
    undefinedCategories,
    [],
    `published Notes use categories without generated routes: ${undefinedCategories.map((note) => `${note.slug} (${note.category})`).join(', ')}`,
  );

  assert.equal(
    publishedNotes.filter((note) => note.category === 'Information Retrieval').length,
    7,
    'Information Retrieval should contain its seven approved public Notes',
  );
});

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? markdownFiles(path) : Promise.resolve(/\.mdx?$/.test(entry.name) ? [path] : []);
    }),
  );
  return paths.flat();
}

function frontmatterScalar(source: string, field: string) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
  const value = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'))?.[1] ?? '';
  return value.replace(/^(['"])(.*)\1$/, '$2');
}
