import axios from 'axios';

// Dynamic API base URL.
// Priority: NEXT_PUBLIC_API_URL env → deployed hostname convention → localhost dev.
function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Deployed: assume api.<tld> subdomain next to the app host.
    const host = window.location.hostname;
    const parts = host.split('.');
    const domain = parts.slice(-2).join('.');
    return `https://api.${domain}/api`;
  }
  return 'http://127.0.0.1:5000/api';
}

// Exported for callers that need the resolved origin (e.g. dev model URL rewrite).
export { getApiBaseUrl };

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto Inject JWT Token if available in localStorage (isolated by path context)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const token = isAdminPath
      ? localStorage.getItem('tokiva_admin_token')
      : localStorage.getItem('tokiva_jwt_token');

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Safe Response Interceptor (Auto Clear Stale Session on 401 Unauthorized)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const reqUrl = error.config?.url || '';

      // Ignore login endpoint 401 errors so login form shows error message instead of reloading
      if (!reqUrl.includes('/login')) {
        const isAdminPath = window.location.pathname.startsWith('/admin');
        if (isAdminPath) {
          localStorage.removeItem('tokiva_admin_token');
          localStorage.removeItem('tokiva_admin_profile');
          if (!window.location.pathname.startsWith('/admin/login')) {
            window.location.href = '/admin/login';
          }
        } else {
          localStorage.removeItem('tokiva_jwt_token');
          localStorage.removeItem('tokiva_user_profile');
          localStorage.removeItem('tokiva_toko_profile');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }
    const errorMsg =
      error.response?.data?.pesan ||
      error.message ||
      'Terjadi kesalahan pada koneksi server';

    // Rate limit (429) → notify global RateLimitProvider
    if (typeof window !== 'undefined' && error.response?.status === 429) {
      const retryAfter = Number(error.response?.headers?.['retry-after']) || Number(error.response?.data?.retry_after_seconds) || 0;
      window.dispatchEvent(
        new CustomEvent('rate-limited', { detail: { retryAfter } })
      );
    }

    return Promise.reject(new Error(errorMsg));
  }
);