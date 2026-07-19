import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('theme metadata follows the effective theme during initialization and manual switching', async () => {
  const [layout, toggle] = await Promise.all([
    readFile('src/layouts/Layout.astro', 'utf8'),
    readFile('src/components/ThemeToggle.astro', 'utf8'),
  ]);

  assert.equal((layout.match(/<meta\s+name="theme-color"/g) ?? []).length, 1);
  assert.match(layout, /content="#f5f5f5"/);
  assert.match(layout, /data-theme-color-light="#f5f5f5"/);
  assert.match(layout, /data-theme-color-dark="#08090a"/);
  assert.ok(
    layout.indexOf('<meta\n      name="theme-color"') < layout.indexOf('<script is:inline>'),
    'theme metadata must exist before the early initialization script runs',
  );

  for (const source of [layout, toggle]) {
    assert.match(source, /querySelector\('meta\[name="theme-color"\]'\)/);
    assert.match(
      source,
      /themeColor\.content = theme === 'dark' \? themeColor\.dataset\.themeColorDark : themeColor\.dataset\.themeColorLight/,
    );
  }

  assert.doesNotMatch(toggle, /#f5f5f5|#08090a/, 'ThemeToggle must consume the layout data contract');
});
