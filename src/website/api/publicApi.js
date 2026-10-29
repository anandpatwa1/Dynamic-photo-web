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
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5100/api/v1' : 'https://apinew.duckdns.org/api/v1')
).replace(/\/$/, '');

const requestOnce = async (path, options = {}) => {
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

// Bound both download and JSON parsing; retry read-only requests once, never submissions.
const request = async (path, options = {}) => {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  try {
    for (let attempt = 0; ; attempt += 1) {
      try { return await requestOnce(path, { ...options, signal: controller.signal }); }
      catch (error) {
        if (timedOut) throw new Error('The website took too long to respond. Please try again.');
        if (controller.signal.aborted || attempt > 0 || (options.method && options.method !== 'GET') || (error.status && error.status < 500) || error.status === 503) throw error;
      }
    }
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
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

  getCustomizerOptions: (signal) => request('/public/customizer/options', { signal }),
  calculateCustomQuote: (body) =>
    request('/public/customizer/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  submitCustomQuote: (body) =>
    request('/public/customizer/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getWeddingQrProject: (slug, signal) => request(`/public/wedding-qr/${encodeURIComponent(slug)}`, { signal }),
  registerWeddingQrGuest: (slug, payload) =>
    request(`/public/wedding-qr/${encodeURIComponent(slug)}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  trackWeddingQrEvent: (slug, event, payload = {}) =>
    request(`/public/wedding-qr/${encodeURIComponent(slug)}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
    }),
};
