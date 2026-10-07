# Portable Model-Routing Architecture

This document defines the Horace project family's portable L0–L5 capability semantics. The durable architecture is the sequence of boundaries, classification, evaluation, enforcement, and contextual overlays. Exact model IDs and Codex file formats belong to project adapters.

## 1. Close the scan boundary first

Define a machine-readable allowlist of policy sources and an explicit denylist for runtime state, caches, local credentials, generated output, browser profiles, and continuation data. Enumerate tracked configuration rather than recursively reading hidden tool directories. Keep normal source discovery task-scoped and expand it only along verified dependency edges.

This boundary must exist before routing: an expensive judge model cannot repair polluted or private context. The validator should fail closed when a policy file is missing, an allowed path overlaps an excluded path, or tracked policy is absent from the allowlist.

## 2. Route by capability, phase, authority, and proof

Keep domain ownership independent from model choice. A frontend owner remains the frontend owner whether a phase uses a fast worker or a judgment model. Classify each phase with a small structured schema:

- domain owner;
- phase: explain, discover, decide, implement, or QA;
- scope: single, domain, or cross-domain;
- ambiguity: low, contained, or material;
- verification: direct or semantic;
- workload size;
- verified risk flags.

Consider semantic reasoning need, ambiguity, coupling and horizon, reversibility, authority and risk, verification mode, frequency, latency and cost sensitivity, and output criticality. Those signals describe the phase, not the prestige of its task name. Quality, authority, and validation are gates; efficiency breaks ties only after they pass.

| Level | Portable capability | Admission and proof |
| --- | --- | --- |
| L0 | Deterministic execution plane | Semantics and authority are resolved; use scripts, CI, validators, Git, PR, deployment, or exact artifact checks without a model where possible. Root orchestration is a thin control plane and never grants approval or release authority. |
| L1 | Efficient bounded semantic assist | Small extraction, classification, compression, or tiny edits with exact-answer or exact-diff checking; fall back to L2 on failure. |
| L2 | Bounded reasoning and implementation | Known-path, reversible, directly verifiable work under settled authority. |
| L3 | Engineering synthesis | Ordinary multi-file engineering, difficult debugging, and semantic review beyond the L2 quality gate. |
| L4 | High-judgment work | Architecture, authority reconciliation, privacy/publication decisions, ambiguous recovery, and critical semantic QA. |
| L5 | Exceptional escalation class | Disabled by default. Require a consequential unresolved L4 criterion and measured improvement by a candidate adapter. |

These are capability classes, not an escalation staircase. Risk alone does not move a resolved deterministic operation out of L0. After a decision, mechanical execution can return to L0.

The output is a route envelope: owner, phase, level, adapter model, reasoning effort, context mode, authority, and required gate. A model change receives a fresh compact evidence packet rather than inherited raw history. The root conversation model is chosen by the user at launch; project config does not pin it. One retained-diff writer prevents parallel branches from silently merging incompatible decisions.

## 3. Build the routing evaluation set before tuning

Use representative cases from the real repository, not synthetic difficulty labels. Cover every phase, capability level, important owner, low/high ambiguity, deterministic and semantic verification, settled critical implementation, and critical release review. Each fixture contains structured input and the expected route envelope.

For a new model family, lock representative tasks and compare only the efforts that could change the route decision; include a lower effort when its adequacy is uncertain. Measure task success, artifact or answer completeness, required evidence, total tokens, latency, and cost when available. Require equal or better quality, authority, and validation before using efficiency to break a tie. Lower call count or shorter output is not a win when the acceptance contract is incomplete. Reasoning effort is an independent tuning control; xhigh and max are never automatic levels.

### HC-126 canonical benchmark and Website adapter (2026-09-27)

