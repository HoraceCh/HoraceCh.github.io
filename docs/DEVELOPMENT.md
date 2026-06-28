# Development

This document is for local development and future maintenance of the Horace Chan personal website repository.

## Technical Stack

- Hexo 7
- Custom minimal theme: `themes/horace-minimal`
- GitHub Pages
- GitHub Actions

## Local Development

Install dependencies:

```bash
npm install
```

Run a local preview:

```bash
npm.cmd run dev
```

Build the site:

```bash
npm.cmd run build
```

Build the GitHub Pages output:

```bash
npm.cmd run build:pages
```

## Deployment

GitHub Actions deploys the site to GitHub Pages when changes are pushed to `main` or when the workflow is manually triggered.

The workflow installs dependencies with `npm ci`, runs `npm run build:pages`, and uploads `public/` as the GitHub Pages artifact.

## Content Structure

```text
source/
  _posts/       Blog posts and notes
  about/        Personal background
  projects/     Project categories and selected work
  resume/       Academic and engineering profile
  contact/      Contact links
  research/     Lightweight research placeholder
  links/        Resource placeholder
```

Theme files are kept in `themes/horace-minimal/`.

## Files to Commit

Commit source and configuration files, including:

```text
source/
themes/
scaffolds/
scripts/
tools/
package.json
package-lock.json
_config.yml
_multiconfig.yml
.github/workflows/deploy.yml
```

## Files Not to Commit

Do not commit generated output or local dependency directories:

```text
node_modules/
public/
db.json
.deploy_git/
.hexo-pages.yml
```
