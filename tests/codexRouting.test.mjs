import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';
import { isL5Eligible, resolveBinding, selectRoute } from '../tools/codex-routing.mjs';

const registry = JSON.parse(readFileSync(new URL('../config/codex-model-registry.snapshot.json', import.meta.url)));

test('routes a small direct discovery phase to qualified L1', () => {
  const route = selectRoute({
    domain: 'frontend',
    phase: 'discover',
    scope: 'single',
    ambiguity: 'low',
    verification: 'direct',
    workload: 'small',
    risks: [],
  });

  assert.deepEqual(route, {
    owner: 'frontend_implementer',
    phase: 'discover',
    level: 'L1',
    modelLane: 'fast',
    bindingState: 'active',
    model: registry.activeBindings.fast.model,
    reasoning: 'low',
    contextTier: 'C1',
    contextMode: 'fresh-packet',
    runtimeConstraint: null,
    attestationRequired: false,
    authority: 'evidence',
    requiredGate: 'none',
  });
});

test('routes critical implementation ambiguity to a deep decision before writing', () => {
  const route = selectRoute({
    domain: 'notes',
    phase: 'implement',
    scope: 'domain',
    ambiguity: 'material',
    verification: 'semantic',
    workload: 'normal',
    risks: ['privacy'],
  });

  assert.deepEqual(route, {
    owner: 'obsidian_notes_pipeline',
    phase: 'implement',
    level: 'L4',
    modelLane: 'deep',
    bindingState: 'active',
    model: registry.activeBindings.deep.model,
    reasoning: 'high',
    contextTier: 'C3',
    contextMode: 'fresh-packet',
    runtimeConstraint: null,
    attestationRequired: false,
    authority: 'decision-first',
    requiredGate: 'semantic-l4',
  });
});

test('uses L2 fast Medium for bounded and large direct implementation', () => {
  const medium = selectRoute({
    domain: 'notes',
    phase: 'implement',
    scope: 'domain',
    ambiguity: 'low',
    verification: 'direct',
    workload: 'normal',
    risks: [],
  });
  const high = selectRoute({
    domain: 'content',
    phase: 'implement',
    scope: 'domain',
    ambiguity: 'low',
    verification: 'direct',
    workload: 'large',
    risks: [],
  });

  assert.equal(medium.level, 'L2');
  assert.equal(medium.modelLane, 'fast');
  assert.equal(medium.model, registry.activeBindings.fast.model);
  assert.equal(medium.reasoning, 'medium');
  assert.equal(medium.requiredGate, 'mechanical');
  assert.equal(high.level, 'L2');
  assert.equal(high.modelLane, 'fast');
  assert.equal(high.model, registry.activeBindings.fast.model);
  assert.equal(high.reasoning, 'medium');
});

test('bypasses the model for resolved deterministic deployment mechanics', () => {
  const route = selectRoute({
    domain: 'qa',
    phase: 'execute',
    authorityState: 'resolved',
    scope: 'cross-domain',
    ambiguity: 'low',
    verification: 'direct',
    workload: 'normal',
    risks: ['deployment'],
  });
  assert.deepEqual(route, {
    owner: 'root',
    phase: 'execute',
    level: 'L0',
    modelLane: null,
    bindingState: 'bypass',
    model: null,
    reasoning: null,
    contextTier: 'C0',
    contextMode: 'none',
    runtimeConstraint: null,
    attestationRequired: false,
    authority: 'mechanics-only',
    requiredGate: 'none',
  });
});

test('rejects L0 mechanics without resolved authority', () => {
  assert.throws(
    () => selectRoute({
      domain: 'qa', phase: 'execute', scope: 'domain', ambiguity: 'low',
      authorityState: 'unresolved',
      verification: 'direct', workload: 'normal', risks: [],
    }),
    /resolved authority/,
  );
});

test('keeps L5 disabled without consequential comparative evidence', () => {
  const evidence = { consequentialL4Gap: true, measuredAdvantage: true };
  assert.equal(isL5Eligible(evidence), false);
  assert.throws(
    () => selectRoute({
      domain: 'architecture', phase: 'decide', scope: 'cross-domain',
      ambiguity: 'material', verification: 'semantic', workload: 'large',
      risks: ['architecture'], l5: evidence,
    }),
    /L5 requires/,
  );
});

test('does not pin the current root conversation model', () => {
  const route = selectRoute({
    domain: 'architecture', phase: 'explain', scope: 'single',
    ambiguity: 'low', verification: 'semantic', workload: 'small', risks: [],
  });
  assert.equal(route.level, 'L4');
  assert.equal(route.model, null);
  assert.equal(route.reasoning, null);
  assert.equal(route.contextMode, 'current');
});

