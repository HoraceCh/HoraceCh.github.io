# First-round site experience audit

Audit date: 2026-07-18 (Asia/Shanghai)
Scope: public `Horace_Website` only; audit-only, no source repairs
Production: <https://horacech.github.io/>
Local production preview: `http://127.0.0.1:4321/`

## 1. Baseline

| Item | Result |
| --- | --- |
| Repository root | `F:\Projects\Horace_Website` |
| Branch | `main` |
| HEAD | `63efe0ac44b0dcd389305529e18da50cb687ef4a` |
| Initial worktree | Clean (`git status --short` returned no entries) |
| Node | `v24.14.1` |
| npm / pnpm | `11.14.1` / `11.9.0` |
| Production build | PASS — Astro generated 132 pages; static build completed in 4.05 s (22.5 s command wall time) |
| Build diagnostics | No build error; Node emitted deprecation warning `DEP0147` |
| Production availability | PASS — production pages and assets were reachable during the audit |
| Local preview availability | PASS — production-mode preview served HTTP 200 on `127.0.0.1:4321` |

Repository rules, `package.json`, the model/agent routing documents, and the canonical UI design document were inspected before the audit. All pre-existing state was preserved. The prohibited `Horace_Website_Admin` repository was not accessed or used.

## 2. Executive summary

The site builds and its main navigation, theme control, code-copy interaction, valid heading anchors, nested-route reloads, and browser history behavior work in the sampled environments. No sampled run produced an uncaught page exception, hydration error, failed first-party asset request, or broken rendered image.

Seventeen reproducible issues met the reporting threshold: **0 P0, 4 P1, 8 P2, and 5 P3**. The most important risks are stale generated Notes remaining publicly routable after falling out of the sync manifest, severe mobile/tablet overlap between a long Note outline and its body, a linked category route that always returns 404, and invalid Note heading hierarchy that also prevents the Outline from representing many documents. The next repair round should start with publication-state integrity, then restore route/anchor contracts and Note structure before visual polish.

Round 2A (2026-07-18) repaired the four P1 findings in the local worktree. Their original reproduction evidence is preserved below; production confirmation remains `PENDING_DEPLOY` until these changes are deployed.

Round 2B (2026-07-19) repaired all eight P2 findings in the local worktree. WEB-005 through WEB-012 are recorded as `FIXED`; the five P3 findings remain open, and production confirmation remains `PENDING_DEPLOY` until deployment.

Round 2C (2026-07-19) repaired all five P3 findings in the local worktree. WEB-013 through WEB-017 are recorded as `FIXED`; production confirmation remains `PENDING_DEPLOY` until deployment.

## 3. Coverage matrix

### Routes and content

| Coverage area | Production | Local preview | Representative evidence |
| --- | --- | --- | --- |
| Home, About, Resume, Contact, Links | Inspected | Inspected | Navigation, identity wording, CTAs, external links, active state, theme, keyboard focus |
| Projects index | Inspected | Inspected | Cards, filters/status language, responsive grid |
| Every published Project | Inspected | Inspected | `/projects/ai-retrieval-tool/`, `/projects/ai-assisted-learning-workflow/`, `/projects/vla-embodied-ai-learning-system/`, `/projects/mechanical-design-portfolio/` |
| Notes index | Inspected | Inspected | Search/taxonomy entry points, cards, summaries, counts |
| Long/code-heavy Note | Inspected | Inspected | `/notes/c-pointers/`: 55 copy controls, long scroll, Outline, headings |
| Image/table-heavy Note | Inspected | Inspected | `/notes/004/` |
| Outline/Backlinks Note | Inspected | Inspected | `/notes/c-arrays/` |
| Complex Markdown Note | Inspected | Inspected | `/notes/tree-binary-tree/`; lists, quotations, pseudo-anchors |
| Clean comparison Note | Inspected | Inspected | `/notes/ai-assisted-literature-workflow/` |
| Representative taxonomies | Inspected | Inspected | `/notes/collections/programming-languages/c/`; `/notes/categories/programming-languages/`; `/notes/categories/information-retrieval/`; `/notes/tags/c/`; `/notes/types/learning-note/`; `/notes/status/seed/`; `/notes/status/growing/`; `/notes/paths/embodied-ai-vla/`; `/notes/paths/ai-assisted-research-workflow/` |
| Invalid route / 404 | Inspected | Inspected | Direct invalid URL and generated 404 behavior |
| Shared shell | Inspected | Inspected | Header, footer, desktop/mobile navigation, logo/home entry, theme control |
| Internal crawl | 162 same-origin resources | 161 same-origin resources | Status, fragment targets, images, scripts, styles, canonical links |

The internal crawl also covered discoverable generated Note and taxonomy routes beyond the manually inspected samples. All four published Project detail routes were manually opened.

