# HoraceCh Agent Workflow

This Astro site is a personal research portfolio and public knowledge garden. Its fixed IA is Home / About / Projects / Notes / Resume / Contact; Notes publish through the Obsidian pipeline. Keep work static-build friendly, minimal, technical, and honest.

Read [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md) for model selection and [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md) for prompt structure and handoffs.

## Operating flow

1. State the outcome, success criteria, relevant evidence, authorized scope, and validation.
2. Choose one owner using the routing rules. Start at Terra Medium and escalate only for material risk, ambiguity, or measured failure.
3. The owner makes the smallest authorized change, or produces the required spec or plan.
4. Hand off when another ownership lane, an unauthorized file, or a product decision is required.
5. Send multi-file, pipeline, or pre-commit work to `qa_build_reviewer`; do not commit before its required gate passes.

## Ownership and risk

- `project_architect`: plans cross-layer boundaries, IA, migrations, and routing.
- `obsidian_notes_pipeline`: owns sync, notes schema, assets, generated-note safety, and private-content boundaries. Use a supplied `notes:sync:dry` result when available; the publish source—not the full vault—is the input boundary.
- `design_system_curator`: owns visual direction and an implementable spec; it reads `docs/design/UI_DESIGN.md` before visual work.
- `content_ia_editor`: owns honest copy and IA; it does not change styling or layout.
- `frontend_implementer`: makes scoped Astro/UI changes from a clear handoff and preserves the documented design system.
- `qa_build_reviewer`: validates ownership, behavior, and release readiness.

For a Level 1 explicit single-file change, use Terra Medium implementation and Luna Low mechanical QA. For a Level 2 single-domain task, use the relevant specialist where a spec or audit materially reduces risk. For Levels 3–4 cross-domain, pipeline, schema, or infrastructure work, separate Sol High planning, authorized implementation, and QA into distinct rounds.

## Validation and reporting

QA verifies the diff surface and whitespace, then runs `npm run build`. It additionally runs `npm run hexo:build` for Hexo-related work and `npm run notes:sync:dry` for pipeline work when a source path is available. UI changes also receive rendered light/dark, mobile, and UI-reference review when practical. A required but unverified build is `BLOCKED: build not verified`.

Reports preserve decisions, material risks, blockers, validation, and next actions. They omit routine tool narration. Do not create overlapping agents, edit generated notes directly, widen the Obsidian publish scope, fabricate personal claims, or run formatters that touch unrelated files.
