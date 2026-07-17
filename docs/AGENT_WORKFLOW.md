# HoraceCh Agent Workflow

This Astro site is a personal research portfolio and public knowledge garden. Its fixed IA is Home / About / Projects / Notes / Resume / Contact; Notes publish through the Obsidian pipeline. Keep work static-build friendly, minimal, technical, and honest.

Read [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md) for model selection and [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md) for prompt structure and handoffs.

## Operating flow

1. Define the outcome, completion bar, evidence, authorized scope, and behavior-matched validation using the six-part prompt in `CODEX_AGENT_ROUTING.md`.
2. Choose one owner and the lowest reliable reasoning tier. Escalate only for material risk, ambiguity, or measured failure.
3. Make the smallest authorized change or produce the required spec; hand off when another ownership lane, unauthorized file, or product decision is required.
4. Send multi-file, pipeline, and pre-release work to `qa_build_reviewer` before any authorized release action.

## Ownership and risk

- `project_architect`: plans cross-layer boundaries, IA, migrations, and routing.
- `obsidian_notes_pipeline`: owns sync, notes schema, assets, generated-note safety, and private-content boundaries. Use a supplied `notes:sync:dry` result when available; the publish source—not the full vault—is the input boundary.
- `design_system_curator`: owns visual direction and an implementable spec; it reads `docs/design/UI_DESIGN.md` before visual work.
- `content_ia_editor`: owns honest copy and IA; it does not change styling or layout.
- `frontend_implementer`: makes scoped Astro/UI changes from a clear handoff and preserves the documented design system.
- `qa_build_reviewer`: validates ownership, behavior, and release readiness.

For a Level 1 explicit single-file change, use Terra Medium implementation and Luna Low mechanical QA. For a Level 2 single-domain task, use the relevant specialist when a spec or audit materially reduces risk. For Levels 3–4 cross-domain, pipeline, schema, or infrastructure work, separate Sol High planning, authorized implementation, and QA into distinct rounds.

## Validation and reporting

QA always verifies the diff surface, whitespace, and ownership, then selects checks for the changed behavior. Website source or build changes require `npm run build`; Hexo work requires `npm run hexo:build`; pipeline work uses `npm run notes:sync:dry` when a source path is available. UI changes receive rendered light/dark, mobile, accessibility, and UI-reference review when practical. Documentation and agent-rule changes use parsing, contradiction, path/secret, link, and diff checks appropriate to their formats. A required but unverified build is `BLOCKED: build not verified`.

Reports preserve decisions, material risks, blockers, validation, and next actions while omitting routine tool narration. Ownership, privacy, release permissions, and stop rules are centralized in `CODEX_AGENT_ROUTING.md`; agent TOMLs add only lane-specific boundaries.
