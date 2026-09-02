---
description: Safety boundary for Obsidian-to-Astro publication changes
globs: ["tools/sync-obsidian-notes.mjs", "src/content.config.ts", "astro.config.mjs", "src/content/notes/**/*.md", "astro-public/notes-assets/**", "docs/OBSIDIAN_NOTES_SYNC.md", "docs/CONTENT_PUBLICATION_CONTRACT.md"]
alwaysApply: false
---

The supplied `--source` is the only publication input. A vault path may resolve attachments but must never widen note discovery. Do not execute DataviewJS or Markdown-authored JavaScript, introduce runtime Markdown parsing, or overwrite a hand-written note without the line-one generated marker.

Keep schema, generated-note, asset, manifest, and privacy decisions in the `obsidian_notes_pipeline` lane; route ambiguous boundaries to Sol High judgment before writing. Reproduce with `npm run notes:sync:dry`, use strict mode when warnings are the target, and run the website build after a real write or source/schema/config change.
