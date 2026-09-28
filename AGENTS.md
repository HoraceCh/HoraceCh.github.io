# Project Instructions

This repository is my personal research portfolio website.

Core identity:
Mechanical Engineering student exploring Robotics, Embodied AI, VLA models, and AI-assisted engineering workflows.

Architecture:
- Home = personal identity entrance
- About = background and direction
- Projects = scan-friendly project index
- Notes = long-term research notes / knowledge system
- Resume = recruiter-facing summary
- Contact = external links

Style:
- Minimal
- Technical
- Honest
- Early-stage researcher appropriate
- Avoid hype and buzzwords

Global UI guidance:
- Agents must read `docs/design/UI_DESIGN.md` before planning or implementing visual UI changes; it is the canonical UI reference for visual specs, implementation, and QA review.
- Keep UI changes aligned to that file unless the user explicitly approves a different direction.

Implementation priorities:
1. Keep the site statically deployable.
2. Preserve existing content unless migration is intentional.
3. Prefer Astro, Markdown/MDX, and content collections.
4. Keep components simple and reusable.
5. Run build checks before finalizing.
6. Do not fabricate personal achievements, publications, awards, or project outcomes.

## Codex capability and agent workflow

Before repository-wide discovery, read `docs/CODEX_SCAN_BOUNDARY.md`. Before planning or implementing, read `docs/CODEX_MODEL_USAGE.md` and `docs/CODEX_AGENT_ROUTING.md`. They are the source of truth for safe scan scope, the six agents, capability routing, the compact six-part prompt structure, permissions, and handoffs.

Route useful phases by L0–L5 capability as defined in `docs/MODEL_ROUTING_PORTABILITY.md`. L0 bypasses a model for resolved deterministic mechanics. L1 and L2 handle qualified bounded work, L3 handles engineering synthesis, L4 handles high judgment, and L5 remains disabled without consequential comparative evidence. These are capability classes, not an escalation staircase. The user's root conversation model is selected at launch; repository routing must not pin it. Exact model IDs and effort defaults belong in the Website adapter, not stable governance. Preserve quality and authority gates before using cost or latency to break a tie.

Keep the six owner lanes, the three-subagent cap and interrupt messages in `.codex/config.toml`. Delegation is depth one, write-capable work is serial-first, and a delegated job must be scoped to finish within 30 minutes; these are workflow policies rather than unsupported configuration keys. Preserve the one-writer rule, privacy and publication boundaries, approval requirements, and behavior-matched validation.

## Third-party UI skills

Third-party UI skills are advisory and subordinate to this repository's `AGENTS.md`, project-local agent rules, architecture contracts, and `docs/design/UI_DESIGN.md`.

Approved project-local UI skills:

- `improve-ui`
- `fixing-accessibility`
- `fixing-metadata`
- `fixing-motion-performance`

`config/codex-skill-admission.json` is the closed admission list for project-local Skills. Only its `ADMITTED` third-party UI entries may enter the documented normal workflow, subject to the owner boundaries below. `EXPLICIT_ONLY` requires a named task-specific invocation; `DORMANT_NON_DISCOVERABLE` and `REMOVE` must stay outside `.agents/skills/`. A local `SKILL.md` or `skills-lock.json` entry does not grant admission. Validate the directory against the admission list with `npm run rules:validate`.

Do not use `baseline-ui`, `ui-skills-root`, full-registry routing, or unreviewed dynamically retrieved UI skills.

Third-party UI skills must not introduce dependencies, frameworks, or component systems without explicit approval; override the canonical design system; expand the authorized file scope; modify the Obsidian pipeline, content schema, publication contracts, generated content, deployment, or agent routing; or commit, push, or perform external writes.

Use `improve-ui` only as a read-only, evidence-based UI audit and planning aid; hand accepted findings to `design_system_curator`. Use `fixing-accessibility` for focused accessibility audit or bounded implementation through existing owners, `fixing-metadata` for metadata review with implementation retained by the appropriate project owner, and `fixing-motion-performance` for motion/performance review whose implementation follows the existing reduced-motion and CSS constraints. These supporting references never bypass `design_system_curator` → `frontend_implementer` → `qa_build_reviewer` or create new agents.
