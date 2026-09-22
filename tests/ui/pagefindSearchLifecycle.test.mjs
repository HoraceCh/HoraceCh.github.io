import assert from 'node:assert/strict';
import test from 'node:test';

import { createPagefindSearchCoordinator } from '../../src/scripts/pagefindSearch.ts';

class FakeTimers {
  #nextId = 1;
  #now = 0;
  #tasks = new Map();

  get activeCount() {
    return this.#tasks.size;
  }

  setTimeout = (callback, delay = 0) => {
    const id = this.#nextId++;
    this.#tasks.set(id, { callback, time: this.#now + delay });
    return id;
  };

  clearTimeout = (id) => {
    this.#tasks.delete(id);
  };

  advanceBy(milliseconds) {
    const target = this.#now + milliseconds;
    while (true) {
      const next = [...this.#tasks.entries()]
        .filter(([, task]) => task.time <= target)
        .sort((left, right) => left[1].time - right[1].time || left[0] - right[0])
        .at(0);
      if (!next) break;
      const [id, task] = next;
      this.#tasks.delete(id);
      this.#now = task.time;
      task.callback();
    }
    this.#now = target;
  }
}

class FakeMessageTarget {
  #listeners = new Set();

  addEventListener(listener) {
    this.#listeners.add(listener);
  }

