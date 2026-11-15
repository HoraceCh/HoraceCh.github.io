# HoraceCh.github.io

> Source repository for [Horace Chan's personal website](https://horacech.github.io/) — a personal portfolio and public knowledge garden documenting engineering work, robotics interests, and technical learning.

[![Deploy to GitHub Pages](https://github.com/HoraceCh/HoraceCh.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/HoraceCh/HoraceCh.github.io/actions/workflows/deploy.yml)
![Astro 7](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![Node.js 24.14.1](https://img.shields.io/badge/Node.js-24.14.1-339933?logo=node.js&logoColor=white)
[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-6f42c1)](./LICENSE)

**[Visit the live website](https://horacech.github.io/)** · [GitHub profile](https://github.com/HoraceCh) · [Projects](https://horacech.github.io/projects/) · [Notes](https://horacech.github.io/notes/)

## Project Overview

This repository contains the source code, content collections, static assets, and maintenance documentation for my personal website.

The site is built with **Astro**, generated as a static website, and deployed to **GitHub Pages**. It brings together a concise personal and engineering profile with public project records and selected learning notes.

The main topics represented on the site include mechanical engineering, robotics, embodied AI, Vision-Language-Action (VLA) models, robot control, and AI-assisted research workflows. Project and note entries may document work in progress; they are not all presented as completed engineering outcomes.

## Explore the Website

| Section | What you can find |
| --- | --- |
| [Home](https://horacech.github.io/) | Personal introduction, current focus, and selected work |
| [About](https://horacech.github.io/about/) | Background, skills, research interests, and direction |
| [Projects](https://horacech.github.io/projects/) | Public engineering projects, tools, and learning systems, with status and maturity labels |
| [Notes](https://horacech.github.io/notes/) | Public learning notes organized into collections, modules, and topic-based indexes |
| [Search](https://horacech.github.io/search/) | English and Simplified Chinese search across public projects and notes |
| [Resume](https://horacech.github.io/resume/) | A concise academic and engineering profile |

## Key Features

- **Project portfolio** — structured project entries with publication metadata, evidence links, categories, and explicit status or maturity labels.
- **Knowledge Garden** — selected notes exported from Obsidian Publish, with browsing by collection, module, category, learning path, tag, note type, and status.
- **Focused note reader** — a static reading experience with heading outline, backlinks, readable code blocks, and code-copy controls.
- **Bilingual site search** — build-time [Pagefind](https://pagefind.app/) indexes for English and Simplified Chinese content.
- **Light and dark themes** — theme-aware site styling across the main pages and reading experience.
- **Static deployment** — the production site is built into `dist/` and published through GitHub Actions and GitHub Pages.

The Notes area is a static publishing and discovery layer inspired by parts of an Obsidian workflow. It is not a full Obsidian clone and does not execute Dataview or DataviewJS content.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Site framework | [Astro 7](https://astro.build/) |
| Content | Astro Content Collections, Markdown, and MDX |
| Search | [Pagefind](https://pagefind.app/) |
| Languages | TypeScript and JavaScript |
| Hosting | GitHub Pages |
| Automation | GitHub Actions |

The repository pins its development toolchain in `mise.toml`:

- Node.js `24.14.1`
- npm `11.19.1`
- Python `3.11.x` for repository tooling and CI

## Getting Started

### Prerequisites

Use the versions declared in `mise.toml`, or install the matching Node.js and npm versions manually. If you use [mise](https://mise.jdx.dev/), install the repository toolchain with:

```bash
mise install
```

### Run locally

```bash
git clone https://github.com/HoraceCh/HoraceCh.github.io.git
cd HoraceCh.github.io

npm ci
npm run dev
```

Astro will print the local development URL in the terminal.

### Build and preview

```bash
npm run build
npm run preview
```

The build generates the static website in `dist/` and creates the Pagefind search indexes. Run `npm run preview` after a successful build to inspect the production output locally.

For additional maintenance guidance, see [Development Guide](docs/DEVELOPMENT.md).

## Content Workflow

### Projects

Project entries are authored in `src/content/projects/` and validated through the Astro content schema. Their metadata controls public visibility, grouping, status, maturity, and links to supporting evidence.

### Notes

Public Notes are synchronized from an explicitly selected **Obsidian Publish folder** into `src/content/notes/`. The configured local workflow is:

1. Copy `notes.publish.example.json` to `notes.publish.local.json`.
2. Set the local Publish-folder and vault paths in the local config.
3. Run a dry run and review the planned changes:

   ```bash
   npm run notes:publish:dry
   ```

4. Only after reviewing the output, run the publish command:

   ```bash
   npm run notes:publish
   ```

**Publishing boundary:** the `--source` path is the only directory scanned for Markdown files to publish. The `--vault` path is only an auxiliary location for resolving linked attachments and paths; it must not be used as the publishing source. Keep `notes.publish.local.json` and private vault content local.

See [Obsidian Notes Sync](docs/OBSIDIAN_NOTES_SYNC.md) for the complete workflow, options, warnings, and safety boundaries.

## Repository Structure

```text
src/
├── pages/                  Astro routes
├── components/             Reusable UI components
├── layouts/                Shared page layouts
├── content/
│   ├── projects/           Authored project entries
│   └── notes/              Notes synchronized from the approved Publish source
├── data/                   Structured content and publication data
├── scripts/                Browser-side interactions and search
└── styles/                 Global and component styles

astro-public/               Static assets served by Astro
docs/                       Development, architecture, and content documentation
tools/                      Content synchronization and maintenance scripts
tests/                      Automated tests
.github/workflows/          Pull-request validation and deployment workflows
```

Astro's public asset directory is configured as `astro-public/` in `astro.config.mjs`.

## CI and Deployment

- **Pull requests to `main`** run the validation workflow, which installs dependencies, builds the site, and runs automated tests.
- **Pushes to `main`** trigger the GitHub Pages deployment workflow.
- The deployment workflow builds the site and publishes the generated `dist/` output through the GitHub Pages environment.

Generated build output is not maintained as source content; update the source files and let the workflow produce the deployment artifact.

## Further Documentation

- [Development Guide](docs/DEVELOPMENT.md)
- [Content Publication Contract](docs/CONTENT_PUBLICATION_CONTRACT.md)
- [Obsidian Notes Sync](docs/OBSIDIAN_NOTES_SYNC.md)
- [Obsidian Notes Feature Matrix](docs/OBSIDIAN_FEATURE_MATRIX.md)

## Licensing

This repository uses **separate licenses for different kinds of material**. No single license applies to every file.

| Material | License / permission |
| --- | --- |
| Original Horace Website software source code authored and controlled by Horace Chan | [PolyForm Noncommercial License 1.0.0](./LICENSE) |
| Public Knowledge Garden content synchronized from Obsidian Publish | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| Personal profile and portfolio materials, including biography, résumé, portraits, photographs, project descriptions, awards, and personal media | All rights reserved unless a file-specific notice or separate written permission says otherwise |
| Third-party code, components, fonts, icons, images, media, and other assets | Their respective upstream licenses and notices |

### Website source code

The original website source code is available for permitted **noncommercial** purposes under PolyForm Noncommercial 1.0.0. The license permits qualifying noncommercial use, modification, and distribution subject to its terms. **Commercial use is not granted.** Personal study, research, experiments, hobby projects, and qualifying educational or public-research uses are described in the license itself.

This is a source-available, noncommercial license, not an OSI-approved Open Source license. Public repository access, viewing, cloning, or forking does not grant commercial rights. For the full terms and the exact source-code scope, see [LICENSE](./LICENSE) and the [license and attribution index](docs/licenses/README.md).

### Content and third-party materials

CC BY-NC-SA 4.0 applies to the public Knowledge Garden content identified above; it does not relicense third-party excerpts or materials embedded in that content. Personal profile and portfolio materials are not included in the source-code license. Third-party components and assets retain their own terms; see the [license and attribution index](docs/licenses/README.md).

GitHub may identify PolyForm Noncommercial as **Other** rather than display its full name in repository metadata. The badge and this section identify the actual license; the full terms in [LICENSE](./LICENSE) remain authoritative.
