# Agent Operating Rules

This file is the entry point for the Horace_Website Agent persistence layer. Project source and configuration remain the source of truth for website behavior.

The architecture remains Rules / Skills / Memory / Changelog, with Maintenance Log v2 as the active audit mechanism and Changelog retained as immutable v1 history.

- `rules/`: stable project constraints.
- `skills/`: reusable task workflows.
- `memory/`: private-memory boundary documentation only.
- `maintenance/`: canonical v2 event and incident records plus a derived index.
- `changelog.md`: closed legacy v1 audit trail.

## Core constraints

- Inspect the working tree before editing and preserve unrelated user changes.
- Do not persist secrets, private data, machine-specific paths, or transient task state.
- Use the smallest validation set that matches the retained change.
- Never change website source or behavior merely to support Agent persistence.

## Maintenance logging

`.agents/rules/maintenance-logging.md` is the only canonical source for log/skip decisions, event fields, enums, identifiers, body sections, and public-repository safety. Other Rules and Skills must link to it instead of copying those definitions.

## Validation

Follow `.agents/rules/safety-validation.md`. If local evidence cannot establish that a change is safe, stop and ask the user.
