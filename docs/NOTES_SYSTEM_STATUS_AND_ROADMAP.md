# Notes System Status and Roadmap

## Summary

This document is the durable status boundary for the public Notes system. The site is an Astro static personal website with an Obsidian-like public knowledge garden, not an Obsidian clone.

The current Notes system supports static note publishing, metadata display, browse routes, an Obsidian-like reading layout, H2/H3 outline navigation, real static backlinks, and code block reading controls. Graph, Hover Preview, Dataview, Search, and Canvas are future work, not current features.

Related references:

- [README](../README.md)
- [Obsidian Notes Sync](./OBSIDIAN_NOTES_SYNC.md)
- [Obsidian Feature Matrix](./OBSIDIAN_FEATURE_MATRIX.md)
- [Agent Workflow](./AGENT_WORKFLOW.md)

## Current Architecture

Implemented:

- Notes are Astro content collection entries under `src/content/notes`.
- The current notes schema lives in `src/content.config.ts` and covers title, description, dates, category, subcategory, tags, status, type, draft state, learning path/order/level, related notes, prerequisites, and concepts.
- `/notes/` is the public Notes landing page and browsing entrance.
- `/notes/[slug]/` renders individual note pages with properties, concepts, prerequisites, related notes, tags, outline, backlinks, and rendered Markdown content.
- Browse routes exist for categories, tags, learning paths, types, and status.
- `NoteProperties.astro`, `NoteSidepane.astro`, and `NoteOutline.astro` own the main note-reader context UI.
- `src/utils/noteBacklinks.ts` builds a static backlinks index from note bodies at build/render time.
- The Obsidian sync flow is documented in [Obsidian Notes Sync](./OBSIDIAN_NOTES_SYNC.md). It publishes only an explicit Obsidian Publish folder from `--source`.

Partially implemented:

- The system is Obsidian-like in reading layout and metadata presentation, but it does not reproduce Obsidian's full app model.
- Generated notes and hand-written notes can coexist in `src/content/notes`, but generated notes should be treated as pipeline output when they carry the sync marker.

Not implemented:

- No runtime database, server-side note API, live vault connection, authenticated editor, or browser-side Markdown parser exists.

## Implemented Capabilities

Implemented:

- Astro static build for public Notes pages.
- Notes landing page with curated browsing surfaces and recent/full note listings.
- Static browse routes by category, tag, path, type, and status.
- Properties card with linked metadata where useful.
- Concepts and tags as compact chips.
- Prerequisites and related notes lists.
- Obsidian-like prose styling for notes, including links, images, tables, blockquotes, highlights, inline code, and fenced code blocks.
- Static H2/H3 outline generated from Astro-rendered headings.
- Interactive outline scrollspy that marks the active section while reading.
- Static backlinks extraction from wikilinks and `/notes/...` Markdown links.
- Real Backlinks panel grouped by source note with limited context snippets.
- Backlinks panel defaults collapsed; the outline defaults open.
- Light and dark mode code block contrast tokens.
- Code block language labels when a reliable language is available.
- Code block copy button with accessible feedback states.
- Removal of redundant `pre` `tabindex` during Notes code block enhancement.
- Obsidian Publish sync script with dry-run, strict mode, clean mode, frontmatter normalization, wikilink conversion, asset copying, callout downgrade, highlight conversion, generated-note marker, and warnings.

## UI / Reading Experience

Implemented:

- The reader uses a note header, a properties/context card, a sidepane, and the note prose area.
- Properties show the note's category, subcategory, path/order, level, type, updated date, status, concepts, prerequisites, related notes, and tags when present.
- The sidepane keeps outline and backlinks near the reader on wider screens.
- Long and short outlines have spacing tuned for scanability.
- Backlinks are available without forcing the panel open on every note.
- Code blocks are readable in light and dark modes and support copy interactions.

Partially implemented:

- The reading experience is tuned for static public notes. It is not a full multi-pane Obsidian workspace.
- Visual polish is Notes-scoped. Broader color, typography, spacing, or token changes should only happen during an intentional design-system pass.

Not implemented:

- No Hover Preview, note embed preview, command palette, graph pane, or multi-pane reading mode is present.

## Backlinks and Link Graph Status

Implemented:

- `src/utils/noteBacklinks.ts` extracts wikilinks and Markdown links that point at `/notes/...`.
- Incoming backlinks are rendered in the note sidepane.
- Backlinks are grouped by source note.
- Multiple references from the same note are counted.
- Short context snippets are shown when available.
- Unresolved and ambiguous links are represented in the backlinks utility result for future use.

Partially implemented:

- Backlinks provide static incoming-reference navigation, not a complete graph experience.
- The current UI does not expose outgoing links, unresolved links, graph filters, or graph traversal views.

Not implemented:

- Global graph view.
- Local graph view.
- Graph-aware filtering.
- Graph-driven note discovery UI.

## Code Block Status

Implemented:

- Notes code blocks receive a client-side enhancement wrapper.
- Reliable language labels are shown when the renderer provides usable language metadata.
- Generic language labels such as `text`, `txt`, `plain`, `plaintext`, and `none` are suppressed.
- Copy buttons use the Clipboard API when available and report copied, failed, or unavailable states.
- Enhanced Notes code blocks remove redundant `pre` `tabindex`.
- Light-mode code contrast has been tuned separately from dark mode.

Partially implemented:

- Code block support is focused on static reading comfort, not a full code notebook model.

Not implemented:

- No advanced code metadata system, runnable examples, line highlighting controls, or notebook execution exists.

## Accessibility Status

Implemented:

- Note context and navigation regions use `aside`, `nav`, labels, and heading structure where appropriate.
- Outline navigation has an accessible label and uses `aria-current="location"` for the active heading.
- Backlink counts and repeated-source counts include accessible labels.
- Code copy controls are buttons with `aria-label` and polite feedback.
- Backlinks are inside a native `details` element, so collapsed behavior remains keyboard-accessible.

Partially implemented:

- Accessibility has been considered for the current reader controls, but there has not been a dedicated full audit across all Notes routes and generated content.
- Contrast has been improved for code blocks, but future visual changes still need light/dark contrast checks.

Not implemented:

- No documented keyboard test matrix, screen-reader pass, or automated accessibility CI exists.

## Known Limitations

Implemented but limited:

- Outline only includes H2 and H3 headings.
- Backlinks are static and depend on links present in note Markdown bodies.
- Backlink snippets are intentionally short and plain-text cleaned.
- The sync pipeline removes Dataview and DataviewJS blocks with warnings instead of rendering them.
- Obsidian callouts are downgraded to ordinary Markdown blockquotes unless future pipeline work emits richer static classes.
- `--vault` may help resolve attachments but is not a public publishing source.

Not implemented:

- Graph.
- Hover Preview.
- Dataview or Dataview-like rendered query output.
- Search.
- Canvas.
- Command palette.
- Timeline view.
- Heatmap view.
- Advanced property filters.
- Property index pages beyond current browse routes.
- Multi-pane reading.
- Block reference deep links.
- Excalidraw-specific rendering.

Explicitly out of scope:

- Online editing.
- Full Obsidian plugin API.
- DataviewJS execution.
- Browser-side parsing of the whole vault.
- Publishing the private Obsidian vault.
- Treating `--vault` as a public content source.
- Rebuilding the site into a full Obsidian clone.

## Data Pipeline Boundaries

Implemented:

- The sync script reads only the explicit `--source` Obsidian Publish folder for public Markdown.
- The optional `--vault` path is only for attachment lookup.
- Converted notes default to `src/content/notes`.
- Copied note assets default to `astro-public/notes-assets`.
- Dry-run mode reports planned changes without writing.
- Strict mode can fail on warnings.
- Clean mode is limited to configured generated outputs.

What should not be changed casually:

- `tools/sync-obsidian-notes.mjs`.
- `src/content.config.ts`.
- Generated notes in `src/content/notes`.
- Original Obsidian vault content.
- Generated assets under `astro-public/notes-assets`.
- Slug rules, alias handling, wikilink conversion, asset resolution, Dataview removal, and generated-note marker behavior.

Ownership rule:

- Sync script, schema, generated notes, slug handling, asset handling, and pipeline behavior should only be touched by `obsidian_notes_pipeline`.
- `project_architect` may define boundaries and sequencing.
- `content_ia_editor` may shape taxonomy, labels, and documentation language.
- `frontend_implementer` should not touch the pipeline unless a future task explicitly hands off a tiny documentation link/path correction or a tightly scoped implementation after owner approval.

## Boundaries and Ownership

Implemented:

