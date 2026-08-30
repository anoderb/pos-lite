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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/config';
import jsQR from 'jsqr';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const TABS = [
  { id: 'toko', label: 'Profil & Toko', icon: Store },
  // { id: 'kasir', label: 'Kasir Staf', icon: UserCheck }, // hidden: role kasir dihapus
  { id: 'pembayaran', label: 'Pembayaran', icon: Wallet },
  { id: 'keamanan', label: 'Keamanan', icon: Lock },
  { id: 'lainnya', label: 'Lainnya', icon: Info },
];

export default function OwnerPengaturanPage() {
  const { toko, setToko } = useAuthStore();
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
    tunaiAktif: true,
    merchantName: '',
    mid: '',
  });
  const [uploading, setUploading] = useState(''); // 'logo' | 'qris' | ''
  const logoInputRef = useRef(null);
  const qrisInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kasirForm, setKasirForm] = useState({ nama: '', email: '', password: '' });


  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });
  const [confirmToggle, setConfirmToggle] = useState({ isOpen: false, kasir: null });

  const [resetKasir, setResetKasir] = useState({ isOpen: false, id: null, nama: '' });
  const [resetPass, setResetPass] = useState('');
  const [resetKonfirm, setResetKonfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchKasirList();
    fetchToko();
    fetchQrisStatus();
  }, []);

  const fetchToko = async () => {
    try {
      const res = await api.get('/owner/toko');
      const d = res?.data || res;
      if (d) {
        setTokoServer(d);
        setToko(d);
        setTokoData({
          nama: d.nama || toko?.nama || APP_NAME,
          alamat: d.alamat || '',
          noHp: d.no_telp || '',
          footerStruk: d.catatan_footer || 'Terima kasih telah berbelanja!',
        });
        setPayData({
          qrisAktif: d.qris_aktif === true,
          tunaiAktif: d.tunai_aktif !== false,
          merchantName: d.qris_merchant_name || '',
          mid: d.qris_mid || '',
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
      toast.success('Profil Toko berhasil diperbarui!', { title: 'Berhasil!' });
      fetchToko();
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Memperbarui Toko' });
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('logo');
      const dataUrl = await fileToDataUrl(file);
      await api.post('/owner/toko/logo', { logo_url: dataUrl });
      toast.success('Foto toko berhasil disimpan.', { title: 'Foto Toko Terupload' });
      await fetchToko();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Upload Gagal' });
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

      // Decode QRIS dari gambar -> string (pakai jsQR + canvas)
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

      if (!code || !code.data) {
        toast.error('Tidak dapat membaca QR dari gambar. Pastikan gambar QRIS jelas & tidak buram.', { title: 'QR Tidak Terbaca' });
        return;
      }

      const decoded = String(code.data).trim();
      setQrisString(decoded);

      // Auto-validasi string yang berhasil di-decode
      setSavingQris(true);
      try {
        const res = await api.put('/owner/toko/qris', { qris_string: decoded });
        const d = res?.data?.data || res?.data || {};
        setQrisStatus(d.qris_status || 'valid');
        setQrisInfo(d.qris_info || null);
        toast.success(d.pesan || 'QRIS berhasil dibaca & diverifikasi.', { title: 'QRIS Valid' });
      } catch (err) {
        setQrisStatus('invalid');
        setQrisInfo(null);
        toast.error(err.response?.data?.pesan || err.message, { title: 'QRIS Tidak Valid' });
      } finally {
        setSavingQris(false);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membaca gambar QRIS.', { title: 'Gagal Membaca QR' });
    } finally {
      setUploading('');
      if (qrisInputRef.current) qrisInputRef.current.value = '';
    }
  };

  const handleSavePembayaran = async () => {
    try {
      await api.put('/owner/toko', {
        qris_aktif: payData.qrisAktif,
        tunai_aktif: payData.tunaiAktif,
        qris_merchant_name: payData.merchantName,
        qris_mid: payData.mid,
      });
      toast.success('Pengaturan pembayaran tersimpan.', { title: 'Berhasil!' });
      fetchToko();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Menyimpan' });
    }
  };

  // Toggle metode pembayaran dengan validasi klien (server juga validasi)
  const toggleTunai = (v) => {
    // Tunai tidak bisa OFF kalau QRIS belum ada/valid (harus minimal 1 metode aktif)
    if (v === false && !payData.qrisAktif) {
      toast.error('Tunai tidak bisa dimatikan selama QRIS belum aktif. Aktifkan QRIS dahulu, atau biarkan Tunai menyala.', { title: 'Tunai Tidak Bisa Dimatikan' });
      return;
    }
    setPayData({ ...payData, tunaiAktif: v });
  };

  const toggleQris = (v) => {
    // QRIS tidak bisa ON kalau belum ada QRIS valid
    if (v === true && qrisStatus !== 'valid') {
      toast.error('QRIS tidak bisa diaktifkan karena belum ada QRIS yang valid. Simpan & validasi QRIS di bagian QRIS Dinamis dahulu.', { title: 'QRIS Belum Valid' });
      return;
    }
    // QRIS tidak bisa OFF kalau tunai juga OFF (minimal 1 metode aktif)
    if (v === false && !payData.tunaiAktif) {
      toast.error('QRIS tidak bisa dimatikan selama Tunai juga dimatikan. Minimal satu metode pembayaran harus aktif.', { title: 'Minimal 1 Metode Aktif' });
      return;
    }
    setPayData({ ...payData, qrisAktif: v });
  };

  // Validasi & simpan QRIS string (dinamis)
  const [qrisString, setQrisString] = useState('');
  const [qrisInfo, setQrisInfo] = useState(null);
  const [qrisStatus, setQrisStatus] = useState('empty'); // empty | valid | invalid
  const [savingQris, setSavingQris] = useState(false);

  const fetchQrisStatus = async () => {
    try {
      const res = await api.get('/owner/toko/qris/status');
      const d = res?.data?.data || res?.data || {};
      setQrisStatus(d.status || 'empty');
      setQrisInfo(d.info || null);
      if (d.qris_string) setQrisString(d.qris_string);
    } catch { /* default */ }
  };

  const handleSaveQrisString = async () => {
    if (!qrisString.trim()) {
      toast.error('Tempel string QRIS terlebih dahulu.', { title: 'QRIS Kosong' });
      return;
    }
    setSavingQris(true);
    try {
      const res = await api.put('/owner/toko/qris', { qris_string: qrisString.trim() });
      const d = res?.data?.data || res?.data || {};
      setQrisStatus(d.qris_status || 'valid');
      setQrisInfo(d.qris_info || null);
      toast.success(d.pesan || 'QRIS berhasil disimpan & diaktifkan.', { title: 'QRIS Valid' });
    } catch (err) {
      setQrisStatus('invalid');
      setQrisInfo(null);
      toast.error(err.response?.data?.pesan || err.message, { title: 'QRIS Tidak Valid' });
    } finally {
      setSavingQris(false);
    }
  };

  const handleCreateKasir = async (e) => {
    e.preventDefault();
    if (!kasirForm.nama || !kasirForm.email || !kasirForm.password) return;
    try {
      setIsSubmitting(true);
      await api.post('/owner/pengguna', kasirForm);
      toast.success(`Akun kasir untuk ${kasirForm.nama} (${kasirForm.email}) telah berhasil didaftarkan.`, { title: 'Kasir Berhasil Dibuat!' });
      setIsModalOpen(false);
      setKasirForm({ nama: '', email: '', password: '' });
      fetchKasirList();
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Membuat Kasir' });
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
      toast.info(`Akun kasir ${kasir.nama} telah ${nextStatus ? 'diaktifkan kembali' : 'dinonaktifkan'}.`, { title: 'Status Diperbarui' });
      setConfirmToggle({ isOpen: false, kasir: null });
      fetchKasirList();
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Mengubah Status' });
    }
  };

  const executeDeleteKasir = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/owner/pengguna/${confirmDelete.id}/permanen`);
      toast.success(`Akun kasir "${confirmDelete.nama}" berhasil dihapus secara permanen.`, { title: 'Kasir Dihapus!' });
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
      fetchKasirList();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Menghapus Kasir' });
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
    <div className="max-w-[430px] lg:max-w-none mx-auto space-y-4 lg:space-y-5 pb-24 lg:pb-8 text-[#10233E]">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-[20px] lg:rounded-[22px] p-4 lg:p-6 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[62%] lg:max-w-[58%]">
          <p className="text-[10px] font-normal text-[#68758A]">Dashboard &gt; Pengaturan</p>
          <h1 className="text-base lg:text-xl font-semibold leading-6 lg:leading-7 mt-1">Pengaturan</h1>
          <p className="text-[10px] lg:text-xs font-normal text-[#68758A] leading-4 mt-1">Kelola informasi toko, metode pembayaran, dan keamanan akun Anda.</p>
        </div>
        <img src="/assets/tokiva-dashboard/img-settings-3d.png" alt="Pengaturan 3D" className="absolute right-0 bottom-0 w-[42%] lg:w-[28%] h-[96%] object-contain object-right-bottom" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar overscroll-x-contain lg:hidden">
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

      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)] lg:gap-5 lg:items-start">

      {/* TAB: Profil & Toko */}
      <section className={cn(
        'rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-4 lg:col-span-1 lg:col-start-1 lg:row-start-1',
        activeTab === 'toko' ? 'block' : 'hidden lg:block'
      )}>
        {/* Section header */}
        <h2 className="flex text-sm lg:text-base font-medium leading-6 items-center gap-2"><Store className="w-4 h-4 text-[#0CAF60]" /> Informasi Toko</h2>
        <div className="lg:grid lg:grid-cols-[148px_minmax(0,1fr)] lg:gap-5 lg:items-start">

          {/* Foto Toko */}
          <div className="flex items-center gap-3 lg:block">
            <div className="w-14 h-14 lg:w-36 lg:h-36 rounded-2xl lg:rounded-[18px] bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0">
              {tokoServer?.logo_url ? <img src={tokoServer.logo_url} alt="Logo toko" className="w-full h-full object-cover" /> : (tokoData.nama || 'T')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 lg:mt-2">
              <p className="text-xs font-medium text-[#10233E] truncate lg:hidden">{tokoData.nama}</p>
              <button onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'} className="mt-1 lg:mt-0 flex items-center justify-center gap-1.5 lg:w-36 lg:px-2 lg:py-2 lg:border lg:border-gray-200 lg:rounded-xl text-[10px] font-medium text-[#0CAF60] hover:bg-[#E8FAF0] transition-colors">
                <Upload className="w-3 h-3" /> {uploading === 'logo' ? 'Mengunggah...' : 'Unggah Foto Toko'}
              </button>
              <p className="hidden lg:block text-[9px] text-[#68758A] text-center mt-1">JPG, PNG maks. 2MB</p>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
            </div>
          </div>

          <form onSubmit={handleSaveToko} className="space-y-3 text-xs lg:space-y-3.5">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
              <Input label="Nama Toko / Usaha" value={tokoData.nama} onChange={e => setTokoData({ ...tokoData, nama: e.target.value })} required />
              <Input label="No. WhatsApp / HP Toko" value={tokoData.noHp} onChange={e => setTokoData({ ...tokoData, noHp: e.target.value })} />
            </div>
            <Input label="Alamat Toko" value={tokoData.alamat} onChange={e => setTokoData({ ...tokoData, alamat: e.target.value })} />
            <Input label="Catatan Footer Struk" value={tokoData.footerStruk} onChange={e => setTokoData({ ...tokoData, footerStruk: e.target.value })} />
            <p className="hidden lg:block text-[10px] font-normal text-[#68758A]">Catatan ini akan tampil di bagian bawah struk.</p>
            <Button variant="primary" fullWidth size="lg" type="submit">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Profil Toko
            </Button>
          </form>
        </div>
      </section>

      {/* TAB: Kasir Staf — disembunyikan (role kasir dihapus, owner pegang POS). Kode dipertahankan untuk future use. */}
      <section
        data-hidden-feature="kasir-staf"
        className="hidden rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-3"
      >
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

      {/* TAB: Pembayaran — desktop: contents (item langsung grid utama), mobile: stack */}
      <div className={cn(
        'space-y-4',
        activeTab === 'pembayaran' ? 'block lg:contents' : 'hidden lg:contents'
      )}>
          {/* Tunai */}
          <section className="rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-3 lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm lg:text-base font-medium leading-5 flex items-center gap-2"><Banknote className="w-4 h-4 text-[#0CAF60]" /> Tunai</h2>
                <p className="text-[9px] font-normal text-[#68758A] mt-0.5">Pembayaran langsung di kasir.</p>
              </div>
              <Toggle value={payData.tunaiAktif} onChange={toggleTunai} />
            </div>
            {!payData.tunaiAktif && (
              <div className="rounded-xl bg-[#FFF8D9] p-2.5 text-[10px] font-normal text-[#B45309] leading-4">
                Tunai sedang nonaktif. Pelanggan hanya bisa membayar lewat QRIS.
              </div>
            )}
          </section>

          {/* QRIS */}
          <section className="rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-3 lg:col-start-2 lg:row-start-2 lg:self-start">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm lg:text-base font-medium leading-5 flex items-center gap-2"><QrCode className="w-4 h-4 text-[#0CAF60]" /> QRIS Toko</h2>
                <p className="text-[9px] font-normal text-[#68758A] mt-0.5">Pembayaran scan QRIS dinamis.</p>
              </div>
              <Toggle value={payData.qrisAktif} onChange={toggleQris} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
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

          {/* QRIS Dinamis */}
          <section className="rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-3 lg:col-span-2 lg:row-start-3 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-sm lg:text-base font-medium leading-5 flex items-center gap-2"><QrCode className="w-4 h-4 text-violet-600" /> QRIS Dinamis</h2>
              {qrisStatus === 'valid' ? (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#E8FAF0] text-[#087A4B]">✓ Valid</span>
              ) : qrisStatus === 'invalid' ? (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#D94850]">✕ Tidak Valid</span>
              ) : (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-[#68758A]">Belum Diatur</span>
              )}
            </div>
            <div>
              <label className="text-[10px] font-medium text-[#10233E] block mb-1.5">Foto Barcode QRIS</label>
              <button
                onClick={() => qrisInputRef.current?.click()}
                disabled={uploading === 'qris' || savingQris}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-[#E8FAF0] hover:border-[#0CAF60] transition-all text-[11px] font-medium text-[#68758A] active:scale-[0.98] disabled:opacity-50"
              >
                {uploading === 'qris' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading === 'qris' ? 'Membaca QRIS...' : savingQris ? 'Memvalidasi...' : 'Unggah Foto Barcode QRIS'}
              </button>
              <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleUploadQris} className="hidden" />
              <p className="text-[9px] font-normal text-[#68758A] mt-1.5 leading-4">
                Foto barcode QRIS dari toko Anda (dari penyedia QRIS). Sistem otomatis membaca, memeriksa kevalidannya, lalu memakainya untuk QR pembayaran berisi nominal di kasir.
              </p>
            </div>

            {(qrisString || qrisInfo) && (
              <div>
                <label className="text-[10px] font-medium text-[#10233E] block mb-1">Hasil Baca</label>
                <textarea
                  value={qrisString}
                  onChange={(e) => setQrisString(e.target.value)}
                  rows={3}
                  className="w-full text-[11px] font-mono px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0CAF60]/30 resize-none"
                />
              </div>
            )}
            {qrisInfo && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F8FAFB] p-2.5">
                <div>
                  <p className="text-[9px] font-normal text-[#68758A]">Nama Merchant</p>
                  <p className="text-[10px] font-medium text-[#10233E] truncate">{qrisInfo.merchant_name || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-normal text-[#68758A]">Kota</p>
                  <p className="text-[10px] font-medium text-[#10233E] truncate">{qrisInfo.merchant_city || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-normal text-[#68758A]">ID Merchant</p>
                  <p className="text-[10px] font-medium text-[#10233E] truncate">{qrisInfo.merchant_id || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-normal text-[#68758A]">Tipe</p>
                  <p className="text-[10px] font-medium text-[#10233E] capitalize">{qrisInfo.method === 'dynamic' ? 'Dinamis' : 'Statis'}</p>
                </div>
              </div>
            )}
            {qrisStatus === 'invalid' && (
              <div className="rounded-xl bg-[#FFF0F0] p-2.5 text-[10px] font-normal text-[#D94850] leading-4">
                Barcode QRIS tidak valid. Periksa kembali foto & pastikan itu barcode QRIS dari penyedia (GoPay/OVO/DANA/bank).
              </div>
            )}
          </section>

          <div className="space-y-2 lg:col-start-1 lg:row-start-4 lg:self-start">
            <button onClick={handleSavePembayaran} className="w-full py-3 bg-[#0CAF60] text-white rounded-xl text-[13px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Simpan Pengaturan Pembayaran
            </button>
            <p className="text-[9px] font-normal text-[#68758A] text-center leading-4">Metode yang OFF atau belum lengkap tidak akan muncul di halaman pembayaran kasir. Jika QRIS tidak diaktifkan, hanya Tunai yang tersedia.</p>
          </div>
      </div>

      {/* TAB: Keamanan */}
      <section className={cn(
        'rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-3 lg:col-span-1 lg:col-start-2 lg:row-start-1',
        activeTab === 'keamanan' ? 'block' : 'hidden lg:block'
      )}>
        <h2 className="text-sm lg:text-base lg:font-medium leading-5 flex items-center gap-2"><Lock className="w-4 h-4 text-[#0CAF60]" /> Ubah Kata Sandi Akun</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const passLama = e.target.password_lama.value;
              const passBaru = e.target.password_baru.value;
              const konfirmPass = e.target.konfirm_password.value;
              if (!passLama) return toast.error('Password lama wajib diisi!', { title: 'Validasi Gagal' });
              if (!passBaru || passBaru.length < 8) return toast.error('Password baru minimal harus 8 karakter!', { title: 'Validasi Gagal' });
              if (passBaru !== konfirmPass) return toast.error('Konfirmasi password baru tidak cocok!', { title: 'Validasi Gagal' });
              try {
                const res = await api.post('/auth/ganti-password', { old_password: passLama, new_password: passBaru });
                toast.success(res?.pesan || 'Password akun Anda berhasil diperbarui!', { title: 'Password Diperbarui!' });
                e.target.reset();
              } catch (err) {
                toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Ubah Password' });
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

      {/* TAB: Lainnya */}
      <section className={cn(
        'rounded-[18px] bg-white p-4 lg:p-5 shadow-sm border border-gray-50 space-y-2 lg:col-span-1 lg:col-start-2 lg:row-start-3 lg:self-start',
        activeTab === 'lainnya' ? 'block' : 'hidden lg:block'
      )}>
        <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><Info className="w-4 h-4 text-[#0CAF60]" /> Tentang Aplikasi</h2>
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Aplikasi</span><span className="font-medium text-[#10233E]">{APP_NAME}</span></div>
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Versi</span><span className="font-medium text-[#10233E]">1.0.0</span></div>
            <div className="flex justify-between"><span className="font-normal text-[#68758A]">Peran Akun</span><span className="font-medium text-[#10233E]">Owner</span></div>
          </div>
          <p className="text-[9px] font-normal text-[#68758A] leading-4 pt-1">Tokiva — Sistem Point of Sale berbasis website dengan identifikasi produk berbasis Computer Vision untuk UMKM toko kelontong.</p>
      </section>
      </div>

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
            if (!resetPass || resetPass.length < 6) return toast.error('Password baru minimal 6 karakter!', { title: 'Validasi Gagal' });
            if (resetPass !== resetKonfirm) return toast.error('Konfirmasi password tidak cocok!', { title: 'Validasi Gagal' });
            setIsResetting(true);
            try {
              await api.put(`/owner/pengguna/${resetKasir.id}`, { password: resetPass });
              toast.success(`Password akun kasir "${resetKasir.nama}" telah berhasil diubah.`, { title: 'Password Kasir Diperbarui!' });
              setResetKasir({ isOpen: false, id: null, nama: '' });
              setResetPass('');
              setResetKonfirm('');
            } catch (err) {
              toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Ubah Password' });
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


    </div>
  );
}
