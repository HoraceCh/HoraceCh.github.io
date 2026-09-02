import assert from 'node:assert/strict';
import test from 'node:test';

import { selectRoute } from '../tools/codex-routing.mjs';

test('routes a small deterministic discovery phase to Luna Low', () => {
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
    model: 'gpt-5.6-luna',
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
    model: 'gpt-5.6-sol',
    reasoning: 'high',
    contextMode: 'fresh-packet',
    authority: 'decision-first',
    requiredGate: 'semantic-sol',
  });
});

test('rejects an unclassified task instead of guessing a route', () => {
  assert.throws(
    () => selectRoute({ domain: 'frontend', phase: 'implement' }),
    /Missing routing field/,
  );
});
