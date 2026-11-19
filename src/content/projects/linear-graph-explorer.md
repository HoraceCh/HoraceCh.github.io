---
title: Linear Graph Explorer
description: A read-only Linear team and project explorer with milestone dashboards, dependency graphs, and comment-based review intelligence, using per-user OAuth.
id: linear-graph-explorer
slug: linear-graph-explorer
published: true
date: 2026-11-19
status: in-progress
category: Developer Tools
role: Project owner and maintainer
timeframe: November 2026-present
portfolioArea: other
maturity: portfolio-ready
visibility: public
order: 3
stack:
  - React 19
  - TypeScript
  - Vite 7
  - React Flow
  - ELKjs
tools:
  - Linear GraphQL API
  - OAuth 2.0 with PKCE
  - React Flow
  - ELKjs
  - Vitest
  - Playwright
problem: Tasks, dependency chains, milestones, and review decisions are difficult to understand together from conventional issue lists, especially across teams with different permissions.
contribution: Led development and release of a read-only Linear explorer that combines team selection, project workspaces, dependency and hierarchy visualizations, and locally configurable review rules.
outcome: Released v0.3.3 with Vercel production and a published GitHub Pages fallback. Authentication is per user and the tool does not write to Linear; genuine two-reviewer approval evidence remains a documented validation limit.
evidence:
  - label: Vercel primary application
    url: https://linegraph.vercel.app/
    type: demo
  - label: GitHub Pages fallback application
    url: https://horacech.github.io/Linear-Gragh-Explorer/
    type: demo
  - label: Vercel short alias (redirect)
    url: https://lgraph.vercel.app/
    type: demo
  - label: Vercel project alias (redirect)
    url: https://linear-graph-explorer.vercel.app/
    type: demo
  - label: Public source repository
    url: https://github.com/HoraceCh/Linear-Gragh-Explorer
    type: repository
  - label: v0.3.3 release
    url: https://github.com/HoraceCh/Linear-Gragh-Explorer/releases/tag/v0.3.3
    type: documentation
  - label: Deployment and access documentation
    url: https://github.com/HoraceCh/Linear-Gragh-Explorer/blob/main/docs/DUAL-DEPLOYMENT.md
    type: documentation
tags:
  - Linear
  - Project management
  - Dependency graphs
  - React Flow
  - TypeScript
featured: true
links:
  github: https://github.com/HoraceCh/Linear-Gragh-Explorer
  demo: https://linegraph.vercel.app/
---

## Purpose

Linear Graph Explorer makes task relationships easier to inspect in a team workspace. It uses each person's own **read-only Linear authorization** to discover accessible teams, browse projects and milestones, and navigate task hierarchies and blocking dependencies. It is a visualization and review-assistance tool, **not** a replacement for Linear or a system that can approve or modify tasks.

## What the application provides

- **Team-aware exploration:** discover teams, select a team, and synchronize its current tasks and relationships. Switching teams clears the previous team's working view.
- **Project workspace:** inspect project status distribution, milestone progress, workload indicators, task groups, and scoped task lists.
- **Graph views:** explore parent/child hierarchies, directed `Blocks` dependencies, progressive one-hop focus, and a combined view with optional relationship types.
- **Readable layouts:** React Flow interaction, ELK-based orthogonal dependency routing, zoom and pan controls, and a configurable minimap.
- **Review intelligence:** summarize explicitly marked review comments for the confirmed current review round, using browser-local role and reviewer rules. The review queue can show pending or indeterminate decisions, including *Unable to assess*; it cannot confer approval or write to Linear.
- **Portable local preferences:** import and export team-specific display and review configurations. These are not automatically shared among users or website origins.

## All public website entrances

There are **two distinct public deployment destinations** and **two redirect aliases**:

1. **Primary Vercel application:** [linegraph.vercel.app](https://linegraph.vercel.app/).
2. **GitHub Pages fallback:** [horacech.github.io/Linear-Gragh-Explorer/](https://horacech.github.io/Linear-Gragh-Explorer/).
3. **Short Vercel alias:** [lgraph.vercel.app](https://lgraph.vercel.app/) — HTTP 308 redirect to the primary Vercel address.
4. **Vercel project-name alias:** [linear-graph-explorer.vercel.app](https://linear-graph-explorer.vercel.app/) — HTTP 308 redirect to the same primary address.

The actual source repository is named **`Linear-Gragh-Explorer`** (including this spelling), so the GitHub Pages path uses `Gragh`, not `Graph`. All four links above are deliberate public website entrances; the alias URLs are not separate builds.

For source and release evidence, see the [GitHub repository](https://github.com/HoraceCh/Linear-Gragh-Explorer), the [v0.3.3 release](https://github.com/HoraceCh/Linear-Gragh-Explorer/releases/tag/v0.3.3), and the [dual-deployment documentation](https://github.com/HoraceCh/Linear-Gragh-Explorer/blob/main/docs/DUAL-DEPLOYMENT.md). The existing owner-private development preview is intentionally not published as a public entry point.

## Security and permissions

Users connect with their **own Linear accounts** through OAuth with PKCE and read scope. Data returned by Linear is filtered and revalidated against the selected Team; references crossing a team boundary are shown only as anonymous boundary placeholders rather than followed into another team's data.

Tokens and issue snapshots remain in application memory rather than persistent browser storage. Browser-local settings may include team, member, and label identifiers, so exported configuration should be handled as private data and not committed publicly. Each deployment origin has its own browser configuration and OAuth callback.

Read-only workspace authorization is not a promise that the selected team is the sole team the provider can authorize. The application enforces an additional selected-team boundary; the user's existing Linear permissions remain decisive.

## Release status and limitations

Version **v0.3.3** was released on **19 November 2026**. Its public release notes report acceptance of two-account Private Team permission-difference testing and passing deployment/security checks. The current release covers project and graph navigation, not automatic project planning or editing.

Real approval by two distinct reviewers within one confirmed review round remains dependent on naturally occurring, qualifying review evidence. The UI must not treat a missing review history, ambiguous comment, or locally configured rule as a verified approval. No critical-path duration estimate is claimed by the dependency graph.

The Vercel production deployment and GitHub Pages publish workflow have succeeded for the release; this portfolio description does not independently certify every user's browser, Linear workspace, OAuth configuration, or network route.
