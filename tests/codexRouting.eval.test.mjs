import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { selectRoute } from '../tools/codex-routing.mjs';

const casesPath = new URL('./codex-routing-cases.json', import.meta.url);
const cases = JSON.parse(await readFile(casesPath, 'utf8'));
const activeModelsPath = new URL('./codex-routing-active-models.json', import.meta.url);
const activeModels = JSON.parse(await readFile(activeModelsPath, 'utf8'));

test('representative routing cases match the policy', async (context) => {
  assert.ok(cases.length >= 12, 'the routing set must cover representative phases and risks');

  for (const fixture of cases) {
    await context.test(fixture.id, () => {
      assert.deepEqual(selectRoute(fixture.input), {
        ...fixture.expected,
        model: activeModels[fixture.id] ?? fixture.expected.model,
      });
    });
  }
});

test('routing set covers every phase, model tier, and critical risk family', () => {
  const phases = new Set(cases.map((fixture) => fixture.input.phase));
  const baselineModels = new Set(cases.map((fixture) => fixture.expected.model));
  const activeModelIds = new Set(cases.map((fixture) => activeModels[fixture.id] ?? fixture.expected.model));
  const risks = new Set(cases.flatMap((fixture) => fixture.input.risks));

  assert.deepEqual([...phases].sort(), ['decide', 'discover', 'explain', 'implement', 'qa']);
  assert.deepEqual(
    [...baselineModels].sort(),
    ['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'],
  );
  assert.deepEqual(
    [...activeModelIds].sort(),
    ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-6-sol'],
  );
  assert.ok(Object.keys(activeModels).every((id) => cases.some((fixture) => fixture.id === id)));
  assert.ok(risks.has('privacy'));
  assert.ok(risks.has('publication'));
  assert.ok(risks.has('deployment'));
});
