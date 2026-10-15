# HoraceOS

HoraceOS is Horace Website's Experience & Engineering System: a name for the existing product and engineering practice, with this page as an authority index.

## Existing product areas

| Area | Current implementation anchors |
| --- | --- |
| Foundations | `src/styles/global.css`, `src/layouts/Layout.astro` |
| Shell | `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro`, `SearchDialog.astro` |
| Task-based Composition | `src/pages/`, `src/components/`; Home, Projects, identity and discovery surfaces |
| Notes | `src/pages/notes/`, `src/components/notes/`, `src/utils/notes.ts` |
| Continuity | `src/scripts/`; native navigation, fragments, reading feedback and selective prefetch |
| Publishing | `src/content/`, `src/content.config.ts`, `tools/sync-obsidian-notes.mjs` |

These paths locate existing responsibilities; they grant no extra file or publication authority.

## Authority by topic

| Topic | Existing authority |
| --- | --- |
| Visual principles, defaults, exceptions and candidate evidence | [Design Authority v3](design/UI_DESIGN.md), especially sections 1, 11-14 |
| Project/Note identity, publication and Website/Admin consumer boundary | [Content Publication Contract](CONTENT_PUBLICATION_CONTRACT.md) |
| Safe discovery, excluded runtime/private paths and evidence packets | [Codex Scan Boundary](CODEX_SCAN_BOUNDARY.md) and its [allowlist](../config/codex-workflow.json) |
| Optional specialists and local checks | [Agent Workflow](AGENT_WORKFLOW.md) |
| Explicit model routing and Registry | [Agent Routing](CODEX_AGENT_ROUTING.md), [Website adapter](CODEX_MODEL_USAGE.md), [portable semantics](MODEL_ROUTING_PORTABILITY.md); existing workflow and derived Registry configuration |
| Actual release | Protected `main`, [PR validation](../.github/workflows/pr-ci.yml), [deployment workflow](../.github/workflows/deploy.yml) and explicit owner authorization |
| Material maintenance events | [Maintenance logging policy](../.agents/rules/maintenance-logging.md) |

This index does not replace these authorities or establish another runtime, router, or approval system.

## Operating principles

- **Outcome First:** start with the authorized user outcome and observable acceptance.
- **Context on Demand:** read affected source and relevant authority sections; load routing documents when routing is deliberately used.
- **One Writer by Default:** root can carry an ordinary Website task across adjacent implementation and test files; consult specialists when useful.
- **Protect Invariants Rather Than Implementation Details:** preserve security, publication and unrelated behavior; let authorized implementation evolve.
- **Evidence Over Ceremony:** choose proportional checks and concise evidence; independent judgment follows risk rather than file count.

## Applying design authority

Protected product/security/publication invariants remain binding. Established visual defaults govern ordinary work. Explicitly authorized variations must meet their scoped approval and acceptance criteria. Unresolved evidence-gated candidates remain unresolved until approved.

A behavior-preserving refactor proves relevant equivalence. An approved redesign may intentionally change appearance; verify its approved new criteria and preserve unrelated behavior.

Sticky Header, Progressive Glass, the exact Homepage successor, React islands, ThreeUI/WebGL and major motion are not implicitly approved by this index. Use v3's applicable investigation, evidence and approval gates.

Ordinary root work needs no model envelope or specialist procession. The existing six roles and current concurrency/sandbox settings remain compatible; explicit routing retains L0-L5, C0-C5, Registry integrity, attestation and rollback. Local evidence does not authorize external delivery.
