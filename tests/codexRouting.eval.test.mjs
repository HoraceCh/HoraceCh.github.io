import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { selectRoute } from '../tools/codex-routing.mjs';

const currentCasesPath = new URL('./codex-routing-current-cases.json', import.meta.url);
const currentCases = JSON.parse(await readFile(currentCasesPath, 'utf8'));
const historicalCasesPath = new URL('./codex-routing-cases.json', import.meta.url);
const historicalCases = JSON.parse(await readFile(historicalCasesPath, 'utf8'));
const activeModelsPath = new URL('./codex-routing-active-models.json', import.meta.url);
const activeModels = JSON.parse(await readFile(activeModelsPath, 'utf8'));

test('current representative routing cases match the policy', async (context) => {
  assert.equal(currentCases.length, 14);

  for (const fixture of currentCases) {
    await context.test(fixture.id, () => {
      assert.deepEqual(selectRoute(fixture.input), fixture.expected);
    });
  }
});

test('historical routing cases retain HC-126 provenance', () => {
  assert.equal(historicalCases.length, 14);
  assert.deepEqual(
    [...new Set(historicalCases.map((fixture) => fixture.expected.model).filter(Boolean))].sort(),
    ['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'],
  );
  assert.deepEqual(
    Object.keys(activeModels).sort(),
    ['contained-design-judgment', 'critical-release-gate', 'cross-domain-architecture-decision', 'private-publication-boundary'],
  );
});

test('current routing set covers phases, risks, levels, models, and historical case IDs', () => {
  const currentIds = currentCases.map((fixture) => fixture.id).sort();
  const historicalIds = historicalCases.map((fixture) => fixture.id).sort();
  const phases = new Set(currentCases.map((fixture) => fixture.input.phase));
  const levels = new Set(currentCases.map((fixture) => fixture.expected.level));
  const models = new Set(currentCases.map((fixture) => fixture.expected.model));
  const risks = new Set(currentCases.flatMap((fixture) => fixture.input.risks));

  assert.deepEqual(currentIds, historicalIds);
  assert.deepEqual([...phases].sort(), ['decide', 'discover', 'explain', 'implement', 'qa']);
  assert.deepEqual([...levels].sort(), ['L1', 'L2', 'L3', 'L4']);
  assert.deepEqual([...models].sort(), ['gpt-6-luna', 'gpt-6-sol', null]);
  assert.ok(risks.has('architecture'));
  assert.ok(risks.has('deployment'));
  assert.ok(risks.has('privacy'));
  assert.ok(risks.has('publication'));
  assert.ok(risks.has('schema'));
});
