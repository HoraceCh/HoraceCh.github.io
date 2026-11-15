import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';
const source = buildSync({ entryPoints: ['src/scripts/header.ts'], bundle: true, write: false, format: 'esm' }).outputFiles[0].text;
const { installHeader } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('only repeated primary mousedown on Menu summary cancels selection default, with lifecycle cleanup', () => {
  const saved = new Map(['matchMedia', 'document', 'addEventListener', 'cancelAnimationFrame', 'scrollY'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const windowEvents = new EventTarget();
  const summary = Object.assign(new EventTarget(), { setAttribute() {}, focus() {} });
  const panel = new EventTarget();
  const details = Object.assign(new EventTarget(), { open: false, querySelector: () => summary });
  const header = Object.assign(new EventTarget(), { dataset: {}, querySelector: () => details, toggleAttribute() {} });
  const down = (target, detail, button = 0) => {
    const event = new Event('mousedown', { cancelable: true });
    Object.assign(event, { detail, button });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  try {
    globalThis.matchMedia = () => Object.assign(new EventTarget(), { matches: true });
    globalThis.document = new EventTarget();
    globalThis.addEventListener = windowEvents.addEventListener.bind(windowEvents);
    globalThis.cancelAnimationFrame = () => {};
    globalThis.scrollY = 0;
    installHeader(header);
    assert.equal(down(summary, 1), false, 'single click retains native focus default');
    assert.equal(down(summary, 2), true, 'double click must not select the label');
    assert.equal(down(summary, 3), true, 'triple click must not select the disclosure paragraph');
    assert.equal(down(summary, 2, 2), false, 'secondary button remains untouched');
    assert.equal(down(panel, 3), false, 'panel text remains selectable');
    const click = new Event('click', { cancelable: true });
    summary.dispatchEvent(click);
    assert.equal(click.defaultPrevented, false, 'native disclosure activation is not cancelled');
    windowEvents.dispatchEvent(new Event('pagehide'));
    assert.equal(down(summary, 2), false, 'guard must clean up with Header lifecycle');
  } finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
