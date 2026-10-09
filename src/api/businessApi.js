import { api, unwrap, unwrapWithMeta } from './axios';

export const businessApi = {
  config: () => api.get('/businesses/config').then(unwrap),
  list: (params = {}) => api.get('/businesses', { params }).then(unwrapWithMeta),
  get: (id) => api.get(`/businesses/${id}`).then(unwrap),
  create: (payload) => api.post('/businesses', payload).then(unwrap),
  update: (id, payload) => api.patch(`/businesses/${id}`, payload).then(unwrap),
  updateStatus: (id, payload) => api.patch(`/businesses/${id}/status`, payload).then(unwrap),
  updatePrimaryAdmin: (id, payload) => api.patch(`/businesses/${id}/primary-admin`, payload).then(unwrap),
  resetPassword: (id, payload) => api.post(`/businesses/${id}/reset-password`, payload).then(unwrap),
};
