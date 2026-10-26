import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { store } from '@/app/store';
import { fetchMe, sessionExpired } from '@/redux/auth/authSlice';
import { tokenStore } from '@/api/axios';
import { CrmRoutes } from '@/routes/CrmRoutes';

/**
 * Session bootstrap. Split out from CrmRoot because it needs to sit *inside*
 * the Provider to use `useDispatch`.
 */
const SessionGate = ({ children }) => {
  const dispatch = useDispatch();

  // Restore the session on boot when a token is already present.
  useEffect(() => {
    if (tokenStore.getAccess()) dispatch(fetchMe());
  }, [dispatch]);

  // The axios interceptor signals an unrecoverable refresh failure this way.
  useEffect(() => {
    const onExpired = () => dispatch(sessionExpired());
    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, [dispatch]);

  return children;
};

/**
 * Everything the CRM needs, mounted only under `/CRM`.
 *
 * This component is the reason the marketing site loads fast: the Redux store,
 * the axios instance with its refresh interceptor, and the boot-time `/auth/me`
 * request are all scoped here rather than to the app root. A visitor landing on
 * `/` never downloads or runs any of it.
 */
export const CrmRoot = () => (
  <Provider store={store}>
    <SessionGate>
      <CrmRoutes />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3600,
          className: 'toast-surface',
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { duration: 5000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </SessionGate>
  </Provider>
);

export default CrmRoot;
