# Agents — HoraceCh Personal Website

This directory defines six non-overlapping agents. Read `AGENTS.md` first. `docs/CODEX_MODEL_USAGE.md` is the model-routing source of truth; `docs/CODEX_AGENT_ROUTING.md` defines prompt structure and handoffs; `docs/AGENT_WORKFLOW.md` defines execution and validation.

Use one primary owner by default. Maximize Luna workload while minimizing Luna authority: Luna Low/Medium prepares facts, performs bounded known-path work, validates, and supplies mechanical Gate 1; Luna High handles only large deterministic work with strong checks. Terra performs routine synthesis and settled high-risk implementation; Sol retains difficult judgment. Independent read-only exploration may run in parallel, while implementation has one writer and delegation depth one. Do not add a permanent scout agent. Only the always-Sol architect pins its model and reasoning in TOML; other roles leave stage- and risk-matched routing to the caller.

## The six agents

| Agent | File | Default routing | Owns and boundary | Sandbox |
|---|---|---|---|---|
| `project_architect` | `project-architect.toml` | Sol High | Astro/Hexo boundary, IA layout, cross-layer plans, migrations, schema and routing decisions | read-only |
| `obsidian_notes_pipeline` | `obsidian-notes-pipeline.toml` | Luna Low-High / Terra Medium-High / Sol High | Deterministic evidence or known-path work / routine or settled critical implementation / schema, publication, generated-note, asset, and privacy decisions | workspace-write |
| `design_system_curator` | `design-system-curator.toml` | Terra Medium / Sol Medium-High | Visual direction, tokens, motion spec, dark/light contract, and foundational redesign judgment | read-only |
| `frontend_implementer` | `frontend-implementer.toml` | Luna Low-High / Terra Medium-High / Sol Medium-High | Explicit deterministic work / routine or settled critical implementation / ambiguous architecture or interactions | workspace-write |
| `content_ia_editor` | `content-ia-editor.toml` | Luna Low-High / Terra Medium / Sol Medium | Deterministic cleanup or migration / nuanced prose and IA / foundational positioning | workspace-write |
| `qa_build_reviewer` | `qa-build-reviewer.toml` | Luna Low-Medium / Terra Medium-High / Sol Medium-High | Mechanical Gate 1 / semantic QA / critical release judgment | workspace-write (for running scripts) |

## Design references

Visual work follows `docs/design/UI_DESIGN.md`. The approved references are Vercel-like light and Linear-like dark: restrained monochrome, hairline borders, and a calm developer-notebook reading mode. Do not expand that direction without user approval.

## Handoff rules

- Each agent reports the requested decision or changed files, material risks, validation, and next owner.
- If work belongs to another lane, stop and name that owner.
- `qa_build_reviewer` alone reports release readiness: `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`.
