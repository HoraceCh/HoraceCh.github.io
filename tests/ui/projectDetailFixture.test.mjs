import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createDetailFixture } from './projectDetailFixture.mjs';

test('actual detail components omit empty/unsafe modules and render sequential media and every evidence type', () => {
  fs.mkdirSync('.npm-cache', {recursive:true});
  const root = fs.mkdtempSync(path.resolve('.npm-cache/hc246-fixture-'));
  createDetailFixture(root);
  const log = execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--root', root], {encoding:'utf8',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'}});
  fs.writeFileSync(path.join(root, 'build.log'), log);
  fs.writeFileSync('.npm-cache/hc246-latest-fixture.txt', root);
  for (const theme of ['light','dark']) {
    const html = fs.readFileSync(path.join(root, 'dist', theme, 'index.html'), 'utf8');
    const section = id => html.split(`<section id="${id}">`)[1]?.split('</section>')[0];
    assert.doesNotMatch(section('zero'), /<figure\b|class="project-evidence"/);
    assert.doesNotMatch(section('unsafe'), /class="project-evidence"|<a\b/);
    assert.equal((section('single').match(/<figure\b/g) ?? []).length, 1);
    assert.equal((section('multiple').match(/<figure\b/g) ?? []).length, 2);
    assert.equal((section('multiple').match(/<img\b/g) ?? []).length, 2, 'image evidence stays a link, never embeds');
    for (const type of ['repository','demo','documentation','image','note','other']) {
      assert.match(html, new RegExp(`evidence-type[^>]*>${type}<`));
    }
    assert.equal((section('mixed').match(/<a\b/g) ?? []).length, 2);
    assert.doesNotMatch(html, /href="(?:javascript:|data:|\/\/|mailto:|relative\/)/);
    assert.match(html, /href="\/notes\/ai-assisted-literature-workflow\/"[^>]*>LABEL ONLY/);
    const local = html.match(/<a href="https:\/\/horacech.github.io\/projects\/"[^>]*>/)?.[0];
    assert.ok(local);
    assert.doesNotMatch(local, /target=|rel=/);
  }
});
