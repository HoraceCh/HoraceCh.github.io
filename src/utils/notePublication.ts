import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CollectionEntry } from 'astro:content';
import { noteSlug } from './slugify.ts';

type NoteData = {
  draft?: boolean;
  featured?: boolean;
  order?: number;
  description?: string;
  date?: Date;
  updated?: Date;
};

export type NoteEntry = { id: string; data: NoteData };
export type NoteVisibility = 'public' | 'secondary' | 'hidden';
export type NotePublicationRecord = {
  slug: string;
  published?: boolean;
  featured?: boolean;
  homepageSlot?: string;
  publicSummary?: string;
  order?: number;
  visibility?: NoteVisibility;
};
export type NotePublicationArtifact = { formatVersion: 1; records: NotePublicationRecord[] };
export type PublicationIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  source: string;
  slug?: string;
  field?: string;
};
export type ParsedNotePublicationOverrides = { artifact: NotePublicationArtifact; issues: PublicationIssue[] };
export type EffectiveNote = {
  entry: NoteEntry;
  slug: string;
  data: NoteData & {
    published: boolean;
    visibility: NoteVisibility;
    featured: boolean;
    order?: number;
    publicSummary: string;
    homepageSlot?: string;
  };
  validationIssues: PublicationIssue[];
};
export type NotePublicationModel = {
  all: EffectiveNote[];
  routable: EffectiveNote[];
  discoverable: EffectiveNote[];
  homepage: EffectiveNote[];
  bySlug: Map<string, EffectiveNote>;
  routableBySlug: Map<string, EffectiveNote>;
  issues: PublicationIssue[];
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slotPattern = /^selected-work-(0[1-9]|1[0-2])$/;
const recordFields = new Set(['slug', 'published', 'featured', 'homepageSlot', 'publicSummary', 'order', 'visibility']);

export function parseNotePublicationOverrides(rawText: string): ParsedNotePublicationOverrides {
  const issues: PublicationIssue[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    return { artifact: emptyArtifact(), issues: [issue('error', 'malformed-note-publication-json', 'Override artifact is not valid JSON.', 'artifact')] };
  }

  if (!isRecord(raw)) {
    return { artifact: emptyArtifact(), issues: [issue('error', 'invalid-note-publication-artifact', 'Override artifact must be an object.', 'artifact')] };
  }

  for (const key of Object.keys(raw)) {
    if (key !== 'formatVersion' && key !== 'records') issues.push(issue('error', 'unknown-note-artifact-field', `Unknown top-level field: ${key}.`, 'artifact', undefined, key));
  }
  if (raw.formatVersion !== 1) issues.push(issue('error', 'unsupported-note-publication-version', 'Only override format version 1 is supported.', 'artifact', undefined, 'formatVersion'));
  if (!Array.isArray(raw.records)) {
    issues.push(issue('error', 'invalid-note-publication-records', 'Override records must be an array.', 'artifact', undefined, 'records'));
    return { artifact: emptyArtifact(), issues };
  }

  const records: NotePublicationRecord[] = [];
  const seenSlugs = new Set<string>();
  const seenSlots = new Set<string>();
  for (const [index, value] of raw.records.entries()) {
    const source = `records[${index}]`;
    const issueCount = issues.length;
    if (!isRecord(value) || value === null) {
      issues.push(issue('error', 'invalid-note-publication-record', 'Override record must be a non-null object.', source));
      continue;
    }
    for (const key of Object.keys(value)) {
      if (!recordFields.has(key)) issues.push(issue('error', 'unknown-note-record-field', `Unknown record field: ${key}.`, source, undefined, key));
    }
    const candidate = validateRecord(value, source, issues);
    if (!candidate || issues.slice(issueCount).some((item) => item.severity === 'error')) continue;
    if (seenSlugs.has(candidate.slug)) issues.push(issue('error', 'duplicate-note-override-slug', `Duplicate override slug: ${candidate.slug}.`, source, candidate.slug, 'slug'));
    seenSlugs.add(candidate.slug);
    if (candidate.homepageSlot) {
      if (seenSlots.has(candidate.homepageSlot)) issues.push(issue('error', 'duplicate-note-homepage-slot', `Duplicate homepage slot: ${candidate.homepageSlot}.`, source, candidate.slug, 'homepageSlot'));
      seenSlots.add(candidate.homepageSlot);
    }
    records.push(candidate);
  }

  if (records.some((record, index) => index > 0 && records[index - 1].slug.localeCompare(record.slug, 'en') > 0)) {
    issues.push(issue('warning', 'noncanonical-note-override-order', 'Override records should be sorted lexicographically by slug.', 'artifact', undefined, 'records'));
  }
  return { artifact: { formatVersion: 1, records }, issues };
}

export async function loadNotePublicationOverrides() {
  const path = fileURLToPath(new URL('../data/note-publication-overrides.json', import.meta.url));
  try {
    return parseNotePublicationOverrides(await readFile(path, 'utf8'));
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') return { artifact: emptyArtifact(), issues: [] };
    return { artifact: emptyArtifact(), issues: [issue('error', 'note-override-file-read-error', `Unable to read override artifact: ${error.message}`, 'artifact')] };
  }
}

export function createNotePublicationModel(entries: readonly NoteEntry[], input: NotePublicationArtifact | ParsedNotePublicationOverrides): NotePublicationModel {
  const parsed = 'artifact' in input ? input : { artifact: input, issues: [] };
  const issues = [...parsed.issues];
  const overrides = new Map(parsed.artifact.records.map((record) => [record.slug, record]));
  const all = entries.map((entry) => createEffectiveNote(entry, overrides.get(noteSlug(entry.id))));
  const sourceSlugs = new Set(all.map((note) => note.slug));

  for (const record of parsed.artifact.records) {
    if (!sourceSlugs.has(record.slug)) issues.push(issue('warning', 'orphan-note-override', `Override slug does not match a generated Note: ${record.slug}.`, 'artifact', record.slug));
  }

  const bySlug = new Map<string, EffectiveNote>();
  for (const note of all) {
    if (bySlug.has(note.slug)) issues.push(issue('error', 'duplicate-note-slug', `Duplicate generated Note slug: ${note.slug}.`, note.entry.id, note.slug));
    else bySlug.set(note.slug, note);
  }
  const routable = all.filter((note) => note.data.published && !hasNoteError(note, issues));
  const discoverable = routable.filter((note) => note.data.visibility !== 'hidden');
  const homepage = routable.filter((note) => note.data.visibility === 'public' && note.data.homepageSlot).sort(compareHomepageSlots);
  const routableBySlug = new Map(routable.map((note) => [note.slug, note]));

  return { all, routable, discoverable, homepage, bySlug, routableBySlug, issues };
}

export async function loadNotePublicationModel() {
  const [{ getCollection }, overrides] = await Promise.all([import('astro:content'), loadNotePublicationOverrides()]);
  return createNotePublicationModel(await getCollection('notes'), overrides);
}

export function noteHref(note: Pick<EffectiveNote, 'slug'>) {
  return `/notes/${note.slug}/`;
}

export function compareNotesByOrder(a: EffectiveNote, b: EffectiveNote) {
  const order = (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER);
  if (order !== 0) return order;
  return a.slug.localeCompare(b.slug, 'en');
}

export function compareNotesByRecency(a: EffectiveNote, b: EffectiveNote) {
  const recency = dateValue(b.data.updated ?? b.data.date) - dateValue(a.data.updated ?? a.data.date);
  if (recency !== 0) return recency;
  return a.slug.localeCompare(b.slug, 'en');
}

export function selectHomepageNotes(model: NotePublicationModel) {
  return model.homepage;
}

function createEffectiveNote(entry: NoteEntry, override: NotePublicationRecord | undefined): EffectiveNote {
  const slug = noteSlug(entry.id);
  const data = {
    ...entry.data,
    published: override?.published ?? !entry.data.draft,
    visibility: override?.visibility ?? 'public',
    featured: override?.featured ?? entry.data.featured ?? false,
    order: override?.order ?? entry.data.order,
    publicSummary: override?.publicSummary ?? entry.data.description ?? '',
    homepageSlot: override?.homepageSlot,
  };
  return { entry, slug, data, validationIssues: [] };
}

function validateRecord(value: Record<string, unknown>, source: string, issues: PublicationIssue[]) {
  const slug = value.slug;
  if (typeof slug !== 'string' || !slugPattern.test(slug)) {
    issues.push(issue('error', 'invalid-note-override-slug', 'Override slug must be lowercase kebab case.', source, undefined, 'slug'));
    return undefined;
  }
  const record: NotePublicationRecord = { slug };
  for (const key of ['published', 'featured'] as const) {
    if (key in value) {
      if (typeof value[key] !== 'boolean') issues.push(issue('error', `invalid-note-${key}`, `${key} must be a boolean.`, source, slug, key));
      else record[key] = value[key];
    }
  }
  if ('homepageSlot' in value) {
    if (typeof value.homepageSlot !== 'string' || !slotPattern.test(value.homepageSlot)) issues.push(issue('error', 'invalid-note-homepage-slot', 'homepageSlot must be selected-work-01 through selected-work-12.', source, slug, 'homepageSlot'));
    else record.homepageSlot = value.homepageSlot;
  }
  if ('publicSummary' in value) {
    if (typeof value.publicSummary !== 'string' || value.publicSummary.trim() !== value.publicSummary || value.publicSummary.length < 1 || value.publicSummary.length > 280) issues.push(issue('error', 'invalid-note-public-summary', 'publicSummary must be a trimmed string of 1 to 280 characters.', source, slug, 'publicSummary'));
    else record.publicSummary = value.publicSummary;
  }
  if ('order' in value) {
    if (!Number.isInteger(value.order) || (value.order as number) < 0 || (value.order as number) > 9999) issues.push(issue('error', 'invalid-note-order', 'order must be an integer from 0 to 9999.', source, slug, 'order'));
    else record.order = value.order as number;
  }
  if ('visibility' in value) {
    if (value.visibility !== 'public' && value.visibility !== 'secondary' && value.visibility !== 'hidden') issues.push(issue('error', 'invalid-note-visibility', 'visibility must be public, secondary, or hidden.', source, slug, 'visibility'));
    else record.visibility = value.visibility;
  }
  return record;
}

function emptyArtifact(): NotePublicationArtifact { return { formatVersion: 1, records: [] }; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function hasNoteError(note: EffectiveNote, issues: PublicationIssue[]) { return issues.some((item) => item.severity === 'error' && item.source === note.entry.id); }
function compareHomepageSlots(a: EffectiveNote, b: EffectiveNote) { return (a.data.homepageSlot ?? '').localeCompare(b.data.homepageSlot ?? '', 'en') || a.slug.localeCompare(b.slug, 'en'); }
function dateValue(value: Date | undefined) { return value instanceof Date && !Number.isNaN(value.valueOf()) ? value.valueOf() : 0; }
function issue(severity: 'warning' | 'error', code: string, message: string, source: string, slug?: string, field?: string): PublicationIssue { return { severity, code, message, source, slug, field }; }
