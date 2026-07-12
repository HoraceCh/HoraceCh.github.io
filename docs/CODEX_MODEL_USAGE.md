# Codex Model Usage

This is the model-routing source of truth for the HoraceCh Astro website. It assumes ChatGPT Plus and the current picker: GPT-5.6 Sol, Terra, Luna, 5.5, 5.4, and 5.4 Mini. Do not assume Extra High or Pro options.

## Model policy

- **GPT-5.6 Sol** is available and reserved for complex, ambiguous, high-risk, high-value, architectural, or polished work. Its availability does not mean it should be used for every task.
- **GPT-5.6 Terra** at Medium reasoning remains the normal root/default model for everyday implementation, specialist work, and semantic review.
- **GPT-5.6 Luna** at Low reasoning is for bounded and mechanically verifiable work. Use it only when instructions and success criteria are explicit, repeatable, low-risk, and read-only or mechanical.
- Use the lowest reasoning effort that reliably completes the task.
- Actual ChatGPT Plus usage varies with context, tools, reasoning depth, caching, and output length. Do not place temporary numeric usage limits inside agent TOMLs.

## Fallback policy

1. GPT-5.5 is a compatibility fallback, not a normal default.
2. GPT-5.4 is a compatibility or verified-regression fallback.
3. GPT-5.4 Mini may handle only simple extraction, trivial formatting, read-only status checks, or interrupted-run recovery.
4. GPT-5.4 Mini must never handle architecture, pipeline changes, schema changes, deployment, package changes, multi-file refactors, model-routing rules, or final release approval.
5. Do not automatically route Sol work to GPT-5.5. Prefer Sol, Terra, or Luna according to task complexity.

## Agent defaults

| Agent | Default model / reasoning | Upgrade or low-risk path | Primary use and boundary |
| --- | --- | --- | --- |
| `project_architect` | 5.6 Sol / High | None by default | Cross-domain architecture, repo-wide planning, migrations, ownership/boundary decisions, model routing, and high-value technical tradeoffs. Planning only unless implementation is explicitly authorized. |
| `obsidian_notes_pipeline` | 5.6 Sol / High | Terra Medium only for read-only dry-run triage, straightforward warning classification, or docs-only changes | Sync behavior, slugs/links, assets, backlinks/tags, schema, generated-note safety, and private-content leakage risks. |
| `design_system_curator` | 5.6 Terra / Medium | Sol High for full redesigns, difficult theme conflicts, ambiguous visual direction, or cross-page component systems | Spec-first tokens, typography, spacing, theme, motion, and implementation handoff. No direct CSS or Astro editing by default. |
| `content_ia_editor` | 5.6 Terra / Medium | Luna Low for structured extraction, terminology checks, repetitive metadata cleanup, or deterministic classification | Terra remains required for positioning, project narratives, IA, and nuanced rewriting. Never modifies layout or styling. |
| `frontend_implementer` | 5.6 Terra / Medium | Sol High for ambiguous multi-file bugs, complex Astro architecture, cross-directory refactors, major interactions, or competing approaches | Scoped implementation after a clear spec. Pipeline, schema, generated notes, deployment, and agent rules require explicit authorization. |
| `qa_build_reviewer` | 5.6 Luna / Low for routine mechanical QA | Terra Medium/High for semantic QA; Sol High for critical release gates | Mechanical checks use Luna; multi-file and release-readiness judgment uses Terra; pipeline/schema/package/deploy/private-boundary gates use Sol. |

## Task routing matrix

| Level | Work | Model and owner | Required flow |
| --- | --- | --- | --- |
| 0 | Explanation only | No Codex | Answer in conversation. |
| 1 | Small explicit single-file task | Terra Medium implementation; Luna Low mechanical QA | No subagents. |
| 2 | Single-domain task | Terra Medium; one specialist | Spec or audit first where appropriate. |
| 3 | Cross-domain or ambiguous task | Sol High architecture; Terra Medium implementation; Terra Medium/High semantic QA | Use separate planning, implementation, and QA rounds. |
| 4 | High-risk infrastructure or pipeline task | Sol High planning and specialist analysis; Sol High or Terra High implementation; Sol High critical gate | Planning, implementation, and QA must use separate prompts. |

For agent boundaries, subagent policy, and prompt templates, see [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md). For the project workflow, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).
