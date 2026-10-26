import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uniquePublicPackages } from '../utils/publicOffers';
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
    packages: site.packages ? {...site.packages,items:uniquePublicPackages(site.packages.items || [])} : site.packages,
    settings: { ...(site.settings ?? {}), sectionsEnabled },
  };
};

const setMetaTag = (selector, attrName, attrValue, content) => {
  if (!content) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setLinkCanonical = (href) => {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const updateDocumentMetadata = (site) => {
  const brandName = site?.brand?.name || 'Dynamic Photography';
  const title = site?.seo?.title || `${brandName} — Best Wedding & Pre-Wedding Photographer in Indore`;
  const description = site?.seo?.description || site?.brand?.tagline || 'Cinematic wedding stories & candid photography in Indore, Madhya Pradesh.';
  const keywords = Array.isArray(site?.seo?.keywords) && site.seo.keywords.length > 0
    ? site.seo.keywords.join(', ')
    : 'wedding photographer in indore, best photographer in indore, pre wedding shoot indore, candid wedding photographer indore, cinematic wedding films indore';
  const canonical = site?.seo?.canonicalUrl || window.location.origin;
  const ogImage = site?.seo?.ogImage?.url || site?.about?.portrait?.url;

  if (title) document.title = title;

  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
  if (ogImage) setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);

  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  if (ogImage) setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

  if (canonical) setLinkCanonical(canonical);
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
