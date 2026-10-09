import { api } from './axios';

export const activityApi = {
  list: (params = {}) => api.get('/activity', { params }).then((response) => ({
    items: response.data?.data?.items ?? [],
    meta: response.data?.meta,
  })),
};
