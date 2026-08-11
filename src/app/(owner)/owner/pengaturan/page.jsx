'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  UserCheck,
  Plus,
  Key,
  Trash2,
  Lock,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/config';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function OwnerPengaturanPage() {
  const { toko } = useAuthStore();
  const [stafList, setStafList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Profil Toko
  const [tokoData, setTokoData] = useState({
    nama: toko?.nama || APP_NAME,
    alamat: toko?.alamat || '',
    noHp: toko?.no_telp || '',
    footerStruk: toko?.footer_struk || 'Terima kasih telah berbelanja!',
  });

  // Modal Tambah Kasir & State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kasirForm, setKasirForm] = useState({ nama: '', email: '', password: '' });

  // Feedback & Confirm Modal State
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });
  const [confirmToggle, setConfirmToggle] = useState({ isOpen: false, kasir: null });

  // Modal Reset Password Kasir
  const [resetKasir, setResetKasir] = useState({ isOpen: false, id: null, nama: '' });
  const [resetPass, setResetPass] = useState('');
  const [resetKonfirm, setResetKonfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchKasirList();
  }, []);

  const fetchKasirList = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/owner/pengguna');
      const data = Array.isArray(res) ? res : (res?.data || []);
      setStafList(data.filter(u => u.role === 'kasir'));
    } catch {
      setStafList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton untuk daftar akun kasir staf
  const renderStafSkeleton = () => (
    <div className="space-y-2.5">
      {[0, 1].map((i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 border border-gray-100">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-48" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );

  const handleSaveToko = async (e) => {
    e.preventDefault();
    try {
      await api.put('/owner/toko', {
        nama: tokoData.nama,
        alamat: tokoData.alamat,
        no_telp: tokoData.noHp,
        footer_struk: tokoData.footerStruk,
      });
      setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Profil Toko berhasil diperbarui!' });
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Memperbarui Toko', message: err.message });
    }
  };

  const handleCreateKasir = async (e) => {
    e.preventDefault();
    if (!kasirForm.nama || !kasirForm.email || !kasirForm.password) return;

    try {
      setIsSubmitting(true);
      await api.post('/owner/pengguna', kasirForm);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Kasir Berhasil Dibuat!',
        message: `Akun kasir untuk ${kasirForm.nama} (${kasirForm.email}) telah berhasil didaftarkan.`,
      });
      setIsModalOpen(false);
      setKasirForm({ nama: '', email: '', password: '' });
      fetchKasirList();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Membuat Kasir', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatusKasir = (kasir) => {
    setConfirmToggle({ isOpen: true, kasir });
  };

  const executeToggleStatusKasir = async () => {
    if (!confirmToggle.kasir) return;
    const kasir = confirmToggle.kasir;
    try {
      const nextStatus = !kasir.aktif;
      await api.put(`/owner/pengguna/${kasir.id}`, { aktif: nextStatus });
      setFeedback({
        isOpen: true,
        type: 'info',
        title: 'Status Diperbarui',
        message: `Akun kasir ${kasir.nama} telah ${nextStatus ? 'diaktifkan kembali' : 'dinonaktifkan'}.`,
      });
      setConfirmToggle({ isOpen: false, kasir: null });
      fetchKasirList();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Mengubah Status', message: err.message });
    }
  };

  const executeDeleteKasir = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/owner/pengguna/${confirmDelete.id}/permanen`);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Kasir Dihapus!',
        message: `Akun kasir "${confirmDelete.nama}" berhasil dihapus secara permanen dari database & Supabase Auth.`,
      });
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
      fetchKasirList();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Menghapus Kasir', message: err.response?.data?.pesan || err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="py-1 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
          Pengaturan Toko & Manajemen Kasir
        </h1>
        <p className="text-xs text-gray-500">Atur profil toko, informasi struk, dan tambahkan akun kasir staf</p>
      </div>

      {/* Section 1: Profil Toko */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 font-[family-name:var(--font-poppins)] flex items-center gap-2">
          <Store className="w-4 h-4 text-[#16A34A]" />
          Informasi & Header Struk Toko
        </h3>

        <form onSubmit={handleSaveToko} className="space-y-3.5 text-xs">
          <Input
            label="Nama Toko / Usaha"
            value={tokoData.nama}
            onChange={e => setTokoData({ ...tokoData, nama: e.target.value })}
            required
          />
          <Input
            label="Alamat Toko"
            value={tokoData.alamat}
            onChange={e => setTokoData({ ...tokoData, alamat: e.target.value })}
            required
          />
          <Input
            label="No. WhatsApp / HP Toko"
            value={tokoData.noHp}
            onChange={e => setTokoData({ ...tokoData, noHp: e.target.value })}
            required
          />
          <Input
            label="Catatan Footer Struk (Pesan Penutup Struk Belanja)"
            value={tokoData.footerStruk}
            onChange={e => setTokoData({ ...tokoData, footerStruk: e.target.value })}
            required
          />

          <div className="pt-2">
            <Button variant="primary" size="md">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Profil Toko
            </Button>
          </div>
        </form>
      </div>

      {/* Section 2: Manajemen Akun Kasir Staf */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#16A34A]" />
            Daftar Akun Kasir Staf ({stafList.length})
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#16A34A] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#15803D]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kasir</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {isLoading ? (
            renderStafSkeleton()
          ) : stafList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada akun kasir staf. Klik tombol "Tambah Kasir" untuk mendaftarkan staf.</p>
          ) : (
            stafList.map((kasir) => {
              const isAktif = kasir.aktif !== false;
              return (
                <div key={kasir.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between gap-3 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold text-xs">
                      {(kasir.nama || 'K')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{kasir.nama}</h4>
                      <p className="text-[10px] text-gray-500">{kasir.email} • Kasir Staf</p>
                    </div>
                  </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatusKasir(kasir)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                          isAktif ? 'bg-emerald-50 text-[#15803D] border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'
                        )}
                      >
                        {isAktif ? 'Aktif ✓' : 'Nonaktif'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPass('');
                          setResetKonfirm('');
                          setResetKasir({ isOpen: true, id: kasir.id, nama: kasir.nama });
                        }}
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ubah Password Akun Kasir"
                      >
                        <Key className="w-4 h-4 text-amber-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ isOpen: true, id: kasir.id, nama: kasir.nama })}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Akun Kasir Permanen"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Ubah Kata Sandi Akun Cepat */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 font-[family-name:var(--font-poppins)] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#16A34A]" />
          Keamanan & Ubah Kata Sandi Akun
        </h3>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const passBaru = e.target.password_baru.value;
            const konfirmPass = e.target.konfirm_password.value;

            if (!passBaru || passBaru.length < 8) {
              setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Password baru minimal harus 8 karakter!' });
              return;
            }
            if (passBaru !== konfirmPass) {
              setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Konfirmasi password baru tidak cocok!' });
              return;
            }

            try {
              const res = await api.post('/auth/ganti-password', {
                new_password: passBaru,
              });
              setFeedback({ isOpen: true, type: 'success', title: 'Password Diperbarui!', message: res?.pesan || 'Password akun Anda berhasil diperbarui!' });
              e.target.reset();
            } catch (err) {
              setFeedback({ isOpen: true, type: 'error', title: 'Gagal Ubah Password', message: err.response?.data?.pesan || err.message });
            }
          }}
          className="space-y-3.5 text-xs"
        >
          <Input
            name="password_baru"
            type="password"
            label="Password Baru"
            placeholder="Minimal 8 karakter"
            required
          />
          <Input
            name="konfirm_password"
            type="password"
            label="Konfirmasi Password Baru"
            placeholder="Ulangi password baru"
            required
          />
          <div className="pt-1">
            <Button variant="primary" size="md" type="submit">
              <Key className="w-4 h-4 mr-1.5" />
              Ubah Password Sekarang
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Form Tambah Kasir Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Akun Kasir Staf Baru"
        size="md"
      >
        <form onSubmit={handleCreateKasir} className="space-y-3.5 text-xs">
          <Input
            label="Nama Lengkap Staf Kasir"
            placeholder="Budi Santoso"
            value={kasirForm.nama}
            onChange={e => setKasirForm({ ...kasirForm, nama: e.target.value })}
            required
          />
          <Input
            label="Email / Username Login Kasir"
            type="email"
            placeholder="staf@toko.com"
            value={kasirForm.email}
            onChange={e => setKasirForm({ ...kasirForm, email: e.target.value })}
            required
          />
          <Input
            label="Password Akun Kasir"
            type="password"
            placeholder="••••••••"
            value={kasirForm.password}
            onChange={e => setKasirForm({ ...kasirForm, password: e.target.value })}
            required
          />

          <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isSubmitting}>
            Buat Akun Kasir Staf
          </Button>
        </form>
      </Modal>

      {/* Modal Reset Password Kasir */}
      <Modal
        isOpen={resetKasir.isOpen}
        onClose={() => { setResetKasir({ isOpen: false, id: null, nama: '' }); setResetPass(''); setResetKonfirm(''); }}
        title={`Reset Password ${resetKasir.nama || 'Kasir'}`}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!resetPass || resetPass.length < 6) {
              setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Password baru minimal 6 karakter!' });
              return;
            }
            if (resetPass !== resetKonfirm) {
              setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Konfirmasi password tidak cocok!' });
              return;
            }
            setIsResetting(true);
            try {
              await api.put(`/owner/pengguna/${resetKasir.id}`, { password: resetPass });
              setFeedback({ isOpen: true, type: 'success', title: 'Password Kasir Diperbarui!', message: `Password akun kasir "${resetKasir.nama}" telah berhasil diubah.` });
              setResetKasir({ isOpen: false, id: null, nama: '' });
              setResetPass('');
              setResetKonfirm('');
            } catch (err) {
              setFeedback({ isOpen: true, type: 'error', title: 'Gagal Ubah Password', message: err.response?.data?.pesan || err.message });
            } finally {
              setIsResetting(false);
            }
          }}
          className="space-y-4"
        >
          <p className="text-xs text-gray-500">Masukkan password baru untuk akun kasir. Password minimal <b>6 karakter</b>.</p>
          <Input
            label="Password Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={resetPass}
            onChange={e => setResetPass(e.target.value)}
            required
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            placeholder="Ulangi password baru"
            value={resetKonfirm}
            onChange={e => setResetKonfirm(e.target.value)}
            required
          />
          <Button variant="primary" fullWidth size="lg" type="submit" isLoading={isResetting}>
            <Key className="w-4 h-4 mr-1.5" />
            Reset Password
          </Button>
        </form>
      </Modal>

      {/* Confirm Toggle Status Modal */}
      <ConfirmModal
        isOpen={confirmToggle.isOpen}
        onClose={() => setConfirmToggle({ isOpen: false, kasir: null })}
        onConfirm={executeToggleStatusKasir}
        title={confirmToggle.kasir?.aktif ? "Nonaktifkan Akun Kasir" : "Aktifkan Akun Kasir"}
        message={`Apakah Anda yakin ingin ${confirmToggle.kasir?.aktif ? 'menonaktifkan' : 'mengaktifkan kembali'} kasir "${confirmToggle.kasir?.nama}"? ${confirmToggle.kasir?.aktif ? 'Kasir ini tidak akan bisa login ke sistem.' : 'Kasir ini dapat kembali login dan bertransaksi.'}`}
        confirmText={confirmToggle.kasir?.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        isDanger={confirmToggle.kasir?.aktif}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nama: '' })}
        onConfirm={executeDeleteKasir}
        title="Hapus Akun Kasir Permanen"
        message={`Apakah Anda yakin ingin menghapus akun kasir "${confirmDelete.nama}" secara permanen? Akses login kasir ini akan dicabut sepenuhnya.`}
        confirmText="Ya, Hapus Kasir"
        isDanger
      />

      {/* Feedback Modal */}
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
