---
name: audit-update
description: Decide whether a retained Horace_Website change requires an append-only agent audit entry, validate the change, and record one safe entry when required. Use after project changes that may match `.agents/rules/audit-trail.md`; do not use for transient work or changes covered by its SKIP rules.
---

# Audit Update

Read `.agents/rules/audit-trail.md` and `.agents/rules/safety-validation.md`.

1. Inspect the working tree and isolate changes retained by the current task.
2. Apply the MUST Log and SKIP rules. Do not log routine narration or transient work.
3. Run validation appropriate to the changed files before writing the entry.
4. If logging is required, append exactly one entry using an approved category and the required fields.
5. Record only validation that actually ran. Omit secrets, credentials, private endpoints, and machine-specific paths.
6. Re-read the appended entry and confirm it is the final block in `.agents/changelog.md`.
