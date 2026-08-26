import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAdminAuthStore = create((set, get) => ({
  admin: null,
  isInitialized: false,
  isLoading: false,

  // Verify admin session via /admin/auth/profil (cookie sent automatically)
  initAdminAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await api.get('/admin/auth/profil');
      if (res?.berhasil && res.data) {
        set({ admin: res.data, isInitialized: true });
      } else {
        set({ isInitialized: true, admin: null });
      }
    } catch {
      set({ isInitialized: true, admin: null });
    }
  },

  loginAdmin: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/admin/auth/login', { email, password });

      if (res.berhasil && res.data?.admin) {
        set({ admin: res.data.admin, isLoading: false, isInitialized: true });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, message: res.pesan || 'Login Gagal' };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan saat login Admin' };
    }
  },

  logoutAdmin: async () => {
    try { await api.post('/admin/auth/logout'); } catch {}
    set({ admin: null, isInitialized: true, isLoading: false });
  },
}));
