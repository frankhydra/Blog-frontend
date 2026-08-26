// A small set of muted, postmark-palette-consistent colors used to give
// each author their own visual identity across the site. The admin/site
// owner always gets the reserved wax color - it's never handed out to an
// author, so "that particular color" reliably means "the owner" anywhere
// it shows up. Everyone else is assigned a color deterministically from
// their user id, so the same person always shows the same flag color on
// every page, every time, with no lookup or storage needed.
const AUTHOR_FLAG_COLORS = [
  'var(--accent)',   // indigo
  'var(--theme-forest)',
  'var(--theme-ochre)',
  '#3D6B76',         // teal
  '#6B4C8A',         // plum
];

export function getAuthorFlag(person) {
  if (!person) return { color: 'var(--muted)', title: '' };

  if (person.role === 'admin') {
    return { color: 'var(--wax)', title: 'Site owner' };
  }

  const seed = String(person.id ?? person.name ?? '')
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return {
    color: AUTHOR_FLAG_COLORS[seed % AUTHOR_FLAG_COLORS.length],
    title: person.name,
  };
}
