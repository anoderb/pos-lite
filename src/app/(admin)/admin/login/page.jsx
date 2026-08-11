'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { APP_NAME } from '@/lib/config';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, isLoading } = useAdminAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await loginAdmin(email, password);
    if (res.success) {
      router.push('/admin/dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            {APP_NAME}<span className="text-emerald-400">Admin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Master Control Hub • SaaS & AI Management
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Master Admin</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Master Control Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-5 text-[11px] text-slate-500">
          <a href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
            ← Kembali ke Login Toko
          </a>
        </p>
      </div>
    </div>
  );
}
