import { api, unwrap, unwrapWithMeta } from './axios';

export const clientApi = {
  list: (params) => api.get('/clients', { params }).then(unwrapWithMeta),
  options: () => api.get('/clients/options').then(unwrap),
  stats: () => api.get('/clients/stats').then(unwrap),
  get: (id) => api.get(`/clients/${id}`).then(unwrap),
  create: (payload) => api.post('/clients', payload).then(unwrap),
  update: (id, payload) => api.patch(`/clients/${id}`, payload).then(unwrap),
  archive: (id) => api.patch(`/clients/${id}/archive`).then(unwrap),
  remove: (id) => api.delete(`/clients/${id}`).then(unwrap),
};
