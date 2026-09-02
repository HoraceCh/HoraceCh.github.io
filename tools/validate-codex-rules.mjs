import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

import { selectRoute } from './codex-routing.mjs';

const REQUIRED_AGENT_SECTIONS = [
  '## Role and goal',
  '## Success criteria',
  '## Context and evidence',
  '## Constraints and permissions',
  '## Tools and validation',
  '## Output and stop rules',
];
const REQUIRED_AGENTS = [
  'content_ia_editor',
  'design_system_curator',
  'frontend_implementer',
  'obsidian_notes_pipeline',
  'project_architect',
  'qa_build_reviewer',
];
const REQUIRED_GITIGNORE_LINES = [
  '.codex/*',
  '!.codex/config.toml',
  '!.codex/agents/',
  '.codex/agents/*',
  '!.codex/agents/README.md',
  '!.codex/agents/*.toml',
  '.omo/*',
  '!.omo/rules/',
  '.omo/rules/*',
  '!.omo/rules/*.md',
];
const WORKFLOW_TOP_LEVEL_KEYS = [
  'schemaVersion',
  'scanBoundary',
  'execution',
  'ownership',
  'routingInput',
  'modelTiers',
  'criticalRisks',
];
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bBearer [A-Za-z0-9._-]{20,}\b/,
];

function normalizePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function unique(values) {
  return new Set(values).size === values.length;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectTopLevelJsonKeys(content) {
  const keys = [];
  let objectDepth = 0;
  let arrayDepth = 0;
  let previousToken = '';

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      let end = index + 1;
      let escaped = false;
      for (; end < content.length; end += 1) {
        const current = content[end];
        if (current === '"' && !escaped) {
          break;
        }
        escaped = current === '\\' && !escaped;
        if (current !== '\\') {
          escaped = false;
        }
      }
      const after = content.slice(end + 1).match(/^\s*(.)/)?.[1];
      if (objectDepth === 1 && arrayDepth === 0 && after === ':' && ['{', ','].includes(previousToken)) {
        keys.push(JSON.parse(content.slice(index, end + 1)));
      }
      index = end;
      previousToken = 'string';
      continue;
    }
    if (/\s/.test(character)) {
      continue;
    }
    if (character === '{') {
      objectDepth += 1;
    } else if (character === '}') {
      objectDepth -= 1;
    } else if (character === '[') {
      arrayDepth += 1;
    } else if (character === ']') {
      arrayDepth -= 1;
    }
    previousToken = character;
  }
  return keys;
}

export function validateWorkflowJsonStructure(content) {
  try {
    JSON.parse(content);
  } catch (error) {
    return [`Invalid workflow JSON: ${error instanceof Error ? error.message : String(error)}`];
  }

  const errors = [];
  const keys = collectTopLevelJsonKeys(content);
  for (const requiredKey of WORKFLOW_TOP_LEVEL_KEYS) {
    const count = keys.filter((key) => key === requiredKey).length;
    if (count !== 1) {
      errors.push(`Workflow top-level key must occur exactly once: ${requiredKey}`);
    }
  }
  for (const key of new Set(keys)) {
    if (!WORKFLOW_TOP_LEVEL_KEYS.includes(key)) {
      errors.push(`Unknown workflow top-level key: ${key}`);
    }
  }
  return errors;
}

function parseTomlFiles(paths) {
  const program = [
    'import json, pathlib, sys, tomllib',
    'result = {}',
    'for raw in sys.argv[1:]:',
    '    path = pathlib.Path(raw)',
    "    with path.open('rb') as handle:",
    '        result[str(path)] = tomllib.load(handle)',
    'print(json.dumps(result))',
  ].join('\n');

  const attempts = [
    ['python', ['-c', program, ...paths]],
    ['py', ['-3', '-c', program, ...paths]],
  ];
  for (const [command, args] of attempts) {
    const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
    if (result.status === 0) {
      return JSON.parse(result.stdout);
    }
  }
  throw new Error('TOML parsing requires Python 3.11+ with tomllib');
}

export function parseRuleFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new TypeError('Dynamic rule is missing frontmatter');
  }

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (key === 'globs') {
      frontmatter.globs = JSON.parse(raw);
    } else if (key === 'alwaysApply') {
      frontmatter.alwaysApply = raw === 'true';
    } else if (key === 'description') {
      frontmatter.description = raw.replace(/^['"]|['"]$/g, '');
    }
  }

  return frontmatter;
}

