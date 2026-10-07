import { api, unwrap, unwrapWithMeta } from './axios';

export const projectApi = {
  list: (params) => api.get('/projects', { params }).then(unwrapWithMeta),
  stats: () => api.get('/projects/stats').then(unwrap),
  get: (id) => api.get(`/projects/${id}`).then(unwrap),
  create: (payload) => api.post('/projects', payload).then(unwrap),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then(unwrap),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }).then(unwrap),
  toggleDeliverable: (id, deliverableId, isDone) =>
    api.patch(`/projects/${id}/deliverables/${deliverableId}`, { isDone }).then(unwrap),
  remove: (id) => api.delete(`/projects/${id}`).then(unwrap),
};
