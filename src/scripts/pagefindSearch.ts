export type SearchResult = {
  readonly title: string;
  readonly url: string;
  readonly excerpt: string;
  readonly rank: number;
  readonly source: SearchLanguage;
};

type SearchLanguage = 'en' | 'zh-CN';
type WorkerResult = Omit<SearchResult, 'rank' | 'source'>;
type WorkerResponse = {
  readonly type: 'hc56:results';
  readonly language: SearchLanguage;
  readonly attempt: number;
  readonly queryId: number;
  readonly results: readonly WorkerResult[];
};
type WorkerReady = { readonly type: 'hc56:ready'; readonly language: SearchLanguage; readonly attempt: number };
type WorkerFailure = { readonly type: 'hc56:failure'; readonly language: SearchLanguage; readonly attempt: number };
type WorkerMessage = WorkerResponse | WorkerReady | WorkerFailure;
type Instance = {
  readonly language: SearchLanguage;
  readonly frame: HTMLIFrameElement;
  attempt: number;
  ready: boolean;
};
type PendingSearch = {
  readonly language: SearchLanguage;
  readonly timeout: number;
  readonly resolve: (results: readonly WorkerResult[]) => void;
  readonly reject: (error: Error) => void;
};

type PagefindSearchOptions = {
  readonly addMessageListener?: (listener: (event: MessageEvent<unknown>) => void) => void;
  readonly clearTimeout?: (timeout: number) => void;
  readonly origin?: string;
  readonly readyPollInterval?: number;
  readonly readyTimeout?: number;
  readonly searchTimeout?: number;
  readonly setTimeout?: (callback: () => void, delay: number) => number;
};

export type PagefindSearchCoordinator = {
  readonly pendingRequestCount: () => number;
  readonly search: (query: string) => Promise<readonly SearchResult[]>;
};

const languages = ['en', 'zh-CN'] as const;
const perLanguageLimit = 12;
const readyTimeout = 8_000;
const searchTimeout = 8_000;

const isLanguage = (value: unknown): value is SearchLanguage => value === 'en' || value === 'zh-CN';

const isWorkerResult = (value: unknown): value is WorkerResult => {
  if (!value || typeof value !== 'object') return false;
  return 'title' in value && 'url' in value && 'excerpt' in value && typeof value.title === 'string' && typeof value.url === 'string' && typeof value.excerpt === 'string';
};

const isWorkerMessage = (value: unknown): value is WorkerMessage => {
  if (!value || typeof value !== 'object') return false;
  if (!('language' in value) || !('type' in value) || !('attempt' in value)) return false;
  if (!isLanguage(value.language) || typeof value.type !== 'string' || !Number.isSafeInteger(value.attempt)) return false;
  if (value.type === 'hc56:ready' || value.type === 'hc56:failure') return true;
  return value.type === 'hc56:results' && 'queryId' in value && 'results' in value && typeof value.queryId === 'number' && Array.isArray(value.results) && value.results.every(isWorkerResult);
};

const normalizeTitle = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

const languageWeights = (query: string): Readonly<Record<SearchLanguage, number>> => {
  const hasHan = /[\u3400-\u9fff]/u.test(query);
  const hasLatin = /[A-Za-z]/u.test(query);
  if (hasHan && !hasLatin) return { en: 0.25, 'zh-CN': 2 };
  if (hasLatin && !hasHan) return { en: 2, 'zh-CN': 0.25 };
  return { en: 1, 'zh-CN': 1 };
};

const canonicalUrl = (value: string, origin: string) => {
  const url = new URL(value, origin);
  return `${url.pathname.replace(/index\.html$/u, '') || '/'}${url.search}${url.hash}`;
};