export function validateScanBoundaryDefinition(scanBoundary, knownFiles, trackedCodexFiles) {
  const errors = [];
  const policyFiles = scanBoundary?.policyFiles;
  const workflowFiles = scanBoundary?.workflowFiles ?? [];
  const excludedPrefixes = scanBoundary?.excludedPrefixes;
  const excludedFiles = scanBoundary?.excludedFiles;

  if (
    !Array.isArray(policyFiles) ||
    !Array.isArray(workflowFiles) ||
    !Array.isArray(excludedPrefixes) ||
    !Array.isArray(excludedFiles)
  ) {
    return ['scanBoundary requires policyFiles, workflowFiles, excludedPrefixes, and excludedFiles arrays'];
  }
  const allowedFiles = [...policyFiles, ...workflowFiles];
  if (!unique(allowedFiles)) {
    errors.push('scanBoundary allowlists contain duplicates');
  }

  const normalizedAllowedFiles = allowedFiles.map(normalizePath);
  for (const allowedFile of normalizedAllowedFiles) {
    if (
      isAbsolute(allowedFile) ||
      allowedFile.split('/').includes('..')
    ) {
      errors.push(`Allowed path must stay repository-relative: ${allowedFile}`);
    }
    if (!knownFiles.has(allowedFile)) {
      errors.push(`Allowed workflow file is missing: ${allowedFile}`);
    }
    if (excludedFiles.includes(allowedFile)) {
      errors.push(`Allowed file is also explicitly excluded: ${allowedFile}`);
    }
    const excludedPrefix = excludedPrefixes.find((prefix) => allowedFile.startsWith(prefix));
    if (excludedPrefix) {
      errors.push(`Allowed file falls under excluded prefix ${excludedPrefix}: ${allowedFile}`);
    }
  }

  for (const trackedFile of trackedCodexFiles.map(normalizePath)) {
    if (!normalizedAllowedFiles.includes(trackedFile)) {
      errors.push(`Tracked Codex policy is absent from allowlist: ${trackedFile}`);
    }
  }
  return errors;
}

function validateDynamicRules(rootDir, policyFiles, errors) {
  const ruleFiles = policyFiles.filter((file) => file.startsWith('.omo/rules/'));
  for (const ruleFile of ruleFiles) {
    const absolutePath = resolve(rootDir, ruleFile);
    if (!existsSync(absolutePath)) {
      continue;
    }
    try {
      const frontmatter = parseRuleFrontmatter(readFileSync(absolutePath, 'utf8'));
      if (!frontmatter.description) {
        errors.push(`Dynamic rule needs a description: ${ruleFile}`);
      }
      if (!Array.isArray(frontmatter.globs) || frontmatter.globs.length === 0) {
        errors.push(`Dynamic rule needs bounded globs: ${ruleFile}`);
      }
      if (frontmatter.alwaysApply !== false) {
        errors.push(`Dynamic rule must set alwaysApply: false: ${ruleFile}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Dynamic rule frontmatter failed for ${ruleFile}: ${message}`);
    }
  }
}

function validateMarkdownLinks(rootDir, policyFiles, errors) {
  const markdownFiles = policyFiles.filter((file) => file.endsWith('.md'));
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const markdownFile of markdownFiles) {
    const absolutePath = resolve(rootDir, markdownFile);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    for (const match of content.matchAll(linkPattern)) {
      const target = match[1].trim().replace(/^<|>$/g, '').split('#')[0].split('?')[0];
      if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
        continue;
      }
      const resolvedTarget = target.startsWith('/')
        ? resolve(rootDir, target.slice(1))
        : resolve(dirname(absolutePath), target);
      if (!existsSync(resolvedTarget)) {
        errors.push(`Broken local link in ${markdownFile}: ${target}`);
      }
    }
  }
}

