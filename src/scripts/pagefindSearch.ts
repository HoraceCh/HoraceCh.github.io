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
  readonly queryId: number;
  readonly results: readonly WorkerResult[];
};
type WorkerReady = { readonly type: 'hc56:ready'; readonly language: SearchLanguage };
type WorkerFailure = { readonly type: 'hc56:failure'; readonly language: SearchLanguage };
type WorkerMessage = WorkerResponse | WorkerReady | WorkerFailure;
type Instance = {
  readonly language: SearchLanguage;
  readonly frame: HTMLIFrameElement;
  ready: boolean;
};
type PendingSearch = {
  readonly resolve: (results: readonly WorkerResult[]) => void;
  readonly reject: (error: Error) => void;
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
  if (!('language' in value) || !('type' in value) || !isLanguage(value.language) || typeof value.type !== 'string') return false;
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

const canonicalUrl = (value: string) => {
  const url = new URL(value, window.location.origin);
  return `${url.pathname.replace(/index\.html$/u, '') || '/'}${url.search}${url.hash}`;
};

export function createPagefindSearch(frames: readonly HTMLIFrameElement[]) {
  const instances = languages.map((language) => {
    const frame = frames.find((item) => item.dataset.pagefindLanguage === language);
    if (!frame) throw new Error(`Missing ${language} Pagefind context.`);
    return { language, frame, ready: false } satisfies Instance;
  });
  const pending = new Map<string, PendingSearch>();
  let initialized: Promise<void> | undefined;
  let queryId = 0;

  const messageKey = (language: SearchLanguage, id: number) => `${language}:${id}`;

  const receiveMessage = (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || !isWorkerMessage(event.data)) return;
    const instance = instances.find((item) => item.language === event.data.language);
    if (!instance || event.source !== instance.frame.contentWindow) return;
    if (event.data.type === 'hc56:ready') {
      instance.ready = true;
      return;
    }
    if (event.data.type === 'hc56:failure') {
      pending.forEach((request, key) => {
        if (key.startsWith(`${event.data.language}:`)) request.reject(new Error(`${event.data.language} search failed.`));
      });
      return;
    }
    const request = pending.get(messageKey(event.data.language, event.data.queryId));
    if (!request) return;
    pending.delete(messageKey(event.data.language, event.data.queryId));
    request.resolve(event.data.results);
  };

  window.addEventListener('message', receiveMessage);

  const initialize = () => {
    if (initialized) return initialized;
    const loading = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Search index did not finish loading.')), readyTimeout);
      instances.forEach((instance) => {
        const source = instance.frame.dataset.searchSource;
        if (source) instance.frame.src = source;
      });
      const waitForReady = () => {
        if (instances.every((instance) => instance.ready)) {
          window.clearTimeout(timeout);
          resolve();
        } else {
          window.setTimeout(waitForReady, 40);
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
    const timeout = window.setTimeout(() => {
      pending.delete(messageKey(instance.language, id));
      reject(new Error(`${instance.language} search timed out.`));
    }, searchTimeout);
    pending.set(messageKey(instance.language, id), {
      resolve: (results) => {
        window.clearTimeout(timeout);
        resolve(results);
      },
      reject: (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    });
    instance.frame.contentWindow?.postMessage({ type: 'hc56:query', query, queryId: id, limit: perLanguageLimit }, window.location.origin);
  });

  return async (query: string): Promise<readonly SearchResult[]> => {
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
      const url = canonicalUrl(result.url);
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
}
