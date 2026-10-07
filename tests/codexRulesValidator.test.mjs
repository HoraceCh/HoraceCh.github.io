import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  findTomlParserRuntime,
  parseRuleFrontmatter,
  validateScanBoundaryDefinition,
  validateSkillAdmissionDefinition,
  validateRootInterruptMessage,
  validateWorkflow,
  validateWorkflowJsonStructure,
  validateRegistrySnapshot,
  validateAgentModelPin,
} from '../tools/validate-codex-rules.mjs';

test('TOML validation selects only Python 3.11 or newer', () => {
  const runtime = findTomlParserRuntime((command) => ({
    status: 0,
    stdout: command === 'python' ? 'Python 3.10.14' : 'Python 3.11.9',
    stderr: '',
  }));

  assert.deepEqual(runtime, ['py', ['-3']]);
  assert.equal(
    findTomlParserRuntime(() => ({ status: 0, stdout: 'Python 3.10.14', stderr: '' })),
    null,
  );
});

test('root interrupt messages must be explicitly enabled', () => {
  assert.deepEqual(validateRootInterruptMessage({ agents: { interrupt_message: true } }), []);
  for (const value of [false, undefined, 'true', 1]) {
    const agents = value === undefined ? {} : { interrupt_message: value };
    assert.deepEqual(
      validateRootInterruptMessage({ agents }),
      ['Root agent interrupt setting must remain enabled'],
    );
  }
  assert.deepEqual(
    validateRootInterruptMessage({}),
    ['Root agent interrupt setting must remain enabled'],
  );
});

test('scan-boundary validation rejects policy files under excluded prefixes', () => {
  const errors = validateScanBoundaryDefinition(
    {
      policyFiles: ['.codex/chrome-profile/Local State'],
      excludedPrefixes: ['.codex/chrome-'],
      excludedFiles: [],
    },
    new Set(['.codex/chrome-profile/Local State']),
    [],
  );

  assert.ok(errors.some((error) => error.includes('excluded prefix')));
});

test('scan-boundary validation rejects embedded parent-directory segments', () => {
  const errors = validateScanBoundaryDefinition(
    {
      policyFiles: ['docs/../AGENTS.md', '.omo/rules/../../AGENTS.md'],
      excludedPrefixes: [],
      excludedFiles: [],
    },
    new Set(['docs/../AGENTS.md', '.omo/rules/../../AGENTS.md']),
    [],
  );

  assert.equal(errors.filter((error) => error.includes('repository-relative')).length, 2);
});

test('project-local Skill admission rejects an unlisted discoverable snapshot', () => {
  const admission = {
    version: 1,
    projectOwned: ['website-release-gate'],
    thirdPartyUi: { 'improve-ui': 'ADMITTED', 'gpt-taste': 'REMOVE' },
  };
  const errors = validateSkillAdmissionDefinition(
    admission,
    ['website-release-gate', 'improve-ui', 'gpt-taste'],
    ['improve-ui'],
  );
  assert.ok(errors.some((error) => error.includes('Discoverable')));
});

test('dynamic rules require bounded globs and must not always apply', () => {
  const parsed = parseRuleFrontmatter(`---
description: Agent policy guard
globs: ["AGENTS.md", "docs/CODEX_*.md"]
alwaysApply: false
---

Validate the route policy after editing it.
`);

  assert.deepEqual(parsed, {
    description: 'Agent policy guard',
    globs: ['AGENTS.md', 'docs/CODEX_*.md'],
    alwaysApply: false,
  });
});

test('workflow JSON rejects duplicate top-level contract keys', () => {
  const errors = validateWorkflowJsonStructure(`{
  "schemaVersion": 1,
  "scanBoundary": {},
  "execution": {},
  "ownership": {},
  "routingInput": {},
  "routingInput": {},
  "capabilityLevels": {},
  "modelAdapter": {},
  "criticalRisks": []
}`);

  assert.ok(errors.some((error) => error.includes('routingInput')));
});

test('the checked-in workflow is internally consistent', () => {
  const rootDir = fileURLToPath(new URL('../', import.meta.url));
  const result = validateWorkflow(rootDir);

  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.routingCases, 14);
});