test('rejects an unclassified task instead of guessing a route', () => {
  assert.throws(
    () => selectRoute({ domain: 'frontend', phase: 'implement' }),
    /Missing routing field/,
  );
});

test('keeps L3 standard Medium and never admits C4 automatically', () => {
  const input = { domain: 'frontend', phase: 'implement', scope: 'domain', ambiguity: 'contained',
    verification: 'semantic', workload: 'normal', risks: [] };
  const standard = selectRoute(input);
  assert.deepEqual([standard.level, standard.modelLane, standard.model, standard.reasoning, standard.contextTier],
    ['L3', 'standard', registry.activeBindings.standard.model, 'medium', 'C2']);
  const extended = selectRoute({ ...input, workload: 'large' });
  assert.equal(extended.contextTier, 'C3');
});

test('limits the attested pilot to project_architect deep routing', () => {
  const input = { domain: 'architecture', phase: 'decide', scope: 'cross-domain',
    ambiguity: 'material', verification: 'semantic', workload: 'large', risks: ['architecture'] };
  const architect = selectRoute(input);
  assert.deepEqual([architect.level, architect.modelLane, architect.bindingState, architect.model, architect.reasoning],
    ['L4', 'deep', 'website-pilot', registry.websitePilotOverrides['project_architect:deep'].model, 'high']);
  assert.equal(architect.runtimeConstraint, 'native-cli-aligned-tuple');
  assert.equal(architect.attestationRequired, true);
  assert.equal(architect.contextTier, 'C3');
  const other = selectRoute({ ...input, domain: 'notes' });
  assert.deepEqual([other.modelLane, other.model, other.reasoning, other.bindingState],
    ['deep', registry.activeBindings.deep.model, 'high', 'active']);
});

test('invalid or missing active registry bindings fail closed', () => {
  const missing = structuredClone(registry);
  delete missing.activeBindings.standard;
  assert.throws(() => resolveBinding('L3', 'frontend_implementer', missing), /Missing or invalid active/);
  const invalid = structuredClone(registry);
  invalid.activeBindings.deep.reasoning = [];
  assert.throws(() => resolveBinding('L4', 'qa_build_reviewer', invalid), /Missing or invalid active/);
});

test('pilot override without rollback or evidence fails closed', () => {
  const missingRollback = structuredClone(registry);
  delete missingRollback.rollbackBindings['project_architect:deep'];
  assert.throws(() => resolveBinding('L4', 'project_architect', missingRollback), /Invalid Website pilot/);
  const missingEvidence = structuredClone(registry);
  missingEvidence.websitePilotOverrides['project_architect:deep'].evidence = [];
  assert.throws(() => resolveBinding('L4', 'project_architect', missingEvidence), /Invalid Website pilot/);
});

test('synthetic central bindings propagate and roll back without changing routing policy', () => {
  const input = { domain: 'frontend', phase: 'implement', scope: 'domain', ambiguity: 'contained',
    verification: 'semantic', workload: 'normal', risks: [] };
  const baseline = selectRoute(input);
  const synthetic = structuredClone(registry);
  synthetic.activeBindings.standard.model = 'synthetic-vNext';
  const changed = selectRoute(input, synthetic);
  assert.deepEqual({ ...changed, model: baseline.model }, baseline);
  assert.deepEqual([changed.level, changed.modelLane, changed.reasoning, changed.bindingState],
    ['L3', 'standard', 'medium', 'active']);
  assert.equal(changed.model, 'synthetic-vNext');
  assert.equal(resolveBinding('L3', 'frontend_implementer', synthetic).model, 'synthetic-vNext');
  assert.equal(selectRoute({ ...input, domain: 'architecture', phase: 'decide',
    scope: 'cross-domain', ambiguity: 'material' }, synthetic).bindingState, 'website-pilot');
  synthetic.activeBindings.standard = structuredClone(registry.activeBindings.standard);
  assert.deepEqual(selectRoute(input, synthetic), baseline);
});

test('synthetic deep binding keeps pilot rollback tied to the active lane', () => {
  const synthetic = structuredClone(registry);
  synthetic.activeBindings.deep.model = 'synthetic-deep-vNext';
  assert.throws(() => resolveBinding('L4', 'project_architect', synthetic), /Invalid Website pilot/);
  synthetic.rollbackBindings['project_architect:deep'].model = 'synthetic-deep-vNext';
  const normal = resolveBinding('L4', 'qa_build_reviewer', synthetic);
  const pilot = resolveBinding('L4', 'project_architect', synthetic);
  assert.equal(normal.model, 'synthetic-deep-vNext');
  assert.equal(pilot.model, registry.websitePilotOverrides['project_architect:deep'].model);
  assert.equal(pilot.bindingState, 'website-pilot');
});