### Environments and viewports

| Browser/environment | Viewports | Evidence classification | Scope |
| --- | --- | --- | --- |
| User Chrome on Windows host | Desktop plus resized responsive states | `ACTUAL_OS` for the Windows/Chrome session; `EMULATED_DEVICE` for forced viewport sizes | Production and local; interactive navigation, keyboard, copy, anchors, history, theme, visual inspection |
| Chromium responsive emulation | 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 | `EMULATED_DEVICE` | Production and local |
| Playwright Firefox 144.0.2, headless | 1366×768 | `BROWSER_ENGINE` | Production and local smoke routes, console/network/layout, theme/reduced motion |
| Playwright WebKit 26.0, headless | 1440×900 | `BROWSER_ENGINE` | Production and local smoke routes, console/network/layout, theme/reduced motion |
| Playwright WebKit mobile emulation | 390×844 | `BROWSER_ENGINE`, `EMULATED_DEVICE` | Production and local navigation/layout/theme |

The required 1366×768 viewport was covered with Firefox; the other requested viewports were covered with Chromium, with 1440×900 and 390×844 also cross-checked in WebKit. Browser-engine runs are not claimed as real Firefox/Safari operating-system sessions, and responsive emulation is not claimed as physical-device testing.

### Interaction and diagnostic coverage

| Check | Result |
| --- | --- |
| Desktop/mobile navigation, active state, logo/home entry | Operated; one mobile visibility defect recorded |
| Main CTAs and primary destinations | Home/About/Projects/Notes/Resume/Contact navigation, all four Project routes, representative Note routes, Resume CTAs, and internal return links operated; one label defect recorded |
| External destinations | GitHub profile and Information Retrieval Tool repository returned 200; Creative Commons licence returned 200; `mailto:horacebuddle@gmail.com` scheme/target inspected; LinkedIn was automation-blocked and is a limitation, not a broken-link finding |
| Theme initialization, system dark, manual switching, persistence/reload | Functional; one metadata defect recorded |
| Keyboard order and visible focus | Operated; off-screen mobile focus recorded |
| Emulated touch/pointer | Mobile navigation, theme, and link controls operated in responsive Chromium/WebKit contexts; target geometry inspected; classified `EMULATED_DEVICE`, not physical touch testing |
| Code copy | PASS — clipboard changed from a sentinel to the selected code block |
| Heading anchor, Outline, Backlinks | Valid anchor/history flow passed; structural and broken-anchor defects recorded |
| Direct nested-route reload, back, forward | PASS in sampled routes |
| Reduced motion | Media query matched and declared transitions/transforms were disabled; no defect accepted |
| Console/hydration/network/assets | No sampled page exceptions or hydration errors; no failed rendered first-party image/script/style requests |
| Link/anchor crawl | Missing category and missing fragments recorded |
| Responsive tables/images/code/cards/sidebars | Sampled across all required widths; outline collision recorded |
| Content/identity review | Identity variation is explained; placeholder and raw-markup defects recorded |
| Sampled accessibility semantics | Headings, landmarks, link/button names, image alternatives, focus, contrast, and reflow inspected on primary routes and representative Notes; accepted defects are recorded below |

## 4. Issue inventory

### WEB-001 — Stale generated Notes remain publicly published

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P1 High** / High / `FIXED` |
| Category | Publication integrity / generated content |
| Route | `/notes/c-pointers-archive/`, `/notes/python-lists-draft/`, related taxonomy listings |
| Environment | Production and local preview; all engines (static route) |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open either route directly, then inspect the Notes/taxonomy outputs and the current Obsidian sync manifest.
- **Expected:** Material excluded from the current publish set, especially `_archive` and draft-labelled source material, should not remain in generated public content or taxonomies.
- **Actual:** Both routes return published pages. Their generated Markdown is marked `draft: false` and points to `_archive`, but neither slug exists in the current sync manifest.
- **Evidence:** `src/content/notes/c-pointers-archive.md` and `src/content/notes/python-lists-draft.md` remain generated outputs; `astro-public/notes-assets/.obsidian-notes-sync-manifest.json` contains neither slug. The production draft route returned 200.
- **Likely root cause:** The sync collector skips `_archive`, while stale-output cleanup runs only when the optional `--clean` flag is supplied; previously generated files can survive indefinitely.
- **Suspected files/components:** `tools/sync-obsidian-notes.mjs`, generated `src/content/notes/*`, sync manifest handling.
- **Smallest safe repair:** Make publish reconciliation remove previously generated entries that are no longer in the manifest (with explicit protection for hand-authored content), and add an invariant preventing archive/draft sources from receiving `draft: false`.
- **Regression checks:** Build from a fixture containing a formerly published Note moved to `_archive`; verify its route and taxonomy entries disappear while hand-authored Notes remain; crawl for draft/archive slugs.
- **Round 2A resolution:** The publisher now reconciles marker-owned Notes and assets against the current write plans on every run, preserves hand-authored/current output, and reports removals in dry-run mode. Fixture and live publish checks verified idempotence, approved Note/homepage/backlink/taxonomy retention, and removal of the two stale routes. Local status: `FIXED`; production: `PENDING_DEPLOY`. Detailed evidence is in `docs/qa/site-experience-fix-log.md`.

