---
name: incident-record
description: Record and validate a public-safe Horace_Website incident or recovery in System Maintenance Log v2. Use for retained operational incidents and recoveries that meet the canonical Website logging threshold, including privacy, publication-boundary, routability, build, deployment, or workflow failures.
---

# Incident Record

Read `.agents/rules/maintenance-logging.md` and `.agents/rules/safety-validation.md` before acting. Keep raw evidence outside the public repository.

1. Confirm the incident or recovery meets the canonical logging threshold and identify the local record owner.
2. Preserve evidence only in an approved private system; write a public-safe summary of impact and response.
3. For an incident, run `node tools/maintenance-log.mjs create --incident` with the applicable options. For a separate recovery event, use `node tools/maintenance-log.mjs create --kind recovery` and reference the incident safely in the body.
4. Complete every canonical body section with facts already verified. Describe rollback and follow-up without credentials, private endpoints, unpublished content, or personal data.
5. Run `node tools/maintenance-log.mjs validate`, then `node tools/maintenance-log.mjs rebuild-index`.
6. Re-read the incident or recovery record and confirm its status reflects the current result.

Do not edit Website runtime code as part of recordkeeping, append to the legacy changelog, or expose raw security evidence.
