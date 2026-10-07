/**
 * Single source of truth for section anchors and the order of the page.
 *
 * The header, the footer, the scroll-spy and the page itself all read from
 * `composePage`, so a section the studio adds, hides, renames or moves in the
 * admin shows up everywhere at once and a menu link can never point at nothing.
 */

/** Every built-in section the page knows how to draw, in the reference order. */
export const DEFAULT_ORDER = ['hero', 'featured', 'portfolio', 'packages', 'about', 'testimonials', 'contact'];

/** Built-in sections that earn a menu link, with their default wording. */
export const NAV_DEFAULTS = {
  hero: 'Home',
  portfolio: 'Portfolio',
  packages: 'Packages',
  about: 'About Us',
  contact: 'Contact',
};

/**
 * The page as an ordered list: built-in sections in the admin's order, with
 * each custom section directly beneath the one it was attached to. A custom
 * section whose anchor is switched off is not lost; it moves to just before
 * Contact so it still appears.
 */
export const composePage = (content) => {
  const { sectionsEnabled = {}, sectionOrder } = content?.settings ?? {};
  const known = new Set(DEFAULT_ORDER);
  const order = (sectionOrder?.length ? sectionOrder : DEFAULT_ORDER).filter(
    (key) => known.has(key) && sectionsEnabled[key] !== false,
  );

  const customs = content?.sections ?? [];
  const entries = [];
  const placed = new Set();

  order.forEach((key) => {
    entries.push({ type: 'builtin', key });
    customs
      .filter((section) => section.placeAfter === key)
      .forEach((section) => {
        entries.push({ type: 'custom', section });
        placed.add(section.id);
      });
  });

  const orphans = customs
    .filter((section) => !placed.has(section.id))
    .map((section) => ({ type: 'custom', section }));

  if (orphans.length > 0) {
    const contactAt = entries.findIndex((entry) => entry.type === 'builtin' && entry.key === 'contact');
    entries.splice(contactAt === -1 ? entries.length : contactAt, 0, ...orphans);
  }

  return entries;
};

/** Menu links for the header and footer, following the page order. */
export const buildNavLinks = (content) => {
  const labels = content?.settings?.navLabels ?? {};

  return composePage(content).flatMap((entry) => {
    if (entry.type === 'custom') {
      return entry.section.showInNav
        ? [{ id: entry.section.slug, label: entry.section.navLabel || entry.section.title }]
        : [];
    }
    if (!NAV_DEFAULTS[entry.key]) return [];
    return [{ id: entry.key, label: labels[entry.key] || NAV_DEFAULTS[entry.key] }];
  });
};
