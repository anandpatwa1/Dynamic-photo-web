import { api, unwrap, unwrapWithMeta } from './axios';

export const weddingQrApi = {
  list: (params) => api.get('/wedding-qr-projects', { params }).then(unwrapWithMeta),
  get: (id) => api.get(`/wedding-qr-projects/${id}`).then(unwrap),
  create: (payload) => api.post('/wedding-qr-projects', payload).then(unwrap),
  update: (id, payload) => api.patch(`/wedding-qr-projects/${id}`, payload).then(unwrap),
  toggleStatus: (id, isActive) => api.patch(`/wedding-qr-projects/${id}/status`, { isActive }).then(unwrap),
  setGalleryStatus: (id, status) => api.patch(`/wedding-qr-projects/${id}/gallery-status`, { status }).then(unwrap),
  startNewEventCycle: (id) => api.post(`/wedding-qr-projects/${id}/new-cycle`).then(unwrap),
  duplicate: (id) => api.post(`/wedding-qr-projects/${id}/duplicate`).then(unwrap),
  remove: (id) => api.delete(`/wedding-qr-projects/${id}`).then(unwrap),

  // Guest Registrations & Notifications
  listRegistrations: (id, params) => api.get(`/wedding-qr-projects/${id}/registrations`, { params }).then(unwrapWithMeta),
  notifyGuests: (id, payload) => api.post(`/wedding-qr-projects/${id}/notify`, payload).then(unwrap),
  getNotificationHistory: (id) => api.get(`/wedding-qr-projects/${id}/notifications`).then(unwrap),
  getProviderStatus: () => api.get('/wedding-qr-projects/providers/status').then(unwrap),

  // Analytics Endpoints
  getAnalyticsSummary: (params) => api.get('/wedding-qr-projects/analytics/summary', { params }).then(unwrap),
  getAnalyticsFunnel: (params) => api.get('/wedding-qr-projects/analytics/funnel', { params }).then(unwrap),
  getAnalyticsTimeline: (params) => api.get('/wedding-qr-projects/analytics/timeline', { params }).then(unwrap),
  getAnalyticsGalleries: (params) => api.get('/wedding-qr-projects/analytics/galleries', { params }).then(unwrap),
  getAnalyticsNotifications: (params) => api.get('/wedding-qr-projects/analytics/notifications', { params }).then(unwrap),
  getAnalyticsComparison: (params) => api.get('/wedding-qr-projects/analytics/comparison', { params }).then(unwrap),
};
