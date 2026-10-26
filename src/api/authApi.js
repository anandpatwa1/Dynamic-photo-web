import { api, unwrap } from './axios';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  logout: (payload = {}) => api.post('/auth/logout', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  updateProfile: (payload) => api.patch('/auth/me', payload).then(unwrap),
  changePassword: (payload) => api.patch('/auth/me/password', payload).then(unwrap),

  updateAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .patch('/auth/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },

  listUsers: () => api.get('/auth/users').then(unwrap),
  getAccessConfig: () => api.get('/auth/access-config').then(unwrap),
  updateUser: (id, payload) => api.patch(`/auth/users/${id}`, payload).then(unwrap),
  deleteUser: (id) => api.delete(`/auth/users/${id}`).then(unwrap),
};
