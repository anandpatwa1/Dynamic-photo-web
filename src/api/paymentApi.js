import { api, unwrap, unwrapWithMeta } from './axios';

export const paymentApi = {
  list: (params) => api.get('/payments', { params }).then(unwrapWithMeta),
  stats: () => api.get('/payments/stats').then(unwrap),
  get: (id) => api.get(`/payments/${id}`).then(unwrap),
  create: (payload) => api.post('/payments', payload).then(unwrap),
  update: (id, payload) => api.patch(`/payments/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/payments/${id}`).then(unwrap),
};
