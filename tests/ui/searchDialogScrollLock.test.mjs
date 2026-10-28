import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';

const compiled = await build({
  entryPoints: ['src/scripts/searchDialog.ts'], bundle: true, write: false,
  format: 'cjs', platform: 'browser', target: 'es2022',
});

class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    const entries = this.listeners.get(type) ?? [];
    entries.push(listener);
    this.listeners.set(type, entries);
  }
  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

const harness = ({ innerWidth = 1707, clientWidth = 1692, gutter = '', computedGutter = 'auto', overflow = '' } = {}) => {
  const document = new Target();
  document.body = { style: { overflow } };
  document.documentElement = { clientWidth, style: { scrollbarGutter: gutter } };
  class Element extends Target {
    focus() { document.activeElement = this; }
    closest() { return this; }
  }
  const trigger = new Element();
  const input = new Element();
  const closeButton = new Element();
  const results = { querySelectorAll: () => [] };
  const status = {};
  const dialog = new Target();
  dialog.open = false;
  dialog.querySelector = selector => ({
    '[data-search-input]': input, '[data-search-close]': closeButton,
    '[data-search-results]': results, '[data-search-status]': status,
  })[selector];
  dialog.querySelectorAll = () => ['en', 'zh-CN'].map(language => ({ dataset: { pagefindLanguage: language } }));
  dialog.showModal = () => { dialog.open = true; dialog.emit('toggle'); };
  dialog.close = () => { dialog.open = false; dialog.emit('close'); dialog.emit('toggle'); };
  const window = new Target();
  window.innerWidth = innerWidth;
  window.location = { origin: 'https://example.test' };
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputFiles[0].text, {
    module, exports: module.exports, window, document,
    getComputedStyle: () => ({ scrollbarGutter: computedGutter }),
    Element, HTMLElement: Element, HTMLAnchorElement: Element,
    URL, setTimeout, clearTimeout,
  });
  module.exports.installSearchDialog(dialog, false);
  const open = () => document.emit('click', { target: trigger, button: 0, preventDefault() {} });
  return { document, dialog, input, trigger, open };
};

test('Search reserves classic scrollbar space only during the scroll lock and restores styles and trigger focus', () => {
  const h = harness({ overflow: 'auto' });
  h.open();
  assert.equal(h.document.body.style.overflow, 'hidden');
  assert.equal(h.document.documentElement.style.scrollbarGutter, 'stable', 'locking a classic scrollbar must retain its layout space');
  assert.equal(h.document.activeElement, h.input);
  h.dialog.close();
  assert.equal(h.document.body.style.overflow, 'auto');
  assert.equal(h.document.documentElement.style.scrollbarGutter, '');
  assert.equal(h.document.activeElement, h.trigger);
  h.open();
  h.dialog.close();
  assert.equal(h.document.body.style.overflow, 'auto', 'a second lock must restore the original state too');
  assert.equal(h.document.documentElement.style.scrollbarGutter, '');
});

test('Search does not introduce gutter space without a classic scrollbar', () => {
  const h = harness({ innerWidth: 1707, clientWidth: 1707 });
  h.open();
  assert.equal(h.document.documentElement.style.scrollbarGutter, '');
  h.dialog.close();
  assert.equal(h.document.documentElement.style.scrollbarGutter, '');
});

test('Search preserves a preexisting stable gutter rule while open and on close', () => {
  const h = harness({ gutter: 'stable both-edges', computedGutter: 'stable both-edges' });
  h.open();
  assert.equal(h.document.documentElement.style.scrollbarGutter, 'stable both-edges');
  h.dialog.close();
  assert.equal(h.document.documentElement.style.scrollbarGutter, 'stable both-edges');
});
