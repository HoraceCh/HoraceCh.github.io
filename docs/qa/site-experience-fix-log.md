# Round 2A P1 site-experience fix log

Date: 2026-07-18 (Asia/Shanghai)
Scope: `WEB-001` through `WEB-004` only
Repository: `F:\Projects\Horace_Website`
Production: <https://horacech.github.io/>
Local production preview: `http://127.0.0.1:4321/`

## Baseline and scope control

| Item | Result |
| --- | --- |
| Starting branch / HEAD | `main` / `63efe0ac44b0dcd389305529e18da50cb687ef4a` |
| Starting worktree | Round 1 QA documentation was untracked under `docs/qa/`; no tracked source change was present |
| Node / npm / pnpm | `v24.14.1` / `11.14.1` / `11.9.0` |
| Required order | `WEB-001` → `WEB-003` → `WEB-004` → `WEB-002` → combined regression → independent QA |
| Architect decision | Order retained; no demonstrated dependency required a change and no protected-boundary exception was authorized |
| Protected boundaries | Original Vault, `Horace_Website_Admin`, deployment, dependencies, Agent configuration, unrelated Project publication, and unrelated Note override behavior were not modified |

All four findings were reproduced against the audited baseline before their respective edits. The production site is unchanged in this local-only round, so production status is `PENDING_DEPLOY` throughout.

## WEB-001

| Field | Result |
| --- | --- |
| Original severity | P1 High |
| Final status | `FIXED` |
| Primary owner | `obsidian_notes_pipeline` |
| Confirmed root cause | Normal publish built the current `writePlan` and `assetPlan` but reconciled stale generated outputs only when optional `--clean` was used. Marker-owned Notes and previous-manifest assets removed from the approved source set therefore survived and remained routable. |
| Files changed | `tools/sync-obsidian-notes.mjs`; `tests/publication/noteSyncReconciliation.test.mjs`; removal of `src/content/notes/c-pointers-archive.md`, `src/content/notes/python-lists-draft.md`, and five owned `astro-public/notes-assets/c-pointers-archive/*` assets |
| Fix applied | Every run now reconciles marker-owned generated Notes, previous-manifest assets, and confirmed stale per-slug asset directories against the current plans. Hand-authored/current output remains protected; dry-run reports removals; `--clean` retains its full-clean meaning. |
| Collateral result from the same root fix | Two newly present source-control/instruction files, `00 RAW LIST.md` and `AGENTS.override.md`, were found entering the approved set. Narrow control-file exclusions were added to the same publication-source-of-truth filter; this did not broaden into unrelated publication policy. |
| Production status | `PENDING_DEPLOY` |

Targeted validation:

- Baseline routes `/notes/c-pointers-archive/` and `/notes/python-lists-draft/` were present despite absence from the current manifest.
- The reconciliation fixture covers removal reporting, preservation of approved and hand-authored Notes, prior-manifest assets, repeated execution, and dry-run behavior; it passes.
- A real publish removed stale outputs. A second publish and dry run reported no further removals and left the 34-Note manifest unchanged.
- Final build and static crawl contain no stale route references; the four stale/control routes return the expected 404 in Firefox and WebKit regression runs.
- Homepage-selected Note, approved routes, backlinks, and taxonomy remain present.

Remaining limitation: the repository's `notes:publish:strict` command is a writing mode, not a check-only command. It passed with zero unresolved, missing, ambiguous, blocking, or warning diagnostics; unrelated source-mtime date churn and one pre-existing embedded metadata block rewrite produced by that command were excluded from this scoped fix. Publication-process idempotence was independently demonstrated by consecutive publish runs and fixtures.

## WEB-003

| Field | Result |
| --- | --- |
| Original severity | P1 High |
| Final status | `FIXED` |
| Primary owner | `frontend_implementer` |
| Confirmed root cause | Note links slugified category display names dynamically, while static paths came only from `categoryDefinitions`. `Information Retrieval` was absent from that registry, so seven valid links had no generated route. |
| Files changed | `src/utils/notes.ts`; `tests/publication/noteTaxonomyContract.test.ts` |
| Fix applied | Added the canonical Information Retrieval display-name/slug definition and a generalized contract test requiring every effectively published generated Note category to have a unique, non-empty registry definition and route slug. No URL was hardcoded at the component level. |
| Production status | `PENDING_DEPLOY` |

Targeted validation:

- Pre-fix build emitted `/notes/categories/information-retrieval/` links but no matching file.
- Final build generates the route with seven Note cards.
- All nine emitted category routes exist; the complete static crawl checked 5,019 internal links across 131 HTML files with zero missing routes.
- Direct local-preview navigation/reload succeeds in Chromium, Firefox, and WebKit at desktop and representative mobile widths; base-path and trailing-slash behavior agree across engines.

Remaining limitations: none in the confirmed display-name-to-slug contract. Production confirmation awaits deployment.

