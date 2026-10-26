import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { PageLoader } from '@/components/ui';
import { CRM } from './paths';
import { BUSINESS_FEATURES, DOCUMENT_TYPES, PERMISSIONS } from '@/constants';

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
const TeamAccess = lazy(() => import('@/pages/team/TeamAccess'));
const ActivityLogs = lazy(() => import('@/pages/activity/ActivityLogs'));
const BusinessManagement = lazy(() => import('@/pages/businesses/BusinessManagement'));
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
          <Route element={<ProtectedRoute permission={PERMISSIONS.CLIENTS_VIEW} feature={BUSINESS_FEATURES.CRM_CLIENTS} />}>
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
          </Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.PACKAGES_VIEW} feature={BUSINESS_FEATURES.CRM_PACKAGES} />}><Route path="packages" element={<Packages />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.PROJECTS_VIEW} feature={BUSINESS_FEATURES.PROJECTS} />}><Route path="projects" element={<Projects />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.DOCUMENTS_VIEW} feature={BUSINESS_FEATURES.DOCUMENTS} />}>
            <Route path="documents" element={<Documents />} />
            <Route path="quotations" element={<Documents fixedType={DOCUMENT_TYPES.QUOTATION} />} />
            <Route path="estimates" element={<Documents fixedType={DOCUMENT_TYPES.ESTIMATE} />} />
            <Route path="bills" element={<Documents fixedType={DOCUMENT_TYPES.INVOICE} />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
          </Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.DOCUMENTS_CREATE} feature={BUSINESS_FEATURES.DOCUMENTS} />}><Route path="documents/new" element={<DocumentForm />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.DOCUMENTS_EDIT} feature={BUSINESS_FEATURES.DOCUMENTS} />}><Route path="documents/:id/edit" element={<DocumentForm />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.PAYMENTS_VIEW} feature={BUSINESS_FEATURES.PAYMENTS} />}><Route path="payments" element={<Payments />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.REPORTS_VIEW} feature={BUSINESS_FEATURES.REPORTS} />}><Route path="reports" element={<Reports />} /></Route>
          <Route path="profile" element={<Profile />} />
          <Route element={<ProtectedRoute platformOnly />}>
            <Route path="businesses" element={<BusinessManagement />} />
          </Route>
          {/* Wedding Quote — permission-gated per page (and per API route). */}
          <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.WEDDING_QUOTES} />}>
            <Route path="wedding-quote/*" element={<WeddingQuoteRoutes />} />
          </Route>

          <Route element={<ProtectedRoute permission={PERMISSIONS.SETTINGS_MANAGE} />}>
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.TEAM_MANAGE} />}><Route path="team" element={<TeamAccess />} /></Route>
          <Route element={<ProtectedRoute permission={PERMISSIONS.ACTIVITY_VIEW} />}><Route path="activity" element={<ActivityLogs />} /></Route>

          <Route element={<ProtectedRoute permission={PERMISSIONS.WEBSITE_MANAGE} />}>
            {/* Website Management. `index` redirects the bare /CRM/website. */}
            <Route path="website">
              <Route index element={<Navigate to={CRM.websiteHomepage} replace />} />
              <Route path="homepage" element={<Homepage />} />
              <Route path="contact" element={<WebsiteContact />} />
              <Route path="seo" element={<WebsiteSeo />} />
              <Route path="settings" element={<WebsiteSettings />} />
              <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.PORTFOLIO} />}>
                <Route path="portfolio" element={<WebsitePortfolio />} />
                <Route path="sections" element={<WebsiteSections />} />
              </Route>
              <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.WEBSITE_PACKAGES} />}><Route path="packages" element={<WebsitePackages />} /></Route>
              <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.TESTIMONIALS} />}><Route path="testimonials" element={<WebsiteTestimonials />} /></Route>
              <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.INQUIRIES} />}><Route path="inquiries" element={<Inquiries />} /></Route>
              <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.PUBLIC_PROFILES} />}><Route path="profiles" element={<PublicProfiles />} /></Route>
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
