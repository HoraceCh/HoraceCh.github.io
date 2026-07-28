# Maintenance Record Schema v2

The normative field list, allowed values, identifier formats, body sections, logging thresholds, and safety rules live only in `.agents/rules/maintenance-logging.md`.

## Serialization contract

- Encoding: UTF-8 Markdown.
- Frontmatter: a leading `---` block containing only flat scalars and block or empty lists.
- Schema version: represented as a quoted string so YAML readers do not coerce it to a number.
- Lists: `issue_refs`, `pr_refs`, `commit_refs`, and `affected_paths` are string arrays; use `[]` when empty.
- Body: one H1 title followed by the canonical H2 sections in canonical order.
- Filename: exactly `<event_id>.md` in `events/` or `incidents/` according to ID type.

The built-in parser intentionally accepts only this constrained YAML subset. This keeps validation deterministic without an npm dependency.

## Validation contract

`node tools/maintenance-log.mjs validate` parses every canonical record, validates schema and safety, and checks uniqueness across both record directories. Any error produces a non-zero exit code.

`node tools/maintenance-log.mjs rebuild-index` validates first, then rebuilds `index.md` from canonical records. The index is derived output and can always be regenerated.
