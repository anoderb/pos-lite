'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  MousePointerClick,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';

const STEPS = [
  { icon: Mail, title: 'Buka email', desc: 'Buka email dari Tokiva di inbox Anda' },
  { icon: MousePointerClick, title: 'Klik link verifikasi', desc: 'Klik tombol verifikasi di dalam email' },
  { icon: ShieldCheck, title: 'Akun aktif', desc: 'Akun Anda siap digunakan!' },
];

const STEPS_RESET = [
  { icon: Mail, title: 'Buka email', desc: 'Buka email dari Tokiva di inbox Anda' },
  { icon: MousePointerClick, title: 'Klik link reset', desc: 'Klik tombol reset di dalam email' },
  { icon: ShieldCheck, title: 'Password baru', desc: 'Buat password baru Anda' },
];

function VerifikasiContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const mode = searchParams?.get('mode') || 'verifikasi';
  const isReset = mode === 'reset';
  const steps = isReset ? STEPS_RESET : STEPS;
  const [countdown, setCountdown] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleResend = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      if (isReset) {
        await api.post('/auth/lupa-password', { email });
        setSentMsg('Link reset password telah dikirim ulang!');
      } else {
        await api.post('/auth/verifikasi/email', { email });
        setSentMsg('Email verifikasi telah dikirim ulang!');
      }
      setCountdown(60);
      setTimeout(() => setSentMsg(''), 4000);
    } catch (err) {
      setSentMsg(err?.response?.data?.pesan || 'Gagal mengirim email. Coba lagi nanti.');
      setTimeout(() => setSentMsg(''), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <div className="w-full">
      <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#10233E] mt-2">{isReset ? 'Cek Email Anda!' : 'Verifikasi Email Anda!'}</h2>
          <p className="text-[13px] font-medium text-[#0CAF60] mt-1">{isReset ? 'Link reset password telah dikirim' : 'Satu langkah lagi untuk memulai'}</p>
          <p className="text-[12px] font-normal text-[#68758A] mt-2 leading-5">
            {isReset ? 'Kami telah mengirimkan link reset password ke email' : 'Kami telah mengirimkan link verifikasi ke email'}
          </p>
          <p className="text-[13px] font-medium text-[#10233E] mt-1 break-all">{email || 'email Anda'}</p>
        </div>

        {/* Info notice */}
        <div className="p-3 rounded-xl bg-[#E8FAF0] border border-emerald-100 flex items-start gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-white text-[#0CAF60] flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></span>
          <div>
            <p className="text-[12px] font-medium text-[#10233E]">Belum menerima email?</p>
            <p className="text-[10px] font-normal text-[#68758A] leading-4">Cek folder Spam / Promosi Anda. Email bisa memerlukan waktu beberapa menit.</p>
          </div>
        </div>

        {/* Langkah selanjutnya */}
        <p className="text-[11px] font-medium text-[#68758A] mb-2">Langkah selanjutnya:</p>
        <div className="flex items-stretch gap-1 mb-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={i}>
                <div className="flex-1 text-center">
                  <div className="relative w-9 h-9 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center mx-auto">
                    <Icon className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0CAF60] text-white text-[8px] font-medium flex items-center justify-center">{i + 1}</span>
                  </div>
                  <p className="text-[10px] font-medium text-[#10233E] mt-1.5 leading-3">{s.title}</p>
                  <p className="text-[9px] font-normal text-[#68758A] mt-0.5 leading-3">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#0CAF60] shrink-0 self-center" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Resend */}
        <div className="border-t border-dashed border-gray-200 pt-4">
          <p className="text-[11px] font-normal text-[#68758A] text-center mb-2">Tidak menerima email?</p>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[12px] font-normal text-[#68758A]">Kirim ulang dalam</span>
            <span className="text-[12px] font-medium text-[#0CAF60]">00:{ss}</span>
          </div>
          <button
            onClick={handleResend}
            disabled={countdown > 0 || isSending}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-[#0CAF60] text-[#0CAF60] rounded-xl text-xs font-medium hover:bg-[#E8FAF0] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isSending ? 'Mengirim...' : 'Kirim Ulang Email'}
          </button>
          {sentMsg && <p className="text-[11px] font-normal text-[#0CAF60] text-center mt-2">{sentMsg}</p>}
        </div>
      </div>

      {/* Kembali ke login */}
      <Link
        href="/login"
        className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 bg-white border border-gray-200 text-[#68758A] rounded-xl text-xs font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        Kembali ke Halaman Login
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
      <p className="text-center mt-4 text-[11px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
        <Headphones className="w-4 h-4 text-[#0CAF60]" />
        Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
      </p>
      <p className="text-center mt-2 text-[10px] font-normal text-[#68758A]/70">© 2026 Tokiva. Semua hak dilindungi.</p>
    </div>
  );
}

export default function VerifikasiPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-[60vh] flex items-center justify-center text-sm text-[#68758A]">Memuat...</div>}>
      <VerifikasiContent />
    </Suspense>
  );
}
