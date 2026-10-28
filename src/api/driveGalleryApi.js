import { api } from './axios';
import axios from 'axios';

const PUBLIC_API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Public Axios instance (unauthenticated, never attaches auth token)
 */
const publicClient = axios.create({
  baseURL: `${PUBLIC_API_BASE}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const driveGalleryApi = {
  // ─── Protected Admin Endpoints ─────────────────────────────────────────────
  listGalleries: (params = {}) =>
    api.get('/drive-galleries', { params }).then((res) => res.data?.data || res.data),

  getGallery: (id) =>
    api.get(`/drive-galleries/${id}`).then((res) => res.data?.data || res.data),

  createGallery: (data) =>
    api.post('/drive-galleries', data).then((res) => res.data?.data || res.data),

  updateGallery: (id, data) =>
    api.put(`/drive-galleries/${id}`, data).then((res) => res.data?.data || res.data),

  deleteGallery: (id) =>
    api.delete(`/drive-galleries/${id}`).then((res) => res.data?.data || res.data),

  syncGallery: (id) =>
    api.post(`/drive-galleries/${id}/sync`).then((res) => res.data?.data || res.data),

  togglePublish: (id) =>
    api.patch(`/drive-galleries/${id}/publish`).then((res) => res.data?.data || res.data),

  duplicateGallery: (id) =>
    api.post(`/drive-galleries/${id}/duplicate`).then((res) => res.data?.data || res.data),

  validateFolder: (driveFolderUrl) =>
    api.post('/drive-galleries/validate-folder', { driveFolderUrl }).then((res) => res.data?.data || res.data),

  checkSlug: (slug, excludeId = null) =>
    api.post('/drive-galleries/check-slug', { slug, excludeId }).then((res) => res.data?.data || res.data),

  // ─── Public Endpoints (No Auth Needed) ─────────────────────────────────────
  getPublicGallery: (slug) =>
    publicClient.get(`/drive-galleries/${slug}`).then((res) => res.data?.data || res.data),

  trackDownload: (slug) =>
    publicClient.post(`/drive-galleries/${slug}/download-event`).then((res) => res.data?.data || res.data).catch(() => {}),
};

