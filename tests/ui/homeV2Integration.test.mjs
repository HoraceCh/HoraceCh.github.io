import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import { mountScrollCue } from '../../src/scripts/homeScrollCue.ts';

const html = fs.readFileSync('dist/index.html', 'utf8');
test('actual Home composes unique regions, one H1 and one Footer with real content', () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.equal((html.match(/<footer[\s>]/g) ?? []).length, 1);
  let previous = -1;
  for (const id of ['home-v2-title', 'recent-news', 'selected-works', 'honors']) {
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) ?? []).length, 1);
    const current = html.indexOf('id="' + id + '"');
    assert.ok(current > previous); previous = current;
  }
  assert.match(html, /data-home-v2="true"/);
  assert.doesNotMatch(html, /home-approach|home-hub|hero-ink__|data-ink-|Show older news|horaceos-governance/);
  assert.equal((html.match(/class="honors-index"/g) ?? []).length, 1);
});

test('Home native local destinations and fragments resolve in the normal output', () => {
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith('#')) assert.ok(html.includes('id="' + href.slice(1) + '"'), href);
    else if (href.startsWith('/') && !href.startsWith('//')) {
      const url = new URL(href, 'https://horacech.github.io');
      let target = path.join('dist', decodeURIComponent(url.pathname));
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), href);
    }
  }
});

test('served Home images are only the ten admitted exact derivatives', () => {
  const admission = JSON.parse(fs.readFileSync('docs/design/home-v2/integration/asset-admission.json', 'utf8'));
  assert.deepEqual(fs.readdirSync('dist/images/home').sort(), admission.map(record => path.basename(record.destination)).sort());
  for (const record of admission) {
    const bytes = fs.readFileSync(path.join('dist', record.url));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), record.sha256);
  }
  for (const match of html.matchAll(/src="(\/images\/home\/[^"]+)"/g)) assert.ok(admission.some(record => record.url === match[1]));
});

test('inner-page Footer remains the accepted default', () => {
  for (const route of ['about', 'projects', 'notes']) {
    const actual = fs.readFileSync('dist/' + route + '/index.html', 'utf8');
    const before = fs.readFileSync('tests/ui/fixtures/default-footer.html', 'utf8');
    const extract = source => source.match(/<footer[\s\S]*?<\/footer>/)?.[0].replace(/\s+/g, ' ');
    assert.equal(extract(actual), extract(before));
    assert.doesNotMatch(actual, /data-home-v2="true"|class="home-v2 home-v2-footer"/);
  }
});

test('cue initializes without ink DOM, caps pointer feedback and resets on lifecycle/preferences', () => {
  const previous = globalThis.matchMedia;
  const preferences = new Map();
  globalThis.matchMedia = query => {
    if (!preferences.has(query)) {
      const target = new EventTarget();
      target.matches = query.includes('pointer: fine');
      preferences.set(query, target);
    }
    return preferences.get(query);
  };
  const cue = new EventTarget();
  const arrow = { style: { transform: '' } };
  cue.querySelector = () => arrow;
  cue.getBoundingClientRect = () => ({ left: 0, top: 0, width: 112, height: 44 });
  const move = (pointerType = 'mouse') => {
    const event = new Event('pointermove');
    Object.assign(event, { clientX: 1000, clientY: 1000, pointerType });
    cue.dispatchEvent(event);
  };
  try {
    const dispose = mountScrollCue(cue);
    cue.dispatchEvent(new Event('pointerenter')); move();
    const offsets = [...arrow.style.transform.matchAll(/(-?[\d.]+)px/g)].map(match => Number(match[1]));
    assert.equal(offsets.length, 2);
    assert.ok(Math.hypot(...offsets) <= 3.01);
    cue.dispatchEvent(new Event('pointerleave')); assert.equal(arrow.style.transform, '');
    cue.dispatchEvent(new Event('pointerenter')); move('touch'); assert.equal(arrow.style.transform, '');
    const reduced = preferences.get('(prefers-reduced-motion: reduce)');
    reduced.matches = true; reduced.dispatchEvent(new Event('change'));
    cue.dispatchEvent(new Event('pointerenter')); move(); assert.equal(arrow.style.transform, '');
    reduced.matches = false; reduced.dispatchEvent(new Event('change'));
    cue.dispatchEvent(new Event('pointerenter')); move(); assert.notEqual(arrow.style.transform, '');
    cue.dispatchEvent(new Event('blur')); assert.equal(arrow.style.transform, '');
    const fine = preferences.get('(hover: hover) and (pointer: fine)');
    fine.matches = false; fine.dispatchEvent(new Event('change'));
    cue.dispatchEvent(new Event('pointerenter')); move(); assert.equal(arrow.style.transform, '');
    fine.matches = true; fine.dispatchEvent(new Event('change'));
    dispose(); cue.dispatchEvent(new Event('pointerenter')); move(); assert.equal(arrow.style.transform, '');
    const remount = mountScrollCue(cue); cue.dispatchEvent(new Event('pointerenter')); move();
    assert.notEqual(arrow.style.transform, ''); remount(); assert.equal(arrow.style.transform, '');
  } finally { globalThis.matchMedia = previous; }
});
