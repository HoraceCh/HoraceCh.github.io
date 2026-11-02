import { createPagefindSearch, type SearchResult } from './pagefindSearch';
import { parsePagefindExcerpt } from './pagefindExcerpt';

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled])';

const displayResults = (list: HTMLElement, results: readonly SearchResult[]) => {
  list.replaceChildren(...results.map((result) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('strong');
    const path = document.createElement('span');
    const excerpt = document.createElement('span');
    path.className = 'site-search__path';
    path.textContent = result.url;
    excerpt.className = 'site-search__excerpt';
    link.href = result.url;
    link.className = 'search-result';
    title.textContent = result.title;
    excerpt.append(...parsePagefindExcerpt(result.excerpt).map((segment) => {
      if (!segment.highlighted) return document.createTextNode(segment.text);
      const mark = document.createElement('mark');
      mark.textContent = segment.text;
      return mark;
    }));
    link.append(title, path, excerpt);
    item.append(link);
    return item;
  }));
};

export function installSearchDialog(dialog: HTMLDialogElement, openOnLoad: boolean) {
  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]');
  const status = dialog.querySelector<HTMLElement>('[data-search-status]');
  const results = dialog.querySelector<HTMLElement>('[data-search-results]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-search-close]');
  const message = dialog.querySelector<HTMLElement>('[data-search-message]');
  const messageTitle = dialog.querySelector<HTMLElement>('[data-search-message-title]');
  const messageDetail = dialog.querySelector<HTMLElement>('[data-search-message-detail]');
  const browse = dialog.querySelector<HTMLElement>('[data-search-browse]');
  const retry = dialog.querySelector<HTMLButtonElement>('[data-search-retry]');
  const resultGuidance = dialog.querySelector<HTMLElement>('[data-result-guidance]');
  const controlGuidance = dialog.querySelector<HTMLElement>('[data-control-guidance]');
  const frames = [...dialog.querySelectorAll<HTMLIFrameElement>('[data-search-context]')];
  if (!input || !status || !results || !closeButton) return;
  const search = createPagefindSearch(frames);
  let trigger: HTMLElement | null = null;
  let request = 0;
  let composing = false;
  let restoreOverflow = '';
  let restoreScrollbarGutter = '';
  const root = document.documentElement;

  const showMessage = (title: string, detail: string, canRetry = false) => {
    if (message) message.hidden = !title && !detail;
    if (messageTitle) {
      messageTitle.textContent = title;
      messageTitle.hidden = !title;
    }
    if (messageDetail) messageDetail.textContent = detail;
    if (retry) retry.hidden = !canRetry;
    if (browse) browse.hidden = detail === 'Looking for matches.' || (!title && !detail);
    const hasResults = !title && !detail && results.children.length > 0;
    results.hidden = !hasResults;
    if (resultGuidance) resultGuidance.hidden = !hasResults;
    if (controlGuidance) controlGuidance.hidden = hasResults;
  };
  const setStatus = (value: string) => {
    status.textContent = value;
    status.hidden = !value;
    if (!value) showMessage('Find a project or a note', 'Try VLA, 信息检索, or a title.');
  };
  const close = () => dialog.close();
  const open = (nextTrigger: HTMLElement | null) => {
    if (!dialog.open || openOnLoad) trigger = nextTrigger;
    if (dialog.open && openOnLoad) dialog.close();
    if (!dialog.open) dialog.showModal();
    input.focus();
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-search-trigger]') : null;
    if (!target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(target);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (!composing) close();
  });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    document.body.style.overflow = restoreOverflow;
    root.style.scrollbarGutter = restoreScrollbarGutter;
    trigger?.focus();
  });
  dialog.addEventListener('toggle', () => {
    if (dialog.open) {
      restoreOverflow = document.body.style.overflow;
      restoreScrollbarGutter = root.style.scrollbarGutter;
      if (window.innerWidth > root.clientWidth && getComputedStyle(root).scrollbarGutter === 'auto') {
        root.style.scrollbarGutter = 'stable';
      }
      document.body.style.overflow = 'hidden';
    }
  });
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (composing || event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      ++request;
      input.value = '';
      results.replaceChildren();
      setStatus('');
      close();
      return;
    }
    const resultLinks = [...results.querySelectorAll<HTMLAnchorElement>('a')];
    const activeResultIndex = document.activeElement instanceof HTMLAnchorElement
      ? resultLinks.indexOf(document.activeElement)
      : -1;
    if (event.key === 'ArrowDown') {
      if (resultLinks.length > 0 && (document.activeElement === input || activeResultIndex >= 0)) event.preventDefault();
      if (document.activeElement === input) resultLinks.at(0)?.focus();
      else if (activeResultIndex >= 0) resultLinks.at(activeResultIndex + 1)?.focus();
    }
    if (event.key === 'ArrowUp' && activeResultIndex >= 0) {
      event.preventDefault();
      if (activeResultIndex === 0) input.focus();
      else resultLinks.at(activeResultIndex - 1)?.focus();
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => element.getClientRects().length > 0);
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('focusin', (event) => {
    const link = event.target;
    const body = dialog.querySelector<HTMLElement>('.site-search__body');
    if (!(link instanceof HTMLAnchorElement) || !results.contains(link) || !body) return;
    const row = link.getBoundingClientRect();
    const bounds = body.getBoundingClientRect();
    const top = row.top - bounds.top - 6;
    const bottom = row.bottom - bounds.bottom + 6;
    // Native nearest scrolling can leave an outline clipped or a tall row's title above the body.
    if (row.height > bounds.height - 12 || top < 0) body.scrollTop += top;
    else if (bottom > 0) body.scrollTop += bottom;
  });
  const runSearch = async () => {
    const query = input.value.trim();
    const id = ++request;
    results.replaceChildren();
    if (!query) {
      setStatus('');
      return;
    }
    setStatus('Searching…');
    showMessage('', 'Looking for matches.');
    try {
      const found = await search(query);
      if (id !== request) return;
      displayResults(results, found);
      setStatus(found.length > 0 ? `${found.length} results shown` : 'No results found.');
      showMessage(found.length > 0 ? '' : 'No results found.', found.length > 0 ? '' : 'Try a shorter keyword or a different title.');
    } catch (error) {
      if (id !== request) return;
      setStatus('Search is unavailable. Please try again.');
      showMessage('', 'Retry this search or browse the site.', true);
    }
  };
  input.addEventListener('input', runSearch);
  retry?.addEventListener('click', () => {
    if (document.activeElement === retry) input.focus();
    void runSearch();
  });
  if (openOnLoad) open(null);
}