export function createPagefindSearchCoordinator(
  frames: readonly HTMLIFrameElement[],
  options: PagefindSearchOptions = {},
): PagefindSearchCoordinator {
  const origin = options.origin ?? window.location.origin;
  const schedule = options.setTimeout ?? ((callback, delay) => window.setTimeout(callback, delay));
  const cancel = options.clearTimeout ?? ((timeout) => window.clearTimeout(timeout));
  const addMessageListener = options.addMessageListener ?? ((listener) => window.addEventListener('message', listener));
  const readinessDeadline = options.readyTimeout ?? readyTimeout;
  const requestDeadline = options.searchTimeout ?? searchTimeout;
  const pollInterval = options.readyPollInterval ?? 40;
  const instances = languages.map((language) => {
    const frame = frames.find((item) => item.dataset.pagefindLanguage === language);
    if (!frame) throw new Error(`Missing ${language} Pagefind context.`);
    const instance: Instance = { language, frame, attempt: 0, ready: false };
    return instance;
  });
  const pending = new Map<string, PendingSearch>();
  let initialized: Promise<void> | undefined;
  let failInitialization: ((error: Error) => void) | undefined;
  let initializationAttempt = 0;
  let queryId = 0;

  const messageKey = (language: SearchLanguage, id: number) => `${language}:${id}`;

  const settlePending = (key: string, settle: (request: PendingSearch) => void) => {
    const request = pending.get(key);
    if (!request) return false;
    pending.delete(key);
    cancel(request.timeout);
    settle(request);
    return true;
  };

  const receiveMessage = (event: MessageEvent<unknown>) => {
    const message = event.data;
    if (event.origin !== origin || !isWorkerMessage(message)) return;
    const instance = instances.find((item) => item.language === message.language);
    if (!instance || event.source !== instance.frame.contentWindow || message.attempt !== instance.attempt) return;
    if (message.type === 'hc56:ready') {
      instance.ready = true;
      return;
    }
    if (message.type === 'hc56:failure') {
      failInitialization?.(new Error(`${message.language} search failed.`));
      [...pending.entries()]
        .filter(([, request]) => request.language === message.language)
        .forEach(([key]) => settlePending(key, (request) => request.reject(new Error(`${message.language} search failed.`))));
      return;
    }
    settlePending(messageKey(message.language, message.queryId), (request) => request.resolve(message.results));
  };

  addMessageListener(receiveMessage);

  const initialize = () => {
    if (initialized) return initialized;
    const attempt = ++initializationAttempt;
    const loading = new Promise<void>((resolve, reject) => {
      let poll: number | undefined;
      let settled = false;
      const finish = (settle: () => void) => {
        if (settled) return;
        settled = true;
        cancel(timeout);
        if (poll !== undefined) cancel(poll);
        failInitialization = undefined;
        settle();
      };
      const fail = (error: Error) => finish(() => reject(error));
      const timeout = schedule(() => fail(new Error('Search index did not finish loading.')), readinessDeadline);
      failInitialization = fail;
      instances.forEach((instance) => {
        instance.attempt = attempt;
        instance.ready = false;
        const source = instance.frame.dataset.searchSource;
        if (source) {
          const sourceUrl = new URL(source, origin);
          sourceUrl.searchParams.set('hcSearchAttempt', String(attempt));
          instance.frame.src = sourceUrl.href;
        }
      });
      const waitForReady = () => {
        if (instances.every((instance) => instance.ready)) {
          finish(resolve);
        } else {
          poll = schedule(waitForReady, pollInterval);
        }
      };
      waitForReady();
    });
    initialized = loading;
    return loading.catch((error: unknown) => {
      initialized = undefined;
      throw error;
    });
  };

  const searchLanguage = (instance: Instance, query: string, id: number) => new Promise<readonly WorkerResult[]>((resolve, reject) => {
    const key = messageKey(instance.language, id);
    const timeout = schedule(() => {
      settlePending(key, (request) => request.reject(new Error(`${instance.language} search timed out.`)));
    }, requestDeadline);
    pending.set(key, {
      language: instance.language,
      timeout,
      resolve,
      reject,
    });
    instance.frame.contentWindow?.postMessage({
      type: 'hc56:query',
      attempt: instance.attempt,
      query,
      queryId: id,
      limit: perLanguageLimit,
    }, origin);
  });

  const search = async (query: string): Promise<readonly SearchResult[]> => {
    await initialize();
    const id = ++queryId;
    const groups = await Promise.all(instances.map(async (instance) => ({
      language: instance.language,
      results: await searchLanguage(instance, query, id),
    })));
    const weights = languageWeights(query);
    const exactTitle = normalizeTitle(query);
    const fused = new Map<string, SearchResult & { score: number; exact: boolean }>();
    groups.forEach(({ language, results }) => results.forEach((result, index) => {
      const url = canonicalUrl(result.url, origin);
      const rank = index + 1;
      const candidate = { ...result, url, rank, source: language, score: weights[language] / (60 + rank), exact: normalizeTitle(result.title) === exactTitle };
      const current = fused.get(url);
      if (!current) fused.set(url, candidate);
      else fused.set(url, { ...current, score: current.score + candidate.score, exact: current.exact || candidate.exact, rank: Math.min(current.rank, rank) });
    }));
    return [...fused.values()]
      .sort((left, right) => Number(right.exact) - Number(left.exact) || right.score - left.score || left.rank - right.rank || left.url.localeCompare(right.url))
      .map(({ score: _score, exact: _exact, ...result }) => result);
  };

  return { pendingRequestCount: () => pending.size, search };
}

export function createPagefindSearch(frames: readonly HTMLIFrameElement[]) {
  return createPagefindSearchCoordinator(frames).search;
}
