'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { getTf } from '@/lib/tf';
import { toast } from '@/components/ui/ToastProvider';

/**
 * useAiScanner — kapsulkan seluruh logika AI visual / camera / barcode scan
 * yang sebelumnya hidup di pos-engine.jsx.
 *
 * Deps (wajib di-pass dari screen):
 *   produkList, tfModel, modelInfo, classLabels, modelMapping, addToCart,
 *   fetchActiveModel, isModelLoading
 *
 * Semua state + handler punya nama identik dengan yang dipakai pos-engine.jsx
 * sehingga wiring ke screen tidak perlu ganti nama.
 */
export function useAiScanner({
  produkList,
  tfModel,
  modelInfo,
  classLabels,
  modelMapping,
  addToCart,
  fetchActiveModel,
  isModelLoading,
}) {
  // Modals scanner (internal — camera effect bergantung padanya)
  const [showAiScan, setShowAiScan] = useState(false);
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);
  const [showAiCandidates, setShowAiCandidates] = useState(false);

  // AI & Barcode scanning state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedProduk, setDetectedProduk] = useState(null);
  const [scannedBarcodeCode, setScannedBarcodeCode] = useState('');
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(null);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [aiCandidates, setAiCandidates] = useState([]);
  const [lastPredictionsMetadata, setLastPredictionsMetadata] = useState(null);

  const videoRef = useRef(null);
  const lastSnapshotRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isCooldownRef = useRef(false);

  const showFeedback = useCallback((type, title, message) => toast[type](message, { title }), []);

  const captureCameraFrame = () => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const getProductByClassSlug = useCallback((slug) => {
    if (!slug) return null;
    const s = slug.toLowerCase().replace(/-/g, ' ');

    // 1. Try barcode mapping
    const mapping = modelMapping.find(m => m.class_slug?.toLowerCase() === slug?.toLowerCase());
    if (mapping) {
      const byBarcode = produkList.find(p => p.barcode === mapping.barcode);
      if (byBarcode) return byBarcode;
    }

    // 2. Fallback: match by product name (slug words)
    const byName = produkList.find(p => {
      const pname = (p.nama || '').toLowerCase();
      const words = s.split(' ');
      return words.some(w => w.length > 2 && pname.includes(w));
    });
    if (byName) return byName;

    return null;
  }, [produkList, modelMapping]);

  const handleDetectedBarcode = useCallback((code) => {
    if (!code) return;
    setScannedBarcodeCode(code);
    setBarcodeNotFound(false);
    const found = produkList.find(p => p.barcode === code || p.id === code);
    if (found) {
      const added = addToCart(found);
      if (!added) {
        toast.info(`${found.nama} sudah di keranjang. Tambah qty manual.`, { title: 'Sudah di Keranjang' });
      }
      setTimeout(() => {
        setShowBarcodeScan(false);
        setScannedBarcodeCode('');
        setManualBarcode('');
      }, 700);
    } else {
      setBarcodeNotFound(true);
      setManualBarcode(code);
    }
  }, [produkList, addToCart]);

  const handleManualBarcodeSubmit = useCallback((e) => {
    e?.preventDefault?.();
    const code = (manualBarcode || '').trim();
    if (!code) return;
    handleDetectedBarcode(code);
  }, [manualBarcode, handleDetectedBarcode]);

  // Live Camera & Web BarcodeDetector Loop
  useEffect(() => {
    let stream = null;
    let barcodeTimer = null;

    if (showAiScan || showBarcodeScan) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        }).then(s => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        }).catch(err => {
          console.warn('Camera access denied or unmounted:', err);
          setCameraActive(false);
        });
      }

      if (typeof window !== 'undefined') {
        setBarcodeDetectorSupported('BarcodeDetector' in window);
      }

      if (showBarcodeScan && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        barcodeTimer = setInterval(() => {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });
          if (videoRef.current && videoRef.current.readyState === 4) {
            detector.detect(videoRef.current).then(results => {
              if (results.length > 0) {
                handleDetectedBarcode(results[0].rawValue);
              }
            }).catch(() => {});
          }
        }, 400);
      }
    }

    return () => {
      if (barcodeTimer) clearInterval(barcodeTimer);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    };
  }, [showAiScan, showBarcodeScan, handleDetectedBarcode]);

  // Real-time AI Continuous Inference Loop (350ms)
  useEffect(() => {
    let aiLoopTimer = null;

    if (showAiScan && cameraActive && tfModel) {
      isCooldownRef.current = false;
      isLoopRunningRef.current = false;

      aiLoopTimer = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (isLoopRunningRef.current || isCooldownRef.current) return;

        try {
          isLoopRunningRef.current = true;

          const tf = await getTf();

          const snapshot = captureCameraFrame();
          if (snapshot) lastSnapshotRef.current = snapshot;

          const video = videoRef.current;
          const tensor = tf.tidy(() => {
            const raw = tf.browser.fromPixels(video);
            const resized = tf.image.resizeBilinear(raw, [224, 224]);
            return resized.toFloat().expandDims(0);
          });

          const output = tfModel.predict(tensor);
          const probs = await output.data();
          tensor.dispose();
          output.dispose();

          const threshold = Number(modelInfo?.confidence_threshold || 0.65);
          const predictions = Array.from(probs)
            .map((score, i) => ({ label: classLabels[i] || `Class ${i}`, score }))
            .sort((a, b) => b.score - a.score);

          if (predictions.length > 0) {
            const topPrediction = predictions[0];

            // Case A: High Confidence Match (>= Threshold) -> Auto Add & 1.2s Cooldown
            if (topPrediction.score >= threshold) {
              const matchedProduct = getProductByClassSlug(topPrediction.label);
              if (matchedProduct) {
                isCooldownRef.current = true;
                setDetectedProduk({
                  ...matchedProduct,
                  confidence: Math.round(topPrediction.score * 100)
                });
                setAiCandidates([]);

                const added = addToCart(matchedProduct);
                if (!added) {
                  toast.info(`${matchedProduct.nama} sudah di keranjang. Tambah qty manual.`, { title: 'Sudah di Keranjang' });
                }

                const snap = lastSnapshotRef.current;
                if (snap) {
                  api.post('/kasir/ai/koreksi', {
                    foto_base64: snap,
                    prediksi_1_produk_id: matchedProduct.id,
                    prediksi_1_confidence: topPrediction.score,
                    produk_dipilih_id: matchedProduct.id,
                    is_correct: true,
                  }).catch(() => {});
                  toast.success('Koreksi tersimpan! Admin akan review untuk training AI.', { title: 'Koreksi Tersimpan' });
                }

                setTimeout(() => {
                  setDetectedProduk(null);
                  isCooldownRef.current = false;
                }, 1200);
              }
            }
            // Case B: Ambiguous / Low Confidence (0.25 <= score < Threshold) -> Candidates Banner
            else if (topPrediction.score >= 0.25) {
              isCooldownRef.current = true;

              const candidates = [];
              const metadata = {
                pred_1_prod_id: null, pred_1_conf: 0,
                pred_2_prod_id: null, pred_2_conf: 0,
                pred_3_prod_id: null, pred_3_conf: 0,
              };

              for (let i = 0; i < Math.min(3, predictions.length); i++) {
                const pred = predictions[i];
                const prod = getProductByClassSlug(pred.label);
                if (prod) {
                  candidates.push({ ...prod, match: Math.round(pred.score * 100) });

                  if (i === 0) {
                    metadata.pred_1_prod_id = prod.id;
                    metadata.pred_1_conf = Number(pred.score.toFixed(4));
                  } else if (i === 1) {
                    metadata.pred_2_prod_id = prod.id;
                    metadata.pred_2_conf = Number(pred.score.toFixed(4));
                  } else if (i === 2) {
                    metadata.pred_3_prod_id = prod.id;
                    metadata.pred_3_conf = Number(pred.score.toFixed(4));
                  }
                }
              }

              if (candidates.length > 0) {
                setLastPredictionsMetadata(metadata);
                setAiCandidates(candidates);

                setTimeout(() => {
                  isCooldownRef.current = false;
                }, 1500);
              } else {
                isCooldownRef.current = false;
              }
            }
          }
        } catch (err) {
          console.warn('Real-time AI loop error:', err);
        } finally {
          isLoopRunningRef.current = false;
        }
      }, 350);
    }

    return () => {
      if (aiLoopTimer) clearInterval(aiLoopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiScan, cameraActive, tfModel, classLabels, modelMapping, produkList]);

  /* ── AI Scan flow ── */
  const handleOpenAiScan = useCallback(() => {
    setShowAiScan(true);
    setDetectedProduk(null);
    setIsDetecting(false);
    if (!tfModel && !isModelLoading) {
      fetchActiveModel();
    }
  }, [tfModel, isModelLoading, fetchActiveModel]);

  const handleCaptureSnapshot = useCallback(async () => {
    if (!videoRef.current) return;
    isCooldownRef.current = false;
    setAiCandidates([]);
    setDetectedProduk(null);
    setIsDetecting(true);

    const snapshot = captureCameraFrame();
    if (snapshot) lastSnapshotRef.current = snapshot;

    if (!tfModel) {
      setTimeout(() => {
        setIsDetecting(false);
        showFeedback('info', 'Model Belum Siap', 'Model AI sedang memuat atau tidak aktif. Silakan gunakan Scan Barcode atau Cari Manual.');
      }, 500);
      return;
    }

    try {
      const tf = await getTf();
      const video = videoRef.current;

      const tensor = tf.tidy(() => {
        const raw = tf.browser.fromPixels(video);
        const resized = tf.image.resizeBilinear(raw, [224, 224]);
        return resized.toFloat().expandDims(0);
      });

      const output = tfModel.predict(tensor);
      const probs = await output.data();
      tensor.dispose();
      output.dispose();

      setIsDetecting(false);

      const threshold = Number(modelInfo?.confidence_threshold || 0.65);
      const predictions = Array.from(probs)
        .map((score, i) => ({ label: classLabels[i] || `Class ${i}`, score }))
        .sort((a, b) => b.score - a.score);

      if (predictions.length === 0) {
        showFeedback('info', 'Tidak Terdeteksi', 'Gagal mendeteksi objek. Silakan gunakan Scan Barcode atau Cari Manual.');
        return;
      }

      const topPrediction = predictions[0];

      // 4. Confidence >= threshold and product exists
      if (topPrediction.score >= threshold) {
        const matchedProduct = getProductByClassSlug(topPrediction.label);
        if (matchedProduct) {
          isCooldownRef.current = true;
          setDetectedProduk({
            ...matchedProduct,
            confidence: Math.round(topPrediction.score * 100)
          });
          addToCart(matchedProduct);
          setTimeout(() => {
            setDetectedProduk(null);
            isCooldownRef.current = false;
          }, 1500);
          return;
        }
      }

      // 5. Fallback: Map top 3 predictions to POS products for candidates list
      const candidates = [];
      const metadata = {
        pred_1_prod_id: null, pred_1_conf: 0,
        pred_2_prod_id: null, pred_2_conf: 0,
        pred_3_prod_id: null, pred_3_conf: 0,
      };

      for (let i = 0; i < Math.min(3, predictions.length); i++) {
        const pred = predictions[i];
        const prod = getProductByClassSlug(pred.label);
        if (prod) {
          candidates.push({ ...prod, match: Math.round(pred.score * 100) });

          if (i === 0) {
            metadata.pred_1_prod_id = prod.id;
            metadata.pred_1_conf = Number(pred.score.toFixed(4));
          } else if (i === 1) {
            metadata.pred_2_prod_id = prod.id;
            metadata.pred_2_conf = Number(pred.score.toFixed(4));
          } else if (i === 2) {
            metadata.pred_3_prod_id = prod.id;
            metadata.pred_3_conf = Number(pred.score.toFixed(4));
          }
        }
      }

      setLastPredictionsMetadata(metadata);

      if (candidates.length > 0) {
        setAiCandidates(candidates);
        isCooldownRef.current = true;
      } else {
        showFeedback('info', 'Produk Tidak Dikenali', 'Produk tidak dikenali dalam sistem. Silakan scan barcode atau cari manual.');
      }
    } catch (err) {
      console.error('Inference error:', err);
      setIsDetecting(false);
      showFeedback('error', 'Kesalahan Proses', 'Terjadi kesalahan saat memproses gambar.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tfModel, modelInfo, classLabels, getProductByClassSlug, addToCart, showFeedback]);

  const handleSelectCandidate = useCallback((produk) => {
    const added = addToCart(produk);
    if (!added) {
      toast.info(`${produk.nama} sudah di keranjang. Tambah qty manual.`, { title: 'Sudah di Keranjang' });
    }
    setAiCandidates([]);
    isCooldownRef.current = false;

    const snap = lastSnapshotRef.current;
    if (snap && lastPredictionsMetadata) {
      api.post('/kasir/ai/koreksi', {
        foto_base64: snap,
        prediksi_1_produk_id: lastPredictionsMetadata.pred_1_prod_id,
        prediksi_1_confidence: lastPredictionsMetadata.pred_1_conf,
        prediksi_2_produk_id: lastPredictionsMetadata.pred_2_prod_id,
        prediksi_2_confidence: lastPredictionsMetadata.pred_2_conf,
        prediksi_3_produk_id: lastPredictionsMetadata.pred_3_prod_id,
        prediksi_3_confidence: lastPredictionsMetadata.pred_3_conf,
        produk_dipilih_id: produk.id,
        is_correct: false,
      }).catch((e) => console.warn('Gagal menyimpan evaluasi koreksi:', e));
      toast.success('Koreksi tersimpan! Admin akan review untuk training AI.', { title: 'Koreksi Tersimpan' });
    }
  }, [addToCart, lastPredictionsMetadata]);

  return {
    // modals
    showAiScan, setShowAiScan,
    showBarcodeScan, setShowBarcodeScan,
    showAiCandidates, setShowAiCandidates,
    // scanner state
    isDetecting, setIsDetecting,
    detectedProduk, setDetectedProduk,
    scannedBarcodeCode, setScannedBarcodeCode,
    barcodeDetectorSupported, setBarcodeDetectorSupported,
    barcodeNotFound, setBarcodeNotFound,
    manualBarcode, setManualBarcode,
    cameraActive, setCameraActive,
    aiCandidates, setAiCandidates,
    lastPredictionsMetadata, setLastPredictionsMetadata,
    // refs & helpers
    videoRef,
    captureCameraFrame,
    getProductByClassSlug,
    // handlers
    handleDetectedBarcode,
    handleManualBarcodeSubmit,
    handleOpenAiScan,
    handleCaptureSnapshot,
    handleSelectCandidate,
  };
}