### WEB-002 — Long Note outline overlaps the body on mobile and tablet widths

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P1 High** / High / `FIXED` |
| Category | Responsive layout / readability |
| Route | `/notes/c-pointers/` and other Notes with long outlines |
| Environment | Chromium 360×800, 390×844, 768×1024; production and local |
| Evidence classification | `EMULATED_DEVICE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open `/notes/c-pointers/` at 360×800, 390×844, or 768×1024 and scroll from metadata/Outline into the article body.
- **Expected:** The Outline should consume normal document height or remain in a bounded scroll area without covering the Note.
- **Actual:** Outline links visually extend outside the side-pane container and overlap the first part of the article.
- **Evidence:** At 390 px, outline bottom `2359.10` and body top `1491.26` produce **867.84 px** overlap. At 360 px the overlap is **911.84 px**; at 768 px it is **249.59 px**. Desktop 1024/1920 layouts did not overlap.
- **Likely root cause:** The mobile breakpoint changes overflow to visible but retains the base `max-height` on `.note-sidepane-inner`; the long child list paints beyond the container without contributing to layout height.
- **Suspected files/components:** Note detail layout/styles, especially `.note-sidepane-inner` and `.note-outline-list` in `src/pages/notes/[slug].astro` or shared Note CSS.
- **Smallest safe repair:** At stacked breakpoints, remove/reset the side-pane max-height or retain a deliberately bounded scrolling Outline with accessible overflow.
- **Regression checks:** Test short and 50+ item outlines at 360, 390, 768, 1024, and 1920 px; assert no geometric intersection and keyboard access to every outline link.
- **Round 2A resolution:** Stacked Note layouts now remove the inherited side-pane height caps, including the higher-specificity open state. Geometry checks at 390×844, 768×1024, 1024×768, and 1366×768 found zero Outline/article intersection and no horizontal overflow; Outline and Backlinks remain accessible. Local status: `FIXED`; production: `PENDING_DEPLOY`. Detailed evidence is in `docs/qa/site-experience-fix-log.md`.

### WEB-003 — Linked Information Retrieval category route returns 404

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P1 High** / High / `FIXED` |
| Category | Navigation / broken internal link |
| Route | `/notes/categories/information-retrieval/` |
| Environment | Chrome, Firefox, WebKit; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open any of Notes `000`–`006`, activate the Information Retrieval category, or request the route directly.
- **Expected:** A category displayed as a navigable taxonomy link should resolve to its category listing.
- **Actual:** The linked route returns the site 404 page.
- **Evidence:** The crawl found the route as the only non-404-page same-origin 404. Firefox and WebKit direct navigation reproduced it on production and local preview. Seven Notes emit that category link.
- **Likely root cause:** Note metadata uses the category, but `categoryDefinitions` does not define it; static category paths are generated only from that list.
- **Suspected files/components:** `src/utils/notes.ts`, Notes taxonomy route generation, affected Note frontmatter.
- **Smallest safe repair:** Add one canonical category definition/slug used by both metadata rendering and static path generation.
- **Regression checks:** Build, request every emitted category URL, verify 200 and correct Note count, and add a contract test that every rendered taxonomy link has a generated path.
- **Round 2A resolution:** A canonical Information Retrieval category definition now drives the same display-name/slug contract used by links and static paths. The generated route contains the expected seven Notes; all nine emitted category routes and all 5,019 built internal links resolve. Local status: `FIXED`; production: `PENDING_DEPLOY`. Detailed evidence is in `docs/qa/site-experience-fix-log.md`.

### WEB-004 — Body H1 headings break document hierarchy and disappear from Outline

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P1 High** / High / `FIXED` |
| Category | Accessibility / content structure / navigation |
| Route | Many Notes; strongest examples `/notes/c-pointers/`, `/notes/c-arrays/` |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Inspect heading structure and the Outline on either example Note.
- **Expected:** Each Note should have one page-level H1, followed by logically nested H2/H3 sections that appear in the Outline.
- **Actual:** The template H1 is followed by numerous body H1 elements; the Outline only collects H2/H3 and can report “No section headings yet” despite a long, visibly sectioned document.
- **Evidence:** `/notes/c-pointers/` renders 12 H1 elements; `/notes/c-arrays/` renders 23. A source scan found more than one body H1 in 25 of 40 generated Note files.
- **Likely root cause:** The publishing conversion preserves Vault H1 headings, while the page template independently supplies the title and the Outline filters to heading depths 2–3.
- **Suspected files/components:** `tools/sync-obsidian-notes.mjs` heading conversion, `src/pages/notes/[slug].astro` Outline extraction, generated Note bodies.
- **Smallest safe repair:** Normalize body heading depth during sync (preserving relative nesting) and define one shared Outline depth contract.
- **Regression checks:** Validate a generated Note has exactly one H1; run an automated heading-order check; compare visible sections with Outline entries and anchor targets.
- **Round 2A resolution:** The Notes converter now shifts body heading depth as one relative hierarchy outside code fences, including CommonMark blockquote-fence closure handling. All 34 approved generated Notes render exactly one page H1; five representative Notes have complete Outline targets and no duplicate IDs. Local status: `FIXED`; production: `PENDING_DEPLOY`. Detailed evidence is in `docs/qa/site-experience-fix-log.md`.

### WEB-005 — Raw Obsidian embed syntax leaks into summary and social metadata

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Content rendering / metadata |
| Route | `/notes/004/`, Notes index card, Open Graph/Twitter metadata |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open the Notes index and Note `004`; inspect its displayed description and page metadata.
- **Expected:** Summaries and social descriptions should be readable prose without source-system markup.
- **Actual:** The literal string `![[ScienceDirect (Elsevier)快速检索.png]]` is used as the description on the card/detail and in social metadata.
- **Evidence:** The same raw embed string appears visibly and in generated meta/OG/Twitter description values.
- **Likely root cause:** Explicit descriptions bypass the Markdown/Obsidian stripping used for body-derived fallbacks.
- **Suspected files/components:** Note metadata/description sanitizer in `src/utils/notes.ts` or layout metadata helpers; generated Note `004` frontmatter.
- **Smallest safe repair:** Apply one Obsidian-aware plain-text sanitizer to every description source, with a prose fallback when the result is empty.
- **Regression checks:** Snapshot card, detail, description meta, OG, and Twitter fields for embed-only and mixed prose/embed descriptions.

- **Round 2B resolution:** The publisher now applies one Obsidian/Markdown-aware plain-text and readable-math normalizer to explicit and fallback descriptions, removes blockquote/table remnants, and falls through empty embed-only candidates to prose. Note `004` card/detail/meta/OG/Twitter output and additional callout/table/math fixtures contain no source markup. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-006 — Unconverted callout, fence, and LaTeX syntax appears as reader-facing text

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Notes publishing / content rendering |
| Route | Multiple Notes, including C and data-structure learning Notes |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open affected Notes and search the rendered body for callout markers or math delimiters.
- **Expected:** Supported source constructs should render semantically; unsupported constructs should degrade to readable prose.
- **Actual:** Readers see artifacts such as `[!QUESTION]`, `[!EXAMPLE]`, `ATTENTION: >`, `EXAMPLE: >```C`, `$O(n)$`, `\leq`, and `\lceil`.
- **Evidence:** At least 11 generated routes contain visible callout/fence remnants and at least 10 contain raw LaTeX-like notation. The site has no active math renderer for these bodies.
- **Likely root cause:** Conversion handles only a subset of Obsidian callout/fence patterns and passes inline math through a Markdown stack without math support.
- **Suspected files/components:** `tools/sync-obsidian-notes.mjs`, Markdown/remark configuration, generated Note bodies.
- **Smallest safe repair:** Normalize callouts/fences during sync and either add static math rendering or convert the limited notation set to readable Unicode/plain text.
- **Regression checks:** Fixture-test nested callouts, adjacent fences, inline/display math, dark mode, copy behavior, and no raw delimiter leakage.

