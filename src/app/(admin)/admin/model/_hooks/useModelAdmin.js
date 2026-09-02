'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/ToastProvider';
import useTfjsModel from './useTfjsModel';
import useWebcam from './useWebcam';

/**
 * useModelAdmin — SEMUA state + fetch + action halaman Admin Model.
 * Pindahan murni dari admin/model/page.jsx (zero logic change).
 */
export function useModelAdmin() {
  // --- Data State ---
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [testingModel, setTestingModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const showFeedback = (type, title, message) => toast[type](message, { title });

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
      const modelRes = await api.get('/admin/model');

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
      await api.put(`/admin/model/${activeModel.id}/threshold`, { confidence_threshold: threshold });
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
      await api.put(`/admin/model/${deployModelTarget.id}/aktifkan`, body);
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
      await api.delete(`/admin/model/${deleteModelTarget.id}`);
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
        await api.post('/admin/model/upload-tfjs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        showFeedback('success', 'Upload Berhasil', `Model ${versi} berhasil diunggah & disinkronkan! 🎉`);
      } else {
        await api.post('/admin/model', {
          versi, nama: namaModel, deskripsi,
          akurasi: parseFloat(akurasi) / 100,
          ukuran_mb: parseFloat(uploadedFileSizeMb),
          model_json_url: modelJsonUrl, weights_url: weightsUrl,
          confidence_threshold: threshold,
        });
        showFeedback('success', 'Model Terdaftar', `Model ${versi} berhasil terdaftar di database!`);
      }
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

  return {
    models, setModels, activeModel, testingModel, isLoading,
    loadedTfModel, classes, isModelLoading, modelLoadError,
    threshold, setThreshold,
    predictionResult, setPredictionResult, inferenceMs, testImagePreview,
    isRegisterModal, setIsRegisterModal, uploadMethod, setUploadMethod,
    versi, setVersi, namaModel, setNamaModel, deskripsi, setDeskripsi,
    akurasi, setAkurasi, selectedFiles, setSelectedFiles,
    selectedZipFile, setSelectedZipFile, uploadedFileSizeMb, setUploadedFileSizeMb,
    modelJsonUrl, setModelJsonUrl, weightsUrl, setWeightsUrl,
    deployModelTarget, setDeployModelTarget, versiOverride, setVersiOverride,
    deleteModelTarget, setDeleteModelTarget, detailModel, setDetailModel,
    currentPage, setCurrentPage, itemsPerPage, totalPages, currentModels,
    fetchInitialData, handleSelectModelForTesting, handleToggleWebcam,
    handleFileUploadTest, handleSaveThreshold, handleDeployToPOS,
    handleDeleteModel, handleRegisterModel, handleDirectFilesChange,
    handleZipFileChange, webcam, showFeedback,
  };
}
