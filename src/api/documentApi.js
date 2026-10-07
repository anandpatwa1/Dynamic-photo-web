import { api, unwrap, unwrapWithMeta } from './axios';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const documentApi = {
  list: (params) => api.get('/documents', { params }).then(unwrapWithMeta),
  stats: () => api.get('/documents/stats').then(unwrap),
  get: (id) => api.get(`/documents/${id}`).then(unwrap),
  create: (payload) => api.post('/documents', payload).then(unwrap),
  update: (id, payload) => api.patch(`/documents/${id}`, payload).then(unwrap),
  updateStatus: (id, status) => api.patch(`/documents/${id}/status`, { status }).then(unwrap),
  convert: (id, payload) => api.post(`/documents/${id}/convert`, payload).then(unwrap),
  duplicate: (id) => api.post(`/documents/${id}/duplicate`).then(unwrap),
  remove: (id) => api.delete(`/documents/${id}`).then(unwrap),

  /**
   * Fetches the preview markup through axios so the request carries the auth
   * header — an `<iframe src>` cannot, and would render a 401 page. The result
   * is injected via `srcDoc`. `theme` previews a look without saving it.
   */
  preview: (id, theme) =>
    api
      .get(`/documents/${id}/preview`, {
        params: theme ? { theme } : {},
        responseType: 'text',
        transformResponse: [(data) => data],
      })
      .then((response) => response.data),

  /**
   * Downloads the PDF as a blob so the request carries the auth header —
   * a plain link would be unauthenticated.
   */
  download: async (id, { theme, filename } = {}) => {
    const response = await api.get(`/documents/${id}/pdf`, {
      params: { download: 'true', ...(theme ? { theme } : {}) },
      responseType: 'blob',
    });

    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename ?? `document-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  /** Opens the rendered PDF in a new tab. */
  openPdf: async (id, { theme } = {}) => {
    const response = await api.get(`/documents/${id}/pdf`, {
      params: theme ? { theme } : {},
      responseType: 'blob',
    });

    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank', 'noopener');
    // Give the new tab time to claim the blob before revoking it.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};
