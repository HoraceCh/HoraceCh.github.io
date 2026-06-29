export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function noteSlug(id: string) {
  return id.replace(/\.mdx?$/, '').replace(/\/index$/, '');
}