  dispatch(event) {
    this.#listeners.forEach((listener) => listener(event));
  }
}

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createHarness = () => {
  const timers = new FakeTimers();
  const messages = new FakeMessageTarget();
  const origin = 'https://example.test';
  const frames = ['en', 'zh-CN'].map((language) => {
    const sent = [];
    let loadCount = 0;
    let source = '';
    const contentWindow = {
      postMessage(message, targetOrigin) {
        sent.push({ message, targetOrigin });
      },
    };
    return {
      contentWindow,
      dataset: { pagefindLanguage: language, searchSource: `/search/pagefind-${language}/` },
      get loadCount() {
        return loadCount;
      },
      get sent() {
        return sent;
      },
      get src() {
        return source;
      },
      set src(value) {
        source = value;
        loadCount += 1;
      },
    };
  });
  const coordinator = createPagefindSearchCoordinator(frames, {
    addMessageListener: (listener) => messages.addEventListener(listener),
    clearTimeout: timers.clearTimeout,
    origin,
    readyPollInterval: 10,
    readyTimeout: 100,
    searchTimeout: 80,
    setTimeout: timers.setTimeout,
  });
  const frame = (language) => frames.find((item) => item.dataset.pagefindLanguage === language);
  const dispatch = (language, data, overrides = {}) => messages.dispatch({
    data: { language, attempt: overrides.attempt ?? 1, ...data },
    origin: overrides.origin ?? origin,
    source: overrides.source ?? frame(language).contentWindow,
  });
  const ready = (language, attempt = 1) => dispatch(language, { type: 'hc56:ready' }, { attempt });
  const results = (language, queryId, items = [], attempt = 1) => dispatch(language, {
    queryId,
    results: items,
    type: 'hc56:results',
  }, { attempt });
  const startReadySearch = async (query) => {
    const result = coordinator.search(query);
    ready('en');
    ready('zh-CN');
    timers.advanceBy(10);
    await flushPromises();
    return { result };
  };

  return { coordinator, dispatch, frame, origin, ready, results, startReadySearch, timers };
};

test('successful readiness and bilingual query settle once without changing fusion behavior', async () => {
  const harness = createHarness();
  const { result } = await harness.startReadySearch('VLA');

  assert.equal(harness.frame('en').sent.length, 1);
  assert.equal(harness.frame('zh-CN').sent.length, 1);
  assert.equal(harness.frame('en').sent[0].targetOrigin, harness.origin);
  assert.equal(harness.frame('en').sent[0].message.attempt, 1);
  assert.equal(harness.frame('en').sent[0].message.limit, 12);

  harness.results('en', 1, [
    { title: 'VLA', url: '/projects/vla/index.html', excerpt: 'English result' },
  ]);
  harness.results('zh-CN', 1, [
    { title: 'VLA 中文', url: '/projects/vla/', excerpt: '中文结果' },
    { title: '其他', url: '/notes/other/', excerpt: 'Other result' },
  ]);

  assert.deepEqual(await result, [
    { title: 'VLA', url: '/projects/vla/', excerpt: 'English result', rank: 1, source: 'en' },
    { title: '其他', url: '/notes/other/', excerpt: 'Other result', rank: 2, source: 'zh-CN' },
  ]);
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('readiness timeout rejects and leaves no readiness polling active', async () => {
  const harness = createHarness();
  const rejected = assert.rejects(harness.coordinator.search('VLA'), /Search index did not finish loading/);

  harness.timers.advanceBy(100);

  await rejected;
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('retry after readiness timeout reloads both contexts and waits for fresh readiness', async () => {
  const harness = createHarness();
  const firstFailure = assert.rejects(harness.coordinator.search('VLA'), /Search index did not finish loading/);
  harness.ready('zh-CN');
  harness.timers.advanceBy(100);
  await firstFailure;

  const retry = harness.coordinator.search('VLA');
  harness.ready('en');
  harness.ready('zh-CN');
  harness.timers.advanceBy(10);
  await flushPromises();
  assert.equal(harness.frame('en').sent.length, 0);
  assert.equal(harness.frame('zh-CN').sent.length, 0);
  assert.equal(harness.frame('en').loadCount, 2);
  assert.equal(harness.frame('zh-CN').loadCount, 2);

  harness.ready('en', 2);
  harness.ready('zh-CN', 2);
  harness.timers.advanceBy(10);
  await flushPromises();
  harness.results('en', 1, [], 2);
  harness.results('zh-CN', 1, [], 2);

  assert.deepEqual(await retry, []);
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('initial worker failure rejects immediately and leaves initialization retryable', async () => {
  const harness = createHarness();
  const firstFailure = assert.rejects(harness.coordinator.search('VLA'), /en search failed/);

  harness.dispatch('en', { type: 'hc56:failure' });

  await firstFailure;
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);

  const retry = harness.coordinator.search('VLA');
  harness.ready('en', 2);
  harness.ready('zh-CN', 2);
  harness.timers.advanceBy(10);
  await flushPromises();
  harness.results('en', 1, [], 2);
  harness.results('zh-CN', 1, [], 2);

  assert.deepEqual(await retry, []);
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('worker failure removes the affected pending request and clears its timer', async () => {
  const harness = createHarness();
  const { result } = await harness.startReadySearch('VLA');
  const rejected = assert.rejects(result, /en search failed/);

  harness.dispatch('en', { type: 'hc56:failure' });

  assert.equal(harness.coordinator.pendingRequestCount(), 1);
  assert.equal(harness.timers.activeCount, 1);
  harness.results('en', 1, [{ title: 'late', url: '/late/', excerpt: 'late' }]);
  assert.equal(harness.coordinator.pendingRequestCount(), 1);
  harness.results('zh-CN', 1);
  await rejected;
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('search timeout removes requests, clears timers, and ignores late results', async () => {
  const harness = createHarness();
  const { result } = await harness.startReadySearch('VLA');
  const rejected = assert.rejects(result, /search timed out/);

  harness.timers.advanceBy(80);

  await rejected;
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
  harness.results('en', 1, [{ title: 'late', url: '/late/', excerpt: 'late' }]);
  harness.results('zh-CN', 1, [{ title: 'late', url: '/late/', excerpt: 'late' }]);
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('a stale response cannot settle or replace a newer query', async () => {
  const harness = createHarness();
  const { result: stale } = await harness.startReadySearch('old');
  const staleFailure = assert.rejects(stale, /search timed out/);
  harness.timers.advanceBy(80);
  await staleFailure;

  const fresh = harness.coordinator.search('fresh');
  await flushPromises();
  assert.equal(harness.coordinator.pendingRequestCount(), 2);
  harness.results('en', 1, [{ title: 'old', url: '/old/', excerpt: 'old' }]);
  harness.results('zh-CN', 1, [{ title: 'old', url: '/old/', excerpt: 'old' }]);
  assert.equal(harness.coordinator.pendingRequestCount(), 2);
  harness.results('en', 2, [{ title: 'fresh', url: '/fresh/', excerpt: 'fresh' }]);
  harness.results('zh-CN', 2);

  assert.deepEqual(await fresh, [
    { title: 'fresh', url: '/fresh/', excerpt: 'fresh', rank: 1, source: 'en' },
  ]);
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});

test('unrelated, wrong-source, and malformed worker messages are ignored', async () => {
  const harness = createHarness();
  const rejected = assert.rejects(harness.coordinator.search('VLA'), /Search index did not finish loading/);

  harness.dispatch('en', { type: 'hc56:ready' }, { origin: 'https://attacker.test' });
  harness.dispatch('zh-CN', { type: 'hc56:ready' }, { source: {} });
  harness.dispatch('en', { queryId: 'not-a-number', results: [], type: 'hc56:results' });
  harness.timers.advanceBy(100);

  await rejected;
  assert.equal(harness.coordinator.pendingRequestCount(), 0);
  assert.equal(harness.timers.activeCount, 0);
});
