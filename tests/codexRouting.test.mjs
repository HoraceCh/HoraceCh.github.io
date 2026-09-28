import assert from 'node:assert/strict';
import test from 'node:test';

import { isL5Eligible, selectRoute } from '../tools/codex-routing.mjs';

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
    model: 'gpt-6-luna',
    reasoning: 'low',
    contextMode: 'fresh-packet',
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
    model: 'gpt-6-sol',
    reasoning: 'high',
    contextMode: 'fresh-packet',
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
    model: null,
    reasoning: null,
    contextMode: 'none',
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
