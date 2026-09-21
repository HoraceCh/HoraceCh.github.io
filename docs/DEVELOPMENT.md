# Development

This document is for local development and future maintenance of the Horace Chan personal website repository.

## Technical Stack

- Astro static site
- Astro Content Collections for projects and notes
- GitHub Pages
- GitHub Actions

## Toolchain

The repository pins its development toolchain in `mise.toml`:

- Node.js 24.14.1
- npm 11.19.1
- Python 3.11.x

Install the declared versions with [mise](https://mise.jdx.dev/):

```bash
mise install
mise exec -- node --version
mise exec -- npm --version
mise exec -- python --version
```

Shell activation is optional. Prefix commands with `mise exec --` when mise is not activated.

## Local Development

Install dependencies:

```bash
mise exec -- npm ci
```

Run a local preview:

```bash
mise exec -- npm run dev
```

Build the site:

```bash
mise exec -- npm run build
```

Preview the production build:

```bash
mise exec -- npm run preview
```

## Theme Color Modes

The active Astro UI keeps light and dark mode support in `src/styles/global.css`. New page, card, link, code, and Markdown styles should use existing CSS variables and the dark-theme rules already in that file instead of hard-coded light backgrounds or text colors.

## Home Page Structure

The home page is defined by the Astro page and components under `src/`. Keep it as a personal identity entrance, with Projects and Notes carrying deeper project and research material.

## Content License

The public site content license is rendered by the active Astro layout/footer UI:

`© 2026 Horace Chan. Syncing Knowledge Garden Content licensed under CC BY-NC-SA 4.0.`

`CC BY-NC-SA 4.0` links to <https://creativecommons.org/licenses/by-nc-sa/4.0/>. This is the website content license only; it is not the source-code or theme license.

## Deployment

GitHub Actions deploys the site to GitHub Pages when changes are pushed to `main` or when the workflow is manually triggered.

The workflows run on Ubuntu 24.04 with Node.js 24.14.1 and npm 11.19.1. Deployment installs dependencies with `npm ci`, runs `npm run build`, uploads `dist/`, and publishes through the protected GitHub Pages environment.

## Content Structure

```text
src/pages/             Astro routes
src/components/        Reusable Astro UI components
src/layouts/           Shared Astro layouts
src/content/projects/  Project content collection
src/content/notes/     Generated notes content collection
astro-public/          Static assets served by Astro
```

## Files to Commit

Commit source and configuration files, including:

```text
src/
astro-public/
docs/
tools/
package.json
package-lock.json
mise.toml
.github/workflows/deploy.yml
.github/workflows/pr-ci.yml
```

## Files Not to Commit

Do not commit generated output or local dependency directories:

```text
node_modules/
dist/
db.json
```