## WEB-004

| Field | Result |
| --- | --- |
| Original severity | P1 High |
| Final status | `FIXED` |
| Primary owner | `obsidian_notes_pipeline` |
| Confirmed root cause | Generated Markdown preserved body ATX H1 headings while the Note template supplied a page H1; Outline extraction intentionally consumed H2/H3. A first fence-aware implementation also exposed a CommonMark edge case: a blockquoted fenced block closes implicitly when quote depth drops, which the initial tracker did not recognize. |
| Files changed | `tools/sync-obsidian-notes.mjs`; `tests/publication/noteHeadingNormalization.test.mjs`; heading-depth-only regeneration in 33 approved `src/content/notes/*.md` files |
| Fix applied | The converter detects outside-fence body H1 and shifts outside-fence H1–H5 down one level as a group, preserving relative hierarchy, numbering, blockquote/callout prefixes, anchor text, and fenced content. Blockquote-depth-aware implicit fence closure handles the observed malformed boundary safely; H6 causes a warning instead of lossy rewriting. |
| Production status | `PENDING_DEPLOY` |

Targeted validation:

- Before editing, `/notes/c-pointers/` rendered 12 H1s and `/notes/c-arrays/` rendered 23 H1s with an empty Outline.
- Normalization fixtures cover ordinary/numbered headings, code fences, blockquotes, callouts, H2-only documents, duplicate headings, H6 safety, and the exact implicit blockquote-fence boundary; all pass.
- Parse/render validation across all 34 approved generated Notes found exactly one rendered H1 per page, all Outline hrefs targeting existing H2/H3 IDs, and no duplicate heading IDs.
- Five representative Notes passed: long/code-heavy `c-pointers` (37 Outline targets), `c-arrays` (22), image/complex `004` (11), `tree-binary-tree` (8), and clean comparison `ai-assisted-literature-workflow` (3). Backlinks remained present and images loaded.
- Chromium, Firefox, and WebKit local-preview checks agree; valid affected pages produced no page exception, console error, or material failed request.

Remaining limitations: original Vault files were intentionally not modified. Production confirmation awaits deployment.

## WEB-002

| Field | Result |
| --- | --- |
| Original severity | P1 High |
| Final status | `FIXED` |
| Primary owner | `frontend_implementer` |
| Confirmed root cause | At the stacked `max-width: 980px` breakpoint, `.note-sidepane-inner` changed to normal-flow/visible overflow but retained the base `max-height`; higher-specificity `:has()` open states also retained a fixed height. Long Outline children painted beyond a container that did not contribute their full height to layout. |
| Files changed | `src/styles/global.css` |
| Fix applied | Stacked layouts reset `max-height: none`, and the scoped higher-specificity open-state selectors reset `height: auto`. Desktop sticky/bounded behavior is unchanged. |
| Production status | `PENDING_DEPLOY` |

Targeted validation:

- Pre-fix local geometry reproduced article intersections of 978.22 px at 390×844 and 266.64 px at 768×1024.
- Post-fix checks at 390×844, 768×1024, 1024×768, and 1366×768 found zero Outline/article intersection and zero unintended horizontal overflow. Stacked layouts report `max-height: none`; desktop layouts retain the 656 px sticky bound.
- Opening both Outline and Backlinks at 390×844 keeps the side pane before the article in normal flow. Summary focus is visible and not clipped.
- Light/dark manual switching and reload persistence pass; system-dark initialization and `prefers-reduced-motion` matching pass in Firefox and WebKit.
- Chromium, Firefox, and WebKit show consistent affected-page layout. Valid affected pages produced no page exception, console error, broken image, or material failed request.

Remaining limitation: mobile widths are browser/device emulation, not physical-device testing. Production confirmation awaits deployment.

## Combined P1 regression

| Check | Result |
| --- | --- |
| Targeted Node tests | PASS — reconciliation and heading-normalization suites; publication, backlinks, and taxonomy-contract suites; zero failures |
| Notes dry run | PASS — 34 converted, three intentional control/private skips, zero unresolved/missing/ambiguous/slug-conflict/blocking issues, no warnings, no stale removals |
| Notes strict mode | PASS — zero unresolved/missing/ambiguous/blocking issues and no warnings; command is write-mode as noted under WEB-001 |
| Production build | PASS — Astro generated 131 static pages |
| Static routes and links | PASS — 131 HTML files, 5,019 internal links, nine category targets, zero missing routes, zero stale references |
| Chromium local preview | PASS — responsive geometry, heading/Outline/Backlinks, anchors, theme switching/persistence, focus visibility, reduced-motion state, console/network/assets |
| Firefox browser engine | PASS — 768×1024 and 1366×768 |
| WebKit browser engine | PASS — 390×844 and 1366×768 |
| Theme/accessibility states | PASS — light, dark/system dark, manual persistence, visible focus, reduced-motion matching; no hidden-focus or overlap regression observed |
| Production | Not changed; all four fixes are `PENDING_DEPLOY` |

