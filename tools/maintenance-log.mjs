#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAINTENANCE_RELATIVE = path.join('.agents', 'maintenance');

export const REQUIRED_FIELDS = [
  'schema_version',
  'event_id',
  'system',
  'kind',
  'category',
  'status',
  'risk',
  'environment',
  'occurred_at',
  'recorded_at',
  'actor_type',
  'actor',
  'owner',
  'correlation_id',
  'issue_refs',
  'pr_refs',
  'commit_refs',
  'affected_paths',
  'public_safe',
];

export const BODY_SECTIONS = [
  'Summary',
  'Reason',
  'Actions',
  'Validation',
  'Result',
  'Rollback',
  'Follow-up',
  'Notes',
];

export const ENUMS = {
  kind: ['change', 'release', 'operation', 'incident', 'recovery', 'migration', 'security', 'governance'],
  category: [
    'site-structure',
    'content-publication',
    'notes-pipeline',
    'build-dependency',
    'deployment-release',
    'security-privacy',
    'agent-governance',
    'incident-response',
    'migration',
    'other',
  ],
  status: ['planned', 'in-progress', 'completed', 'failed', 'rolled-back', 'superseded'],
  risk: ['low', 'medium', 'high', 'critical'],
  environment: ['local', 'repository', 'preview', 'production'],
  actor_type: ['human', 'agent', 'automation', 'service'],
};

const LIST_FIELDS = ['issue_refs', 'pr_refs', 'commit_refs', 'affected_paths'];
const EVENT_ID = /^WEB-(\d{8})-(\d{4})$/;
const INCIDENT_ID = /^WEB-INC-(\d{8})-(\d{4})$/;
const CORRELATION_ID = /^XREL-\d{8}-[A-Z0-9]{12}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/;

function scalar(raw, lineNumber) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (value === '[]') return [];
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error('not an array');
      return parsed;
    } catch {
      throw new Error(`line ${lineNumber}: inline lists must be valid JSON arrays`);
    }
  }
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`line ${lineNumber}: invalid quoted string`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`line ${lineNumber}: invalid quoted string`);
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function parseMaintenanceDocument(text) {
  const normalized = text.replaceAll('\r\n', '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error('missing or malformed YAML frontmatter');

  const frontmatter = {};
  let listKey = null;
  const lines = match[1].split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 2;
    if (!line.trim()) continue;

    const listItem = line.match(/^\s{2}-\s+(.+)$/);
    if (listItem) {
      if (!listKey) throw new Error(`line ${lineNumber}: list item has no field`);
      frontmatter[listKey].push(scalar(listItem[1], lineNumber));
      continue;
    }

    const field = line.match(/^([a-z][a-z0-9_]*):(?:\s*(.*))?$/);
    if (!field) throw new Error(`line ${lineNumber}: unsupported frontmatter syntax`);
    const [, key, raw = ''] = field;
    if (Object.hasOwn(frontmatter, key)) throw new Error(`line ${lineNumber}: duplicate field ${key}`);
    if (raw === '') {
      frontmatter[key] = [];
      listKey = key;
    } else {
      frontmatter[key] = scalar(raw, lineNumber);
      listKey = null;
    }
  }

  return { frontmatter, body: normalized.slice(match[0].length) };
}

function isPublicSafeText(text) {
  const findings = [];
  const checks = [
    [/\b[A-Za-z]:[\\/][^\s`"']*/g, 'Windows absolute path'],
    [/\\\\[A-Za-z0-9._-]+\\[A-Za-z0-9$._-]+/g, 'UNC absolute path'],
    [/\b(?:api[_-]?key|token|(?:access|refresh|oauth|id)[_-]?token|password|passwd|secret|(?:client|session|oauth)[_-]?secret|oauth[_-]?client[_-]?secret|credentials?|authorization|cookie)\b\s*[:=]\s*["']?[^\s"'`]{4,}/gi, 'credential-shaped assignment'],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, 'private-key material'],
    [/(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?/gi, 'private network endpoint'],
  ];
  for (const [pattern, label] of checks) {
    if (pattern.test(text)) findings.push(label);
  }
  return findings;
}

function validateTimestamp(value, field, errors) {
  if (typeof value !== 'string' || !TIMESTAMP.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${field} must be an ISO 8601 timestamp with an explicit timezone`);
  }
}

function validateBody(body, errors) {
  const headings = [...body.matchAll(/^## ([^\n]+)$/gm)].map((match) => match[1]);
  if (headings.length !== BODY_SECTIONS.length || headings.some((heading, index) => heading !== BODY_SECTIONS[index])) {
    errors.push(`body sections must appear exactly once in canonical order: ${BODY_SECTIONS.join(', ')}`);
    return;
  }

  for (let index = 0; index < BODY_SECTIONS.length; index += 1) {
    const heading = BODY_SECTIONS[index];
    const next = BODY_SECTIONS[index + 1];
    const start = body.indexOf(`## ${heading}`) + heading.length + 3;
    const end = next ? body.indexOf(`## ${next}`, start) : body.length;
    if (!body.slice(start, end).trim()) errors.push(`${heading} section must not be empty`);
  }
}

