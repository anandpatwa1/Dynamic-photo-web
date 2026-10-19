import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/publicApi';

const SiteContentContext = createContext(null);

const SECTION_FEATURES = Object.freeze({
  portfolio: 'portfolio',
  packages: 'website_packages',
  testimonials: 'testimonials',
});

const applyFeatureAvailability = (site) => {
  if (!site || typeof site !== 'object') return null;
  const features = site.features && typeof site.features === 'object' ? site.features : {};
  const sectionsEnabled = { ...(site.settings?.sectionsEnabled ?? {}) };

  Object.entries(SECTION_FEATURES).forEach(([section, feature]) => {
    if (features[feature] !== true) sectionsEnabled[section] = false;
  });

  return {
    ...site,
    settings: { ...(site.settings ?? {}), sectionsEnabled },
  };
};

const updateDocumentMetadata = (site) => {
  const title = site?.seo?.title || site?.brand?.name;
  const description = site?.seo?.description || site?.brand?.tagline;
  if (title) document.title = title;
  if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
};

const LoadingPage = () => (
  <main className="min-h-screen animate-pulse bg-site-paper" aria-busy="true" aria-label="Loading website">
    <div className="h-20 border-b border-site-line/50" />
    <div className="mx-auto max-w-8xl px-5 pt-28 sm:px-8 lg:px-12">
      <div className="h-3 w-28 bg-site-paper-alt" />
      <div className="mt-7 h-14 w-4/5 max-w-2xl bg-site-paper-alt" />
      <div className="mt-5 h-4 w-3/5 max-w-xl bg-site-paper-alt" />
    </div>
  </main>
);

const UnavailablePage = () => (
  <main className="grid min-h-screen place-items-center bg-site-paper px-6 text-center text-site-ink">
    <div>
      <p className="text-site-eyebrow font-medium uppercase text-site-accent">Portfolio</p>
      <h1 className="mt-4 font-serif text-site-h2 font-light">This website is temporarily unavailable.</h1>
      <button type="button" onClick={() => window.location.reload()} className="mt-7 min-h-11 bg-site-ink px-7 text-site-eyebrow font-medium uppercase text-white">
        Try again
      </button>
    </div>
  </main>
);

export const SiteContentProvider = ({ children }) => {
  const [state, setState] = useState({ status: 'loading', content: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', content: null });

    publicApi.getSite(controller.signal)
      .then((payload) => {
        const content = applyFeatureAvailability(payload?.data?.site);
        if (!content?.brand) throw new Error('The public site payload is incomplete');
        updateDocumentMetadata(content);
        setState({ status: 'ready', content });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', content: null });
      });

    return () => controller.abort();
  }, []);

  if (state.status === 'loading') return <LoadingPage />;
  if (state.status === 'error') return <UnavailablePage />;
  return <SiteContentContext.Provider value={state.content}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = () => useContext(SiteContentContext);

export const useSection = (key) => {
  const content = useSiteContent();
  return useMemo(() => content?.[key], [content, key]);
};

export const useBusinessFeature = (feature) => useSiteContent()?.features?.[feature] === true;