## Independent QA

Independent `qa_build_reviewer` verdict: **PASS WITH WARNINGS**.

The reviewer found no blocker, scope violation, or undocumented remaining P1 regression. It independently reran the 131-page production build and all six publication suites, confirmed `git diff --check`, generated-heading scope, stale-output cleanup, taxonomy coverage, audit traceability, and the recorded Chromium/Firefox/WebKit regression evidence. The warning is limited to the documented Notes behavior: a check-only dry run still proposes non-functional source-mtime/date and existing-asset reconciliation writes, while strict mode itself is write-capable. This does not invalidate the repaired routes or build, but should be accepted explicitly before committing and followed up separately if deterministic metadata generation is desired.

## Round 2B planning

Baseline: `main` at `2acf5619481c382b54e8504a583a574dae2c3cb2`, clean worktree before this planning entry. Round 2A is a dedicated commit, both QA documents are tracked, and WEB-001 through WEB-004 remain `FIXED`.

| Issue | Category and reproduction environment | Likely root cause | Primary owner | Expected files | Dependency order | Required validation |
| --- | --- | --- | --- | --- | --- | --- |
| WEB-005 | Note description/social metadata; all engines, production and local | Explicit Note descriptions bypass Obsidian-aware plain-text normalization | `obsidian_notes_pipeline` | `tools/sync-obsidian-notes.mjs`, focused fixtures, sync-owned generated Note output | First in Notes batch | Embed-only and mixed descriptions; card/detail/meta/OG/Twitter prose fallback; idempotent sync |
| WEB-006 | Note callout/fence/math rendering; all engines, production and local | Conversion handles only a subset of nested callouts/fences and has no safe math degradation | `obsidian_notes_pipeline` | `tools/sync-obsidian-notes.mjs`, focused fixtures, sync-owned generated Note output | After WEB-005, before fragment mapping | Nested callouts, adjacent/quoted fences, inline/display math, code-fence immunity, five representative Notes, dark theme and copy regression |
| WEB-007 | Note internal fragments; all engines, production and local | Link fragments use a lossy independent slugger and are not reconciled with final rendered heading IDs; literal placeholders survive | `obsidian_notes_pipeline` | `tools/sync-obsidian-notes.mjs`, fragment contract tests, sync-owned generated Note output | After WEB-006 and protected WEB-004 heading contract | Build-wide fragment crawl, unique IDs, click/history/hash reload, strict failure for unresolved published fragments |
| WEB-009 | Chinese Note language semantics; Chromium/Firefox/WebKit, production and local | Shared layout defaults to English and generated Notes lack constrained language metadata | `obsidian_notes_pipeline` | `src/content.config.ts`, sync pipeline/tests, generated frontmatter, bounded `Layout.astro`/Note-page integration | Last Notes batch item, before final regeneration | Representative Chinese and English Notes, DOM/accessibility language, title/meta/code invariants, idempotent sync |
| WEB-008 | Tag taxonomy collision/counts; all engines, production and local | Lossy slug is used as identity without declared alias/collision model | `frontend_implementer` | `src/utils/notes.ts` or focused helper, Notes index/tag route, taxonomy contract tests | After final Notes regeneration | One concept/pill/URL, canonical `C` with `C语言` alias, exact counts, unique static paths and collision failure |
| WEB-010 | Mobile shared navigation/focus; Chromium/Firefox/WebKit responsive emulation | Horizontal scroller never reveals active or newly focused descendants | `frontend_implementer` | `src/components/Header.astro`, mobile rules in `src/styles/global.css`, focused tests | After WEB-008 to keep one frontend writer | 360×800, 390×844, 768×1024 plus desktop; active/focus visibility, unclipped ring, no document scroll, light/dark, reduced motion, logical-direction safety |
| WEB-011 | Light-theme contrast; all engines, production and local | Light muted token was selected for white but reused on the darker canvas | `design_system_curator` read-only, then `frontend_implementer` | Canonical token documentation if required and `src/styles/global.css` | After curator constraint; same frontend writer after WEB-010 | Exact contrast matrix on actual surfaces and states; light/dark visual distinction; no one-off color |
| WEB-012 | Favicon/profile image payload; static/network evidence plus all engines | Identical master rasters are delivered under multiple role URLs at 1254×1254 | `frontend_implementer` | Role-sized files in `astro-public`, `src/layouts/Layout.astro`, `src/pages/index.astro`, focused asset tests | Final implementation item | Hash/dimension/byte comparison, DPR quality, favicon themes, intrinsic sizing/CLS, cold-cache requests, no duplicate payload URLs |