- **Round 2B resolution:** Sync-time body normalization now handles nested/malformed callouts and fence boundaries without rewriting fenced/inline code, degrades the supported notation set to readable Unicode/plain text, and makes unknown TeX a strict-mode warning/blocker instead of silently publishing it. Static and browser checks across five structurally different Notes found none of the audited remnants. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-007 — Several visible Note links point to nonexistent fragments

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Navigation / anchors |
| Route | `/notes/tree-binary-tree/`, `/notes/c-arrays/`, `/notes/c-io/`, `/notes/c-conditional-loop-control/` |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Activate the four traversal links on the binary-tree Note or the cross-Note links to `#ascii`, `#for`, and `#while-do-while`.
- **Expected:** A link presented as section navigation should move focus/scroll to a matching target.
- **Actual:** Four traversal links use `href="#"`, and three unique cross-Note fragments have no matching element ID.
- **Evidence:** The crawl found missing targets `/notes/c-data-types/#ascii`, `/notes/c-control-flow/#for`, and `#while-do-while`; rendered IDs instead include `ascii码表`, `for循环-的用法`, and longer while-loop variants.
- **Likely root cause:** Hand-authored/converted fragment names were not reconciled with the current heading slugger; placeholder `#` links survived publishing.
- **Suspected files/components:** Affected generated Note bodies, wiki-link/heading conversion in `tools/sync-obsidian-notes.mjs`.
- **Smallest safe repair:** Resolve Note fragments from the final heading-slug map during conversion and turn unresolved placeholders into non-link text or valid anchors.
- **Regression checks:** Crawl every internal fragment after build; click/back/forward/reload each repaired link; verify unique IDs and focus placement.

