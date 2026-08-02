# S3A Notes Reading Priority

## Status and boundary

- Date: 2026-08-01 (Asia/Shanghai, UTC+08:00).
- Branch: `refactor/s3-notes-reading-priority`.
- Base SHA: `23e9ee62ef83dc336105ebb502f766895ac0ade7`.
- Starting worktree: clean; nothing staged; no commit ahead of `origin/main`.
- Candidate scope:
  - `src/pages/notes/[slug].astro`
  - `src/styles/global.css`
  - `src/components/notes/NoteOutline.astro`
  - `tests/ui/noteReadingPriorityContract.test.mjs`
  - `docs/qa/skk-continuity-s3-reading-priority.md`
- Deployment state: `PENDING_DEPLOY`.

S3A changes Note-detail reading order and Note-scoped presentation only. It does not change generated content, publication or routing contracts, dependencies, S1 image handling, S2A transition behavior, or S2B prefetch coverage.

## Audit findings and implementation

Before S3A, the semantic order after the Note header was complete Properties, Outline/Backlinks sidepane, then article prose. At stacked widths this put approximately 984–2,434 px of supporting material before the body at 390 px and approximately 700–1,705 px at 768 px.

The new semantic order is:

1. article prose;
2. complete Properties, including Related Notes;
3. Outline and Backlinks sidepane.

Breadcrumb, title, and public summary remain before these regions. No CSS-only visual reordering substitutes for the DOM change.

Desktop uses the grid areas `"content sidepane" "properties sidepane"`. The article remains left, the sidepane remains right and sticky, Properties follows the article, and the audited columns remain 720 px / 40 px gap / 320 px. At stacked widths the areas are `"content" "properties" "sidepane"`.

## Reading measure and technical content

Direct Note prose paragraphs, ordered lists, unordered lists, and ordinary blockquotes use a left-aligned `min(100%, 70ch)` maximum inline size. Individual text blocks are not centered.

The selector excludes textual containers with verified wide descendants: `img`, `picture`, `figure`, `table`, `pre`, and the existing `.note-code-block` wrapper. Code wrappers, tables, figures, images, and their existing overflow behavior therefore retain the available Note column width. No speculative math wrapper or generated-content classification was introduced.

Measured candidate widths:

| Viewport | Ordinary text | Technical blocks | Document overflow |
| ---: | ---: | --- | --- |
| 390 px | 366 px (viewport constrained) | available Note width | none |
| 768 px | approximately 734.8 px (70ch) | available Note width | none |
| 1280 px | 720 px (column constrained) | 720 px Note column | none |

Text and technical blocks retain the existing left edge. Tables and code retain local horizontal overflow where required; responsive images retain intrinsic geometry and `max-width: 100%; height: auto`.

## Outline document-scroll preservation

The existing active-link reveal remains `scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" })` so the desktop Outline pane can reveal its active entry. Immediately around that operation, the script snapshots `window.scrollX` and `window.scrollY` and restores them only if the reveal changed the document viewport.

The existing initialization guard, nested requestAnimationFrame startup, one-frame coalescing, scroll/resize/hash listeners, activation-line selection, and fragment behavior are unchanged. No listener, timer, observer, recurring frame, synchronous pre-paint geometry read, or smooth-scroll behavior was added.

## S3A / S3B boundary

Included in S3A: semantic body-first order, preserved desktop grid, stacked article-first order, explicit long-form measure, wide technical-block exemptions, Outline document-scroll preservation, and focused contracts.

Deferred to S3B: compact essential metadata before the body, a redesigned or collapsible mobile Outline, splitting Outline from Backlinks, moving Related Notes out of Properties, disclosure widgets, client-side state, extensive extraction, and larger information-architecture changes.

## Source, build, and browser validation

- Focused S3A source and built-output contract: PASS.
- Built HTML on all five representative Notes preserves prose → Properties → sidepane DOM order.
- Production build: PASS, 131 pages.
- Production preview: PASS at `http://127.0.0.1:4360`.
- Full Node suite: PASS, 69 tests.
- Static crawl: PASS, 131 HTML files, 5,771 same-origin references, 621 fragments, zero failures.
- Application console errors: 0.
- Failed first-party requests: 0.
- `git diff --check`: PASS.

Representative routes: `/notes/tree-binary-tree/`, `/notes/gcd-lcm/`, `/notes/004/`, `/notes/c-pointers/`, and `/notes/001/`. Each was checked at approximately 390, 768, and 1280 px.

At stacked widths the article precedes Properties and the sidepane. At desktop the 720/320 two-column relationship, sticky 88 px sidepane offset, and Properties-below-article placement remain intact. Public-summary-to-first-content spacing was 23.2–35.2 px, with no intervening metadata. CLS was 0 and there was no horizontal overflow across the matrix.

