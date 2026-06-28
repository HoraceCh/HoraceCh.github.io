import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repository = process.env.GITHUB_REPOSITORY || '';
const [repoOwner, repoNameFromRepository] = repository.split('/');
const owner = process.env.GITHUB_REPOSITORY_OWNER || repoOwner || 'your-github-username';
const repoName = process.env.GITHUB_REPOSITORY_NAME || repoNameFromRepository || 'Horace-Blog-Website';
const isUserSite = repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`;

const root = process.env.PAGES_BASE_PATH || (isUserSite ? '/' : `/${repoName}/`);
const url = process.env.PAGES_SITE_URL || (isUserSite
  ? `https://${owner}.github.io`
  : `https://${owner}.github.io/${repoName}`);

writeFileSync('.hexo-pages.yml', `url: ${url}\nroot: ${root}\n`, 'utf8');

const hexoCli = join(process.cwd(), 'node_modules', 'hexo-cli', 'bin', 'hexo');

for (const command of ['clean', 'generate']) {
  const result = spawnSync(process.execPath, [
    hexoCli,
    '--config',
    '_config.yml,.hexo-pages.yml',
    command
  ], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
