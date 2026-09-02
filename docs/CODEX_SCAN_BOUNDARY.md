# Codex Scan Boundary

This file defines what an agent may load when it audits this repository's Codex workflow. It prevents runtime state, caches, browser profiles, generated output, and unrelated user files from entering the model context.

## Policy audit boundary

`config/codex-workflow.json` is the machine-readable allowlist. `scanBoundary.policyFiles` contains text that may govern an agent; `scanBoundary.workflowFiles` contains the router, validator, fixtures, tests, and script wiring needed to audit that policy. A workflow audit reads only the union of those lists. Do not recursively search `.codex/`, `.omo/`, the repository root, or a user directory to discover more policy sources.

Use these rules:

1. Confirm the repository root and inspect `.codegraph/` before code discovery. Use CodeGraph first when the index exists.
2. For agent-policy work, enumerate tracked `.codex` files with `git ls-files .codex`; never infer policy files from every file physically present under `.codex`.
3. Load dynamic rules only from the explicit `.omo/rules/*.md` entries in the allowlist.
4. Treat excluded prefixes as runtime or generated state. Do not read, summarize, search, upload, or quote them unless the user explicitly names one file and the task requires it.
5. Search normal source only inside the owner-authorized paths required by the task. Expand the scope one dependency edge at a time when evidence requires it.
6. Redact secrets, credentials, personal browser data, and irrelevant local paths from evidence packets and reports.

The validator must fail if an allowed file is missing, an allowed path falls under an excluded prefix, or a tracked Codex policy file is absent from the allowlist. Secret-like content and local links are checked in governing text; executable workflow files are validated through their tests and structural checks. This makes policy discovery closed by default while leaving ordinary source discovery task-scoped.

## Runtime state that is never policy

The exclusion list includes `.codex` browser profiles and screenshots, `.omo` continuation state, `.opencode` state, build output, dependency directories, Git internals, local publication configuration, and environment files. `.gitignore` keeps the trackable `.codex/config.toml`, `.codex/agents/**`, and `.omo/rules/*.md` surfaces explicit while continuing to ignore local state.

## Evidence packet boundary

A handoff contains verified facts, exact policy or source paths, relevant symbols, validation results, the unresolved decision, and the requested route. It omits raw inventories, full command logs, cached model reasoning, and local runtime state. A receiving judgment agent fresh-reads decision-critical contracts even when a packet is supplied.
