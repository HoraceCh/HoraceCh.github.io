# Content Publication Contract

## Status and Scope

This Phase 0 contract defines future publication semantics without changing the current Astro schemas, routes, content, or synchronization behavior. Implementation must be delivered in later, separately reviewed rounds.

Related references:

- [Administration System Architecture](./ADMIN_SYSTEM_ARCHITECTURE.md)
- [Administration System Implementation Plan](./ADMIN_SYSTEM_IMPLEMENTATION_PLAN.md)
- [Obsidian Notes Sync](./OBSIDIAN_NOTES_SYNC.md)

## Project Identity

- Every Project will have a stable explicit `id` used for administrative identity and relationships.
- Every Project will have an explicit public `slug` used in `/projects/<slug>/`.
- The Markdown filename should normally match `slug` for readability, but the filename is not the permanent Project identity.
- An `id` must not be reused after deletion or archival.
- A `slug` change is a migration, not an ordinary edit. It requires collision validation, link/reference review, and a redirect plan before publication.
- Until redirect support exists, the admin must reject published Project slug changes or require a separately approved migration.
- The current site derives Project routes from content entry filenames. That is a legacy compatibility constraint to migrate later; this document does not alter it or add `id`/`slug` to the current schema.

## Project Publication State

The future Project contract separates publication eligibility from presentation and lifecycle metadata.

| Field | Meaning |
| --- | --- |
| `published` | Authoritative public-route gate |
| `visibility` | Presentation tier after publication, such as primary, secondary, or hidden from selected listings |
| `status` | Work lifecycle or maturity description; not a route gate unless an explicit mapping is approved |
| `featured` | Eligibility for selected placements only |
| `order` | Deterministic ordering within a placement or listing |

For `published: false`:

- Exclude the Project from every public listing and selection.
- Exclude it from static detail route generation.
- Make its direct public URL unavailable in the generated site.

For `published: true`:

- The Project is eligible for static route generation.
- `visibility`, `featured`, and `order` may then determine where and how it appears.

`visibility` must never be the sole publication gate. The current implementation can hide `visibility: hidden` Projects from the index while still generating their detail routes; Phase 1 must close this compatibility gap before the admin depends on publication controls.

## Note Identity

- The immutable publication key for an override record is the final generated Note slug used by `/notes/<slug>/`.
- The sync pipeline's generated slug is derived from its current slug/permalink/filename rules; the final generated value, not the Obsidian source filename alone, is the public key.
- `sourcePath` is diagnostic provenance and may help identify the Obsidian source, but it is not the public identifier and must not be used to retarget an override automatically.
- `syncRevision` identifies the repository/sync revision that produced the observed generated record. It is diagnostic concurrency data, not part of the public route.
- A duplicate, conflicting, or changed generated slug must produce a validation warning or failure before publication.
- An override whose slug matches no generated Note is orphaned. It must be reported and must never silently apply to a Note with a similar title or source path.

## Note Override Artifact

The future canonical artifact is `src/data/note-publication-overrides.json`. Phase 0 reserves the path but does not create it. The artifact will have a versioned top-level contract and records keyed by final generated Note slug. Each record may contain only the allowlisted fields below; implementation-specific audit data must remain outside the public-content contract.

### Override Allowlist

The override layer may control only:

- `published`
- `featured`
- `homepageSlot`
- `publicSummary`
- `order`
- `visibility`

The override layer must not control:

- Note body
- title
- canonical tags
- hierarchy, collection, module, or note role
- prerequisites or concepts
- source path
- asset references
- generated backlinks
- rendered outline

Those values remain owned by Obsidian/generated metadata or by deterministic website rendering logic. `publicSummary` is a presentation override; it does not replace the generated canonical description in the source Note.

## Override Precedence

Effective public Note metadata is calculated in this order:

1. Load and validate the generated Note and its metadata.
2. Match an override by the exact final generated slug.
3. Apply only present, allowlisted override fields.
4. Fail validation when an override contains an unknown field or invalid value.
5. Report an orphan warning when the override slug has no generated Note; do not apply it elsewhere.
6. Use generated defaults when no override record or no override value exists.
7. Never write the effective result back into generated Markdown.

The first implementation must document defaults for generated Notes created before an override exists. The recommended compatibility default is `published = !draft`, while preserving the generated `featured`, description, and order unless explicitly overridden.

## Unpublish Contract

### Projects

An unpublished Project must be absent from index collections, featured/home selections, taxonomy surfaces, and static detail route generation. Its former direct route must not exist in the new static build.

### Notes

An unpublished Note must be absent from general and filtered listings, category/tag/path/type/status collections, homepage selections, sitemap output, static detail route generation, and public backlink destinations. Incoming backlink UI must not expose the unpublished target as a public link. Backlink derivation may retain private validation diagnostics, but public output must use only the effective published Note set.

Exact filtering, sitemap, backlink, and route changes belong to Phase 1; none are implemented by this document.

## Generated-Content Protection

- A generated Note is detected by the exact marker already emitted by `tools/sync-obsidian-notes.mjs`: `<!-- Generated by scripts/sync-obsidian-notes.mjs from Obsidian Publish. Do not edit by hand. -->`.
- The future admin treats any marked Note as read-only derived output.
- An unmarked hand-written Note remains distinguishable and must not be assumed to be sync output.
- Admin Note publication management operates through the override artifact, not either kind of Markdown body.
- If marker state, filename ownership, or origin is ambiguous, the admin must stop the write, report a validation issue, and preserve the existing file.
- Only `obsidian_notes_pipeline` may change marker detection, generated-note contracts, or sync-owned output rules.

## Asset Ownership

### Project Assets

- MVP assets are repository-backed under the future controlled directory `astro-public/project-assets/<project-id>/`.
- The admin may write only within the validated Project directory and must reject traversal, absolute paths, symlink escapes, hidden control files, and cross-Project replacement.
- Upload validation must cover allowed MIME type, detected file signature, byte size, image dimensions, filename normalization, duplicate/collision handling, and an explicit alt-text requirement when referenced publicly.
- Limits and allowed formats must be approved before asset upload implementation.

### Note Assets

- Obsidian's attachment system is canonical; copied files under `astro-public/notes-assets/**` are sync-owned derived output.
- Note assets change only through Obsidian and the publishing pipeline.
- The admin may display missing, ambiguous, collision, or stale-asset diagnostics, but must not upload, replace, rename, or delete Note asset files.

