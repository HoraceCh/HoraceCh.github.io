---
description: Guardrails for Codex workflow and routing policy edits
globs: ["AGENTS.md", "config/codex-workflow.json", "docs/AGENT_WORKFLOW.md", "docs/CODEX_*.md", "docs/MODEL_ROUTING_PORTABILITY.md", ".codex/config.toml", ".codex/agents/*.md", ".codex/agents/*.toml", ".omo/rules/*.md", "tools/codex-routing.mjs", "tools/validate-codex-rules.mjs", "tests/codexRouting*.test.mjs", "tests/codexRulesValidator.test.mjs", "tests/codex-routing-cases.json"]
alwaysApply: false
---

Treat `config/codex-workflow.json` as the machine contract and the Codex workflow documents as its explanation. Never recursively scan `.codex/` or `.omo/`; read only the policy allowlist from `docs/CODEX_SCAN_BOUNDARY.md`.

When routing behavior changes, update the classifier, representative cases, and documentation together. Preserve exactly six owners, a Terra Medium root, delegation depth one, at most three concurrent agents, and one retained-diff writer. Do not claim a model handoff unless the runtime performed it.

After an affected edit, run `npm run test:routing` and `npm run rules:validate`. Do not weaken a check to reconcile a contradiction; correct the policy source that is wrong.
