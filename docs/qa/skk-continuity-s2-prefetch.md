# S2B Selective Intent-Based Prefetch

## Status and boundary

- Date: 2026-07-31 (Asia/Shanghai, UTC+08:00).
- Base SHA: `8fc5491e2cd0de3e50c225ba4d47f6329c560705`.
- Branch: `perf/s2-selective-prefetch`.
- Starting worktree: clean; nothing staged.
- Deployment state: `PENDING_DEPLOY`.
- Production/configuration scope:
  - `astro.config.mjs`
  - `src/components/Header.astro`
  - `src/components/NoteCard.astro`
  - `src/components/NoteList.astro`
  - `src/components/notes/NoteProperties.astro`
  - `src/pages/index.astro`
  - `src/pages/notes/index.astro`
- Validation scope:
  - `tests/ui/selectivePrefetchContract.test.mjs`
  - `docs/qa/skk-continuity-s2-prefetch.md`

S2B adds navigation warming only after deliberate pointer hover or keyboard focus. It uses Astro's built-in prefetch client, keeps the static MPA, and does not add a router, click interception, navigation state, dependency, or repository-owned prefetch runtime.

## Configuration contract

`astro.config.mjs` enables:

```js
prefetch: {
  prefetchAll: false,
  defaultStrategy: 'hover',
}
```

`prefetchAll` remains explicitly false so unmarked links do not consume bandwidth. The hover strategy was selected because Astro applies it to both a sustained pointer hover and `focusin`, preserving keyboard parity without custom listeners. No viewport, load, or tap strategy is authored.

ClientRouter, `astro:transitions`, `@astrojs/prefetch`, custom `fetch()`, custom `<link rel="prefetch">` injection, IntersectionObserver prefetch, service workers, timers, route state, and navigation interception were rejected. The emitted prefetch client is exclusively Astro's built-in implementation.

## Approved and excluded links

| Surface | Source owner | Contract |
| --- | --- | --- |
| Header brand and primary navigation | `Header.astro` | Explicit `data-astro-prefetch="hover"` |
| Home Selected Work | `pages/index.astro` | One attribute on each destination card anchor |
| Notes primary entries | `NoteCard.astro`, `NoteList.astro`, `pages/notes/index.astro` | Notes-index archive cards, recent entries, and collection/module index-note entries only |
| Related Notes | `notes/NoteProperties.astro` | Related-note destinations only; prerequisites remain unmarked |

The skip link, same-page Outline links, all fragment-bearing links, external and social links, taxonomy/filter links, collections browse links, metadata links, assets, theme controls, and non-navigation controls remain unmarked. The current site has no rendered download anchor; source and built-output contracts prohibit prefetch on any future anchor carrying `download`.

### NoteCard reuse boundary

`NoteCard` accepts an optional `prefetch` boolean that defaults to `false`; `NoteList` preserves the same safe default and only passes the value through. The Notes index archive is the sole `NoteList` call site that opts in with `prefetch={true}`. The type, tag, status, category, path, and collection/module result routes reuse `NoteList` without opting in, so their Note cards remain unannotated. Collection/module index-note callouts are separate anchors and also remain unannotated.

## Source and rendered contract

- Focused selective-prefetch contract: PASS.
- Astro configuration is explicit and selective.
- The four direct approved source owners contain exactly six literal annotated anchor templates; the conditional NoteCard anchor is emitted only through the Notes-index opt-in.
- No other source file contains `data-astro-prefetch`.
- Built Home, Notes, and representative Related Notes HTML contain the shared Astro prefetch module and the expected marked anchors.
- Built skip, fragment, external, taxonomy/filter anchors, and Note cards on every filter/result route remain unmarked.
- Existing S2A CSS timings and transition names remain unchanged.

## Runtime network evidence

Environment: Astro production preview at `http://127.0.0.1:4350`, Chrome 150, 1280 x 900, browser cache disabled per isolated page. Request evidence was stored outside the repository.

### Initial load

| Route | Eager internal page requests after network idle |
| --- | ---: |
| `/` | 0 |
| `/notes/` | 0 |
| `/notes/starting-this-personal-website/` | 0 |

No broad internal HTML burst, external prefetch, console error, failed first-party request, or HTTP error occurred.

### Mouse hover

| Surface | Prefetched destination | Before navigation | Unrelated destinations |
| --- | --- | --- | ---: |
| Header | `/notes/` | GET observed | 0 |
| Home Selected Work | `/projects/ai-retrieval-tool/` | GET observed | 0 |
| Notes primary entry | `/notes/001/` | GET observed | 0 |
| Related Notes | `/notes/ai-assisted-literature-workflow/` | GET observed | 0 |

Each request was same-origin, initiated by the shared Astro client, and completed before ordinary anchor navigation. No repository-owned prefetch code exists.

### Keyboard focus

- First Tab focused the skip link with `:focus-visible`; it produced no prefetch request.
- Continued Tab navigation focused `/about/` with `:focus-visible`.
- Focus produced exactly one same-origin prefetch request for `/about/`.
- Enter performed ordinary MPA navigation.

