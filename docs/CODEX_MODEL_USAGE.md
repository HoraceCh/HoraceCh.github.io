# Codex Model Usage

This is the model-routing source of truth for the HoraceCh Astro website. The active family is GPT-5.6 Sol, Terra, and Luna. Model capability and reasoning effort are separate routing decisions; an agent name is an ownership boundary, not a permanent capability tier.

## Operating doctrine

**Maximize Luna workload. Minimize Luna authority.**

The optimization target is not the percentage of complete tasks assigned to Luna. It is the amount of factual, repetitive, read-heavy, mechanically transformable, and independently verifiable work removed from Terra and Sol. Luna should find facts, run checks, perform bounded known-path work, and compress evidence. Terra should perform ordinary engineering synthesis. Sol should resolve uncertainty and retain high-risk judgment.

Keep the six existing agents. Do not add a permanent scout or evidence agent: use Luna as a stage inside the appropriate owner or reviewer lane. The root remains Terra Medium because intake, routing, and handoff decisions require more synthesis than a mechanical worker, while routine delegated phases may use Luna aggressively.

## Model and reasoning axes

Use the lowest configuration that can reliably satisfy the success criteria and validation contract.

| Configuration | Use when | Do not use it to |
| --- | --- | --- |
| Luna Low (`low`; UI may say Light) | Single-file or command-driven work with an explicit procedure and immediate verification | Interpret contracts, choose architecture, or judge release safety |
| Luna Medium | Multi-file factual discovery, CodeGraph mapping, test triage, evidence compression, deterministic migrations, or bounded implementation with strong checks | Compensate for unresolved semantics by thinking longer |
| Luna High | Large, fully specified deterministic transformations with strong fixtures and immediate validation, after Luna Medium is measured insufficient | Interpret ambiguity, own critical decisions, or replace a more capable model |
| Terra Medium | Root orchestration, routine specialist work, ordinary implementation, and normal semantic synthesis | Decide high-risk architecture, privacy, schema, or deployment ambiguity |
| Terra High | Semantically coupled but well-governed implementation or review where the contract is already settled | Replace Sol when the governing contract itself is uncertain |
| Sol Medium | Contained architectural, design, product, debugging, contract, or test-sufficiency judgment | Process raw inventories or routine logs that Luna can compress |
| Sol High | Cross-domain ambiguity, large blast radius, competing approaches, privacy/security boundaries, schema/publication semantics, critical release judgment, or hard root-cause analysis | Serve as the default merely because a task is important |
| Luna XHigh / Max | Runtime-exposed comparison candidates only when a large deterministic Luna High workload misses its measured bar | Become an automatic route or retain critical authority |
| Terra / Sol XHigh / Max | Exceptional correctness audits, final architecture adjudication, critical migration go/no-go, or difficult failure-state reasoning | Replace clearer scope, better evidence, tests, or an independent review |
| Terra / Sol Ultra (Codex session only) | Last-resort session experiment after Max is measurably insufficient and the active surface exposes it | Enter durable agent TOMLs or be confused with multi-agent execution |

Repository TOMLs use `low`, `medium`, or `high` for durable defaults. XHigh, Max, and any Codex-only Ultra control are exceptional session-level comparisons and should not be pinned into project agents. Luna High is a throughput tier for deterministic work, not a semantic escalation. If Luna Medium reaches semantic ambiguity, escalate capability to Terra or Sol before raising Luna reasoning. If Medium underperforms, first repair missing success criteria, authority, scope, dependency context, or validation requirements.

Raise effort only when the same representative cases show a material gain in task success, answer or artifact completeness, and required evidence. Record total tokens, latency, and cost when the runtime exposes them. Compare the current effort with one level lower after model migrations. Lower effort when quality remains at the acceptance bar; do not treat fewer calls or shorter output as an improvement when the final artifact loses required evidence.

Current Codex surfaces may expose `ultra` as a session thinking control for Terra or Sol, while official API reasoning guidance is portable only through Max; Codex also uses Ultra terminology for multi-agent execution. Treat both meanings as runtime-specific and record which one was used. Use multi-agent execution only when the user or active runtime authorizes it, the task splits into independent workstreams, and the existing three-agent, depth-one, single-writer limits remain intact. Treat Pro or similar quality-first modes as external runtime options that require the same representative evaluation; never pin `ultra` or `pro` in a project agent.

## Luna-first admission rule

Before assigning a phase to Terra or Sol, ask whether Luna can complete or prepare it reliably with independent verification. Prefer Luna when the answer is yes.

Luna-first work includes:

- repository, symbol, caller/callee, ownership, contract, and affected-test discovery;
- CodeGraph exploration where available, while treating graph output as navigation rather than runtime or contract authority;
- working-tree, diff, dependency, warning, build, test, lint, typecheck, and artifact inventory;
- exact-command and exit-status collection plus concise evidence packets;
- fixtures, metadata, formatting, documentation synchronization, repetitive propagation, and deterministic migrations;
- known-path local fixes whose desired behavior is explicit, reversible, and directly testable;
- interrupted-run triage, current-state reconstruction, and handoff compression;
- first-stage QA for scope, required checks, missing evidence, and obvious incompleteness.

Luna may write only when scope and ownership are explicit, desired behavior is observable, validation is available, failure is reversible, and no architecture, security, privacy, publication, or contract decision remains. It must stop and escalate the exact uncertainty rather than silently choosing an interpretation.

