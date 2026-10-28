import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the shared document does not impose a fixed minimum width on narrow viewports', () => {
  const css = fs.readFileSync('src/styles/global.css', 'utf8');
  const body = css.match(/^body\s*\{([^}]+)\}/m)?.[1];
  assert.ok(body, 'shared body rule exists');
  assert.doesNotMatch(body, /min-(?:width|inline-size)\s*:\s*[1-9][\d.]*(?:px|rem|em)\b/, 'a positive fixed floor clips the document when the usable viewport is narrower');
});
