# Administration System Architecture

## Status

Accepted Phase 0 architecture contract. This document describes the intended boundary; it does not claim that the administration system or its future validation workflow is implemented.

Related contracts:

- [Content Publication Contract](./CONTENT_PUBLICATION_CONTRACT.md)
- [Administration System Implementation Plan](./ADMIN_SYSTEM_IMPLEMENTATION_PLAN.md)
- [Obsidian Notes Sync](./OBSIDIAN_NOTES_SYNC.md)
- [Agent Workflow](./AGENT_WORKFLOW.md)

## Purpose

The administration system will manage the public publication process for Projects and the publication layer of Notes. It will not replace the Astro static site, GitHub Pages, the local Obsidian authoring workflow, or the existing Obsidian-to-Astro synchronization pipeline.

The system is designed for one authenticated owner. Its useful boundary is controlled repository editing, validation, preview, deployment visibility, and recovery—not a general-purpose CMS.

## Architecture Decision

- The public application remains the Astro static site in this repository.
- GitHub Pages remains the public host.
- The administration system is a separate private application and service in a separate repository.
- Git in this repository remains the canonical store and version history for Project content.
- Obsidian `98 Publish` remains the canonical source for synchronized Note bodies.
- Generated Note files in this repository remain derived output.
- A dedicated repository-backed override artifact will become canonical only for the approved public Note metadata listed in the publication contract.
- GitHub Actions remains the validation and deployment system. The current workflow deploys `main`; branch validation and protected previews are future work.
- A database may hold sessions and audit records, but it must not become a competing authority for Projects, Note bodies, or Note publication overrides.

## Trust Boundaries

### A. Owner Authentication

- Authentication uses GitHub OAuth or another managed identity provider.
- Authorization requires an explicit allowlist containing one owner identity; successful provider login alone is insufficient.
- The private service creates and validates a secure server-side session.
- Login identity proves who may use the admin service. It does not itself grant repository write access.

### B. Repository Write Authorization

- Repository writes use a GitHub App installation token, separate from the owner's login credential.
- The GitHub App is installed only on the intended repository and receives only the repository permissions required for approved branch and content writes.
- Installation tokens are short-lived and used only by private server routes.
- Repository credentials must never be returned to browser JavaScript, committed to either repository, or exposed in logs.
- Every mutation is restricted to an approved branch workflow and an explicit repository-path allowlist.

### C. Public Site

- The Astro site has no admin routes, mutation APIs, login session, or runtime repository integration.
- The GitHub Pages bundle contains no secrets, provider credentials, session keys, or repository write credentials.
- Public pages consume only repository content validated at build time.

## Component Boundaries

| Component | Responsibility | Explicit boundary |
| --- | --- | --- |
| Public Astro site | Build and serve public Projects and Notes | Static, read-only, and secret-free |
| Private admin frontend | Owner-facing forms, validation results, previews, deployment status | Receives no GitHub App private key or installation token |
| Private backend/server routes | Session enforcement, validation orchestration, allowed repository operations, audit recording | Not deployed to GitHub Pages |
| GitHub App integration | Create branch commits and read validation/deployment status | Server-side only; repository-scoped |
| GitHub Actions | Validate proposed repository revisions and deploy accepted `main` revisions | Existing `main` deployment is current; branch validation is future |
| Obsidian local publishing | Author Note bodies and run the controlled `98 Publish` sync | No remote vault access from the admin service |
| Repository content/metadata | Store Project Markdown, generated Notes, approved overrides, and controlled public assets | Ownership and write paths are defined below |
| Future preview environment | Present a protected rendering of a branch revision | Must not expose secrets or bypass build validation |

## Source-of-Truth Matrix

| Domain | Canonical source | Admin authority | Version/recovery |
| --- | --- | --- | --- |
| Projects | `src/content/projects/*.md` | Future admin may create and edit validated Project records | Git commits and revert commits |
| Note body | Obsidian `98 Publish` | Read-only display; never direct editing | Obsidian history/backups plus generated Git revisions |
| Generated Note copy | Marked files under `src/content/notes/` | No direct edits; sync-owned derived output | Regenerate from `98 Publish` or revert the sync commit |
| Note publication overrides | Future `src/data/note-publication-overrides.json` | May edit only allowlisted public metadata | Git commits and revert commits |
| Note assets | Obsidian attachments resolved by the sync pipeline | Diagnostics only; no replacement or deletion | Regenerate through the sync pipeline |
| Copied Note assets | `astro-public/notes-assets/**` | Sync-owned derived output | Sync manifest, regeneration, or Git revert |
| Project assets | Future `astro-public/project-assets/<project-id>/` | Future admin may manage validated files | Git commits and revert commits |
| Sessions and audit events | Private admin service storage | Private service only | Service backup/retention policy; never public content authority |

The override and Project asset paths are reserved contracts, not files or directories created in Phase 0.

## Synchronization and Deployment Boundary

1. The owner publishes Note source material locally from Obsidian `98 Publish`.
2. The existing sync pipeline generates website Note files and copied assets without changing the original vault.
3. Generated output is committed to this repository through the normal review path.
4. The future admin reads synchronized records and diagnostics from repository state; it does not initiate remote access to the vault in MVP.
5. Admin-originated changes are written to a branch first.
6. GitHub Actions validates the branch revision before it may be merged to `main`.
7. A successful `main` build deploys the static site to GitHub Pages.

## Rejected MVP Architectures

- **Runtime backend bundled into GitHub Pages:** GitHub Pages serves static files and cannot provide a private mutation boundary.
- **Secrets in client JavaScript:** every browser-delivered value is public and therefore unsuitable for repository credentials or session secrets.
- **Direct remote access to the local Obsidian vault:** this expands the private-content boundary and makes local availability a production dependency.
- **Editing generated Note bodies:** this creates conflicting authorities and loses changes on the next sync.
- **Full CMS migration:** it duplicates or replaces a working Astro/Obsidian workflow without proportional MVP benefit.
- **Database authority for Project Markdown:** it creates two canonical copies and reconciliation failure modes.
- **Object storage for ordinary Project images:** repository-backed images are sufficient for the expected MVP scale and preserve atomic content history.
- **Multi-user roles and collaboration:** the system is for one allowlisted owner; role management adds security and workflow complexity without a current requirement.