function validatePolicyText(rootDir, policyFiles, packageScripts, errors) {
  const stalePhrases = [
    'Start at Terra Medium; escalate to Sol High only',
    'Use Luna Low only for explicit',
  ];
  for (const policyFile of policyFiles) {
    const absolutePath = resolve(rootDir, policyFile);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);
    if (lines.some((line) => /[ \t]+$/.test(line))) {
      errors.push(`Trailing whitespace found in policy file: ${policyFile}`);
    }
    if (/\b[A-Za-z]:\\Users\\|\/(?:Users|home)\//.test(content)) {
      errors.push(`User-specific absolute path found in policy file: ${policyFile}`);
    }
    if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
      errors.push(`Secret-like value found in policy file: ${policyFile}`);
    }
    for (const phrase of stalePhrases) {
      if (content.includes(phrase)) {
        errors.push(`Stale routing phrase found in ${policyFile}: ${phrase}`);
      }
    }
    for (const match of content.matchAll(/npm run ([a-zA-Z0-9:._-]+)/g)) {
      if (!(match[1] in packageScripts)) {
        errors.push(`Unknown npm script referenced in ${policyFile}: ${match[1]}`);
      }
    }
  }
}

function validateToml(rootDir, config, errors) {
  const tomlFiles = config.scanBoundary.policyFiles.filter((file) => file.endsWith('.toml'));
  const absolutePaths = tomlFiles.map((file) => resolve(rootDir, file));
  if (absolutePaths.some((path) => !existsSync(path))) {
    return;
  }

  let parsed;
  try {
    parsed = parseTomlFiles(absolutePaths);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return;
  }

  const rootConfigPath = resolve(rootDir, '.codex/config.toml');
  const rootConfig = parsed[rootConfigPath];
  if (!rootConfig) {
    errors.push('Missing parsed .codex/config.toml');
    return;
  }
  if (
    rootConfig.model !== config.execution.root.model ||
    rootConfig.model_reasoning_effort !== config.execution.root.reasoning
  ) {
    errors.push('Root model route does not match config/codex-workflow.json');
  }
  if (rootConfig.agents?.max_concurrent_threads_per_session !== config.execution.maxConcurrentAgents) {
    errors.push('Root agent concurrency does not match config/codex-workflow.json');
  }

  const agentDocuments = absolutePaths
    .filter((path) => normalizePath(relative(rootDir, path)).startsWith('.codex/agents/'))
    .map((path) => parsed[path]);
  const names = agentDocuments.map((agent) => agent.name).sort();
  if (!isDeepStrictEqual(names, REQUIRED_AGENTS)) {
    errors.push(`Agent set must contain exactly six owners: ${names.join(', ')}`);
  }
  for (const agent of agentDocuments) {
    if (!agent.description || !agent.sandbox_mode || !agent.developer_instructions) {
      errors.push(`Agent ${String(agent.name)} is missing required fields`);
      continue;
    }
    for (const section of REQUIRED_AGENT_SECTIONS) {
      if (!agent.developer_instructions.includes(section)) {
        errors.push(`Agent ${agent.name} is missing prompt section: ${section}`);
      }
    }
    if (agent.name === 'project_architect') {
      if (agent.model !== 'gpt-5.6-sol' || agent.model_reasoning_effort !== 'high') {
        errors.push('project_architect must remain pinned to gpt-5.6-sol/high');
      }
    } else if ('model' in agent || 'model_reasoning_effort' in agent) {
      errors.push(`Variable-route agent must not pin model or reasoning: ${agent.name}`);
    }
  }
}

function validateModelCapabilities(config, errors) {
  const capabilities = config.execution?.runtimeReasoningCapabilities;
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    errors.push('execution.runtimeReasoningCapabilities must be an object');
    return;
  }

  for (const [tier, policy] of Object.entries(config.modelTiers ?? {})) {
    const available = capabilities[policy.model];
    if (!Array.isArray(available)) {
      errors.push(`Missing runtime reasoning capabilities for ${policy.model}`);
      continue;
    }
    for (const reasoning of policy.reasoning ?? []) {
      if (!available.includes(reasoning)) {
        errors.push(`Unsupported automatic reasoning tier ${tier}/${reasoning}`);
      }
    }
    if ((policy.reasoning ?? []).includes('ultra')) {
      errors.push(`Ultra must remain session-only, not an automatic ${tier} route`);
    }
  }

  const rootCapabilities = capabilities[config.execution.root.model] ?? [];
  if (!rootCapabilities.includes(config.execution.root.reasoning)) {
    errors.push('Root reasoning is not supported by the declared runtime capabilities');
  }
}

