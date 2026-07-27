# Codex Model Usage

This is the model-routing source of truth for the HoraceCh Astro website. The active family is GPT-5.6 Sol, Terra, and Luna. Repository configuration uses the CLI reasoning labels `low`, `medium`, and `high`; interface labels and higher efforts are optional product controls, not project requirements.

## Model policy

- **GPT-5.6 Sol** is available and reserved for complex, ambiguous, high-risk, high-value, architectural, or polished work. Its availability does not mean it should be used for every task.
- **GPT-5.6 Terra** at Medium reasoning remains the normal root/default model for everyday implementation, specialist work, and semantic review.
- **GPT-5.6 Luna** at Low reasoning is for bounded and mechanically verifiable work. Use it only when instructions and success criteria are explicit, repeatable, low-risk, and read-only or mechanical.
- Use the lowest reasoning effort that reliably completes the task.
- Actual ChatGPT Plus usage varies with context, tools, reasoning depth, caching, and output length. Do not place temporary numeric usage limits inside agent TOMLs.
- Pin a model or reasoning value in a custom-agent TOML only when that role has no documented alternate tier. Current Codex gives the custom-agent file precedence over spawn-time routing, so variable-tier roles leave those values to the caller.

## Compatibility fallback policy

Use an older model only when it is explicitly available in the active Codex surface and a pinned workflow or verified regression requires it. Do not add speculative fallback identifiers or automatically downgrade Sol work. Prefer Sol, Terra, or Luna according to task complexity.

## Agent defaults

| Agent | Default model / reasoning | Upgrade or low-risk path | Primary use and boundary |
| --- | --- | --- | --- |
| `project_architect` | 5.6 Sol / High, pinned | None by default | Cross-domain architecture, repo-wide planning, migrations, ownership/boundary decisions, model routing, and high-value technical tradeoffs. Planning only unless implementation is explicitly authorized. |
| `obsidian_notes_pipeline` | 5.6 Sol / High | Terra Medium only for read-only dry-run triage, straightforward warning classification, or docs-only changes | Sync behavior, slugs/links, assets, backlinks/tags, schema, generated-note safety, and private-content leakage risks. |
| `design_system_curator` | 5.6 Terra / Medium | Sol High for full redesigns, difficult theme conflicts, ambiguous visual direction, or cross-page component systems | Spec-first tokens, typography, spacing, theme, motion, and implementation handoff. No direct CSS or Astro editing by default. |
| `content_ia_editor` | 5.6 Terra / Medium | Luna Low for structured extraction, terminology checks, repetitive metadata cleanup, or deterministic classification | Terra remains required for positioning, project narratives, IA, and nuanced rewriting. Never modifies layout or styling. |
| `frontend_implementer` | 5.6 Terra / Medium | Sol High for ambiguous multi-file bugs, complex Astro architecture, cross-directory refactors, major interactions, or competing approaches | Scoped implementation after a clear spec. Pipeline, schema, generated notes, deployment, and agent rules require explicit authorization. |
| `qa_build_reviewer` | 5.6 Luna / Low for routine mechanical QA | Terra Medium/High for semantic QA; Sol High for critical release gates | Mechanical checks use Luna; multi-file and release-readiness judgment uses Terra; pipeline/schema/package/deploy/private-boundary gates use Sol. |

## Task routing matrix

| Level | Work | Model and owner | Required flow |
| --- | --- | --- | --- |
| 0 | Explanation only | No Codex | Answer in conversation. |
| 1 | Small explicit single-file task | Terra Medium implementation; Luna Low mechanical QA | One owner; hand off only if a boundary is crossed. |
| 2 | Single-domain task | Terra Medium; one specialist | Spec or audit first where appropriate. |
| 3 | Cross-domain or ambiguous task | Sol High architecture; Terra Medium implementation; Terra Medium/High semantic QA | Use separate planning, implementation, and QA rounds. |
| 4 | High-risk infrastructure or pipeline task | Sol High planning and specialist analysis; Sol High or Terra High implementation; Sol High critical gate | Planning, implementation, and QA must use separate prompts. |

For ownership, permissions, handoffs, and prompt structure, see [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md). For the project workflow, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).
