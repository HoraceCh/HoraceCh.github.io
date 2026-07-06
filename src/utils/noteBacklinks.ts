import { noteSlug, slugify } from './slugify';

export type NoteBacklink = {
  sourceSlug: string;
  sourceTitle: string;
  targetSlug: string;
  targetTitle: string;
  linkText: string;
  rawLink: string;
  context?: string;
};

export type BacklinksIndex = Record<string, NoteBacklink[]>;
export type OutgoingLinksIndex = Record<string, NoteBacklink[]>;

export type UnresolvedNoteLink = {
  sourceSlug: string;
  sourceTitle: string;
  target: string;
  linkText: string;
  rawLink: string;
  reason: 'unresolved-note' | 'ambiguous-note';
  candidates?: string[];
  context?: string;
};

export type NoteBacklinksResult = {
  backlinksBySlug: BacklinksIndex;
  outgoingLinksBySlug: OutgoingLinksIndex;
  unresolvedLinks: UnresolvedNoteLink[];
};

type AliasValue = string | readonly string[] | undefined;

export type NoteBacklinkEntry = {
  id: string;
  body?: string;
  data: {
    title: string;
    alias?: AliasValue;
    aliases?: AliasValue;
  };
};

type IndexedNote = {
  slug: string;
  title: string;
  aliases: string[];
  body: string;
};

type ParsedNoteLink = {
  target: string;
  linkText: string;
  rawLink: string;
  isEmbed: boolean;
  context?: string;
};

type ResolvedTarget =
  | { status: 'resolved'; slug: string }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'unresolved' };

const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]+)\]\]/g;
const MARKDOWN_NOTE_LINK_PATTERN = /\[([^\]\n]+)\]\((\/notes\/[^)\s]+)\)/g;
const FILE_EXTENSION_PATTERN = /\.[a-z0-9]{2,8}$/i;

export function buildNoteBacklinksIndex(entries: readonly NoteBacklinkEntry[]): NoteBacklinksResult {
  const notes = entries
    .map((entry) => {
      if (typeof entry.body !== 'string') {
        throw new Error(`Note backlink extraction requires raw Markdown body text for ${entry.id}.`);
      }

      return {
        slug: noteSlug(entry.id),
        title: entry.data.title,
        aliases: normalizeAliases(entry.data.aliases, entry.data.alias),
        body: entry.body,
      };
    })
    .sort((left, right) => compareText(left.slug, right.slug));

  const notesBySlug = new Map(notes.map((note) => [note.slug, note]));
  const lookup = buildNoteLookup(notes);
  const backlinksBySlug = Object.fromEntries(notes.map((note) => [note.slug, []])) as BacklinksIndex;
  const outgoingLinksBySlug = Object.fromEntries(notes.map((note) => [note.slug, []])) as OutgoingLinksIndex;
  const unresolvedLinks: UnresolvedNoteLink[] = [];

  for (const sourceNote of notes) {
    for (const parsedLink of extractNoteLinks(sourceNote.body)) {
      const resolvedTarget = resolveTarget(parsedLink.target, lookup);

      if (resolvedTarget.status === 'unresolved' && parsedLink.isEmbed && looksLikeFileTarget(parsedLink.target)) {
        continue;
      }

      if (resolvedTarget.status !== 'resolved') {
        unresolvedLinks.push({
          sourceSlug: sourceNote.slug,
          sourceTitle: sourceNote.title,
          target: parsedLink.target,
          linkText: parsedLink.linkText,
          rawLink: parsedLink.rawLink,
          reason: resolvedTarget.status === 'ambiguous' ? 'ambiguous-note' : 'unresolved-note',
          candidates: resolvedTarget.status === 'ambiguous' ? resolvedTarget.candidates : undefined,
          context: parsedLink.context,
        });
        continue;
      }

      const targetNote = notesBySlug.get(resolvedTarget.slug);

      if (!targetNote) {
        continue;
      }

      const backlink: NoteBacklink = {
        sourceSlug: sourceNote.slug,
        sourceTitle: sourceNote.title,
        targetSlug: targetNote.slug,
        targetTitle: targetNote.title,
        linkText: parsedLink.linkText,
        rawLink: parsedLink.rawLink,
        context: parsedLink.context,
      };

      outgoingLinksBySlug[sourceNote.slug].push(backlink);
      backlinksBySlug[targetNote.slug].push(backlink);
    }
  }

  for (const links of Object.values(backlinksBySlug)) {
    links.sort(compareBacklinks);
  }

  for (const links of Object.values(outgoingLinksBySlug)) {
    links.sort(compareBacklinks);
  }

  unresolvedLinks.sort(compareUnresolvedLinks);

  return {
    backlinksBySlug,
    outgoingLinksBySlug,
    unresolvedLinks,
  };
}

