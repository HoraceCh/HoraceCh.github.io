# Subagents — HoraceCh Personal Website

This directory defines the compact agent system for this repository. Six agents, non-overlapping ownership, sequential handoffs.

Read `AGENTS.md` at the repo root first. It defines the project's IA, voice, and hard rules. Every agent here inherits from it.

Model routing lives in `docs/CODEX_MODEL_USAGE.md`; agent routing and prompt templates live in `docs/CODEX_AGENT_ROUTING.md`; the project workflow is `docs/AGENT_WORKFLOW.md`. The project-local `.codex/config.toml` sets `max_threads = 3`, `max_depth = 1`, 30-minute jobs, and interrupt messages.

Use one primary agent by default. Subagents are read-only and exceptional: independent exploration, risk review, or an architect/specialist second opinion only. Never use multiple write-capable agents in an implementation phase, and do not add agents for homepage, Notes UI, theme, animation, or graph work.

## The six agents

| Agent | File | Owns | Never touches | Sandbox |
|---|---|---|---|---|
| `project_architect` | `project-architect.toml` | Astro/Hexo boundary, IA layout, cross-layer plans, `astro.config.mjs`, schema decisions | Visual styling, prose, direct code edits | read-only |
| `obsidian_notes_pipeline` | `obsidian-notes-pipeline.toml` | `tools/sync-obsidian-notes.mjs`, generated notes, `notes-assets` convention, `content.config.ts` notes schema | UI, page templates, prose | workspace-write |
| `design_system_curator` | `design-system-curator.toml` | Visual direction, tokens, motion spec, dark/light contract, hand-off spec to implementer | Writing CSS, Astro, sync script, prose | read-only |
| `frontend_implementer` | `frontend-implementer.toml` | `src/components/**`, `src/layouts/**`, `src/pages/**`, `src/styles/global.css` | Sync script, content, config, workflows | workspace-write |
| `content_ia_editor` | `content-ia-editor.toml` | Hand-written copy, page copy, project frontmatter, docs prose | Components, styles, generated notes, schema | workspace-write |
| `qa_build_reviewer` | `qa-build-reviewer.toml` | Build gate, diff review, cross-agent boundary check | Feature implementation | workspace-write (for running scripts) |

## Design references (locked)

Use Vercel light and Linear dark as visual references. Do not expand this direction without user approval.

- Vercel-like light is the light-mode base: monochrome, hairline borders, and mono for metadata.
- Linear-like dark is the dark-mode base: near-black substrate, low-weight type, and 0.5px hairlines.
- The site remains a minimal developer notebook with a calm Obsidian-like reading mode.

Local design notes may be consulted manually when available, but agents must not assume they exist in the repository or hard-code their paths.

Rationale: both references match the "developer's notebook" character of an early-stage-researcher portfolio. They provide complementary light/dark discipline without competing with each other. Brand-heavy or consumer-app references were rejected because they violate `AGENTS.md` ("Minimal / Technical / Honest / Avoid hype and buzzwords").

## Workflow patterns

### 1. Homepage identity / About / Resume copy pass
```
content_ia_editor  →  design_system_curator (if layout feels off)  →  frontend_implementer (if template must change)  →  qa_build_reviewer
```
Skip `design_system_curator` and `frontend_implementer` if the change is copy-only inside existing markup.

### 2. Obsidian notes publishing
```
project_architect (only for a schema or asset-URL change)  →  obsidian_notes_pipeline  →  frontend_implementer (only if a notes UI template must change)  →  qa_build_reviewer
```
Most sync changes go: `obsidian_notes_pipeline → qa_build_reviewer`.

### 3. Visual polish (tokens, dark mode, spacing, motion)
```
design_system_curator  →  frontend_implementer  →  qa_build_reviewer
```

### 4. Architecture change or cross-layer refactor
```
project_architect  →  { obsidian_notes_pipeline | frontend_implementer | content_ia_editor }  →  qa_build_reviewer
```

### 5. Release readiness
```
qa_build_reviewer
```
Run this alone before every commit that touches more than one file.

## Handoff rules

- Each agent produces the deliverable format defined in its `.toml`. Downstream agents refuse to start without it.
- If an agent finds work that belongs to another lane, it **stops and names the correct owner**. It does not silently cross the line.
- `qa_build_reviewer` is the only agent allowed to report readiness. Every other agent reports "handed off to X" or "blocked — need Y".
- No agent commits, pushes, or opens PRs. The user does that manually.
- Reports are bounded: planning/spec 120 lines, implementation 80 lines, QA 60 lines, recovery 50 lines.
- `qa_build_reviewer` returns one status only: `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; a missing required build is `BLOCKED: build not verified`.

## What was retired and why

The previous six-agent set (`website-architect`, `website-worker`, `website-reviewer`, `website-explorer`, `website-docs-researcher`, `website-ui-debugger`) has been replaced. See `.codex/agents/CHANGELOG.md` for the per-file rationale.

## Adding a new agent

Don't, unless one of these is true:
- A recurring class of work exists that none of the six covers and cannot be added to an existing one without breaking its scope.
- The user explicitly requests it.

If you add one, it must have: a single clear trigger, a file-ownership list, a non-goals list, a required-output format, and a handoff target. Vague agents are rejected.
