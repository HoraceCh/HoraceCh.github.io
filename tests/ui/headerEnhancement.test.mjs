import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildSync } from 'esbuild';

const source = buildSync({ entryPoints: ['src/scripts/header.ts'], bundle: true, write: false, format: 'esm' }).outputFiles[0].text;
const { installHeader } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function fixture(home = false, fail = false) {
  const keys = ['matchMedia', 'document', 'addEventListener', 'cancelAnimationFrame', 'requestAnimationFrame', 'scrollY'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = new EventTarget();
  const attributes = new Set();
  const summary = Object.assign(new EventTarget(), { setAttribute() {}, removeAttribute() {}, focus() {} });
  const details = Object.assign(new EventTarget(), { open: false, querySelector: () => summary });
  const header = Object.assign(new EventTarget(), {
    dataset: home ? { homeV2: 'true' } : {}, querySelector: () => details,
    setAttribute: name => attributes.add(name), removeAttribute: name => attributes.delete(name),
    toggleAttribute(name, value) { if (value) attributes.add(name); else attributes.delete(name); },
  });
  const registrations = [];
  let frames = 0;
  globalThis.matchMedia = () => Object.assign(new EventTarget(), {
    matches: true,
    addEventListener(...args) { if (fail) throw new Error('initialization failure'); EventTarget.prototype.addEventListener.apply(this, args); },
  });
  globalThis.document = Object.assign(new EventTarget(), { getElementById: () => ({}) });
  globalThis.addEventListener = (name, ...args) => { registrations.push(name); events.addEventListener(name, ...args); };
  globalThis.requestAnimationFrame = () => ++frames;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.scrollY = 0;
  return { header, summary, events, attributes, registrations, frames: () => frames, restore() {
    events.dispatchEvent(new Event('pagehide'));
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  } };
}

test('internal Header scrolls without subscribing or scheduling animation frames', () => {
  const f = fixture();
  try {
    installHeader(f.header);
    f.events.dispatchEvent(new Event('scroll'));
    assert.ok(!f.registrations.includes('scroll'));
    assert.equal(f.frames(), 0);
  } finally { f.restore(); }
});

test('Home Header retains one coalesced scroll frame and lifecycle cleanup', () => {
  const f = fixture(true);
  try {
    installHeader(f.header);
    assert.ok(f.attributes.has('data-clear'));
    f.events.dispatchEvent(new Event('scroll'));
    f.events.dispatchEvent(new Event('scroll'));
    assert.equal(f.frames(), 1);
    f.events.dispatchEvent(new Event('pagehide'));
    f.events.dispatchEvent(new Event('scroll'));
    assert.equal(f.frames(), 1);
  } finally { f.restore(); }
});

test('failed initialization restores native state and removes partial handlers', () => {
  const f = fixture(true, true);
  try {
    assert.throws(() => installHeader(f.header), /initialization failure/);
    assert.equal(f.header.dataset.enhanced, undefined);
    assert.ok(!f.attributes.has('data-scripted'));
    assert.ok(!f.attributes.has('data-clear'));
    const event = new Event('mousedown', { cancelable: true });
    Object.assign(event, { button: 0, detail: 2 });
    f.summary.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  } finally { f.restore(); }
});

test('Header cannot opt into fixed layout before its module loads', () => {
  const component = fs.readFileSync('src/components/Header.astro', 'utf8');
  assert.doesNotMatch(component, /<script is:inline>[\s\S]*?data-scripted/);
});

test('Python width examples describe the single fill character', () => {
  const note = fs.readFileSync('src/content/notes/python-print.md', 'utf8');
  for (const spec of ['{:=>10}', '{:=<20}']) {
    const line = note.split('\n').find(line => line.includes(spec));
    assert.ok(line.includes('不够时=填充'));
    assert.ok(!line.includes('不够时===填充'));
  }
});
