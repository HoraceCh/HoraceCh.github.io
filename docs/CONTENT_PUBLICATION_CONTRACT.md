# Content Publication Contract

## Current Website Contract

The public Astro site consumes Project Markdown in `src/content/projects/**/*.{md,mdx}`, generated or hand-written Note Markdown in `src/content/notes/**/*.{md,mdx}`, and the optional `src/data/note-publication-overrides.json` artifact. These repository files are the publication inputs; the private Admin service is separate. The site builds static routes from the effective published sets. See [Administration System Architecture](./ADMIN_SYSTEM_ARCHITECTURE.md), [Administration System Implementation Plan](./ADMIN_SYSTEM_IMPLEMENTATION_PLAN.md), and [Obsidian Notes Sync](./OBSIDIAN_NOTES_SYNC.md) for Admin and sync boundaries.

## Project Markdown

Each Project requires an explicit lowercase kebab-case `id` (at most 64 characters), an explicit lowercase kebab-case `slug` (at most 80 characters), and a boolean `published`. The `id` is the stable administrative identity and homepage selection key; `slug` controls `/projects/<slug>/`. The filename is not either identity. Other frontmatter must pass `src/content.config.ts`; the Markdown body and unrelated frontmatter must be preserved by an Admin edit.

`published: false` excludes a Project from public listings, homepage selection, and static detail routes. A published Project gets a detail route. `visibility: hidden` removes it from the Project index and homepage selection but leaves its detail route available; `secondary` remains listed. `status` describes maturity and does not gate publication. `featured` does not by itself place a Project on the homepage. The homepage uses curated IDs in `src/pages/index.astro` and preserves their specified order; missing IDs fail its build, while unpublished or hidden IDs are omitted. Project listing order is `order`, newest `date`, then `slug`.

Duplicate IDs, slugs, or public routes fail Project model construction with `ProjectPublicationContractError`, as do missing or invalid required publication fields. An `id` must not be reused after deletion or archival. A published slug change is a migration requiring collision and reference review plus a redirect plan; until redirect support exists, the Admin must reject it or obtain a separately approved migration.

## Note Identity and Override Artifact

The Note publication key is the final generated slug used by `/notes/<slug>/`. The Website derives it from the content entry ID with `noteSlug`; the sync pipeline owns its upstream slug/permalink/filename rules. `sourcePath` is diagnostic provenance, not a retargeting key. A sync revision can support concurrency checks but is not a public identity.

`src/data/note-publication-overrides.json`, when present, contains `{ "formatVersion": 1, "records": [...] }`. Each record has a unique lowercase kebab-case `slug` and may set only `published`, `featured`, `homepageSlot`, `publicSummary`, `order`, or `visibility`. `homepageSlot` is `selected-work-01` through `selected-work-12` and must be unique across records. `publicSummary` is a trimmed string of 1–280 characters; `order` is an integer from 0–9999; `visibility` is `public`, `secondary`, or `hidden`. Records should be sorted by slug. Unknown fields and invalid values are errors. An absent artifact currently means no overrides.

The override layer cannot change Note body, title, canonical description, tags, hierarchy, collection, module, role, prerequisites, concepts, source path, assets, backlinks, or outline. The effective result is never written into generated Markdown. An exact slug match applies present override fields. Otherwise, `published` defaults to `!draft`, `featured` to generated `featured` or `false`, `publicSummary` to generated description or an empty string, `order` to generated order, and `visibility` to `public`.

An unpublished Note is excluded from public listings, homepage selection, static detail routes, and public backlink destinations. `visibility: hidden` leaves the route available but removes the Note from discovery; `secondary` remains discoverable but is not homepage eligible. A homepage Note must be published, public, and assigned a slot. The homepage currently selects `selected-work-03`; a missing eligible Note produces a warning and no Note card. Note homepage order follows slot. Other Note lists use their relevant order or recency comparator.

## Validation Severity

