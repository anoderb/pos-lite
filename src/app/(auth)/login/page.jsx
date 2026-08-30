'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn, Headphones } from 'lucide-react';
import { toast } from '@/components/ui/ToastProvider';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, initAuth, user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
      if (user) {
        router.replace('/owner/dashboard');
      }
    }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi');
      return;
    }
    try {
      setIsLoading(true);
      const userProfile = await login(email.trim().toLowerCase(), password);
      toast.success(`Selamat datang kembali, ${userProfile?.nama || 'Pengguna'}!`, { title: 'Login Berhasil!' });
      setTimeout(() => router.replace('/owner/dashboard'), 800);
    } catch (err) {
      const msg = err.message || 'Gagal login. Cek email & password Anda.';
      setErrorMsg(msg);
      toast.error(msg, { title: 'Gagal Login' });
      // Belum verifikasi email → arahkan ke halaman verifikasi
      if (msg.toLowerCase().includes('verifi')) {
        setTimeout(() => router.replace(`/verifikasi?email=${encodeURIComponent(email)}`), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-6">
        <div className="mb-5">
          <h3 className="text-[19px] font-semibold text-[#10233E]">Selamat Datang Kembali! 👋</h3>
          <p className="text-[12px] font-normal text-[#68758A] mt-1">Silakan masuk untuk melanjutkan</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] rounded-xl text-[12px] font-normal">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#10233E]">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Mail className="w-3.5 h-3.5" /></span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                required
                autoComplete="email"
                className="w-full pl-11 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[#10233E]">Password</label>
              <Link href="/lupa-password" className="text-[11px] font-medium text-[#0CAF60]">Lupa Password?</Link>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Lock className="w-3.5 h-3.5" /></span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isLoading} showLoading>
            {isLoading ? 'Masuk...' : (<><LogIn className="w-4 h-4 mr-1.5" /> Masuk</>)}
          </Button>
        </form>

        {/* Security banner */}
        <div className="mt-5 relative overflow-hidden rounded-xl bg-[#E8FAF0] p-3 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-white text-[#0CAF60] flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#10233E]">Aman &amp; Terpercaya</p>
            <p className="text-[10px] font-normal text-[#68758A] leading-4">Data toko dan transaksi Anda kami jaga keamanannya.</p>
          </div>
          <img src="/assets/tokiva-dashboard/img-login-security.png" alt="Keamanan" className="w-12 h-12 object-contain shrink-0" />
        </div>
      </div>

      <p className="text-center mt-5 text-[12px] font-normal text-[#68758A]">
        Belum punya akun? <Link href="/register" className="font-medium text-[#0CAF60]">Daftar Sekarang</Link>
      </p>
      <p className="text-center mt-4 text-[11px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
        <Headphones className="w-4 h-4 text-[#0CAF60]" />
        Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
      </p>
    </div>
  );
}
