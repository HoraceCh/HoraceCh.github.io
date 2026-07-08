# Obsidian Feature Matrix

This matrix tracks the public Notes display layer for the Horace_Website Astro site. The goal is to make exported Obsidian notes readable and useful on a static website without cloning Obsidian, executing user-authored code, or claiming Obsidian parity.

Status labels:

- Implemented: present in the current static Notes system.
- Partial: useful but intentionally limited, or dependent on available static metadata.
- Future: not present; possible only as static-build-friendly work.
- Out of scope: not planned for this website.

## Current Notes Display Layer

| Feature | Status | Current state | Future boundary |
| --- | --- | --- | --- |
| Note reading layout | Implemented | Individual notes render with a header, properties/context card, sidepane, and prose area. | Preserve the static reader model; multi-pane reading is future work. |
| Obsidian-like prose style | Implemented | Typography, spacing, links, images, tables, blockquotes, highlights, inline code, and fenced code blocks are tuned for public notes. | Refine with real note samples; do not treat this as full Obsidian rendering. |
| Properties card | Implemented | Note metadata renders in a compact properties card with linked fields where useful. | Add derived fields only after schema/pipeline ownership review. |
| Concepts chips | Implemented | `concepts` render as compact chips in the note context card. | Future filtering should stay static and metadata-backed. |
| Tag chips | Implemented | Tags render as linked chips and connect to existing tag routes. | Polish tag routes separately if taxonomy changes. |
| Browse routes | Implemented | Notes can be browsed by category, tag, learning path, type, and status. | Property index pages beyond these routes are future work. |
| Collection/module hierarchy browse | Implemented | Synced `collection`, `modulePath`, `module`, `isIndex`, and `noteRole` metadata powers `/notes/collections/` and nested collection/module browse pages. Index notes remain readable at flat note URLs but act as hierarchy entrances in browse UI. `_archive` branches are intentionally hidden from public hierarchy entrances while non-draft archived notes keep flat note URLs. | Keep this metadata-backed and static; do not infer hierarchy from titles or tags. |
| Hierarchy breadcrumbs | Implemented | Note detail pages link back through Notes, collection, and module browse routes when hierarchy metadata is present. | Breadcrumbs should remain navigational, not a full graph trail. |
| Notes sidepane | Implemented | The sidepane contains outline and backlinks near the reader on wider screens. | Keep visual polish Notes-scoped unless intentionally doing a design-system pass. |
| Static H2/H3 outline | Implemented | Outline items are generated from Astro-rendered H2 and H3 headings. | Deeper document navigation is future work. |
| Outline scrollspy / active state | Implemented | The active outline item updates while reading and uses `aria-current`. | Future changes should preserve keyboard and screen-reader behavior. |
| Static backlinks index | Implemented | Wikilinks and Markdown links to `/notes/...` are extracted into incoming, outgoing, and unresolved-link structures. | The index can feed future graph/search features, but those are not current features. |
| Real backlinks panel | Implemented | Incoming backlinks render in the sidepane, grouped by source note with counts and short snippets. | Keep this described as static backlinks, not a full knowledge graph. |
| Backlinks default collapsed behavior | Implemented | The backlinks section defaults collapsed while the outline defaults open. | Any default-state change should be a reading-experience decision. |
| Backlinks panel polish | Partial | The panel is useful but incoming-only; outgoing links, unresolved links, filters, and graph traversal are not exposed in the UI. | Future polish may add static outgoing/unresolved views or graph-aware browsing. |
| Wikilink handling | Partial | Resolved links are converted or indexed; unresolved links warn or degrade depending on the path through the sync/render system. | Hover Preview and graph-aware link browsing are future work. |
| Image embed style | Implemented | Note images are responsive and styled for the reader. | Gallery or Excalidraw-specific treatment is future work. |
| Callout visual style | Partial | Obsidian callouts are downgraded to ordinary Markdown blockquotes and styled calmly. | Semantic callout variants require pipeline output changes owned by `obsidian_notes_pipeline`. |
| Table style | Implemented | Tables use readable borders and horizontal overflow safety. | Dataview-like tables are future static metadata work, not current Dataview support. |
| Code block contrast polish | Implemented | Light and dark mode code block contrast has been tuned for Notes. | Continue contrast QA as visual design changes. |
| Code block copy button | Implemented | Enhanced Notes code blocks include a copy button with accessible feedback states. | Clipboard availability still depends on the browser context. |
| Code block language labels | Partial | Labels show when reliable language metadata is available; generic or unknown labels are suppressed. | Do not assume every block has a reliable language label. |
| Redundant `pre` tabindex removal | Implemented | Notes code block enhancement removes redundant `pre` `tabindex`. | Preserve this behavior during future code block work. |
| Recent notes | Implemented | The Notes landing page includes recent notes. | Timeline and heatmap views are future work. |
| Notes landing page | Implemented | `/notes/` provides curated browsing surfaces and note lists. | More dense browsing or graph/timeline entry points are future work. |
| Accessibility affordances | Partial | Current controls use semantic regions, native `details`, accessible labels, and active outline state. | A full keyboard/screen-reader audit and accessibility CI are not implemented. |

## Future Features

These are not current features.

| Feature | Status | Notes |
| --- | --- | --- |
| Graph view | Future | Global/local graph views may reuse the static backlinks index later; no graph UI exists now. |
| Hover Preview | Future | Could be added as static pre-rendered summaries for internal note links. |
| Search | Future | Should only be added if a simple static search base is intentionally introduced. |
| Dataview-like static views | Future | Only safe build-time metadata/frontmatter tables are in scope; DataviewJS execution is out of scope. |
| Canvas read-only viewer | Future | Only relevant if exported Canvas data becomes a real public-content requirement. |
| Command palette | Future | No command palette exists now. |
| Timeline view | Future | Recent notes exist; a timeline view does not. |
| Heatmap view | Future | No activity or update heatmap exists now. |
| Property index pages | Future | Existing browse routes cover category, tag, path, type, and status only. |
| Advanced filters | Future | No multi-field filtering UI exists now. |
| Multi-pane reading mode | Future | Current reader is static single-note reading, not an Obsidian workspace. |
| Note embed preview | Future | No embedded note preview exists now. |
| Block reference deep linking | Future | No stable exported block-reference model exists now. |
| Excalidraw-like image/card treatment | Future | Note images render normally; no Excalidraw-specific treatment exists. |

## Explicitly Unsupported

- Online editing.
- Full Obsidian plugin API.
- DataviewJS execution.
- Browser-side parsing of all Markdown.
- Live private-vault sync.
- Publishing the entire private Obsidian vault.
- Treating `--vault` as a public content source.
- Full Obsidian clone behavior.
