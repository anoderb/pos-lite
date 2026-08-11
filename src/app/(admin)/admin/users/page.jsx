'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import Skeleton from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { Users, Search, Ban, CheckCircle, Store, Mail, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feedback modal state
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const savedToken = localStorage.getItem('tokiva_admin_token') || localStorage.getItem('tokiva_jwt_token');
      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.berhasil && res.data) {
        setTenants(res.data);
      }
    } catch (err) {
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTenant) return;
    const isSuspend = modalType === 'suspend';
    const endpoint = `/admin/users/${selectedTenant.id}/${isSuspend ? 'suspend' : 'aktifkan'}`;

    try {
      const savedToken = localStorage.getItem('tokiva_admin_token') || localStorage.getItem('tokiva_jwt_token');
      await api.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      fetchTenants();
    } catch (err) {
      showFeedback('error', 'Gagal', `Gagal ${isSuspend ? 'suspend' : 'mengaktifkan'} toko: ${err.message}`);
    } finally {
      setModalType(null);
      setSelectedTenant(null);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const p = Array.isArray(t.pengguna) ? t.pengguna?.[0] : t.pengguna;
    return t.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage) || 1;
  const currentTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="Manajemen Tenant & Owner Toko">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> Daftar Tenant Toko & Pemilik
            </h2>
            <p className="text-xs text-slate-400">Kelola akun toko registered & kontrol lisensi SaaS</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari toko atau email owner..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Nama Toko & Alamat</th>
                  <th className="px-6 py-4">Owner & Kontak</th>
                  <th className="px-6 py-4">Tanggal Registrasi</th>
                  <th className="px-6 py-4">Status Lisensi</th>
                  <th className="px-6 py-4 text-right">Aksi Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-slate-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-2xl bg-slate-700/50" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3 w-28 bg-slate-700/50" />
                            <Skeleton className="h-2.5 w-36 bg-slate-700/50" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-24 bg-slate-700/50" />
                          <Skeleton className="h-2.5 w-32 bg-slate-700/50" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-3 w-20 bg-slate-700/50" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-16 rounded-xl bg-slate-700/50" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="h-7 w-24 rounded-xl bg-slate-700/50 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Tidak ditemukan tenant toko yang sesuai.
                    </td>
                  </tr>
                ) : (
                  currentTenants.map((toko) => {
                    // pengguna bisa object (FK 1:1) atau array
                    const rawPengguna = toko.pengguna;
                    const owner = Array.isArray(rawPengguna) 
                      ? (rawPengguna[0] || { nama: 'Owner Toko', email: '—', aktif: true })
                      : (rawPengguna || { nama: 'Owner Toko', email: '—', aktif: true });
                    const isAktif = owner.aktif !== false;

                    return (
                      <tr key={toko.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{toko.nama}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">{toko.alamat || 'Alamat Belum Diisi'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">{owner.nama}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {owner.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(toko.created_at || Date.now()).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isAktif ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 text-[11px] font-semibold border border-rose-500/20">
                              <Ban className="w-3 h-3" /> Dinonaktifkan
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isAktif ? (
                            <button
                              onClick={() => {
                                setSelectedTenant(toko);
                                setModalType('suspend');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-all"
                            >
                              Suspend Toko
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTenant(toko);
                                setModalType('aktifkan');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTenants.length)} dari {filteredTenants.length} Tenant
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
      </div>

      {/* Confirmation Modal */}
      {modalType && selectedTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Konfirmasi {modalType === 'suspend' ? 'Suspend' : 'Aktivasi'} Toko
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin {modalType === 'suspend' ? 'menonaktifkan (suspend)' : 'mengaktifkan kembali'} lisensi toko <strong className="text-slate-200">{selectedTenant.nama}</strong>?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex-1 py-2.5 rounded-xl text-slate-950 font-bold text-xs transition-all ${
                  modalType === 'suspend' ? 'bg-rose-400 hover:bg-rose-300' : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                Ya, Proses
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </AdminLayout>
  );
}
