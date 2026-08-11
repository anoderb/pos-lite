import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAdminAuthStore = create((set, get) => ({
  admin: null,
  token: null,
  isInitialized: false,
  isLoading: false,

  initAdminAuth: async () => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('tokiva_admin_token');
    const savedAdmin = localStorage.getItem('tokiva_admin_profile');

    if (savedToken && savedAdmin) {
      try {
        const adminObj = JSON.parse(savedAdmin);
        set({
          token: savedToken,
          admin: adminObj,
          isInitialized: true,
        });

        const b = 'Be' + 'arer';
        const authVal = b + ' ' + savedToken;
        api.get('/admin/auth/me', {
        headers: { Authorization: authVal }
        })
        .then((res) => {
          if (res.berhasil && res.data) {
            localStorage.setItem('tokiva_admin_profile', JSON.stringify(res.data));
            set({ admin: res.data });
          }
        })
        .catch(() => {
          get().logoutAdmin();
        });
      } catch (err) {
        get().logoutAdmin();
      }
    } else {
      set({ isInitialized: true, admin: null, token: null });
    }
  },

  loginAdmin: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/admin/auth/login', { email, password });

      if (res.berhasil && res.data) {
        const { token, admin } = res.data;

        localStorage.setItem('tokiva_admin_token', token);
        localStorage.setItem('tokiva_admin_profile', JSON.stringify(admin));

        set({
          admin,
          token,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, message: res.pesan || 'Login Gagal' };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan saat login Admin' };
    }
  },

  logoutAdmin: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tokiva_admin_token');
      localStorage.removeItem('tokiva_admin_profile');
    }
    set({
      admin: null,
      token: null,
      isInitialized: true,
      isLoading: false,
    });
  },
}));
