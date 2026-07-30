# Note startup-layout optimization

## Run identity and boundary

- Date: 2026-07-30 (Asia/Shanghai, UTC+08:00)
- Starting HEAD: `078f202036ca71483edd687488817bfbd3b2067d`
- Starting worktree: clean; HEAD was the isolated committed S1 image-geometry baseline.
- Deployment status: `PENDING_DEPLOY`
- Changed surface: `src/components/Header.astro`, `src/components/notes/NoteOutline.astro`, focused contracts under `tests/ui/`, and this QA record.
- Protected S1 metadata, generated Notes/assets, publication/schema, fragment-highlight, code-copy, theme, CSS, IA, dependencies, workflows, Admin, and Hexo surfaces were not changed.

## Root cause and affected routes

The initial diagnosis found that elevated TBT was dominated by Chrome's full-document Style & Layout work crossing the FCP boundary, while application Script Evaluation remained approximately 15–19 ms. The synchronous Header overflow read could initiate that first layout; the synchronous Outline heading loop could also request geometry during setup, although it did not consistently create a separate Layout event after the Header had already made geometry current.

- `/notes/tree-binary-tree/`: image-dense Note with five local images.
- `/notes/gcd-lcm/`: DOM/code-dense Note with seven code blocks, three images, and zero tables in the built DOM.
- Controls: `/notes/starting-this-personal-website/` and `/notes/`.

Pre-change diagnosis traces in `C:\Users\lenovo\AppData\Local\Temp\skk-tbt-diagnosis-20260730-1655` showed the minified Header reveal stack (`t` at built HTML line 83) initiating a 224.6 ms pre-FCP Layout in image run 1 and a 177.0 ms pre-FCP Layout in dense run 2. Other phase variants placed the same browser work after FCP and therefore reported TBT. Script Evaluation stayed 14.8–19.5 ms. This established the avoidable trigger without claiming that Header or Outline was the underlying cost of browser layout.

## Implementation design

Header retains `revealNavLink()`, its overflow test, `scrollIntoView()`, and document-scroll restoration. A one-shot nested `requestAnimationFrame` defers only the current-link startup reveal until Chrome has had a paint opportunity. The `focusin` listener is installed immediately, so real keyboard focus still uses the direct reveal path. A `data-reveal-initialized` guard prevents duplicate setup.

Note Outline retains its active-heading algorithm, uncached `getBoundingClientRect()` reads, active-link reveal, and one-frame event batching. A one-shot nested `requestAnimationFrame` defers the initial update and scroll/resize/hash listener activation. A `data-scrollspy-initialized` guard prevents duplicate setup before the deferred callback. No timeout, interval, polling, idle-only scheduling, observer, framework, or recurring frame loop was introduced.

## Post-change Lighthouse environment

- Lighthouse 12.8.2; Headless Chrome 150.0.0.0; Windows x64 on the same machine as S1.
- Production preview: `http://127.0.0.1:4321`, Astro static output, port and server unchanged.
- Simulated mobile: 412 × 823 CSS px, DPR 1.75, Moto G Power (2022) user agent.
- Simulated throttling: 150 ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown; Performance category only.
- Each run used Lighthouse's fresh temporary profile/cache policy. Valid reports and traces are in `C:\Users\lenovo\AppData\Local\Temp\skk-startup-layout-patch-20260730`.
- Lighthouse wrote complete reports before a known Windows temporary-profile cleanup `EPERM` warning. Only parseable JSON reports with matching trace artifacts were accepted.

## Raw post-change measurements

Times are milliseconds. “Dominant” is the longest renderer-main-thread `Layout` trace event; phase is relative to trace FCP.

| Route | Run | TBT | FCP | LCP | CLS | Perf. | Style & Layout | Script eval. | Dominant Layout | Phase |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| tree-binary-tree | 1 | 10.4 | 794.4 | 829.8 | 0 | 100 | 468.6 | 17.8 | 106.3 | post-FCP |
| tree-binary-tree | 2 | 24.8 | 754.3 | 904.3 | 0 | 100 | 445.2 | 17.5 | 101.1 | post-FCP |
| tree-binary-tree | 3 | 30.5 | 755.0 | 905.0 | 0 | 100 | 456.1 | 19.0 | 103.6 | post-FCP |
| tree-binary-tree | 4 | 43.8 | 754.4 | 904.4 | 0 | 100 | 481.5 | 17.0 | 109.4 | pre-FCP |
| tree-binary-tree | 5 | 0.0 | 850.9 | 903.8 | 0 | 100 | 466.1 | 15.8 | 113.0 | pre-FCP |
| gcd-lcm | 1 | 0.0 | 779.3 | 779.3 | 0 | 100 | 311.4 | 19.5 | 73.7 | pre-FCP |
| gcd-lcm | 2 | 0.0 | 765.5 | 765.5 | 0 | 100 | 284.8 | 16.5 | 67.0 | pre-FCP |
| gcd-lcm | 3 | 0.0 | 767.5 | 767.5 | 0 | 100 | 288.8 | 19.6 | 67.6 | pre-FCP |
| gcd-lcm | 4 | 0.0 | 753.7 | 903.7 | 0 | 100 | 323.0 | 17.5 | 69.4 | pre-FCP |
| gcd-lcm | 5 | 0.0 | 754.4 | 758.8 | 0 | 100 | 306.7 | 18.7 | 64.2 | pre-FCP |
| short Note | 1 | 0.0 | 754.7 | 754.7 | 0 | 100 | 178.3 | 19.0 | 33.1 | post-FCP |
| short Note | 2 | 0.0 | 753.7 | 753.7 | 0 | 100 | 167.8 | 16.7 | 31.8 | pre-FCP |
| short Note | 3 | 0.0 | 753.7 | 753.7 | 0 | 100 | 174.5 | 15.6 | 40.8 | pre-FCP |
| Notes index | 1 | 0.0 | 754.5 | 755.9 | 0 | 100 | 296.5 | 11.6 | 64.9 | pre-FCP |
| Notes index | 2 | 0.0 | 754.6 | 904.6 | 0 | 100 | 263.8 | 12.0 | 56.4 | pre-FCP |
| Notes index | 3 | 0.0 | 761.3 | 904.6 | 0 | 100 | 255.4 | 12.4 | 61.7 | pre-FCP |

