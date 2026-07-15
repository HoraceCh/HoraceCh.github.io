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
  id: string;
  slug: string;
  published: boolean;
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
  const candidates = entries.map((entry) => createEffectiveProject(entry, issues));
  if (issues.length > 0) throw new ProjectPublicationContractError(issues);
  const all = candidates.filter((project): project is EffectiveProject => project !== undefined);

  const byId = new Map<string, EffectiveProject>();
  const bySlug = new Map<string, EffectiveProject>();

  for (const project of all) {
    addUnique(byId, project.id, project, 'duplicate-project-id', 'id', issues);
    addUnique(bySlug, project.slug, project, 'duplicate-project-slug', 'slug', issues);
  }

  const routes = new Map<string, EffectiveProject>();
  for (const project of all.filter((item) => item.published)) {
    addUnique(routes, projectHref(project), project, 'duplicate-project-route', 'slug', issues);
  }

  const validRoutable = all.filter((project) => project.published && !hasError(project, issues));
  const routable = [...validRoutable].sort(compareProjectsForPublication);
  const listed = routable.filter((project) => project.entry.data.visibility !== 'hidden');

  return { all, routable, listed, byId, bySlug, issues };
}

export async function loadProjectPublicationModel() {
  const { getCollection } = await import('astro:content');
  return createProjectPublicationModel(await getCollection('projects'));
}

export function projectHref(project: Pick<EffectiveProject, 'slug'>) {
  return `/projects/${project.slug}/`;
}

export function compareProjectsForPublication(a: EffectiveProject, b: EffectiveProject) {
  const order = (a.entry.data.order ?? Number.MAX_SAFE_INTEGER) - (b.entry.data.order ?? Number.MAX_SAFE_INTEGER);
  if (order !== 0) return order;

  const date = dateValue(b.entry.data.date) - dateValue(a.entry.data.date);
  if (date !== 0) return date;

  return a.slug.localeCompare(b.slug, 'en');
}

export function selectHomepageProjects(model: ProjectPublicationModel, ids: readonly string[]) {
  return ids.flatMap((id) => {
    const project = model.byId.get(id);
    return project && model.listed.includes(project) ? [project] : [];
  });
}

function createEffectiveProject(entry: ProjectEntry, issues: PublicationIssue[]): EffectiveProject | undefined {
  const identity = entry.data as { id?: unknown; slug?: unknown; published?: unknown };
  const id = validateExplicitIdentity(entry, identity.id, 'id', issues);
  const slug = validateExplicitIdentity(entry, identity.slug, 'slug', issues);
  const published = validateExplicitPublished(entry, identity.published, issues);

  if (id === undefined || slug === undefined || published === undefined) {
    return undefined;
  }

  return { entry, id, slug, published, validationIssues: [] };
}

function validateExplicitIdentity(entry: ProjectEntry, value: unknown, field: 'id' | 'slug', issues: PublicationIssue[]) {
  if (value === undefined) {
    const code = field === 'id' ? 'missing-project-id' : 'missing-project-slug';
    issues.push(error(entry, code, `Project ${field} is required.`, field));
    return undefined;
  }
  if (typeof value !== 'string' || !isValidIdentity(value, field === 'id' ? 64 : 80)) {
    issues.push(error(entry, `invalid-project-${field}`, `Project ${field} must be lowercase kebab case.`, field));
    return undefined;
  }
  return value;
}

function validateExplicitPublished(entry: ProjectEntry, value: unknown, issues: PublicationIssue[]) {
  if (value === undefined) {
    issues.push(error(entry, 'missing-project-published', 'Project published is required.', 'published'));
    return undefined;
  }
  if (typeof value !== 'boolean') {
    issues.push(error(entry, 'invalid-project-published', 'Project published must be a boolean.', 'published'));
    return undefined;
  }
  return value;
}

function isValidIdentity(value: string, maxLength: number) {
  return value.length >= 1 && value.length <= maxLength && ID_PATTERN.test(value) && !value.includes('/');
}

function addUnique(map: Map<string, EffectiveProject>, key: string, project: EffectiveProject, code: string, field: string, issues: PublicationIssue[]) {
  const existing = map.get(key);
  if (existing) {
    addProjectIssue(project, error(project.entry, code, `Duplicate Project ${field}: ${key}.`, field, project), issues);
    addProjectIssue(existing, error(existing.entry, code, `Duplicate Project ${field}: ${key}.`, field, existing), issues);
    return;
  }
  map.set(key, project);
}

function hasError(project: EffectiveProject, issues: PublicationIssue[]) {
  return issues.some((issue) => issue.severity === 'error' && issue.source === project.entry.id);
}

function addProjectIssue(project: EffectiveProject, issue: PublicationIssue, issues: PublicationIssue[]) {
  issues.push(issue);
  project.validationIssues.push(issue);
}

function error(entry: ProjectEntry, code: string, message: string, field: string, project?: EffectiveProject): PublicationIssue {
  return { severity: 'error', code, message, source: entry.id, field, slug: project?.slug, id: project?.id };
}

function dateValue(value: Date | undefined) {
  return value instanceof Date && !Number.isNaN(value.valueOf()) ? value.valueOf() : 0;
}

export class ProjectPublicationContractError extends Error {
  readonly issues: readonly PublicationIssue[];

  constructor(issues: readonly PublicationIssue[]) {
    super(issues.map((issue) => issue.code).join(', '));
    this.name = 'ProjectPublicationContractError';
    this.issues = issues;
  }
}
