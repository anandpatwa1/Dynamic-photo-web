import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/redux/auth/authSlice';
import settingsReducer from '@/redux/setting/settingsSlice';
import clientsReducer from '@/redux/client/clientSlice';
import packagesReducer from '@/redux/package/packageSlice';
import documentsReducer from '@/redux/document/documentSlice';
import projectsReducer from '@/redux/project/projectSlice';
import paymentsReducer from '@/redux/payment/paymentSlice';
// Wedding Quote module: its slices are registered here (keys prefixed `wq`).
import { wqReducers } from '@/wedding-quote/redux/wqSlices';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    clients: clientsReducer,
    packages: packagesReducer,
    documents: documentsReducer,
    projects: projectsReducer,
    payments: paymentsReducer,
    ...wqReducers,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // File objects travel through upload thunks; they are never persisted
      // into state, so the serializable check would only produce noise.
      serializableCheck: { ignoredActionPaths: ['meta.arg', 'payload.file'] },
    }),
  devTools: import.meta.env.DEV,
});
