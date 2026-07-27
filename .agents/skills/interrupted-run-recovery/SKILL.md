---
name: interrupted-run-recovery
description: Classify an interrupted Horace_Website working tree and select the safe next owner without discarding work. Use after a stopped, timed-out, crashed, or abandoned agent run, or whenever retained changes have unclear completion or validation state.
---

# Interrupted Run Recovery

qa_build_reviewer owns this read-only recovery classification.

1. Inspect status, changed paths, working-tree and staged diffs, and any supplied command failure. Preserve unrelated user work.
2. Classify the state as CLEAN, PARTIAL_EDIT, RISKY_EDIT, or BUILD_FAIL.
3. Identify the last verified checkpoint, checks that actually ran, and checks still required. Do not infer success from partial output.
4. Map changed files and remaining work to exactly one next owner. Escalate cross-domain or ownership ambiguity to project_architect.
5. Do not reset, revert, delete, commit, or resume writes during classification.
6. Report the classification, evidence, risks, next owner, smallest safe next action, and any authority the user must provide.
