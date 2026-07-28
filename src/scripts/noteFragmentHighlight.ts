const feedbackClass = 'is-note-fragment-target';
const feedbackDuration = 2400;
const fragmentRetryLimit = 3;
const meaningfulTargetSelector = 'h2, h3, h4, h5, h6, p, li, tr, dt, dd, blockquote, pre';

type Dispose = () => void;

let disposeSession: Dispose | undefined;
let lifecycleInstalled = false;

const decodeCurrentFragment = () => {
  if (window.location.hash.length <= 1) {
    return null;
  }

  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
};

const findNamedTarget = (prose: HTMLElement, fragment: string) => {
  try {
    return prose.querySelector<Element>(`[name="${CSS.escape(fragment)}"]`);
  } catch {
    return null;
  }
};

const resolveMeaningfulTarget = (prose: HTMLElement) => {
  const fragment = decodeCurrentFragment();

  if (!fragment) {
    return null;
  }

  const fragmentTarget = document.getElementById(fragment) ?? findNamedTarget(prose, fragment);

  if (!fragmentTarget || !prose.contains(fragmentTarget)) {
    return null;
  }

  const meaningfulTarget = fragmentTarget.closest<HTMLElement>(meaningfulTargetSelector);
  return meaningfulTarget && prose.contains(meaningfulTarget) ? meaningfulTarget : null;
};

const isOutsideViewport = (target: HTMLElement) => {
  const bounds = target.getBoundingClientRect();
  return bounds.top < 0 || bounds.left < 0 || bounds.bottom > window.innerHeight || bounds.right > window.innerWidth;
};

const createSession = (): Dispose => {
  const prose = document.querySelector<HTMLElement>('[data-note-prose]');

  if (!prose) {
    return () => {};
  }

  let activeTarget: HTMLElement | null = null;
  let retryFrame = 0;
  let activationFrame = 0;
  let cleanupTimer = 0;

  const clearFeedback = () => {
    if (activationFrame) {
      window.cancelAnimationFrame(activationFrame);
      activationFrame = 0;
    }

    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = 0;
    }

    activeTarget?.classList.remove(feedbackClass);
    activeTarget = null;
  };

  const activateTarget = (target: HTMLElement) => {
    clearFeedback();

    // Re-adding in a later frame restarts repeated same-fragment feedback without forced layout.
    activationFrame = window.requestAnimationFrame(() => {
      activationFrame = 0;
      target.classList.add(feedbackClass);
      activeTarget = target;

      if (isOutsideViewport(target)) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }

      cleanupTimer = window.setTimeout(clearFeedback, feedbackDuration);
    });
  };

  const scheduleFeedback = (attemptsRemaining = fragmentRetryLimit) => {
    // A new hash owns the feedback state even when it never resolves.
    clearFeedback();

    if (retryFrame) {
      window.cancelAnimationFrame(retryFrame);
    }

    retryFrame = window.requestAnimationFrame(() => {
      retryFrame = 0;
      const target = resolveMeaningfulTarget(prose);

      if (target) {
        activateTarget(target);
      } else if (attemptsRemaining > 1) {
        scheduleFeedback(attemptsRemaining - 1);
      }
    });
  };

  const handleSamePageAnchorClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;

    if (!anchor || (anchor.target && anchor.target !== '_self')) {
      return;
    }

    const destination = new URL(anchor.href, document.baseURI);
    const current = window.location;

    if (
      !destination.hash ||
      destination.origin !== current.origin ||
      destination.pathname !== current.pathname ||
      destination.search !== current.search
    ) {
      return;
    }

    // Let the browser update and scroll the native fragment before applying the reader cue.
    scheduleFeedback();
  };

  const handleHashChange = () => scheduleFeedback();

  document.addEventListener('click', handleSamePageAnchorClick);
  window.addEventListener('hashchange', handleHashChange);
  scheduleFeedback();

  return () => {
    document.removeEventListener('click', handleSamePageAnchorClick);
    window.removeEventListener('hashchange', handleHashChange);

    if (retryFrame) {
      window.cancelAnimationFrame(retryFrame);
      retryFrame = 0;
    }

    clearFeedback();
  };
};

const initializeSession = () => {
  disposeSession?.();
  disposeSession = createSession();
};

export const installNoteFragmentHighlight = () => {
  if (!lifecycleInstalled) {
    document.addEventListener('astro:page-load', initializeSession);
    document.addEventListener('astro:before-swap', () => disposeSession?.());
    lifecycleInstalled = true;
  }

  initializeSession();
};
