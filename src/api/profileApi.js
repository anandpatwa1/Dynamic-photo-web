import axios from 'axios';
import { api, unwrap } from './axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const formImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return form;
};
const formImages = (files) => {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  return form;
};

const uploadCollection = (id, collection, files) => api.post(
  `/profiles/${id}/${collection}`,
  formImages(files),
  { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 },
).then(unwrap);

export const profileApi = {
  list: () => api.get('/profiles').then(unwrap),
  create: (payload) => api.post('/profiles', payload).then(unwrap),
  update: (id, payload) => api.patch(`/profiles/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/profiles/${id}`).then(unwrap),
  uploadImage: (id, kind, file) => api.patch(`/profiles/${id}/image/${kind}`, formImage(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }).then(unwrap),
  addCovers: (id, files) => uploadCollection(id, 'covers', files),
  removeCover: (id, publicId) => api.delete(`/profiles/${id}/covers`, { data: { publicId } }).then(unwrap),
  reorderCovers: (id, order) => api.patch(`/profiles/${id}/covers/reorder`, { order }).then(unwrap),
  addGallery: (id, files) => uploadCollection(id, 'gallery', files),
  removeGallery: (id, publicId) => api.delete(`/profiles/${id}/gallery`, { data: { publicId } }).then(unwrap),
  reorderGallery: (id, order) => api.patch(`/profiles/${id}/gallery/reorder`, { order }).then(unwrap),
  publicBySlug: async (slug, signal) => {
    const response = await axios.get(`${BASE_URL}/public/profiles/${encodeURIComponent(slug)}`, { signal });
    return response.data.data;
  },
};
