# S2A Progressive Native Cross-Document Transitions

## Status and boundary

- Date: 2026-07-30 (Asia/Shanghai, UTC+08:00).
- Starting HEAD: `4a4ef398a59e37f77067bff2c918effba40e0843` (`perf(ui): defer startup geometry reads`).
- Starting worktree: clean; nothing staged.
- Implementation boundary: `src/styles/global.css`, one focused UI contract, and this QA record. `Layout.astro` already exposed the required `.site-header`, `.site-main`, and `.site-footer` hooks and was not changed.
- The committed Header/Outline startup scheduling was inspected before implementation and was not modified.
- Deployment state: `PENDING_DEPLOY`.

Native cross-document View Transitions preserve the static Astro MPA, require no navigation interception, and degrade to ordinary document navigation when the browser does not create a transition. S2A explicitly rejects Astro `ClientRouter`, `astro:transitions`, `document.startViewTransition()`, Navigation API logic, click interception, and runtime transition JavaScript.

## Implementation design

- Opt-in: `@view-transition { navigation: auto; }`, nested exclusively inside `@media (prefers-reduced-motion: no-preference)`.
- Header: `.site-header` uses the unique name `site-header`. Its group and old/new snapshots have `animation: none`, so the shell does not translate, scale, resize, or enter independently; current-page state swaps without authored motion.
- Main: `.site-main` uses the unique name `site-main`. The old snapshot runs `site-main-exit` for 110 ms with opacity `1 -> 0` and `translateY(0 -> -4px)`. The new snapshot runs `site-main-enter` for 180 ms with opacity `0 -> 1` and `translateY(4px -> 0)`. Both start together, so authored visible motion ends at 180 ms.
- Easing: outgoing `cubic-bezier(0.4, 0, 1, 1)`; incoming `cubic-bezier(0, 0, 0.2, 1)`. Only opacity and transform are animated.
- Root: root group and old/new animation are disabled, suppressing the UA whole-page crossfade, zoom, and geometry interpolation. Snapshot pairs use normal isolation/blending.
- Footer: no transition name and no authored animation; it remains in normal flow and changes with the non-animated root snapshot.
- Background: named Header/main roots use the opaque site `--bg`; old/new/root snapshots use `mix-blend-mode: normal`. No persistent `will-change`, scale, horizontal motion, or layout-property animation exists.
- Reduced motion: Chrome emulation reported `view-transition-name: none` for Header/main, no `pagereveal.viewTransition`, and no transition animations. The document does not opt in at all.
- No dependency, framework, prefetch, page-specific morph, loading UI, or browser JavaScript was added. Selective Prefetch remains deferred to S2B.

## Browser and navigation evidence

Supporting-engine verification used Chrome/Headless Chrome 150.0.0.0 on Windows x64 against the production preview at `http://127.0.0.1:4332`. Temporary scripts, screenshots, and the trace were stored outside the repository.

- Two Chromium matrices observed `pageswap`/`pagereveal` cross-document transitions. The repeated matrix transitioned every required representative route, including `/notes/tree-binary-tree/`.
- Web Animations inspection during navigation exposed only `site-main-exit` (110 ms) and `site-main-enter` (180 ms). Root and Header emitted no animation; no width/height or UA transform animation remained.
- `s2-dark-navigation-trace.json` contains the cross-document resource-capture dispatch and 15 screenshot frames. Its only 50.272 ms renderer task was HTML-end processing containing 47.528 ms of browser Layout; module evaluation was 0.119 ms, with no long JavaScript task.
- Dark desktop and light 390 px transition frames show an opaque themed background, stable Header geometry, and no blank white/black frame.
- One first cold image-dense probe skipped the optional transition and completed ordinary MPA navigation; the immediate repeat and later matrices transitioned successfully. This is progressive browser fallback, not navigation failure.
- Playwright WebKit revision 2227 completed routes, fragments, history, and 1280/768/390 px layouts with zero final console errors, failed requests, or horizontal overflow. It created transitions for the small routes and completed ordinary navigation when no `pagereveal` transition was created for dense Notes.
- Local Firefox 144.0.2 could not provide trustworthy fallback evidence: both headless and headed automation stalled in the local graphics/automation environment; the headless attempt reported `RenderCompositorSWGL failed mapping default framebuffer`. The processes were closed and no Firefox support claim is made.

| Scenario | Result |
| --- | --- |
| Home -> Projects / Home -> Notes | PASS — genuine Chromium cross-document transitions |
| Notes index -> ordinary Note / image-dense Note | PASS — correct routes; native transition observed on repeated Chromium matrix |
| Note -> related Note | PASS — `tree-binary-tree` related link landed on `/notes/data-structures/` |
| Projects index -> project detail | PASS — `/projects/ai-retrieval-tool/` |
| Header navigation | PASS — native anchors; no interception or runtime router |
| Back / Forward | PASS — tree and gcd routes restored correctly |
| Direct valid Note fragment | PASS — target resolved and feedback appeared, then cleared after 2.4 seconds |
| Cross-Note valid fragment | PASS — target resolved after cross-document navigation |
| Invalid fragment | PASS — hash retained, no target, error, or failed request |
| Same-page Outline fragment | PASS — native target/history behavior; zero additional `pagereveal` events |
| Theme before and after navigation | PASS — dark state survived navigation; later toggle returned to light |
| Keyboard and skip link | PASS — first Tab reached `#main-content` with `:focus-visible`; native activation retained |
| External link | PASS — existing external target behavior retained; no click interception |
| Download link | N/A — no representative download anchor is present in the tested Note |
| Desktop / tablet / 390 px | PASS — Header/main/footer present; no horizontal overflow |
| Copy Code | PASS — seven-button contract unchanged; headless clipboard denial retained accessible `Failed` feedback and reset |

