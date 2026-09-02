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

function envelope(task, tier, reasoning, authority, requiredGate) {
  const phaseOwner = task.phase === 'qa' ? workflow.ownership.qa : workflow.ownership[task.domain];
  return {
    owner: task.phase === 'explain' ? 'root' : phaseOwner,
    phase: task.phase,
    model: workflow.modelTiers[tier].model,
    reasoning,
    contextMode: task.phase === 'explain' ? 'current' : 'fresh-packet',
    authority,
    requiredGate,
  };
}

export function selectRoute(input) {
  const task = parseTask(input);
  const hasCriticalRisk = task.risks.length > 0;
  const requiresCriticalJudgment =
    task.domain === 'architecture' ||
    task.scope === 'cross-domain' ||
    task.ambiguity === 'material';
  const requiresCriticalReview = requiresCriticalJudgment || hasCriticalRisk;

  if (task.phase === 'explain') {
    return envelope(task, 'terra', 'medium', 'answer', 'none');
  }

  if (task.phase === 'discover') {
    const isSmallDirectScan =
      task.scope === 'single' && task.workload === 'small' && task.verification === 'direct';
    return envelope(task, 'luna', isSmallDirectScan ? 'low' : 'medium', 'evidence', 'none');
  }

  if (task.phase === 'decide') {
    if (requiresCriticalReview) {
      return envelope(task, 'sol', 'high', 'judgment', 'none');
    }
    if (task.ambiguity === 'contained' || task.verification === 'semantic') {
      return envelope(task, 'sol', 'medium', 'judgment', 'none');
    }
    return envelope(task, 'terra', 'medium', 'judgment', 'none');
  }

  if (task.phase === 'implement') {
    if (requiresCriticalJudgment || task.domain === 'design') {
      return envelope(task, 'sol', 'high', 'decision-first', 'semantic-sol');
    }
    if (hasCriticalRisk) {
      return envelope(task, 'terra', 'high', 'execute', 'semantic-sol');
    }
    if (task.ambiguity === 'low' && task.verification === 'direct') {
      const reasoning =
        task.workload === 'large'
          ? 'high'
          : task.workload === 'small' && task.scope === 'single'
            ? 'low'
            : 'medium';
      return envelope(task, 'luna', reasoning, 'execute', 'mechanical');
    }
    return envelope(task, 'terra', 'medium', 'execute', 'semantic-terra');
  }

  if (requiresCriticalReview) {
    return envelope(task, 'sol', 'high', 'semantic-gate', 'none');
  }
  if (task.ambiguity === 'low' && task.verification === 'direct') {
    const reasoning = task.workload === 'small' ? 'low' : 'medium';
    return envelope(task, 'luna', reasoning, 'mechanical-gate', 'none');
  }
  return envelope(task, 'terra', 'medium', 'semantic-gate', 'none');
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
