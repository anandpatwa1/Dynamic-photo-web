export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Dynamic Production';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub_admin',
  MANAGER: 'manager',
  STAFF: 'staff',
};

export const ACCOUNT_SCOPES = {
  PLATFORM: 'platform',
  BUSINESS: 'business',
};

export const BUSINESS_FEATURES = {
  PORTFOLIO: 'portfolio',
  GALLERY: 'gallery',
  PUBLIC_PROFILES: 'public_profiles',
  WEBSITE_PACKAGES: 'website_packages',
  TESTIMONIALS: 'testimonials',
  INQUIRIES: 'inquiries',
  CRM_CLIENTS: 'crm_clients',
  CRM_PACKAGES: 'crm_packages',
  PROJECTS: 'projects',
  DOCUMENTS: 'documents',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
  WEDDING_QUOTES: 'wedding_quotes',
  BOOKING_CALENDAR: 'booking_calendar',
  THEME_LIBRARY: 'theme_library',
  ADVANCED_ANALYTICS: 'advanced_analytics',
};

export const ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, label: 'Super Admin', description: 'Owner access to every setting, user and activity' },
  { value: ROLES.ADMIN, label: 'Admin', description: 'Full daily access, including team management' },
  { value: ROLES.SUB_ADMIN, label: 'Sub Admin', description: 'Broad operational access without owner controls' },
  { value: ROLES.MANAGER, label: 'Manager', description: 'Manage daily clients, jobs, documents and quotes' },
  { value: ROLES.STAFF, label: 'Staff', description: 'View assigned work and create basic quotes' },
];

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view', REPORTS_VIEW: 'reports.view',
  CLIENTS_VIEW: 'clients.view', CLIENTS_CREATE: 'clients.create', CLIENTS_EDIT: 'clients.edit', CLIENTS_DELETE: 'clients.delete',
  PACKAGES_VIEW: 'packages.view', PACKAGES_CREATE: 'packages.create', PACKAGES_EDIT: 'packages.edit', PACKAGES_DELETE: 'packages.delete',
  PROJECTS_VIEW: 'projects.view', PROJECTS_CREATE: 'projects.create', PROJECTS_EDIT: 'projects.edit', PROJECTS_DELETE: 'projects.delete',
  DOCUMENTS_VIEW: 'documents.view', DOCUMENTS_CREATE: 'documents.create', DOCUMENTS_EDIT: 'documents.edit', DOCUMENTS_DELETE: 'documents.delete',
  PAYMENTS_VIEW: 'payments.view', PAYMENTS_CREATE: 'payments.create', PAYMENTS_EDIT: 'payments.edit', PAYMENTS_DELETE: 'payments.delete',
  WQ_VIEW: 'wedding_quote.view', WQ_CREATE: 'wedding_quote.create', WQ_EDIT: 'wedding_quote.edit', WQ_DELETE: 'wedding_quote.delete',
  WQ_MASTERS: 'wedding_quote.manage_masters', WQ_THEMES: 'wedding_quote.manage_themes', WQ_COSTING: 'wedding_quote.view_costing',
  WQ_EXPORT: 'wedding_quote.export', WQ_PERMISSIONS: 'wedding_quote.manage_permissions',
  WEBSITE_MANAGE: 'website.manage', SETTINGS_MANAGE: 'settings.manage', TEAM_MANAGE: 'team.manage', ACTIVITY_VIEW: 'activity.view',
};

export const DOCUMENT_TYPES = {
  QUOTATION: 'quotation',
  ESTIMATE: 'estimate',
  INVOICE: 'invoice',
};

/**
 * One Documents module, three faces. Everything below the `type` switch is
 * identical — only labels and the default status vocabulary change.
 */
export const DOCUMENT_TYPE_OPTIONS = [
  {
    value: DOCUMENT_TYPES.QUOTATION,
    label: 'Quotation',
    description: 'A priced proposal shared before work is confirmed',
    partyLabel: 'Quoted To',
  },
  {
    value: DOCUMENT_TYPES.ESTIMATE,
    label: 'Estimate',
    description: 'An indicative cost breakdown for planning',
    partyLabel: 'Estimate For',
  },
  {
    value: DOCUMENT_TYPES.INVOICE,
    label: 'Invoice',
    description: 'A payable bill issued after work is confirmed',
    partyLabel: 'Billed To',
  },
];

export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

