import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  toko: null,
  isInitialized: false,
  isLoading: false,

  // Inisialisasi Auth — verify profile via /auth/profil (cookie otomatis)
  initAuth: async () => {
    if (typeof window === 'undefined') return;

    try {
      const res = await api.get('/auth/profil');
      if (res?.berhasil && res.data) {
        const profil = res.data;
        set({
          user: { id: profil.id, nama: profil.nama, email: profil.email, role: profil.role, toko_id: profil.toko_id },
          toko: profil.toko || null,
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

  // Login via Google OAuth
  loginWithGoogleSession: (session, pengguna, toko) => {
    if (!pengguna) throw new Error('Sesi Google tidak valid');
    set({ user: pengguna, toko: toko || null, isLoading: false });
    return pengguna;
  },

  // Logout
  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    set({ user: null, toko: null, isInitialized: true });
  },

  setToko: (toko) => set({ toko }),

  isAuthenticated: () => Boolean(get().user),
  isOwner: () => get().user?.role === 'owner',
  isKasir: () => get().user?.role === 'kasir',
}));