Protected-boundary decisions: no Admin, original Vault, deployment, dependency, Agent, Project publication, or unrelated redesign changes are authorized. Generated Notes may change only through the sync pipeline. Round 2A reconciliation, taxonomy route, body-H1 normalization, and responsive sidepane behavior are mandatory regression guards. WEB-009 is the only authorized schema change. WEB-007 may repair additional literal `#` placeholders only where the exact same fragment-contract invariant exposes them; no other P3 work is in scope.

## Round 2B execution

Date: 2026-07-19 (Asia/Shanghai). Starting baseline was clean `main` at `2acf5619481c382b54e8504a583a574dae2c3cb2`, the committed Round 2A baseline. All eight `OPEN P2` findings were reproduced before their source changes. Production remains unchanged, so every production status below is `PENDING_DEPLOY`.

### WEB-005

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `obsidian_notes_pipeline` |
| Confirmed root cause | Explicit and body-derived description candidates did not share an Obsidian-aware plain-text/readable-math contract; embed-only, blockquote, table, and math remnants could enter cards, leads, and social metadata. |
| Files changed | `tools/sync-obsidian-notes.mjs`; `tests/publication/noteDescriptionNormalization.test.mjs`; sync-regenerated approved Notes; `src/layouts/Layout.astro` for matching Twitter description output |
| Repair | Every candidate is normalized before selection; empty embed-only candidates fall through to prose; blockquote/table remnants and supported math delimiters degrade to readable text. Body-derived math warnings are not duplicated, while explicit unsupported metadata still blocks strict mode. |
| Tests | Description fixtures cover embed-only, mixed prose/embed, callout/table summaries, math summaries, warnings, and idempotence; built Note `004` card/detail/meta/OG/Twitter checks pass. |
| Browser evidence | Chromium inspected Note `004` and the Notes index; Firefox/WebKit affected-page diagnostics found no unexpected console/page/network failure. |
| Limitations / production | No social-platform scraper was invoked. `PENDING_DEPLOY`. |

### WEB-006

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `obsidian_notes_pipeline` |
| Confirmed root cause | Callout parsing consumed cross-line whitespace, quoted/malformed fence boundaries were incomplete, and the Markdown stack had no reader-safe math degradation. |
| Files changed | `tools/sync-obsidian-notes.mjs`; `tests/publication/noteBodyNormalization.test.mjs`; affected sync-generated Notes |
| Repair | Fence/code-aware normalization handles nested callouts and implicit quoted-fence closure, protects fenced/inline code and link targets, converts the supported TeX subset to readable Unicode/plain text, and makes unknown commands strict diagnostics. |
| Tests | Nested/adjacent/quoted fences, callouts, supported/unsupported math, code immunity, strict behavior, and idempotence pass. Five representative built Notes contain none of the audited raw markers or delimiters and keep copy controls/images. |
| Browser evidence | Chromium checked long/code/image/complex Notes in light and dark; Firefox/WebKit checked the long Note under reduced motion. |
| Limitations / production | This is bounded readable degradation rather than full mathematical typesetting; unknown TeX intentionally blocks strict publication. `PENDING_DEPLOY`. |

### WEB-007

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `obsidian_notes_pipeline` |
| Confirmed root cause | Note links used a lossy independent fragment slugger, literal `#` placeholders survived, and heading normalization removed `_` inside inline-code heading text although the renderer retained it. |
| Files changed | `tools/sync-obsidian-notes.mjs`; `tests/publication/noteFragmentContract.test.mjs`; `tests/publication/noteBuiltOutput.test.mjs`; affected sync-generated Notes |
| Repair | A final GitHub-compatible heading registry resolves self/cross-Note fragments, preserves inline-code text, assigns duplicate suffixes, and emits strict diagnostics for unresolved published fragments. Six additional literal placeholders were repaired as unavoidable same-root collateral. |
| Tests | Fixture and build-wide fragment crawls pass with unique IDs. Chromium operated the binary-tree traversal link and verified target, back, forward, and encoded-hash state. |
| Browser evidence | Chromium interactive anchor/history pass; Firefox/WebKit built-route and affected Note checks agree. |
| Limitations / production | Original Vault files remain unchanged. `PENDING_DEPLOY`. |

### WEB-008

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `frontend_implementer` |
| Confirmed root cause | Raw labels were counted before both `c` and `C语言` were lossily mapped to the same route, with no declared alias identity or collision failure. |
| Files changed | `src/utils/notes.ts`; `src/components/TagList.astro`; Notes index and tag/category/path/type taxonomy pages; `tests/publication/noteTaxonomyContract.test.ts` |
| Repair | Canonical public tag `C` owns aliases `c` and `C语言`; all affected presentation/count/path surfaces aggregate by concept, and undeclared collisions fail fast. |
| Tests | Taxonomy contract covers aggregation, alias lookup, exact matching, and unexpected collision failure. Build emits one `/notes/tags/c/` route. |
| Browser evidence | Chromium, Firefox, and WebKit report `#C` with 15 cards; the Notes index pill is `C 15` and linked Note tag labels are canonical. |
| Limitations / production | No P3 empty-taxonomy behavior was changed. `PENDING_DEPLOY`. |

