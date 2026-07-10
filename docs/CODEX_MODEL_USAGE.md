# Codex Model Usage

This is the model-routing source of truth for the HoraceCh Astro website. It assumes ChatGPT Plus and the actual Codex picker is authoritative: GPT-5.6 Sol, Terra, and Luna may be available, but rollout and client version can change visibility. Do not assume Extra High or Pro options.

## Model policy

- **GPT-5.6 Sol** is the strongest reasoning upgrade for complex coding, research, computer-use, science, cybersecurity, and design work. Use Sol High only when visible.
- **GPT-5.6 Terra** is the balanced default for everyday repository work.
- **GPT-5.6 Luna** is the fast, low-cost path for short read-only checks, simple edits, and mechanical QA.
- **GPT-5.5** is fast everyday assistance, not the default for complex repository changes.
- **GPT-5.4** and **GPT-5.4 Mini** are fallbacks, not primary models for architecture, the Obsidian pipeline, or multi-file refactors.

If Sol is unavailable, use Terra High for high-risk reasoning. If Terra is rate-limited, use 5.5 or 5.4 only for low/medium-risk work. Use 5.4 Mini only for low-risk checks, small copy edits, or interrupted-run recovery. Never use 5.4 Mini for Obsidian pipeline, schema, deploy workflow, multi-file refactor, model-routing-rule, or final-release work.

## Agent defaults

| Agent | Default model / reasoning | Upgrade or low-risk path | Primary use and boundary |
| --- | --- | --- | --- |
| `project_architect` | 5.6 Terra / High | 5.6 Sol High if visible | Cross-domain plans, repo boundaries, migrations, and agent workflow changes. Plans only; no implementation unless explicitly instructed. |
| `obsidian_notes_pipeline` | 5.6 Terra / High | 5.6 Sol High if visible | Sync, slugs, backlinks, tags, assets, schema, and generated-notes safety. Never use Luna or 5.4 Mini as its primary model. |
| `design_system_curator` | 5.6 Terra / Medium | Sol High only for unusually complex design reasoning | Tokens, typography, spacing, theme contract, motion, and implementation handoff. Outputs a spec/audit/checklist; does not edit CSS or Astro by default. |
| `content_ia_editor` | 5.6 Terra / Medium | 5.6 Luna for small copy audits | Homepage/project copy, Notes IA, and buzzword cleanup. Never modifies layout or styling. |
| `frontend_implementer` | 5.6 Terra / Medium | Terra High for complex Astro interactions or multi-file refactors | Scoped implementation after a clear spec. Never changes pipeline, schema, generated notes, deploy workflow, design tokens, or agent rules unless explicitly allowed in the handoff. |
| `qa_build_reviewer` | 5.6 Luna / Low for mechanical QA | 5.6 Terra / Medium for semantic, multi-file, or release-risk review | The release gate. It may block. Its status is exactly one of `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`. |

## Task routing matrix

| Level | Work | Model and owner | Required flow |
| --- | --- | --- | --- |
| 0 | Question or explanation | ChatGPT conversation | No Codex required. |
| 1 | Single-file small fix | Terra Medium; `frontend_implementer` | No subagents. QA with Luna Low or Terra Medium. |
| 2 | Single-domain spec | Terra Medium; relevant specialist | `design_system_curator` for visuals/tokens, `content_ia_editor` for copy/IA, `obsidian_notes_pipeline` for notes sync. Spec/audit/triage only; no direct edits unless requested. |
| 3 | Cross-domain site change | Terra High | `project_architect` plan → relevant specialist spec → `frontend_implementer` → `qa_build_reviewer`. Only read-only subagents may assist analysis. |
| 4 | High-risk pipeline or infrastructure change | Terra High or Sol High if visible | Round 1 architect only → Round 2 relevant specialist only → Round 3 implementation only → Round 4 QA only. Never combine planning, implementation, and QA; do not commit before the QA gate. |

For agent boundaries, subagent policy, and prompt templates, see [CODEX_AGENT_ROUTING.md](CODEX_AGENT_ROUTING.md). For the project workflow, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).
