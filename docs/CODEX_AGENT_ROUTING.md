# Codex Agent Routing

Use the six existing agents only: `project_architect`, `obsidian_notes_pipeline`, `design_system_curator`, `content_ia_editor`, `frontend_implementer`, and `qa_build_reviewer`. Their ownership boundaries and model defaults are defined in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md); the operating workflow is in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

## Routing decisions

- Start at Terra Medium. Use Luna Low only when the work is explicit, low-risk, and mechanically verifiable. Escalate to Sol High for material ambiguity, cross-domain risk, architecture, pipeline, schema, privacy, deployment, or a critical release gate.
- Default to one owner and serial handoffs. Parallel work is allowed only for independent, read-only exploration or risk review; implementation remains single-writer and depth one.
- `project_architect` plans cross-domain, routing, migration, and ownership work. `obsidian_notes_pipeline` owns sync, notes schema, generated content, assets, and privacy boundaries. `design_system_curator` supplies visual specs. `content_ia_editor` owns content and IA. `frontend_implementer` makes scoped UI changes. `qa_build_reviewer` is the only release gate.
- Use an agent only within its documented lane. A request outside that lane is a handoff, not an expanded scope.

## Default prompt structure

Use this structure for new work. Keep it outcome-first; include only information that changes the decision or execution.

```text
Role
[owner and responsibility]

Goal
[single user-visible outcome]

Success criteria
- [observable completion bar]

Context and evidence
- [relevant files, current behavior, supplied facts, or prior handoff]

Constraints and permissions
- [file scope, ownership/security boundaries, approvals, and invariants]

Tools and validation
- [only relevant inspection, fallback, and validation steps]

Output and stop rules
- Report decisions, material risks, blockers, validation, and next action.
- Stop and hand off if the task needs another owner, an unauthorized file, or a product decision.
```

Decision rules belong in the relevant agent prompt. Use `MUST`, `NEVER`, and `ONLY` for invariants, not preferences. Prefer success criteria to prescribed reasoning. When a result is empty or suspicious, use one or two meaningful fallbacks before reporting a blocker.

## Task patterns

### Implementation

Name the implementation owner, the exact allowed files, user-visible acceptance criteria, and the relevant checks. For frontend work, include `docs/design/UI_DESIGN.md` as evidence and inspect rendered output when practical. Do not include routine command narration in the final report.

### Specialist spec or triage

Name the specialist and requested decision. A design spec identifies the visual contract and implementation handoff; content work identifies approved claims and editable files; pipeline triage identifies the reproduction, root cause, safe fix, and validation.

### QA gate

Use `qa_build_reviewer`. Select Luna, Terra, or Sol using the routing decision above. Report exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; a required but unverified build is `BLOCKED: build not verified`.

### Interrupted work

Use `qa_build_reviewer` to classify the working tree as `CLEAN`, `PARTIAL_EDIT`, `RISKY_EDIT`, or `BUILD_FAIL`, then name the next owner.
