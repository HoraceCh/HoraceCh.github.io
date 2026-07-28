# Persistence Boundaries

## Rules

Rules store stable project constraints that cannot be inferred reliably from source or configuration. Maintenance logging policy is centralized in `.agents/rules/maintenance-logging.md`.

## Skills

Skills describe reusable task procedures. They link to Rules and do not redefine project policy.

## Memory

Real personal, machine, external-system, and short-lived task memory must not be committed. `.agents/memory/` stores only the boundary explanation.

## Maintenance

Each v2 event or incident is an independent canonical Markdown record under `.agents/maintenance/events/` or `.agents/maintenance/incidents/`. `.agents/maintenance/index.md` is generated discovery output, not a canonical event record.

## Changelog

`.agents/changelog.md` is immutable v1 history. It explains earlier project evolution but receives no v2 events and is never backfilled or duplicated into Maintenance.