## JavaScript budget

The pre-change values are the committed Header/Outline baseline. Executable inline blocks were concatenated in built-output order and gzipped once at level 9.

| Scope | Pre-change | Post-change | Delta |
| --- | ---: | ---: | ---: |
| Emitted `.js` files | 0 | 0 | 0 |
| Emitted JavaScript gzip | 0 B | 0 B | 0 B |
| Executable inline blocks | 469 | 469 | 0 |
| Executable inline raw | 654,710 B | 654,710 B | 0 B |
| Executable inline gzip | 12,976 B | 12,976 B | 0 B |

## Lighthouse environment and results

- Lighthouse 12.8.2; Headless Chrome 150.0.0.0; Windows x64; same local machine as the committed baseline.
- Production preview: Astro static output at `http://127.0.0.1:4332`.
- Simulated mobile: 412 x 823 CSS px, DPR 1.75, Moto G Power (2022) user agent.
- Simulated throttling: 150 ms RTT, 1,638.4 Kbps throughput, 4x CPU slowdown; Performance category only.
- Each run used Lighthouse's fresh temporary profile/cache policy. Reports and trace assets are under `C:\Users\lenovo\AppData\Local\Temp\skk-s2-transitions-20260730`.
- Every report was complete and parseable. Lighthouse then emitted the previously documented Windows temporary-profile cleanup `EPERM`; this occurred after artifact creation and did not invalidate a run.

Times are milliseconds.

| Route | Run | TBT | FCP | LCP | CLS | Performance | Style & Layout | Script evaluation | Dominant Layout |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 | 0.0 | 753.5 | 1653.5 | 0 | 100 | 188.4 | 13.4 | 33.8 |
| `/` | 2 | 0.0 | 754.3 | 1654.3 | 0 | 100 | 188.8 | 13.1 | 32.6 |
| `/` | 3 | 0.0 | 753.3 | 1653.3 | 0 | 100 | 188.9 | 13.8 | 33.8 |
| `/notes/` | 1 | 0.0 | 753.8 | 762.4 | 0 | 100 | 308.2 | 12.4 | 67.4 |
| `/notes/` | 2 | 0.0 | 774.9 | 774.9 | 0 | 100 | 312.0 | 12.2 | 75.6 |
| `/notes/` | 3 | 0.0 | 754.0 | 904.0 | 0 | 100 | 256.7 | 12.3 | 54.3 |
| `/notes/tree-binary-tree/` | 1 | 0.0 | 884.1 | 904.2 | 0 | 100 | 546.3 | 21.4 | 131.0 |
| `/notes/tree-binary-tree/` | 2 | 45.5 | 755.1 | 905.1 | 0 | 100 | 483.6 | 17.7 | 106.7 |
| `/notes/tree-binary-tree/` | 3 | 42.8 | 754.4 | 904.4 | 0 | 100 | 478.8 | 19.2 | 106.5 |
| `/notes/gcd-lcm/` | 1 | 0.0 | 754.4 | 904.4 | 0 | 100 | 302.6 | 20.8 | 59.1 |
| `/notes/gcd-lcm/` | 2 | 0.0 | 755.3 | 755.3 | 0 | 100 | 301.6 | 20.8 | 66.3 |
| `/notes/gcd-lcm/` | 3 | 0.0 | 754.0 | 762.0 | 0 | 100 | 329.6 | 20.3 | 65.2 |

| Route | Median TBT (range) | Median LCP (range) | Median CLS | Median Performance | Target status |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 0.0 (0.0-0.0) | 1653.5 (1653.3-1654.3) | 0 | 100 | PASS |
| `/notes/` | 0.0 (0.0-0.0) | 774.9 (762.4-904.0) | 0 | 100 | PASS |
| `/notes/tree-binary-tree/` | 42.8 (0.0-45.5) | 904.4 (904.2-905.1) | 0 | 100 | PASS |
| `/notes/gcd-lcm/` | 0.0 (0.0-0.0) | 762.0 (755.3-904.4) | 0 | 100 | PASS |

All routes meet CLS <= 0.05, median LCP <= 2.5 seconds, and Performance >= 95. TBT did not regress materially: the three-run image-dense median is higher than the committed five-run median (42.8 ms versus 24.8 ms) but remains within the prior 0-43.8 ms phase-sensitive range, with browser Layout still dominant. The longest individual script event across these Lighthouse traces was 1.23 ms.

## Repository validation

- Focused transition contract: PASS.
- Complete repository suite: PASS, 63/63 tests.
- Production build: PASS, 131 pages.
- Static crawl: PASS, 131 HTML files, 5,640 same-origin references under the current broader `href`/`src`/`srcset` accounting, 621 fragments, zero missing route/asset/fragment targets.
- Production preview: PASS; representative Chromium and WebKit requests served without console errors or final failed first-party requests.
- `git diff --check`: PASS.
- Scope: CSS, one focused UI test, and this QA document only; no Header, Outline, Note, pipeline, schema, content, IA, dependency, workflow, Admin, or Hexo change.

## Known limitations and deferrals

- Cross-document View Transitions are progressive and browser-controlled. A browser may skip a transition under resource pressure; ordinary MPA navigation remains the fallback.
- The transition is intentionally direction-neutral and does not add forward/back variants.
- Browser-owned initial document Style & Layout remains and is not misclassified as transition JavaScript work.
- Local Firefox automation could not complete because of the documented compositor/harness failure; independent QA should repeat the unsupported-engine check when a healthy Firefox environment is available.
- Selective Prefetch is explicitly deferred to S2B. Reading IA and listing work remain outside S2A.