- **Round 2B resolution:** The publisher builds a renderer-compatible final heading/ID registry, preserves inline-code characters in heading slugs, rewrites self/cross-Note fragments to final IDs, and fails strict mode for unresolved published fragments. Build-wide fragment tests and Chromium click/back/forward/hash checks pass; the same invariant also repaired six additional literal `#` placeholders. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-008 — `c` and `C语言` tags collide on one slug and show inconsistent counts

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Taxonomy / information architecture |
| Route | Notes index tag pills and `/notes/tags/c/` |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** On the Notes index, compare the `c` and `C语言` pills, activate each, and compare displayed counts with the destination.
- **Expected:** Distinct visible tags should have distinct destinations, or aliases should be merged under one name and count.
- **Actual:** Both labels resolve to `/notes/tags/c/`; the index displays counts 14 and 5, while the destination shows a union of 16 Notes.
- **Evidence:** The current slug function maps both labels to `c`; stale archive content also contributes to the destination count.
- **Likely root cause:** Lossy transliteration/normalization is used as a unique taxonomy key without collision detection or an alias model.
- **Suspected files/components:** `src/utils/notes.ts` slug/taxonomy aggregation, tag route path generation.
- **Smallest safe repair:** Define canonical tag IDs/aliases and aggregate before presenting links and counts; fail the build on unexpected slug collisions.
- **Regression checks:** Assert one visible taxonomy concept per URL, stable aliases, correct counts, and no duplicate route generation.

- **Round 2B resolution:** Public tag identity now declares canonical `C` with `c` and `C语言` aliases, aggregates before link/count/path presentation, and fails on undeclared slug collisions. The index shows one `C 15` concept and `/notes/tags/c/` contains the same 15 Notes in Chromium, Firefox, and WebKit. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-009 — Chinese Note pages declare the document language as English

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Accessibility / internationalization |
| Route | Chinese-language Notes such as `/notes/c-pointers/` |
| Environment | Chrome, Firefox, WebKit; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open a predominantly Chinese Note and inspect the root `html` element.
- **Expected:** The page or its main content should declare `zh-CN`/appropriate language so assistive technology selects correct pronunciation rules.
- **Actual:** The document remains `<html lang="en">` with no language override around Chinese content.
- **Evidence:** The Chinese C Pointers page reported `document.documentElement.lang === "en"` in all three engines.
- **Likely root cause:** The shared layout hard-codes English and Note metadata has no language field/heuristic.
- **Suspected files/components:** `src/layouts/Layout.astro`, Note schema/metadata, Note detail layout.
- **Smallest safe repair:** Add explicit content language metadata with a conservative default and pass it to the document or article language attribute.
- **Regression checks:** Accessibility-tree/screen-reader spot checks for English and Chinese pages; verify title/meta and code spans are unaffected.

- **Round 2B resolution:** Notes now carry constrained `en`/`zh-CN` metadata, explicit values win, and conservative inference compares Han characters with Latin word/identifier segments after excluding code/assets/URLs. Layout and Note article semantics consume the value. Representative Chinese, code-heavy Chinese, and English Notes report matching `html`/`article` language. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-010 — Mobile header scrolls the active item and keyboard focus off-screen

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Responsive navigation / keyboard accessibility |
| Route | Shared header, clearest on `/contact/` and `/resume/` |
| Environment | Chromium 360/390; WebKit mobile emulation 390×844 |
| Evidence classification | `EMULATED_DEVICE`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open Contact at 390 px without horizontally scrolling the nav, then Tab across the header at 360 px.
- **Expected:** The current item and focused control should be visible, or the container should automatically reveal them.
- **Actual:** Contact is fully outside the initial nav viewport; keyboard focus can move to an almost completely clipped Resume item.
- **Evidence:** At 390 px the nav spans x=12–378 while active Contact spans x=395.36–453.52. At 360 px, focused Resume spans x=322.42–380.03 while the visible nav ends at x=333.
- **Likely root cause:** The ≤720 px header uses a non-wrapping, horizontally scrolling row but does not reveal the active/focused descendant.
- **Suspected files/components:** Shared header/navigation component and mobile rules in `src/styles/global.css`.
- **Smallest safe repair:** Use a compact mobile navigation pattern or scroll the active/focused item into view while preserving a visible scroll affordance.
- **Regression checks:** Keyboard and touch test every nav item at 320–390 px; verify active state, focus ring, RTL safety, and no page-level horizontal overflow.

