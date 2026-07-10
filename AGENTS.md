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

## Codex model and agent workflow

This repository uses a ChatGPT Plus + Codex workflow. Picker availability is client- and rollout-dependent: use GPT-5.6 Sol only when it is visible, and do not assume Extra High or Pro options.

- Default project model: GPT-5.6 Terra. Use High reasoning for cross-domain, pipeline, architecture, and release-risk work.
- Fast low-risk path: GPT-5.6 Luna for short read-only checks, mechanical QA, and small copy audits.
- GPT-5.5 is fast everyday assistance, not the default for complex repository changes. GPT-5.4 and GPT-5.4 Mini are fallbacks only.
- Use only the six established agents. Default to a single-agent serial workflow; never fan out write-capable agents or delegate beyond depth 1.
- Read the routing source of truth before planning or implementation: `docs/CODEX_MODEL_USAGE.md` and `docs/CODEX_AGENT_ROUTING.md`.
- Respect the project-local `.codex/config.toml` limits: three threads, depth one, 30-minute jobs, and interrupt messages enabled.
