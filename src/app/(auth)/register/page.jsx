'use client';

import React, { useState } from 'react';
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
import { toast } from '@/components/ui/ToastProvider';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

// Field didefinisikan di MODULE LEVEL (luar komponen).
// KRITIS: kalau Field dideklarasi di dalam RegisterPage, setiap ketikan
// (setForm → re-render) membikin tipe komponen baru → React unmount/remount
// semua input → fokus hilang → cuma bisa ketik 1 huruf.
function Field({ label, icon: Icon, type = 'text', value, onChange, placeholder, eye, onEye, required = true }) {
  return (
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
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
        />
        {onEye && (
          <button type="button" onClick={onEye} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A]">
            {eye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ namaToko: '', nama: '', email: '', password: '', konfirmasi: '' });
  const [showPass, setShowPass] = useState(false);
  const [showKonf, setShowKonf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        email: form.email.trim().toLowerCase(),
        password: form.password,
        nama_toko: form.namaToko.trim(),
        alamat_toko: '',
        no_telp_toko: '',
      });

      // Registrasi = harus verifikasi email dulu sebelum bisa login
      toast.success('Silakan cek email Anda untuk verifikasi, lalu masuk dengan email dan password Anda.', { title: 'Akun Berhasil Dibuat!' });
      setTimeout(() => router.replace(`/verifikasi?email=${encodeURIComponent(form.email.trim())}`), 800);
    } catch (err) {
      setErrorMsg(err?.response?.data?.pesan || err?.message || 'Gagal membuat akun. Coba lagi.');
      toast.error(err?.response?.data?.pesan || err?.message || 'Gagal membuat akun.', { title: 'Registrasi Gagal' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[22px] shadow-[0_2px_10px_rgba(16,35,62,.06)] p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-10 h-10 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center mb-2">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#10233E]">Buat Akun Baru</h3>
          <p className="text-[12px] font-normal text-[#68758A] mt-1">Isi data di bawah untuk membuat akun toko Anda</p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] rounded-xl text-[12px] font-normal">
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
            <p className="text-[10px] font-normal text-[#68758A]">Akun Anda akan aman bersama Tokiva</p>
          </div>

          <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isLoading} showLoading>
            {isLoading ? 'Mendaftarkan...' : (<><UserPlus className="w-4 h-4 mr-1.5" /> Daftar Sekarang</>)}
          </Button>
        </form>
      </div>

      <p className="text-center mt-5 text-[12px] font-normal text-[#68758A]">
        Sudah punya akun? <Link href="/login" className="font-medium text-[#0CAF60]">Masuk Sekarang</Link>
      </p>
      <p className="text-center mt-4 text-[11px] font-normal text-[#68758A] flex items-center justify-center gap-1.5">
        <Headphones className="w-4 h-4 text-[#0CAF60]" />
        Butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
      </p>
    </div>
  );
}
