# Skill: Audit Update

Use this skill when a task may require updating `.agents/changelog.md`.

## Trigger

Run this flow after any retained project change that might match `.agents/rules/audit-trail.md`.

## Flow

1. Check the current git status and identify only the files changed by the current task.
2. Compare the change against MUST Log and SKIP rules.
3. If logging is required, choose exactly one category from the approved category list.
4. Run the validation required by `.agents/rules/safety-validation.md`.
5. Append one changelog entry to the bottom of `.agents/changelog.md`.
6. Re-read the appended entry to confirm the format and that no sensitive information was recorded.

## Changelog Entry Checklist

- Date/time uses `YYYY-MM-DD HH:MM`.
- AgentName identifies the Agent that performed the change.
- Category is one of the approved values.
- Scope, Files, Reason, and Validation are present.
- Notes is omitted unless it adds useful context.
- No secrets, credentials, private endpoints, or machine-specific sensitive values are included.
