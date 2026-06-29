(function () {
  const root = document.documentElement;
  const storageKey = 'horace-theme';
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const toggle = document.querySelector('[data-theme-toggle]');
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const actions = {
    light: 'Switch to light mode',
    dark: 'Switch to dark mode'
  };
  const themeColors = {
    light: '#f7f7fb',
    dark: '#101116'
  };

  function readMode() {
    try {
      const storedMode = window.localStorage.getItem(storageKey);
      return storedMode === 'light' || storedMode === 'dark' ? storedMode : 'auto';
    } catch (error) {
      return 'auto';
    }
  }

  function saveMode(mode) {
    try {
      if (mode === 'auto') {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, mode);
      }
    } catch (error) {}
  }

  function effectiveTheme(mode) {
    if (mode === 'auto') {
      return darkQuery && darkQuery.matches ? 'dark' : 'light';
    }
    return mode;
  }

  function applyMode(mode) {
    const effective = effectiveTheme(mode);
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
    if (themeColor) {
      themeColor.setAttribute('content', themeColors[effective]);
    }
    if (toggle) {
      const action = effective === 'dark' ? 'light' : 'dark';
      toggle.dataset.themeMode = mode;
      toggle.dataset.themeEffective = effective;
      toggle.dataset.themeAction = action;
      toggle.setAttribute('aria-label', actions[action]);
      toggle.setAttribute('title', actions[action]);
    }
  }

  let mode = readMode();
  applyMode(mode);

  if (toggle) {
    toggle.addEventListener('click', () => {
      mode = effectiveTheme(mode) === 'dark' ? 'light' : 'dark';
      saveMode(mode);
      applyMode(mode);
    });
  }

  if (darkQuery) {
    const onSystemThemeChange = () => {
      if (mode === 'auto') {
        applyMode(mode);
      }
    };
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener('change', onSystemThemeChange);
    } else if (darkQuery.addListener) {
      darkQuery.addListener(onSystemThemeChange);
    }
  }
})();

(function () {
  const button = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!button || !nav) return;
  button.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
})();
