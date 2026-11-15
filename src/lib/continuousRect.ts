type Rect = { readonly width: number; readonly height: number; readonly radius: number; readonly inset?: number };
type Point = readonly [number, number];

/** Two cubics with equal first/second midpoint derivatives and zero endpoint curvature. */
export function continuousCorner(radius: number): readonly Point[] {
  return [[0, 0], [.4 * radius, 0], [.7 * radius, 0], [.85 * radius, .15 * radius],
    [radius, .3 * radius], [radius, .6 * radius], [radius, radius]];
}

export function continuousRectPath({ width, height, radius, inset = 0 }: Rect): string {
  const left = inset, top = inset, right = width - inset, bottom = height - inset;
  const r = Math.max(0, Math.min(radius - inset, (right - left) / 2, (bottom - top) / 2));
  const f = (n: number) => Number(n.toFixed(3));
  const commands = [`M ${f(left + r)} ${f(top)} H ${f(right - r)}`];
  const corner = continuousCorner(r);
  const transforms = [
    ([x, y]: Point): Point => [right - r + x, top + y],
    ([x, y]: Point): Point => [right - y, bottom - r + x],
    ([x, y]: Point): Point => [left + r - x, bottom - y],
    ([x, y]: Point): Point => [left + y, top + r - x],
  ];
  const lines = [`V ${f(bottom - r)}`, `H ${f(left + r)}`, `V ${f(top + r)}`, 'Z'];
  transforms.forEach((transform, index) => {
    const points = corner.slice(1).map(transform).map(([x, y]) => `${f(x)} ${f(y)}`);
    commands.push('C ' + points.slice(0, 3).join(' '), 'C ' + points.slice(3).join(' '), lines[index] ?? 'Z');
  });
  return commands.join(' ');
}

export function continuousMask(rect: Rect): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}"><path d="${continuousRectPath(rect)}" fill="white"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
