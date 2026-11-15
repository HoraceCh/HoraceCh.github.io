# Refined Header identity: usage handoff

HC-234 ingests six approved original SVGs under astro-public/brand/horace-refined/. Public paths are /brand/horace-refined/<filename>. Header consumes them later in HC-235; no current Header or Hero markup changes here.

| Surface | Mark / optional wordmark | Original fills |
| --- | --- | --- |
| Light / cool light Header | *-light.svg | #171A18 and #47765A |
| Dark / dark green-grey Header | *-dark.svg | #F1F3F0 and #9FC8AD |
| Light single-color / print-like surface | *-monochrome.svg | #171A18 only |

The supplied monochrome SVG is fixed graphite, not currentColor: do not place it unmodified on a dark surface. Use the approved dark variant there. Do not recolor source bytes or add runtime filters as a substitute for a missing variant.

Marks have viewBox0 0 160 160. Tested image boxes16/24/32 CSS px preserve1:1; the visible outlined H occupies part of that canvas. Prefer24–32px for Header usage;16px is a compact minimum sample, not a favicon rollout. Keep a separate >=44px link target even when artwork is smaller. No clipping or asymmetric CSS crop; preserve the green dot and intrinsic padding.

Wordmarks have viewBox0 0 686.59 109.86 (ratio6.2497). Documented preview widths160/240/320 CSS px, corresponding heights25.60/38.40/51.20px. Use width plus height:auto or explicit matching dimensions. They are optional secondary identity assets and never replace the semantic Hero H1. Do not squeeze a wordmark into a square mark slot.

Later Header: native href=/ with accessible name equivalent to "Horace Chan — Home"; redundant inner img alt="" and aria-hidden="true". The original SVG has title/role/aria-label for standalone viewing, but an externally embedded decorative img should not produce duplicate names. If used without a named enclosing link, supply meaningful img alternative text. No production integration is claimed by this standalone specimen.

Transparency is intrinsic (no full-canvas backdrop). Light/dark/checker and representative material-color samples are in the isolated QA specimen, not a final Header contrast certification. Composited Header focus/link contrast over actual imagery remains HC-235. Use the normal explicit both-theme variant selection; reuse existing theme persistence rather than introducing a new theme engine.

Provenance: original ZIP5e7e7af5fc4e0d4f2ae4ce9d56da0c89ed5ffc6d0844df7dda2034e13a5954f9; source README declares Inter Display ExtraBold outlines. Source checks find paths, no embedded font/raster or external resources. Exact generating font version remains unknown; retain the dated license-provenance.md and HC-121 independent disposition. No font software is installed or distributed. Favicon SVG and all PNGs stay source-only in the original package; no head/manifest/metadata rollout.

Rollback: remove only these six new served paths and the HC-234 cross-reference/17/17.1 authority delta from this isolated candidate; preserve the imported section16/predecessor and all HC-231 resources. No reset of another candidate.
