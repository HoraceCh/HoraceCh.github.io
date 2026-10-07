import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { selectRoute } from '../tools/codex-routing.mjs';

const currentCasesPath = new URL('./codex-routing-current-cases.json', import.meta.url);
const currentCases = JSON.parse(await readFile(currentCasesPath, 'utf8'));
const registry = JSON.parse(await readFile(new URL('../config/codex-model-registry.snapshot.json', import.meta.url), 'utf8'));
const historicalCasesPath = new URL('./codex-routing-cases.json', import.meta.url);
const historicalCases = JSON.parse(await readFile(historicalCasesPath, 'utf8'));

function expectedRoute(fixture) {
  const { expected } = fixture;
  if ('model' in expected) return expected;
  const model = expected.bindingState === 'website-pilot'
    ? registry.websitePilotOverrides[`${expected.owner}:${expected.modelLane}`].model
    : registry.activeBindings[expected.modelLane].model;
  return { ...expected, model };
}

test('current representative routing cases match the policy', async (context) => {
  assert.equal(currentCases.length, 14);

  for (const fixture of currentCases) {
    await context.test(fixture.id, () => {
      assert.deepEqual(selectRoute(fixture.input), expectedRoute(fixture));
    });
  }
});

test('historical routing cases retain HC-126 provenance', () => {
  assert.equal(historicalCases.length, 14);
  assert.deepEqual(
    [...new Set(historicalCases.map((fixture) => fixture.expected.model).filter(Boolean))].sort(),
    ['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'],
  );
});

test('current routing set covers phases, risks, levels, models, and historical case IDs', () => {
  const currentIds = currentCases.map((fixture) => fixture.id).sort();
  const historicalIds = historicalCases.map((fixture) => fixture.id).sort();
  const phases = new Set(currentCases.map((fixture) => fixture.input.phase));
  const levels = new Set(currentCases.map((fixture) => fixture.expected.level));
  const lanes = new Set(currentCases.map((fixture) => fixture.expected.modelLane));
  const bindingStates = new Set(currentCases.map((fixture) => fixture.expected.bindingState));
  const risks = new Set(currentCases.flatMap((fixture) => fixture.input.risks));

  assert.deepEqual(currentIds, historicalIds);
  assert.deepEqual([...phases].sort(), ['decide', 'discover', 'explain', 'implement', 'qa']);
  assert.deepEqual([...levels].sort(), ['L1', 'L2', 'L3', 'L4']);
  assert.deepEqual([...lanes].sort(), ['deep', 'fast', 'standard']);
  assert.deepEqual([...bindingStates].sort(), ['active', 'root-selected', 'website-pilot']);
  assert.ok(risks.has('architecture'));
  assert.ok(risks.has('deployment'));
  assert.ok(risks.has('privacy'));
  assert.ok(risks.has('publication'));
  assert.ok(risks.has('schema'));
});
