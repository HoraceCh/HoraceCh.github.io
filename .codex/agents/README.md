# Agents — HoraceCh Personal Website

This directory defines six non-overlapping agents. Read `AGENTS.md` first. `docs/CODEX_MODEL_USAGE.md` is the model-routing source of truth; `docs/CODEX_AGENT_ROUTING.md` defines prompt structure and handoffs; `docs/AGENT_WORKFLOW.md` defines execution and validation.

Use one primary owner by default. Independent read-only exploration may run in parallel; implementation has one writer and depth one. Model selection, permissions, prompt structure, output rules, and approval boundaries are defined centrally rather than repeated in agent prompts.

## The six agents

| Agent | File | Default routing | Owns and boundary | Sandbox |
|---|---|---|---|---|
| `project_architect` | `project-architect.toml` | Sol High | Astro/Hexo boundary, IA layout, cross-layer plans, migrations, schema and routing decisions | read-only |
| `obsidian_notes_pipeline` | `obsidian-notes-pipeline.toml` | Sol High | Sync behavior, links/assets, schema, generated-note and private-content safety | workspace-write |
| `design_system_curator` | `design-system-curator.toml` | Terra Medium | Visual direction, tokens, motion spec, dark/light contract, hand-off spec | read-only |
| `frontend_implementer` | `frontend-implementer.toml` | Terra Medium | Scoped Astro/UI implementation; no pipeline, schema, deploy, generated-note, or agent-rule changes without authorization | workspace-write |
| `content_ia_editor` | `content-ia-editor.toml` | Terra Medium | Hand-written copy, page copy, project frontmatter, and docs prose | workspace-write |
| `qa_build_reviewer` | `qa-build-reviewer.toml` | Luna Low / Terra Medium-High / Sol High | Mechanical QA / semantic QA / critical release gate | workspace-write (for running scripts) |

## Design references

Visual work follows `docs/design/UI_DESIGN.md`. The approved references are Vercel-like light and Linear-like dark: restrained monochrome, hairline borders, and a calm developer-notebook reading mode. Do not expand that direction without user approval.

## Handoff rules

- Each agent reports the requested decision or changed files, material risks, validation, and next owner.
- If work belongs to another lane, stop and name that owner.
- `qa_build_reviewer` alone reports release readiness: `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`.
