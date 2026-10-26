const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
/** Suppress identical public offers; CRM packages and pricing remain untouched. */
export const uniquePublicPackages = items => {
  const seen = new Set();
  return items.filter(item => {
    const key = JSON.stringify([normalize(item.name),normalize(item.description),(item.features || []).map(normalize).sort()]);
    if (seen.has(key)) return false;
    seen.add(key);return true;
  });
};
