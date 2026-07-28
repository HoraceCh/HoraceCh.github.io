# System Maintenance Logging

This file is the single canonical source for Horace_Website maintenance logging decisions, record fields, enums, identifier formats, body sections, and public-repository safety. Other Rules, Skills, templates, and documentation must link here instead of defining competing policy.

## Record authority

- Each Markdown file under `.agents/maintenance/events/` or `.agents/maintenance/incidents/` is one canonical v2 event record.
- `.agents/maintenance/index.md` is deterministic generated output and is never the canonical record.
- `.agents/changelog.md` is immutable legacy v1 history. Do not append, reorder, rewrite, or duplicate its entries as v2 events.

## MUST log

Log each retained material event that changes or records any of the following:

- route, navigation, page-system, or user-visible behavior;
- Project or Note schema or publication contracts;
- Obsidian sync, asset resolution, generated content, or manifest behavior;
- homepage curation identity or slot rules;
- dependencies, build, deployment, or workflows;
- release-gate results associated with a material release;
- privacy, publication-boundary, or routability security fixes;
- material `.agents/`, Codex Agent, Skill, or governance behavior;
- a cross-system release initiated by Horace_Website_Admin;
- an incident or recovery with medium or greater operational impact.

## SKIP

Do not log:

- typo or punctuation fixes;
- formatting-only changes;
- trivial comments;
- transient experiments that leave no retained state;
- routine validation runs with no meaningful result;
- very small visual corrections that change neither behavior nor layout.

When a retained task contains both skipped details and a material event, create one record for the material event and summarize only the relevant scope.

## Canonical frontmatter

Every v2 record must contain exactly these fields:

| Field | Requirement |
| --- | --- |
| `schema_version` | String `2.0`. |
| `event_id` | Stable unique Website event or incident ID in the formats below. |
| `system` | Exactly `Horace_Website`. |
| `kind` | One canonical kind enum value. |
| `category` | One canonical category enum value. |
| `status` | One canonical status enum value. |
| `risk` | One canonical risk enum value. |
| `environment` | One canonical environment enum value. |
| `occurred_at` | ISO 8601 timestamp with explicit timezone; prefer UTC. |
| `recorded_at` | ISO 8601 timestamp with explicit timezone; prefer UTC. |
| `actor_type` | One canonical actor-type enum value. |
| `actor` | Non-empty public-safe actor label. |
| `owner` | Non-empty public-safe accountable owner label. |
| `correlation_id` | Empty string or a valid cross-system correlation ID. |
| `issue_refs` | YAML list of public-safe reference strings. |
| `pr_refs` | YAML list of public-safe reference strings. |
| `commit_refs` | YAML list of public-safe reference strings. |
| `affected_paths` | YAML list of repository-relative forward-slash paths. |
| `public_safe` | Boolean `true`; any other value is invalid. |

Unknown or repeated frontmatter fields are invalid.

## Canonical enums

- `kind`: `change`, `release`, `operation`, `incident`, `recovery`, `migration`, `security`, `governance`
- `category`: `site-structure`, `content-publication`, `notes-pipeline`, `build-dependency`, `deployment-release`, `security-privacy`, `agent-governance`, `incident-response`, `migration`, `other`
- `status`: `planned`, `in-progress`, `completed`, `failed`, `rolled-back`, `superseded`
- `risk`: `low`, `medium`, `high`, `critical`
- `environment`: `local`, `repository`, `preview`, `production`
- `actor_type`: `human`, `agent`, `automation`, `service`

Choose the category that best describes the primary affected domain. Do not invent a new value in an event file.

## Identifiers and correlation

- Event IDs: `WEB-YYYYMMDD-NNNN`
- Incident IDs: `WEB-INC-YYYYMMDD-NNNN`
- Cross-system correlation IDs: `XREL-YYYYMMDD-XXXXXXXXXXXX`, where the final segment is twelve uppercase letters or digits.

Sequence numbers are zero-padded and allocated from existing local canonical records. IDs never change after creation. A Website/Admin operation shares one `XREL-` ID through the coordinating task or handoff; each repository records and validates only its own event, with its own system identity and without reading or writing the other repository.

## Canonical body

After one H1 title, include these H2 sections exactly once and in this order:

1. `Summary`
2. `Reason`
3. `Actions`
4. `Validation`
5. `Result`
6. `Rollback`
7. `Follow-up`
8. `Notes`

Every section must contain meaningful public-safe text. Use `None.` or `Not applicable.` when the section genuinely has no content; do not omit it.

## Public-repository safety

Every committed Website record must be safe for a public repository. Never record secrets, credentials, tokens, cookies, OAuth values, credential-shaped assignments, private endpoints, private note titles, raw personal data, local absolute paths, or unpublished Vault details. Use repository-relative paths only. Do not store raw security evidence; keep it in an approved private system and record only a sanitized result.

Validation must reject non-true `public_safe`, obvious Windows or UNC absolute paths, unsafe affected paths, credential-shaped assignments, private-key material, private network endpoints, invalid identifiers, invalid timestamps, invalid enums, missing sections, and duplicate event IDs.

## Recording workflow

1. Validate the retained change with checks appropriate to its behavior.
2. Create and complete one event or incident record using the applicable Skill and template.
3. Run `node tools/maintenance-log.mjs validate`.
4. Run `node tools/maintenance-log.mjs rebuild-index`.
5. Review the record and index diff. Never edit the generated index as a substitute for editing a record.