- **Round 2B resolution:** The header immediately reveals the current link and reveals focused descendants with logical nearest alignment, restores document scroll if the browser attempts collateral movement, and retains the single-line horizontal scroller plus focus ring. Chromium 360/390/768, Firefox 360, and WebKit 390 checks pass in both themes, reduced motion, and temporary RTL. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-011 — Muted text color misses normal-text AA contrast in light mode

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Accessibility / color contrast |
| Route | Shared header and canvas-muted copy in light theme |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Switch to light theme and measure `#737373` text on the `#f5f5f5` canvas.
- **Expected:** Normal-sized text should meet WCAG AA contrast of at least 4.5:1.
- **Actual:** The pairing measures **4.349:1**. Inactive header labels and other muted canvas text use this pairing.
- **Evidence:** Exact sRGB calculation; the same color on white cards measures 4.742:1 and the audited dark-theme pairings exceed 5.86:1, limiting the defect to the light canvas pairing.
- **Likely root cause:** A shared muted token was selected against white surfaces but reused on the slightly darker canvas.
- **Suspected files/components:** Color tokens and header/canvas text rules in `src/styles/global.css` or theme variables.
- **Smallest safe repair:** Darken the light-theme muted token enough to clear 4.5:1 on every surface where it is used.
- **Regression checks:** Automated contrast checks for normal text in both themes and all surface tokens; visual check disabled/muted semantics remain distinct.

- **Round 2B resolution:** The canonical light `--muted` and `--notes-muted` value is now `#707070`; dark tokens, borders, and decorative opacity exceptions are unchanged. It measures 4.542:1 on `#f5f5f5`, 4.744:1 on `#fafafa`, and 4.952:1 on white, with the canonical UI specification updated to match. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-012 — Home downloads duplicate oversized PNGs for favicon and profile artwork

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P2 Medium** / High / `FIXED` |
| Category | Performance / assets |
| Route | Home and shared document head |
| Environment | Production and local; network-independent static evidence |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Load Home with a cold cache and inspect the favicon/profile image dimensions, byte sizes, and hashes.
- **Expected:** Small favicon/profile uses should receive correctly sized, cacheable assets without duplicate payload under different URLs.
- **Actual:** `favicon.png` and `profile-mark.png` are byte-identical 1254×1254 PNGs of 584,968 bytes each; the dark/light counterpart pair is also identical at 542,895 bytes each.
- **Evidence:** SHA-256 equality and built asset dimensions/sizes; Home references the favicon and profile through separate URLs, allowing roughly 1.17 MB of identical light-image payload. Production advertised only a 600-second max-age during the check.
- **Likely root cause:** One master raster was copied into multiple roles without responsive derivatives or content-addressed reuse.
- **Suspected files/components:** `public/favicon*.png`, `public/assets/profile-mark*.png`, `src/layouts/Layout.astro`, `src/pages/index.astro`.
- **Smallest safe repair:** Generate role-sized favicon/profile derivatives, reuse identical resources where possible, and keep lossless/source masters outside delivered paths.
- **Regression checks:** Cold-load network budget, decoded dimensions, DPR quality, light/dark appearance, favicon formats, and no duplicate-content URLs.

