# Safety and Validation

## Before editing

- Inspect the current Git state.
- Preserve unrelated user work and do not widen the authorized scope.
- Read legacy or v2 history when repository state differs from expectations.
- Stop when safe progress would require an unauthorized application, publication, deployment, or cross-repository change.

## Validation matrix

| Retained change | Required validation |
| --- | --- |
| Build-affecting source or configuration | Run the Website build |
| UI templates or styles | Run behavior-matched checks and inspect affected output when practical |
| Markdown documentation | Confirm readable text, links, and intended frontmatter |
| Agent rules, Skills, or maintenance records | Validate formats, contradictions, links, public safety, and diff whitespace |
| npm dependency state | Run the build and inspect lockfile changes |

Maintenance records must pass `node tools/maintenance-log.mjs validate`; its public-safety requirements are defined only in `.agents/rules/maintenance-logging.md`. Record only validation that actually ran. Explain why a build was unnecessary when no build-affecting file changed.
