import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

const toDate = (value) => {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
};

/** ₹ 13,000.00 — Indian grouping, always 2dp. */
export const formatCurrency = (value, { symbol = true, decimals = 2 } = {}) => {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
  return symbol ? `₹ ${formatted}` : formatted;
};

/** Compact form for dashboard tiles: ₹1.2L, ₹3.4Cr. */
export const formatCompactCurrency = (value) => {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value) || 0);

export const formatDate = (value, pattern = 'dd MMM yyyy') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
};

/** Matches the reference documents' date style: 29-07-2026. */
export const formatDocumentDate = (value) => {
  const date = toDate(value);
  return date ? format(date, 'dd-MM-yyyy') : '—';
};

export const formatDateTime = (value) => {
  const date = toDate(value);
  return date ? format(date, "dd MMM yyyy 'at' h:mm a") : '—';
};

/** For input[type=date] values. */
export const toDateInputValue = (value) => {
  const date = toDate(value);
  return date ? format(date, 'yyyy-MM-dd') : '';
};

export const formatRelative = (value) => {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '—';
};

/** "monthly_content" / "partially_paid" → "Monthly Content". */
export const humanize = (value = '') =>
  String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const truncate = (value = '', length = 60) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;

/** Joins the populated parts of an address object into one line. */
export const formatAddress = (address = {}, separator = ', ') =>
  [address.line1, address.line2, address.city, address.state, address.pincode, address.country]
    .filter(Boolean)
    .join(separator);

export const formatPercent = (value, decimals = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(decimals).replace(/\.0+$/, '')}%`;
};
