import { continuousMask, continuousRectPath } from '../lib/continuousRect';

// Adapted rectangular SVG method from David Haz / React Bits, commit e12c221.
// MIT + Commons Clause v1.0; full notice: docs/licenses/react-bits-glass-surface-LICENSE.md.
export function installHeaderGlass(header: HTMLElement): void {
  if (header.hasAttribute('data-glass-installed')) return;
  header.setAttribute('data-glass-installed', '');
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const transparency = matchMedia('(prefers-reduced-transparency: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const svgBackdrop = /Chrome|Chromium|Edg\//.test(navigator.userAgent) &&
    CSS.supports('backdrop-filter', 'url("#header-glass-bar")') &&
    !/Firefox|Version\/.*Safari/.test(navigator.userAgent);
  const masks = CSS.supports('mask-image', 'linear-gradient(black,black)');
  const surfaces = [...header.querySelectorAll<HTMLElement>('[data-glass-surface]')];
  const controls = [...header.querySelectorAll<HTMLElement>('a,button,summary')];
  const disclosure = header.querySelector('details');
  let frame = 0;
  const update = () => {
    frame = 0;
    const solid = transparency.matches || forced.matches;
    const available = masks && !solid;
    header.toggleAttribute('data-glass-solid', solid);
    header.toggleAttribute('data-glass-ready', available);
    header.toggleAttribute('data-glass-refraction', available && svgBackdrop && !reduced.matches);
    if (!available) return;
    for (const surface of surfaces) {
      // Closed details may expose positive, narrow layout geometry. Keep its last open resources.
      if (surface.dataset.glassSurface === 'panel' && !disclosure?.open) continue;
      const { width, height } = surface.getBoundingClientRect();
      if (!width || !height) continue; // Closed native disclosure has no painted panel.
      const radius = surface.dataset.glassSurface === 'bar' ? (height < 62 ? 22 : 28) : 24;
      const rect = { width, height, radius };
      surface.style.setProperty('--glass-mask', continuousMask(rect));
      surface.style.setProperty('--glass-filter', 'url("#header-glass-' + surface.dataset.glassSurface + '")');
      const edge = Math.min(width, height) * .035;
      const map = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="red" stop-opacity="0"/><stop offset="100%" stop-color="red"/></linearGradient>
        <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="blue" stop-opacity="0"/><stop offset="100%" stop-color="blue"/></linearGradient>
        <filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="11"/></filter></defs>
        <rect width="100%" height="100%" fill="black"/>
        <path d="${continuousRectPath(rect)}" fill="url(#r)"/>
        <path d="${continuousRectPath(rect)}" fill="url(#b)" style="mix-blend-mode:difference"/>
        <path d="${continuousRectPath({ ...rect, inset: edge })}" fill="hsl(0 0% 50% / .93)" filter="url(#soft)"/></svg>`;
      surface.querySelector('[data-glass-map]')?.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(map));
      surface.querySelector('[data-glass-rim]')?.setAttribute('d', continuousRectPath({ ...rect, inset: .75 }));
    }
    for (const control of controls) {
      const { width, height } = control.getBoundingClientRect();
      if (width && height) control.style.setProperty('--control-mask', continuousMask({ width, height, radius: 15 }));
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new ResizeObserver(schedule);
  for (const surface of surfaces) observer.observe(surface);
  for (const control of controls) observer.observe(control);
  reduced.addEventListener('change', schedule, { signal });
  transparency.addEventListener('change', schedule, { signal });
  forced.addEventListener('change', schedule, { signal });
  // Attribute mutation is delivered before paint; the toggle event may arrive a frame later.
  const disclosureObserver = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    update();
  });
  if (disclosure) disclosureObserver.observe(disclosure, { attributes: true, attributeFilter: ['open'] });
  update();
  addEventListener('pagehide', () => {
    observer.disconnect();
    disclosureObserver.disconnect();
    controller.abort();
    cancelAnimationFrame(frame);
    header.removeAttribute('data-glass-installed');
    header.removeAttribute('data-glass-ready');
    header.removeAttribute('data-glass-solid');
    header.removeAttribute('data-glass-refraction');
    addEventListener('pageshow', () => installHeaderGlass(header), { once: true });
  }, { once: true });
}
