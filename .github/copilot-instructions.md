# Copilot review focus

Use `AGENTS.md` as the primary repository contract. During review, prioritize:

1. Preserve static Astro deployment behavior (no runtime/deploy side effects in PR-only checks).
2. Flag regressions to Project and Note publication contracts.
3. Flag broken routes, backlinks, or fragment navigation behavior.
4. Treat `docs/design/UI_DESIGN.md` as the canonical visual reference for UI changes.
5. Flag accidental edits to the Obsidian sync/publish pipeline, content schema, generated content, or deployment workflow.
6. Flag unnecessary runtime JavaScript and any new dependency added without clear need.
7. For UI changes, check responsive behavior, accessibility, and `prefers-reduced-motion`.
8. Separate correctness/regression risks from optional style suggestions.
