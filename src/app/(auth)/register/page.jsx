'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Headphones,
} from 'lucide-react';
import FeedbackModal from '@/components/ui/FeedbackModal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

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

export default function RegisterPage() {
  const router = useRouter();
  const { login, initAuth, user, token } = useAuthStore();

  const [form, setForm] = useState({ namaToko: '', nama: '', email: '', password: '', konfirmasi: '' });
  const [showPass, setShowPass] = useState(false);
  const [showKonf, setShowKonf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => { initAuth(); }, []);
  useEffect(() => {
    if (user && token) router.replace('/owner/dashboard');
  }, [user, token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.namaToko.trim()) return setErrorMsg('Nama toko wajib diisi');
    if (!form.nama.trim()) return setErrorMsg('Nama lengkap wajib diisi');
    if (!form.email.trim()) return setErrorMsg('Email wajib diisi');
    if (form.password.length < 8) return setErrorMsg('Password minimal 8 karakter');
    if (!/[!@#$%^&*]/.test(form.password)) return setErrorMsg('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*)');
    if (form.password !== form.konfirmasi) return setErrorMsg('Konfirmasi password tidak cocok');

    try {
      setIsLoading(true);
      await api.post('/auth/register', {
        nama: form.nama.trim(),
        email: form.email.trim(),
        password: form.password,
        nama_toko: form.namaToko.trim(),
        alamat_toko: '',
        no_telp_toko: '',
      });

      // Auto-login setelah registrasi berhasil
      try {
        const userProfile = await login(form.email.trim(), form.password);
        setFeedback({ isOpen: true, type: 'success', title: 'Akun Berhasil Dibuat!', message: `Selamat datang, ${userProfile?.nama || 'Pengguna'}! Toko Anda sudah siap digunakan.` });
        setTimeout(() => router.replace('/owner/dashboard'), 800);
      } catch {
        setFeedback({ isOpen: true, type: 'success', title: 'Akun Berhasil Dibuat!', message: 'Silakan cek email Anda untuk verifikasi, lalu masuk dengan email dan password Anda.' });
        setTimeout(() => router.replace(`/verifikasi?email=${encodeURIComponent(form.email.trim())}`), 800);
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.pesan || err?.message || 'Gagal membuat akun. Coba lagi.');
      setFeedback({ isOpen: true, type: 'error', title: 'Registrasi Gagal', message: err?.response?.data?.pesan || err?.message || 'Gagal membuat akun.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        setFeedback({ isOpen: true, type: 'error', title: 'Google Gagal', message: 'Provider Google belum aktif di Supabase. Hubungi developer untuk mengaktifkannya.' });
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memulai Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, eye, onEye, required = true }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-[#10233E]">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Icon className="w-3.5 h-3.5" /></span>
        <input
          type={eye !== undefined ? (eye ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
        />
        {onEye && (
          <button type="button" onClick={onEye} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A]">
            {eye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F4] flex flex-col items-center px-5 py-8 overflow-x-hidden">
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
              Buat akun<br />toko Anda
            </h2>
            <p className="text-[11px] font-medium text-[#0CAF60] mt-1.5 leading-4">
              dan mulai kelola bisnis<br />dengan mudah
            </p>
            <p className="text-[11px] font-normal text-[#68758A] mt-1 leading-4">
              Daftar gratis dan nikmati semua fitur
            </p>
          </div>
          <img src="/assets/tokiva-dashboard/img-register-hero.png" alt="Registrasi Tokiva" className="w-[50%] shrink-0 object-contain" />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-5">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center mb-2">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#10233E]">Buat Akun Baru</h3>
            <p className="text-[10px] font-normal text-[#68758A] mt-0.5">Isi data di bawah untuk membuat akun toko Anda</p>
          </div>

          {errorMsg && (
            <div className="mb-3 p-2.5 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] rounded-xl text-[11px] font-normal">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Nama Toko / Usaha" icon={Store} value={form.namaToko} onChange={e => setForm({ ...form, namaToko: e.target.value })} placeholder="Masukkan nama toko atau usaha Anda" />
            <Field label="Nama Lengkap" icon={User} value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap Anda" />
            <Field label="Email" icon={Mail} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Masukkan email aktif Anda" />
            <Field label="Password" icon={Lock} eye={showPass} onEye={() => setShowPass(!showPass)} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter + 1 spesial (!@#)" />
            <Field label="Konfirmasi Password" icon={Lock} eye={showKonf} onEye={() => setShowKonf(!showKonf)} value={form.konfirmasi} onChange={e => setForm({ ...form, konfirmasi: e.target.value })} placeholder="Ulangi password Anda" />

            {/* Security notice */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#E8FAF0]">
              <ShieldCheck className="w-4 h-4 text-[#0CAF60] shrink-0" />
              <p className="text-[9px] font-normal text-[#68758A]">Akun Anda akan aman bersama Tokiva</p>
            </div>

            <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isLoading} showLoading>
              {isLoading ? 'Mendaftarkan...' : (<><UserPlus className="w-4 h-4 mr-1.5" /> Daftar Sekarang</>)}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-normal text-[#68758A]">atau daftar dengan</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-[#10233E] hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <GoogleIcon />
            {isGoogleLoading ? 'Membuka Google...' : 'Daftar dengan Google'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-1.5">
          <p className="text-[10px] font-normal text-[#68758A]">
            Sudah punya akun? <Link href="/login" className="font-medium text-[#0CAF60]">Masuk Sekarang</Link>
          </p>
          <div className="w-16 h-px bg-gray-200 mx-auto" />
          <p className="text-[10px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-[#0CAF60]" />
            Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
          </p>
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