### Excluded links

| Link class | Prefetch requests |
| --- | ---: |
| Skip link | 0 |
| Same-page Outline fragment | 0 |
| Injected invalid fragment | 0 |
| External GitHub link | 0 |
| Notes tag/filter link | 0 |
| Download link | N/A — no rendered download anchor |

Runtime health: zero console errors, zero failed requests, and zero first-party responses at or above 400.

## S2A preservation

- `tests/ui/viewTransitionContract.test.mjs`: PASS.
- No S2A source, CSS, test, or QA file changed.
- Header snapshot geometry remained `x=100`, `y=0`, `width=1080`, `height=95` before and after successful transition probes.
- Successful hover-prefetched navigations retained `site-main-exit` at 110 ms and `site-main-enter` at 180 ms with only opacity and `translateY(±4px)`.
- Header remained `site-header`, main remained `site-main`, and Footer remained unnamed.
- Chromium still exercised its documented progressive right to skip some cross-document transitions. Across repeated matrices, successful transitions retained the exact S2A contract; skipped samples navigated correctly and emitted browser-owned `AbortError: Transition was skipped` page errors. Application console errors remained zero.

## JavaScript and payload budget

Executable inline blocks were concatenated in built-output order and gzipped once at level 9.

| Scope | S2A baseline | S2B candidate | Delta |
| --- | ---: | ---: | ---: |
| Emitted JavaScript files | 0 | 1 | +1 |
| Emitted JavaScript raw | 0 B | 2,274 B | +2,274 B |
| Emitted JavaScript gzip | 0 B | 1,022 B | +1,022 B |
| Executable inline blocks | 469 | 469 | 0 |
| Executable inline raw | 654,710 B | 654,710 B | 0 B |
| Executable inline gzip | 12,976 B | 12,976 B | 0 B |
| Static speculation-rules payload | 0 B | 0 B | 0 B |

The single shared `/_astro/page.*.js` asset is Astro's built-in prefetch client. The 1,022 B gzip increase is below the 5 KiB budget. No framework, router, custom runtime, dependency, or lockfile growth occurred.

## Lighthouse

Environment: Lighthouse 12.8.2, Headless Chrome 150, Windows x64, simulated mobile, 150 ms RTT, 1,638.4 Kbps throughput, and 4x CPU slowdown. Reports and traces are outside the repository. Lighthouse wrote valid artifacts before the known Windows temporary-profile cleanup `EPERM`.

| Route | Run | Performance | CLS | LCP | TBT | Script evaluation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 | 100 | 0 | 1.805 s | 0 ms | 14.1 ms |
| `/` | 2 | 100 | 0 | 1.805 s | 0 ms | 12.6 ms |
| `/` | 3 | 100 | 0 | 1.807 s | 0 ms | 12.9 ms |
| `/notes/` | 1 | 100 | 0 | 0.906 s | 0 ms | 14.1 ms |
| `/notes/` | 2 | 100 | 0 | 0.905 s | 0 ms | 14.2 ms |
| `/notes/` | 3 | 100 | 0 | 0.906 s | 0 ms | 14.4 ms |
| `/notes/tree-binary-tree/` | 1 | 100 | 0 | 0.904 s | 0 ms | 22.8 ms |
| `/notes/tree-binary-tree/` | 2 | 100 | 0 | 0.904 s | 0 ms | 21.6 ms |
| `/notes/tree-binary-tree/` | 3 | 100 | 0 | 0.905 s | 0 ms | 16.8 ms |

| Route | Median Performance | Median CLS | Median LCP | Median TBT | Target |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 100 | 0 | 1.805 s | 0 ms | PASS |
| `/notes/` | 100 | 0 | 0.906 s | 0 ms | PASS |
| `/notes/tree-binary-tree/` | 100 | 0 | 0.904 s | 0 ms | PASS |

The new client is small, produces no initial route prefetch, and did not introduce TBT or a new application long task.

## Repository validation

- Focused Selective Prefetch contract: PASS.
- Existing View Transition contract: PASS.
- Complete Node suite: PASS, 65 tests.
- Production build: PASS, 131 pages.
- Static crawl: PASS, 131 HTML files, 5,771 same-origin references, 621 fragments, zero failures.
- The 131-reference increase is one shared Astro prefetch module reference per built page.
- Production preview: PASS.
- Network prefetch and exclusion matrices: PASS.
- Console errors: 0.
- Failed first-party requests: 0.
- `git diff --check`: PASS.

## Known limitations

- Prefetch is browser- and connection-policy-controlled; the built-in Astro client may decline prefetch on constrained connections.
- Cross-document View Transitions remain progressive and browser-controlled. A skipped animation still uses ordinary MPA navigation.
- Chromium reports a browser-owned page error when it skips a cross-document transition; no application console error or navigation failure was observed.
- Lighthouse retains the documented Windows temporary-profile cleanup warning after valid artifacts are written.
- S2B is not deployed in this implementation run.