No-hash 390 px loads remained at `scrollY=0` through deferred Outline initialization. Desktop scrollspy selected an active entry that remained visible within the Outline pane while the document stayed at its content position. Valid same-page fragments, invalid fragments, repeated fragment navigation, Back/Forward, and the 2.4-second feedback/cleanup contract passed. A valid cross-document fragment resolved to its target. Properties, Backlinks, Related Notes, Copy Code, skip-link focus, and keyboard focus remained available.

Light and dark preferences persisted through reload. With `prefers-reduced-motion: reduce`, Header and main transition names resolved to `none` and ordinary MPA navigation remained available. S2A named transitions and exact 110 ms / 180 ms timings were unchanged. S2B initial-load, hover, focus, exclusion, and six reused NoteCard route checks all passed; no eager prefetch or unrelated request appeared.

## Payload and performance

| Payload | S2B baseline | S3A candidate | Delta |
| --- | ---: | ---: | ---: |
| External JavaScript | 2,274 B raw / 1,022 B gzip | 2,274 B raw / 1,022 B gzip | 0 B |
| Inline executable corpus | 654,710 B raw / 12,976 B gzip | 661,702 B raw / 13,187 B gzip | +6,992 B raw / +211 B gzip |
| Inline blocks | 469 | 469 | 0 |
| Speculation rules | 0 B | 0 B | 0 B |

The inline increase is the repeated static Note Outline scroll-preservation helper. It remains below the 0.5 KiB gzip budget. No dependency, client component, external script, listener, timer, observer, or custom runtime was added.

Lighthouse environment: Lighthouse 12.8.2, Chrome 150 on Windows x64, simulated mobile, 150 ms RTT, 1,638.4 Kbps throughput, and 4x CPU slowdown. Reports and traces were stored outside the repository.

| Route | Run | Performance | CLS | LCP | TBT |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 / 2 / 3 | 100 / 100 / 100 | 0 / 0 / 0 | 1.805 / 1.805 / 1.804 s | 0 / 0 / 0 ms |
| `/notes/` | 1 / 2 / 3 | 100 / 100 / 100 | 0 / 0 / 0 | 0.906 / 0.904 / 0.904 s | 0 / 0 / 0 ms |
| `/notes/c-pointers/` | 1 / 2 / 3 | 97 / 98 / 97 | 0 / 0 / 0 | 1.174 / 1.179 / 1.183 s | 187.2 / 173.5 / 185.3 ms |

| Route | Median Performance | Median CLS | Median LCP | Median TBT | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 100 | 0 | 1.805 s | 0 ms | PASS |
| `/notes/` | 100 | 0 | 0.904 s | 0 ms | PASS |
| `/notes/c-pointers/` | 97 | 0 | 1.179 s | 185.3 ms | PASS with existing layout limitation |

### Paired `c-pointers` baseline comparison

Independent QA compared the deployed S2B baseline and the S3A candidate under equivalent local conditions: the same Node dependencies and production-build settings, Lighthouse 12.8.2, Chrome 150, Windows x64 machine, simulated-mobile viewport and throttling, and five runs per side. The detached baseline used commit `23e9ee62ef83dc336105ebb502f766895ac0ade7`; the candidate retained the five-file S3A working-tree diff.

| Run | S2B baseline TBT | S3A candidate TBT |
| ---: | ---: | ---: |
| 1 | 211.0 ms | 181.4 ms |
| 2 | 186.9 ms | 0 ms |
| 3 | 179.9 ms | 207.4 ms |
| 4 | 160.9 ms | 0 ms |
| 5 | 0 ms | 169.9 ms |
| **Median** | **179.9 ms** | **169.9 ms** |

The candidate median is 10.1 ms lower than the baseline median, a delta of `-10.1 ms`. Performance remained 98 → 98, CLS remained 0 → 0, and median LCP changed from 1.176 s to 1.195 s. Median Style & Layout cost increased by approximately 4.0 ms, while the longest individual Layout task decreased by approximately 7.8 ms. No new S3A-attributable long JavaScript task or user-visible responsiveness regression was observed.

The predefined material-regression thresholds are either a median TBT increase greater than 50 ms, or an increase greater than 20% when the absolute increase is at least 20 ms. The candidate meets neither condition. Performance remains above 95, CLS remains 0, and LCP remains well below 2.5 seconds.

This result is classified as a **non-blocking, baseline-equivalent, phase-sensitive TBT warning**. Elevated TBT is dominated by browser Style/Layout variability already present in the baseline. The comparison supports only a no-material-regression conclusion: it does not show TBT below 100 ms and does not justify claiming that S3A improves performance.

Two audits reported the known Windows temporary-profile cleanup `EPERM` only after complete reports and traces had been written.

## Known limitations

- Browser-owned initial Style & Layout on dense Notes remains phase-sensitive around FCP; S3A does not attempt rendering redesign or content virtualization.
- Chromium may skip a native cross-document transition; observed browser-owned `AbortError: Transition was skipped` events had no repository stack, console error, failed request, or navigation failure.
- S3B remains necessary for compact metadata and a redesigned mobile Outline experience.
- This candidate has not been committed, pushed, reviewed independently, or deployed.
