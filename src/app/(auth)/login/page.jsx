'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn, Headphones } from 'lucide-react';
import FeedbackModal from '@/components/ui/FeedbackModal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/config';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.3 5.3C41.1 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, initAuth, user, token } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user && token) {
      router.replace('/owner/dashboard');
    }
  }, [user, token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi');
      return;
    }
    try {
      setIsLoading(true);
      const userProfile = await login(email, password);
      setFeedback({ isOpen: true, type: 'success', title: 'Login Berhasil!', message: `Selamat datang kembali, ${userProfile?.nama || 'Pengguna'}!` });
      setTimeout(() => router.replace('/owner/dashboard'), 800);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login. Cek email & password Anda.');
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Login', message: err.message || 'Email atau password tidak sesuai.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/google-callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        setErrorMsg('Google login belum dikonfigurasi. ' + (error.message || ''));
        setFeedback({ isOpen: true, type: 'error', title: 'Google Login Gagal', message: 'Provider Google belum aktif di Supabase. Hubungi developer untuk mengaktifkannya.' });
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memulai login Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F4] flex flex-col items-center px-5 py-8 overflow-x-hidden">
      {/* Blob dekoratif */}
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-[#0CAF60]/15 blur-2xl pointer-events-none" />
      <div className="fixed top-40 -left-20 w-56 h-56 rounded-full bg-[#E8FAF0] blur-xl pointer-events-none" />

      <div className="w-full max-w-[430px] relative z-10">
        {/* Brand + Hero ilustrasi */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <img src="/assets/brand/tokiva-symbol.png" alt="Tokiva" className="w-9 h-9 object-contain drop-shadow-md" />
              <h1 className="text-xl font-semibold leading-6 tracking-tight shrink-0">
                <span className="text-[#10233E]">Tok</span><span className="text-[#0CAF60]">iva</span>
              </h1>
            </div>
            <h2 className="text-[18px] font-semibold leading-6 text-[#10233E] mt-4">
              Kasir cerdas,
              <br />
              kelola toko <span className="text-[#0CAF60]">jadi mudah.</span>
            </h2>
            <p className="text-[11px] font-normal text-[#68758A] mt-1.5 leading-4">
              Semua transaksi, stok, dan
              <br />
              laporan dalam satu aplikasi.
            </p>
          </div>
          <img src="/assets/tokiva-dashboard/img-login-hero.png" alt="Tokiva POS" className="w-[50%] shrink-0 object-contain" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-5">
          <div className="text-center mb-4">
            <h3 className="text-[15px] font-semibold text-[#10233E]">Selamat Datang Kembali! 👋</h3>
            <p className="text-[10px] font-normal text-[#68758A] mt-0.5">Silakan masuk untuk melanjutkan</p>
          </div>

          {errorMsg && (
            <div className="mb-3 p-2.5 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] rounded-xl text-[11px] font-normal">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#10233E]">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Mail className="w-3.5 h-3.5" /></span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  required
                  className="w-full pl-11 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#10233E]">Password</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Lock className="w-3.5 h-3.5" /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/lupa-password" className="text-[10px] font-medium text-[#0CAF60] mt-1">Lupa Password?</Link>
              </div>
            </div>

            <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isLoading} showLoading>
              {isLoading ? 'Masuk...' : (<><LogIn className="w-4 h-4 mr-1.5" /> Masuk</>)}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-normal text-[#68758A]">atau masuk dengan</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-[#10233E] hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <GoogleIcon />
            {isGoogleLoading ? 'Membuka Google...' : 'Masuk dengan Google'}
          </button>

          {/* Security banner */}
          <div className="mt-4 relative overflow-hidden rounded-xl bg-[#E8FAF0] p-3 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-white text-[#0CAF60] flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#10233E]">Aman &amp; Terpercaya</p>
              <p className="text-[9px] font-normal text-[#68758A] leading-4">Data toko dan transaksi Anda kami jaga keamanannya.</p>
            </div>
            <img src="/assets/tokiva-dashboard/img-login-security.png" alt="Keamanan" className="w-12 h-12 object-contain shrink-0" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-1.5">
          <p className="text-[10px] font-normal text-[#68758A]">
            Belum punya akun? <Link href="/register" className="font-medium text-[#0CAF60]">Daftar Sekarang</Link>
          </p>
          <div className="w-16 h-px bg-gray-200 mx-auto" />
          <p className="text-[10px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-[#0CAF60]" />
            Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
          </p>
          <p className="text-[9px] font-normal text-[#68758A]/70 pt-1">Versi 1.0.0</p>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
