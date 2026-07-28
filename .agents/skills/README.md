# Skills

Project-local Skills are reusable workflows. Stable policy remains in Rules.

## Maintenance workflows

- `audit-update/`: compatibility bridge from the legacy audit workflow to v2.
- `maintenance-record/`: create and validate a material v2 event.
- `incident-record/`: create and validate a public-safe incident or recovery.
- `cross-system-release/`: coordinate independent Website/Admin records with one shared correlation ID.

Other project Skills retain their existing ownership boundaries. A Skill must link to `.agents/rules/maintenance-logging.md` instead of restating logging thresholds, fields, categories, or enums.
