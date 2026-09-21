import { createPagefindSearch, type SearchResult } from './pagefindSearch';
import { parsePagefindExcerpt } from './pagefindExcerpt';

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled])';

const displayResults = (list: HTMLElement, results: readonly SearchResult[]) => {
  list.replaceChildren(...results.map((result) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('strong');
    const excerpt = document.createElement('span');
    link.href = result.url;
    link.className = 'search-result';
    title.textContent = result.title;
    excerpt.append(...parsePagefindExcerpt(result.excerpt).map((segment) => {
      if (!segment.highlighted) return document.createTextNode(segment.text);
      const mark = document.createElement('mark');
      mark.textContent = segment.text;
      return mark;
    }));
    link.append(title, excerpt);
    item.append(link);
    return item;
  }));
};

export function installSearchDialog(dialog: HTMLDialogElement, openOnLoad: boolean) {
  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]');
  const status = dialog.querySelector<HTMLElement>('[data-search-status]');
  const results = dialog.querySelector<HTMLElement>('[data-search-results]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-search-close]');
  const frames = [...dialog.querySelectorAll<HTMLIFrameElement>('[data-search-context]')];
  if (!input || !status || !results || !closeButton) return;
  const search = createPagefindSearch(frames);
  let trigger: HTMLElement | null = null;
  let request = 0;
  let restoreOverflow = '';

  const setStatus = (value: string) => {
    status.textContent = value;
    status.hidden = !value;
  };
  const close = () => dialog.close();
  const open = (nextTrigger: HTMLElement | null) => {
    trigger = nextTrigger;
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
    close();
  });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    document.body.style.overflow = restoreOverflow;
    trigger?.focus();
  });
  dialog.addEventListener('toggle', () => {
    if (dialog.open) {
      restoreOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  });
  dialog.addEventListener('keydown', (event) => {
    const resultLinks = [...results.querySelectorAll<HTMLAnchorElement>('a')];
    const activeResultIndex = document.activeElement instanceof HTMLAnchorElement
      ? resultLinks.indexOf(document.activeElement)
      : -1;
    if (event.key === 'ArrowDown') {
      if (document.activeElement === input) resultLinks.at(0)?.focus();
      else if (activeResultIndex >= 0) resultLinks.at(activeResultIndex + 1)?.focus();
    }
    if (event.key === 'ArrowUp' && activeResultIndex >= 0) {
      if (activeResultIndex === 0) input.focus();
      else resultLinks.at(activeResultIndex - 1)?.focus();
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
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
  input.addEventListener('input', async () => {
    const query = input.value.trim();
    const id = ++request;
    results.replaceChildren();
    if (!query) {
      setStatus('');
      return;
    }
    setStatus('Searching…');
    try {
      const found = await search(query);
      if (id !== request) return;
      displayResults(results, found);
      setStatus(found.length > 0 ? `${found.length} results` : 'No results found.');
    } catch (error) {
      if (id !== request) return;
      setStatus('Search is unavailable. Please try again.');
    }
  });
  if (openOnLoad) open(null);
}