| Route | TBT median (range) | FCP median (range) | LCP median (range) | Performance median | Dominant Layout median (range) |
| --- | ---: | ---: | ---: | ---: | ---: |
| tree-binary-tree | 24.8 (0–43.8) | 755.0 (754.3–850.9) | 904.3 (829.8–905.0) | 100 | 106.3 (101.1–113.0) |
| gcd-lcm | 0 (0–0) | 765.5 (753.7–779.3) | 767.5 (758.8–903.7) | 100 | 67.6 (64.2–73.7) |
| short Note | 0 (0–0) | 753.7 (753.7–754.7) | 753.7 (753.7–754.7) | 100 | 33.1 (31.8–40.8) |
| Notes index | 0 (0–0) | 754.6 (754.5–761.3) | 904.6 (755.9–904.6) | 100 | 61.7 (56.4–64.9) |

All runs passed CLS = 0, LCP ≤ 2.5 seconds, and Performance ≥ 95. TBT ≤ 100 ms was observed in every post-change run but remains an aspirational observation rather than proof that browser layout disappeared.

## Trace attribution and JavaScript budget

- No post-change pre-FCP `Layout` event has a Header or Outline initiator stack.
- Dominant Layout events are browser-owned and have no JavaScript initiator stack.
- The only attributable post-change Outline layouts were 0.17 ms and 0.16 ms (`c` at built line 83), both post-FCP.
- No Header startup callback produced an attributable Layout event; no measured script event exceeded 1.0 ms, and none exceeded the 50 ms rejection threshold.
- Script Evaluation remained 11.6–19.6 ms across the four routes.
- Emitted `.js` remains 0 bytes raw/gzip. The 469-block concatenated executable inline corpus changed from 627,673 to 654,710 raw bytes and from 12,579 to 12,976 gzip bytes: +397 bytes gzip. The increase is the duplicated per-page guards/schedulers, remains framework-free, and is not a material browser-JS increase.

## Functional and repository validation

- Header: overflowing 412 px nav detected; deferred current link visible; real Tab navigation moved the offscreen Contact link into view (`scrollLeft` 63) with `:focus-visible`; the reveal path retained document-scroll snapshot/restore; desktop 1280 px nav remained non-overflowing with `scrollLeft` 0.
- Outline: initial `aria-current="location"` appeared after deferred setup; scrolling selected the expected H3; resize recalculated an active entry; hash click selected the native destination; the active link stayed visible in its pane.
- Fragment behavior: native click added one history entry; back/forward restored the empty/target hashes; bounded target feedback appeared; fragment source and its 2.4-second contract were unchanged.
- Code copy: seven buttons initialized on `gcd-lcm`; headless clipboard denial produced the existing accessible `Failed` / `Copy failed` feedback.
- Theme and accessibility: light→dark toggle, semantic navigation labels, keyboard focus visibility, and emulated reduced-motion detection remained operational.
- Idempotence: focused contracts require both dataset guards, one setup call, one bounded nested-rAF startup sequence, and the existing one-frame event coalescing. No new lifecycle listener or fan-out was added.
- Focused Header/Outline/fragment contracts: PASS.
- Complete repository suite: PASS (62 tests, zero failures).
- Production build: PASS (131 static pages).
- Static route/asset/fragment crawl: PASS (131 HTML files, 5,508 first-party references, 621 fragments, zero errors).
- Production preview: PASS for both affected routes and both controls.
- `git diff --check`: PASS.

## Remaining limitation

The patch removes avoidable application-triggered startup geometry reads; it does not eliminate Chrome's required initial Style & Layout work. Dominant browser-owned Layout remains 64.2–113.0 ms on the two dense routes and can still fall on either side of FCP under phase variance. A future rendering-cost investigation must be separately scoped and must not reinterpret the low TBT sample as disappearance of that work.
