# HoraceCh.github.io

Personal website of **Horace Chan**, built with Hexo and a small custom theme named `horace-minimal`.

The site is designed as a clean academic and engineering homepage for documenting:

- Mechanical engineering background and CAD-based design work
- AI-assisted workflows for learning, research, and technical note-taking
- Vision-Language-Action Models, embodied AI, robotics, and robot control
- Projects, coursework, reading notes, and long-term learning paths

## Development

Install dependencies:

```bash
npm install
```

Run a local preview:

```bash
npm.cmd run dev
```

Build the static site:

```bash
npm.cmd run build
```

The generated site is written to `public/`, which is ignored by Git.

## Structure

```text
source/
  _posts/       Blog posts and notes
  about/        Personal background
  projects/     Project categories and selected work
  resume/       Resume placeholder
  contact/      Contact links
  research/     Lightweight research placeholder
  links/        Resource placeholder

themes/horace-minimal/
  layout/       EJS templates
  source/css/   Theme styles
  source/js/    Navigation script
```

## Deployment

GitHub Actions builds the Hexo site and deploys it to GitHub Pages when changes are pushed to `main`.

The workflow uses:

```bash
npm ci
npm run build:pages
```
