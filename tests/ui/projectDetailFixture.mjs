import fs from 'node:fs';
import path from 'node:path';

export function createDetailFixture(root) {
  const pages = path.join(root, 'src/pages');
  fs.mkdirSync(pages, { recursive: true });
  const relative = file => path.relative(pages, path.resolve(file)).replaceAll('\\', '/');
  fs.writeFileSync(path.join(root, 'astro.config.mjs'), 'export default {site:"https://horacech.github.io",output:"static",publicDir:' + JSON.stringify(path.resolve('astro-public')) + '};');
  const evidence = ['repository', 'demo', 'documentation', 'image', 'note', 'other'].map((type, i) => ({
    label: i === 0 ? 'LABEL ONLY / VeryLongUnbrokenTechnicalEvidenceLabelForResponsiveReflow / 中文技术资料与研究记录' : `LABEL ONLY / ${type}`,
    url: i % 2 ? '/notes/ai-assisted-literature-workflow/' : 'https://github.com/HoraceCh/Information-Retrieval-Tool', type,
  }));
  const unsafe = ['javascript:alert(1)', 'data:text/html,bad', '//example.com', 'https://', '/\\example.com', '/bad\npath', 'mailto:foo@example.com', 'https://[bad', 'relative/path'];
  for (const theme of ['light', 'dark']) {
    const source = [
      '---',
      `import ProjectFigure from '${relative('src/components/projects/ProjectFigure.astro')}';`,
      `import ProjectDetailTags from '${relative('src/components/projects/ProjectDetailTags.astro')}';`,
      `import ProjectEvidence from '${relative('src/components/projects/ProjectEvidence.astro')}';`,
      `import { getProjectMedia } from '${relative('src/data/projectMedia.ts')}';`,
      `import '${relative('src/styles/global.css')}';`,
      `const evidence = ${JSON.stringify(evidence)};`,
      `const unsafe = ${JSON.stringify(unsafe)}.map(url => ({label:'UNSAFE LABEL ONLY',url,type:'other'}));`,
      'const images = [getProjectMedia("ai-retrieval-tool"),getProjectMedia("robomaster-2026-engineering-robot")].filter(Boolean);',
      '---',
      `<!doctype html><html lang="en" class="${theme === 'dark' ? 'dark' : ''}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>HC-246 nonpublished component fixture</title></head><body><main class="site-shell"><article class="article project-detail">`,
      '<h1 class="type-project-entity-title">LABEL ONLY / VeryLongUnbrokenProjectTitleForResponsiveReflow / 中文研究与工程证据</h1><p>Nonpublished component fixture. Labels test wrapping only; no project, evidence or verification claim.</p>',
      '<ProjectDetailTags tags={["RoboMaster", "mechanical design", "robot integration", "VeryLongUnbrokenInformationalTagForWrapping / 中文技术标签"]} />',
      '<section id="zero"><h2>Zero media and evidence</h2><ProjectEvidence evidence={[]} /></section>',
      '<section id="single"><h2>Single media and evidence</h2>{images.slice(0,1).map(media => <ProjectFigure media={media} />)}<ProjectEvidence evidence={evidence.slice(0,1)} /></section>',
      '<section id="multiple"><h2>Multiple sequential figures and all evidence types</h2>{images.map(media => <ProjectFigure media={media} />)}<ProjectEvidence evidence={evidence} /></section>',
      '<section id="unsafe"><h2>All unsafe destinations omitted</h2><ProjectEvidence evidence={unsafe} /></section>',
      '<section id="mixed"><h2>Unsafe items omit only themselves</h2><ProjectEvidence evidence={[...unsafe,evidence[0],{label:"Same-site absolute LABEL ONLY",url:"https://horacech.github.io/projects/",type:"documentation"}]} /></section>',
      '</article></main></body></html>',
    ].join('\n');
    fs.writeFileSync(path.join(pages, `${theme}.astro`), source);
  }
}
