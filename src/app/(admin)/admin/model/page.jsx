'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import { api } from '@/lib/api';

import {
  Cpu, UploadCloud, Layers, CheckCircle2, FlaskConical, Inbox,
  ChevronLeft, ChevronRight, HardDrive, FileArchive, FileCode, Globe,
  Trash2, X,
} from 'lucide-react';

import useTfjsModel from './_hooks/useTfjsModel';
import useWebcam from './_hooks/useWebcam';
import ModelBanner from './_components/ModelBanner';
import TestingSandbox from './_components/TestingSandbox';
import TrainingPanel from './_components/TrainingPanel';
import ModelDetailModal from './_components/ModelDetailModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminModelPage() {
  // --- Data State ---
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [testingModel, setTestingModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Feedback modal state (replaces native alert())
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });

  // --- TFJS Hook ---
  const { model: loadedTfModel, classes, loading: isModelLoading, error: modelLoadError, loadModel, predict } = useTfjsModel();

  // --- Threshold ---
  const [threshold, setThreshold] = useState(0.65);

  // --- Prediction ---
  const [predictionResult, setPredictionResult] = useState(null);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [testImagePreview, setTestImagePreview] = useState(null);

  // --- Register Modal ---
  const [isRegisterModal, setIsRegisterModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('direct_file');
  const [versi, setVersi] = useState('');
  const [namaModel, setNamaModel] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [akurasi, setAkurasi] = useState('96.8');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedZipFile, setSelectedZipFile] = useState(null);
  const [uploadedFileSizeMb, setUploadedFileSizeMb] = useState('0');
  const [modelJsonUrl, setModelJsonUrl] = useState('');
  const [weightsUrl, setWeightsUrl] = useState('');

  // --- Confirm Modals ---
  const [deployModelTarget, setDeployModelTarget] = useState(null);
  const [versiOverride, setVersiOverride] = useState('');
  const [deleteModelTarget, setDeleteModelTarget] = useState(null);
  const [detailModel, setDetailModel] = useState(null);

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- Token helper ---
  const getToken = () => localStorage.getItem('tokiva_admin_token') || localStorage.getItem('tokiva_jwt_token');

  // --- Webcam inference callback ---
  const handleFrame = useCallback(async (videoEl) => {
    const result = await predict(videoEl);
    if (result) {
      const top = result.predictions[0];
      setPredictionResult({
        isDetected: top.score >= threshold,
        topLabel: top.score >= threshold ? top.label : 'Tidak ada produk terdeteksi',
        topConfidence: top.score,
        topClasses: result.predictions.slice(0, 3),
      });
      setInferenceMs(result.ms);
    }
  }, [predict, threshold]);

  const webcam = useWebcam(handleFrame, (msg) => showFeedback('error', 'Gagal Akses Kamera', msg));

  // --- Fetch initial data ---
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const modelRes = await api.get('/admin/model', { headers: { Authorization: `Bearer ${token}` } });

      if (modelRes?.berhasil && Array.isArray(modelRes.data)) {
        setModels(modelRes.data);
        const act = modelRes.data.find((m) => m.status === 'aktif') || modelRes.data[0] || null;
        if (act) {
          setActiveModel(act);
          setTestingModel(act);
          setThreshold(act.confidence_threshold || 0.65);
          loadModel(act.model_json_url);
        } else {
          setActiveModel(null);
          setTestingModel(null);
        }
      } else {
        setModels([]);
        setActiveModel(null);
        setTestingModel(null);
      }
    } catch {
      setModels([]);
      setActiveModel(null);
      setTestingModel(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  // --- Select model for sandbox ---
  const handleSelectModelForTesting = (m) => {
    setTestingModel(m);
    setThreshold(m.confidence_threshold || 0.65);
    setPredictionResult(null);
    loadModel(m.model_json_url);
  };

  // --- Webcam toggle ---
  const handleToggleWebcam = () => {
    if (webcam.active) {
      webcam.stop();
      setPredictionResult(null);
    } else {
      webcam.start();
    }
  };

  // --- Upload test image ---
  const handleFileUploadTest = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTestImagePreview(url);
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      const result = await predict(img);
      if (result) {
        const top = result.predictions[0];
        setPredictionResult({
          isDetected: top.score >= threshold,
          topLabel: top.score >= threshold ? top.label : 'Tidak ada produk terdeteksi',
          topConfidence: top.score,
          topClasses: result.predictions.slice(0, 3),
        });
        setInferenceMs(result.ms);
      }
    };
  };

  // --- Save threshold ---
  const handleSaveThreshold = async () => {
    if (!activeModel) return;
    try {
      await api.put(`/admin/model/${activeModel.id}/threshold`, { confidence_threshold: threshold }, { headers: { Authorization: `Bearer ${getToken()}` } });
      showFeedback('success', 'Threshold Disimpan', `Confidence threshold berhasil diperbarui ke ${(threshold * 100).toFixed(0)}%!`);
    } catch (err) {
      showFeedback('error', 'Gagal Simpan Threshold', err.response?.data?.pesan || err.message);
    }
  };

  // --- Deploy to POS ---
  const handleDeployToPOS = async () => {
    if (!deployModelTarget) return;
    try {
      const body = {};
      if (versiOverride.trim()) body.versi_override = versiOverride.trim();
      await api.put(`/admin/model/${deployModelTarget.id}/aktifkan`, body, { headers: { Authorization: `Bearer ${getToken()}` } });
      showFeedback('success', 'Deploy Berhasil', `Model ${deployModelTarget.versi} BERHASIL DITERAPKAN KE SELURUH SISTEM POS! 🚀`);
    } catch (err) {
      showFeedback('error', 'Gagal Deploy', err.response?.data?.pesan || err.message);
    }
    setDeployModelTarget(null);
    setVersiOverride('');
    fetchInitialData();
  };

  // --- Delete model ---
  const handleDeleteModel = async () => {
    if (!deleteModelTarget) return;
    try {
      await api.delete(`/admin/model/${deleteModelTarget.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      showFeedback('success', 'Model Dihapus', `Model ${deleteModelTarget.versi} berhasil dihapus dari database!`);
    } catch (err) {
      showFeedback('error', 'Gagal Hapus Model', err.response?.data?.pesan || err.message);
    }
    setDeleteModelTarget(null);
    fetchInitialData();
  };

  // --- Register model ---
  const handleRegisterModel = async (e) => {
    e.preventDefault();
    if (!versi || !namaModel) return showFeedback('info', 'Perhatian', 'Versi dan Nama Model wajib diisi');
    try {
      const token = getToken();
      if ((uploadMethod === 'direct_file' && selectedFiles.length > 0) || (uploadMethod === 'zip' && selectedZipFile)) {
        const formData = new FormData();
        formData.append('versi', versi);
        formData.append('nama', namaModel);
        formData.append('deskripsi', deskripsi);
        formData.append('akurasi', akurasi);
        if (uploadMethod === 'zip' && selectedZipFile) {
          formData.append('file', selectedZipFile);
        } else {
          selectedFiles.forEach((f) => formData.append('file', f));
        }
        await api.post('/admin/model/upload-tfjs', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        showFeedback('success', 'Upload Berhasil', `Model ${versi} berhasil diunggah & disinkronkan! 🎉`);
      } else {
        await api.post('/admin/model', {
          versi, nama: namaModel, deskripsi,
          akurasi: parseFloat(akurasi) / 100,
          ukuran_mb: parseFloat(uploadedFileSizeMb),
          model_json_url: modelJsonUrl, weights_url: weightsUrl,
          confidence_threshold: threshold,
        }, { headers: { Authorization: `Bearer ${token}` } });
        showFeedback('success', 'Model Terdaftar', `Model ${versi} berhasil terdaftar di database!`);
      }
      setIsRegisterModal(false);
      setIsRegisterModal(false);
      fetchInitialData();
    } catch (err) {
      showFeedback('error', 'Gagal Mendaftarkan Model', err.response?.data?.pesan || err.message);
      setIsRegisterModal(false);
    }
  };

  const handleDirectFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const mb = (files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1);
    setUploadedFileSizeMb(mb > 0 ? mb : '0');
  };

  const handleZipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedZipFile(file);
      setUploadedFileSizeMb((file.size / (1024 * 1024)).toFixed(1));
    }
  };

  // --- Pagination ---
  const totalPages = Math.ceil(models.length / itemsPerPage) || 1;
  const currentModels = models.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="AI Model Deployment & Testing Sandbox">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> AI Model Deployment & MLOps Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Pengujian Realtime TFJS Model • <strong>{classes.length} Class Labels Loaded</strong>
            </p>
          </div>
          <button onClick={() => setIsRegisterModal(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20">
            <UploadCloud className="w-4 h-4" /> Upload Model TFJS / ZIP
          </button>
        </div>

        {/* Banner */}
        <ModelBanner
          model={activeModel} classes={classes} threshold={threshold} setThreshold={setThreshold}
          onSaveThreshold={handleSaveThreshold} inferenceMs={inferenceMs}
          modelLoaded={!!loadedTfModel} modelLoading={isModelLoading}
          onRegister={() => setIsRegisterModal(true)}
        />

        {/* Training Pipeline (Kaggle) */}
        <TrainingPanel onTrainingComplete={fetchInitialData} />

        {/* Testing Sandbox */}
        <TestingSandbox
          testingModel={testingModel} videoRef={webcam.videoRef}
          webcamActive={webcam.active} onToggleWebcam={handleToggleWebcam}
          prediction={predictionResult} threshold={threshold} inferenceMs={inferenceMs}
          onFileUpload={handleFileUploadTest} testImagePreview={testImagePreview}
        />

        {/* Model Registry Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Registri Versi Model AI
            </h3>
            <p className="text-xs text-slate-400">Pilih model untuk diuji di Sandbox atau terapkan secara live ke POS</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Versi Model & Arsitektur</th>
                  <th className="px-6 py-4">Val Accuracy</th>
                  <th className="px-6 py-4">Threshold</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-2xl shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-2.5 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-14" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-xl" /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="h-7 w-16 rounded-xl" />
                          <Skeleton className="h-7 w-20 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : models.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Belum Ada Model AI Terdaftar</p>
                  </td></tr>
                ) : currentModels.map((m) => {
                  const isAktif = m.status === 'aktif';
                  const isTesting = testingModel?.id === m.id;
                  return (
                    <tr key={m.id} onClick={() => setDetailModel(m)} className={`transition-colors cursor-pointer ${isTesting ? 'bg-emerald-500/5' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${isTesting ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-100">{m.nama || m.versi}</p>
                              {isTesting && <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">SANDBOX</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">Versi: {m.versi} • {m.ukuran_mb || 0} MB</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{((m.akurasi || 0) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 font-mono text-slate-300">{((m.confidence_threshold || 0.65) * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4">
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-[11px] font-semibold border border-slate-700/50">STAGING</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleSelectModelForTesting(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${isTesting ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                            <FlaskConical className="w-3.5 h-3.5" /> Uji
                          </button>
                          {!isAktif && (
                            <>
                              <button onClick={() => setDeployModelTarget(m)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20">
                                🚀 Deploy
                              </button>
                              <button onClick={() => setDeleteModelTarget(m)} title="Hapus"
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
              <span>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, models.length)} dari {models.length}</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-bold text-slate-200 px-3">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Model */}
      {isRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Upload / Register Model TFJS</h3>
              <button onClick={() => setIsRegisterModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {[
                { key: 'direct_file', icon: HardDrive, label: 'Upload File' },
                { key: 'zip', icon: FileArchive, label: 'Upload ZIP' },
                { key: 'url', icon: Globe, label: 'Remote URL' },
              ].map(({ key, icon: Icon, label }) => (
                <button key={key} type="button" onClick={() => setUploadMethod(key)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${uploadMethod === key ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRegisterModel} className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Versi Model Tag</label>
                <input type="text" required value={versi} onChange={(e) => setVersi(e.target.value)} placeholder="v2.0-mobilenetv3-cbam"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Model</label>
                <input type="text" required value={namaModel} onChange={(e) => setNamaModel(e.target.value)} placeholder="MobileNetV3Large + CBAM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Val Accuracy (%)</label>
                  <input type="number" step="0.1" value={akurasi} onChange={(e) => setAkurasi(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ukuran (MB)</label>
                  <input type="text" value={uploadedFileSizeMb} onChange={(e) => setUploadedFileSizeMb(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              </div>

              {uploadMethod === 'direct_file' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2 relative hover:border-emerald-500 cursor-pointer">
                  <FileCode className="w-8 h-8 text-emerald-400 mx-auto" />
                  {selectedFiles.length > 0 ? (
                    <p className="text-xs font-bold text-emerald-400 font-mono">{selectedFiles.length} File ({uploadedFileSizeMb} MB)</p>
                  ) : (
                    <p className="text-xs font-bold text-slate-200">Klik / Drag file model.json & .bin</p>
                  )}
                  <input type="file" multiple onChange={handleDirectFilesChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}

              {uploadMethod === 'zip' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2 relative hover:border-emerald-500 cursor-pointer">
                  <FileArchive className="w-8 h-8 text-emerald-400 mx-auto" />
                  {selectedZipFile ? (
                    <p className="text-xs font-bold text-emerald-400 font-mono">{selectedZipFile.name} ({uploadedFileSizeMb} MB)</p>
                  ) : (
                    <p className="text-xs font-bold text-slate-200">Klik / Drag file .ZIP bundle model</p>
                  )}
                  <input type="file" accept=".zip,.rar,.tar.gz" onChange={handleZipFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}

              {uploadMethod === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">URL model.json</label>
                    <input type="url" value={modelJsonUrl} onChange={(e) => setModelJsonUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">URL weights (.bin)</label>
                    <input type="url" value={weightsUrl} onChange={(e) => setWeightsUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsRegisterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20">Upload & Sinkronkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail Model (klik row) */}
      <ModelDetailModal model={detailModel} onClose={() => setDetailModel(null)} />

      {/* Modal: Deploy */}
      {deployModelTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Konfirmasi Deploy ke Sistem POS</h3>
            <p className="text-xs text-slate-400">
              Terapkan <strong className="text-slate-200">{deployModelTarget.nama} ({deployModelTarget.versi})</strong> secara live ke seluruh kasir?
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Override Versi (opsional)</label>
              <input
                type="text"
                value={versiOverride}
                onChange={(e) => setVersiOverride(e.target.value)}
                placeholder={`Auto: ${deployModelTarget.versi} — kosongkan untuk default`}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Contoh: v2 (major bump), v1.2 (minor update). Format: v{major}.{minor}.{tanggal}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setDeployModelTarget(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
              <button onClick={handleDeployToPOS} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20">Ya, Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete */}
      {deleteModelTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Hapus Model</h3>
            <p className="text-xs text-slate-400">
              Hapus <strong className="text-slate-200">{deleteModelTarget.nama} ({deleteModelTarget.versi})</strong> dari database?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setDeleteModelTarget(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
              <button onClick={handleDeleteModel} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
      {/* Feedback Modal (replaces native alert) */}
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