### WEB-009

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `obsidian_notes_pipeline` |
| Confirmed root cause | The shared layout hard-coded English and generated Notes lacked language metadata. The first inference compared Latin letters to Han characters, misclassifying Chinese technical prose with long API identifiers. |
| Files changed | `src/content.config.ts`; `tools/sync-obsidian-notes.mjs`; `src/layouts/Layout.astro`; `src/pages/notes/[slug].astro`; `tests/publication/noteLanguageMetadata.test.mjs`; all approved sync-generated Note frontmatter |
| Repair | Add constrained `en`/`zh-CN`; explicit supported values win; otherwise strip code/assets/URLs and require at least 20 Han characters exceeding Latin word/identifier segments. Layout and article receive the same language. |
| Tests | English, Chinese, identifier-heavy Chinese, explicit override, schema integration, five built Notes, and repeated sync pass. `c-data-types` and `python-stdlib` false negatives were caught in browser regression and added to final validation. |
| Browser evidence | Chromium confirms `html` and `article` language on representative English/Chinese/code-heavy Notes; Firefox/WebKit confirm C Pointers semantics. |
| Limitations / production | No physical screen-reader pronunciation session was available; DOM/accessibility language semantics are correct. `PENDING_DEPLOY`. |

### WEB-010

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `frontend_implementer` |
| Confirmed root cause | The mobile header was a non-wrapping horizontal scroller with no active/focus reveal behavior. |
| Files changed | `src/components/Header.astro`; `src/styles/global.css`; `tests/ui/headerNavigationContract.test.mjs` |
| Repair | Reveal the current route on load and focused link on `focusin` with immediate logical nearest alignment; restore document scroll if the browser attempts collateral movement; retain single-line overflow and add logical scroll padding. |
| Tests | Static contract verifies active/focus hooks, immediate logical alignment, document-scroll restoration, nowrap overflow, and scroll padding. |
| Browser evidence | Chromium 360×800, 390×844, 768×1024, 1024×768, 1366×768; Firefox 360×800/1366×768; WebKit 390×844/1440×900. Active/focused links and rings remain visible, document x/y stays fixed, RTL passes, reduced motion matches, light/dark persist, and no page overflow appears. Evidence is `BROWSER_ENGINE`; narrow sizes are also `EMULATED_DEVICE`, not physical devices. |
| Limitations / production | In-app Chromium CUA Tab traversal was unreliable, so locator-driven keyboard focus plus full Playwright Firefox/WebKit focus was used. `PENDING_DEPLOY`. |

### WEB-011

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `design_system_curator` read-only decision; `frontend_implementer` implementation |
| Confirmed root cause | Light `#737373` was selected against white but reused on the darker `#f5f5f5` canvas at 4.349:1. |
| Files changed | `src/styles/global.css`; `docs/design/UI_DESIGN.md`; `tests/ui/mutedContrastContract.test.mjs` |
| Repair | Change only light `--muted` and `--notes-muted` to `#707070` and update every normative canonical reference; dark tokens, borders, and decorative opacity exceptions remain unchanged. |
| Tests | Exact sRGB ratios pass: 4.542:1 on `#f5f5f5`, 4.744:1 on `#fafafa`, 4.952:1 on white. The canonical document contains no old value. |
| Browser evidence | Chromium computed light nav text as `rgb(112,112,112)` and dark tokens as unchanged `#8a8f98`; theme switching/persistence passes all engines. |
| Limitations / production | Decorative/redundant opacity-derived marks were intentionally not broadened into this P2. `PENDING_DEPLOY`. |

### WEB-012

| Field | Result |
| --- | --- |
| Original severity / final status | P2 Medium / `FIXED` |
| Owner | `frontend_implementer` |
| Confirmed root cause | Two 1254×1254 master rasters were copied byte-for-byte into favicon/profile roles under duplicate URLs. |
| Files changed | `astro-public/favicon.png`; `astro-public/favicon-dark.png`; new `astro-public/apple-touch-icon.png`; `astro-public/assets/profile-mark.png`; removal of `astro-public/assets/profile-mark-light.png`; `src/layouts/Layout.astro`; `src/pages/index.astro`; `tests/ui/imageAssetContract.test.mjs` |
| Repair | Deliver role-sized, byte-distinct 64×64 favicons, 180×180 touch icon, and 554×554 profile image; declare sizes/intrinsic dimensions and remove the confirmed-unreferenced duplicate. |
| Tests | PNG dimensions, byte budgets, SHA-256 distinctness, head URL uniqueness, and home intrinsic dimensions pass. Final sizes are 2,704, 2,676, 11,519, and 132,338 bytes respectively. |
| Browser evidence | Chromium decodes the 554×554 profile at the expected square rendered size with no overflow/log errors; visual inspection confirms light/dark artwork fidelity. Firefox aborted icon requests only during deliberate rapid navigation; WebKit 404 console entries came only from the two intentional stale-route assertions and are classified as non-issues. |
| Limitations / production | No physical high-DPR mobile device was available. `PENDING_DEPLOY`. |

