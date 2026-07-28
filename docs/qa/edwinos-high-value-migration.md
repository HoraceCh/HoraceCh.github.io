# EdwinOS high-value fragment-feedback migration

Date: 2026-07-28 (Asia/Shanghai)
Repository: `F:\Projects\Horace_Website`
Scope: temporary, accessible fragment-target feedback on published Note pages

## Baseline

- Starting branch: `main`
- Starting HEAD: `fca5b148c5df57946eabd234e7d41b6cd477d3d9`
- Upstream baseline: `origin/main` at `14b8552d1c584061ff625c95193320031a64fff1`
- Starting relation: local `main` ahead 1, behind 0
- Starting worktree: clean
- Existing contract: Note prose is contained by `[data-note-prose]`; rendered headings have unique final IDs; Outline and backlink links use native fragment URLs; Notes already provide reduced-motion styling.

## Reference behavior

The supplied EdwinOS `block-links.js` and CSS demonstrate a useful reader cue: resolve a URL fragment, promote it to the meaningful surrounding prose block, briefly decorate that block, and remove the decoration after a bounded interval. The migration retains that high-value identification feedback while adapting it to Horace Notes and the site's restrained, achromatic design language.

## Planned implementation

- Resolve the current hash with `getElementById`, followed by a safely escaped `[name]` fallback.
- Accept targets only inside `[data-note-prose]`, promoting nested targets to the nearest meaningful `h2`–`h6`, `p`, `li`, `tr`, `dt`, `dd`, `blockquote`, or `pre` block.
- Keep at most one decorated block, restart its bounded 2.4-second feedback on repeated activation, and dispose listeners, frames, and timers idempotently across Astro lifecycle events.
- Cover initial load, `hashchange`, browser history, `astro:page-load`, and same-page anchor clicks including repeated clicks on the current hash without intercepting native navigation.
- Use a bounded animation-frame retry for native fragment timing and scroll only when the promoted block remains outside the viewport; use `inline: 'nearest'` and reduced-motion `behavior: 'auto'`.
- Add a 3px leading rail and achromatic inset wash derived from `--notes-interactive`; decorate table-row cells without layout-affecting properties; retain a static cue for reduced motion and a visible forced-colors outline.
- Add focused contract tests for runtime containment/lifecycle/native-semantics behavior and the corresponding CSS/page integration.

## Planned affected files

- `docs/qa/edwinos-high-value-migration.md`
- `src/scripts/noteFragmentHighlight.ts` (new)
- `src/pages/notes/[slug].astro`
- `src/styles/global.css`
- Focused new tests under `tests/ui/`

## Migrated behavior

- Note fragments resolve through the final DOM ID with a safely escaped named-anchor fallback, then remain contained by `[data-note-prose]` and promote only to the approved meaningful prose blocks.
- Initial fragment loads, native same-page anchor activation, repeated current-hash activation, `hashchange`, browser history, and `astro:page-load` share one bounded feedback path without rewriting the URL, history, IDs, or rendered HTML.
- One active target receives a 2.4-second achromatic inset wash and 3px leading rail. Table rows decorate their cells; cleanup, animation frames, timers, and session listeners are bounded and disposable.
- Conditional scrolling uses nearest alignment only when the promoted block is outside the viewport. Reduced motion retains a static, time-bounded cue with animation and transition disabled; forced-colors mode uses a visible system-color outline.

## Files changed

- `docs/qa/edwinos-high-value-migration.md`
- `src/scripts/noteFragmentHighlight.ts`
- `src/pages/notes/[slug].astro`
- `src/styles/global.css`
- `tests/ui/noteFragmentHighlightContract.test.mjs`

## Rejected reference features

- No `preventDefault`, `pushState`, `replaceState`, `location.hash` assignment, or other history/anchor rewrite.
- No `innerHTML` mutation, generated ID rewrite, fragment registry, or Markdown/runtime parsing.
- No amber, blue, glow, gradient, or other chromatic treatment.
- No five-second duration or unbounded animation/listener lifetime.
- No global fragment styling outside Note prose.
- No dependency, framework, component-system, pipeline, content, schema, deployment, Agent, Admin, or Vault change.

## Validation

Status: **PASS WITH WARNINGS**

Planned checks:

- Focused fragment-feedback UI contract tests.
- Existing Note fragment/publication and relevant UI contract tests.
- Production Astro build.
- `git diff --check` and scope/status review.
- Rendered browser checks where available: valid/invalid fragments, initial load, Outline and prose/backlink links, same-hash repeat, back/forward, `hashchange`, Astro page load, light/dark, widths at or below 640px, reduced motion, focus/semantics, and console/network health.

