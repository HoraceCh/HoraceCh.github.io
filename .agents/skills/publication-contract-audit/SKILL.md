---
name: publication-contract-audit
description: Audit the Horace_Website Notes publication contract against current configuration and documentation without modifying content or pipeline behavior. Use for publication-boundary reviews, privacy checks, generated-versus-hand-written ownership checks, or before proposing a contract change.
---

# Publication Contract Audit

Keep this workflow read-only. obsidian_notes_pipeline owns publication judgment.

1. Read the publication contract and the current Notes workflow documentation.
2. Compare the documented source boundary, attachment lookup, generated-marker rule, collision behavior, asset paths, manifest behavior, schema expectations, and build-time rendering guarantees with current repository configuration.
3. Search for contradictions that would widen publication input, overwrite hand-written notes, execute Markdown-authored JavaScript, expose private content, or shift parsing to runtime.
4. Separate verified drift from an intentional product decision. Do not edit source, generated Notes, schemas, pipeline code, overrides, build, or deployment files.
5. Report the evidence, impact, owning agent, and smallest proposed decision surface. Stop rather than changing the publication model.
