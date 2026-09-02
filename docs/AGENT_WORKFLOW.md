# HoraceCh Agent Workflow

This Astro site is a personal research portfolio and public knowledge garden. Its fixed IA is Home / About / Projects / Notes / Resume / Contact; Notes publish through the Obsidian pipeline. Keep work static-build friendly, minimal, technical, and honest.

Read [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md) for model selection and [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md) for prompt structure and handoffs.

## Operating flow

1. Read `CODEX_SCAN_BOUNDARY.md`, then define the outcome, completion bar, evidence, authorized scope, and behavior-matched validation using the route envelope plus six-part prompt in `CODEX_AGENT_ROUTING.md`.
2. Classify each useful phase and generate its route with `npm run route:codex -- [flags]`. Prefer Luna Low/Medium for independently verifiable information labor, Terra Medium for routine synthesis, Sol Medium for contained judgment, and Sol High for material ambiguity or risk.
3. Make the smallest authorized change or produce the required spec; hand off when another ownership lane, unauthorized file, or product decision is required.
4. Send multi-file, pipeline, and pre-release work to `qa_build_reviewer` before any authorized release action.

Only the root orchestrator delegates. Delegation depth is one, write-capable work is serial-first, and delegated jobs are scoped to finish within 30 minutes. The configured concurrency cap is not a target.

## Ownership and risk

- `project_architect`: plans cross-layer boundaries, IA, migrations, and routing.
- `obsidian_notes_pipeline`: owns sync, notes schema, assets, generated-note safety, and private-content boundaries. Use a supplied `notes:sync:dry` result when available; the publish source—not the full vault—is the input boundary.
- `design_system_curator`: owns visual direction and an implementable spec; it reads `docs/design/UI_DESIGN.md` before visual work.
- `content_ia_editor`: owns honest copy and IA; it does not change styling or layout.
- `frontend_implementer`: makes scoped Astro/UI changes from a clear handoff and preserves the documented design system.
- `qa_build_reviewer`: validates ownership, behavior, and release readiness.

For a Level 1 explicit and directly verifiable change, use Luna Low/Medium in the owning lane and validate immediately. For a Level 2 single-domain task, use optional Luna discovery, Terra Medium implementation, and Luna mechanical QA when the handoff cost is justified. For Levels 3–4, prepare a compact Luna evidence packet, route contained judgment to Sol Medium and high-risk judgment to Sol High, keep one retained-diff writer, run Luna mechanical Gate 1, and add Terra/Sol semantic Gate 2 when the risk requires it.

## Validation and reporting

QA always verifies the diff surface, whitespace, and ownership, then selects checks for the changed behavior. Website source or build changes require `npm run build`; legacy Hexo work uses a configured legacy validation command when one exists and must not invent a missing package script; pipeline work uses `npm run notes:sync:dry` when a source path is available. UI changes receive rendered light/dark, mobile, accessibility, and UI-reference review when practical. Documentation and agent-rule changes run `npm run rules:validate`, which covers TOML parsing, route cases, contradictions, scan paths, secret-like values, local links, and dynamic-rule frontmatter. It requires Node 24 and Python 3.11+ with `tomllib`; CI installs both explicitly. A required but unverified build is `BLOCKED: build not verified`.

Reports preserve decisions, material risks, blockers, validation, and next actions while omitting routine tool narration. Ownership, privacy, release permissions, and stop rules are centralized in `CODEX_AGENT_ROUTING.md`; agent TOMLs add only lane-specific boundaries.

Use repository Skills for repeatable procedures without moving domain judgment out of agents: `website-release-gate`, `notes-publication-preflight`, `publication-contract-audit`, `interrupted-run-recovery`, and `audit-update`.
