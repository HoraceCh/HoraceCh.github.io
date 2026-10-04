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
    model: 'gpt-6-luna',
    reasoning: 'low',
    contextTier: 'C1',
    contextMode: 'fresh-packet',
    runtimeConstraint: null,
    attestationRequired: false,
    authority: 'evidence',
    requiredGate: 'none',
  });
});

test('routes critical implementation ambiguity to a Sol decision before writing', () => {
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
    model: 'gpt-6-sol',
    reasoning: 'high',
    contextTier: 'C3',
    contextMode: 'fresh-packet',
    runtimeConstraint: null,
    attestationRequired: false,
    authority: 'decision-first',
    requiredGate: 'semantic-l4',
  });
});

test('uses L2 Luna Medium for bounded and large direct implementation', () => {
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
  assert.equal(medium.model, 'gpt-6-luna');
  assert.equal(medium.reasoning, 'medium');
  assert.equal(medium.requiredGate, 'mechanical');
  assert.equal(high.level, 'L2');
  assert.equal(high.model, 'gpt-6-luna');
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

test('keeps L3 standard on GPT-6 Sol Medium and never admits C4 automatically', () => {
  const input = { domain: 'frontend', phase: 'implement', scope: 'domain', ambiguity: 'contained',
    verification: 'semantic', workload: 'normal', risks: [] };
  const standard = selectRoute(input);
  assert.deepEqual([standard.level, standard.modelLane, standard.model, standard.reasoning, standard.contextTier],
    ['L3', 'standard', 'gpt-6-sol', 'medium', 'C2']);
  const extended = selectRoute({ ...input, workload: 'large' });
  assert.equal(extended.contextTier, 'C3');
});

test('limits GPT-6.1 to attested project_architect deep routing', () => {
  const input = { domain: 'architecture', phase: 'decide', scope: 'cross-domain',
    ambiguity: 'material', verification: 'semantic', workload: 'large', risks: ['architecture'] };
  const architect = selectRoute(input);
  assert.deepEqual([architect.level, architect.modelLane, architect.bindingState, architect.model, architect.reasoning],
    ['L4', 'deep', 'website-pilot', 'gpt-6.1-sol', 'high']);
  assert.equal(architect.runtimeConstraint, 'native-cli-aligned-tuple');
  assert.equal(architect.attestationRequired, true);
  assert.equal(architect.contextTier, 'C3');
  const other = selectRoute({ ...input, domain: 'notes' });
  assert.deepEqual([other.model, other.reasoning, other.bindingState], ['gpt-6-sol', 'high', 'active']);
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
