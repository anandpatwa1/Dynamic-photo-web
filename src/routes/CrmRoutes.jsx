import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { PageLoader } from '@/components/ui';
import { CRM } from './paths';

// Route-level code splitting keeps the initial bundle small.
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Settings = lazy(() => import('@/pages/settings/Settings'));
const Clients = lazy(() => import('@/pages/clients/Clients'));
const ClientDetail = lazy(() => import('@/pages/clients/ClientDetail'));
const Packages = lazy(() => import('@/pages/packages/Packages'));
const Documents = lazy(() => import('@/pages/documents/Documents'));
const DocumentForm = lazy(() => import('@/pages/documents/DocumentForm'));
const DocumentDetail = lazy(() => import('@/pages/documents/DocumentDetail'));
const Projects = lazy(() => import('@/pages/projects/Projects'));
const Payments = lazy(() => import('@/pages/payments/Payments'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Reports = lazy(() => import('@/pages/reports/Reports'));
const Profile = lazy(() => import('@/pages/profile/Profile'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const WeddingQuoteRoutes = lazy(() => import('@/wedding-quote/WeddingQuoteRoutes'));

// Website Management — admin-only.
const Homepage = lazy(() => import('@/pages/website/Homepage'));
const WebsitePortfolio = lazy(() => import('@/pages/website/WebsitePortfolio'));
const WebsiteSections = lazy(() => import('@/pages/website/WebsiteSections'));
const WebsitePackages = lazy(() => import('@/pages/website/WebsitePackages'));
const WebsiteTestimonials = lazy(() => import('@/pages/website/WebsiteTestimonials'));
const Inquiries = lazy(() => import('@/pages/website/Inquiries'));
const WebsiteContact = lazy(() => import('@/pages/website/WebsiteContact'));
const WebsiteSeo = lazy(() => import('@/pages/website/WebsiteSeo'));
const WebsiteSettings = lazy(() => import('@/pages/website/WebsiteSettings'));
const PublicProfiles = lazy(() => import('@/pages/website/PublicProfiles'));

/**
 * Mounted at `/CRM/*`, so every path here is relative to that prefix. Absolute
 * targets come from `CRM` in ./paths — never written inline.
 */
export const CrmRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={CRM.dashboard} replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="packages" element={<Packages />} />
          <Route path="projects" element={<Projects />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/new" element={<DocumentForm />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="documents/:id/edit" element={<DocumentForm />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          {/* Wedding Quote — permission-gated per page (and per API route). */}
          <Route path="wedding-quote/*" element={<WeddingQuoteRoutes />} />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="settings" element={<Settings />} />

            {/* Website Management. `index` redirects the bare /CRM/website. */}
            <Route path="website">
              <Route index element={<Navigate to={CRM.websiteHomepage} replace />} />
              <Route path="homepage" element={<Homepage />} />
              <Route path="portfolio" element={<WebsitePortfolio />} />
              <Route path="sections" element={<WebsiteSections />} />
              <Route path="packages" element={<WebsitePackages />} />
              <Route path="testimonials" element={<WebsiteTestimonials />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="contact" element={<WebsiteContact />} />
              <Route path="seo" element={<WebsiteSeo />} />
              <Route path="settings" element={<WebsiteSettings />} />
              <Route path="profiles" element={<PublicProfiles />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
