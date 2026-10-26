import { api, unwrap } from './axios';

export const settingsApi = {
  get: () => api.get('/settings').then(unwrap),
  getPublic: () => api.get('/settings/public').then(unwrap),
  update: (payload) => api.patch('/settings', payload).then(unwrap),

  uploadBranding: (asset, file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .patch(`/settings/branding/${asset}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap);
  },

  removeBranding: (asset) => api.delete(`/settings/branding/${asset}`).then(unwrap),
};
