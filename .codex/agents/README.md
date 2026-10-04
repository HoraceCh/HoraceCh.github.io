# Agents — HoraceCh Personal Website

This directory defines six non-overlapping agents. Read `AGENTS.md` first. `docs/CODEX_MODEL_USAGE.md` is the model-routing source of truth; `docs/CODEX_AGENT_ROUTING.md` defines prompt structure and handoffs; `docs/AGENT_WORKFLOW.md` defines execution and validation.

Use one primary owner by default. Route qualified bounded work to L1 or L2, engineering synthesis to L3, and difficult judgment to L4. L0 runs resolved mechanics without a model; L5 is disabled by default. Independent read-only exploration may run in parallel, while implementation has one writer and delegation depth one. Do not add a permanent scout agent. Only the architect carries a runtime compatibility pin in TOML; the derived registry snapshot controls its Website pilot override. Other roles leave stage- and risk-matched routing to the caller.

The `project_architect` pin is the EO-19 native-CLI aligned-tuple exception. Root model and effort, this pin, and the explicit child request must all be GPT-6.1 Sol High. A fresh child runtime record must attest the role, model, reasoning, and loaded instructions before consequential work. If attestation fails, use the registry rollback binding. Desktop heterogeneous per-role overrides are not an accepted path.

## The six agents

| Agent | File | Default routing | Owns and boundary | Sandbox |
|---|---|---|---|---|
| `project_architect` | `project-architect.toml` | L4 | Astro/Hexo boundary, IA layout, cross-layer plans, migrations, schema and routing decisions | read-only |
| `obsidian_notes_pipeline` | `obsidian-notes-pipeline.toml` | L1–L4 by phase | Bounded evidence or known-path work / engineering implementation / schema, publication, generated-note, asset, and privacy decisions | workspace-write |
| `design_system_curator` | `design-system-curator.toml` | L2–L4 by phase | Visual direction, tokens, motion spec, dark/light contract, and foundational redesign judgment | read-only |
| `frontend_implementer` | `frontend-implementer.toml` | L1–L4 by phase | Explicit bounded work / routine implementation / ambiguous architecture or interactions | workspace-write |
| `content_ia_editor` | `content-ia-editor.toml` | L1–L3 by phase | Deterministic cleanup or migration / nuanced prose and IA / foundational positioning | workspace-write |
| `qa_build_reviewer` | `qa-build-reviewer.toml` | L1–L4 by phase | Mechanical Gate 1 / semantic QA / critical release judgment | workspace-write (for running scripts) |

## Design references

Visual work follows `docs/design/UI_DESIGN.md`. The approved references are Vercel-like light and Linear-like dark: restrained monochrome, hairline borders, and a calm developer-notebook reading mode. Do not expand that direction without user approval.

## Handoff rules

- Each agent reports the requested decision or changed files, material risks, validation, and next owner.
- If work belongs to another lane, stop and name that owner.
- `qa_build_reviewer` alone reports release readiness: `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`.
