import { slugify } from './slugify';
import { noteHref, type EffectiveNote } from './notePublication';

export type NoteEntry = EffectiveNote;

export interface NoteModuleNode {
  title: string;
  segments: string[];
  slugPath: string;
  href: string;
  indexNote?: NoteEntry;
  notes: NoteEntry[];
  childModules: NoteModuleNode[];
  ordinaryNoteCount: number;
  indexNoteCount: number;
  allNoteCount: number;
  latestDate?: Date;
}

export interface NoteBreadcrumbItem {
  label: string;
  href?: string;
}

interface MutableNoteModuleNode extends NoteModuleNode {
  childMap: Map<string, MutableNoteModuleNode>;
}

const indexRoles = new Set(['collection-index', 'module-index']);
const archiveSegment = '_archive';

export { noteHref };

export function isNoteIndexEntry(note: NoteEntry) {
  return note.data.isIndex || indexRoles.has(note.data.noteRole);
}

export function isOrdinaryNote(note: NoteEntry) {
  return !isNoteIndexEntry(note);
}

export function isArchiveModuleSegments(segments: string[]) {
  return segments.some((segment) => cleanSegment(segment) === archiveSegment);
}

export function isArchivedNote(note: NoteEntry) {
  const modulePath = Array.isArray(note.data.modulePath)
    ? note.data.modulePath.map(cleanSegment).filter(Boolean)
    : [];

  return isArchiveModuleSegments(modulePath);
}

export function isPublicBrowseNote(note: NoteEntry) {
  return !isArchivedNote(note);
}

export function getNoteHierarchySegments(note: NoteEntry) {
  const modulePath = Array.isArray(note.data.modulePath)
    ? note.data.modulePath.map(cleanSegment).filter(Boolean)
    : [];

  if (modulePath.length > 0) {
    return modulePath;
  }

  const fallbackSegments = [note.data.collection, note.data.module].map(cleanSegment).filter(Boolean);
  return [...new Set(fallbackSegments)];
}

export function noteModuleSlugPath(segments: string[]) {
  return segments.map(slugify).join('/');
}

export function noteModuleHref(segments: string[]) {
  const slugPath = noteModuleSlugPath(segments);
  return slugPath ? `/notes/collections/${slugPath}/` : '/notes/collections/';
}

export function sortNotesForHierarchy(notes: NoteEntry[]) {
  return [...notes].sort((a, b) => {
    const orderCompare = (a.data.order ?? 999) - (b.data.order ?? 999);
    if (orderCompare !== 0) return orderCompare;

    const titleCompare = a.data.title.localeCompare(b.data.title);
    if (titleCompare !== 0) return titleCompare;

    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}

export function buildNoteModuleTree(notes: NoteEntry[]) {
  const rootNodes: MutableNoteModuleNode[] = [];
  const nodesByPath = new Map<string, MutableNoteModuleNode>();

  for (const note of notes) {
    if (isArchivedNote(note)) {
      continue;
    }

    const segments = getNoteHierarchySegments(note);

    if (segments.length === 0) {
      continue;
    }

    let parent: MutableNoteModuleNode | undefined;

    segments.forEach((_, index) => {
      const currentSegments = segments.slice(0, index + 1);
      const slugPath = noteModuleSlugPath(currentSegments);
      let node = nodesByPath.get(slugPath);

      if (!node) {
        node = createModuleNode(currentSegments);
        nodesByPath.set(slugPath, node);

        if (parent) {
          parent.childModules.push(node);
          parent.childMap.set(slugPath, node);
        } else {
          rootNodes.push(node);
        }
      }

      parent = node;
    });

    const owningNode = nodesByPath.get(noteModuleSlugPath(segments));
    if (!owningNode) {
      continue;
    }

    if (isNoteIndexEntry(note)) {
      owningNode.indexNote = note;
    } else {
      owningNode.notes.push(note);
    }
  }

  rootNodes.forEach(finalizeModuleNode);
  return rootNodes;
}

export function flattenNoteModuleTree(nodes: NoteModuleNode[]) {
  const flattened: NoteModuleNode[] = [];

  const visit = (node: NoteModuleNode) => {
    flattened.push(node);
    node.childModules.forEach(visit);
  };

  nodes.forEach(visit);
  return flattened;
}

export function buildNoteBreadcrumbs(note: NoteEntry) {
  const segments = getNoteHierarchySegments(note);

  if (isArchivedNote(note)) {
    return [
      { label: 'Notes', href: '/notes/' },
      { label: 'Archived' },
      { label: note.data.title },
    ] satisfies NoteBreadcrumbItem[];
  }

  const linkedSegments = getBreadcrumbHierarchySegments(note, segments);

  return [
    { label: 'Notes', href: '/notes/' },
    ...linkedSegments.map((segment, index) => ({
      label: segment,
      href: noteModuleHref(linkedSegments.slice(0, index + 1)),
    })),
    { label: note.data.title },
  ] satisfies NoteBreadcrumbItem[];
}

function createModuleNode(segments: string[]): MutableNoteModuleNode {
  const slugPath = noteModuleSlugPath(segments);

  return {
    title: segments[segments.length - 1],
    segments,
    slugPath,
    href: noteModuleHref(segments),
    notes: [],
    childModules: [],
    childMap: new Map(),
    ordinaryNoteCount: 0,
    indexNoteCount: 0,
    allNoteCount: 0,
  };
}

function finalizeModuleNode(node: MutableNoteModuleNode) {
  node.childModules.forEach(finalizeModuleNode);
  node.childModules.sort((a, b) => a.title.localeCompare(b.title));
  node.notes = sortNotesForHierarchy(node.notes);

  const childOrdinaryCount = node.childModules.reduce((total, child) => total + child.ordinaryNoteCount, 0);
  const childIndexCount = node.childModules.reduce((total, child) => total + child.indexNoteCount, 0);
  const ownIndexCount = node.indexNote ? 1 : 0;
  const candidateDates = [
    node.indexNote?.data.updated ?? node.indexNote?.data.date,
    ...node.notes.map((note) => note.data.updated ?? note.data.date),
    ...node.childModules.map((child) => child.latestDate),
  ].filter((date): date is Date => date instanceof Date);

  node.ordinaryNoteCount = node.notes.length + childOrdinaryCount;
  node.indexNoteCount = ownIndexCount + childIndexCount;
  node.allNoteCount = node.ordinaryNoteCount + node.indexNoteCount;
  node.latestDate = candidateDates.sort((a, b) => b.valueOf() - a.valueOf())[0];
}

function getBreadcrumbHierarchySegments(note: NoteEntry, segments: string[]) {
  if (!isNoteIndexEntry(note) || segments.length === 0) {
    return segments;
  }

  const finalSegment = segments[segments.length - 1];

  if (slugify(finalSegment) === slugify(note.data.title)) {
    return segments.slice(0, -1);
  }

  return segments;
}

function cleanSegment(value: string | undefined) {
  return value?.trim() ?? '';
}
