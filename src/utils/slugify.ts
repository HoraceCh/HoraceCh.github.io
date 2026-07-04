export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `item-${shortHash(value)}`;
}

export function noteSlug(id: string) {
  return id.replace(/\.mdx?$/, '').replace(/\/index$/, '');
}

function shortHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).slice(0, 6);
}
