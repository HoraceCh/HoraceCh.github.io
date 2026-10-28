import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('native disclosure exposes all accepted Home destinations and unchanged unique component targets', async () => {
  const html = await readFile('.npm-cache/hc235-fixture-01/dist/hc235-light/index.html','utf8');
  assert.match(html, /<details[^>]*class="hc-header__disclosure"/);
  assert.match(html, /<summary[^>]*aria-controls="header-mobile-navigation"/);
  for (const id of ['recent-news','selected-works','honors']) {
    assert.equal((html.match(new RegExp('id="'+id+'"','g')) ?? []).length,1);
    assert.equal((html.match(new RegExp('id="'+id+'-heading"','g')) ?? []).length,1);
    assert.match(html,new RegExp('href="#'+id+'"[^>]*data-header-region'));
  }
  assert.match(html, /href="\/search\/"[^>]*data-search-trigger/);
  assert.match(html,/aria-label="Horace Chan — Home"/);
});
test('legacy Home and internal pages never opt into Home region links or clear-top state', async () => {
  for (const page of ['dist/index.html','dist/about/index.html','dist/notes/archive/index.html']) {
    const html=await readFile(page,'utf8');
    assert.doesNotMatch(html,/<header[^>]*data-home-v2="true"|<a[^>]*data-header-region/);
  }
  const notes=await readFile('dist/notes/archive/index.html','utf8');
  assert.match(notes,/<a href="\/notes\/" aria-current="page"/);
});
test('desktop exposes four native routes and six byte-identical brand assets survive the build', async () => {
  const html=await readFile('dist/about/index.html','utf8');
  const desktop=html.match(/<nav class="hc-header__desktop"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.deepEqual([...desktop.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),['/about/','/projects/','/notes/','/resume/']);
  for (const kind of ['mark','wordmark']) for(const theme of ['light','dark','monochrome']) {
    const file='brand/horace-refined/horace-'+kind+'-'+theme+'.svg';
    assert.deepEqual(await readFile('astro-public/'+file),await readFile('dist/'+file));
  }
});
