# S1 Continuity First baseline

## Run identity

- Date: 2026-07-30 (Asia/Shanghai, UTC+08:00)
- Starting HEAD: `bc5b8a4f1aa0e87e48b940bb06f055d527e50046`
- Starting worktree: clean; all changes listed below were created for S1 and no pre-existing changes were altered.
- Deployment status: `PENDING_DEPLOY`

## Implementation boundary

S1 is build-only. A repository-owned Node helper reads intrinsic image metadata from
`astro-public/notes-assets/`, caches results by normalized absolute path, and enforces both
lexical and resolved-path containment. The existing Vite fallback emits an explicit sentinel
object and patches only Astro's generated-content fallback path. Absolute `/notes-assets/`
HTML is annotated during Astro's `astro:build:done` hook because Astro 7's default Sätteri
processor does not run remark/rehype plugins without adding `@astrojs/markdown-remark`.
No dependency or browser JavaScript was added.

The existing `.note-prose img` rules remain unchanged and continue to provide `max-width:
100%`, `height: auto`, mobile containment, and the static neutral pre-decode background.

## Formats and failure behavior

- Supported: PNG; baseline and progressive JPEG/JPG; WebP VP8, VP8L, and VP8X; GIF87a/GIF89a;
  SVG numeric or `px` width/height, `viewBox` fallback, and one-dimension-plus-`viewBox` ratio.
- JPEG EXIF orientation values 5–8 swap the stored axes to browser-visible geometry.
- Inventory at start: 23 PNG files; no JPEG/JPG, WebP, GIF, SVG, AVIF, or BMP files.
- AVIF and BMP are explicitly rejected with conversion guidance. Unknown extensions, corrupt or
  truncated headers, invalid/zero dimensions, unusable SVG geometry, missing files, traversal,
  and symlink escapes fail the build with both the public Note URL and resolved filesystem path.
- Source images are not optimized, renamed, resized, recompressed, or regenerated.

## Representative routes

| Route | Role |
| --- | --- |
| `/` | Homepage and static-MPA identity entrance |
| `/notes/` | Notes index and listing shell |
| `/notes/starting-this-personal-website/` | Ordinary short Note |
| `/notes/tree-binary-tree/` | Image-dense Note (five local images) |
| `/notes/gcd-lcm/` | Formula, code, and table-dense Note |

## Structural measurements

| Measurement | Before | After | Status |
| --- | ---: | ---: | --- |
| Rendered local `/notes-assets/` images | 23 | 23 | unchanged |
| Local Note images without positive `width` and `height` | 23 | 0 | PASS |
| Emitted `.js` asset raw total | 0 bytes | 0 bytes | PASS |
| Emitted `.js` asset gzip total | 0 bytes | 0 bytes | PASS (delta 0 bytes) |
| Executable inline-script corpus raw total | 627,673 bytes | 627,673 bytes | PASS |
| Executable inline-script corpus gzip total | 12,579 bytes | 12,579 bytes | PASS (delta 0 bytes) |

The original baseline inventory counted emitted `.js` files, of which there are none. Independent
QA also inventoried executable inline `<script>` payloads: 469 blocks across 131 built pages,
concatenated in output order and compressed once with gzip level 9. Those payloads are pre-existing
and byte-unchanged because S1 adds only image attributes at build time and modifies no browser-script
source or output. Both measurement scopes therefore have a 0-byte pre/post delta.

## Lighthouse environment

- Browser/Lighthouse version: Headless Chrome 150.0.0.0; Lighthouse 12.8.2 invoked from a pinned
  temporary `npx` cache outside the repository.
- Browser executable: `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Machine: Windows x64 10.0.26200; Intel Core Ultra 9 275HX; 32 GB installed memory.
- Preview: `npm run preview -- --host 127.0.0.1 --port 4321` at `http://127.0.0.1:4321`.
- Viewport/device emulation: simulated mobile, 412 × 823 CSS pixels, device scale factor 1.75;
  emulated Moto G Power (2022) user agent.
- Throttling: Lighthouse simulated throttling, 150 ms RTT, 1,638.4 Kbps throughput, and 4× CPU
  slowdown. Only the Performance category was audited.
- Run conditions and limitations: routes were run sequentially on the same machine and preview.
  JSON reports are in `C:\Users\lenovo\AppData\Local\Temp\skk-lighthouse-TxZqOp`. Lighthouse
  intermittently reported a Windows temporary-profile cleanup warning after a complete report was
  written; only valid JSON reports were included. Local preview and simulation are repeatable
  laboratory measurements, not field Core Web Vitals.

