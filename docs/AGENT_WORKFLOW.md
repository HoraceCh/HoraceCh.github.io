# HoraceCh Agent Workflow

This Astro site is a personal research portfolio and public knowledge garden. Its fixed IA is Home / About / Projects / Notes / Resume / Contact; Notes are published through the Obsidian pipeline. Keep changes static-build friendly, minimal, technical, and honest.

Read [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md) for the Plus-aware model defaults and [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md) for agent boundaries, output limits, and reusable prompts.

The normal root/default is GPT-5.6 Terra Medium. Sol is available and reserved for complex, high-risk, or high-value work; Luna is limited to explicit, repeatable, low-risk work with mechanically verifiable success criteria. Use the lowest reasoning effort that reliably completes the task.

## Entry flow

1. Name one primary owner and an exact allowed-file list.
2. For Level 2 work, request a specialist spec/audit before editing. For Level 3 or 4 work, begin with `project_architect`.
3. Let the authorized implementer make the scoped change.
4. Send every multi-file change, pipeline change, or pre-commit diff to `qa_build_reviewer`.
5. Do not commit before the required QA gate passes.

## Project-specific ownership

- `project_architect`: Astro/Hexo boundary, IA, schema/migration plans, and cross-domain scope. It plans by default.
- `obsidian_notes_pipeline`: publish sync, slugs, backlinks, tags, assets, notes schema, and generated-note safety. Start from `npm run notes:sync:dry` output when available; never scan the whole vault.
- `design_system_curator`: Vercel-light / Linear-dark visual contract. It reads `docs/design/UI_DESIGN.md` and returns an implementable spec, not CSS.
- `content_ia_editor`: precise, non-hyped copy and information architecture. It never changes styling or layout.
- `frontend_implementer`: Astro/UI implementation after a clear handoff. It must not alter sync scripts, schemas, generated notes, deploy workflows, design tokens, or agent rules unless explicitly allowed.
- `qa_build_reviewer`: release gate and boundary reviewer. It can block.

## Risk flows

### Level 0 — explanation only

Do not use Codex. Answer in conversation.

### Level 1 — small single-file fix

Terra Medium implementation → Luna Low mechanical QA. No subagents.

### Level 2 — single-domain task

Terra Medium with one relevant specialist. Request a spec or audit first where appropriate. `design_system_curator`, `content_ia_editor`, or `obsidian_notes_pipeline` returns only a spec, audit, or triage unless implementation is explicitly requested; pipeline work that exceeds the documented Terra exceptions remains Sol High.

### Level 3 — cross-domain site change

Sol High `project_architect` plan → Terra Medium scoped implementation → Terra Medium/High semantic QA. Keep each phase in a separate round.

### Level 4 — pipeline or infrastructure change

Keep phases strictly separate: Round 1 Sol High `project_architect` only → Round 2 Sol High specialist analysis → Round 3 Sol High or Terra High authorized implementation, depending on complexity → Round 4 Sol High critical `qa_build_reviewer` gate. Never combine planning, implementation, and QA in one prompt.

## Required validation

QA must verify `git status --short`, `git diff --check`, a diff summary, and `npm run build`. It also runs `npm run hexo:build` for Hexo-related changes and `npm run notes:sync:dry` for pipeline work when a source path is available. If a required build is missing, the result is `BLOCKED: build not verified`.

## Non-negotiable boundaries

- Do not create overlapping specialist agents.
- Do not run multiple write-capable agents concurrently.
- Do not edit generated notes directly or widen the Obsidian publish scope beyond the configured source.
- Do not invent author achievements, outcomes, awards, publications, or metrics.
- Do not run formatters that can touch unrelated files.
