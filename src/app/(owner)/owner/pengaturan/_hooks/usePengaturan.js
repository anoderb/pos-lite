'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/config';
import jsQR from 'jsqr';
import { toast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * usePengaturan — state & operasi halaman pengaturan (profil toko, QRIS,
 * kasir staf hidden, keamanan). Return nama identik dengan page lama.
 */
export function usePengaturan() {
  const { toko, setToko } = useAuthStore();
  const [activeTab, setActiveTab] = useState('toko');
  const [stafList, setStafList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tokoServer, setTokoServer] = useState(null);
  const [tokoData, setTokoData] = useState({
    nama: toko?.nama || APP_NAME,
    alamat: toko?.alamat || '',
    noHp: toko?.no_telp || '',
    footerStruk: toko?.catatan_footer || 'Terima kasih telah berbelanja!',
  });

  const [payData, setPayData] = useState({
    qrisAktif: false,
    tunaiAktif: true,
    merchantName: '',
    mid: '',
    merchantCity: '',
    method: '',
  });
  const [qrisPreview, setQrisPreview] = useState('');
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

  // QRIS string + status
  const [qrisString, setQrisString] = useState('');
  const [qrisInfo, setQrisInfo] = useState(null);
  const [qrisStatus, setQrisStatus] = useState('empty'); // empty | valid | invalid
  const [savingQris, setSavingQris] = useState(false);

  useEffect(() => {
    fetchKasirList();
    fetchToko();
    fetchQrisStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setQrisPreview(d.qris_url || '');
        setQrisInfo(d.qris_info || null);
        setPayData({
          qrisAktif: d.qris_aktif === true,
          tunaiAktif: d.tunai_aktif !== false,
          merchantName: d.qris_info?.merchant_name || '',
          mid: d.qris_info?.merchant_id || '',
          merchantCity: d.qris_info?.merchant_city || '',
          method: d.qris_info?.method || '',
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
      setQrisStatus('empty');
      setQrisInfo(null);

      if (!file.type.startsWith('image/')) {
        throw new Error('File QRIS harus berupa gambar.');
      }
      const previewUrl = await fileToDataUrl(file);
      setQrisPreview(previewUrl);

      const decoded = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Gambar QRIS tidak dapat dibuka.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return reject(new Error('Browser tidak mendukung pembacaan QR.'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
          if (!code?.data) return reject(new Error('QR tidak terbaca. Gunakan foto yang lebih jelas dan pastikan seluruh barcode terlihat.'));
          resolve(String(code.data).trim());
        };
        img.src = String(previewUrl);
      });

      setQrisString(decoded);
      setSavingQris(true);
      try {
        const res = await api.put('/owner/toko/qris', { qris_string: decoded });
        const d = res?.data?.data || res?.data || {};
        setQrisStatus(d.qris_status || 'valid');
        setQrisInfo(d.qris_info || null);
        setPayData((current) => ({
          ...current,
          merchantName: d.qris_info?.merchant_name || '',
          mid: d.qris_info?.merchant_id || '',
          merchantCity: d.qris_info?.merchant_city || '',
          method: d.qris_info?.method || '',
        }));

        try {
          const mediaRes = await api.post('/owner/toko/qris', { qris_url: previewUrl });
          const mediaData = mediaRes?.data || mediaRes || {};
          if (mediaData.qris_url) setQrisPreview(mediaData.qris_url);
        } catch {
          toast.info('QRIS valid, tetapi preview belum tersimpan ke server.', { title: 'Preview Belum Tersimpan' });
        }
        toast.success(d.pesan || 'QRIS berhasil dibaca dan diverifikasi.', { title: 'QRIS Valid' });
      } catch (err) {
        setQrisStatus('invalid');
        setQrisInfo(null);
        toast.error(err.response?.data?.pesan || err.message, { title: 'QRIS Tidak Valid' });
      } finally {
        setSavingQris(false);
      }
    } catch (err) {
      setQrisStatus('invalid');
      toast.error(err.message || 'Gagal membaca gambar QRIS.', { title: 'QR Tidak Terbaca' });
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
      });
      toast.success('Pengaturan pembayaran tersimpan.', { title: 'Berhasil!' });
      fetchToko();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Menyimpan' });
    }
  };

  const toggleTunai = (v) => {
    if (v === false && !payData.qrisAktif) {
      toast.error('Tunai tidak bisa dimatikan selama QRIS belum aktif. Aktifkan QRIS dahulu, atau biarkan Tunai menyala.', { title: 'Tunai Tidak Bisa Dimatikan' });
      return;
    }
    setPayData({ ...payData, tunaiAktif: v });
  };

  const toggleQris = (v) => {
    if (v === true && qrisStatus !== 'valid') {
      toast.error('QRIS tidak bisa diaktifkan karena belum ada QRIS yang valid. Upload foto QRIS toko terlebih dahulu.', { title: 'QRIS Belum Valid' });
      return;
    }
    if (v === false && !payData.tunaiAktif) {
      toast.error('QRIS tidak bisa dimatikan selama Tunai juga dimatikan. Minimal satu metode pembayaran harus aktif.', { title: 'Minimal 1 Metode Aktif' });
      return;
    }
    setPayData({ ...payData, qrisAktif: v });
  };

  const fetchQrisStatus = async () => {
    try {
      const res = await api.get('/owner/toko/qris/status');
      const d = res?.data?.data || res?.data || {};
      setQrisStatus(d.status || 'empty');
      setQrisInfo(d.info || null);
      if (d.qris_string) setQrisString(d.qris_string);
      setPayData((current) => ({
        ...current,
        merchantName: d.info?.merchant_name || current.merchantName || '',
        mid: d.info?.merchant_id || current.mid || '',
        merchantCity: d.info?.merchant_city || current.merchantCity || '',
        method: d.info?.method || current.method || '',
      }));
    } catch { /* default */ }
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

  const handleResetKasir = async (e) => {
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
  };

  return {
    activeTab, setActiveTab,
    stafList, setStafList,
    isLoading, setIsLoading,
    tokoServer, setTokoServer,
    tokoData, setTokoData,
    payData, setPayData,
    qrisPreview, setQrisPreview,
    uploading, setUploading,
    logoInputRef, qrisInputRef,
    isModalOpen, setIsModalOpen,
    isSubmitting, setIsSubmitting,
    kasirForm, setKasirForm,
    confirmDelete, setConfirmDelete,
    confirmToggle, setConfirmToggle,
    resetKasir, setResetKasir,
    resetPass, setResetPass,
    resetKonfirm, setResetKonfirm,
    isResetting, setIsResetting,
    qrisString, setQrisString,
    qrisInfo, setQrisInfo,
    qrisStatus, setQrisStatus,
    savingQris, setSavingQris,
    fetchToko, fetchKasirList, fetchQrisStatus,
    handleSaveToko, handleUploadLogo, handleUploadQris,
    handleSavePembayaran, toggleTunai, toggleQris,
    handleCreateKasir, toggleStatusKasir, executeToggleStatusKasir,
    executeDeleteKasir, handleResetKasir,
  };
}