The locked four-case pack used fresh disposable copies of Website working-tree baseline SHA-256 `824727612c6a63e090dd92a4c205e1dbefa58c2f5cdef20cfa9c0e5bc72a5170`, including the retained HC-129 and HC-114 changes in that benchmark tree. This delivery landed on remote main without the unrelated local HC-129 root change. The 14 GPT-5.6 routing fixtures remain byte-for-byte as the historical baseline in `tests/codex-routing-cases.json`. The former `tests/codex-routing-active-models.json` recorded the HC-126 adapter changes; its historical version remains in Git history and the HC-126 evidence attachments after HC-169 removed it as a current routing fixture. Runtime `turn_context` records, not requested route envelopes, attest model and effort. The fixed inputs, thresholds, full trial matrix, edit operations, and reports are attached to [HC-126](https://linear.app/baukasten/issue/HC-126) as **HC-126 Phase 2 dispatch-attested trial evidence** and **HC-126 Phase 2 C and D confirmation artifacts**.

| Workload | Matched result and decision |
| --- | --- |
| Bounded, directly verifiable implementation | GPT-6 Luna Medium passed twice and GPT-5.6 Luna Medium passed once. Acceptance quality tied; GPT-5.6 used less time and fewer input tokens. Retain GPT-5.6 Luna Medium. GPT-6 Luna High failed the exact CLI message; GPT-6 Luna Low was not tested. |
| Ordinary multi-file engineering | GPT-6 Sol Medium and GPT-5.6 Terra Medium both passed. Terra was faster with fewer calls and tokens; keep Terra Medium. |
| Semantic QA judgment | GPT-6 Sol Medium passed twice at the baseline's evidence quality, with fewer calls, time, and tokens than GPT-5.6 Sol Medium. Promote Sol Medium for contained judgment. |
| Ambiguous cross-domain recovery | GPT-6 Sol High passed twice at the GPT-5.6 Sol High acceptance bar, with lower observed duration. Promote Sol High for critical judgment. GPT-6 Astra Medium passed once but resolved no consequential criterion Sol missed; no permanent Astra tier or Astra High run. |

At the HC-126 landing, these decisions changed only Sol's exact model ID and the `project_architect` pin. The root and bounded/engineering routes then remained GPT-5.6. This paragraph records that historical state; HC-131 supersedes its active selection below. Domain ownership, the three-agent and depth-one limits, single-writer rule, scan boundary, publication/privacy restrictions, external-write authority, and mechanical plus semantic QA are unchanged.

If an active GPT-6 Sol route is unavailable or fails later qualification, preserve the same judgment authority and QA gates and explicitly roll the adapter back to the GPT-5.6 Sol baseline. A requested model name, agent TOML pin, or `selectRoute` envelope is not execution proof; the benchmark's root-trial runtime records provide the capability attestation. The original GPT-5.6 fixture file remains the reference for rollback; do not remove it on this migration. The earlier disposable trial copies expired before final packaging, so the first archive preserves their edit operations and session hashes rather than final file snapshots. The C and D confirmations preserve complete reports and runtime metadata in the second archive. No monetary cost telemetry was exposed.

### HC-131 Website adapter (2026-09-28)

HC-131 retains the HC-126 benchmark as canonical evidence and runs only two targeted qualifications. The GPT-6 Luna Low subrun produced the exact 39-reference GPT-5.6 inventory and category classification, then made one precisely specified line edit with a clean diff. It qualifies L1 for small, directly checked work only. The GPT-6 Luna Medium subrun migrated the 14 current route fixtures and evaluator within a locked two-file scope. All 16 direct evaluator checks passed and the historical fixture and HC-126 active-model map stayed byte-for-byte unchanged. Three intermediate routing-suite failures were stale root-owned assertions, corrected after the subrun; the final suite passes. This qualifies Website L2 bounded work alongside HC-126 evidence. No HC-131 token, time, or monetary cost telemetry was exposed, so no relative cost claim is made.

The active Website adapter is L1 Luna Low, L2 Luna Medium, L3 Sol Medium, and L4 Sol High. L0 bypasses models. L5 remains disabled: HC-126 found no consequential Astra advantage over Sol High, and HC-131 supplied no new L5 evidence. Large deterministic migrations use L2 Medium with direct checks; ordinary Terra-like semantic engineering uses L3 Sol Medium. Capability mapping and enabled flags are in `config/codex-workflow.json`; ordinary active concrete bindings are in `config/codex-model-registry.snapshot.json`. `tests/codex-routing-current-cases.json` is the active semantic acceptance set. `tests/codex-routing-cases.json` preserves GPT-5.6 benchmark evidence, not active execution.

Admin must consume this capability decision and qualify a small set of its own auth, security, publication, and external-write flows before changing its adapter; it must not rerun the full family benchmark. Baukasten Press remains HOLD until its project and technical route is re-frozen, then performs its own small qualification without treating Website's result as publication approval. HC-115 Skill admission remains outside this benchmark.

### HC-162 Website central-registry pilot (2026-10-04)

The active Website adapter now selects semantic lanes in `config/codex-workflow.json`; the derived `config/codex-model-registry.snapshot.json` resolves lane bindings under EO-16 authority. L1/L2 stay on GPT-6 Luna Low/Medium, L3 on GPT-6 Sol Medium, and ordinary L4 on GPT-6 Sol High. EO-18 qualified GPT-6.1 Sol Medium/High without globally activating either. The only Website-local override is `project_architect`/deep at GPT-6.1 Sol High, using the EO-19 native-CLI aligned-tuple policy and a fresh HC-162 child runtime attestation. A failed attestation returns that role to GPT-6 Sol High. L5 remains disabled.

Context tiers C0–C5 are independent of capability levels. Normal routing may attach C0–C3 metadata; C4 long context and C5 durable continuity require explicit policy admission. Delegation remains depth one with one retained-diff writer, at most three concurrent agents, a soft total of six children, and one automatic retry per lane. The HC-126 and HC-131 benchmark artifacts above remain historical provenance rather than new GPT-6.1 execution evidence.

## 4. Enforce policy mechanically

Use one deterministic command to parse real configuration formats and verify:

- allowed policy paths and excluded runtime paths;
- exact owner set, model pins, concurrency, depth, and writer limits;
- route fixtures and classifier output;
- dynamic-rule frontmatter and bounded path matchers;
- stale contradictory phrases, secret-like values, user-specific paths, local links, and referenced package scripts.

The script should report compact errors without printing sensitive file content. Natural-language policy still explains intent, but machine-consumed structures decide what CI or local validation can prove.

## 5. Tune reasoning, then add contextual Rules

Choose model capability before reasoning effort. Higher effort is useful for a task the selected model can own; it is not a substitute for missing evidence or insufficient authority. Reserve the worker's high effort for large deterministic work, the synthesizer's high effort for settled but semantically coupled implementation, and the judge's highest efforts for exceptional quality-first adjudication that passes evaluation.

State global rules once. Add dynamic file-matched Rules only for high-cost safety invariants, such as publication privacy or routing-policy consistency. They must have narrow globs, no authority expansion, and their own validator. If another runtime lacks dynamic Rules, implement the same mapping in its prompt assembler or pre/post-edit hook; do not copy every rule into every prompt.

## Migration procedure

1. Inventory the target runtime's available models, reasoning controls, context inheritance, delegation, tool calling, and rule-injection mechanism from current first-party documentation.
2. Map its models to L1–L5 in one adapter file; L0 stays deterministic. Do not rewrite domain-agent definitions around vendor model names.
3. Preserve the structured route input and output schemas. Translate only model ids, supported effort names, and runtime context-mode syntax.
4. Run the existing representative fixtures. Add a case only when the destination exposes a genuinely new task shape or failure mode.
5. Compare the baseline effort and one lower level; retain higher effort only when it improves the acceptance metrics.
6. Port the deterministic validator using native parsers for the destination's formats. Keep scan, secret, link, route, and rule checks equivalent.
7. Translate dynamic Rules to the destination's path-matching format or hook layer, then re-run routing tests, rule validation, and the project build.

## Minimum portable artifact set

- one global ownership and authorization policy;
- one machine-readable scan and routing contract;
- one pure route selector with a CLI or API boundary;
- one current representative routing fixture set and retained historical benchmark fixtures;
- one deterministic validator;
- a small set of path-scoped safety Rules;
- an evidence-packet and QA-gate contract;
- a target-model adapter documenting unavailable or unsupported routes.

In this repository those artifacts are `AGENTS.md`, `config/codex-workflow.json`, `tools/codex-routing.mjs`, `tests/codex-routing-current-cases.json`, `tools/validate-codex-rules.mjs`, and `.omo/rules/*.md`. The Website adapter guidance is in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md), the executable protocol in [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md), and the safe input boundary in [CODEX_SCAN_BOUNDARY.md](CODEX_SCAN_BOUNDARY.md).
