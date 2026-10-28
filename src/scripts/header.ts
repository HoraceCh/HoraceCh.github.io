export function installHeader(header: HTMLElement) {
  if (header.dataset.enhanced) return;
  const disclosure = header.querySelector<HTMLDetailsElement>('details');
  const summary = disclosure?.querySelector<HTMLElement>('summary');
  if (!disclosure || !summary) return;
  const mobile = matchMedia('(max-width: 700px)');
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  let focusFrame = 0;
  let lastFocused: HTMLElement | null = null;
  let temporaryHeading: HTMLElement | null = null;
  const clearHeading = () => {
    temporaryHeading?.removeAttribute('tabindex');
    temporaryHeading = null;
  };
  const targets = ['recent-news', 'selected-works', 'honors'];
  const validHome = header.dataset.homeV2 === 'true' && targets.every(id => document.getElementById(id));
  const updateSurface = () => {
    frame = 0;
    header.toggleAttribute('data-clear', validHome && scrollY < 24 && !disclosure.open);
  };
  const close = (restore = false) => {
    if (!disclosure.open) return;
    disclosure.open = false;
    summary.setAttribute('aria-expanded', 'false');
    if (restore) summary.focus({ preventScroll: true });
    updateSurface();
  };
  header.dataset.enhanced = 'true';
  summary.setAttribute('aria-expanded', String(disclosure.open));
  updateSurface();
  // Keep repeated activation from selecting the summary word or disclosure paragraph.
  summary.addEventListener('mousedown', event => {
    if (event.button === 0 && event.detail > 1) event.preventDefault();
  }, { signal });
  disclosure.addEventListener('toggle', () => {
    summary.setAttribute('aria-expanded', String(disclosure.open));
    updateSurface();
  }, { signal });
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateSurface);
  }, { passive: true, signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) {
      event.preventDefault();
      close(true);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') close(disclosure.contains(document.activeElement));
  }, { capture: true, signal });
  document.addEventListener('pointerdown', event => {
    if (event.target instanceof Node && !header.contains(event.target)) close(disclosure.contains(document.activeElement));
  }, { signal });
  header.addEventListener('focusin', event => {
    if (event.target instanceof HTMLElement) lastFocused = event.target;
  }, { signal });
  document.addEventListener('focusin', event => {
    if (event.target instanceof Node && !header.contains(event.target)) { lastFocused = null; close(); }
  }, { signal });
  header.addEventListener('click', event => {
    if (!(event.target instanceof Element) || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest<HTMLAnchorElement>('a');
    if (link?.hasAttribute('data-header-region') && !link.target && !link.hasAttribute('download')) {
      const heading = document.getElementById(link.hash.slice(1) + '-heading');
      close();
      if (heading) {
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(() => {
          clearHeading();
          if (!heading.hasAttribute('tabindex')) {
            temporaryHeading = heading;
            heading.setAttribute('tabindex', '-1');
            heading.addEventListener('blur', clearHeading, { once: true, signal });
          }
          heading.focus({ preventScroll: true });
        });
      }
    } else if (link || event.target.closest('[data-theme-toggle]')) close();
  }, { signal });
  const onResize = () => {
    if (mobile.matches && header.querySelector('.hc-header__desktop')?.contains(lastFocused)) summary.focus({ preventScroll: true });
    if (!mobile.matches) {
      const active = lastFocused;
      if (active instanceof HTMLElement && disclosure.contains(active)) {
        const href = active.closest('a')?.getAttribute('href');
        const desktopLink = [...header.querySelectorAll<HTMLAnchorElement>('.hc-header__desktop a')].find(link => link.getAttribute('href') === href);
        (desktopLink ?? header.querySelector<HTMLElement>('.hc-header__brand'))?.focus({ preventScroll: true });
      }
      close();
    }
  };
  mobile.addEventListener('change', onResize, { signal });
  addEventListener('pagehide', () => {
    controller.abort();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(focusFrame);
    clearHeading();
    delete header.dataset.enhanced;
    addEventListener('pageshow', () => installHeader(header), { once: true });
  }, { once: true });
}
