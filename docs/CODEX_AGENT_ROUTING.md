# Codex Agent Routing

Use the six existing agents only: `project_architect`, `obsidian_notes_pipeline`, `design_system_curator`, `content_ia_editor`, `frontend_implementer`, and `qa_build_reviewer`. Responsibilities such as homepage, Notes UI, theme, animation, and graph work stay within these lanes; do not add overlapping agents.

The model defaults and task levels are in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md). The project workflow is in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

## Operating policy

- Default to one primary agent and serial handoffs.
- Use subagents only for parallel **read-only** risk review, independent directory exploration, or separate architect/specialist opinions before implementation.
- Never run multiple write-capable agents in the implementation phase and never delegate recursively beyond depth 1.
- Keep prompts short and scoped. Maximum outputs: planning/spec 120 lines, implementation report 80 lines, QA report 60 lines, interrupted-run recovery 50 lines.
- `qa_build_reviewer` is the only release gate. Its final status must be exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`.

## Reusable prompt templates

### Stable implementation

```text
Task:
[one outcome]
Context:
- Astro personal website; Obsidian publish pipeline; Vercel light + Linear dark.
Primary owner:
frontend_implementer
Allowed files:
- [exact paths]
Forbidden files:
- [exact paths]
Requirements:
1. [acceptance criterion]
Stop conditions:
- Stop and hand off if a file outside the allowed list is needed.
Commands:
- [only required verification commands]
Output limit: 80 lines.
Commit rule: do not commit; hand off to qa_build_reviewer.
```

### Design spec

```text
Use design_system_curator only. Do not edit code.
Task: [visual/tokens question]
Return: token decisions; affected components/selectors; implementation handoff; QA checklist.
Output limit: 120 lines.
```

### Content and IA

```text
Use content_ia_editor only. Do not edit layout or styling.
Task: [copy/IA question]
Return: terms to avoid; replacement principles; copy changes; editable files.
Output limit: 120 lines.
```

### Obsidian pipeline triage

```text
Use obsidian_notes_pipeline only. Start from `npm run notes:sync:dry` output when available.
Do not edit code first.
Return: severity-ranked triage; root cause; safe fix plan; QA checks.
Output limit: 120 lines.
```

### QA gate

```text
Use qa_build_reviewer only. Do not edit feature files.
Run or verify: git status --short; git diff --check; git diff summary; npm run build.
Also run npm run hexo:build when Hexo-related files are touched, and npm run notes:sync:dry when the notes pipeline changed and a source path is available.
Return exactly one: PASS / PASS WITH WARNINGS / FAIL / BLOCKED.
If a required build was not run: BLOCKED: build not verified.
Output limit: 60 lines.
```

### Interrupted-run recovery

```text
Use qa_build_reviewer only. Do not edit files.
Check partial edits, forbidden-file changes, and build status.
Return exactly one: CLEAN / PARTIAL_EDIT / RISKY_EDIT / BUILD_FAIL.
Output limit: 50 lines.
```
