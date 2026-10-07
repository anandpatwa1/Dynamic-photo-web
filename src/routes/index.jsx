import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { CRM_BASE } from './paths';

// Two independent trees, each its own chunk. The marketing site must never pull
// in the CRM's store or axios instance, so neither import appears above.
const SiteRoot = lazy(() => import('@/website/SiteRoot'));
const CrmRoot = lazy(() => import('@/crm/CrmRoot'));
const PublicProfileResolver = lazy(() => import('@/public-profile/PublicProfileResolver').then((module) => ({ default: module.PublicProfileResolver })));

/**
 * `/CRM` is the documented casing, but no lowercase redirect is needed: React
 * Router matches paths case-insensitively, so `/crm/login` already resolves
 * here. Verified rather than assumed — an earlier version of this file carried
 * a redirect route that could never match.
 */
export const AppRoutes = () => (
  <Suspense fallback={null}>
    <Routes>
      <Route path={`${CRM_BASE}/*`} element={<CrmRoot />} />
      <Route path="/:slug" element={<PublicProfileResolver />} />
      <Route path="/*" element={<SiteRoot />} />
    </Routes>
  </Suspense>
);
