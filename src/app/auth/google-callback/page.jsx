'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { loginWithGoogleSession } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.auth.getSession();
        if (error || !data?.session) {
          setErrorMsg('Sesi Google tidak ditemukan. Silakan coba login ulang.');
          return;
        }
        const { user } = data.session;
        const res = await api.post('/auth/oauth-sync', {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata || {},
          },
        });
        const payload = res?.data || res;
        const { pengguna, toko } = payload;
        if (!pengguna) {
          setErrorMsg('Gagal sinkronisasi akun. Silakan coba lagi.');
          return;
        }
        loginWithGoogleSession(data.session, pengguna, toko);
        router.replace('/owner/pos');
      } catch (err) {
        setErrorMsg(err?.message || 'Terjadi kesalahan saat login Google.');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
      {errorMsg ? (
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 shadow-sm text-center space-y-3">
          <p className="text-sm font-medium text-[#D94850]">Login Google Gagal</p>
          <p className="text-xs font-normal text-[#68758A]">{errorMsg}</p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full py-2.5 bg-[#0CAF60] text-white rounded-xl text-xs font-medium"
          >
            Kembali ke Login
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-[#0CAF60] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-normal text-[#68758A]">Menyinkronkan akun Google...</p>
        </div>
      )}
    </div>
  );
}