- `project_architect` owns architecture status, roadmap ordering, and Astro/Hexo boundary decisions.
- `content_ia_editor` owns clarity, taxonomy language, roadmap wording, and honest portfolio tone.
- `obsidian_notes_pipeline` owns Obsidian sync, generated content safety, schema/frontmatter changes, assets, slugs, wikilinks, and Dataview handling.
- `design_system_curator` owns design-system-level visual direction.
- `frontend_implementer` owns scoped Astro/CSS implementation only after an approved plan/spec.
- `qa_build_reviewer` owns final build and diff validation when implementation changes occur.

What should not be changed casually:

- Do not edit generated notes by hand when they contain the sync marker.
- Do not update schema fields without a migration and pipeline-owner review.
- Do not broaden Notes visual changes into global design tokens unless the task is explicitly a design-system pass.
- Do not modify deployment, lock files, package scripts, or GitHub workflows as part of Notes UI/documentation tasks.
- Do not claim unsupported features exist just because the roadmap mentions them.

## Recommended Next Roadmap

Near term:

- Treat this document as the current Notes status boundary for future Codex prompts.
- Keep [Obsidian Feature Matrix](./OBSIDIAN_FEATURE_MATRIX.md) aligned with current source as outline, backlinks, code block controls, and future roadmap items change.
- Add a small Notes QA checklist for generated notes, unresolved links, missing assets, backlinks counts, outline behavior, and code block controls.
- Run a content IA pass on Notes taxonomy: Start Here, categories, paths, note types, statuses, concepts, and tags.
- Run an accessibility-focused Notes reader audit across desktop/mobile, keyboard use, light/dark contrast, and generated Markdown edge cases.

Later:

- Add static Search only if a simple static search base is intentionally introduced.
- Add Hover Preview only as a static, pre-rendered summary shell.
- Add static graph views by reusing the backlinks/link index rather than creating a runtime graph system.
- Add Dataview-like tables only from safe build-time metadata or frontmatter, never DataviewJS execution.
- Add property index pages only for fields that are stable and useful enough to browse.
- Add Canvas support only if exported Canvas data becomes a real public-content requirement.

Explicitly not current roadmap defaults:

- Full Obsidian clone behavior.
- Live vault sync.
- Online editing.
- DataviewJS.
- Private vault publishing.

## Suggested Codex Task Sequencing

For documentation-only Notes work:

1. Use `project_architect` for boundaries and roadmap placement.
2. Use `content_ia_editor` for durable wording and taxonomy clarity.
3. Edit only `docs/*` unless a short README link is explicitly useful.
4. Run `git diff --check`.
5. Run `git status --short`.

For Notes visual polish:

1. Use `project_architect` if the change affects layout, sidepane behavior, or multiple routes.
2. Use `design_system_curator` for a Notes-scoped visual spec.
3. Use `frontend_implementer` only after the scope is narrowed to specific Astro/CSS files.
4. Keep polish Notes-scoped unless intentionally doing a design-system pass.
5. Run `npm run build`.

For Obsidian sync, schema, generated notes, or asset behavior:

1. Use `obsidian_notes_pipeline`.
2. Start with dry-run output when a Publish source path is available.
3. Do not involve general frontend implementation until the pipeline owner has defined the safe handoff.
4. Run `npm run build` after implementation.
5. Run sync dry-run or strict checks when source paths are available.

For future feature work:

1. Separate the feature as Implemented, Partially implemented, Not implemented, or Explicitly out of scope before editing.
2. Identify whether it is display-layer, content-IA, pipeline, schema, or design-system work.
3. Keep the first implementation static-build friendly.
4. End with a QA gate.

## Commit / QA Expectations

Documentation-only changes:

- Run `git diff --check`.
- Run `git status --short`.
- `npm run build` is optional unless documentation links or generated docs affect the site build.
- Confirm no forbidden files changed.

Notes UI or source changes:

- Run `npm run build`.
- Verify light and dark reading states when visual changes are involved.
- Check outline, backlinks, properties, tags/concepts, and code blocks on short and long notes.
- Confirm no sync pipeline files changed unless `obsidian_notes_pipeline` owns the task.

Pipeline or schema changes:

- Must be owned by `obsidian_notes_pipeline`.
- Prefer a dry-run first.
- Preserve generated-note safety.
- Confirm source/vault boundaries.
- Run build after implementation.
