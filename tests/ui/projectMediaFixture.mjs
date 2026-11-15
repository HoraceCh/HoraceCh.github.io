import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('.npm-cache/hc242-media-fixture');
if (fs.existsSync(root)) throw new Error('Refusing to overwrite fixture evidence');
const pages = path.join(root, 'src/pages');
fs.mkdirSync(pages, { recursive: true });
const relative = file => path.relative(pages, path.resolve(file)).replaceAll('\\', '/');
fs.writeFileSync(path.join(root, 'astro.config.mjs'), 'export default {output:"static", publicDir:' + JSON.stringify(path.resolve('astro-public')) + '};');
for (const theme of ['light', 'dark']) {
  const source = [
    '---',
    "import ProjectCard from '" + relative('src/components/ProjectCard.astro') + "';",
    "import { getProjectMedia } from '" + relative('src/data/projectMedia.ts') + "';",
    "import '" + relative('src/styles/global.css') + "';",
    'const props = {title:"HC-242 LABEL STRESS FIXTURE / VeryLongUnbrokenTechnicalLabelForResponsiveReflow / 中文排版检查", description:"Non-public component verification with the actual title and independent GitHub, Demo and Notes links. No portfolio claim.", status:"in-progress", category:"Long category / Engineering and academic research workflow label", maturity:"learning-system", tags:["Long unbroken tag / TechnicalDocumentationVerification"], href:"/projects/ai-retrieval-tool/", links:{github:"https://github.com/HoraceCh/Information-Retrieval-Tool",demo:"https://github.com/HoraceCh/26-EngBot",notes:"/notes/ai-assisted-literature-workflow/"}};',
    '---',
    '<!doctype html><html lang="en" class="' + (theme === 'dark' ? 'dark' : '') + '"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>HC-242 nonpublic component states</title></head><body><main class="site-shell projects-index">',
    '<h1>Nonpublic HC-242 component states</h1><p>LABEL STRESS FIXTURE. Destinations verify link mechanics only.</p>',
    '<section id="default"><h2>Default consumer with supplied media stays text-only</h2><ProjectCard {...props} media={getProjectMedia("ai-retrieval-tool")} /></section>',
    '<section id="denied"><h2>Opt-in without an admitted mapping stays text-only</h2><ProjectCard {...props} variant="browse-media" media={getProjectMedia("robotic-arm-mechanical-design")} /></section>',
    '<section id="retrieval"><h2>Approved Retrieval family / three independent resources</h2><ProjectCard {...props} variant="browse-media" media={getProjectMedia("ai-retrieval-tool")} /></section>',
    '<section id="rm26"><h2>Approved RM26 family</h2><ProjectCard {...props} variant="browse-media" media={getProjectMedia("robomaster-2026-engineering-robot")} /></section>',
    '</main></body></html>',
  ].join('\n');
  fs.writeFileSync(path.join(pages, theme + '.astro'), source);
}
console.log(root);
