import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile('dist/resume/index.html', 'utf8');
const article = html.match(/<article class="identity-page resume-page">([\s\S]*?)<\/article>/)?.[1];
const text = value => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

test('Resume preserves exact approved C2 facts, limitations and all four team honors in reading order', () => {
  assert.ok(article);
  assert.deepEqual([...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([,value]) => text(value)), ["Resume","Robotics Engineering undergraduate","Undergraduate study in Robotics Engineering.","Solo developer · In progress","Designed and implemented a TypeScript/Vite tool that drafts Boolean search queries for academic databases.","Examples, evaluation notes, and limitations are still being documented. No retrieval-quality benchmark or database-coverage guarantee is claimed.","Core team member · Documentation in progress","Contributed to wheel design, assembly, and robot integration. Competition participation is complete; engineering documentation remains in progress.","The team’s wider firmware and engineering artifacts are not presented as my individual work.","SolidWorks, mechanical design, wheel design, assembly, and robot integration.","TypeScript, Vite, and academic query-workflow design.","Embodied AI, Vision-Language-Action models, robot control, and AI-assisted research workflows.","Team honors; participation roles are retained with each record.","2026-08 · 国家级三等奖 · 团队（主力队员）","全国大学生机器人大赛组织委员会","2026-06 · 省部级二等奖 · 团队（主力队员）","全国大学生机器人大赛组织委员会","2026-06 · 省部级二等奖 · 团队（队长）","北京地区高等学校图书馆工作委员会、北京市高等教育学会图书馆工作研究分会","2026-06 · 省级三等奖 · 团队（成员）","共青团北京市委员会、北京市教育委员会等六家联合主办单位"]);
  assert.deepEqual([...article.matchAll(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/g)].map(([,level,value]) => [level,text(value)]), [["1","HAO CHEN"],["2","Education"],["2","Selected projects and contributions"],["3","AI_RETRIEVAL_X / Information-Retrieval-Tool"],["3","RoboMaster 2026 Engineering Robot"],["2","Skills used in projects"],["3","Mechanical practice"],["3","Software practice"],["2","Current learning"],["2","Honors"],["3","第二十五届全国大学生机器人大赛 RoboMaster 2026 机甲大师超级对抗赛全国赛三等奖"],["3","第二十五届全国大学生机器人大赛 RoboMaster 2026 机甲大师超级对抗赛区域赛（东部赛区）二等奖"],["3","2026年“智信杯”第四届北京市大学生“AI+信息素养”大赛本科生赛道二等奖"],["3","“青创北京”2026年“挑战杯”首都大学生创业计划竞赛“揭榜挂帅”机制专项赛三等奖（铜奖）"]]);
  assert.equal((article.match(/lang="zh-CN"/g) || []).length, 4);
  assert.deepEqual([...article.matchAll(/<time datetime="([^"]+)"/g)].map(([,value]) => value), ['2026-08', '2026-06', '2026-06', '2026-06']);
  assert.doesNotMatch(article, /China University|GPA|Horace Chen|Mechanical Engineering|optimized|proficien|download|<script|<form|<iframe|astro-island/i);
});

test('Resume provides exact native project and contact links without a download control', () => {
  assert.deepEqual([...article.matchAll(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map(([,href,label]) => [href,text(label)]), [["mailto:horacebuddle@gmail.com","horacebuddle@gmail.com"],["https://github.com/HoraceCh","GitHub · HoraceCh"],["/projects/ai-retrieval-tool/","AI_RETRIEVAL_X / Information-Retrieval-Tool"],["/projects/robomaster-2026-engineering-robot/","RoboMaster 2026 Engineering Robot"]]);
  assert.doesNotMatch(article, /<button|download=|\.pdf/i);
  assert.deepEqual([...article.matchAll(/<span class="print-url">([^<]+)<\/span>/g)].map(([,value]) => value), ['github.com/HoraceCh', 'HoraceCh.github.io/projects/ai-retrieval-tool/', 'HoraceCh.github.io/projects/robomaster-2026-engineering-robot/']);
});

test('Resume metadata consistently identifies the approved current factual scope', () => {
  assert.match(html, /<title>Resume \| Horace Chan<\/title>/);
  const descriptions = [...html.matchAll(/<meta (?:name="(?:description|twitter:description)"|property="og:description") content="([^"]*)"/g)].map(([,value]) => value);
  assert.deepEqual(descriptions, Array(3).fill('Education, engineering contributions, projects, tools used, and team honors for HAO CHEN (Horace Chan).'));
  assert.match(html, /rel="canonical" href="https:\/\/horacech.github.io\/resume\/"/);
});

test('Resume keeps one semantic factual body for web and print', async () => {
  const source = await readFile('src/pages/resume.astro', 'utf8');
  const css = await readFile('src/styles/resume-v3.css', 'utf8');
  assert.equal((html.match(/<article class="identity-page resume-page">/g) || []).length, 1);
  assert.match(source, /import content from '..\/data\/home-v2.json'/);
  assert.match(source, /content.honors.map/);
  assert.match(css, /@page\s*\{\s*size:\s*auto;\s*margin:\s*14mm/);
  assert.match(css, /@media print/);
  assert.match(css, /break-inside:\s*avoid/);
  assert.match(css, /break-after:\s*avoid/);
  assert.doesNotMatch(css, /zoom:|transform:\s*scale|height:\s*\d+(?:mm|in)|max-height:/);
});
