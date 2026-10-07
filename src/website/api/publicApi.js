/**
 * The marketing site's only network layer.
 *
 * Deliberately not the CRM's axios instance: importing it would pull the auth
 * refresh interceptor, its token store and axios itself into the site bundle —
 * the exact weight the provider split was done to avoid.
 *
 * It does, however, have to honour the *same* base URL. The CRM reads
 * `VITE_API_BASE_URL`, so a deployment that puts the API on its own origin
 * (api.example.com) works for `/CRM` but would silently break the public site
 * if this hardcoded a relative `/api/v1` — the site would call its own origin
 * and get the SPA's index.html back instead of JSON.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message ?? response.statusText);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const publicApi = {
  getSite: (signal) => request('/public/site', { signal }),
  getPortfolioDetail: (slug, signal) => request(`/public/portfolio/${encodeURIComponent(slug)}`, { signal }),

  submitInquiry: (body) =>
    request('/public/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};
