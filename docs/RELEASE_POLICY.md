# Website Release Policy

This is the repository authority for Website release identity, production
metadata, and formal product-version promotion. The existing static Astro build
and GitHub Pages deployment remain the delivery mechanism.

## Distinct identities

| Identity | Meaning |
| --- | --- |
| Design Authority v3 | Approved design governance; not evidence that Website v3 shipped. |
| Home v2 | A homepage workstream; not a public product version. |
| Package version | Existing `package.json` metadata; not the Website version authority. |
| Deployment version | The complete deployed Git SHA, identifying one Continuous Production release. |
| Formal product version | A separately approved Git tag and curated GitHub Release at a verified production SHA. |

Product labels follow a SemVer-inspired visitor-facing convention, without
claiming an API compatibility contract. The proposed first full-V3 label is
`v3.0.0`; its existence and publication must never be inferred from this policy.
Do not invent historical v1/v2 tags or equate the initial launch with the later
Astro migration.

## Existing production integration

Keep the single existing Linear Continuous Production pipeline, its access key,
completed stage, history, and issue associations. Do not add a Scheduled or
Staging pipeline without a real separately approved deployed environment.
HC-252 records configuration readiness only; its point-in-time evidence does not
prove current credential health or grant deployment authority.

The existing `deploy.yml` performs:

1. Checkout the event's exact SHA, record and verify it, install the locked
   dependencies, build Astro/Pagefind, and upload the Pages artifact.
2. Deploy that artifact to the existing `github-pages` environment.
3. In a separate accounting job in the same workflow, checkout the recorded SHA
   with full history and verify it again before invoking the existing Linear
   integration.

Production release reporting is restricted to `refs/heads/main` for the existing
`push` and `workflow_dispatch` events, after Pages success. Manual runs from
other refs create no production release records. This workflow has no separate
non-production environment selector: a manual main run uses the existing
production Pages environment and requires production authorization.
The separate PR validation workflow remains unchanged.

The Linear release version is the full deployed SHA; its human-readable name is
`Website production <full SHA>`. Source, Pages, and Actions-run links accompany
it. Never assign a shared `v3.0.0` version to multiple deployments or use the
current main tip as a substitute for the artifact's recorded candidate.

Keep `linear/linear-release-action@v0.18.0` and CLI `v0.18.0`, the existing
`LINEAR_ACCESS_KEY` secret, and full-history issue/PR detection. Do not filter out
unrelated PRs or require a positive issue count: `issueCount = 0` is valid.
No automatic tags, GitHub Releases, Release Notes, issue closure, or News
publication are introduced by this workflow.

## Reconciliation and retries

Use `sync` with the same explicit full-SHA version on every retry. The pinned
integration targets an existing matching version rather than intentionally
creating a second release; it also preserves normal issue/PR scanning.
The receipt must contain a release ID and exactly the requested version.
A missing or mismatched receipt is synchronization debt, even if the action
exited successfully. Issue count is not a receipt-validity condition.

| Outcome | Recorded fact and next action |
| --- | --- |
| CI/build fails | Build failure; Pages does not succeed; no production release synchronization. |
| Pages deployment fails | Deployment failure; no production release synchronization. |
| Pages succeeds; Linear synchronization or receipt fails | Pages remains successful. The metadata job fails and its summary reports outstanding synchronization debt. |
| Same SHA succeeds again | Reconcile the same deployment version; do not create a new product version. |
| Different SHA succeeds | Use a distinct full-SHA deployment version. |

For Pages success followed by synchronization debt:

1. Preserve the original run ID, complete deployed SHA, Pages success, and any
   Linear receipt. Inspect the same pipeline for an existing matching version,
   including a possible successful mutation followed by a lost response.
2. With separate operational authorization, rerun only the `release_metadata`
   job in that original run. GitHub retains the original event SHA/ref and the
   successful prerequisite outputs, so no build or Pages redeployment is needed.
3. Confirm the receipt's version and existing release identity, links, and issue
   associations. Leave history and unrelated releases unchanged.
