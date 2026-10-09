/**
 * Wedding Quote module routes, mounted at /CRM/wedding-quote/* by CrmRoutes.
 * Every page is lazy so the module costs nothing until it is opened.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/components/ui';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CRM } from '@/routes/paths';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { BUSINESS_FEATURES } from '@/constants';

const QuoteList = lazy(() => import('./pages/quotes/QuoteList'));
const CreateWizard = lazy(() => import('./pages/quotes/CreateWizard'));
const QuoteEditor = lazy(() => import('./pages/quotes/QuoteEditor'));
const BookingCalendar = lazy(() => import('./pages/bookings/BookingCalendar'));
const ItemsPage = lazy(() => import('./pages/masters/MastersPages').then((m) => ({ default: m.ItemsPage })));
const SetsPage = lazy(() => import('./pages/masters/MastersPages').then((m) => ({ default: m.SetsPage })));
const AddOnsPage = lazy(() => import('./pages/masters/MastersPages').then((m) => ({ default: m.AddOnsPage })));
const PresetsPage = lazy(() => import('./pages/masters/MastersPages').then((m) => ({ default: m.PresetsPage })));
const QuoteSettings = lazy(() => import('./pages/settings/QuoteSettings'));
const ThemeLibrary = lazy(() => import('./pages/themes/ThemeLibrary'));
const DayAssignment = lazy(() => import('./pages/themes/DayAssignment'));

const WeddingQuoteRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to={CRM.wqQuotes} replace />} />
        <Route path="create" element={<CreateWizard />} />
        <Route path="quotes" element={<QuoteList />} />
        <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.BOOKING_CALENDAR} />}>
          <Route path="bookings" element={<BookingCalendar />} />
        </Route>
        <Route path="quotes/:id/edit" element={<QuoteEditor />} />
        <Route path="quotes/:id/setup" element={<CreateWizard />} />
        <Route path="masters/items" element={<ItemsPage />} />
        <Route path="masters/deliverable-sets" element={<SetsPage />} />
        <Route path="masters/addons" element={<AddOnsPage />} />
        <Route path="masters/package-presets" element={<PresetsPage />} />
        <Route element={<ProtectedRoute feature={BUSINESS_FEATURES.THEME_LIBRARY} />}>
          <Route path="themes" element={<ThemeLibrary />} />
          <Route path="themes/assignment" element={<DayAssignment />} />
        </Route>
        <Route path="settings" element={<QuoteSettings />} />
        <Route path="*" element={<Navigate to={CRM.wqQuotes} replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default WeddingQuoteRoutes;