## Round 2B combined regression

| Check | Result |
| --- | --- |
| Targeted tests | PASS — 14 publication/UI contract files, zero failures |
| Notes strict | PASS — writing mode, 34 converted, three intentional skips, zero unresolved/missing/ambiguous/slug-conflict/blocking issues, no warnings |
| Notes dry run | PASS — all 34 generated Notes unchanged; manifest unchanged; no removals or blocking diagnostics |
| Production build | PASS — Astro generated 131 static pages |
| `git diff --check` | PASS |
| Chromium local preview | PASS — responsive/focus/theme/contrast/assets/five Notes/anchors/history/logs |
| Firefox | PASS — 360×800 and 1366×768, reduced motion, light/dark, focus/RTL, P1 routes/layout, taxonomy; `BROWSER_ENGINE` |
| WebKit | PASS — 390×844 and 1440×900, same matrix; `BROWSER_ENGINE`; mobile width is `EMULATED_DEVICE` |
| Round 2A WEB-001 | PASS — stale archive/draft routes return 404; approved/taxonomy content remains |
| Round 2A WEB-002 | PASS — zero vertical overlap at 390/768 and zero horizontal overlap at 1024/1366 |
| Round 2A WEB-003 | PASS — Information Retrieval route returns 200 in all engines |
| Round 2A WEB-004 | PASS — one H1, complete Outline targets, unique fragment IDs |
| Console/network | PASS — no unexpected exception, page error, or failed first-party request; intentional 404s and navigation-aborted favicon requests documented as non-issues |
| Production | Not changed; WEB-005 through WEB-012 are `PENDING_DEPLOY` |

No P3 source finding was repaired. WEB-007's six additional placeholder anchors were unavoidable same-root collateral and remain traced to that P2 contract.

## Round 2B independent QA

Independent `qa_build_reviewer` verdict: **PASS WITH WARNINGS**.

The reviewer found no blocker, scope violation, accidental P3 expansion, undocumented P1/P2 regression, or audit-to-fix inconsistency. It independently passed all 14 publication/UI contract files, the 131-page production build, and `git diff --check`; it also confirmed that the build introduced no unexpected worktree changes and that all 34 generated Notes retain the sync marker.

Warnings are limited to environment and deployment boundaries: production remains `PENDING_DEPLOY`; Firefox/WebKit are browser-engine runs and narrow viewports are emulated rather than physical-device tests; real Safari, physical high-DPR devices, screen-reader pronunciation, and social-platform metadata scrapers were unavailable. The reviewer did not rerun write-capable Notes strict mode, relying on the recorded successful final strict run, idempotent final dry run, generated markers, targeted tests, and its independent production build.

## Round 2C planning

Baseline: clean `main` at `a35f7c4dc3fcac4dfe145fa753a4564ed4589dfb`. WEB-001 through WEB-012 remain `FIXED`; exactly five P3 findings remain `OPEN`. `project_architect` confirmed that all five originate in Astro presentation/content and require no Notes pipeline, generated Note, schema, publication-contract, dependency, workflow, Agent, Admin, or Vault change.

| Order | Issue and title | Reproduction environment | Likely root cause | Primary owner | Expected files | Required validation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | WEB-013 — Browser theme metadata stays light after switching to dark mode | All routes; Chromium, Firefox, WebKit; production and local | One hard-coded light `theme-color` tag is outside the effective-theme transition | `design_system_curator` read-only, then `frontend_implementer` | `src/layouts/Layout.astro`, `src/components/ThemeToggle.astro`, focused UI test | System/manual light and dark, invalid/no storage, reload/navigation, system change, 390×844 and desktop, three engines, focus/reduced motion, console/network |
| 2 | WEB-014 — Homepage Note CTA is labelled “View project” | Home; all engines; production and local | Heterogeneous Project/Note cards share one fixed project-specific action label | `content_ia_editor` read-only, then `frontend_implementer` | `src/pages/index.astro`, focused content test | Project cards retain `View project`; selected Note uses `Read note`; href, accessible name, focus, themes, mobile/desktop, three engines |
| 3 | WEB-015 — Production 404 page says the Astro site is still being prepared | Invalid route; all engines; production and local | Launch-era scaffold sentence remains in the custom 404 | `content_ia_editor` read-only, then `frontend_implementer` | `src/pages/404.astro`, focused content/route test | HTTP 404, durable copy, Home/Projects/Notes recovery links, keyboard, themes, mobile/desktop, three engines |
| 4 | WEB-016 — Links page exposes placeholder-only sections | `/links/`; all engines; production and local | Two headings contain only repeated future-content placeholder copy | `content_ia_editor` read-only, then `frontend_implementer` | `src/pages/links.astro`, focused content test | Placeholder sections absent; verified friend/link-exchange content, headings, external semantics, keyboard, themes, mobile/desktop, console/network remain valid |
| 5 | WEB-017 — Discoverable taxonomy pills lead to zero-result pages | Notes index and seven direct empty taxonomy routes; all engines; production and local | Primary discovery maps complete category/type/status registries without filtering computed zero counts | `frontend_implementer` | `src/pages/notes/index.astro`, focused discovery test | Every visible pill has a positive exact count; canonical `C` remains; seven direct routes still return 200 with deliberate empty states; keyboard and three-engine mobile/desktop checks |

