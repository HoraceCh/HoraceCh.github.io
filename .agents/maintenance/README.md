# System Maintenance Log v2

This directory stores versioned, public-safe maintenance records for `Horace_Website`.

- `events/`: one canonical Markdown file per change, release, operation, recovery, migration, security, or governance event.
- `incidents/`: one canonical Markdown file per incident.
- `templates/`: source templates used by the maintenance tool.
- `schema.md`: serialization and validator contract.
- `index.md`: deterministic generated discovery view.

Read `.agents/rules/maintenance-logging.md` for the only canonical policy and schema definitions. Use `node tools/maintenance-log.mjs help` for tool commands.

The Website and Admin repositories correlate coordinated work by storing the same `XREL-` value in their own independent records. Neither repository reads, writes, or treats the other repository as canonical.

Legacy v1 history remains in [`.agents/changelog.md`](../changelog.md) and is not migrated or duplicated.
