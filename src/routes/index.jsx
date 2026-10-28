import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { CRM_BASE } from './paths';

// Two independent trees, each its own chunk. The marketing site must never pull
// in the CRM's store or axios instance, so neither import appears above.
const PublicBookingCalendar = lazy(() => import('@/wedding-quote/pages/bookings/PublicBookingCalendar'));
const PublicQuoteView = lazy(() => import('@/wedding-quote/pages/quotes/PublicQuoteView'));
const PackageCustomizer = lazy(() => import('@/website/pages/PackageCustomizer').then((m) => ({ default: m.PackageCustomizer })));
const WeddingQrLanding = lazy(() => import('@/website/pages/WeddingQrLanding'));
const DriveGalleryView = lazy(() => import('@/website/pages/DriveGalleryView'));
const SiteRoot = lazy(() => import('@/website/SiteRoot'));
const CrmRoot = lazy(() => import('@/crm/CrmRoot'));
const PublicProfileResolver = lazy(() => import('@/public-profile/PublicProfileResolver').then((module) => ({ default: module.PublicProfileResolver })));

/**
 * `/CRM` is the documented casing, but no lowercase redirect is needed: React
 * Router matches paths case-insensitively, so `/crm/login` already resolves
 * here. Verified rather than assumed — an earlier version of this file carried
 * a redirect route that could never match.
 */
const RouteIndexPolicy = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!/^\/(CRM|quote|booking-calendar)(\/|$)/i.test(pathname)) return undefined;
    let meta = document.head.querySelector('meta[name="robots"]');
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    const previous = meta.getAttribute('content');
    meta.setAttribute('content', 'noindex,nofollow');
    return () => { if (created) meta.remove(); else if (previous === null) meta.removeAttribute('content'); else meta.setAttribute('content', previous); };
  }, [pathname]);
  return null;
};

export const AppRoutes = () => (
  <Suspense fallback={null}>
    <RouteIndexPolicy />
    <Routes>
      <Route path="/booking-calendar/:slug" element={<PublicBookingCalendar />} />
      <Route path="/quote/:token" element={<PublicQuoteView />} />
      <Route path="/customize" element={<PackageCustomizer />} />
      <Route path="/build-package" element={<PackageCustomizer />} />
      <Route path="/photos/:slug" element={<WeddingQrLanding />} />
      <Route path="/gallery/:slug" element={<DriveGalleryView />} />
      <Route path={`${CRM_BASE}/*`} element={<CrmRoot />} />
      <Route path="/:slug" element={<PublicProfileResolver />} />
      <Route path="/*" element={<SiteRoot />} />
    </Routes>
  </Suspense>
);
