/**
 * Removes every costing field from an API payload (A4: costing never leaves
 * the server for users without viewCosting). Works on plain objects/arrays.
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
const COST_KEYS = new Set(['costPrice', 'cost', 'profit', 'marginPct']);

export const stripCosting = (value) => {
  if (Array.isArray(value)) return value.map(stripCosting);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    // ObjectIds and other class instances serialise as themselves.
    if (value._bsontype || typeof value.toHexString === 'function') return value;
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (COST_KEYS.has(key)) continue;
      out[key] = stripCosting(inner);
    }
    return out;
  }
  return value;
};
