---
name: maintenance-record
description: Record and validate a material Horace_Website maintenance event in System Maintenance Log v2. Use after a retained Website change matches the canonical logging policy, except when the retained event is an incident or recovery that requires the incident-record workflow.
---

# Maintenance Record

Read `.agents/rules/maintenance-logging.md` and `.agents/rules/safety-validation.md` before acting. The rule file is authoritative; do not restate or reinterpret its logging thresholds, fields, or enums.

1. Inspect the retained task diff and isolate the current task's files.
2. Apply the canonical log/skip decision. If the event is an incident or recovery, hand off to `$incident-record`. For a coordinated Website/Admin release, also use `$cross-system-release`.
3. Run validation appropriate to the retained change before recording it.
4. Create the record with `node tools/maintenance-log.mjs create` and the applicable command options. Use only repository-relative affected paths and public-safe facts.
5. Replace template prose with the actual reason, actions, validation, result, rollback, follow-up, and notes. Record only checks that ran.
6. Run `node tools/maintenance-log.mjs validate`, then `node tools/maintenance-log.mjs rebuild-index`.
7. Re-read the record and generated index. Confirm the record is the canonical source and the index is only a derived view.

Never append a v2 event to `.agents/changelog.md`, edit another repository, include raw security evidence, or record machine-specific paths.
