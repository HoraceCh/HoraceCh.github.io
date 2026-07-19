import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const MUTED = '#707070';
const LIGHT_SURFACES = ['#f5f5f5', '#fafafa', '#ffffff'];

test('light muted tokens meet WCAG AA contrast on every approved light surface', async () => {
  const [css, design] = await Promise.all([
    readFile('src/styles/global.css', 'utf8'),
    readFile('docs/design/UI_DESIGN.md', 'utf8'),
  ]);

  const lightTokens = css.slice(0, css.indexOf(':root.dark'));
  assert.match(lightTokens, /--muted: #707070/);
  assert.match(lightTokens, /--notes-muted: #707070/);
  assert.doesNotMatch(design, /#737373/i, 'normative design references must use the approved muted value');

  for (const surface of LIGHT_SURFACES) {
    assert.ok(contrast(MUTED, surface) >= 4.5, `${MUTED} must reach 4.5:1 on ${surface}`);
  }
});

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex) {
  return hex.match(/[a-f\d]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
