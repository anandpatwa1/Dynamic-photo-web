/** Human names for the section keys stored on WebsiteContent.settings. */
export const SECTION_LABELS = {
  hero: 'Hero',
  featured: 'Opening statement & categories',
  portfolio: 'Portfolio',
  packages: 'Packages',
  about: 'About us',
  testimonials: 'Testimonials',
  contact: 'Contact',
};

export const PORTFOLIO_CATEGORY_OPTIONS = [
  { value: 'weddings', label: 'Weddings' },
  { value: 'pre-weddings', label: 'Pre-Weddings' },
  { value: 'cinematic-films', label: 'Cinematic Films' },
  { value: 'engagements', label: 'Engagements' },
  { value: 'events', label: 'Events' },
  { value: 'portraits', label: 'Portraits' },
];

/** Tile shape in the public masonry. */
export const PORTFOLIO_SPAN_OPTIONS = [
  { value: 'std', label: 'Standard (4:5)' },
  { value: 'tall', label: 'Tall (3:4)' },
  { value: 'wide', label: 'Wide (4:3)' },
];

/**
 * Icons an admin may choose for a stat or a pillar.
 *
 * The set is fixed because the site maps these names to components; a free-text
 * field would let someone save a value that renders nothing. Keep in step with
 * SITE_ICONS in website/sections/Stats.jsx.
 */
export const ICON_OPTIONS = [
  { value: 'rings', label: 'Rings' },
  { value: 'camera', label: 'Camera' },
  { value: 'award', label: 'Award' },
  { value: 'heart', label: 'Heart' },
  { value: 'users', label: 'Team' },
  { value: 'clock', label: 'Clock' },
  { value: 'aperture', label: 'Aperture' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'gem', label: 'Gem' },
];

export const INQUIRY_STATUS_META = {
  new: { label: 'New', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'warning' },
  converted: { label: 'Converted', tone: 'success' },
  spam: { label: 'Spam', tone: 'neutral' },
};
