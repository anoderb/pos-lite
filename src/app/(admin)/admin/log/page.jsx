'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import Skeleton from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/config';
import { FileText, Calendar, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLogPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const savedToken = localStorage.getItem('tokiva_admin_token') || localStorage.getItem('tokiva_jwt_token');
      const res = await api.get('/admin/log/aktivitas', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.berhasil && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      // Silently handle — UI shows empty state
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="Audit Trail Log Aktivitas Admin">
      <div className="space-y-6">
        {/* Header Bar */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> System Audit Trail Logs
          </h2>
          <p className="text-xs text-slate-400">
            Riwayat log audit seluruh aktivitas Master Admin di sistem {APP_NAME}
          </p>
        </div>

        {/* Log Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Waktu Log</th>
                  <th className="px-6 py-4">Master Admin</th>
                  <th className="px-6 py-4">Aksi System</th>
                  <th className="px-6 py-4">Tipe Referensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-slate-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="w-3.5 h-3.5 rounded bg-slate-700/50" />
                          <Skeleton className="h-3 w-32 bg-slate-700/50" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4 rounded bg-slate-700/50" />
                          <Skeleton className="h-3 w-24 bg-slate-700/50" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-20 rounded-xl bg-slate-700/50" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-3 w-16 bg-slate-700/50" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Belum ada catatan aktivitas log tercatat.
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(log.created_at || Date.now()).toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-slate-200">{log.pengguna_admin?.nama || 'Master Admin'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold border border-emerald-500/20">
                          {log.aksi}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        {log.referensi_tipe || 'system'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, logs.length)} dari {logs.length} Log
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
    </AdminLayout>
  );
}
