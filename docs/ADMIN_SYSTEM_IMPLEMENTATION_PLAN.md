# Administration System Implementation Plan

## Status and Execution Rule

This plan divides the administration system into separate Codex rounds. Each round has one primary write owner and a bounded rollback. Later phases must not expand their allowed area without a new `project_architect` contract round.

Related contracts:

- [Administration System Architecture](./ADMIN_SYSTEM_ARCHITECTURE.md)
- [Content Publication Contract](./CONTENT_PUBLICATION_CONTRACT.md)
- [Agent Workflow](./AGENT_WORKFLOW.md)
- [Codex Agent Routing](./CODEX_AGENT_ROUTING.md)

## Phase 0 — Contract Documentation

- **Objective:** Record the architecture decision, content ownership, publication semantics, override allowlist, security boundaries, ownership, and phased delivery plan.
- **Primary agent/write owner:** `project_architect`.
- **Allowed area:** `docs/`; README documentation index only if required.
- **Forbidden area:** all runtime, content, pipeline, asset, workflow, dependency, lock, agent-config, and local Obsidian files.
- **Prerequisites:** repository audit and accepted MVP architecture.
- **Acceptance criteria:** the three contracts are internally consistent; generated Notes remain read-only; authentication and repository authorization are separate; no runtime files change.
- **Rollback boundary:** remove or revert only the Phase 0 documentation changes.
- **Validation commands:** `git status --short`; `git diff --check`; `git diff --stat`; `git diff --name-status`.

## Phase 1 — Public-Site Publication Helpers

- **Objective:** Implement effective Project publication and effective Note metadata before any admin service writes content.
- **Expected deliverables:** Project publication helper; Note override loader/effective-metadata helper; Project and Note static-route exclusion; consistent filtering of listings/taxonomies/backlinks; orphan/unknown-field validation; fixtures or tests.
- **Confirmed likely touch points:** `src/content.config.ts`; Project routes under `src/pages/projects/`; Note routes under `src/pages/notes/`; Notes utilities under `src/utils/`; homepage selections in `src/pages/index.astro` if moved to effective metadata; the reserved override artifact under `src/data/`. Exact new helper/test filenames belong in the Phase 1 handoff.
- **Primary agent/write owner:** `frontend_implementer`, after `project_architect` defines schema/migration order and `obsidian_notes_pipeline` reviews the Note override boundary.
- **Allowed area:** only the exact Astro schema, helper, page, fixture/test, and override paths approved in the Phase 1 handoff.
- **Forbidden area:** sync script, generated Notes, Note assets, Project content migration beyond approved fixtures, admin service, dependencies, GitHub Actions, and Obsidian source.
- **Prerequisites:** Phase 0 accepted; compatibility defaults and schema migration sequence approved.
- **Acceptance criteria:** unpublished records generate no public route; all listing/backlink consumers use the effective published set; invalid/orphan overrides are deterministic; existing published content remains available; no admin application exists.
- **Rollback boundary:** revert the Phase 1 site/schema/helper commit and remove only its newly introduced fixture/override artifacts.
- **Validation commands:** `git diff --check`; repository tests introduced by the phase; `npm run build`; route checks for published and unpublished Project/Note fixtures; `git status --short`.

## Phase 2 — Admin Service Scaffold

- **Objective:** Create the separate private service with owner authentication, secure sessions, health reporting, and environment validation, but no repository mutation.
- **Primary agent/write owner:** `frontend_implementer` for private service code under an approved `project_architect` service contract.
- **Allowed area:** the separate private admin repository/service only.
- **Forbidden area:** public-site repository writes, GitHub App mutation operations, Obsidian access, content editing, and deployment-workflow changes.
- **Prerequisites:** Phase 1 publication contract implemented; host and identity provider selected; owner allowlist value available through secrets.
- **Acceptance criteria:** allowlisted owner can establish/revoke a secure session; non-owner is denied; health endpoint exposes no secrets; missing environment values fail startup; repository remains read-only.
- **Rollback boundary:** disable/remove the private service deployment; no public content rollback required.
- **Validation commands:** service lint, type-check, unit/integration tests, and production build scripts defined by the scaffold; authentication denial/allowlist tests; secret-leak scan.

## Phase 3 — Project Vertical Slice

- **Objective:** Deliver one end-to-end Project edit path before broader CRUD: list Projects, read one Project, edit approved fields, validate, create a branch commit, request validation, inspect the result, and merge or revert.
- **Primary agent/write owner:** `frontend_implementer` for private service/UI code and approved Project-write integration.
- **Allowed area:** private admin repository plus the approved Project Markdown path in a test branch; no bulk migration.
- **Forbidden area:** Note files/overrides, Note assets, direct writes to `main`, vault access, broad Project asset upload, and unapproved schema changes.
- **Prerequisites:** Phases 1–2; GitHub App installed with minimal repository permission; branch naming and commit policy approved.
- **Acceptance criteria:** one Project round-trips without losing Markdown/body fields; invalid content cannot be committed; writes target a branch; validation status is visible; merge is blocked until success; revert commit restores prior content.
- **Rollback boundary:** revert the Project branch commit or close the branch; disable the GitHub App installation if authorization is suspect.
- **Validation commands:** admin service lint/type-check/tests/build; GitHub App permission inspection; `npm run build` against the proposed website branch; `git diff --check`; Project route verification.

## Phase 4 — Note Publication Management

