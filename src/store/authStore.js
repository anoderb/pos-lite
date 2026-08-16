import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  toko: null,
  token: null,
  isInitialized: false,
  isLoading: false,

  // Inisialisasi Auth dari LocalStorage & Verify Profile ke Backend
  initAuth: async () => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('tokiva_jwt_token');
    const savedUser = localStorage.getItem('tokiva_user_profile');
    const savedToko = localStorage.getItem('tokiva_toko_profile');

    if (savedToken && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        const tokoObj = savedToko ? JSON.parse(savedToko) : null;

        set({
          token: savedToken,
          user: userObj,
          toko: tokoObj,
          isInitialized: true,
        });

        // Rotate refresh cookie first, then verify profile with fresh access token.
        api.post('/auth/refresh')
          .then((refreshRes) => {
            const refreshed = refreshRes?.data || refreshRes;
            const nextToken = refreshed?.access_token;
            if (nextToken) {
              localStorage.setItem('tokiva_jwt_token', nextToken);
              set({ token: nextToken });
            }
            return api.get('/auth/profil');
          })
          .then((res) => {
            if (res?.berhasil && res.data) {
              const profil = res.data;
              const updatedUser = {
                id: profil.id,
                nama: profil.nama,
                email: profil.email,
                role: profil.role,
                toko_id: profil.toko_id,
              };
              const updatedToko = profil.toko || tokoObj;

              localStorage.setItem('tokiva_user_profile', JSON.stringify(updatedUser));
              if (updatedToko) {
                localStorage.setItem('tokiva_toko_profile', JSON.stringify(updatedToko));
              }

              set({
                user: updatedUser,
                toko: updatedToko,
              });
            }
          })
          .catch((err) => {
            // Hanya logout jika token memang tidak valid/expired (HTTP 401)
            if (err?.response?.status === 401 || err?.status === 401) {
              get().logout();
            }
          });
      } catch (e) {
        get().logout();
      }
    } else {
      set({
        token: null,
        user: null,
        toko: null,
        isInitialized: true,
      });
    }
  },

  // Real Login Action (Backend API Supabase Auth)
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      
      const payload = res.data || res;
      const { session, pengguna, toko } = payload;

      if (!session?.access_token || !pengguna) {
        throw new Error('Respons login tidak valid dari server');
      }

      const accessToken = session.access_token;
      const userProfile = pengguna;
      const tokoProfile = toko || null;

      localStorage.setItem('tokiva_jwt_token', accessToken);
      localStorage.setItem('tokiva_user_profile', JSON.stringify(userProfile));
      if (tokoProfile) {
        localStorage.setItem('tokiva_toko_profile', JSON.stringify(tokoProfile));
      }

      set({
        token: accessToken,
        user: userProfile,
        toko: tokoProfile,
        isLoading: false,
      });

      return userProfile;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Login via Google OAuth (session dari Supabase, profil dari /auth/oauth-sync)
  loginWithGoogleSession: (session, pengguna, toko) => {
    if (!session?.access_token || !pengguna) {
      throw new Error('Sesi Google tidak valid');
    }
    localStorage.setItem('tokiva_jwt_token', session.access_token);
    localStorage.setItem('tokiva_user_profile', JSON.stringify(pengguna));
    if (toko) localStorage.setItem('tokiva_toko_profile', JSON.stringify(toko));
    set({ token: session.access_token, user: pengguna, toko: toko || null, isLoading: false });
    return pengguna;
  },

  // Logout Action: revoke server session before clearing local state.
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Local cleanup still runs if server session already expired.
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('tokiva_jwt_token');
      localStorage.removeItem('tokiva_user_profile');
      localStorage.removeItem('tokiva_toko_profile');
    }

    set({
      token: null,
      user: null,
      toko: null,
      isInitialized: true,
    });
  },

  // Helpers
  isAuthenticated: () => Boolean(get().user && get().token),
  isOwner: () => get().user?.role === 'owner',
  isKasir: () => get().user?.role === 'kasir',
}));
