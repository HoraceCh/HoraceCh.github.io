# Obsidian Feature Matrix

This matrix tracks the public notes display layer for the Horace_Website Astro site. The goal is to make exported Obsidian notes readable and useful on a static website without cloning Obsidian or executing user-authored code.

| Feature | MVP / Current Round | V1 | V2 | V3 | Status |
| --- | --- | --- | --- | --- | --- |
| Note reading layout | Single-column detail page with a compact context block and readable prose width. | Preserve layout while adding richer navigation panels. | Support graph and timeline entry points outside the reader. | Support optional multi-pane reading. | MVP |
| Obsidian-like prose style | Typography, spacing, links, images, code, tables, blockquotes, and mark styling tuned for notes. | Refine with real note samples. | Add richer static note transforms where useful. | Add embed and block-reference treatments. | MVP |
| Properties display | Compact Obsidian-like property rows from existing frontmatter metadata. | Add derived fields when extraction supports them. | Add property index pages. | Support advanced property filters. | MVP |
| Tag pills | Compact linked chips for note tags and concept chips for local metadata. | Polish tag index and tag landing states. | Add property/tag cross-filter views. | Add advanced filters. | MVP |
| Callout visual style | Style normal blockquotes as quiet note blocks and support future semantic note/info/tip/warning/danger classes. | Parse exported callout metadata at sync time if needed. | Add richer static callout variants. | Preserve callouts inside embeds and multi-pane mode. | MVP |
| Wikilink visual states | Resolved internal links render as normal inline links; `/notes/missing-note/` links get a degraded unresolved style. | Add hover preview shell for internal note links. | Add graph-aware link browsing. | Add note embed preview. | MVP |
| Image embed style | Responsive rounded images with quiet borders and horizontal safety. | Improve generated asset coverage in pipeline if needed. | Add gallery-like note image treatments. | Add Excalidraw-like image/card treatment. | MVP |
| Code block style | Inline code and fenced code blocks styled for light/dark reading; blocks scroll horizontally. | Add language labels if available from renderer. | Add richer static code metadata. | Preserve code blocks in embeds. | MVP |
| Blockquote style | Blockquotes styled as calm note blocks, separate from body prose. | Add callout-specific rendering if sync emits semantic classes. | Add richer static admonition patterns. | Preserve nested callouts in embeds. | MVP |
| Table style | Tables use hairline borders and horizontal scroll behavior. | Refine dense table readability. | Add static Dataview-like tables. | Support advanced filters around tables. | MVP |
| Backlinks placeholder | Placeholder panel can receive the static incoming-reference count. | Real backlinks panel. | Backlinks feed graph views. | Backlinks support multi-pane reading. | MVP |
| Outline placeholder | Placeholder panel explains that heading extraction is not available yet. | Heading outline extraction. | Outline can coordinate with graph/timeline views. | Outline works in multi-pane reading. | MVP |
| Dark/light readable contrast | Reader, properties, chips, links, and code styles use existing theme variables with dark counterparts. | Continue contrast QA as note volume grows. | Maintain contrast across graph/timeline views. | Maintain contrast across canvas and panes. | MVP |
| Real backlinks panel | Placeholder only. | Show incoming links per note from extracted link graph. | Add graph and filter integration. | Support deep links and multi-pane context. | V1 |
| Static backlinks data index | Build-time utility extracts wikilinks and sync-converted internal note links into incoming, outgoing, and unresolved-link structures. | Use the index to render the real backlinks panel. | Feed graph and filter integrations. | Support deep links and multi-pane context. | V1 |
| Heading outline extraction | Placeholder only. | Generate static outline from rendered headings. | Reuse outline in graph/timeline navigation. | Multi-pane outline support. | V1 |
| Hover preview shell | Not included. | Static shell for internal note preview on hover/focus. | Include graph-aware context. | Include note embed preview. | V1 |
| Local graph placeholder/simple list | Not included beyond related/prerequisite lists. | Add a simple local graph placeholder or static adjacency list. | Real local graph view. | Multi-pane graph context. | V1 |
| Recent notes | Existing notes landing page includes recent notes. | Polish recent note presentation. | Add timeline view. | Add advanced filters. | V1 |
| Tag index polish | Existing tag routes are preserved. | Improve tag index hierarchy and empty states. | Add cross-filtering with properties. | Add advanced filters. | V1 |
| Notes landing page polish | Existing `/notes/` route is preserved. | Improve browsing hierarchy and density. | Add graph/timeline entry points. | Add multi-pane entry points. | V1 |
| Search integration | Not included unless an existing search base is ready. | Integrate search if existing static search base is available. | Add command palette integration. | Add advanced filtering and panes. | V1 |
| Global graph view | Not included. | Not planned for V1 except placeholders. | Static global graph view. | Graph coordinates with canvas/panes. | V2 |
| Local graph view | Not included. | Simple list or placeholder only. | Static local graph view. | Graph coordinates with multi-pane reading. | V2 |
| Command palette | Not included. | Not included. | Static command palette for site navigation/search. | Palette supports advanced views. | V2 |
| Timeline view | Not included. | Recent notes only. | Timeline view for notes and updates. | Timeline works with advanced filters. | V2 |
| Heatmap view | Not included. | Not included. | Static note activity or update heatmap. | Heatmap works with advanced filters. | V2 |
| Static Dataview-like tables | Not included. | Not included. | Build-time generated tables from safe metadata only. | Advanced table filters. | V2 |
| Properties index pages | Not included. | Not included beyond existing category/tag/path/type/status routes. | Index pages for selected properties. | Advanced property filters. | V2 |
| Obsidian Canvas read-only viewer | Not included. | Not included. | Not included. | Read-only canvas viewer for exported canvas data. | V3 |
| Excalidraw-like image/card treatment | Not included. | Not included. | Basic image improvements only. | Special treatment for Excalidraw-style exports. | V3 |
| Block reference deep linking | Not included. | Not included. | Not included. | Stable deep links to exported block references. | V3 |
| Note embed preview | Not included. | Hover preview shell only. | Graph-aware previews only. | Static embedded note preview. | V3 |
| Advanced filters | Not included. | Basic route browsing only. | Some property index support. | Multi-field filtering across note metadata. | V3 |
| Multi-pane reading mode | Not included. | Not included. | Not included. | Optional multi-pane note reading. | V3 |

## Explicitly Unsupported

- Online editing.
- Full Obsidian plugin API.
- DataviewJS execution.
- Browser-side parsing of all Markdown.
- Full Obsidian clone behavior.
