# Portable Model-Routing Architecture

This document extracts the project-specific Sol/Terra/Luna setup into a model- and vendor-neutral method. The durable architecture is the sequence of boundaries, classification, evaluation, enforcement, and contextual overlays. Exact model ids and Codex file formats are adapters.

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

Map those signals to three portable capability tiers:

| Portable tier | Responsibility | This project |
| --- | --- | --- |
| Bounded worker | Discovery, deterministic transformation, validation, evidence compression | Luna |
| Engineering synthesizer | Routine semantic implementation and review | Terra |
| Judgment authority | Ambiguity, architecture, contracts, privacy, critical release decisions | Sol |

The output is a route envelope: owner, phase, model, reasoning effort, context mode, authority, and required gate. A model change receives a fresh compact evidence packet rather than inherited raw history. One retained-diff writer prevents parallel branches from silently merging incompatible decisions.

## 3. Build the routing evaluation set before tuning

Use representative cases from the real repository, not synthetic difficulty labels. Cover every phase, capability tier, important owner, low/high ambiguity, deterministic and semantic verification, settled critical implementation, and critical release review. Each fixture contains structured input and the expected route envelope.

For a new model family, run the same tasks at the current effort and one level lower. Measure task success, artifact or answer completeness, required evidence, total tokens, latency, and cost when available. Promote a model or effort only for a measured quality gain. Lower call count or shorter output is not a win when the acceptance contract is incomplete.

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
2. Map its models to bounded-worker, engineering-synthesizer, and judgment-authority tiers in one adapter file. Do not rewrite domain-agent definitions around vendor model names.
3. Preserve the structured route input and output schemas. Translate only model ids, supported effort names, and runtime context-mode syntax.
4. Run the existing representative fixtures. Add a case only when the destination exposes a genuinely new task shape or failure mode.
5. Compare the baseline effort and one lower level; retain higher effort only when it improves the acceptance metrics.
6. Port the deterministic validator using native parsers for the destination's formats. Keep scan, secret, link, route, and rule checks equivalent.
7. Translate dynamic Rules to the destination's path-matching format or hook layer, then re-run routing tests, rule validation, and the project build.

## Minimum portable artifact set

- one global ownership and authorization policy;
- one machine-readable scan and routing contract;
- one pure route selector with a CLI or API boundary;
- one representative routing fixture set;
- one deterministic validator;
- a small set of path-scoped safety Rules;
- an evidence-packet and QA-gate contract;
- a target-model adapter documenting unavailable or unsupported routes.

In this repository those artifacts are `AGENTS.md`, `config/codex-workflow.json`, `tools/codex-routing.mjs`, `tests/codex-routing-cases.json`, `tools/validate-codex-rules.mjs`, and `.omo/rules/*.md`. The model guidance remains in [CODEX_MODEL_USAGE.md](CODEX_MODEL_USAGE.md), the executable protocol in [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md), and the safe input boundary in [CODEX_SCAN_BOUNDARY.md](CODEX_SCAN_BOUNDARY.md).
