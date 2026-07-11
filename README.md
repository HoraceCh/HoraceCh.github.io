# HoraceCh.github.io

This repository contains the source code for **Horace Chan**'s personal website.

Website: <https://HoraceCh.github.io>

The site focuses on Mechanical Engineering, AI-assisted workflows, VLA / Embodied AI, Robotics, and Robot Control.

## Technical Stack

- Astro static site
- Astro Content Collections for projects and notes
- GitHub Pages via GitHub Actions

Astro is the active site system.

## Development

Run the Astro site locally:

```bash
npm run dev
```

Build the Astro site:

```bash
npm run build
```

Sync notes from an Obsidian Publish folder:

```bash
npm run notes:sync:dry -- --source "D:\Path\To\Obsidian Publish" --vault "D:\Path\To\Obsidian Vault"
```

For the configured local publish-folder workflow, copy `notes.publish.example.json` to the ignored `notes.publish.local.json`, set local paths, then run `npm run notes:publish:dry` before `npm run notes:publish`.

See [Obsidian Notes Sync 使用说明](docs/OBSIDIAN_NOTES_SYNC.md) for the full workflow and safety notes.

Preview the Astro build:

```bash
npm run preview
```

GitHub Pages deployment builds Astro and uploads `dist/`. Astro static assets are served from `astro-public/`.

## Content License

Syncing Knowledge Garden Content licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

This is the website content license only; it does not apply to repository source code or theme code.
