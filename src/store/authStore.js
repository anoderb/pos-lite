import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  toko: null,
  isInitialized: false,
  isLoading: false,

  // Inisialisasi Auth — cek sesi via /auth/status (selalu 200, tidak pernah 401,
  // jadi halaman publik login/register tidak menghasilkan error palsu di console).
  initAuth: async () => {
    if (typeof window === 'undefined') return;

    try {
      const res = await api.get('/auth/status');
      const d = res?.data || res;
      if (res?.berhasil && d?.loggedIn && d.pengguna) {
        const p = d.pengguna;
        set({
          user: { id: p.id, nama: p.nama, email: p.email, role: p.role, toko_id: p.toko_id },
          toko: d.toko || null,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  // Login via Supabase Auth
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data || res;
      const { pengguna, toko } = payload;

      if (!pengguna) throw new Error('Respons login tidak valid dari server');

      const userProfile = pengguna;
      const tokoProfile = toko || null;

      set({ user: userProfile, toko: tokoProfile, isLoading: false });
      return userProfile;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Logout
  logout: async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    set({ user: null, toko: null, isInitialized: true });
  },

  setToko: (toko) => set({ toko }),

  isAuthenticated: () => Boolean(get().user),
  isOwner: () => get().user?.role === 'owner',
  isKasir: () => get().user?.role === 'kasir',
}));
