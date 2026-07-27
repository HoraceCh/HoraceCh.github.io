# Codex Agent Routing

Use the six existing agents only: `project_architect`, `obsidian_notes_pipeline`, `design_system_curator`, `content_ia_editor`, `frontend_implementer`, and `qa_build_reviewer`. Their ownership boundaries and model defaults are defined in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md); the operating workflow is in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

## Routing decisions

- Start at Terra Medium. Use Luna Low only when the work is explicit, low-risk, and mechanically verifiable. Escalate to Sol High for material ambiguity, cross-domain risk, architecture, pipeline, schema, privacy, deployment, or a critical release gate.
- Default to one owner and serial handoffs. Parallel work is allowed only for independent, read-only exploration or risk review; implementation remains single-writer and depth one. Only the root orchestrator delegates, and no agent recursively spawns another agent.
- `project_architect` plans cross-domain, routing, migration, and ownership work. `obsidian_notes_pipeline` owns sync, notes schema, generated content, assets, and privacy boundaries. `design_system_curator` supplies visual specs. `content_ia_editor` owns content and IA. `frontend_implementer` makes scoped UI changes. `qa_build_reviewer` is the only release gate.
- Use an agent only within its documented lane. A request outside that lane is a handoff, not an expanded scope.
- Repository reads, authorized local edits, and non-destructive validation may proceed without additional approval. Commit, push, publish, deploy, destructive actions, external messages, and work outside the authorized file scope require explicit user authorization. `qa_build_reviewer` reports readiness but does not perform release actions.

## Default prompt structure

Use these six sections for new work. Keep them outcome-first and include only information that changes the decision, execution, or completion bar.

```text
Goal
[owner, responsibility, and single user-visible outcome]

Success criteria
[observable completion bar]

Context and evidence
[relevant files, current behavior, supplied facts, or prior handoff]

Constraints and permissions
[file scope, ownership/security boundaries, approvals, and true invariants]

Tools and validation
[relevant inspection, one or two meaningful fallbacks, and behavior-matched validation]

Output and stop rules
[required report shape, completion condition, handoff condition, and blockers]
```

Prefer success criteria to prescribed reasoning. Use `MUST`, `NEVER`, and `ONLY` for true invariants; use decision rules for contextual choices. Parallelize independent reads, keep dependent work sequential, and try one or two meaningful fallbacks when a result is empty or suspicious. Reports preserve decisions, material risks, blockers, validation, and next actions while omitting routine tool narration.

## Current Codex capabilities

- Use Goal mode for multi-step work with an explicit outcome and measurable completion criteria. It is optional for small tasks and is started from the Codex interface; do not invent a repository configuration field for it.
- Browser rendering, DOM, console, network inspection, and visual annotations are optional enhanced validation. For frontend changes, inspect the affected rendered page when browser tooling is available, but never make it a build dependency.
- Computer Use is an optional interface capability for tasks that require a GUI. It is not part of the release gate and does not justify broad desktop-control permissions.
- Every implementation task identifies exactly one Project and one repository root. Cross-repository compatibility review is read-only unless a separate authorized task is opened in each Project.

## Task patterns

### Implementation

Name the implementation owner, exact allowed files, user-visible acceptance criteria, and behavior-matched checks. For frontend work, use `docs/design/UI_DESIGN.md` as evidence, preserve existing patterns, and inspect rendered output when practical.

### Specialist spec or triage

Name the specialist and requested decision. A design spec identifies the visual contract and handoff; content work identifies approved claims and editable files; pipeline triage identifies the reproduction, root cause, safe fix, and validation.

### QA gate

Use `qa_build_reviewer` and the project-local `website-release-gate` Skill. Select Luna, Terra, or Sol using the routing decision above. Report exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; a required but unverified build is `BLOCKED: build not verified`.

### Interrupted work

Use `qa_build_reviewer` with the project-local `interrupted-run-recovery` Skill to classify the working tree and name the next owner.
