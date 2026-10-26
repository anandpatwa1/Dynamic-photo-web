import { CRM, CRM_BASE } from '@/routes/paths';

/**
 * Normalises a post-login redirect target to a path inside this app.
 *
 * The target originates from the browser's own URL (captured by
 * `ProtectedRoute` when it bounces an anonymous visitor to the login screen),
 * so it is attacker-influenceable: a crafted link such as `//evil.com` or
 * `/\evil.com` would otherwise send the user off-site immediately after they
 * authenticate — a textbook open redirect, and a convincing one because it
 * happens right after a real login.
 *
 * Anything that is not a single-slash-prefixed relative path is discarded in
 * favour of the fallback.
 */
export const safeRedirect = (target, fallback = CRM.dashboard) => {
  if (typeof target !== 'string' || target.length === 0) return fallback;

  // Backslashes are treated as slashes by some browsers and by some routers,
  // so `/\evil.com` can escape the origin. Normalise before inspecting.
  const normalised = target.replace(/\\/g, '/');

  // Must be relative, must not be protocol-relative ("//host"), and must not
  // smuggle a scheme ("javascript:", "https:").
  if (!normalised.startsWith('/')) return fallback;
  if (normalised.startsWith('//')) return fallback;
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(normalised)) return fallback;

  // Only `ProtectedRoute` feeds this, and it only ever guards CRM routes. Since
  // the marketing site now owns `/`, a target outside `/CRM` means the value was
  // tampered with — and landing on the public homepage right after signing in
  // would read as a failed login.
  if (normalised !== CRM_BASE && !normalised.startsWith(`${CRM_BASE}/`)) return fallback;

  return normalised;
};