Independent Luna reads may run in parallel when their questions do not depend on one another and the extra delegation will save meaningful context. The three-agent cap is a ceiling, not a utilization target. Retained-diff work remains single-writer.

## Agent defaults

| Agent | Default route | Alternate route | Authority boundary |
| --- | --- | --- | --- |
| `project_architect` | Sol High, pinned | Receive a compact Luna evidence packet before invocation; no lower-tier architecture decision | Cross-domain architecture, migrations, ownership/boundary decisions, and model routing. Read-only. |
| `obsidian_notes_pipeline` | Terra Medium for a known-contract, reproducible pipeline fix | Luna Low/Medium for discovery or bounded known-path work, Luna High for a large deterministic migration, Terra High after a critical contract is settled, and Sol High for schema, publish input, generated-note overwrite, asset-boundary, privacy, or ambiguous semantics | Pipeline implementation stays with this owner; Luna evidence never authorizes a boundary decision. |
| `design_system_curator` | Terra Medium | Luna Low/Medium for token/state inventory or checklist evidence; Sol Medium/High for foundational direction, conflicting references, full redesigns, or cross-page systems | Visual judgment and spec only; no direct UI implementation by default. |
| `content_ia_editor` | Terra Medium | Luna Low/Medium for extraction, terminology, metadata, deterministic classification, or formatting; Luna High for large fully specified transformations; Sol Medium for foundational positioning or materially conflicting evidence | Nuanced copy and IA remain Terra/Sol judgment. Never modifies layout or styling. |
| `frontend_implementer` | Terra Medium | Luna Low/Medium for explicit bounded fixes, Luna High for large deterministic transformations, Terra High for settled critical implementation, and Sol Medium/High for ambiguous bugs, complex interactions, architecture, or competing approaches | Scoped UI implementation only; protected pipeline, schema, deployment, and agent rules remain excluded. |
| `qa_build_reviewer` | Luna Medium for mechanical preflight and low-risk final gates | Luna Low for tiny explicit checks; Terra Medium/High for ordinary semantic QA; Sol Medium/High for critical semantic or release gates | Luna collects and checks proof; Terra/Sol interpret proof and release risk. |

Pin a model or reasoning value in an agent TOML only when that role has no documented alternate tier. Custom-agent values take precedence over spawn-time routing, so variable-tier roles leave them to the caller. The architect remains pinned because invoking that role already signals high-value cross-domain judgment.

## Task routing matrix

| Level | Work | Preferred route | Required flow |
| --- | --- | --- | --- |
| 0 | Explanation only | No delegated agent | Answer in the current conversation. |
| 1 | Explicit, low-risk, directly verifiable task | Luna Low or Medium, or measured Luna High for a large deterministic workload, in the owning lane | One writer; validate immediately; escalate if semantics appear. |
| 2 | Ordinary single-domain work | Optional Luna discovery → Terra Medium implementation → Luna mechanical QA | Skip a separate discovery handoff when its overhead exceeds its value. |
| 3 | Cross-domain, ambiguous, or materially coupled work | Luna evidence packet → Sol Medium/High decision → Terra Medium/High implementation → Luna Gate 1 → Terra/Sol Gate 2 | Keep planning, retained-diff implementation, and independent QA distinct. |
| 4 | High-risk pipeline, schema, privacy, deployment, or infrastructure work | Luna factual preparation → Sol High authority/plan → Terra High or Sol implementation → Luna Gate 1 → Sol High critical gate | Luna may reduce raw work but never owns the governing decision. |

## Two-stage QA

For meaningful changes, split proof collection from proof interpretation.

**Gate 1 — Luna mechanical QA** checks authorized files, dirty-tree contamination, diff whitespace, required commands, exit status, expected tests, build artifacts, acceptance-criteria evidence, and obvious omissions. For work that still requires Gate 2, it produces a compact packet labeled `MECHANICAL READY`, `MECHANICAL NOT READY`, or `MECHANICAL BLOCKED`; these labels are not release verdicts. Do not spend semantic-review capacity on a failed candidate unless Terra or Sol is needed to diagnose the failure.

**Gate 2 — semantic QA** is required when release confidence depends on architecture, privacy/security, schema/publication semantics, hidden invariants, test sufficiency, difficult design judgment, or cross-component behavior. Use Terra for ordinary semantic review and Sol for critical or ambiguous review. Gate 2 reads the compact evidence plus the authoritative contracts and source whose semantics affect the decision; it does not blindly repeat Gate 1.

For low-risk work, a Luna-routed `qa_build_reviewer` may complete both the mechanical checks and the final gate in one pass. Do not create a separate QA delegation for a trivial change when the same evidence can be checked directly. `qa_build_reviewer` remains the only agent that issues the repository verdict `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`.

## Escalation packet

When Luna or Terra escalates, pass only decision-relevant material:

- verified facts and current repository state;
- governing authority and exact files or symbols;
- observed implementation and validation already run;
- the precise uncertainty or conflict;
- plausible interpretations when more than one survives;
- the decision required and recommended model/reasoning tier.

Do not paste raw logs or convert assumptions into decisions. Sol must fresh-read governing contracts and decision-critical source even when a packet is available.

## Compatibility and usage policy

Use an older model only when it is explicitly available in the active Codex surface and a pinned workflow or verified regression requires it. Do not add speculative fallback identifiers or automatically downgrade Sol work. Actual usage varies with context, tools, reasoning depth, caching, and output length; do not place temporary numeric budgets in agent TOMLs.

For ownership, permissions, handoffs, and prompt structure, see [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md). For the project workflow, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).
