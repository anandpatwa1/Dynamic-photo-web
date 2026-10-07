import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fixtures } from './fixtures';
import { publicApi } from '../api/publicApi';

const SiteContentContext = createContext(fixtures);

/**
 * Where every piece of site copy comes from.
 *
 * Deliberately not Redux. The site is read-mostly and needs one request; wiring
 * RTK in would add weight to the marketing bundle — the exact thing the
 * provider split in `crm/CrmRoot` was done to avoid. Plain `fetch` also keeps
 * the CRM's axios instance (and its auth-refresh interceptor) out of `/`.
 *
 * `fixtures` seeds the initial state so the page paints complete content on
 * first frame; the fetch then reconciles it with whatever the CMS holds. If the
 * API is unreachable the visitor still sees a finished site rather than a
 * skeleton — the right failure mode for a marketing page.
 */
/**
 * Merges CMS content over the defaults.
 *
 * Per-key rather than a blanket spread, and skipping values the CMS has not
 * filled in yet. A studio that has written hero copy but not yet the about
 * section should see their hero live and the default about — not a heading
 * that has silently become an empty string. Arrays are only taken when they
 * have entries, for the same reason.
 */
const mergeSection = (base, incoming) => {
  if (incoming === undefined || incoming === null) return base;
  if (Array.isArray(incoming)) return incoming.length > 0 ? incoming : base;
  if (typeof incoming !== 'object') return incoming === '' ? base : incoming;

  const merged = { ...base };
  Object.entries(incoming).forEach(([key, value]) => {
    merged[key] = mergeSection(base?.[key], value);
  });
  return merged;
};

export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState(fixtures);

  useEffect(() => {
    const controller = new AbortController();

    publicApi
      .getSite(controller.signal)
      .then((payload) => {
        const remote = payload?.data?.site;
        if (remote) setContent((prev) => mergeSection(prev, remote));
      })
      .catch(() => {
        /* Defaults already rendered. Nothing to recover from. */
      });

    return () => controller.abort();
  }, []);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = () => useContext(SiteContentContext);

/** Convenience reader for a single top-level section. */
export const useSection = (key) => {
  const content = useSiteContent();
  return useMemo(() => content?.[key], [content, key]);
};
