'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Store, Mail, ShieldCheck, Send, ArrowLeft, Headphones } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F1F5F4] flex flex-col items-center px-5 py-6 overflow-x-hidden">
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-[#0CAF60]/15 blur-2xl pointer-events-none" />
      <div className="fixed top-40 -left-20 w-56 h-56 rounded-full bg-[#E8FAF0] blur-xl pointer-events-none" />

      <div className="w-full max-w-[430px] relative z-10">
        {/* Back */}
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#10233E] hover:bg-white/60 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Brand centered */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <img src="/assets/brand/tokiva-symbol.png" alt="Tokiva" className="w-9 h-9 object-contain drop-shadow-md" />
          <h1 className="text-xl font-semibold leading-6 tracking-tight">
            <span className="text-[#10233E]">Tok</span><span className="text-[#0CAF60]">iva</span>
          </h1>
        </div>

        {/* Ilustrasi security (aset existing) */}
        <div className="flex justify-center my-4">
          <img src="/assets/tokiva-dashboard/img-login-security.png" alt="Keamanan akun" className="w-[68%] max-w-[290px] object-contain" />
        </div>

        {/* Heading */}
        <div className="text-center mb-4">
          <h2 className="text-[19px] font-semibold leading-6 text-[#10233E]">Lupa Password?</h2>
          <p className="text-[12px] font-medium text-[#0CAF60] mt-1">Jangan khawatir, kami siap membantu!</p>
          <p className="text-[11px] font-normal text-[#68758A] mt-1.5 leading-4">
            Masukkan email akun Anda, kami akan mengirimkan link untuk mereset password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-5">
          {errorMsg && (
            <div className="mb-3 p-2.5 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] rounded-xl text-[11px] font-normal">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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
              <p className="text-[10px] font-medium text-[#10233E]">Link reset hanya berlaku 1 jam.</p>
              <p className="text-[9px] font-normal text-[#68758A] leading-4 mt-0.5">Pastikan email yang Anda masukkan benar dan aktif.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-normal text-[#68758A]">Ingat password Anda?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-[#10233E] rounded-xl text-xs font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Login
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-5">
          <div className="rounded-2xl overflow-hidden">
            <img src="/assets/tokiva-dashboard/img-login-hero.png" alt="Tokiva" className="w-full object-cover object-bottom" style={{ height: 110 }} />
          </div>
          <p className="text-[10px] font-normal text-[#68758A] flex items-center justify-center gap-1.5 mt-3">
            <Headphones className="w-3.5 h-3.5 text-[#0CAF60]" />
            Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
          </p>
          <p className="text-[9px] font-normal text-[#68758A]/70 text-center mt-1">© 2026 Tokiva. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