Actual results:

- PASS — independent gate ran 20 publication/UI test files with zero failures, including the focused fragment-feedback contract and current WEB-001–WEB-017 regression contracts.
- PASS — production Astro build generated 131 static pages; the built-output contract also passed independently.
- PASS — static crawl checked 131 HTML files, 5,484 internal references, and 621 fragments with zero missing-route, asset, or fragment errors.
- PASS — local production preview returned HTTP 200 for all 130 routable pages, HTTP 404 for the deliberate missing-route probe, and HTTP 200 for the representative Note request. Valid fragment resolution was verified by the static crawl across 621 fragments; URL hashes are client-side and are not sent in HTTP requests, so the preview request is not fragment-validation evidence.
- PASS — source contracts verify prose containment, safe fragment resolution, meaningful-block promotion, native history/anchor preservation, bounded lifecycle cleanup, same-hash scheduling, conditional nearest scrolling, reduced-motion static feedback with animation/transition disabled, and forced-colors outline fallback.
- PASS — post-fix Chromium and WebKit harnesses each passed eight fragment-feedback cases at 390×844, 768×1024, and 1366×768 in light and dark themes against the rebuilt 131-page production preview.
- PASS — both verified engines covered the initial encoded deep link, Outline keyboard Enter activation, repeated same-hash restart and bounded cleanup, browser back/forward, immediate invalid-hash cleanup, every approved meaningful target promotion including table-cell decoration, a cross-Note fragment link, and conditional smooth scrolling with `inline: 'nearest'`.
- PASS — both verified engines covered reduced-motion automatic positioning and the static time-bounded cue. The Playwright harness observed zero page errors, console errors, or failed first-party requests across the matrix.
- PASS — official Firefox 153, extracted from Mozilla's full release into Windows Temp and driven directly through WebDriver BiDi, passed seven normal-motion cases across 390×844, 768×1024, and 1366×768 in light and dark themes. Coverage included the initial encoded deep link; real keyboard Enter on the Outline with a visible `:focus-visible` outline; repeated same-hash restart and cleanup; back/forward; immediate invalid-hash cleanup; all `h2`–`h6`, `p`, `li`, `tr`, `dt`, `dd`, `blockquote`, and `pre` promotions including table-cell animation; visible-target no-scroll; offscreen smooth nearest scrolling with unchanged horizontal scroll; a cross-Note fragment; and keyboard focus plus `Copied`/`aria-label` feedback for Copy Code.
- PASS — a separate Firefox temporary profile with `ui.prefersReducedMotion=1` confirmed `matchMedia` reduction, automatic positioning with `inline: 'nearest'`, animation disabled, a visible static cue, bounded cleanup, and zero errors. Across both Firefox harnesses there were zero console errors, failed first-party requests, or HTTP errors.
- PASS — `git diff --check` and independent scope review found no source defect or protected-boundary change.
- PASS — WEB-001–WEB-017 remain green through their current contracts, the 131-page build, static crawl, and preview checks.
- PENDING_DEPLOY — production was not changed or revalidated by deployment.

## Independent QA limitations

- Firefox is verified. The earlier Playwright 1.61.1 first-page failure and geckodriver startup hang were bypassed with official Firefox 153 and direct WebDriver BiDi; they are no longer a remaining browser-validation gap and were never Horace application failures.
- Forced-colors behavior passed source-contract review but was not separately claimed as a live forced-colors browser observation. Narrow viewports are browser emulation rather than physical-device evidence.
- Production remains `PENDING_DEPLOY`; no commit, push, deployment, physical-device run, or screen-reader session was performed.
- Browser binaries, the extracted official Firefox release, profiles, and temporary clients remained outside the repository; no dependency or configuration change was made.

## Browser follow-up correction

- Direct Chromium mobile/light validation found that changing from a valid highlighted fragment to a missing fragment left the prior `.is-note-fragment-target` cue active until its original timeout. Resolution retries previously cleared feedback only after finding a valid target.
- The scheduler now clears the active class, activation frame, and cleanup timer before every resolution attempt, so invalid or missing fragments fail silently without stale feedback while retaining bounded retries and repeated valid activation.
- The focused contract structurally verifies cleanup occurs before the scheduler's first animation frame and that the bounded missing-target retry remains present. Post-fix Chromium, WebKit, and official Firefox 153 directly confirmed immediate invalid-hash cleanup in their respective matrices.
