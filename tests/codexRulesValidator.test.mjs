import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  parseRuleFrontmatter,
  validateScanBoundaryDefinition,
  validateWorkflow,
  validateWorkflowJsonStructure,
} from '../tools/validate-codex-rules.mjs';

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
  "modelTiers": {},
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
