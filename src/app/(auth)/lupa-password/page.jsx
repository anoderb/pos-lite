'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, Send, ArrowLeft, Headphones } from 'lucide-react';
import { api } from '@/lib/api';

export default function LupaPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Email wajib diisi');
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/auth/lupa-password', { email: email.trim() });
      router.replace(`/verifikasi?email=${encodeURIComponent(email.trim())}&mode=reset`);
    } catch (err) {
      setErrorMsg(err?.response?.data?.pesan || 'Gagal mengirim email reset. Coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-6">
        {/* Heading */}
        <div className="text-center mb-5">
          <h2 className="text-[19px] font-semibold text-[#10233E]">Lupa Password?</h2>
          <p className="text-[13px] font-medium text-[#0CAF60] mt-1">Jangan khawatir, kami siap membantu!</p>
          <p className="text-[12px] font-normal text-[#68758A] mt-2 leading-5">
            Masukkan email akun Anda, kami akan mengirimkan link untuk mereset password.
          </p>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0CAF60] text-white rounded-xl text-[13px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-4 p-3 rounded-xl bg-[#E8FAF0] border border-emerald-100 flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-full bg-white text-[#0CAF60] flex items-center justify-center shrink-0"><ShieldCheck className="w-3.5 h-3.5" /></span>
          <div>
            <p className="text-[11px] font-medium text-[#10233E]">Link reset hanya berlaku 1 jam.</p>
            <p className="text-[10px] font-normal text-[#68758A] leading-4 mt-0.5">Pastikan email yang Anda masukkan benar dan aktif.</p>
          </div>
        </div>
      </div>

      {/* Back to login */}
      <Link
        href="/login"
        className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 bg-white border border-gray-200 text-[#10233E] rounded-xl text-xs font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Halaman Login
      </Link>
      <p className="text-center mt-4 text-[11px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
        <Headphones className="w-4 h-4 text-[#0CAF60]" />
        Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
      </p>
    </div>
  );
}
