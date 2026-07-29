---
name: cross-system-release
description: Coordinate independently owned Horace_Website and Horace_Website_Admin maintenance records with one public-safe correlation ID. Use when a release or material operation spans both systems and neither repository may read from or write to the other.
---

# Cross-System Release

Read `.agents/rules/maintenance-logging.md`. Each repository remains authoritative only for its own event.

1. Have the initiating system allocate one correlation ID. In Horace_Website, run `node tools/maintenance-log.mjs correlation-id` when no shared ID already exists.
2. Pass only that ID and public-safe release context through the coordinating task or release handoff. Do not exchange repository files or private evidence.
3. Record the Website side with `$maintenance-record`, using the shared ID in `correlation_id`. The Admin owner records its side independently under its own schema and system identity.
4. Validate and rebuild the Website index locally. Never inspect, edit, or validate the Admin repository from this workflow.
5. If one side fails or rolls back, record that local result without rewriting the other system's record. Use the shared ID for later correlation.

The correlation ID links records; it does not make either repository's index or event file canonical for the other system.
