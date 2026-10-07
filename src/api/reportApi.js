import { api, unwrap } from './axios';

export const reportApi = {
  dashboard: () => api.get('/reports/dashboard').then(unwrap),
  revenue: (months = 12) => api.get('/reports/revenue', { params: { months } }).then(unwrap),
  clients: () => api.get('/reports/clients').then(unwrap),
  packages: () => api.get('/reports/packages').then(unwrap),
};