function validateRoutingCases(rootDir, errors) {
  const casesPath = resolve(rootDir, 'tests/codex-routing-cases.json');
  if (!existsSync(casesPath)) {
    errors.push('Missing representative routing cases');
    return 0;
  }
  const cases = readJson(casesPath);
  if (!Array.isArray(cases) || cases.length < 12) {
    errors.push('Routing evaluation set must contain at least 12 cases');
    return Array.isArray(cases) ? cases.length : 0;
  }
  if (!unique(cases.map((fixture) => fixture.id))) {
    errors.push('Routing evaluation case ids must be unique');
  }
  for (const fixture of cases) {
    try {
      const actual = selectRoute(fixture.input);
      if (!isDeepStrictEqual(actual, fixture.expected)) {
        errors.push(`Routing evaluation mismatch: ${fixture.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Routing evaluation failed for ${String(fixture.id)}: ${message}`);
    }
  }
  return cases.length;
}

export function validateWorkflow(rootDir = process.cwd()) {
  const errors = [];
  const warnings = [];
  const configPath = resolve(rootDir, 'config/codex-workflow.json');
  if (!existsSync(configPath)) {
    return { ok: false, errors: ['Missing config/codex-workflow.json'], warnings, checkedFiles: 0, routingCases: 0 };
  }

  const configContent = readFileSync(configPath, 'utf8');
  errors.push(...validateWorkflowJsonStructure(configContent));
  const config = JSON.parse(configContent);
  if (config.schemaVersion !== 1) {
    errors.push(`Unsupported workflow schemaVersion: ${String(config.schemaVersion)}`);
  }
  const policyFiles = config.scanBoundary?.policyFiles ?? [];
  const workflowFiles = config.scanBoundary?.workflowFiles ?? [];
  const allowedFiles = [...policyFiles, ...workflowFiles];
  const knownFiles = new Set(
    allowedFiles.filter((file) => existsSync(resolve(rootDir, file))).map(normalizePath),
  );
  const gitResult = spawnSync('git', ['ls-files', '--', '.codex'], {
    cwd: rootDir,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (gitResult.status !== 0) {
    errors.push('Unable to enumerate tracked .codex policy files');
  }
  const trackedCodexFiles = gitResult.status === 0
    ? gitResult.stdout.split(/\r?\n/).filter(Boolean)
    : [];
  errors.push(
    ...validateScanBoundaryDefinition(config.scanBoundary, knownFiles, trackedCodexFiles),
  );

  const packageJson = readJson(resolve(rootDir, 'package.json'));
  const packageScripts = packageJson.scripts ?? {};
  for (const script of ['route:codex', 'test:routing', 'rules:validate']) {
    if (!(script in packageScripts)) {
      errors.push(`Missing package script: ${script}`);
    }
  }

  const gitignore = readFileSync(resolve(rootDir, '.gitignore'), 'utf8').split(/\r?\n/);
  for (const line of REQUIRED_GITIGNORE_LINES) {
    if (!gitignore.includes(line)) {
      errors.push(`.gitignore is missing scan-boundary rule: ${line}`);
    }
  }

  validateDynamicRules(rootDir, policyFiles, errors);
  validateMarkdownLinks(rootDir, policyFiles, errors);
  validatePolicyText(rootDir, policyFiles, packageScripts, errors);
  validateModelCapabilities(config, errors);
  validateToml(rootDir, config, errors);
  const routingCases = validateRoutingCases(rootDir, errors);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checkedFiles: knownFiles.size,
    routingCases,
  };
}

function main() {
  try {
    const rootDir = process.cwd();
    if (process.argv.includes('--list-policy-files')) {
      const config = readJson(resolve(rootDir, 'config/codex-workflow.json'));
      process.stdout.write(`${config.scanBoundary.policyFiles.join('\n')}\n`);
      return;
    }

    const result = validateWorkflow(rootDir);
    if (!result.ok) {
      for (const error of result.errors) {
        process.stderr.write(`ERROR ${error}\n`);
      }
      process.exitCode = 1;
      return;
    }
    process.stdout.write(
      `Codex workflow valid: ${result.checkedFiles} workflow files, ${result.routingCases} routing cases\n`,
    );
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`ERROR ${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
