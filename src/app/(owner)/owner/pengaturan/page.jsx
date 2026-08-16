'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  UserCheck,
  Plus,
  Key,
  Trash2,
  Lock,
  Save,
  Wallet,
  Banknote,
  QrCode,
  Upload,
  Info,
  X,
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

const TABS = [
  { id: 'toko', label: 'Profil & Toko', icon: Store },
  { id: 'kasir', label: 'Kasir Staf', icon: UserCheck },
  { id: 'pembayaran', label: 'Pembayaran', icon: Wallet },
  { id: 'keamanan', label: 'Keamanan', icon: Lock },
  { id: 'lainnya', label: 'Lainnya', icon: Info },
];

export default function OwnerPengaturanPage() {
  const { toko } = useAuthStore();
  const [activeTab, setActiveTab] = useState('toko');
  const [stafList, setStafList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data toko dari server (fresh)
  const [tokoServer, setTokoServer] = useState(null);
  const [tokoData, setTokoData] = useState({
    nama: toko?.nama || APP_NAME,
    alamat: toko?.alamat || '',
    noHp: toko?.no_telp || '',
    footerStruk: toko?.catatan_footer || 'Terima kasih telah berbelanja!',
  });

  // Form Pembayaran
  const [payData, setPayData] = useState({
    qrisAktif: false,
    transferAktif: false,
    merchantName: '',
    mid: '',
    bankNama: '',
    bankNoRekening: '',
    bankAtasNama: '',
  });
  const [uploading, setUploading] = useState(''); // 'logo' | 'qris' | ''
  const logoInputRef = useRef(null);
  const qrisInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kasirForm, setKasirForm] = useState({ nama: '', email: '', password: '' });

  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });
  const [confirmToggle, setConfirmToggle] = useState({ isOpen: false, kasir: null });

  const [resetKasir, setResetKasir] = useState({ isOpen: false, id: null, nama: '' });
  const [resetPass, setResetPass] = useState('');
  const [resetKonfirm, setResetKonfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchKasirList();
    fetchToko();
  }, []);

  const fetchToko = async () => {
    try {
      const res = await api.get('/owner/toko');
      const d = res?.data || res;
      if (d) {
        setTokoServer(d);
        setTokoData({
          nama: d.nama || toko?.nama || APP_NAME,
          alamat: d.alamat || '',
          noHp: d.no_telp || '',
          footerStruk: d.catatan_footer || 'Terima kasih telah berbelanja!',
        });
        setPayData({
          qrisAktif: d.qris_aktif === true,
          transferAktif: d.transfer_aktif === true,
          merchantName: d.qris_merchant_name || '',
          mid: d.qris_mid || '',
          bankNama: d.bank_nama || '',
          bankNoRekening: d.bank_no_rekening || '',
          bankAtasNama: d.bank_atas_nama || '',
        });
      }
    } catch { /* biarkan default */ }
  };

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

  const handleSaveToko = async (e) => {
    e.preventDefault();
    try {
      await api.put('/owner/toko', {
        nama: tokoData.nama,
        alamat: tokoData.alamat,
        no_telp: tokoData.noHp,
        catatan_footer: tokoData.footerStruk,
      });
      setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Profil Toko berhasil diperbarui!' });
      fetchToko();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Memperbarui Toko', message: err.message });
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('logo');
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/owner/toko/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFeedback({ isOpen: true, type: 'success', title: 'Foto Toko Terupload', message: 'Foto toko berhasil disimpan.' });
      await fetchToko();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Upload Gagal', message: err.response?.data?.pesan || err.message });
    } finally {
      setUploading('');
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleUploadQris = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('qris');
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/owner/toko/qris', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFeedback({ isOpen: true, type: 'success', title: 'QRIS Terupload', message: 'Gambar QRIS berhasil disimpan.' });
      await fetchToko();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Upload Gagal', message: err.response?.data?.pesan || err.message });
    } finally {
      setUploading('');
      if (qrisInputRef.current) qrisInputRef.current.value = '';
    }
  };

  const handleSavePembayaran = async () => {
    try {
      await api.put('/owner/toko', {
        qris_aktif: payData.qrisAktif,
        transfer_aktif: payData.transferAktif,
        qris_merchant_name: payData.merchantName,
        qris_mid: payData.mid,
        bank_nama: payData.bankNama,
        bank_no_rekening: payData.bankNoRekening,
        bank_atas_nama: payData.bankAtasNama,
      });
      setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Pengaturan pembayaran tersimpan.' });
      fetchToko();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.response?.data?.pesan || err.message });
    }
  };

  const handleCreateKasir = async (e) => {
    e.preventDefault();
    if (!kasirForm.nama || !kasirForm.email || !kasirForm.password) return;
    try {
      setIsSubmitting(true);
      await api.post('/owner/pengguna', kasirForm);
      setFeedback({ isOpen: true, type: 'success', title: 'Kasir Berhasil Dibuat!', message: `Akun kasir untuk ${kasirForm.nama} (${kasirForm.email}) telah berhasil didaftarkan.` });
      setIsModalOpen(false);
      setKasirForm({ nama: '', email: '', password: '' });
      fetchKasirList();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Membuat Kasir', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatusKasir = (kasir) => setConfirmToggle({ isOpen: true, kasir });

  const executeToggleStatusKasir = async () => {
    if (!confirmToggle.kasir) return;
    const kasir = confirmToggle.kasir;
    try {
      const nextStatus = !kasir.aktif;
      await api.put(`/owner/pengguna/${kasir.id}`, { aktif: nextStatus });
      setFeedback({ isOpen: true, type: 'info', title: 'Status Diperbarui', message: `Akun kasir ${kasir.nama} telah ${nextStatus ? 'diaktifkan kembali' : 'dinonaktifkan'}.` });
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
      setFeedback({ isOpen: true, type: 'success', title: 'Kasir Dihapus!', message: `Akun kasir "${confirmDelete.nama}" berhasil dihapus secara permanen.` });
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
      fetchKasirList();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Menghapus Kasir', message: err.response?.data?.pesan || err.message });
    }
  };

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

  const Toggle = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn('relative w-10 h-5.5 rounded-full transition-colors shrink-0', value ? 'bg-[#0CAF60]' : 'bg-gray-200')}
      style={{ height: 22 }}
      aria-label="toggle"
    >
      <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all', value ? 'left-[20px]' : 'left-0.5')} style={{ width: 18, height: 18 }} />
    </button>
  );

  return (
    <div className="max-w-[430px] mx-auto space-y-4 pb-24 text-[#10233E]">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-[20px] p-4 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[62%]">
          <p className="text-[10px] font-normal text-[#68758A]">Dashboard &gt; Pengaturan &amp; Staf</p>
          <h1 className="text-base font-semibold leading-6 mt-1">Pengaturan Toko &amp; Kasir</h1>
          <p className="text-[10px] font-normal text-[#68758A] leading-4 mt-1">Atur profil toko, metode pembayaran, dan akun kasir staf.</p>
        </div>
        <img src="/assets/tokiva-dashboard/img-settings-3d.png" alt="Pengaturan 3D" className="absolute right-0 bottom-0 w-[42%] h-[96%] object-contain object-right-bottom" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar overscroll-x-contain">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                activeTab === t.id ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: Profil & Toko */}
      {activeTab === 'toko' && (
        <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-4">
          <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><Store className="w-4 h-4 text-[#0CAF60]" /> Informasi Toko</h2>

          {/* Foto Toko */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0">
              {tokoServer?.logo_url ? <img src={tokoServer.logo_url} alt="Logo toko" className="w-full h-full object-cover" /> : (tokoData.nama || 'T')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#10233E] truncate">{tokoData.nama}</p>
              <button onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'} className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#0CAF60]">
                <Upload className="w-3 h-3" /> {uploading === 'logo' ? 'Mengunggah...' : 'Unggah Foto Toko'}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
            </div>
          </div>

          <form onSubmit={handleSaveToko} className="space-y-3 text-xs">
            <Input label="Nama Toko / Usaha" value={tokoData.nama} onChange={e => setTokoData({ ...tokoData, nama: e.target.value })} required />
            <Input label="Alamat Toko" value={tokoData.alamat} onChange={e => setTokoData({ ...tokoData, alamat: e.target.value })} />
            <Input label="No. WhatsApp / HP Toko" value={tokoData.noHp} onChange={e => setTokoData({ ...tokoData, noHp: e.target.value })} />
            <Input label="Catatan Footer Struk" value={tokoData.footerStruk} onChange={e => setTokoData({ ...tokoData, footerStruk: e.target.value })} />
            <Button variant="primary" fullWidth size="lg" type="submit">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Profil Toko
            </Button>
          </form>
        </section>
      )}

      {/* TAB: Kasir Staf */}
      {activeTab === 'kasir' && (
        <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#0CAF60]" /> Akun Kasir Staf ({stafList.length})</h2>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-[#0CAF60] text-white rounded-xl text-[11px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all">
              <Plus className="w-3.5 h-3.5" />
              Tambah Kasir
            </button>
          </div>

          {isLoading ? renderStafSkeleton() : stafList.length === 0 ? (
            <p className="text-[11px] font-normal text-[#68758A] text-center py-6">Belum ada akun kasir staf. Klik "Tambah Kasir" untuk mendaftarkan staf.</p>
          ) : (
            <div className="space-y-2">
              {stafList.map((kasir) => {
                const isAktif = kasir.aktif !== false;
                return (
                  <div key={kasir.id} className="p-3 bg-[#FAFBFC] rounded-xl flex items-center justify-between gap-3 border border-gray-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center font-medium text-xs shrink-0">
                        {(kasir.nama || 'K')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#10233E] truncate">{kasir.nama}</p>
                        <p className="text-[10px] font-normal text-[#68758A] truncate">{kasir.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStatusKasir(kasir)}
                        className={cn('px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all', isAktif ? 'bg-[#E8FAF0] text-[#087A4B] border-emerald-100' : 'bg-gray-200 text-gray-600 border-gray-300')}
                      >
                        {isAktif ? 'Aktif ✓' : 'Nonaktif'}
                      </button>
                      <button type="button" onClick={() => { setResetPass(''); setResetKonfirm(''); setResetKasir({ isOpen: true, id: kasir.id, nama: kasir.nama }); }} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Ubah Password Akun Kasir">
                        <Key className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setConfirmDelete({ isOpen: true, id: kasir.id, nama: kasir.nama })} className="p-1.5 text-[#68758A] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Akun Kasir Permanen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB: Pembayaran */}
      {activeTab === 'pembayaran' && (
        <div className="space-y-4">
          {/* QRIS */}
          <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><QrCode className="w-4 h-4 text-[#0CAF60]" /> QRIS Toko</h2>
              <Toggle value={payData.qrisAktif} onChange={v => setPayData({ ...payData, qrisAktif: v })} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {tokoServer?.qris_url ? <img src={tokoServer.qris_url} alt="QRIS" className="w-full h-full object-contain" /> : <QrCode className="w-8 h-8 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#10233E]">Gambar QRIS</p>
                <p className="text-[9px] font-normal text-[#68758A] mt-0.5">Upload QRIS dari penyedia pembayaran Anda.</p>
                <button onClick={() => qrisInputRef.current?.click()} disabled={uploading === 'qris'} className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-[#0CAF60]">
                  <Upload className="w-3 h-3" /> {uploading === 'qris' ? 'Mengunggah...' : 'Upload QRIS'}
                </button>
                <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleUploadQris} className="hidden" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Nama Merchant" placeholder="TOKO BERKAH" value={payData.merchantName} onChange={e => setPayData({ ...payData, merchantName: e.target.value })} />
              <Input label="MID / ID Merchant" placeholder="ID1234567" value={payData.mid} onChange={e => setPayData({ ...payData, mid: e.target.value })} />
            </div>
          </section>

          {/* Rekening */}
          <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><Banknote className="w-4 h-4 text-violet-600" /> Rekening Bank</h2>
              <Toggle value={payData.transferAktif} onChange={v => setPayData({ ...payData, transferAktif: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Nama Bank" placeholder="BCA" value={payData.bankNama} onChange={e => setPayData({ ...payData, bankNama: e.target.value })} />
              <Input label="No. Rekening" placeholder="1234567890" value={payData.bankNoRekening} onChange={e => setPayData({ ...payData, bankNoRekening: e.target.value })} />
            </div>
            <Input label="Atas Nama" placeholder="Khamdanu Syakir" value={payData.bankAtasNama} onChange={e => setPayData({ ...payData, bankAtasNama: e.target.value })} />
          </section>

          <button onClick={handleSavePembayaran} className="w-full py-3 bg-[#0CAF60] text-white rounded-xl text-[13px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Simpan Pengaturan Pembayaran
          </button>
          <p className="text-[9px] font-normal text-[#68758A] text-center leading-4">Metode yang OFF atau belum lengkap tidak akan muncul di halaman pembayaran kasir. Jika QRIS &amp; Rekening tidak aktif, hanya Tunai yang tersedia.</p>
        </div>
      )}

      {/* TAB: Keamanan */}
      {activeTab === 'keamanan' && (
        <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-3">
          <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><Lock className="w-4 h-4 text-[#0CAF60]" /> Ubah Kata Sandi Akun</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const passLama = e.target.password_lama.value;
              const passBaru = e.target.password_baru.value;
              const konfirmPass = e.target.konfirm_password.value;
              if (!passLama) return setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Password lama wajib diisi!' });
              if (!passBaru || passBaru.length < 8) return setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Password baru minimal harus 8 karakter!' });
              if (passBaru !== konfirmPass) return setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Konfirmasi password baru tidak cocok!' });
              try {
                const res = await api.post('/auth/ganti-password', { old_password: passLama, new_password: passBaru });
                setFeedback({ isOpen: true, type: 'success', title: 'Password Diperbarui!', message: res?.pesan || 'Password akun Anda berhasil diperbarui!' });
                e.target.reset();
              } catch (err) {
                setFeedback({ isOpen: true, type: 'error', title: 'Gagal Ubah Password', message: err.response?.data?.pesan || err.message });
              }
            }}
            className="space-y-3 text-xs"
          >
            <Input name="password_lama" type="password" label="Password Lama" placeholder="Masukkan password saat ini" required />
            <Input name="password_baru" type="password" label="Password Baru" placeholder="Minimal 8 karakter" required />
            <Input name="konfirm_password" type="password" label="Konfirmasi Password Baru" placeholder="Ulangi password baru" required />
            <Button variant="primary" fullWidth size="lg" type="submit">
              <Key className="w-4 h-4 mr-1.5" />
              Ubah Password Sekarang
            </Button>
          </form>
        </section>
      )}

      {/* TAB: Lainnya */}
      {activeTab === 'lainnya' && (
        <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50 space-y-2">
          <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><Info className="w-4 h-4 text-[#0CAF60]" /> Tentang Aplikasi</h2>
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Aplikasi</span><span className="font-medium text-[#10233E]">{APP_NAME}</span></div>
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Versi</span><span className="font-medium text-[#10233E]">1.0.0</span></div>
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Peran Akun</span><span className="font-medium text-[#10233E]">Owner</span></div>
          </div>
          <p className="text-[9px] font-normal text-[#68758A] leading-4 pt-1">Tokiva — Sistem Point of Sale berbasis website dengan identifikasi produk berbasis Computer Vision untuk UMKM toko kelontong.</p>
        </section>
      )}

      {/* Modal Tambah Kasir */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Akun Kasir Staf Baru" size="md">
        <form onSubmit={handleCreateKasir} className="space-y-3.5 text-xs">
          <Input label="Nama Lengkap Staf Kasir" placeholder="Budi Santoso" value={kasirForm.nama} onChange={e => setKasirForm({ ...kasirForm, nama: e.target.value })} required />
          <Input label="Email / Username Login Kasir" type="email" placeholder="staf@toko.com" value={kasirForm.email} onChange={e => setKasirForm({ ...kasirForm, email: e.target.value })} required />
          <Input label="Password Akun Kasir" type="password" placeholder="••••••••" value={kasirForm.password} onChange={e => setKasirForm({ ...kasirForm, password: e.target.value })} required />
          <Button variant="primary" fullWidth size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Buat Akun Kasir Staf'}
          </Button>
        </form>
      </Modal>

      {/* Modal Reset Password Kasir */}
      <Modal isOpen={resetKasir.isOpen} onClose={() => { setResetKasir({ isOpen: false, id: null, nama: '' }); setResetPass(''); setResetKonfirm(''); }} title={`Reset Password ${resetKasir.nama || 'Kasir'}`}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!resetPass || resetPass.length < 6) return setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Password baru minimal 6 karakter!' });
            if (resetPass !== resetKonfirm) return setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Konfirmasi password tidak cocok!' });
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
          <p className="text-xs font-normal text-[#68758A]">Masukkan password baru untuk akun kasir. Password minimal <b>6 karakter</b>.</p>
          <Input label="Password Baru" type="password" placeholder="Minimal 6 karakter" value={resetPass} onChange={e => setResetPass(e.target.value)} required />
          <Input label="Konfirmasi Password Baru" type="password" placeholder="Ulangi password baru" value={resetKonfirm} onChange={e => setResetKonfirm(e.target.value)} required />
          <Button variant="primary" fullWidth size="lg" type="submit" disabled={isResetting}>
            <Key className="w-4 h-4 mr-1.5" />
            {isResetting ? 'Menyimpan...' : 'Reset Password'}
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