- **Objective:** Read the synchronized Note registry and diagnostics, then edit only allowlisted override fields.
- **Primary agent/write owner:** `frontend_implementer` for private service/UI and override writes, after mandatory `obsidian_notes_pipeline` contract review.
- **Allowed area:** private admin repository and the dedicated Note override artifact in a branch; public helper changes only if separately approved.
- **Forbidden area:** generated Note Markdown, hand-written Note bodies, sync script/configuration, Note assets, source paths, remote vault access, and non-allowlisted metadata.
- **Prerequisites:** Phase 1 override loader/validation; Phase 2 service; a pipeline-owner-approved synchronized Note registry/diagnostic contract.
- **Acceptance criteria:** records show source/sync diagnostics; only six allowlisted fields can be submitted; unknown and orphan records block publication; no Note body or asset mutation exists; effective preview uses generated body plus overrides.
- **Rollback boundary:** revert the override-artifact branch commit; regenerated Notes and Obsidian source remain untouched.
- **Validation commands:** admin service tests/build; override schema/unknown-field/orphan tests; `npm run build` for the website branch; public Note listing, route, tag, and backlink checks; `git diff --check`.

## Phase 5 — Preview and Deployment

- **Objective:** Add branch validation, a protected preview artifact, deployment status, failure visibility, and revert-commit recovery.
- **Primary agent/write owner:** `frontend_implementer` for private service integration; any public-repository workflow change requires a separate `project_architect`-authorized round and critical `qa_build_reviewer` gate.
- **Allowed area:** approved private service integration and explicitly listed validation/preview workflow files.
- **Forbidden area:** public secrets, previews without access control, direct unvalidated `main` writes, vault connectivity, and unrelated deployment refactors.
- **Prerequisites:** Phases 2–4; preview host/artifact access policy selected; branch validation contract approved.
- **Acceptance criteria:** preview is tied to an immutable commit; access is protected; validation/deployment failures are visible; production status maps to the deployed commit; recovery creates an auditable revert commit.
- **Rollback boundary:** disable preview/deployment integration and revert its workflow/service commit without changing canonical content history.
- **Validation commands:** workflow syntax/permission review; admin service tests/build; branch `npm run build`; preview access-control test; failed-build simulation; production/revert status reconciliation.

## Phase 6 — Assets, Polish, and Hardening

- **Objective:** Add validated Project image uploads, audit UI, mobile admin treatment, Vercel-like light/Linear-like dark styling, security review, and operational documentation.
- **Primary agent/write owner:** `frontend_implementer`, working from a read-only `design_system_curator` specification; security/deployment changes require `project_architect` approval.
- **Allowed area:** private admin UI/service, controlled Project asset path, and operational docs explicitly named in the handoff.
- **Forbidden area:** Note asset replacement, generated Note edits, full CMS features, multi-user roles, object storage migration, and unrelated public-site redesign.
- **Prerequisites:** stable Project vertical slice, Note override flow, preview/deployment status, approved upload limits, and visual specification.
- **Acceptance criteria:** uploads enforce MIME/signature/size/dimension/path rules; audit events cover mutations; mobile/light/dark states meet the approved spec; threat-model findings are resolved or accepted; recovery runbook is tested.
- **Rollback boundary:** revert asset-reference/content commits, retain prior repository assets until references are restored, and disable upload endpoints independently.
- **Validation commands:** admin lint/type-check/tests/build; upload/path-traversal/security tests; light/dark/mobile checks; website `npm run build`; asset URL checks; critical QA gate.

## Agent Ownership Contract

One implementation area has one write owner. Review or approval does not transfer write ownership.

| Agent | Owned responsibility | Write boundary |
| --- | --- | --- |
| `project_architect` | Architecture, cross-repository boundaries, schema migration plans, security/deployment contracts | Architecture/contract documentation only by default |
| `obsidian_notes_pipeline` | Sync script, publish configuration, generated-Note contract, sync diagnostics, attachment resolution, Note override contract review | Pipeline-owned files only; no admin UI or public route implementation |
| `content_ia_editor` | Project field semantics, public descriptions, naming, editorial validation | Content/docs named in an explicit content handoff; never generated Notes |
| `design_system_curator` | Admin visual specification | Read-only specification; no application code unless explicitly reassigned |
| `frontend_implementer` | Public Astro helpers/routes and future private admin UI/service implementation | Exact implementation paths from the approved handoff; no pipeline changes |
| `qa_build_reviewer` | Diff boundaries, tests, builds, publication routes, security regression checks | Read-only source review; final `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED` gate |

Area-level write ownership:

- Public publication helpers and route filtering: `frontend_implementer`.
- Private admin application and its server routes: `frontend_implementer` after an architecture handoff.
- Project editorial content: `content_ia_editor`; the admin service performs owner-requested repository mutations under the approved contract, not autonomous rewriting.
- Obsidian sync, generated Notes, sync diagnostics, and Note assets: `obsidian_notes_pipeline`.
- Admin visual tokens/specification: `design_system_curator`; implementation: `frontend_implementer` in a later handoff.
- Release gate: `qa_build_reviewer` only.

## Decision Log

1. **Admin deployment:** separate private service and repository.
2. **Owner authentication:** GitHub OAuth or an equivalent managed identity provider with one explicit owner allowlist.
3. **Repository writes:** repository-scoped GitHub App installation token, server-side only and separate from login identity.
4. **Merge policy:** branch first; successful validation is required before merge to `main`.
5. **Project assets:** repository-backed with approved limits for MVP.
6. **Note metadata overrides:** publication, feature placement, homepage slot, public summary, order, and visibility only.
7. **Note bodies:** never edited through the admin.
8. **Remote Obsidian sync:** out of MVP.
9. **Database:** sessions and audit records only; never canonical for Project Markdown, Note bodies, or override content.

