/**
 * Wedding Quote module routes, mounted at /CRM/wedding-quote/* by CrmRoutes.
 * Every page is lazy so the module costs nothing until it is opened.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/components/ui';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CRM } from '@/routes/paths';

const QuoteList = lazy(() => import('./pages/quotes/QuoteList'));
const CreateWizard = lazy(() => import('./pages/quotes/CreateWizard'));
const QuoteEditor = lazy(() => import('./pages/quotes/QuoteEditor'));
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
        <Route path="quotes/:id/edit" element={<QuoteEditor />} />
        <Route path="masters/items" element={<ItemsPage />} />
        <Route path="masters/deliverable-sets" element={<SetsPage />} />
        <Route path="masters/addons" element={<AddOnsPage />} />
        <Route path="masters/package-presets" element={<PresetsPage />} />
        <Route path="themes" element={<ThemeLibrary />} />
        <Route path="themes/assignment" element={<DayAssignment />} />
        <Route path="settings" element={<QuoteSettings />} />
        <Route path="*" element={<Navigate to={CRM.wqQuotes} replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default WeddingQuoteRoutes;