test('registry validation rejects global candidate activation and missing pilot rollback', () => {
  const root = new URL('../', import.meta.url);
  const workflow = JSON.parse(readFileSync(new URL('config/codex-workflow.json', root)));
  const registry = JSON.parse(readFileSync(new URL('config/codex-model-registry.snapshot.json', root)));
  registry.activeBindings.standard.model = 'gpt-6.1-sol';
  delete registry.rollbackBindings['project_architect:deep'];
  const errors = validateRegistrySnapshot(workflow, registry);
  assert.ok(errors.some((error) => error.includes('globally active')));
  assert.ok(errors.some((error) => error.includes('rollback binding')));
});

test('synthetic active binding passes without a second concrete model authority', () => {
  const root = new URL('../', import.meta.url);
  const workflow = JSON.parse(readFileSync(new URL('config/codex-workflow.json', root)));
  const registry = JSON.parse(readFileSync(new URL('config/codex-model-registry.snapshot.json', root)));
  registry.activeBindings.standard.model = 'synthetic-vNext';
  assert.deepEqual(validateRegistrySnapshot(workflow, registry), []);
  registry.activeBindings.standard.model = 'synthetic-other';
  assert.deepEqual(validateRegistrySnapshot(workflow, registry), []);
  registry.activeBindings.standard.model = 'synthetic-vNext';
  registry.activeBindings.standard.status = 'qualified-not-active';
  assert.ok(validateRegistrySnapshot(workflow, registry).some((error) => error.includes('Invalid active')));
  registry.activeBindings.standard.status = 'active';
  registry.activeBindings.deep.model = 'synthetic-deep-vNext';
  assert.ok(validateRegistrySnapshot(workflow, registry).some((error) => error.includes('rollback binding')));
  registry.rollbackBindings['project_architect:deep'].model = 'synthetic-deep-vNext';
  assert.deepEqual(validateRegistrySnapshot(workflow, registry), []);
});

test('registry drift and malformed evidence fail closed', () => {
  const root = new URL('../', import.meta.url);
  const workflow = JSON.parse(readFileSync(new URL('config/codex-workflow.json', root)));
  const baseline = JSON.parse(readFileSync(new URL('config/codex-model-registry.snapshot.json', root)));
  const cases = [
    [(registry) => { delete registry.activeBindings.standard; }, 'semantic lanes'],
    [(registry) => { registry.activeBindings.standard.reasoning = ['low']; }, 'Invalid active'],
    [(registry) => { registry.activeBindings.standard.status = 'disabled'; }, 'Invalid active'],
    [(registry) => { registry.derivedFrom.baseline = 'stale'; }, 'authority or schema'],
    [(registry) => { registry.derivedFrom.qualityEvidence = ['HC-126']; }, 'authority or schema'],
    [(registry) => { registry.derivedFrom.runtimeEvidence = 'stale'; }, 'authority or schema'],
    [(registry) => { registry.activeBindings.standard.model = registry.qualifiedCandidates.standard.model; }, 'globally active'],
    [(registry) => { delete registry.websitePilotOverrides['project_architect:deep'].runtimeAttestation; }, 'runtime constraint'],
    [(registry) => { registry.websitePilotOverrides['project_architect:deep'].evidence = []; }, 'runtime constraint'],
    [(registry) => { registry.rollbackBindings['project_architect:deep'].model = 'stale'; }, 'rollback binding'],
  ];
  for (const [mutate, message] of cases) {
    const registry = structuredClone(baseline);
    mutate(registry);
    assert.ok(validateRegistrySnapshot(workflow, registry).some((error) => error.includes(message)), message);
  }
  assert.deepEqual(validateAgentModelPin({ name: 'frontend_implementer', model: 'unauthorized' }, baseline),
    ['Variable-route agent must not pin model or reasoning: frontend_implementer']);
  assert.deepEqual(validateAgentModelPin({ name: 'project_architect', model: 'unauthorized',
    model_reasoning_effort: 'high' }, baseline),
    ['project_architect pin must match the approved Website pilot override']);
});