| Condition | Website result |
| --- | --- |
| Project missing/invalid `id`, `slug`, or `published`; duplicate Project ID, slug, or route | Error; Project model construction fails |
| Malformed/unreadable Note override artifact; unsupported version; invalid or unknown artifact/record field; duplicate override slug or homepage slot | Error; Note model construction fails |
| Duplicate generated Note slug | Error; Note model construction fails |
| Override slug matching no current Note entry | Warning; record is not retargeted |
| Override records out of slug order | Warning; valid records still apply |
| Missing Note override artifact | Compatibility default; no overrides |

The parser returns structured Note issues for diagnostics; `createNotePublicationModel` rejects any issue with `severity: 'error'` before Astro consumers receive a model. Warnings remain in `model.issues` and do not block the build; consumers do not necessarily log them. Astro content schema errors also fail the build before these publication models run.

An orphaned `published: false` override is a publication risk: if a later sync changes the generated slug, the old override becomes orphaned and a new non-draft Note can default to published. The Website records an orphan warning in `model.issues`, never retargets the record, and does not fail its ordinary build. This is the accepted compatibility behavior; the Admin admission gate below is stricter.

## Branch and Validation Handoff

Admin content mutations are limited to an approved `src/content/projects/*.md` file or the single `src/data/note-publication-overrides.json` artifact; the Website loader also reads Project MDX. The Admin must preserve Project body and unrelated frontmatter, and must never edit Note Markdown, the sync script, or sync configuration. The sync script writes `<!-- Generated by scripts/sync-obsidian-notes.mjs from Obsidian Publish. Do not edit by hand. -->` as the first body line immediately after generated Note frontmatter. An unmarked hand-written Note must not be treated as generated. Ambiguous marker, filename ownership, or origin must stop an Admin write while preserving the file. Marker detection and generated-file ownership belong to `obsidian_notes_pipeline`.

Note assets under `astro-public/notes-assets/**` remain sync-owned derived output. The Admin may display missing, ambiguous, collision, or stale-asset diagnostics but must not upload, replace, rename, or delete Note assets. Future Project assets belong under `astro-public/project-assets/<project-id>/`; an Admin upload may write only inside the validated Project directory. It must reject path traversal, absolute paths, symlink escapes, hidden control files, and cross-Project replacement. Before asset upload is implemented, the owner must approve allowed MIME types and formats, detected file signatures, byte and image-dimension limits, filename normalization and collision handling, and an alt-text requirement for public references.

An Admin write must start from a current base revision and create a branch/PR for the exact file mutation. The Website matches overrides against all Note content entries, including hand-written Notes; that match alone does not establish Admin eligibility. Before accepting an Admin Note-publication mutation or its PR for publication, HC-16 must verify the exact target slug belongs to the current generated Note set, with generated ownership established from the sync marker immediately after frontmatter. An unknown target, orphan introduced by the mutation, changed generated slug or registry, or stale base must stop admission without retargeting; reload the current revision and revalidate. The absent override artifact is valid for ordinary Website builds and may be created as the canonical version 1 artifact only when the first approved Admin Note-publication mutation requires it.

The Admin must not merge on a stale validation result; it must check the validation outcome for the proposed commit. The handoff must identify the base and proposed commit, affected Project IDs or Note slugs, generated target evidence for Note mutations, command exit statuses, publication diagnostics, and affected route presence or absence. Merge, redirect, rollback, and production deployment are separate controlled steps, not effects of editing these files. HC-16 owns the Admin-side Project/Note write and validation handoff; this Website contract only defines the consumer behavior.

For a proposed Website branch, run from its checkout:

```sh
npm ci
npm run build
node --test "tests/**/*.test.mjs" "tests/**/*.test.ts"
git fetch origin main
git diff --check origin/main...HEAD
```

The PR validation workflow runs the first three commands on pull requests targeting `main`; deployment runs only from `main`. Record the exact proposed commit, command exit statuses, Project and Note route presence/absence for affected slugs, and the PR validation result. A passing build demonstrates the current Website consumer checks, including error-severity rejection. It does not replace the stricter HC-16 admission check for generated Note ownership, current registry state, and stable Project identities and slugs.
