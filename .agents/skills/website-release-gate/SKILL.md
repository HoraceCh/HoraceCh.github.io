---
name: website-release-gate
description: Run the Horace_Website release-readiness procedure without fixing defects or performing release actions. Use when qa_build_reviewer gates an implementation before commit, PR, publish, or deploy, or when a user explicitly requests final website QA.
---

# Website Release Gate

qa_build_reviewer owns the decision and remains read-only for source.

1. Inspect status, changed paths, the working-tree diff, and whitespace errors.
2. Verify every changed file belongs to the authorized owner and task scope. Stop on an unexpected protected or deployment file.
3. Select behavior-matched checks: website build for source/build changes, Hexo build for Hexo changes, Notes preflight for pipeline/publication changes, and rendered-page review for affected UI when browser tooling is available.
4. Treat browser and Computer Use validation as optional enhancements, never build dependencies.
5. Report findings with file evidence and assign fixes to the owning agent; do not repair them in the gate.
6. Return exactly PASS, PASS WITH WARNINGS, FAIL, or BLOCKED. A required but unverified build is BLOCKED: build not verified.
7. Do not commit, push, publish, deploy, or broaden permissions.