4. Record the debt as resolved only after successful reconciliation. A red
   overall workflow caused by the metadata job is not proof of deployment
   failure, rollback, or production unavailability.

Do not dispatch a new run at today's main tip to repair an older deployment's
metadata. GitHub's job-rerun window is limited; outside that window, stop for an
Owner-approved exact-SHA reconciliation procedure. Do not introduce an ad hoc
alternate pipeline or manually fabricate successful deployment history.
Cancellation or runner loss can interrupt summary generation; reconcile against
the original Pages job, artifact SHA, and release receipt rather than guessing
from the overall run conclusion.

Offline fixtures and upstream source inspection establish workflow wiring and
the documented version-targeting contract. They do not demonstrate current
server behavior, credential validity, or a real deployment. Those require a
later explicitly authorized controlled run. Preserve any failed or incomplete
evidence instead of labeling it a production PASS.

## Protected release preflight

Before proposing delivery, bind the exact commit/tree or frozen uncommitted
candidate, complete changed-file inventory, and applicable independent QA to the
accepted cumulative baseline. Run behavior-matched checks, the production build,
and governance/maintenance validation as applicable.

HC-249 is historical acceptance for its exact candidate. Later hardening and
workflow changes require their own exact diff/regression proof; HC-289 remains
the separate cumulative-candidate gate. Never claim the original HC-249 SHA is
the final deployed SHA after a later commit.

Protected-main PR checks, independent acceptance, and explicit Owner delivery
authorization are separate gates. A local implementation approval does not
authorize staging, commits, push, PR creation, merge, deployment, or publication.
Read-only preflight cannot imply these permissions. A PR merge may trigger the
existing production workflow and separate Linear issue-status automation;
check the authorized delivery plan before merging.

## Manual formal-version promotion

Only after independent cumulative-candidate acceptance and separate exact
delivery authorization:

1. Verify the protected-main deployment actually succeeded, retain the Actions
   run and Linear deployment receipt, and smoke-test the real production site.
2. Match the production artifact's full SHA to the independently reviewed final
   candidate. Any later CI-only commit needs independent release-regression
   review; use the actual final deployed SHA.
3. Obtain explicit product-version authorization, then create the approved
   annotated tag at that exact production SHA and publish a curated GitHub
   Release. Treat published version tags as immutable in intent.
4. Separately review one version-level Linear Release Note covering the exact
   set/range of successful Continuous releases. Do not create another
   Continuous deployment record with the product version.

On failed authorization, QA, SHA matching, or production smoke, stop before
promotion. A local green build, merged PR, or successful Linear sync alone does
not establish product release readiness.

## Rollback and editorial publication

Rollback requires an explicit Owner decision and the existing protected delivery
process. Preserve the failed run, successful deployment history, actual recovery
SHA, and synchronization debt. Do not move a published tag, rewrite old records,
or present rollback as never having deployed the original candidate. A new
revert commit has its own full-SHA deployment identity.

Recent News remains separately curated repository content under its existing
publication contract. It is not an automatic feed from deployments or releases.
After actual product promotion and smoke verification, a separately approved
editorial change may announce real visitor benefits using the authentic release
date, stable identity, verified bilingual copy, and real links. That later
editorial change has its own deployment; the original tagged SHA need not
announce its own future publication. Internal design, CI, or agent-governance
changes alone are not a Website launch announcement.

## Supporting contracts

- [Maintenance logging policy](../.agents/rules/maintenance-logging.md)
- [Publication contract](CONTENT_PUBLICATION_CONTRACT.md)
- [Pinned Linear action inputs and version targeting](https://github.com/linear/linear-release-action/blob/d4af10092984f9bc6d5efa075b242bdf01333463/README.md)
- [Pinned CLI synchronization implementation](https://github.com/linear/linear-release/blob/28cdc75530cf9667b410b685652cc0c3b7f0b50b/src/index.ts)
- [GitHub job rerun semantics](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)
