/**
 * Integer-rupee money helpers. Every amount in the Wedding Quote module is a
 * whole number of rupees, so float drift (0.1 + 0.2) can never reach a total.
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 * Edit one, copy to the other; tests/engine-parity.test.js fails if they drift.
 */

/** Coerces anything to a safe, non-negative integer number of rupees. */
export const toRupees = (value) => {
  const n = typeof value === 'string' ? Number(value.replace(/[₹,\s]/g, '')) : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

/** Signed integer (used for deltas, which may be negative). */
export const toSignedRupees = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/**
 * Indian digit grouping without relying on Intl (which differs between
 * Node builds and browsers): 110000 → "1,10,000".
 */
export const groupIndian = (value) => {
  const n = toSignedRupees(value);
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.abs(n));
  if (digits.length <= 3) return sign + digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}${rest},${last3}`;
};

/** "₹1,10,000" (or "-₹5,000"). */
export const formatINR = (value) => {
  const n = toSignedRupees(value);
  return n < 0 ? `-₹${groupIndian(-n)}` : `₹${groupIndian(n)}`;
};