export function validateMaintenanceDocument(text, filePath = 'record.md') {
  const errors = [];
  let parsed;
  try {
    parsed = parseMaintenanceDocument(text);
  } catch (error) {
    return { errors: [error.message], record: null };
  }

  const { frontmatter, body } = parsed;
  const keys = Object.keys(frontmatter);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(frontmatter, field)) errors.push(`missing required field ${field}`);
  }
  for (const field of keys) {
    if (!REQUIRED_FIELDS.includes(field)) errors.push(`unknown field ${field}`);
  }

  if (frontmatter.schema_version !== '2.0') errors.push('schema_version must be the string "2.0"');
  if (frontmatter.system !== 'Horace_Website') errors.push('system must be Horace_Website');
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (!allowed.includes(frontmatter[field])) errors.push(`${field} must be one of: ${allowed.join(', ')}`);
  }

  const eventMatch = typeof frontmatter.event_id === 'string' && frontmatter.event_id.match(EVENT_ID);
  const incidentMatch = typeof frontmatter.event_id === 'string' && frontmatter.event_id.match(INCIDENT_ID);
  if (!eventMatch && !incidentMatch) errors.push('event_id must use a canonical WEB- or WEB-INC- format');

  const parentDirectory = path.basename(path.dirname(filePath));
  if (parentDirectory === 'events' && !eventMatch) errors.push('records in events must use a WEB- event ID');
  if (parentDirectory === 'incidents' && !incidentMatch) errors.push('records in incidents must use a WEB-INC- incident ID');
  if (incidentMatch && frontmatter.kind !== 'incident') errors.push('WEB-INC- records must use kind incident');
  if (frontmatter.kind === 'incident' && !incidentMatch) errors.push('kind incident must use a WEB-INC- ID');
  if ((eventMatch || incidentMatch) && path.basename(filePath) !== `${frontmatter.event_id}.md`) {
    errors.push('record filename must match event_id');
  }

  validateTimestamp(frontmatter.occurred_at, 'occurred_at', errors);
  validateTimestamp(frontmatter.recorded_at, 'recorded_at', errors);

  if (frontmatter.correlation_id !== '' && (typeof frontmatter.correlation_id !== 'string' || !CORRELATION_ID.test(frontmatter.correlation_id))) {
    errors.push('correlation_id must be empty or use the canonical XREL- format');
  }

  for (const field of LIST_FIELDS) {
    const value = frontmatter[field];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
      errors.push(`${field} must be a list of non-empty strings`);
    }
  }

  if (typeof frontmatter.actor !== 'string' || !frontmatter.actor.trim()) errors.push('actor must be a non-empty string');
  if (typeof frontmatter.owner !== 'string' || !frontmatter.owner.trim()) errors.push('owner must be a non-empty string');
  if (frontmatter.public_safe !== true) errors.push('public_safe must be true');

  if (Array.isArray(frontmatter.affected_paths)) {
    for (const affectedPath of frontmatter.affected_paths) {
      if (
        typeof affectedPath !== 'string'
        || !affectedPath
        || affectedPath.includes('\\')
        || affectedPath.startsWith('/')
        || affectedPath.startsWith('~')
        || /^[A-Za-z]:/.test(affectedPath)
        || affectedPath.split('/').includes('..')
      ) {
        errors.push(`affected_paths contains an unsafe repository path: ${String(affectedPath)}`);
      }
    }
  }

  validateBody(body, errors);
  for (const finding of isPublicSafeText(text)) errors.push(`public-safety check rejected ${finding}`);

  return { errors, record: { ...frontmatter, body, filePath } };
}

