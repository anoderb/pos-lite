'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, LogIn, HelpCircle, X, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FeedbackModal from '@/components/ui/FeedbackModal';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const { login, initAuth, user, token } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const [showLupaPassword, setShowLupaPassword] = useState(false);
  const [lupaEmail, setLupaEmail] = useState('');
  const [isLupaLoading, setIsLupaLoading] = useState(false);
  const [lupaSent, setLupaSent] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  // Autoredirect jika sudah login (owner only — role kasir dihapus di lite)
  useEffect(() => {
    if (user && token) {
      router.replace('/owner/dashboard');
    }
  }, [user, token, router]);

  const handleLupaPassword = async (e) => {
    e.preventDefault();
    if (!lupaEmail) return;
    setIsLupaLoading(true);
    try {
      await api.post('/auth/lupa-password', { email: lupaEmail });
      setLupaSent(true);
    } catch {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal', message: 'Gagal mengirim email reset. Coba lagi nanti.' });
    } finally {
      setIsLupaLoading(false);
    }
  };

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
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Login Berhasil!',
        message: `Selamat datang kembali, ${userProfile?.nama || 'Pengguna'}!`,
      });
      setTimeout(() => {
        router.replace('/owner/dashboard');
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login. Cek email & password Anda.');
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Gagal Login',
        message: err.message || 'Email atau password tidak sesuai.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 shadow-xl border-gray-100/80">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-md mb-3">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{APP_NAME}</h1>
        <p className="text-xs text-gray-500 mt-1">Smart POS for modern retail</p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Alamat Email"
          type="email"
          placeholder="email@toko.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          onInvalid={(e) => e.target.setCustomValidity('Email wajib diisi dengan format yang benar')}
          onInput={(e) => e.target.setCustomValidity('')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          onInvalid={(e) => e.target.setCustomValidity('Password wajib diisi')}
          onInput={(e) => e.target.setCustomValidity('')}
        />

        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={() => { setLupaEmail(email); setShowLupaPassword(true); }}
            className="text-xs text-[#16A34A] hover:underline font-semibold"
          >
            Lupa Password?
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
            icon={LogIn}
          >
            Masuk ke Aplikasi
          </Button>
        </div>
      </form>

      {/* Footer — admin login link (developer panel) */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-600">
          Panel developer:{' '}
          <a href="/admin/login" className="font-bold text-[#16A34A] hover:underline">
            Login Admin
          </a>
        </p>
      </div>

      {/* Modal Lupa Password */}
      <Modal
        isOpen={showLupaPassword}
        onClose={() => { setShowLupaPassword(false); setLupaSent(false); }}
        title="Reset Password"
        size="sm"
      >
        {lupaSent ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 text-[#16A34A]" />
            </div>
            <p className="text-sm font-bold text-gray-900">Email Terkirim!</p>
            <p className="text-xs text-gray-500">
              Link reset password telah dikirim ke <strong>{lupaEmail}</strong>.
              Silakan cek kotak masuk (atau spam) email Anda.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => { setShowLupaPassword(false); setLupaSent(false); }}
            >
              Tutup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLupaPassword} className="space-y-4">
            <p className="text-xs text-gray-500">
              Masukkan email terdaftar Anda. Kami akan kirimkan link reset password.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="email@toko.com"
              icon={Mail}
              value={lupaEmail}
              onChange={(e) => setLupaEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLupaLoading}
              icon={HelpCircle}
            >
              Kirim Link Reset
            </Button>
          </form>
        )}
      </Modal>

      {/* Feedback Modal Popup */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </Card>
  );
}