- **Round 2B resolution:** Delivered identity assets are role-sized and byte-distinct: 64×64 light/dark favicons (2,704/2,676 bytes), a 180×180 touch icon (11,519 bytes), and a 554×554 profile image (132,338 bytes). Head/home markup declares intrinsic roles, and the unreferenced duplicate profile file was removed. Browser image decode, appearance, dimensions, hashes, and request checks pass. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-013 — Browser theme metadata stays light after switching to dark mode

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P3 Low** / High / `FIXED` |
| Category | Theme integration / presentation |
| Route | All routes |
| Environment | Chrome, Firefox, WebKit; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Initialize or switch the site to dark mode and inspect `meta[name="theme-color"]`.
- **Expected:** Supporting browser chrome should receive a dark color matching the active site theme.
- **Actual:** The meta value remains the light color `#f7f7f4` after initialization, manual switching, and reload.
- **Evidence:** Dark class, dark canvas, toggle label, and persisted storage all updated correctly; only theme metadata remained light.
- **Likely root cause:** A single hard-coded theme-color tag is emitted by the shared layout.
- **Suspected files/components:** `src/layouts/Layout.astro`, theme initialization/switch script.
- **Smallest safe repair:** Provide media-aware theme-color tags or update the tag in the existing theme state transition.
- **Regression checks:** System light/dark, manual override, reload, page navigation, and mobile browser chrome screenshots where available.
- **Round 2C resolution:** The shared layout now emits one early light/dark theme-color contract (`#f5f5f5` / `#08090a`), and both initialization and manual switching synchronize it with the effective theme. Chromium, Firefox, and WebKit confirmed dark initialization, light switching, and cross-route persistence at 390×844 and 1366×768. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-014 — Homepage Note CTA is labelled “View project”

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P3 Low** / High / `FIXED` |
| Category | Content / CTA clarity |
| Route | Home selected Note card |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** On Home, inspect the selected Note card linking to `/notes/ai-assisted-literature-workflow/`.
- **Expected:** The CTA should describe the destination as a Note or article.
- **Actual:** It says “View project,” implying a different content type.
- **Evidence:** The card URL is a Note route while the fixed label in the homepage component is project-specific.
- **Likely root cause:** A shared/static project card CTA was reused for a Note feature.
- **Suspected files/components:** `src/pages/index.astro` selected-work/Note card markup.
- **Smallest safe repair:** Derive the label from content type or change this instance to “Read note.”
- **Regression checks:** Verify every homepage CTA label matches its route and accessible name.
- **Round 2C resolution:** Homepage selected-work entries now carry content-specific action labels: both Project cards retain “View project,” while the selected Note reads “Read note.” Route targets and whole-card accessible names are unchanged and were verified in all three browser engines. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-015 — Production 404 page says the Astro site is still being prepared

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P3 Low** / High / `FIXED` |
| Category | Content / credibility |
| Route | Invalid route / 404 |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open a nonexistent route.
- **Expected:** A deployed production site should explain that the requested page is unavailable and offer recovery navigation.
- **Actual:** The page says to return “while the Astro site is being prepared,” making the live portfolio sound unfinished for infrastructure reasons.
- **Evidence:** The phrase is visible on both production and local 404 responses.
- **Likely root cause:** Initial scaffold copy remained after launch.
- **Suspected files/components:** `src/pages/404.astro`.
- **Smallest safe repair:** Replace the preparation language with durable not-found copy while retaining Home/Projects/Notes recovery links.
- **Regression checks:** Direct invalid route on production preview, keyboard navigation, correct HTTP 404 status, and no internal dead-end.
- **Round 2C resolution:** The launch-era sentence was replaced with durable not-found guidance while preserving the Home, Projects, and Notes recovery links. Direct invalid local-preview requests returned HTTP 404 in Chromium, Firefox, and WebKit without the stale phrase. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-016 — Links page exposes placeholder-only sections

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P3 Low** / High / `FIXED` |
| Category | Content / completeness |
| Route | `/links/` |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** Open Links and read the section bodies.
- **Expected:** A primary published page should provide its promised resources or clearly position itself as an intentionally empty future area.
- **Actual:** Two sections contain only “Resource links will be added...” placeholder messages.
- **Evidence:** Both placeholder strings are rendered as the page's main content.
- **Likely root cause:** The route was published before resource content was available.
- **Suspected files/components:** `src/pages/links.astro` or its content source.
- **Smallest safe repair:** Add the intended curated links or remove/de-emphasize the route until it has reader value.
- **Regression checks:** Review navigation discoverability, link validity, external-link labelling, and empty-state wording.
- **Round 2C resolution:** The two placeholder-only sections were removed, while the verified Friends, Link Exchange, Link Format, and Link Notes content and external-link semantics remain. Page description and lead now match the actual content. All three engines showed no placeholder text or horizontal overflow at the sampled mobile and desktop widths. Local status: `FIXED`; production: `PENDING_DEPLOY`.

### WEB-017 — Discoverable taxonomy pills lead to zero-result pages

| Field | Value |
| --- | --- |
| Severity / confidence / status | **P3 Low** / High / `FIXED` |
| Category | Information architecture / empty states |
| Route | Multiple Note category/type/status pages |
| Environment | All engines; production and local |
| Evidence classification | `ACTUAL_OS`, `BROWSER_ENGINE` |
| Reproduces | Production: **Yes**; local preview: **Yes** |

