---
name: notes-publication-preflight
description: Preflight the Horace_Website Obsidian-to-Astro Notes publication path without widening its input boundary. Use before a real Notes sync or publication, after pipeline/schema/publication-rule changes, or when sync warnings need release classification.
---

# Notes Publication Preflight

obsidian_notes_pipeline owns domain judgment. qa_build_reviewer owns the final readiness status.

1. Require an explicit publish source. Treat the vault only as attachment lookup; never scan or publish the full vault.
2. Run the repository dry-run workflow before any real sync. Use strict mode when warnings are the target.
3. Review warnings, skipped existing files, frontmatter/schema compatibility, wiki links, assets, and private-content boundaries. Do not mute warnings to pass.
4. Confirm a generated note is writable only when its line-one generated marker is present. Hand-written notes remain protected.
5. Confirm the manifest cannot change during dry-run and changes only during an authorized real sync.
6. Run the website build after a real write or a pipeline/schema/config change. Do not require it for a dry-run-only review.
7. Stop and hand off if the safe correction requires UI, copy, deployment, an unauthorized file, or a publication-model decision.
