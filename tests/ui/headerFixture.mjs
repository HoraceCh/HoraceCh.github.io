import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const root = path.resolve(option('--output', '.npm-cache/hc235-fixture-01'));
const projectRoot = process.cwd();

if (args.includes('--serve')) {
  const port = Number(option('--port', '4334'));
  const roots = [path.join(root, 'dist'), path.resolve('dist')];
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
  http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400).end(); return; }
    for (const output of roots) {
      let candidate = path.resolve(output, '.' + pathname);
      if (candidate !== output && !candidate.startsWith(output + path.sep)) continue;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) candidate = path.join(candidate, 'index.html');
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;
      res.writeHead(200, { 'Content-Type': types[path.extname(candidate)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(candidate));
      return;
    }
    res.writeHead(404).end('Missing HC-235 verification resource');
  }).listen(port, '127.0.0.1', () => console.log(`HC-235 read-only verification: http://127.0.0.1:${port}/hc235-light/`));
} else {
  if (!root.startsWith(path.resolve('.npm-cache') + path.sep)) throw new Error('Fixture output must stay inside this checkout .npm-cache');
  if (fs.existsSync(root)) throw new Error('Refusing to overwrite an existing fixture output');
  const pages = path.join(root, 'src/pages');
  fs.mkdirSync(pages, { recursive: true });
  const relative = file => path.relative(pages, path.resolve(file)).replaceAll('\\', '/');
  // Reuse committed admission records: id, destination, url, width, height and alt.
  // Historical source/path fields describe provenance, not fixture inputs.
  const assets = JSON.parse(fs.readFileSync('docs/design/home-v2/integration/asset-admission.json', 'utf8'));
  const content = JSON.parse(fs.readFileSync('src/data/home-v2.json', 'utf8'));
  const media = {};
  const imageRoot = path.join(root, 'public/images/home');
  fs.mkdirSync(imageRoot, { recursive: true });
  for (const record of assets) {
    if (!['rm26-robot', 'ai-retrieval-ui'].includes(record.id) && !path.basename(record.path).startsWith('owner-approved-')) continue;
    fs.copyFileSync(record.destination, path.join(imageRoot, path.basename(record.destination)));
  }
  for (const [id, assetId] of [['robomaster-2026-engineering-robot', 'rm26-robot'], ['ai-retrieval-tool', 'ai-retrieval-ui']]) {
    const records = assets.filter(item => item.id === assetId);
    const largest = records.find(item => item.width === 1200);
    if (!largest) throw new Error(`Missing reviewed asset: ${assetId}`);
    media[id] = { src: '/images/home/' + path.basename(largest.path), width: largest.width, height: largest.height, alt: largest.alt,
      srcset: records.map(item => '/images/home/' + path.basename(item.path) + ' ' + item.width + 'w').join(', ') };
  }
  const config = fs.readFileSync('src/content.config.ts', 'utf8');
  const projects = config.slice(config.indexOf('const projects ='), config.indexOf('export const collections'))
    .replace("'./src/content/projects'", JSON.stringify(pathToFileURL(path.resolve('src/content/projects') + path.sep).href));
  fs.writeFileSync(path.join(root, 'src/content.config.ts'), "import { defineCollection, z } from 'astro:content';\nimport { glob } from 'astro/loaders';\n" + projects + '\nexport const collections = { projects };\n');
  fs.writeFileSync(path.join(root, 'astro.config.mjs'), `export default { output: 'static', vite: { server: { fs: { allow: [${JSON.stringify(projectRoot)}] } } } };\n`);
  const older = Array.from({ length: 3 }, (_, index) => ({ id: `hc235-nonpublic-${index}`, date: `2020-01-0${index + 1}`,
    en: 'NONPUBLIC REFLOW TEST. Long mixed-language event / 中文长文本排版检查。 '.repeat(4), zh: '非公开重排测试', links: [{ label: 'Notes archive', href: '/notes/archive/' }] }));
  for (const theme of ['light', 'dark']) {
    const imports = [['Header', 'src/components/Header.astro'], ['Hero', 'src/components/home/EditorialHero.astro'], ['News', 'src/components/home/RecentNews.astro'], ['Works', 'src/components/home/SelectedWorks.astro'], ['Honors', 'src/components/home/HonorsIndex.astro'], ['Footer', 'src/components/home/EditorialFooter.astro'], ['SearchDialog', 'src/components/SearchDialog.astro']]
      .map(([name, file]) => `import ${name} from '${relative(file)}';`).join('\n');
    fs.writeFileSync(path.join(pages, `hc235-${theme}.astro`), `---
${imports}
import { getCollection } from 'astro:content';
import { createProjectPublicationModel } from '${relative('src/utils/projectPublication.ts')}';
import '${relative('src/styles/global.css')}';
import '${relative('src/styles/home-v2.css')}';
const model = createProjectPublicationModel(await getCollection('projects'));
const news = ${JSON.stringify([...content.news])};
const honors = ${JSON.stringify(content.honors)};
const ids = ${JSON.stringify(content.workIds)};
const media = ${JSON.stringify(media)};
---
<!doctype html><html lang="en" class="${theme === 'dark' ? 'dark' : ''}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex,nofollow" /><title>HC-235 reproducible Home / Shared Shell reflow</title></head><body>
<a class="skip-link" href="#main-content">Skip to content</a><div class="site-shell"><Header homeV2 /></div><main id="main-content" class="home-v2">
<Hero portrait={{maskSrc:"/images/home/owner-approved-alpha-mask-768.webp",src:"/images/home/owner-approved-ink-portrait-768.webp",width:768,height:960,alt:"Horace Chan, owner-approved color ink portrait.",srcset:"/images/home/owner-approved-ink-portrait-480.webp 480w, /images/home/owner-approved-ink-portrait-768.webp 768w",sizes:"(max-width: 620px) 240px, 600px"}} />
<News entries={news} /><Works model={model} ids={ids} media={media} /><Honors entries={honors} /></main><Footer /><SearchDialog />
<p>Nonpublic HC-235 verification. Actual Header and Home components; test-only older events are labelled. Production assembly remains separate.</p>
<pre id="hc235-measurements" style="white-space:pre-wrap;overflow-wrap:anywhere">Waiting for nonpublic viewport measurements.</pre>
<script is:inline>
function recordViewport() {
  const root = document.documentElement;
  const measurements = {
    sampledAt: new Date().toISOString(),
    url: location.href,
    cssInnerWidth: innerWidth,
    cssInnerHeight: innerHeight,
    cssClientWidth: root.clientWidth,
    cssScrollWidth: root.scrollWidth,
    devicePixelRatio,
    outerWidth,
    outerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    visualViewportWidth: visualViewport?.width ?? null,
    visualViewportScale: visualViewport?.scale ?? null,
    warning: 'CSS/window metrics only. DPR includes platform scaling and does not independently prove native zoom or physical window width.'
  };
  document.getElementById('hc235-measurements').textContent = JSON.stringify(measurements, null, 2);
}
addEventListener('resize', recordViewport);
recordViewport();
</script>
</body></html>`);
  }
  console.log(`Created independent HC-235 fixture source at ${root}; no historical output overwritten.`);
}
