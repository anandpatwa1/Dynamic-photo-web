import { api, unwrap, unwrapWithMeta } from '@/api/axios';

const base = '/wedding-quote';

/** Builds a createCrudSlice-compatible service for one master type. */
const masterService = (type) => ({
  list: (params) => api.get(`${base}/masters/${type}`, { params }).then(unwrapWithMeta),
  get: (id) => api.get(`${base}/masters/${type}/${id}`).then(unwrap),
  create: (payload) => api.post(`${base}/masters/${type}`, payload).then(unwrap),
  update: (id, payload) => api.patch(`${base}/masters/${type}/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`${base}/masters/${type}/${id}`).then(unwrap),
  reorder: (ids) => api.patch(`${base}/masters/${type}/reorder`, { ids }).then(unwrap),
});

export const wqMasters = {
  items: masterService('items'),
  sets: masterService('deliverable-sets'),
  addOns: masterService('addons'),
  presets: masterService('package-presets'),
};

export const wqQuoteApi = {
  list: (params) => api.get(`${base}/quotes`, { params }).then(unwrapWithMeta),
  get: (id) => api.get(`${base}/quotes/${id}`).then(unwrap),
  create: (payload) => api.post(`${base}/quotes`, payload).then(unwrap),
  update: (id, payload) => api.patch(`${base}/quotes/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`${base}/quotes/${id}`).then(unwrap),
  duplicate: (id) => api.post(`${base}/quotes/${id}/duplicate`).then(unwrap),
  recalculate: (id, body = {}) => api.post(`${base}/quotes/${id}/recalculate`, body).then(unwrap),
  breakdown: (id) => api.get(`${base}/quotes/${id}/breakdown`).then(unwrap),
};

export const wqSettingsApi = {
  me: () => api.get(`${base}/settings/me`).then(unwrap),
  get: () => api.get(`${base}/settings`).then(unwrap),
  update: (payload) => api.patch(`${base}/settings`, payload).then(unwrap),
  updatePermissions: (permissions) => api.patch(`${base}/settings/permissions`, { permissions }).then(unwrap),
  saveLastUsedExport: (payload) => api.patch(`${base}/settings/export-last-used`, payload).then(unwrap),
  studio: () => api.get(`${base}/settings/studio`).then(unwrap),
};

const blob = (url) => api.get(url, { responseType: 'blob' }).then((r) => r.data);
const upload = (url, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
};

export const wqThemeApi = {
  list: (params) => api.get(`${base}/themes`, { params }).then(unwrap),
  get: (id) => api.get(`${base}/themes/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`${base}/themes/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`${base}/themes/${id}`).then(unwrap),
  schema: () => api.get(`${base}/themes/schema`).then(unwrap),
  exampleZip: () => blob(`${base}/themes/example.zip`),
  exportAllZip: () => blob(`${base}/themes/export-all.zip`),
  exportZip: (id) => blob(`${base}/themes/${id}/export.zip`),
  validateImport: (file) => upload(`${base}/themes/import/validate`, file),
  commitImport: (file) => upload(`${base}/themes/import`, file),
  assignments: () => api.get(`${base}/themes/assignments`).then(unwrap),
  saveAssignments: (assignments) => api.put(`${base}/themes/assignments`, { assignments }).then(unwrap),
  forDay: (dayCount) => api.get(`${base}/themes/for-day/${dayCount}`).then(unwrap),
};
