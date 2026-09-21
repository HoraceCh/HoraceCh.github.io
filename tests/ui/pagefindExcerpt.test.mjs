import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePagefindExcerpt } from '../../src/scripts/pagefindExcerpt.ts';

test('Pagefind excerpts turn controlled marks into highlight segments without literal markup', () => {
  const segments = parsePagefindExcerpt('hello <mark>VLA</mark> world');

  assert.deepEqual(segments, [
    { text: 'hello ', highlighted: false },
    { text: 'VLA', highlighted: true },
    { text: ' world', highlighted: false },
  ]);
});

test('Pagefind excerpts preserve multiple highlights and decode ordinary encoded text', () => {
  const segments = parsePagefindExcerpt('from &lt;body&gt; to <mark>robot</mark> control and <mark>robot</mark> perception');

  assert.deepEqual(segments, [
    { text: 'from <body> to ', highlighted: false },
    { text: 'robot', highlighted: true },
    { text: ' control and ', highlighted: false },
    { text: 'robot', highlighted: true },
    { text: ' perception', highlighted: false },
  ]);
});

test('Pagefind excerpts treat unexpected and malformed markup as non-executable text', () => {
  const segments = parsePagefindExcerpt('<img src=x onerror=alert(1)> <script>alert(1)</script> <mark>safe');

  assert.deepEqual(segments, [
    { text: '<img src=x onerror=alert(1)> <script>alert(1)</script> ', highlighted: false },
    { text: 'safe', highlighted: true },
  ]);
});

test('Pagefind excerpts preserve invalid numeric entities as readable text', () => {
  const segments = parsePagefindExcerpt('invalid &#99999999; and &#xD800;');

  assert.deepEqual(segments, [
    { text: 'invalid &#99999999; and &#xD800;', highlighted: false },
  ]);
});
