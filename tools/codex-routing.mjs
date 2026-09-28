import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WORKFLOW_PATH = new URL('../config/codex-workflow.json', import.meta.url);
const workflow = JSON.parse(readFileSync(WORKFLOW_PATH, 'utf8'));

const REQUIRED_FIELDS = [
  'domain',
  'phase',
  'scope',
  'ambiguity',
  'verification',
  'workload',
  'risks',
];

function assertChoice(field, value, allowed) {
  if (!allowed.includes(value)) {
    throw new TypeError(`Invalid ${field}: ${String(value)}`);
  }
}

function parseTask(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Routing input must be an object');
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in input)) {
      throw new TypeError(`Missing routing field: ${field}`);
    }
  }

  assertChoice('domain', input.domain, Object.keys(workflow.ownership));
  assertChoice('phase', input.phase, workflow.routingInput.phases);
  assertChoice('scope', input.scope, workflow.routingInput.scopes);
  assertChoice('ambiguity', input.ambiguity, workflow.routingInput.ambiguity);
  assertChoice('verification', input.verification, workflow.routingInput.verification);
  assertChoice('workload', input.workload, workflow.routingInput.workloads);

  if (!Array.isArray(input.risks)) {
    throw new TypeError('Invalid risks: expected an array');
  }
  for (const risk of input.risks) {
    assertChoice('risk', risk, workflow.criticalRisks);
  }
  if (
    input.phase === 'execute' &&
    (input.authorityState !== 'resolved' || input.ambiguity !== 'low' || input.verification !== 'direct')
  ) {
    throw new TypeError('L0 execution requires resolved authority and direct verification');
  }

  return {
    domain: input.domain,
    phase: input.phase,
    scope: input.scope,
    ambiguity: input.ambiguity,
    verification: input.verification,
    workload: input.workload,
    risks: [...new Set(input.risks)],
  };
}

function envelope(task, level, authority, requiredGate) {
  const phaseOwner = task.phase === 'qa' ? workflow.ownership.qa : workflow.ownership[task.domain];
  const activeLevel = level === 'L1' && !workflow.modelAdapter.L1.enabled ? 'L2' : level;
  const adapter = workflow.modelAdapter[activeLevel];
  const bypassModel = task.phase === 'explain' || activeLevel === 'L0';
  return {
    owner: task.phase === 'explain' || activeLevel === 'L0' ? 'root' : phaseOwner,
    phase: task.phase,
    level: activeLevel,
    model: bypassModel ? null : adapter.model,
    reasoning: bypassModel ? null : adapter.reasoning,
    contextMode: task.phase === 'explain' ? 'current' : activeLevel === 'L0' ? 'none' : 'fresh-packet',
    authority,
    requiredGate,
  };
}

export function isL5Eligible({ consequentialL4Gap = false, measuredAdvantage = false } = {}) {
  return workflow.modelAdapter.L5.enabled && consequentialL4Gap && measuredAdvantage;
}

export function selectRoute(input) {
  const task = parseTask(input);
  const hasCriticalRisk = task.risks.length > 0;
  const requiresCriticalJudgment =
    task.domain === 'architecture' ||
    task.scope === 'cross-domain' ||
    task.ambiguity === 'material';
  const requiresCriticalReview = requiresCriticalJudgment || hasCriticalRisk;

  if (input.l5) {
    if (!isL5Eligible(input.l5)) {
      throw new TypeError('L5 requires an enabled adapter, a consequential L4 gap, and measured advantage');
    }
    return envelope(task, 'L5', 'judgment', 'semantic-l4');
  }

  if (task.phase === 'explain') {
    return envelope(task, requiresCriticalReview ? 'L4' : 'L3', 'answer', 'none');
  }

  if (task.phase === 'execute') {
    return envelope(task, 'L0', 'mechanics-only', 'none');
  }

  if (task.phase === 'discover') {
    const isSmallDirectScan =
      task.scope === 'single' && task.workload === 'small' && task.verification === 'direct';
    return envelope(task, isSmallDirectScan ? 'L1' : 'L2', 'evidence', 'none');
  }

  if (task.phase === 'decide') {
    if (requiresCriticalReview) {
      return envelope(task, 'L4', 'judgment', 'none');
    }
    return envelope(task, 'L3', 'judgment', 'none');
  }

  if (task.phase === 'implement') {
    if (requiresCriticalJudgment || task.domain === 'design') {
      return envelope(task, 'L4', 'decision-first', 'semantic-l4');
    }
    if (hasCriticalRisk) {
      return envelope(task, 'L3', 'execute', 'semantic-l4');
    }
    if (task.ambiguity === 'low' && task.verification === 'direct') {
      const isSmallDirectEdit = task.workload === 'small' && task.scope === 'single';
      return envelope(task, isSmallDirectEdit ? 'L1' : 'L2', 'execute', 'mechanical');
    }
    return envelope(task, 'L3', 'execute', 'semantic-l3');
  }

  if (requiresCriticalReview) {
    return envelope(task, 'L4', 'semantic-gate', 'none');
  }
  if (task.ambiguity === 'low' && task.verification === 'direct') {
    const isTinyCheck = task.workload === 'small' && task.scope === 'single';
    return envelope(task, isTinyCheck ? 'L1' : 'L2', 'mechanical-gate', 'none');
  }
  return envelope(task, 'L3', 'semantic-gate', 'none');
}

function parseArguments(argumentsList) {
  const values = { risks: [] };
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!flag?.startsWith('--') || value === undefined) {
      throw new TypeError(`Expected --name value pairs, received ${String(flag)}`);
    }
    const field = flag.slice(2);
    if (field === 'risk') {
      values.risks.push(...value.split(',').filter(Boolean));
    } else {
      values[field] = value;
    }
  }
  return values;
}

function main() {
  try {
    const route = selectRoute(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(route, null, 2)}\n`);
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