async function recordFiles(root) {
  const maintenanceRoot = path.join(root, MAINTENANCE_RELATIVE);
  const files = [];
  for (const directory of ['events', 'incidents']) {
    const target = path.join(maintenanceRoot, directory);
    let entries = [];
    try {
      entries = await readdir(target, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) files.push(path.join(target, entry.name));
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

export async function validateRepository(root = SCRIPT_ROOT, selectedFiles = null) {
  const files = selectedFiles ?? await recordFiles(root);
  const records = [];
  const errors = [];
  for (const filePath of files) {
    const text = await readFile(filePath, 'utf8');
    const result = validateMaintenanceDocument(text, filePath);
    if (result.record) records.push(result.record);
    for (const error of result.errors) errors.push(`${path.relative(root, filePath).replaceAll('\\', '/')}: ${error}`);
  }

  const ids = new Map();
  for (const record of records) {
    if (typeof record.event_id !== 'string') continue;
    const locations = ids.get(record.event_id) ?? [];
    locations.push(path.relative(root, record.filePath).replaceAll('\\', '/'));
    ids.set(record.event_id, locations);
  }
  for (const [eventId, locations] of ids) {
    if (locations.length > 1) errors.push(`duplicate event_id ${eventId}: ${locations.join(', ')}`);
  }

  return { errors, records, files };
}

function formatValidationFailure(errors) {
  return `Maintenance log validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n${errors.map((error) => `- ${error}`).join('\n')}`;
}

function option(options, name, fallback) {
  const value = options[name];
  return Array.isArray(value) ? value.at(-1) : value ?? fallback;
}

function optionList(options, name) {
  const value = options[name];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseArgs(args) {
  const options = {};
  const positionals = [];
  const flags = new Set(['incident']);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (flags.has(name)) {
      options[name] = true;
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`missing value for --${name}`);
    index += 1;
    if (options[name] === undefined) options[name] = value;
    else if (Array.isArray(options[name])) options[name].push(value);
    else options[name] = [options[name], value];
  }
  return { options, positionals };
}

function dateStamp(timestamp) {
  return timestamp.slice(0, 10).replaceAll('-', '');
}

export async function nextEventId(root = SCRIPT_ROOT, { incident = false, timestamp = new Date().toISOString() } = {}) {
  const stamp = dateStamp(timestamp);
  const pattern = incident ? INCIDENT_ID : EVENT_ID;
  let maximum = 0;
  for (const filePath of await recordFiles(root)) {
    const text = await readFile(filePath, 'utf8');
    const match = text.match(/^event_id:\s*["']?([^\s"']+)/m);
    const idMatch = match?.[1]?.match(pattern);
    if (idMatch && idMatch[1] === stamp) maximum = Math.max(maximum, Number(idMatch[2]));
  }
  const prefix = incident ? 'WEB-INC-' : 'WEB-';
  return `${prefix}${stamp}-${String(maximum + 1).padStart(4, '0')}`;
}

export function newCorrelationId(timestamp = new Date().toISOString()) {
  return `XREL-${dateStamp(timestamp)}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
}

function quoted(value) {
  return JSON.stringify(String(value));
}

function listValue(values) {
  return JSON.stringify(values.map(String));
}

export function canonicalGeneratedText(text) {
  return String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\n+$/, '') + '\n';
}

function render(template, values) {
  const unresolved = new Set();
  const output = template.replace(/{{([^}]+)}}/g, (placeholder, key) => {
    if (!Object.hasOwn(values, key)) {
      unresolved.add(key);
      return placeholder;
    }
    return values[key];
  });
  if (unresolved.size) throw new Error(`template has unresolved values: ${[...unresolved].join(', ')}`);
  return canonicalGeneratedText(output);
}

export async function createRecord(root = SCRIPT_ROOT, options = {}) {
  const incident = options.incident === true;
  const now = new Date().toISOString();
  const occurredAt = option(options, 'occurred-at', now);
  const eventId = await nextEventId(root, { incident, timestamp: occurredAt });
  const maintenanceRoot = path.join(root, MAINTENANCE_RELATIVE);
  const directory = path.join(maintenanceRoot, incident ? 'incidents' : 'events');
  const filePath = path.join(directory, `${eventId}.md`);
  const templatePath = path.join(maintenanceRoot, 'templates', incident ? 'incident.md' : 'event.md');
  const template = await readFile(templatePath, 'utf8');
  const summary = option(options, 'summary', incident ? 'Describe the incident.' : 'Describe the maintenance event.');

  const output = render(template, {
    schema_version: quoted('2.0'),
    event_id: quoted(eventId),
    system: quoted('Horace_Website'),
    kind: quoted(incident ? 'incident' : option(options, 'kind', 'change')),
    category: quoted(incident ? option(options, 'category', 'incident-response') : option(options, 'category', 'other')),
    status: quoted(option(options, 'status', incident ? 'in-progress' : 'planned')),
    risk: quoted(option(options, 'risk', incident ? 'medium' : 'low')),
    environment: quoted(option(options, 'environment', 'repository')),
    occurred_at: quoted(occurredAt),
    recorded_at: quoted(option(options, 'recorded-at', now)),
    actor_type: quoted(option(options, 'actor-type', 'agent')),
    actor: quoted(option(options, 'actor', 'Codex')),
    owner: quoted(option(options, 'owner', 'Horace_Website maintainers')),
    correlation_id: quoted(option(options, 'correlation-id', '')),
    issue_refs: listValue(optionList(options, 'issue-ref')),
    pr_refs: listValue(optionList(options, 'pr-ref')),
    commit_refs: listValue(optionList(options, 'commit-ref')),
    affected_paths: listValue(optionList(options, 'affected-path')),
    public_safe: 'true',
    title: summary.replaceAll('\n', ' ').trim(),
    summary,
    reason: option(options, 'reason', 'Record this maintenance event.'),
    actions: option(options, 'actions', 'Created the initial record from the canonical template.'),
    validation: option(options, 'validation', 'Pending.'),
    result: option(options, 'result', 'Pending.'),
    rollback: option(options, 'rollback', 'Not applicable for this record-only draft.'),
    follow_up: option(options, 'follow-up', 'Complete the record before marking it completed.'),
    notes: option(options, 'notes', 'None.'),
  });

  const validation = validateMaintenanceDocument(output, filePath);
  if (validation.errors.length) throw new Error(formatValidationFailure(validation.errors));
  await mkdir(directory, { recursive: true });
  await writeFile(filePath, output, { encoding: 'utf8', flag: 'wx' });
  return { eventId, filePath };
}

function summaryOf(record) {
  const match = record.body.match(/^## Summary\s*\n+([\s\S]*?)(?=\n## Reason$)/m);
  return (match?.[1] ?? '').trim().replace(/\s+/g, ' ');
}

function tableCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export async function rebuildIndex(root = SCRIPT_ROOT) {
  const validation = await validateRepository(root);
  if (validation.errors.length) throw new Error(formatValidationFailure(validation.errors));
  const maintenanceRoot = path.join(root, MAINTENANCE_RELATIVE);
  const records = [...validation.records].sort((left, right) => {
    const byTime = String(right.occurred_at).localeCompare(String(left.occurred_at));
    return byTime || String(left.event_id).localeCompare(String(right.event_id));
  });

  const lines = [
    '<!-- Generated by tools/maintenance-log.mjs. Do not edit manually. -->',
    '# Maintenance Index',
    '',
    'This is a deterministic discovery view generated from canonical event files. It is not a canonical event record.',
    '',
    '[Legacy System Maintenance Log v1](../changelog.md) remains immutable and is not duplicated here.',
    '',
    '## Records',
    '',
  ];
  if (!records.length) {
    lines.push('No v2 maintenance records.');
  } else {
    lines.push('| Event ID | Occurred | Kind | Category | Status | Risk | Summary |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const record of records) {
      const relative = path.relative(maintenanceRoot, record.filePath).replaceAll('\\', '/');
      lines.push(`| [${tableCell(record.event_id)}](${relative}) | ${tableCell(record.occurred_at)} | ${tableCell(record.kind)} | ${tableCell(record.category)} | ${tableCell(record.status)} | ${tableCell(record.risk)} | ${tableCell(summaryOf(record))} |`);
    }
  }
  const output = canonicalGeneratedText(lines.join('\n'));
  await writeFile(path.join(maintenanceRoot, 'index.md'), output, 'utf8');
  return { count: records.length, output };
}

function help() {
  return [
    'System Maintenance Log v2',
    '',
    'Commands:',
    '  create [--incident] [--kind VALUE] [--category VALUE] [--status VALUE]',
    '         [--risk VALUE] [--environment VALUE] [--occurred-at ISO8601]',
    '         [--actor-type VALUE] [--actor VALUE] [--owner VALUE]',
    '         [--correlation-id XREL-...] [--affected-path PATH] [--summary TEXT]',
    '  next-id [--incident]',
    '  correlation-id',
    '  validate [record paths...]',
    '  rebuild-index',
    '',
    'All commands accept --root PATH for isolated validation or tests.',
  ].join('\n');
}

async function main(argv = process.argv.slice(2)) {
  const [command = 'help', ...args] = argv;
  const { options, positionals } = parseArgs(args);
  const root = path.resolve(option(options, 'root', SCRIPT_ROOT));

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(help());
    return;
  }
  if (command === 'next-id') {
    console.log(await nextEventId(root, { incident: options.incident === true }));
    return;
  }
  if (command === 'correlation-id') {
    console.log(newCorrelationId());
    return;
  }
  if (command === 'create') {
    const created = await createRecord(root, options);
    console.log(`Created ${created.eventId} at ${path.relative(root, created.filePath).replaceAll('\\', '/')}`);
    return;
  }
  if (command === 'validate') {
    const selected = positionals.length ? positionals.map((file) => path.resolve(root, file)) : null;
    const validation = await validateRepository(root, selected);
    if (validation.errors.length) throw new Error(formatValidationFailure(validation.errors));
    console.log(`Validated ${validation.records.length} maintenance record(s).`);
    return;
  }
  if (command === 'rebuild-index') {
    const result = await rebuildIndex(root);
    console.log(`Rebuilt maintenance index from ${result.count} record(s).`);
    return;
  }
  throw new Error(`unknown command: ${command}\n\n${help()}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
