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