Dependency order is retained as listed: stabilize the shared theme transition first, then apply the three content/IA corrections, then constrain taxonomy discovery without changing route generation. The exact maximum source scope is the six Astro files above plus focused tests and the two QA documents. Zero-count taxonomy routes remain generated; `/links/` remains discoverable; no new links, features, redesign, global CSS/token change, or factual claims are authorized. Notes strict/dry-run are not required unless the protected Notes pipeline or generated Notes unexpectedly change.

## Round 2C execution

Date: 2026-07-19 (Asia/Shanghai). Starting baseline was clean `main` at `a35f7c4dc3fcac4dfe145fa753a4564ed4589dfb`. All five `OPEN P3` findings were reproduced on the baseline local production preview before source edits. The deployed site is unchanged, so production confirmation for every item is `PENDING_DEPLOY`.

### WEB-013 — Browser theme metadata stays light after switching to dark mode

| Field | Result |
| --- | --- |
| Original severity / final status | P3 Low / `FIXED` |
| Reproduction result | Dark class, canvas, toggle label, and persistence changed, but `meta[name="theme-color"]` remained the light `#f7f7f4`. |
| Owner | `design_system_curator` read-only decision; `frontend_implementer` implementation |
| Confirmed root cause | The shared layout emitted one hard-coded light theme color outside the existing effective-theme initialization and transition. |
| Files changed | `src/layouts/Layout.astro`; `src/components/ThemeToggle.astro`; `tests/ui/themeMetadataContract.test.mjs` |
| Repair | Emit one early metadata element with canonical light/dark values (`#f5f5f5` / `#08090a`) and synchronize it in both the pre-paint initializer and manual `applyTheme` path. |
| Tests and browser evidence | Contract test passes. Chromium, Firefox, and WebKit confirmed system-dark initialization, manual light switching, reload/cross-route persistence, and no overflow at 390×844 and 1366×768; reduced-motion matching was preserved in engine runs. |
| Limitations / production | Physical mobile browser chrome was not available. `PENDING_DEPLOY`. |

### WEB-014 — Homepage Note CTA is labelled “View project”

| Field | Result |
| --- | --- |
| Original severity / final status | P3 Low / `FIXED` |
| Reproduction result | The selected Note linked to `/notes/ai-assisted-literature-workflow/` but its whole-card name ended with “View project.” |
| Owner | `content_ia_editor` read-only decision; `frontend_implementer` implementation |
| Confirmed root cause | Heterogeneous Project and Note cards shared one fixed project-specific action string. |
| Files changed | `src/pages/index.astro`; `tests/ui/homepageActionLabelContract.test.mjs` |
| Repair | Give selected-work entries explicit content-specific labels: Project cards retain “View project”; the Note uses “Read note.” |
| Tests and browser evidence | Contract test verifies two Project labels and one Note label. Chromium, Firefox, and WebKit showed the correct labels and unchanged destinations at 390×844 and 1366×768 in light/dark theme flows; the Note card retained a visible focus ring and keyboard Enter opened `/notes/ai-assisted-literature-workflow/` in every engine. |
| Limitations / production | None locally; `PENDING_DEPLOY`. |

### WEB-015 — Production 404 page says the Astro site is still being prepared

| Field | Result |
| --- | --- |
| Original severity / final status | P3 Low / `FIXED` |
| Reproduction result | An invalid route displayed the launch-era “site is being prepared” sentence. |
| Owner | `content_ia_editor` read-only decision; `frontend_implementer` implementation |
| Confirmed root cause | Initial scaffold copy survived after the portfolio was deployed. |
| Files changed | `src/pages/404.astro`; `tests/ui/notFoundContentContract.test.mjs` |
| Repair | Replace only the stale sentence with durable missing/moved/address guidance; preserve Home, Projects, and Notes recovery controls. |
| Tests and browser evidence | Content contract passes. Direct invalid requests returned HTTP 404 in Chromium, Firefox, and WebKit; the stale phrase was absent. Home, Projects, and Notes each retained a visible focus ring and keyboard Enter reached the expected route in every engine. |
| Limitations / production | Intentional 404 console entries in WebKit during the assertion are expected response diagnostics, not failed site assets. `PENDING_DEPLOY`. |