- **Reproduction:** From Notes taxonomy navigation, open Mechanical Design, Project Logs, concept, engineering, project, evergreen, or archived.
- **Expected:** Prominent taxonomy links should return relevant content, or the UI should clearly identify unavailable filters before navigation.
- **Actual:** These links lead to empty result pages, which resemble failed or unfinished features.
- **Evidence:** Category Mechanical Design and Project Logs, types concept/engineering/project, and statuses evergreen/archived each returned zero Notes during the audit.
- **Likely root cause:** The UI renders the full taxonomy definition set regardless of published counts.
- **Suspected files/components:** Notes index taxonomy rendering, `src/utils/notes.ts` definitions, taxonomy page empty state.
- **Smallest safe repair:** Hide zero-count taxonomy links from primary discovery or show counts/disabled semantics and a deliberate empty-state explanation.
- **Regression checks:** Verify counts against published Notes, keyboard semantics for disabled/hidden options, and direct empty-route behavior.
- **Round 2C resolution:** Primary Notes discovery now filters computed category, learning-path, type, and status entries to positive counts without changing route generation. Every visible pill has a positive count, canonical `C` remains `15`, and all seven direct empty routes still return 200 with their deliberate empty-state messages in Chromium, Firefox, and WebKit. Local status: `FIXED`; production: `PENDING_DEPLOY`.

## 5. Non-issues and limitations

### Verified non-issues

- The existing production build completed successfully and generated 132 static pages.
- Sampled Chrome, Firefox, and WebKit pages showed no uncaught page exceptions, hydration errors, failed rendered first-party assets, broken images, or page-level horizontal overflow outside the intentionally scrollable mobile nav.
- System-theme initialization, manual light/dark switching, local-storage persistence, reload, and cross-page persistence worked in production and local preview. WEB-013 is limited to browser theme metadata.
- The first of 55 code-copy controls on `/notes/c-pointers/` copied the expected code into the clipboard and supplied visible feedback.
- A valid C Pointers Outline anchor set the correct hash and target position; back, forward, and nested hash reload worked.
- Reduced-motion media queries matched in supporting test contexts and the declared site transitions/transforms were disabled. No motion issue was accepted without frame/trace evidence.
- Identity wording across Home, About, and Resume is materially consistent. The Horace Chan / Horace Chen variation is explicitly explained rather than an accidental identity contradiction.
- The projects describe their early-stage state candidly; the OpenVLA `seed` label and “PDF later” Resume language were treated as intentional disclosure, not defects.
- Direct archive-looking URLs alone were not classified as defects. WEB-001 is based on the stronger mismatch between generated public files and the current sync manifest/publish exclusions.
- An injected “Flash Notes” control observed in the user's Chrome belonged to a browser extension and was excluded from site findings.

### Limitations

- `ACTUAL_OS` coverage is limited to the user's Chrome session on the Windows host. The browser did not expose a reliable Windows or Chrome version, so none is claimed.
- Firefox and WebKit results are headless browser-engine runs on Windows. WebKit is not claimed as real Safari/macOS/iOS testing.
- No physical Android/iOS device, real touch hardware, macOS, Linux desktop, screen reader, switch control, or high-contrast/forced-colors session was available.
- Responsive reflow was tested by viewport emulation; browser zoom/text-only zoom was not independently instrumented.
- Landmark, accessible-name, alternative-text, duplicate-ID, and interactive-nesting checks were sampled through DOM/accessibility inspection rather than an exhaustive validator over all 132 generated pages. No additional sampled defect met the evidence threshold; exhaustive screen-reader and HTML-conformance coverage remains for a later round.
- Long-task, CLS, paint, and frame-time lab tracing was not available at sufficient fidelity. No subjective “feels slow” issue was reported.
- LinkedIn returned automation/bot-block responses (HEAD 405, GET 999), so it is recorded as unverified rather than broken. Representative GitHub and Creative Commons external links returned 200.
- Firefox/WebKit required unsandboxed Playwright execution after sandboxed launches timed out; this is a test-tool constraint, not a site defect.

## 6. Recommended repair order

1. **Publication integrity:** fix stale generated-file reconciliation and archive/draft invariants (WEB-001), then verify the public route inventory before any content-oriented work.
2. **Route contracts:** restore the missing category, detect taxonomy slug collisions, and repair every broken fragment (WEB-003, WEB-008, WEB-007).
3. **Core Note structure and responsive reading:** normalize heading levels/Outline behavior and remove mobile/tablet overlap (WEB-004, WEB-002).
4. **Publishing fidelity and language:** sanitize descriptions, convert callouts/math/fences, and declare content language (WEB-005, WEB-006, WEB-009).
5. **Navigation and accessibility tokens:** keep active/focused mobile navigation visible and correct light-theme contrast (WEB-010, WEB-011).
6. **Performance and theme integration:** right-size/deduplicate image assets and synchronize theme-color metadata (WEB-012, WEB-013).
7. **Content polish and empty states:** correct the Note CTA, 404 copy, Links placeholder page, and zero-result taxonomy discovery (WEB-014–WEB-017).

Round 2 should add build-time route/fragment/taxonomy invariants and a small cross-engine responsive regression suite so the repaired contracts remain testable.
