import type { CollectionEntry } from 'astro:content';

export type ProjectEntry = CollectionEntry<'projects'>;

export type PublicationIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  source: string;
  slug?: string;
  id?: string;
  field?: string;
};

export type EffectiveProject = {
  entry: ProjectEntry;
  id?: string;
  slug?: string;
  published: boolean;
  identitySource: { id: 'explicit' | 'filename' | 'unresolved'; slug: 'explicit' | 'filename' | 'unresolved' };
  validationIssues: PublicationIssue[];
};

export type ProjectPublicationModel = {
  all: EffectiveProject[];
  routable: EffectiveProject[];
  listed: EffectiveProject[];
  byId: Map<string, EffectiveProject>;
  bySlug: Map<string, EffectiveProject>;
  issues: PublicationIssue[];
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createProjectPublicationModel(entries: readonly ProjectEntry[]): ProjectPublicationModel {
  const issues: PublicationIssue[] = [];
  const all = entries.map((entry) => createEffectiveProject(entry, issues));
  const byId = new Map<string, EffectiveProject>();
  const bySlug = new Map<string, EffectiveProject>();

  for (const project of all) {
    addUnique(byId, project.id, project, 'duplicate-project-id', 'id', issues);
    addUnique(bySlug, project.slug, project, 'duplicate-project-slug', 'slug', issues);
  }

  const routes = new Map<string, EffectiveProject>();
  for (const project of all.filter((item) => item.published && item.slug)) {
    addUnique(routes, projectHref(project), project, 'duplicate-project-route', 'slug', issues);
  }

  const validRoutable = all.filter((project) => project.published && project.slug && !hasError(project, issues));
  const routable = [...validRoutable].sort(compareProjectsForPublication);
  const listed = routable.filter((project) => project.entry.data.visibility !== 'hidden');

  return { all, routable, listed, byId, bySlug, issues };
}

export async function loadProjectPublicationModel() {
  const { getCollection } = await import('astro:content');
  return createProjectPublicationModel(await getCollection('projects'));
}

export function projectHref(project: Pick<EffectiveProject, 'slug'>) {
  return project.slug ? `/projects/${project.slug}/` : '';
}

export function compareProjectsForPublication(a: EffectiveProject, b: EffectiveProject) {
  const order = (a.entry.data.order ?? Number.MAX_SAFE_INTEGER) - (b.entry.data.order ?? Number.MAX_SAFE_INTEGER);
  if (order !== 0) return order;

  const date = dateValue(b.entry.data.date) - dateValue(a.entry.data.date);
  if (date !== 0) return date;

  return (a.slug ?? '').localeCompare(b.slug ?? '', 'en');
}

export function selectHomepageProjects(model: ProjectPublicationModel, ids: readonly string[]) {
  return ids.flatMap((id) => {
    const project = model.byId.get(id);
    return project && model.listed.includes(project) ? [project] : [];
  });
}

function createEffectiveProject(entry: ProjectEntry, issues: PublicationIssue[]): EffectiveProject {
  const validationIssues: PublicationIssue[] = [];
  const addIssue = (issue: PublicationIssue) => {
    issues.push(issue);
    validationIssues.push(issue);
  };
  const fallback = safeFilenameSlug(entry.id);
  const explicitId = entry.data.id;
  const explicitSlug = entry.data.slug;

  if (explicitId === undefined) addIssue(warning(entry, 'missing-project-id', 'Project uses a filename-derived compatibility ID.', 'id'));
  if (explicitSlug === undefined) addIssue(warning(entry, 'missing-project-slug', 'Project uses a filename-derived compatibility slug.', 'slug'));
  if (entry.data.published === undefined) addIssue(warning(entry, 'missing-project-published', 'Project defaults to published for compatibility.', 'published'));

  const id = resolveIdentity(entry, explicitId, fallback, 'id', addIssue);
  const slug = resolveIdentity(entry, explicitSlug, fallback, 'slug', addIssue);
  const project: EffectiveProject = {
    entry,
    id,
    slug,
    published: entry.data.published ?? true,
    identitySource: { id: explicitId === undefined ? (id ? 'filename' : 'unresolved') : 'explicit', slug: explicitSlug === undefined ? (slug ? 'filename' : 'unresolved') : 'explicit' },
    validationIssues,
  };

  if (project.published && !project.slug) {
    addIssue(error(entry, 'unroutable-published-project', 'A published Project requires a resolvable slug.', 'slug', project));
  }

  return project;
}

function resolveIdentity(entry: ProjectEntry, explicit: string | undefined, fallback: string | undefined, field: 'id' | 'slug', addIssue: (issue: PublicationIssue) => void) {
  if (explicit !== undefined) {
    if (!isValidIdentity(explicit, field === 'id' ? 64 : 80)) {
      addIssue(error(entry, `invalid-project-${field}`, `Project ${field} must be lowercase kebab case.`, field));
      return undefined;
    }
    return explicit;
  }

  if (!fallback) {
    addIssue(error(entry, `unresolvable-project-${field}`, `Project ${field} cannot be derived from a nested or unsafe filename.`, field));
  }
  return fallback;
}

function safeFilenameSlug(id: string) {
  if (id.includes('/') || id.includes('\\')) return undefined;
  const name = id.replace(/\.mdx?$/i, '');
  return isValidIdentity(name, 80) ? name : undefined;
}

function isValidIdentity(value: string, maxLength: number) {
  return value.length >= 1 && value.length <= maxLength && ID_PATTERN.test(value) && !value.includes('/');
}

function addUnique(map: Map<string, EffectiveProject>, key: string | undefined, project: EffectiveProject, code: string, field: string, issues: PublicationIssue[]) {
  if (!key) return;
  const existing = map.get(key);
  if (existing) {
    issues.push(error(project.entry, code, `Duplicate Project ${field}: ${key}.`, field, project));
    issues.push(error(existing.entry, code, `Duplicate Project ${field}: ${key}.`, field, existing));
    return;
  }
  map.set(key, project);
}

function hasError(project: EffectiveProject, issues: PublicationIssue[]) {
  return issues.some((issue) => issue.severity === 'error' && issue.source === project.entry.id);
}

function warning(entry: ProjectEntry, code: string, message: string, field: string): PublicationIssue {
  return { severity: 'warning', code, message, source: entry.id, field };
}

function error(entry: ProjectEntry, code: string, message: string, field: string, project?: EffectiveProject): PublicationIssue {
  return { severity: 'error', code, message, source: entry.id, field, slug: project?.slug, id: project?.id };
}

function dateValue(value: Date | undefined) {
  return value instanceof Date && !Number.isNaN(value.valueOf()) ? value.valueOf() : 0;
}
