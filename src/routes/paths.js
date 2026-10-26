/**
 * Every CRM URL in one place.
 *
 * The CRM used to own the root path. It now lives under a `/CRM` prefix so the
 * marketing site can have `/`. Hardcoding the prefix at ~40 call sites is how
 * that kind of move goes wrong the second time, so callers build paths from
 * here instead.
 */
export const CRM_BASE = '/CRM';

const at = (path = '') => `${CRM_BASE}${path}`;

export const CRM = {
  base: CRM_BASE,
  login: at('/login'),
  register: at('/register'),
  dashboard: at('/dashboard'),
  clients: at('/clients'),
  client: (id) => at(`/clients/${id}`),
  packages: at('/packages'),
  projects: at('/projects'),
  documents: at('/documents'),
  quotations: at('/quotations'),
  estimates: at('/estimates'),
  bills: at('/bills'),
  documentNew: at('/documents/new'),
  document: (id) => at(`/documents/${id}`),
  documentEdit: (id) => at(`/documents/${id}/edit`),
  payments: at('/payments'),
  reports: at('/reports'),
  profile: at('/profile'),
  settings: at('/settings'),
  team: at('/team'),
  activity: at('/activity'),
  businesses: at('/businesses'),

  // Website Management (admin-only, lives inside the CRM shell).
  website: at('/website'),
  websiteHomepage: at('/website/homepage'),
  websitePortfolio: at('/website/portfolio'),
  websitePortfolioNew: at('/website/portfolio/new'),
  websitePortfolioEdit: (id) => at(`/website/portfolio/${id}/edit`),
  websitePackages: at('/website/packages'),
  websiteSections: at('/website/sections'),
  websiteTestimonials: at('/website/testimonials'),
  websiteContact: at('/website/contact'),
  websiteInquiries: at('/website/inquiries'),
  websiteSeo: at('/website/seo'),
  websiteSettings: at('/website/settings'),
  websiteProfiles: at('/website/profiles'),

  // Wedding Quote module (client/src/wedding-quote).
  wq: at('/wedding-quote'),
  wqCreate: at('/wedding-quote/create'),
  wqQuotes: at('/wedding-quote/quotes'),
  wqBookings: at('/wedding-quote/bookings'),
  wqQuoteEdit: (id) => at(`/wedding-quote/quotes/${id}/edit`),
  wqQuoteSetup: (id) => at(`/wedding-quote/quotes/${id}/setup`),
  wqItems: at('/wedding-quote/masters/items'),
  wqSets: at('/wedding-quote/masters/deliverable-sets'),
  wqAddOns: at('/wedding-quote/masters/addons'),
  wqPresets: at('/wedding-quote/masters/package-presets'),
  wqThemes: at('/wedding-quote/themes'),
  wqThemeAssignment: at('/wedding-quote/themes/assignment'),
  wqSettings: at('/wedding-quote/settings'),
};

/** Public marketing site. Sections are hash targets on a single page. */
export const SITE = {
  home: '/',
  section: (id) => `/#${id}`,
  portfolio: '/#portfolio',
  packages: '/#packages',
  about: '/#about',
  contact: '/#contact',
};