export function extractNoteLinks(markdown: string): ParsedNoteLink[] {
  const links: ParsedNoteLink[] = [];
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    links.push(...extractWikilinks(line), ...extractMarkdownNoteLinks(line));
  }

  return links;
}

function extractWikilinks(line: string): ParsedNoteLink[] {
  const links: ParsedNoteLink[] = [];

  for (const match of line.matchAll(WIKILINK_PATTERN)) {
    const rawLink = match[0];
    const isEmbed = match[1] === '!';
    const inner = match[2].trim();
    const { target, label } = splitAlias(inner);
    const noteTarget = stripFragment(target);

    if (!noteTarget) {
      continue;
    }

    links.push({
      target: noteTarget,
      linkText: label || target,
      rawLink,
      isEmbed,
      context: cleanContext(line),
    });
  }

  return links;
}

function extractMarkdownNoteLinks(line: string): ParsedNoteLink[] {
  const links: ParsedNoteLink[] = [];

  for (const match of line.matchAll(MARKDOWN_NOTE_LINK_PATTERN)) {
    if (match.index && line[match.index - 1] === '!') {
      continue;
    }

    const rawLink = match[0];
    const linkText = match[1].trim();
    const target = noteTargetFromHref(match[2]);

    if (!target) {
      continue;
    }

    links.push({
      target,
      linkText,
      rawLink,
      isEmbed: false,
      context: cleanContext(line),
    });
  }

  return links;
}

function buildNoteLookup(notes: readonly IndexedNote[]) {
  const lookup = new Map<string, Set<string>>();

  for (const note of notes) {
    addLookupValue(lookup, note.slug, note.slug);
    addLookupValue(lookup, note.title, note.slug);

    for (const alias of note.aliases) {
      addLookupValue(lookup, alias, note.slug);
    }
  }

  return lookup;
}

function addLookupValue(lookup: Map<string, Set<string>>, value: string, slug: string) {
  for (const key of lookupKeys(value)) {
    const matches = lookup.get(key) ?? new Set<string>();
    matches.add(slug);
    lookup.set(key, matches);
  }
}

function resolveTarget(target: string, lookup: Map<string, Set<string>>): ResolvedTarget {
  const candidates = new Set<string>();

  for (const key of lookupKeys(target)) {
    for (const slug of lookup.get(key) ?? []) {
      candidates.add(slug);
    }
  }

  if (candidates.size === 0) {
    return { status: 'unresolved' };
  }

  if (candidates.size > 1) {
    return { status: 'ambiguous', candidates: [...candidates].sort(compareText) };
  }

  return { status: 'resolved', slug: [...candidates][0] };
}

function lookupKeys(value: string) {
  const normalized = normalizeLookupValue(value);
  const baseName = normalized.split('/').pop() ?? normalized;
  const keys = new Set<string>();

  for (const item of [normalized, baseName]) {
    if (!item) {
      continue;
    }

    keys.add(item);
    keys.add(slugify(item));
    keys.add(item.replace(/[-_]+/g, ' '));
  }

  return [...keys].filter(Boolean);
}

function normalizeLookupValue(value: string) {
  const withoutFragment = stripFragment(value);
  const decoded = safeDecodeURIComponent(withoutFragment);

  return decoded
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/?notes\//i, '')
    .replace(/\/index$/i, '')
    .replace(/\.mdx?$/i, '')
    .replace(/\/+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function noteTargetFromHref(href: string) {
  return normalizeLookupValue(href);
}

function stripFragment(value: string) {
  return value.split('#')[0].trim();
}

function splitAlias(value: string) {
  const separatorIndex = value.indexOf('|');

  if (separatorIndex === -1) {
    return { target: value.trim(), label: '' };
  }

  return {
    target: value.slice(0, separatorIndex).trim(),
    label: value.slice(separatorIndex + 1).trim(),
  };
}

function normalizeAliases(...values: AliasValue[]) {
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  });
}

function cleanContext(line: string) {
  const context = line.trim().replace(/\s+/g, ' ');
  return context.length > 220 ? `${context.slice(0, 217)}...` : context;
}

function looksLikeFileTarget(target: string) {
  return FILE_EXTENSION_PATTERN.test(stripFragment(target));
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function compareBacklinks(left: NoteBacklink, right: NoteBacklink) {
  return (
    compareText(left.sourceSlug, right.sourceSlug) ||
    compareText(left.targetSlug, right.targetSlug) ||
    compareText(left.rawLink, right.rawLink) ||
    compareText(left.context ?? '', right.context ?? '')
  );
}

function compareUnresolvedLinks(left: UnresolvedNoteLink, right: UnresolvedNoteLink) {
  return (
    compareText(left.sourceSlug, right.sourceSlug) ||
    compareText(left.target, right.target) ||
    compareText(left.rawLink, right.rawLink) ||
    compareText(left.context ?? '', right.context ?? '')
  );
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'en');
}
