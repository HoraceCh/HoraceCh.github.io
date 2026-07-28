# Agent Persistence Architecture

This directory is the repository persistence layer for durable Agent rules, reusable workflows, private-memory boundaries, and maintenance history. Project source, configuration, and Git history remain authoritative for application behavior.

## Layers

| Layer | Purpose | Repository status |
| --- | --- | --- |
| Rules | Stable project constraints | Committed |
| Skills | Reusable task workflows | Committed |
| Memory | Boundary documentation only; no real private memory | Boundary file only |
| Maintenance | Versioned, machine-validatable v2 event records | Committed |
| Changelog | Immutable legacy v1 audit history | Committed, closed to new entries |

## Reading order

1. Read `.agents/rules.md`.
2. Read the relevant file under `.agents/rules/`.
3. Load a matching Skill only when the task triggers it.
4. Read `.agents/maintenance/index.md` for v2 history or `.agents/changelog.md` for legacy context.

## Persistence decision

If information is directly derivable from code or configuration, do not duplicate it here. Put stable project constraints in Rules, reusable procedures in Skills, and material retained events in Maintenance when the canonical logging policy requires them. Never commit personal, machine-specific, secret, or transient Memory.

The single source of truth for all maintenance logging decisions, fields, enums, IDs, and public-safety rules is `.agents/rules/maintenance-logging.md`.
