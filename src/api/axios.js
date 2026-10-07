import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const TOKEN_KEY = 'dp_access_token';
export const REFRESH_KEY = 'dp_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// While a refresh is in flight, queue every other 401 so we only refresh once.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    { withCredentials: true },
  );
  tokenStore.set(data.data);
  return data.data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Never try to refresh the refresh call itself, or repeat a retry.
    const isAuthRoute = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config?._retried && !isAuthRoute) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const accessToken = await refreshPromise;
        refreshPromise = null;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStore.clear();
        // Let the app decide how to react rather than hard-navigating here.
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Normalises any axios failure into a predictable shape for Redux/forms:
 * `{ message, errors: [{ field, message }], status }`.
 */
export const parseApiError = (error) => {
  const status = error?.response?.status ?? 0;
  const payload = error?.response?.data;

  if (payload?.message) {
    return { message: payload.message, errors: payload.errors ?? [], status };
  }
  if (error?.code === 'ECONNABORTED') {
    return { message: 'The request timed out. Please try again.', errors: [], status };
  }
  if (!error?.response) {
    return {
      message: 'Cannot reach the server. Check your connection and try again.',
      errors: [],
      status,
    };
  }
  return { message: error.message || 'Something went wrong', errors: [], status };
};

/** Unwraps the `{ success, message, data, meta }` envelope. */
export const unwrap = (response) => response?.data?.data;
export const unwrapWithMeta = (response) => ({
  data: response?.data?.data,
  meta: response?.data?.meta,
});
