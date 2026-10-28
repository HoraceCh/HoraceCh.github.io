// Pointer offset/radial cap adapted from David Haz / React Bits Magnet.
// Pin e12c22192ac7b4b452c5e2feb9b586d74765d696, MIT + Commons Clause.
// Exact notice: docs/design/home-v2/integration/react-bits-LICENSE.md.
export function mountScrollCue(cue: HTMLAnchorElement): () => void {
  const arrow = cue.querySelector<SVGElement>('.home-v2-scroll__arrow');
  if (!arrow) return () => {};
  const lifetime = new AbortController();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let rect: DOMRect | undefined;
  const reset = () => { arrow.style.transform = ''; rect = undefined; };
  cue.addEventListener('pointerenter', () => { rect = cue.getBoundingClientRect(); }, { signal: lifetime.signal });
  cue.addEventListener('pointermove', event => {
    if (!rect || reduce.matches || !fine.matches || event.pointerType === 'touch') return;
    let x = (event.clientX - (rect.left + rect.width / 2)) / 12;
    let y = (event.clientY - (rect.top + rect.height / 2)) / 12;
    const length = Math.hypot(x, y);
    if (length > 3) { x *= 3 / length; y *= 3 / length; }
    arrow.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
  }, { passive: true, signal: lifetime.signal });
  cue.addEventListener('pointerleave', reset, { signal: lifetime.signal });
  cue.addEventListener('blur', reset, { signal: lifetime.signal });
  reduce.addEventListener('change', reset, { signal: lifetime.signal });
  fine.addEventListener('change', reset, { signal: lifetime.signal });
  return () => { lifetime.abort(); reset(); };
}

let dispose: (() => void) | undefined;
function mount(): void {
  dispose?.();
  const cue = document.querySelector<HTMLAnchorElement>('.home-v2-hero__down');
  dispose = cue ? mountScrollCue(cue) : undefined;
}
if (typeof document !== 'undefined') {
  mount();
  document.addEventListener('astro:page-load', mount);
  document.addEventListener('astro:before-swap', () => { dispose?.(); dispose = undefined; });
  window.addEventListener('pagehide', () => { dispose?.(); dispose = undefined; });
  window.addEventListener('pageshow', mount);
}