### WEB-016 — Links page exposes placeholder-only sections

| Field | Result |
| --- | --- |
| Original severity / final status | P3 Low / `FIXED` |
| Reproduction result | Research / Learning Communities and Tools & Resources each contained only the repeated future-content placeholder. |
| Owner | `content_ia_editor` read-only decision; `frontend_implementer` implementation |
| Confirmed root cause | Two unpopulated scaffold sections remained on the published route despite the page already having useful link-exchange content. |
| Files changed | `src/pages/links.astro`; `tests/ui/linksContentContract.test.mjs` |
| Repair | Remove only the two placeholder-only sections and align the description/lead to the remaining Friends and link-exchange content. |
| Tests and browser evidence | Content contract preserves all four useful headings and external-link semantics. Chromium, Firefox, and WebKit found zero placeholder text and zero page overflow at 390×844 and 1366×768. |
| Limitations / production | No new external links were added. `PENDING_DEPLOY`. |

### WEB-017 — Discoverable taxonomy pills lead to zero-result pages

| Field | Result |
| --- | --- |
| Original severity / final status | P3 Low / `FIXED` |
| Reproduction result | Seven prominent category/type/status pills displayed count 0 and led to deliberate but unfinished-looking empty listings. |
| Owner | `frontend_implementer` |
| Confirmed root cause | Primary discovery rendered full registries without filtering their computed published counts. |
| Files changed | `src/pages/notes/index.astro`; `tests/ui/noteTaxonomyDiscoveryContract.test.mjs` |
| Repair | Filter category, learning-path, type, and status discovery to `count > 0`; keep tag behavior and every direct taxonomy route unchanged. |
| Tests and browser evidence | Contract and taxonomy tests pass. Chromium, Firefox, and WebKit found no visible zero-count pills, retained canonical `C 15`, and confirmed all seven direct empty routes return 200 with deliberate empty messages at 390×844 and 1366×768. |
| Limitations / production | Direct empty routes intentionally remain available for stable route contracts. `PENDING_DEPLOY`. |

## Round 2C combined regression

| Check | Result |
| --- | --- |
| Targeted and prior-round tests | PASS — 19 publication/UI contract files, zero failures |
| Notes pipeline | Not run: no pipeline, generated Note, schema, or asset change occurred, so write-capable strict/dry-run validation was out of scope by the Round 2C gate. |
| Production build | PASS — Astro generated 131 static pages |
| Routes and fragments | PASS — 131 HTML files, 5,484 internal references and 621 fragments checked; zero missing route, asset, or fragment targets |
| Chromium local preview | PASS — 390×844 and 1366×768; themes/persistence, CTAs, 404, Links, discovery, responsive overflow, visible focus, keyboard activation, console/network |
| Firefox browser engine | PASS — 390×844 and 1366×768; light/dark transition, persistence, reduced motion, visible focus/keyboard activation, affected routes, empty routes, Round 2A route guards; `BROWSER_ENGINE`, narrow width also `EMULATED_DEVICE` |
| WebKit browser engine | PASS — same matrix and classifications as Firefox; link controls were explicitly focused and activated with keyboard Enter because platform-default sequential Tab policy differs |
| Console/network | PASS — no unexpected page exception or failed first-party request; WebKit 404 console responses were produced only by intentional invalid/stale-route assertions, and one Firefox icon request was navigation-aborted during rapid route checks |
| WEB-001–WEB-004 | PASS — stale route 404, Information Retrieval 200, publication/heading/fragment tests, and responsive Note-sidepane guards remain intact |
| WEB-005–WEB-012 | PASS — description/body/fragment/language/taxonomy/header/contrast/image contract suites and the 131-page build remain green |
| Protected boundaries | PASS — no Notes pipeline/generated content, publication contract, dependency, workflow, Agent, Admin, Vault, or unrelated redesign file changed |
| Production | Not changed; WEB-013 through WEB-017 are `PENDING_DEPLOY` |

## Round 2C independent QA

Independent `qa_build_reviewer` verdict: **PASS WITH WARNINGS**.

The reviewer found no blocker, material defect, ownership violation, protected-boundary change, feature/redesign expansion, or WEB-001–WEB-012 regression. It independently passed all 19 publication/UI contract files, `git diff --check`, and the 131-page production build, and confirmed issue-to-diff traceability plus audit/fix-log consistency. Warnings are limited to deployment and environment boundaries: production remains `PENDING_DEPLOY`; Firefox/WebKit and narrow widths are browser-engine/emulation evidence rather than physical-device testing. A temporary `.pnpm-store/` created by an initial incorrect reviewer command was identified as QA-generated and removed before final status; the subsequent npm production build passed.