## Lighthouse runs and medians

| Route | Run | CLS | LCP (s) | TBT (ms) | Performance |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 | 0.000 | 1.655 | 83.7 | 99 |
| `/` | 2 | 0.000 | 1.653 | 69.3 | 99 |
| `/` | 3 | 0.000 | 1.504 | 96.9 | 99 |
| `/` | median | **0.000** | **1.653** | **83.7** | **99** |
| `/notes/` | 1 | 0.000 | 0.801 | 39.9 | 100 |
| `/notes/` | 2 | 0.000 | 0.904 | 0.0 | 100 |
| `/notes/` | 3 | 0.000 | 0.803 | 42.8 | 100 |
| `/notes/` | median | **0.000** | **0.803** | **39.9** | **100** |
| `/notes/starting-this-personal-website/` | 1 | 0.000 | 0.849 | 0.0 | 100 |
| `/notes/starting-this-personal-website/` | 2 | 0.000 | 0.801 | 42.3 | 100 |
| `/notes/starting-this-personal-website/` | 3 | 0.000 | 0.870 | 0.0 | 100 |
| `/notes/starting-this-personal-website/` | median | **0.000** | **0.849** | **0.0** | **100** |
| `/notes/tree-binary-tree/` | 1 | 0.000 | 0.985 | 257.1 | 95 |
| `/notes/tree-binary-tree/` | 2 | 0.000 | 0.910 | 258.4 | 95 |
| `/notes/tree-binary-tree/` | 3 | 0.000 | 0.910 | 258.6 | 95 |
| `/notes/tree-binary-tree/` | median | **0.000** | **0.910** | **258.4** | **95** |
| `/notes/gcd-lcm/` | 1 | 0.000 | 0.868 | 174.9 | 98 |
| `/notes/gcd-lcm/` | 2 | 0.000 | 0.873 | 182.7 | 97 |
| `/notes/gcd-lcm/` | 3 | 0.000 | 0.987 | 0.0 | 100 |
| `/notes/gcd-lcm/` | median | **0.000** | **0.873** | **174.9** | **98** |

## Target status

| Target | Threshold | Status |
| --- | ---: | --- |
| CLS | ≤ 0.05 | PASS — all route medians 0.000 |
| LCP | ≤ 2.5 s | PASS — slowest route median 1.653 s |
| TBT | ≤ 100 ms | FAIL — image-dense Note 258.4 ms; formula/code/table-dense Note 174.9 ms |
| Lighthouse Performance | ≥ 95 | PASS — lowest route median 95 |
| Browser-JS increase | ≤ 5 KiB gzip | PASS (0-byte delta for emitted and inline scopes) |
| Unsized local Note images | 0 | PASS |

The TBT failures are existing page-runtime work rather than browser-JavaScript growth from this
build-only change: emitted JavaScript remains 0 bytes and inline payloads are byte-unchanged. The
image-dense Note failed consistently at 257.1–258.6 ms, and the dense Note varied from 0.0–182.7 ms.
Likely owner:
`frontend_implementer`, after a focused performance diagnosis of existing inline Note interaction
work. The bounded follow-up is a separate task; it must not introduce S2 transitions/prefetch or
broaden S1 into unrelated redesign.

## Validation record

| Check | Result |
| --- | --- |
| Focused metadata/failure/fallback tests | PASS — 7 tests |
| Production build | PASS — 131 static pages |
| Built-output Note image geometry scan | PASS — 23/23 sized, 0 unsized |
| Existing publication and UI contract tests | PASS — full 61-test repository suite |
| Static route/asset/fragment crawl | PASS — 131 HTML files, 5,508 references, 621 fragments, 0 errors |
| Local production preview | PASS — representative routes served from `127.0.0.1:4321` |
| Lighthouse (five routes × three runs) | COMPLETE — CLS/LCP/Performance pass; TBT has two route failures |
| `git diff --check` and final scope review | PASS — five authorized files only; no CSS/dependency/schema/generated-body change |

## Deferred work

S2 page transitions/prefetch, S3 reading information architecture, and S4 listing changes are
explicitly deferred. No commit, push, pull request, deployment, schema change, UI change, or
generated Note body change is part of this baseline.
