'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/ToastProvider';
import Skeleton from '@/components/ui/Skeleton';
import { CheckSquare, Check, X, Store, ArrowRight, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function AdminKurasiPage() {
  const [koreksiList, setKoreksiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showFeedback = (type, title, message) => toast[type](message, { title });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'wrong'
  const itemsPerPage = 5;

  useEffect(() => {
    fetchKurasi();
  }, []);

  const fetchKurasi = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/kurasi');
      if (res.berhasil && res.data) {
        setKoreksiList(res.data);
      }
    } catch (err) {
      // Silently handle — UI shows empty state
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/kurasi/${id}/setujui`, {});
      fetchKurasi();
    } catch (err) {
      showFeedback('error', 'Gagal Setujui', err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/kurasi/${id}/tolak`, {});
      fetchKurasi();
    } catch (err) {
      showFeedback('error', 'Gagal Tolak', err.message);
    }
  };

  const stats = {
    total: koreksiList.length,
    correct: koreksiList.filter(k => k.is_correct === true).length,
    wrong: koreksiList.filter(k => k.is_correct === false).length,
  };
  const filteredList = filter === 'correct' ? koreksiList.filter(k => k.is_correct === true)
    : filter === 'wrong' ? koreksiList.filter(k => k.is_correct === false)
    : koreksiList;
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentKoreksi = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="Kurasi Koreksi Kasir & Unknown Products">
      <div className="space-y-6">
        {/* Header Bar */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" /> Antrean Kurasi Koreksi Kasir
          </h2>
          <p className="text-xs text-slate-400">
            Review crowdsourced foto barang dari kamera POS saat kasir melakukan koreksi tebakan AI
          </p>
        </div>

        {/* Stats & Filter Bar */}
        {koreksiList.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-slate-200">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">AI Benar: {stats.correct}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400">AI Salah: {stats.wrong}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => { setFilter('all'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>Semua</button>
              <button onClick={() => { setFilter('correct'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'correct' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>AI Benar</button>
              <button onClick={() => { setFilter('wrong'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'wrong' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>AI Salah</button>
            </div>
          </div>
        )}

        {/* List of Pending Corrections */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-28 rounded-md" />
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                        <Skeleton className="h-5 w-32 rounded-md" />
                      </div>
                      <Skeleton className="h-3.5 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Skeleton className="h-9 w-32 rounded-xl" />
                    <Skeleton className="h-9 w-44 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-200">Antrean Kurasi Bersih! 🎉</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tidak ada koreksi kasir baru yang perlu dikurasi saat ini. Seluruh foto crowdsourced telah terverifikasi.
              </p>
            </div>
          ) : (
            currentKoreksi.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center relative">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt="Foto Koreksi"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }}
                      />
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono text-center p-1">No Image</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                        AI: {item.prediksi_1?.nama || item.deteksi_ai?.prediksi || 'Unknown'}{' '}
                        ({item.prediksi_1_confidence != null && !isNaN(Number(item.prediksi_1_confidence))
                          ? `${Math.round(Number(item.prediksi_1_confidence) <= 1 ? Number(item.prediksi_1_confidence) * 100 : Number(item.prediksi_1_confidence))}%`
                          : item.deteksi_ai?.confidence != null && !isNaN(Number(item.deteksi_ai?.confidence))
                          ? `${Math.round(Number(item.deteksi_ai?.confidence) * 100)}%`
                          : '—%'})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        Kasir: {item.produk_dipilih?.nama || 'Produk Dipilih'}
                      </span>
                      {item.is_correct === true && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> AI Benar
                        </span>
                      )}
                      {item.is_correct === false && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                          <X className="w-3 h-3" /> AI Salah
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pt-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" /> {item.toko?.nama || 'Toko Kasir'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Tolak Foto
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" /> Setujui Masuk Dataset
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Kurasi Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span>
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} dari {filteredList.length} Antrean
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-200 px-3">
                Halaman {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </AdminLayout>
  );
}