/** `tone` maps to the Badge component's variants. */
export const DOCUMENT_STATUS_META = {
  [DOCUMENT_STATUS.DRAFT]: { label: 'Draft', tone: 'neutral' },
  [DOCUMENT_STATUS.SENT]: { label: 'Sent', tone: 'info' },
  [DOCUMENT_STATUS.ACCEPTED]: { label: 'Accepted', tone: 'success' },
  [DOCUMENT_STATUS.REJECTED]: { label: 'Rejected', tone: 'danger' },
  [DOCUMENT_STATUS.PARTIALLY_PAID]: { label: 'Partially Paid', tone: 'warning' },
  [DOCUMENT_STATUS.PAID]: { label: 'Paid', tone: 'success' },
  [DOCUMENT_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
};

export const CLIENT_STATUS = {
  LEAD: 'lead',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
};

export const CLIENT_STATUS_META = {
  [CLIENT_STATUS.LEAD]: { label: 'Lead', tone: 'warning' },
  [CLIENT_STATUS.ACTIVE]: { label: 'Active', tone: 'success' },
  [CLIENT_STATUS.INACTIVE]: { label: 'Inactive', tone: 'neutral' },
  [CLIENT_STATUS.ARCHIVED]: { label: 'Archived', tone: 'neutral' },
};

export const PROJECT_STATUS = {
  ENQUIRY: 'enquiry',
  CONFIRMED: 'confirmed',
  SHOOTING: 'shooting',
  EDITING: 'editing',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PROJECT_STATUS_META = {
  [PROJECT_STATUS.ENQUIRY]: { label: 'Enquiry', tone: 'neutral' },
  [PROJECT_STATUS.CONFIRMED]: { label: 'Confirmed', tone: 'info' },
  [PROJECT_STATUS.SHOOTING]: { label: 'Shooting', tone: 'brand' },
  [PROJECT_STATUS.EDITING]: { label: 'Editing', tone: 'warning' },
  [PROJECT_STATUS.DELIVERED]: { label: 'Delivered', tone: 'success' },
  [PROJECT_STATUS.COMPLETED]: { label: 'Completed', tone: 'success' },
  [PROJECT_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'danger' },
};

export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_STATUS_META = {
  received: { label: 'Received', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

export const PACKAGE_CATEGORIES = [
  { value: 'monthly_content', label: 'Monthly Content' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'pre_wedding', label: 'Pre Wedding' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'product_shoot', label: 'Product Shoot' },
  { value: 'drone_shoot', label: 'Drone Shoot' },
  { value: 'event', label: 'Event' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Other' },
];

/** PDF themes: 2 legacy + 4 new designs */
export const PDF_THEMES = [
  {
    value: 'gold',
    label: 'Classic Gold',
    description: 'Warm gold accents with a black table header',
    swatch: ['#B8863B', '#111111', '#F7EDD9'],
  },
  {
    value: 'olive',
    label: 'Botanical Olive',
    description: 'Muted olive with botanical rules and soft cards',
    swatch: ['#5C6650', '#3B4234', '#EDEFE9'],
  },
  {
    value: 'minimal-white',
    label: 'Minimal White',
    description: 'Clean, editorial aesthetic with soft accents',
    swatch: ['#6366f1', '#1e293b', '#ffffff'],
  },
  {
    value: 'luxury-black',
    label: 'Luxury Black',
    description: 'Dark, premium feel with gold accents',
    swatch: ['#fbbf24', '#000000', '#1f2937'],
  },
  {
    value: 'photography-beige',
    label: 'Photography Beige',
    description: 'Warm editorial with terracotta accents',
    swatch: ['#c85c3c', '#44403c', '#faf8f3'],
  },
  {
    value: 'corporate-blue',
    label: 'Corporate Blue',
    description: 'Professional modern design with structured layout',
    swatch: ['#2563eb', '#1e3a8a', '#f8fafc'],
  },
];

export const DISCOUNT_TYPES = [
  { value: 'flat', label: '₹ Flat' },
  { value: 'percent', label: '% Percent' },
];

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Turns a `{ value: { label, tone } }` status map into `[{ value, label }]`
 * for a <Select>. Every list page needs this; defining it once keeps the
 * option order and labels identical everywhere.
 */
export const statusOptions = (meta) =>
  Object.entries(meta).map(([value, config]) => ({ value, label: config.label }));
