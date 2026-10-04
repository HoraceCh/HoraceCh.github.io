# Codex Agent Routing

Use the six existing agents only: `project_architect`, `obsidian_notes_pipeline`, `design_system_curator`, `content_ia_editor`, `frontend_implementer`, and `qa_build_reviewer`. Their ownership boundaries and model defaults are defined in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md); the operating workflow is in [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

## Routing decisions

- Keep root launch selection with the user. Before assigning a model, ask whether resolved mechanics can run at L0 with direct checks. Use qualified L1/L2 for bounded facts and known-path work, L3 for engineering synthesis, and L4 for high judgment. L5 is disabled until comparative evidence justifies it.
- Treat capability and reasoning effort as separate choices. Route by semantic need, ambiguity, coupling, reversibility, authority/risk, verification, frequency, latency/cost sensitivity, and output criticality. High impact alone is not a reason to spend L4 on deterministic execution.
- Route non-trivial work by stage when that saves meaningful context: bounded discovery/evidence, L3 or L4 decision, bounded or engineering implementation, mechanical QA, then semantic QA only when risk requires it. Do not add a seventh scout agent or fragment a small coherent task merely to follow the pattern.
- Default to one owner and serial handoffs. Parallel work is allowed only for independent, read-only exploration or risk review; implementation remains single-writer and depth one. Only the root orchestrator delegates, and no agent recursively spawns another agent.
- `project_architect` plans cross-domain, routing, migration, and ownership work. `obsidian_notes_pipeline` owns sync, notes schema, generated content, assets, and privacy boundaries. `design_system_curator` supplies visual specs. `content_ia_editor` owns content and IA. `frontend_implementer` makes scoped UI changes. `qa_build_reviewer` is the only release gate.
- Use an agent only within its documented lane. A request outside that lane is a handoff, not an expanded scope.
- Repository reads, authorized local edits, and non-destructive validation may proceed without additional approval. Commit, push, publish, deploy, destructive actions, external messages, and work outside the authorized file scope require explicit user authorization. `qa_build_reviewer` reports readiness but does not perform release actions.

## Executable route selection

Route from task shape, not from prose labels such as “important” or “hard.” Classify each independently useful phase with these fields from `config/codex-workflow.json`:

- `domain`: `architecture`, `notes`, `design`, `content`, `frontend`, or `qa`;
- `phase`: `explain`, `execute`, `discover`, `decide`, `implement`, or `qa`;
- `authorityState`: required as `resolved` for L0 `execute`; other phases keep their usual judgment and approval boundaries;
- `scope`: `single`, `domain`, or `cross-domain`;
- `ambiguity`: `low`, `contained`, or `material`;
- `verification`: `direct` when a deterministic check can decide success, otherwise `semantic`;
- `workload`: `small`, `normal`, or `large`;
- `risks`: only verified architecture, deployment, privacy, publication, schema, or security risk flags.

Run `npm run route:codex -- [classification flags]` to obtain a route envelope. It contains the owner, phase, capability level, semantic `modelLane`, `bindingState`, effective `model`, reasoning, `contextTier`, `contextMode`, runtime constraint, attestation requirement, authority, and gate. Its decision order is deliberate:

1. Explanation stays in the current user-selected root conversation and does not select a routed model.
2. Resolved `execute` mechanics with low ambiguity and direct verification bypass models at L0, even for high-impact Git, PR, or deployment mechanics. The root orchestrates the specified tool action after required QA and user authorization; L0 grants no approval and never assigns release execution to the QA reviewer.
3. Small direct discovery and tiny edits use qualified L1; other bounded discovery, direct implementation, and mechanical QA use L2. If L1 is disabled or fails its exact gate, fall back to L2.
4. Material ambiguity, cross-domain decisions, and critical-risk decisions use L4 before implementation. Contained judgment and ordinary semantic engineering use L3.
5. After a critical contract is settled, implementation may use L3 with an L4 semantic gate. Large deterministic work stays at L2 Medium when fully specified and directly checked.
6. Ordinary semantic QA uses L3; critical semantic QA uses L4. L5 is never automatic.

When the envelope selects a different model or owner, start that phase with `contextMode=fresh-packet`: send the compact evidence packet and the six-part prompt, not the complete conversation. If the active runtime cannot honor the selected route, record the route as unavailable and execute only within the current model's authority; never claim that a model handoff occurred when it did not. One retained-diff writer remains the invariant.

The derived registry snapshot resolves `fast`, `standard`, and `deep` bindings after capability classification. Only a routed L4 `project_architect` child receives the Website GPT-6.1 Sol High pilot override. It requires native CLI, an aligned root/role/explicit-child tuple, and a fresh child runtime record before consequential work. Use the snapshot rollback binding on failed attestation. Other L4 owners retain GPT-6 Sol High; L3 retains GPT-6 Sol Medium. C0–C3 context tiers are automatic metadata; C4 long context and C5 continuity require explicit admission.

Use this header before the six prompt sections:

```text
Route
owner=[agent or root]
phase=[phase]
level=[L0–L5]
modelLane=[fast, standard, deep, frontier, or null]
bindingState=[active, website-pilot, root-selected, or bypass]
model=[adapter model id or null for root/L0]
reasoning=[effort or null for root/L0]
contextTier=[C0–C3 automatic; C4/C5 explicit only]
contextMode=[current, none, or fresh-packet]
runtimeConstraint=[native-cli-aligned-tuple or null]
attestationRequired=[true or false]
authority=[answer, evidence, judgment, execute, mechanics-only, decision-first, mechanical-gate, or semantic-gate]
requiredGate=[none, mechanical, semantic-l3, or semantic-l4]
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

Use `qa_build_reviewer` and the project-local `website-release-gate` Skill. For meaningful changes, run L2 mechanical Gate 1 before semantic review. Gate 1 checks scope, changed files, required commands, exit status, evidence completeness, and obvious omissions; when Gate 2 is still required, it returns `MECHANICAL READY`, `MECHANICAL NOT READY`, or `MECHANICAL BLOCKED`, none of which is a release verdict. If it fails, stop unless L3/L4 judgment is needed to diagnose the failure. Use L3 for ordinary semantic QA and L4 for critical architecture, privacy, schema/publication, deployment, or release judgment. The repository-facing final report remains exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; a required but unverified build is `BLOCKED: build not verified`.

### Interrupted work

Use `qa_build_reviewer` with the project-local `interrupted-run-recovery` Skill to classify the working tree and name the next owner.
