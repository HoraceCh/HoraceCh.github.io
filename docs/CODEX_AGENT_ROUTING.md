# Codex Agent Routing

Use the six existing agents only: `project_architect`, `obsidian_notes_pipeline`, `design_system_curator`, `content_ia_editor`, `frontend_implementer`, and `qa_build_reviewer`. Their ownership boundaries and model defaults are defined in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md); the operating workflow is in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

## Routing decisions

- Keep the root at Terra Medium for intake, routing, and ordinary synthesis. Before giving a phase to Terra or Sol, ask whether Luna Low/Medium can complete or prepare it with independent verification; Luna High is allowed only for large deterministic work with strong checks. Luna owns workload, not architecture, contract, privacy, or release authority.
- Treat model capability and reasoning effort as separate choices. Use Terra Medium for routine engineering, Sol Medium for contained semantic or design judgment, and Sol High for material ambiguity, cross-domain risk, architecture, schema/publication semantics, privacy, deployment, or a critical release gate. Escalate the model before using extreme Luna reasoning to compensate for semantic uncertainty.
- Route non-trivial work by stage when that saves meaningful context: Luna discovery/evidence, Terra or Sol decision, Luna or Terra bounded implementation, Luna mechanical QA, then Terra/Sol semantic QA only when risk requires it. Do not add a seventh scout agent or fragment a small coherent task merely to follow the pattern.
- Default to one owner and serial handoffs. Parallel work is allowed only for independent, read-only exploration or risk review; implementation remains single-writer and depth one. Only the root orchestrator delegates, and no agent recursively spawns another agent.
- `project_architect` plans cross-domain, routing, migration, and ownership work. `obsidian_notes_pipeline` owns sync, notes schema, generated content, assets, and privacy boundaries. `design_system_curator` supplies visual specs. `content_ia_editor` owns content and IA. `frontend_implementer` makes scoped UI changes. `qa_build_reviewer` is the only release gate.
- Use an agent only within its documented lane. A request outside that lane is a handoff, not an expanded scope.
- Repository reads, authorized local edits, and non-destructive validation may proceed without additional approval. Commit, push, publish, deploy, destructive actions, external messages, and work outside the authorized file scope require explicit user authorization. `qa_build_reviewer` reports readiness but does not perform release actions.

## Executable route selection

Route from task shape, not from prose labels such as “important” or “hard.” Classify each independently useful phase with these fields from `config/codex-workflow.json`:

- `domain`: `architecture`, `notes`, `design`, `content`, `frontend`, or `qa`;
- `phase`: `explain`, `discover`, `decide`, `implement`, or `qa`;
- `scope`: `single`, `domain`, or `cross-domain`;
- `ambiguity`: `low`, `contained`, or `material`;
- `verification`: `direct` when a deterministic check can decide success, otherwise `semantic`;
- `workload`: `small`, `normal`, or `large`;
- `risks`: only verified architecture, deployment, privacy, publication, schema, or security risk flags.

Run `npm run route:codex -- [classification flags]` to obtain a route envelope. The envelope is machine-readable and contains `owner`, `phase`, `model`, `reasoning`, `contextMode`, `authority`, and `requiredGate`. Its decision order is deliberate:

1. Explanation stays with the Terra Medium root.
2. Discovery uses Luna Low for a small direct scan and Luna Medium otherwise, including preparation for high-risk judgment.
3. Material ambiguity, cross-domain decisions, and critical-risk decisions route judgment to Sol High before implementation.
4. Contained judgment uses Sol Medium; routine semantic engineering uses Terra Medium. Once a critical contract is settled and ambiguity is low, implementation may use Terra High while retaining a Sol semantic gate.
5. Explicit directly verifiable implementation uses Luna Low/Medium. Luna High is reserved for large, fully specified deterministic work with immediate checks.
6. Mechanical QA uses Luna; ordinary semantic QA uses Terra; critical semantic QA uses Sol High.

When the envelope selects a different model or owner, start that phase with `contextMode=fresh-packet`: send the compact evidence packet and the six-part prompt, not the complete conversation. If the active runtime cannot honor the selected route, record the route as unavailable and execute only within the current model's authority; never claim that a model handoff occurred when it did not. One retained-diff writer remains the invariant.

Use this header before the six prompt sections:

```text
Route
owner=[agent or root]
phase=[phase]
model=[exact model id]
reasoning=[effort]
contextMode=[current or fresh-packet]
authority=[answer, evidence, judgment, execute, decision-first, mechanical-gate, or semantic-gate]
requiredGate=[none, mechanical, semantic-terra, or semantic-sol]
```

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

For a handoff, `Context and evidence` contains only verified facts, governing paths or symbols, validation already run, the exact uncertainty, surviving interpretations, and the requested decision. The receiving agent fresh-reads governing contracts and stops when the route envelope's authority is exhausted.

## Current Codex capabilities

- Use Goal mode for multi-step work with an explicit outcome and measurable completion criteria. It is optional for small tasks and is started from the Codex interface; do not invent a repository configuration field for it.
- Browser rendering, DOM, console, network inspection, and visual annotations are optional enhanced validation. For frontend changes, inspect the affected rendered page when browser tooling is available, but never make it a build dependency.
- Computer Use is an optional interface capability for tasks that require a GUI. It is not part of the release gate and does not justify broad desktop-control permissions.
- Every implementation task identifies exactly one Project and one repository root. Cross-repository compatibility review is read-only unless a separate authorized task is opened in each Project.

## Dynamic Rules

Keep global identity, ownership, and routing in `AGENTS.md` and these workflow documents. Use `.omo/rules/*.md` only for safety-critical instructions that become relevant when a matching file is edited:

- `agent-policy.md` activates for routing configuration, agent definitions, evaluators, validators, and workflow documents;
- `notes-publication.md` activates for the Obsidian publication boundary, schema, generated notes, assets, and its contracts.

Every dynamic rule uses bounded `globs` and `alwaysApply: false`. Do not copy the full global policy into a dynamic rule, create style-persona rules, or use dynamic Rules to expand file authority. `npm run rules:validate` checks the frontmatter and allowlist.

## Task patterns

### Implementation

Name the implementation owner, exact allowed files, user-visible acceptance criteria, and behavior-matched checks. For frontend work, use `docs/design/UI_DESIGN.md` as evidence, preserve existing patterns, and inspect rendered output when practical.

### Specialist spec or triage

Name the specialist and requested decision. A design spec identifies the visual contract and handoff; content work identifies approved claims and editable files; pipeline triage identifies the reproduction, root cause, safe fix, and validation.

### QA gate

Use `qa_build_reviewer` and the project-local `website-release-gate` Skill. For meaningful changes, run Luna mechanical Gate 1 before expensive semantic review. Gate 1 checks scope, changed files, required commands, exit status, evidence completeness, and obvious omissions; when Gate 2 is still required, it returns `MECHANICAL READY`, `MECHANICAL NOT READY`, or `MECHANICAL BLOCKED`, none of which is a release verdict. If it fails, stop unless Terra/Sol judgment is needed to diagnose the failure. Use Terra for ordinary semantic QA and Sol for critical architecture, privacy, schema/publication, deployment, or release judgment. The repository-facing final report remains exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; a required but unverified build is `BLOCKED: build not verified`.

### Interrupted work

Use `qa_build_reviewer` with the project-local `interrupted-run-recovery` Skill to classify the working tree and name the next owner.
