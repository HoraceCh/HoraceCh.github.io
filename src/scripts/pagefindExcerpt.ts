export type PagefindExcerptSegment = {
  readonly text: string;
  readonly highlighted: boolean;
};

const highlightTag = /<\/?mark>/giu;
const namedEntities: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

const isUnicodeScalar = (value: number) => Number.isInteger(value)
  && value >= 0
  && value <= 0x10ffff
  && (value < 0xd800 || value > 0xdfff);

const decodeEntity = (entity: string): string => {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return isUnicodeScalar(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  if (entity.startsWith('#')) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return isUnicodeScalar(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  return namedEntities[entity] ?? `&${entity};`;
};

const decodeText = (value: string) => value.replace(/&(#(?:x[\da-f]+|\d+)|amp|apos|gt|lt|quot);/giu, (_, entity: string) => decodeEntity(entity));

export const parsePagefindExcerpt = (excerpt: string): readonly PagefindExcerptSegment[] => {
  const segments: PagefindExcerptSegment[] = [];
  let highlighted = false;
  let cursor = 0;

  const appendText = (value: string) => {
    if (!value) return;
    const text = decodeText(value);
    const previous = segments.at(-1);
    if (previous && previous.highlighted === highlighted) {
      segments[segments.length - 1] = { text: previous.text + text, highlighted };
    } else {
      segments.push({ text, highlighted });
    }
  };

  for (const match of excerpt.matchAll(highlightTag)) {
    appendText(excerpt.slice(cursor, match.index));
    highlighted = match[0].toLowerCase() === '<mark>';
    cursor = (match.index ?? 0) + match[0].length;
  }
  appendText(excerpt.slice(cursor));
  return segments;
};
