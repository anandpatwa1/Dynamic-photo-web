import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/index.css';

/**
 * Deliberately thin.
 *
 * The Redux Provider and the boot-time auth request used to live here, which
 * meant a visitor to the marketing page paid for the entire CRM before seeing a
 * pixel. They now live in `crm/CrmRoot`, mounted only under `/CRM`.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Outermost so a crash in any provider or route still renders a real page
        instead of a blank white screen. */}
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
