import axios from 'axios';

// BE origin for TFJS model URLs. MUST be set in .env.
export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// Next.js route handler proxy — browser → /api/... → api.tokiva.biz.id
// Cookie httpOnly dikelola server-side. JWT gak kelihatan di Network tab.
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No request interceptor needed — JWT managed via httpOnly cookie

// Halaman publik yang TIDAK boleh di-redirect saat request-nya kena 401.
// Register/verifikasi/lupa-password tetap harus bisa diakses tanpa login.
const PUBLIC_ROUTES = ['/login', '/register', '/verifikasi', '/lupa-password', '/'];

// Response interceptor: redirect ke login on 401, dispatch event on 429
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const reqUrl = error.config?.url || '';
      const pathname = window.location.pathname;
      // Jangan redirect kalau:
      //  - request auth (login/profil/logout) — profil 401 = "belum login", wajar
      //  - lagi di halaman publik (register/verifikasi/lupa-password/landing)
      const isAuthApi = reqUrl.includes('/auth/');
      const isPublicPage = PUBLIC_ROUTES.some((r) => pathname === r || (r !== '/' && pathname.startsWith(r)));
      if (!isAuthApi && !isPublicPage && !pathname.startsWith('/owner')) {
        window.location.href = '/login';
      }
    }
    const errorMsg =
      error.response?.data?.pesan ||
      error.response?.data?.message ||
      error.response?.data?.error ||
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