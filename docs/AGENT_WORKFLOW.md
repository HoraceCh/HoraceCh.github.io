# HoraceCh Agent Workflow

[AGENTS.md](../AGENTS.md) defines normal local authority; [HORACEOS.md](HORACEOS.md) locates affected contracts.

## Operating flow

1. Identify the authorized outcome, affected source/contract, protected behavior and acceptance criteria.
2. Let one root writer make the necessary adjacent Website implementation/test edits, reading context on demand.
3. Run behavior-matched checks; report outcome, material evidence, risks and blockers.
4. Obtain separate authorization for external delivery or protected-domain changes outside the task.

Consult specialists when ambiguity, risk or expertise warrants it. Ownership labels do not require root to hand off routine multi-file work. Delegated agents retain their assigned scope/sandbox; only root delegates. Preserve depth one, jobs within 30 minutes, the current three-agent cap and one retained-diff writer. Parallel investigation is read-only.

## Available specialists

| Role | Responsibility when consulted |
| --- | --- |
| `project_architect` | Read-only architecture, migration, IA and authority/routing decisions |
| `obsidian_notes_pipeline` | Sync, schema, generated ownership, assets and publication/privacy |
| `design_system_curator` | Read-only visual direction, candidate evidence and specs |
| `content_ia_editor` | Factual copy, claims and IA |
| `frontend_implementer` | Scoped Astro/UI implementation from a clear request or accepted spec |
| `qa_build_reviewer` | Independent risk review or release-readiness assessment; read-only for source |

These are the six current roles, not a required sequence. Deliberate specialist/model routing uses [Agent Routing](CODEX_AGENT_ROUTING.md) and [Model Usage](CODEX_MODEL_USAGE.md), including Registry/attestation gates; ordinary root work needs no classification or envelope.

## Validation and reporting

- Source/build changes: `npm run build` and affected tests.
- UI: relevant v3 criteria and practical rendered responsive/theme/accessibility/reduced-motion checks.
- Pipeline: supplied-source `npm run notes:sync:dry` when available, affected strict/publication checks and build after writes or source/schema changes. Never widen discovery to the private vault.
- Governance: `npm run rules:validate`, affected routing/validator tests, diff/link/format checks; use repository Node/npm and Python 3.11+.
- Material events: existing [maintenance policy](../.agents/rules/maintenance-logging.md).

Independent semantic review follows risk, not file count; authority/security/publication changes and release decisions require it. Mechanical checks cannot replace that judgment or grant release permission. For actual readiness assessment, use `qa_build_reviewer` with `website-release-gate`; [review modes](CODEX_AGENT_ROUTING.md#qa-gate) retain their verdicts. A required unverified build is `BLOCKED: build not verified`.

Reports are proportional: outcome, evidence, risks/blockers and next action. Existing Skills retain their bounded procedures when invoked; ordinary root work has no fixed report template.
