# Codex Model Usage

This is the Website adapter for the portable L0–L5 capability framework in [MODEL_ROUTING_PORTABILITY.md](MODEL_ROUTING_PORTABILITY.md). `config/codex-workflow.json` maps capabilities to semantic lanes; `config/codex-model-registry.snapshot.json` derives concrete bindings from EO-16; `tools/codex-routing.mjs` resolves them. Capability, context tier, and reasoning effort are independent choices. The six agents are domain owners, not model tiers.

## Active Website adapter

| Capability | Work | Current adapter and starting effort | Gate |
| --- | --- | --- | --- |
| L0 | Resolved deterministic execution, including tests, builds, validators, Git and PR mechanics, and exact artifact checks | Model bypass through root orchestration after required approval | Verify the specified result directly |
| L1 | Small extraction, classification, evidence compression, and tiny directly checked edits | GPT-6 Luna Low | Exact-answer or exact-diff check; fall back to L2 on failure |
| L2 | Bounded reasoning, known-path implementation, and mechanical QA under settled authority | GPT-6 Luna Medium | Direct acceptance and mechanical validation |
| L3 | Engineering synthesis, ordinary multi-file implementation, debugging, and semantic QA | GPT-6 Sol Medium | Semantic review where required |
| L4 | Architecture, authority reconciliation, privacy/publication judgment, ambiguous recovery, and critical review | GPT-6 Sol High; only `project_architect` has a Website-local GPT-6.1 Sol High pilot override | Independent critical semantic gate when required; architect pilot requires fresh native-CLI attestation |
| L5 | Exceptional unresolved L4 criterion | Disabled; GPT-6 Astra Medium/High is only a candidate | Enable only after a consequential comparative advantage is demonstrated |

The levels are capability classes, not a mandatory staircase. A known architecture decision can start at L4; its subsequent build or Git operation belongs to L0. High impact alone does not require a stronger model. Quality, authority, and complete validation are admission gates. Use latency or cost to choose only among routes that pass them.

## Qualification and reasoning

HC-126 is the canonical family benchmark and is not rerun here. Its dispatch-attested evidence supports GPT-6 Luna Medium bounded implementation, GPT-6 Sol Medium engineering and semantic synthesis, and GPT-6 Sol High difficult judgment and recovery. Higher effort did not automatically improve quality. Astra did not resolve a consequential criterion beyond Sol High in the tested case.

HC-131 adds narrow Website qualification. GPT-6 Luna Low produced an exact 39-occurrence GPT-5.6 inventory and category classification, checked against a bounded independent search, and a one-line known-path edit with exact diff and whitespace checks. This admits L1 only for similarly small, directly verifiable work; authority-sensitive interpretation still routes to L3 or L4. GPT-6 Luna Medium migrated the 14 current routing fixtures and evaluator within a locked two-file scope; all 16 direct evaluator checks passed, historical fixtures were unchanged, and the intermediate full routing suite exposed only three stale root-owned assertions later corrected. This adds Website-specific L2 evidence to HC-126. It does not prove Luna Medium suitable for unconstrained semantic engineering.

The residual large deterministic route uses L2 Medium with immediate checks, rather than an automatic High effort. Ordinary Terra-like semantic engineering uses L3 Sol Medium because HC-126 directly qualified Sol Medium and did not qualify Luna Medium for that semantic bar. Settled critical implementation can execute at L3 after L4 resolves the governing decision, then receives an L4 semantic gate. L5 remains disabled. Do not create automatic xhigh or max routes; compare higher effort only against representative acceptance evidence.

Token, duration, and monetary cost telemetry were not exposed by the HC-131 targeted subruns. Their pass decisions rest on artifact quality, scope, and exact checks, not an unmeasured cost claim.

## Launch, ownership, and handoffs

The user's root conversation model is selected at launch. Project config does not pin it, and an explanation in the current conversation does not silently switch models. Normal L1–L5 routing selects `fast`, `standard`, `deep`, or disabled `frontier`; the derived registry snapshot resolves each active lane. GPT-6.1 Sol Medium remains qualified but inactive for L3. The architect TOML pin is an EO-19 runtime compatibility exception, not registry authority. If a runtime cannot perform a requested routed subrun, report the unavailable route and keep the authority boundary; a route envelope is not proof of execution.

For the architect/deep pilot, use native Codex CLI with root model/effort, role pin, and explicit child request aligned to GPT-6.1 Sol High. Inspect fresh child `session_meta` and `turn_context` before consequential work. If role, model, reasoning, or role instructions cannot be attested, use the snapshot's GPT-6 Sol High rollback binding. Other named L4 roles remain GPT-6 Sol High. Desktop heterogeneous per-role overrides are unsupported for this pilot.

Context Tier metadata is orthogonal to model capability: C0 is deterministic, C1 a compact fresh packet, C2 a focused working set, and C3 an extended cross-domain working set. C4 is long-context admission only and is never selected automatically; C5 is explicit durable multi-window continuity. Delegation defaults to a fresh packet with no history fork, depth one, a soft total child cap of six, one retained-diff writer, one automatic retry per lane, and result/delivery evidence. The configured concurrent-agent cap remains three.

Keep the six owners and one retained-diff writer. L1/L2 may gather facts or perform explicit reversible edits, but may not settle architecture, design direction, schema, privacy, publication, or release ambiguity. The architect owns cross-domain decisions. The notes owner retains publication and generated-content boundaries. The design curator supplies visual direction, the content editor owns claims and IA, the frontend implementer owns scoped UI changes, and the QA reviewer alone issues the repository readiness verdict.

For meaningful changes, mechanical Gate 1 checks scope, exact commands, exit status, diff, and acceptance evidence. Semantic Gate 2 checks the governing contracts and sufficient behavior evidence at L3 or L4 according to risk. A mechanical pass is not a release verdict. Keep fresh handoff packets compact and re-read decision-critical authority.

## Provenance and rollback

The 14 GPT-5.6 cases in tests/codex-routing-cases.json and the HC-126 active-model comparison map remain historical benchmark evidence. They are not active execution. The HC-58 and HC-126 decisions and dispatch evidence remain in [MODEL_ROUTING_PORTABILITY.md](MODEL_ROUTING_PORTABILITY.md) and the HC-126 issue attachments. If a GPT-6 route later fails representative qualification, record the exception and use an explicitly reviewed adapter rollback with the same authority and QA gates; never silently relabel the executed model.

For ownership, permissions, prompt shape, and safe scans, see [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md), [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md), and [CODEX_SCAN_BOUNDARY.md](CODEX_SCAN_BOUNDARY.md).
