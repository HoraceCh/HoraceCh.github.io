import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mobile homepage removes only the redundant profile snapshot from the visual flow', async () => {
  const [home, css] = await Promise.all([
    readFile('src/pages/index.astro', 'utf8'),
    readFile('src/styles/global.css', 'utf8'),
  ]);

  assert.match(home, /<aside class="identity-plate" aria-label="Profile snapshot">/);
  assert.match(home, /Mechanical Engineering student building and documenting robotics/);
  assert.match(home, /I connect mechanical systems and robot control/);
  assert.match(home, /<nav class="link-row home-primary-links"/);
  assert.match(home, /<ul class="focus-strip"/);
  assert.match(home, /<section class="home-section home-selected-work"/);

  const mobile = css.match(/@media \(max-width: 720px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(mobile, /\.home-page \.identity-plate \{\s*display: none;\s*\}/);

  const desktopIdentity =
    css
      .slice(0, css.indexOf('@media (max-width: 980px)'))
      .split('.home-page .identity-plate {')[1]
      ?.split('}')[0] ?? '';
  const desktop = '.home-page .identity-plate {' + desktopIdentity;
  assert.doesNotMatch(desktop, /\.home-page \.identity-plate \{[\s\S]*?display: none/);
});
