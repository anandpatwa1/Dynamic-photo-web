import { api, unwrap, unwrapWithMeta } from './axios';

export const packageApi = {
  list: (params) => api.get('/packages', { params }).then(unwrapWithMeta),
  options: () => api.get('/packages/options').then(unwrap),
  stats: () => api.get('/packages/stats').then(unwrap),
  get: (id) => api.get(`/packages/${id}`).then(unwrap),
  create: (payload) => api.post('/packages', payload).then(unwrap),
  update: (id, payload) => api.patch(`/packages/${id}`, payload).then(unwrap),
  duplicate: (id) => api.post(`/packages/${id}/duplicate`).then(unwrap),
  remove: (id) => api.delete(`/packages/${id}`).then(unwrap),

  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .patch(`/packages/${id}/cover`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap);
  },
};
