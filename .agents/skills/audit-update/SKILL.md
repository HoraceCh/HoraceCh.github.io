---
name: audit-update
description: Compatibility bridge that decides whether a retained Horace_Website change requires System Maintenance Log v2 and hands it to the correct recording workflow. Use after project changes that may be material; never append new entries to the legacy `.agents/changelog.md`.
---

# Audit Update

Read `.agents/rules/maintenance-logging.md` and `.agents/rules/safety-validation.md`.

1. Inspect the working tree and isolate retained changes from the current task.
2. Apply the canonical log/skip decision without copying its rules into this Skill.
3. If no record is required, stop without changing maintenance history.
4. For an incident or recovery, invoke or hand off to `$incident-record`.
5. For other material events, invoke or hand off to `$maintenance-record`.
6. For coordinated Website/Admin releases, also apply `$cross-system-release`.

Never append to or rewrite `.agents/changelog.md`. It is immutable v1 history.
