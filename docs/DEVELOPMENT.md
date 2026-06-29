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

## Theme Color Modes

The custom theme keeps light and dark mode support in `themes/horace-minimal/source/css/main.css`. New page, card, link, code, and Markdown styles should use the existing CSS variables and the `@media (prefers-color-scheme: dark)` block instead of hard-coded light backgrounds or text colors. Manual theme selection is stored in `localStorage` under `horace-theme` and applied through `html[data-theme]`; removing the stored value returns the site to automatic system-theme mode. The header button intentionally shows only a light/dark icon action, while automatic mode remains the default when no manual selection is stored.

## Home Page Structure

The home page is defined by `themes/horace-minimal/layout/index.ejs` and the `profile` data in `_config.yml`. Its current structure borrows the information hierarchy of the HoraceCh GitHub Profile README--hero intro, focus tags, featured project, skills, and site sections--while keeping the custom minimal theme's background, spacing, and color variables.

## Content License

The public site content license is controlled by `content_license` in `_config.yml` and visibly rendered by `themes/horace-minimal/layout/partial/footer.ejs` in the footer copyright line:

`© 2026 Horace Chan. Syncing Knowledge Garden Content licensed under CC BY-NC-SA 4.0.`

`CC BY-NC-SA 4.0` links to <https://creativecommons.org/licenses/by-nc-sa/4.0/>. This is the website content license only; it is not the source-code or theme license.

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
  links/        Friends / Links page for confirmed friend links and stable resources
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
