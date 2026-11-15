import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';

const bundled = buildSync({ entryPoints: ['src/scripts/headerGlass.ts'], bundle: true, write: false, format: 'esm' }).outputFiles[0].text;
const { installHeaderGlass } = await import('data:text/javascript;base64,' + Buffer.from(bundled).toString('base64'));

test('closed positive disclosure geometry cannot poison glass; reopening refreshes before RAF and cleans up', () => {
  const names = ['matchMedia', 'ResizeObserver', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'addEventListener', 'navigator', 'CSS'];
  const saved = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const windowEvents = new EventTarget();
  const pending = new Map();
  const mutations = [];
  const resizes = [];
  let nextFrame = 0;
  let open = false;
  let width = 338;
  const disclosure = new EventTarget();
  Object.defineProperty(disclosure, 'open', { get: () => open });
  const attributes = new Set();
  const props = new Map();
  const glass = { dataset: { glassSurface: 'panel' }, style: { setProperty: (key, value) => props.set(key, value) },
    getBoundingClientRect: () => ({ width: open ? width : 74, height: 342 }),
    querySelector: () => ({ setAttribute() {} }) };
  const header = { hasAttribute: key => attributes.has(key), setAttribute: key => attributes.add(key),
    removeAttribute: key => attributes.delete(key), toggleAttribute: (key, yes) => yes ? attributes.add(key) : attributes.delete(key),
    querySelectorAll: selector => selector === '[data-glass-surface]' ? [glass] : [],
    querySelector: () => disclosure };
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'Chrome' } });
    globalThis.CSS = { supports: () => true };
    globalThis.matchMedia = () => Object.assign(new EventTarget(), { matches: false });
    globalThis.ResizeObserver = class { constructor(fn) { this.fn = fn; this.disconnected = false; resizes.push(this); } observe() {} disconnect() { this.disconnected = true; } };
    globalThis.MutationObserver = class { constructor(fn) { this.fn = fn; this.disconnected = false; mutations.push(this); } observe() {} disconnect() { this.disconnected = true; } };
    globalThis.requestAnimationFrame = fn => { const id = ++nextFrame; pending.set(id, fn); return id; };
    globalThis.cancelAnimationFrame = id => pending.delete(id);
    globalThis.addEventListener = windowEvents.addEventListener.bind(windowEvents);
    const flushRAF = () => { const work = [...pending.values()]; pending.clear(); for (const fn of work) fn(); };
    const toggle = value => { open = value; for (const observer of mutations) observer.fn(); disclosure.dispatchEvent(new Event('toggle')); };
    installHeaderGlass(header);
    assert.equal(props.get('--glass-mask'), undefined, 'closed 74px geometry must not generate a mask');
    toggle(true);
    assert.match(decodeURIComponent(props.get('--glass-mask')), /viewBox="0 0 338 342"/, 'first open must initialize before RAF');
    toggle(false);
    resizes[0].fn(); flushRAF();
    assert.match(decodeURIComponent(props.get('--glass-mask')), /viewBox="0 0 338 342"/, 'closed measurement must preserve last valid open resource');
    width = 280;
    toggle(true);
    assert.match(decodeURIComponent(props.get('--glass-mask')), /viewBox="0 0 280 342"/, 'reopen after closed resize must be correct before RAF');
    windowEvents.dispatchEvent(new Event('pagehide'));
    assert.ok(mutations.every(observer => observer.disconnected));
    assert.ok(resizes.every(observer => observer.disconnected));
    assert.equal(pending.size, 0);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
