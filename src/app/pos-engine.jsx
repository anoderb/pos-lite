'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ScanBarcode,
  PenLine,
  Package,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Share2,
  Banknote,
  QrCode,
  Building2,
  User,
  UserPlus,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';
import { getTf } from '@/lib/tf';
import { cn, formatRupiah } from '@/lib/utils';
import { api, getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import FeedbackModal from '@/components/ui/FeedbackModal';

/* ─────────── Reusable Product Thumbnail ─────────── */
function ProdukThumb({ nama, img, className }) {
  if (img) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-gray-200 shrink-0 bg-gray-100', className)}>
        <img src={img} alt={nama} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = (nama || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={cn('bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#16A34A] font-bold text-xs select-none', className)}>
      {initials}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function KasirPosPage() {
  const [mounted, setMounted] = useState(false);
  const [produkList, setProdukList] = useState([]);
  const [pelangganList, setPelangganList] = useState([{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }]);
  const [search, setSearch] = useState('');

  const [scanMode, setScanMode] = useState('ai'); // 'ai' | 'barcode'

  // Cart
  const [cart, setCart] = useState([]);
  const [diskon, setDiskon] = useState(0);
  const [view, setView] = useState('home'); // 'home' | 'cart'

  // Modals
  const [showAiScan, setShowAiScan] = useState(false);
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);
  const [showAiCandidates, setShowAiCandidates] = useState(false);
  const [aiCandidates, setAiCandidates] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Payment
  const [metodeBayar, setMetodeBayar] = useState('cash');
  const [uangDiterima, setUangDiterima] = useState('');
  const [completedTx, setCompletedTx] = useState(null);

  // AI & Barcode scanning state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedProduk, setDetectedProduk] = useState(null);
  const [scannedBarcodeCode, setScannedBarcodeCode] = useState('');
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(null); // null=cek, true/false
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [koreksiToast, setKoreksiToast] = useState(false);
  const [alreadyInCartToast, setAlreadyInCartToast] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Video Ref for HTML5 Camera
  const videoRef = useRef(null);

  // TFJS Model & Mapping States
  const [modelInfo, setModelInfo] = useState(null);
  const [modelMapping, setModelMapping] = useState([]);
  const [tfModel, setTfModel] = useState(null);
  const [modelError, setModelError] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Active Shift State (DEEP-03)
  const [shift, setShift] = useState(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);
  const [modalAwal, setModalAwal] = useState('');

  // Feedback modal state (replaces native alert())
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });

  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    fetchProduk();
    fetchPelanggan();
    fetchActiveModel();
    fetchShift();
    
  }, []);

  const fetchShift = async () => {
    try {
      setIsShiftLoading(true);
      const res = await api.get('/kasir/shift/aktif');
      const data = res?.data || res;
      if (data && data.id) setShift(data);
      else setShift(null);
    } catch {
      setShift(null);
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleBukaShift = async () => {
    try {
      const res = await api.post('/kasir/shift/buka', { modal_awal: Number(modalAwal) || 0 });
      const data = res?.data || res;
      if (data && data.id) {
        setShift(data);
        setModalAwal('');
      }
    } catch (err) {
      showFeedback('error', 'Gagal Buka Shift', err?.message || 'Coba lagi');
    }
  };

  const fetchActiveModel = async () => {
    setIsModelLoading(true);
    setModelError(null);
    try {
      const res = await api.get('/kasir/ai/active-model');
      if (res?.berhasil && res.data) {
        const { model, mappings } = res.data;
        setModelInfo(model);
        setModelMapping(mappings);

        const tf = await getTf();
        await tf.ready();

        // 1. Try loading from local IndexedDB cache for instant speed
        const cacheKey = `indexeddb://tokiva-model-${model.id || model.versi || 'v1'}`;
        let loadedModel = null;
        try {
          loadedModel = await tf.loadGraphModel(cacheKey + "-graph");
          console.log('⚡ Model AI berhasil dimuat dari IndexedDB local cache!');
        } catch {
          // 2. Download from remote Supabase bucket
          if (model.model_json_url) {
            // Dev-local rewrite: production host blocked by CORS from localhost origin.
            // Serve model from local backend when FE runs on localhost.
            let modelUrl = model.model_json_url;
            const apiOrigin = (() => {
              try { return new URL(getApiBaseUrl()).origin; } catch { return null; }
            })();
            if (apiOrigin && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              modelUrl = modelUrl.replace(/^https?:\/\/[^/]+/, apiOrigin);
            }
            console.log('📥 Mengunduh model AI:', modelUrl);
            loadedModel = await tf.loadGraphModel(modelUrl);
            // Save to IndexedDB cache
            try {
              await loadedModel.save(cacheKey + '-graph');
              console.log('💾 Model AI berhasil disimpan ke IndexedDB cache!');
            } catch (saveErr) {
              console.warn('Gagal menyimpan model ke IndexedDB cache:', saveErr);
            }
          }
        }

        if (loadedModel) {
          setTfModel(loadedModel);
        }

        // Fetch class labels from class.json (derived from model_json_url path)
        try {
          let modelDir = model.model_json_url.replace(/\/model\.json$/, '');
          const apiOrigin = (() => {
            try { return new URL(getApiBaseUrl()).origin; } catch { return null; }
          })();
          if (apiOrigin && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            modelDir = modelDir.replace(/^https?:\/\/[^/]+/, apiOrigin);
          }
          const resp = await fetch(modelDir + '/class.json');
          const classesJson = await resp.json();
          const labels = Array.isArray(classesJson)
            ? classesJson
            : Object.keys(classesJson).sort((a,b) => Number(a)-Number(b)).map(k => classesJson[k]);
          if (labels.length > 0) {
            setClassLabels(labels);
            console.log('📋 Class labels loaded:', labels.length);
          }
        } catch (e) {
          console.warn('Gagal memuat class labels:', e);
        }
      } else {
        setModelError(res?.pesan || 'Model AI aktif tidak ditemukan.');
      }
    } catch (err) {
      console.warn('Gagal memuat model AI aktif:', err.message);
      setModelError(err.message || 'Terjadi kesalahan saat mengunduh model AI.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const fetchProduk = async () => {
    try {
      const res = await api.get('/kasir/produk');
      const data = Array.isArray(res) ? res : (res?.data || []);
      if (data.length > 0) {
        const normalized = data.map(p => ({
          ...p,
          harga: Number(p.produk_satuan_jual?.[0]?.harga_ecer || p.hpp || 0),
        }));
        setProdukList(normalized);
      } else {
        setProdukList([]);
      }
    } catch {
      setProdukList([]);
    }
  };

  const fetchPelanggan = async () => {
    try {
      const res = await api.get('/kasir/pelanggan');
      const base = [{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }];
      if (res?.berhasil && Array.isArray(res.data)) {
        setPelangganList([...base, ...res.data]);
      } else {
        setPelangganList(base);
      }
    } catch {
      setPelangganList([{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }]);
    }
  };

  // Live Camera & Web BarcodeDetector / OCR Hook
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

      // Deteksi support BarcodeDetector sekali (Chrome desktop/Firefox: unsupported)
      if (typeof window !== 'undefined') {
        setBarcodeDetectorSupported('BarcodeDetector' in window);
      }

      // Barcode / OCR Detector Loop (hanya jalan kalau didukung)
      if (showBarcodeScan && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        barcodeTimer = setInterval(() => {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });
          if (videoRef.current && videoRef.current.readyState === 4) {
            detector.detect(videoRef.current).then(results => {
              if (results.length > 0) {
                const code = results[0].rawValue;
                handleDetectedBarcode(code);
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
  }, [showAiScan, showBarcodeScan]);

  const handleDetectedBarcode = (code) => {
    if (!code) return;
    setScannedBarcodeCode(code);
    setBarcodeNotFound(false);
    const found = produkList.find(p => p.barcode === code || p.id === code);
    if (found) {
      const added = addToCart(found);
      if (!added) {
        setAlreadyInCartToast({ nama: found.nama });
        setTimeout(() => setAlreadyInCartToast(null), 2500);
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
  };

  const handleManualBarcodeSubmit = async (e) => {
    e?.preventDefault?.();
    const code = (manualBarcode || '').trim();
    if (!code) return;
    handleDetectedBarcode(code);
  };

  // 🔊 Helper for POS Scanner Beep Sound (Web Audio API)
  const playBeepSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime); // 1800Hz POS Scanner Beep Pitch

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.085);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.085);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  /* ── Cart helpers ── */
  const addToCart = (produk) => {
    if (!produk || !produk.id) return false;
    // Blokir produk stok habis
    const maxStok = Number(produk.stok ?? 0);
    if (maxStok <= 0) {
      setFeedback({ isOpen: true, type: 'info', title: 'Stok Habis', message: `${produk.nama} sedang habis. Silakan restok dulu.` });
      return false;
    }
    let added = false;
    setCart((prevCart) => {
      const idx = prevCart.findIndex(i => i.id === produk.id);
      if (idx > -1) {
        // Sudah ada — jangan auto qty++, kasir manual
        added = false;
        return prevCart;
      }
      added = true;
      playBeepSound();
      return [{ ...produk, qty: 1 }, ...prevCart]; // prepend = terbaru di atas
    });
    return added;
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map(i => {
          if (i.id !== id) return i;
          const maxStok = Number(i.stok ?? 0);
          const nextQty = i.qty + delta;
          // Tidak boleh melebihi stok tersedia
          if (nextQty > maxStok) {
            setFeedback({ isOpen: true, type: 'info', title: 'Stok Tidak Mencukupi', message: `${i.nama} hanya tersisa ${maxStok} pcs di stok.` });
            return i;
          }
          return { ...i, qty: Math.max(0, nextQty) };
        })
        .filter(i => i.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const total = Math.max(0, subtotal - diskon);
  const uangNum = uangDiterima === '' ? total : (Number(uangDiterima) || 0);
  const kembalian = Math.max(0, uangNum - total);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const lastSnapshotRef = useRef(null);

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

  // TFJS Model Labels & Meta State
  const [classLabels, setClassLabels] = useState([]);
  const [lastPredictionsMetadata, setLastPredictionsMetadata] = useState(null);

  // Real-time AI Continuous Inference Loop Refs
  const isLoopRunningRef = useRef(false);
  const isCooldownRef = useRef(false);

  const getProductByClassSlug = (slug) => {
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
    
    // 3. Fallback: any product (so AI at least detects something)
    return null;
  };

  // 🔄 REAL-TIME AI CONTINUOUS INFERENCE LOOP (Every 350ms)
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

          // Capture current frame snapshot synchronously for retraining/evaluation payload
          const snapshot = captureCameraFrame();
          if (snapshot) lastSnapshotRef.current = snapshot;

          // 1. Preprocess the video frame with tf.tidy for memory safety
          const video = videoRef.current;
          const tensor = tf.tidy(() => {
            const raw = tf.browser.fromPixels(video);
            const resized = tf.image.resizeBilinear(raw, [224, 224]);
            return resized.toFloat().expandDims(0);
          });

          // 2. Run prediction
          const output = tfModel.predict(tensor);
          const probs = await output.data();
          tensor.dispose();
          output.dispose();

          const threshold = Number(modelInfo?.confidence_threshold || 0.65);
          const predictions = Array.from(probs)
            .map((score, i) => ({
              label: classLabels[i] || `Class ${i}`,
              score: score
            }))
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
                setAiCandidates([]); // Clear any previous candidates banner

                const added = addToCart(matchedProduct);
                if (!added) {
                  setAlreadyInCartToast({ nama: matchedProduct.nama });
                  setTimeout(() => setAlreadyInCartToast(null), 2500);
                }

                // NEW: Kirim koreksi positive (AI benar) untuk continuous learning
                const snap = lastSnapshotRef.current;
                if (snap) {
                  api.post('/kasir/ai/koreksi', {
                    foto_base64: snap,
                    prediksi_1_produk_id: matchedProduct.id,
                    prediksi_1_confidence: topPrediction.score,
                    produk_dipilih_id: matchedProduct.id,
                    is_correct: true,
                  }).catch(() => {});
                  setKoreksiToast(true);
                  setTimeout(() => setKoreksiToast(false), 2000);
                }

                // Auto-resume scanning for the next item after 1.2 seconds (hands-free)
                setTimeout(() => {
                  setDetectedProduk(null);
                  isCooldownRef.current = false;
                }, 1200);
              }
            }
            // Case B: Ambiguous / Low Confidence (0.25 <= score < Threshold) -> Auto Pause & Show Candidates Banner with Auto-Resume
            else if (topPrediction.score >= 0.25) {
              isCooldownRef.current = true; // Pause scanning loop briefly

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
                  candidates.push({
                    ...prod,
                    match: Math.round(pred.score * 100)
                  });

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

                // Auto-resume scanning after 1.5s if cashier brings a new product or moves item
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
  }, [showAiScan, cameraActive, tfModel, classLabels, modelMapping, produkList]);

  /* ── AI Scan flow ── */
  const handleOpenAiScan = () => {
    setShowAiScan(true);
    setDetectedProduk(null);
    setIsDetecting(false);
    if (!tfModel && !isModelLoading) {
      fetchActiveModel();
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    isCooldownRef.current = false;
    setAiCandidates([]);
    setDetectedProduk(null);
    setIsDetecting(true);

    const snapshot = captureCameraFrame();
    if (snapshot) lastSnapshotRef.current = snapshot;

    // Fallback if model is not loaded yet
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
      
      // 1. Preprocess the video frame
      const tensor = tf.tidy(() => {
        const raw = tf.browser.fromPixels(video);
        const resized = tf.image.resizeBilinear(raw, [224, 224]);
        return resized.toFloat().expandDims(0);
      });

      // 2. Run prediction
      const output = tfModel.predict(tensor);
      const probs = await output.data();
      tensor.dispose();
      output.dispose();

      setIsDetecting(false);

      // 3. Match prediction probabilities to class labels
      const threshold = Number(modelInfo?.confidence_threshold || 0.65);
      const predictions = Array.from(probs)
        .map((score, i) => ({
          label: classLabels[i] || `Class ${i}`,
          score: score
        }))
        .sort((a, b) => b.score - a.score);

      if (predictions.length === 0) {
        showFeedback('info', 'Tidak Terdeteksi', 'Gagal mendeteksi objek. Silakan gunakan Scan Barcode atau Cari Manual.');
        return;
      }

      const topPrediction = predictions[0];

      // 4. Check if confidence >= threshold and product exists
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
          candidates.push({
            ...prod,
            match: Math.round(pred.score * 100)
          });
          
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
        isCooldownRef.current = true; // Lock scan so prediction candidates stay fixed without flickering!
      } else {
        showFeedback('info', 'Produk Tidak Dikenali', 'Produk tidak dikenali dalam sistem. Silakan scan barcode atau cari manual.');
      }
    } catch (err) {
      console.error('Inference error:', err);
      setIsDetecting(false);
      showFeedback('error', 'Kesalahan Proses', 'Terjadi kesalahan saat memproses gambar.');
    }
  };

  const handleSelectCandidate = (produk) => {
    const added = addToCart(produk);
    if (!added) {
      setAlreadyInCartToast({ nama: produk.nama });
      setTimeout(() => setAlreadyInCartToast(null), 2500);
    }
    setAiCandidates([]);
    isCooldownRef.current = false;
    
    // Save base64 snapshot to evaluation retraining log
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
      setKoreksiToast(true);
      setTimeout(() => setKoreksiToast(false), 2000);
    }
  };

  /* ── Checkout ── */
  const handleBayar = async () => {
    if (isPaying || (metodeBayar === 'cash' && uangNum < total)) return;
    setIsPaying(true);

    try {
      const payload = {
        shift_id: shift?.id || undefined,
        subtotal: subtotal,
        total: total,
        pelanggan_id: selectedCustomer?.id !== 'umum' ? selectedCustomer?.id : null,
        metode_bayar: metodeBayar,
        nominal_bayar: metodeBayar === 'cash' ? uangNum : total,
        diskon_total: diskon,
        items: cart.map(item => ({
          produk_id: item.id,
          produk_satuan_jual_id: item.produk_satuan_jual?.[0]?.id || null,
          nama_produk: item.nama,
          satuan: item.satuan_dasar?.nama || 'Pcs',
          konversi: item.produk_satuan_jual?.[0]?.konversi || 1,
          qty: item.qty,
          harga_satuan: item.harga,
          diskon: 0,
          subtotal: item.harga * item.qty,
        })),
      };

      const res = await api.post('/kasir/transaksi', payload);
      const data = res?.data || {};

      const tx = {
        nomor_transaksi: data.nomor_transaksi || `#TRK-${Date.now().toString().slice(-6)}`,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        total,
        uang_diterima: metodeBayar === 'cash' ? uangNum : total,
        kembalian: metodeBayar === 'cash' ? kembalian : 0,
      };

      setCompletedTx(tx);
      setShowPayment(false);
      setShowReceipt(true);
      fetchProduk();
    } catch (err) {
      showFeedback('error', 'Gagal Transaksi', err.response?.data?.pesan || err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleNewTransaction = () => {
    setCart([]);
    setDiskon(0);
    setUangDiterima('');
    setMetodeBayar('cash');
    setSelectedCustomer(pelangganList[0] || { id: 'umum', nama: 'Pelanggan Umum', no_hp: '' });
    setShowReceipt(false);
    setView('home');
  };

  const filteredProduk = produkList.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  );

  /* ════════════════════════════════════════════════════
     SCREEN 4: KERANJANG
     ════════════════════════════════════════════════════ */
  if (view === 'cart') {
    return (
      <>
      <div className="max-w-md mx-auto relative min-h-[calc(100vh-10rem)] pb-56">
        {/* Header */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 bg-[#F8FAF9] sticky top-0 z-20">
          <button onClick={() => setView('home')} className="p-2 -ml-2">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Keranjang ({cartCount})</h1>
          <button onClick={clearCart} className="text-xs font-semibold text-[#EF4444]">Kosongkan</button>
        </div>

        {/* Cart Items (Scrolls naturally under the fixed card) */}
        <div className="space-y-3 py-3">
          {cart.map((item, idx) => (
            <div key={item.id || `cart-item-${idx}`} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-xs">
              <ProdukThumb nama={item.nama} img={item.foto_url} className="w-14 h-14 rounded-xl shrink-0 text-xs" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">{item.nama}</h4>
                <p className="text-[11px] text-gray-500">{item.qty} x {formatRupiah(item.harga)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs font-extrabold text-gray-900">{formatRupiah(item.harga * item.qty)}</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button data-no-loading onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all active:scale-95">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-900 border-x border-gray-200">{item.qty}</span>
                  <button data-no-loading onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-[#16A34A] hover:bg-emerald-50 transition-all active:scale-95">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Locked Total Card (Elevated to bottom-28 to clear floating nav bar cleanly) */}
        <div className="fixed bottom-28 left-4 right-4 max-w-md mx-auto z-30 bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-xl">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Diskon</span>
            <span className="font-semibold text-[#EF4444]">- {formatRupiah(diskon)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-[#16A34A] font-extrabold text-base">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50 shadow-sm"
          >
            Bayar Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>



        {/* Payment / Customer / Receipt modals rendered below */}
        {renderCustomerSheet()}
        {renderPaymentSheet()}
        {renderReceiptModal()}

        {/* Koreksi Feedback Toast */}
        {koreksiToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/30 animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Koreksi tersimpan! Admin akan review untuk training AI.
          </div>
        )}

        {/* Already In Cart Toast */}
        {alreadyInCartToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/30 animate-fade-in flex items-center gap-2">
            <Info className="w-4 h-4" />
            {alreadyInCartToast.nama} sudah di keranjang. Tambah qty manual.
          </div>
        )}
        </div>

      {/* Feedback Modal (replaces native alert) */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
      </>
    );
  }

  /* ════════════════════════════════════════════════════
     SCREEN 1: HALAMAN KASIR (AWAL) — HOME VIEW
     ════════════════════════════════════════════════════ */

  // Shift Guard — wajib buka shift sebelum POS
  if (isShiftLoading) {
    return (
      <>
        <div className="max-w-md mx-auto flex items-center justify-center min-h-screen">
          <p className="text-sm text-gray-500">Memeriksa shift...</p>
        </div>
                <FeedbackModal
          isOpen={feedback.isOpen}
          onClose={() => setFeedback({ ...feedback, isOpen: false })}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
        />
      </>
    );
  }

  if (!shift) {
    return (
      <>
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <Banknote className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Buka Shift Dulu</h2>
          <p className="text-xs text-gray-500 mt-1">Shift harus aktif sebelum transaksi.</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Modal Awal (Rp)</label>
            <input
              type="number"
              value={modalAwal}
              onChange={e => setModalAwal(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-[#16A34A]"
            />
          </div>
          <button
            onClick={handleBukaShift}
            className="w-full py-3 bg-[#16A34A] text-white font-bold rounded-xl hover:bg-[#15803D] transition-all active:scale-[0.98]"
          >
            Buka Shift
          </button>
        </div>
      </div>

      {/* Feedback Modal (replaces native alert) */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* ── Header Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Halo, {user?.nama || 'Kasir'} 👋
          </h1>
          <p className="text-xs text-gray-500" suppressHydrationWarning>
            Shift aktif • {mounted ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '18:43'} WIB
          </p>
        </div>
      </div>

      {/* ── Search Bar with Inline Compact AI & Barcode Buttons ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk / scan barcode"
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/30"
          />
        </div>
        <button
          onClick={() => { setScanMode('ai'); handleOpenAiScan(); }}
          disabled={isModelLoading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border shrink-0',
            isModelLoading
              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
              : scanMode === 'ai'
                ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
          title={isModelLoading ? 'Model AI sedang dimuat...' : 'Scan dengan AI Visual Camera'}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isModelLoading ? 'Memuat Model...' : 'AI Scan'}</span>
        </button>
        <button
          onClick={() => { setScanMode('barcode'); setShowBarcodeScan(true); }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border shrink-0',
            scanMode === 'barcode'
              ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
          title="Scan dengan Barcode Scanner"
        >
          <ScanBarcode className="w-4 h-4" />
          <span className="hidden sm:inline">Barcode</span>
        </button>
      </div>

      {/* ── Produk Favorit (Horizontal Scroll) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Produk Favorit</h3>
          <button className="text-xs font-semibold text-[#16A34A]">Lihat Semua</button>
        </div>
        {filteredProduk.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Produk tidak ditemukan</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-[#16A34A] hover:underline"
              >
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {filteredProduk.slice(0, 6).map((p, idx) => {
            const habis = Number(p.stok ?? 0) <= 0;
            return (
            <button
              key={p.id || `fav-${idx}`}
              onClick={() => addToCart(p)}
              disabled={habis}
              className={`shrink-0 w-28 bg-white border rounded-2xl p-2.5 shadow-xs transition-all active:scale-[0.97] relative ${habis ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-100 hover:border-[#16A34A]'}`}
            >
              {habis && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-md">
                  HABIS
                </span>
              )}
              <ProdukThumb nama={p.nama} img={p.foto_url} className="w-full h-16 rounded-lg mb-2 text-sm" />
              <h4 className="text-[11px] font-semibold text-gray-900 truncate">{p.nama}</h4>
              <p className={`text-[11px] font-bold mt-0.5 ${habis ? 'text-red-600' : 'text-[#15803D]'}`}>{formatRupiah(p.harga)}</p>
            </button>
            );
          })}
        </div>
        )}
      </div>

      {/* ── Mini Cart Preview with Bottom Subtotal & Kosongkan Footer Bar ── */}
      {cart.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#16A34A]" />
              <span className="text-sm font-extrabold text-gray-900">Keranjang ({cartCount})</span>
            </div>
          </div>

          {/* Item List with Steppers (+/-) and Delete Button */}
          <div className="px-4 py-2 space-y-2.5 max-h-48 overflow-y-auto">
            {cart.map((item, idx) => (
              <div key={item.id || `mini-cart-${idx}`} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <ProdukThumb nama={item.nama} img={item.foto_url} className="w-8 h-8 rounded-lg shrink-0 text-[9px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-900 truncate" title={item.nama}>{item.nama}</p>
                    <p className="text-gray-500 text-[11px]">{item.qty} x {formatRupiah(item.harga)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-gray-900">{formatRupiah(item.harga * item.qty)}</span>

                  {/* Quantity Stepper Controls: Minus (-), Qty Count, Plus (+) */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1 py-0.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-rose-600 rounded hover:bg-white transition-colors"
                      title="Kurangi Qty"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs text-gray-900 px-0.5 min-w-[14px] text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-[#16A34A] rounded hover:bg-white transition-colors"
                      title="Tambah Qty"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Item Button */}
                  <button
                    onClick={() => updateQty(item.id, -item.qty)}
                    className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                    title="Hapus barang"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Footer Bar: Kosongkan (Left) & Subtotal (Right) */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-t border-gray-100">
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/50 active:scale-95"
              title="Kosongkan seluruh isi keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
            <button
              onClick={() => setView('cart')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              <span>Subtotal</span>
              <span className="font-extrabold text-gray-900 text-sm ml-0.5">{formatRupiah(subtotal)}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* ═════ MODALS ═════ */}

      {/* SCREEN 2: FULL-SCREEN CAMERA AI & BARCODE SCANNER OVERLAY */}
      {(showAiScan || showBarcodeScan) && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none">
          {/* 1. Live HTML5 Camera Video Background (Full Screen) */}
          <div className="absolute inset-0 z-0 bg-gray-950 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-105"
            />
            {/* Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
          </div>

          {/* 2. Top Bar: Close Button + Mode Switcher Pill */}
          <div className="relative z-20 flex items-center justify-between p-4 pt-6">
            {/* Close Button */}
            <button
              onClick={() => { setShowAiScan(false); setShowBarcodeScan(false); }}
              className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-all border border-white/10 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mode Switcher Capsule Pill */}
            <div className="bg-black/50 backdrop-blur border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-lg">
              <button
                onClick={() => { setShowBarcodeScan(false); setShowAiScan(true); handleOpenAiScan(); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
                  showAiScan
                    ? 'bg-[#16A34A] text-white font-bold shadow-sm'
                    : 'text-gray-300 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Mode
              </button>
              <button
                onClick={() => { setShowAiScan(false); setShowBarcodeScan(true); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
                  showBarcodeScan
                    ? 'bg-[#16A34A] text-white font-bold shadow-sm'
                    : 'text-gray-300 hover:text-white'
                )}
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                Barcode Mode
              </button>
              <button
                onClick={() => { setShowAiScan(false); setShowBarcodeScan(false); setView('home'); setAiCandidates([]); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                title="Beralih ke Input Manual POS"
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>

            {/* Live Clock / Status */}
            <span className="text-xs text-white/80 font-medium tracking-wide">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* 3. Center Camera Bounding Frame */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">
            {/* Floating Detection Status Pill */}
            <div className="mb-4 px-4 py-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white text-xs font-semibold flex items-center gap-2 shadow-md">
              <span className={cn('w-2 h-2 rounded-full animate-ping', showBarcodeScan ? 'bg-red-400' : isModelLoading ? 'bg-amber-400' : modelError || !tfModel ? 'bg-rose-400' : 'bg-emerald-400')} />
              <span>
                {showBarcodeScan
                  ? 'Mendeteksi barcode...'
                  : isModelLoading
                  ? 'Mengunduh & Memuat Model AI...'
                  : modelError || !tfModel
                  ? 'Gagal Memuat Model AI'
                  : detectedProduk
                  ? `Sukses! ${detectedProduk.nama} Terdeteksi`
                  : 'Memindai AI Real-Time (Otomatis)...'}
              </span>
            </div>

            {/* Bounding Box Frame */}
            <div className="w-full max-w-xs aspect-square relative rounded-3xl overflow-hidden flex items-center justify-center">
              {/* Corner brackets */}
              <div className={cn('absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 rounded-tl-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 rounded-tr-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 rounded-bl-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 rounded-br-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />

              {/* Barcode Laser Beam */}
              {showBarcodeScan && (
                <div className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse top-1/2 -translate-y-1/2" />
              )}

              {/* AI Model Loading & Error States */}
              {showAiScan && !tfModel && (
                isModelLoading ? (
                  <div className="bg-black/80 backdrop-blur px-5 py-4 rounded-2xl border border-white/10 text-center animate-fade-in max-w-[240px]">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-emerald-300 font-bold">Memuat Model AI...</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Menyiapkan cache IndexedDB browser</p>
                  </div>
                ) : (
                  <div className="bg-black/85 backdrop-blur p-4 rounded-2xl border border-rose-500/30 text-center animate-fade-in max-w-[260px] space-y-2.5">
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-300">Gagal Memuat Model AI</p>
                      <p className="text-[10px] text-gray-300 leading-tight mt-0.5 max-h-12 overflow-y-auto">
                        {modelError || 'Tidak dapat terhubung ke server model.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => fetchActiveModel()}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold rounded-xl transition-colors shadow-sm"
                      >
                        Coba Lagi
                      </button>
                      <button
                        onClick={() => { setShowAiScan(false); setShowBarcodeScan(true); }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-xl border border-white/10 transition-colors"
                      >
                        Mode Barcode
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* AI Manual Processing Spinner */}
              {showAiScan && tfModel && isDetecting && (
                <div className="bg-black/60 backdrop-blur px-5 py-3.5 rounded-2xl border border-white/10 text-center">
                  <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-emerald-300 font-bold">Pemindaian AI...</p>
                </div>
              )}
            </div>

            {/* Detected Result Status Pill directly under bounding box */}
            {showAiScan && detectedProduk && !isDetecting && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-emerald-500/30 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Produk terdeteksi! <span className="text-emerald-400 font-bold">Confidence {detectedProduk.confidence}%</span></span>
              </div>
            )}

            {/* Scanned Barcode Result Pill */}
            {showBarcodeScan && scannedBarcodeCode && !barcodeNotFound && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-emerald-500/30 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Barcode: <span className="font-mono text-emerald-400 font-bold">{scannedBarcodeCode}</span></span>
              </div>
            )}

            {/* Barcode Not Found Feedback */}
            {showBarcodeScan && barcodeNotFound && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-rose-500/40 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Produk tidak ditemukan untuk kode <span className="font-mono text-rose-400 font-bold">{scannedBarcodeCode}</span></span>
              </div>
            )}

            {/* Manual Barcode Input Fallback (browser tanpa BarcodeDetector / produk tak ketemu) */}
            {showBarcodeScan && (
              <form
                onSubmit={handleManualBarcodeSubmit}
                className="mt-3 flex items-center gap-2 max-w-xs mx-auto"
              >
                <input
                  value={manualBarcode}
                  onChange={(e) => { setManualBarcode(e.target.value); setBarcodeNotFound(false); }}
                  placeholder="Ketik kode barcode…"
                  inputMode="numeric"
                  className="flex-1 min-w-0 px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-400/60"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-400/30 transition-colors"
                >
                  Tambah
                </button>
              </form>
            )}

            {/* Demo Barcode Simulation Buttons (Barcode Mode Only) */}
            {showBarcodeScan && (
              <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap max-w-xs">
                <span className="text-[10px] text-gray-500 font-medium">Test Barcode:</span>
                {produkList.filter(p => p.barcode).slice(0, 2).map((p, idx) => (
                  <button
                    key={p.id || `test-code-${idx}`}
                    onClick={() => handleDetectedBarcode(p.barcode)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-[10px] font-mono border border-white/10 transition-colors"
                  >
                    {p.barcode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Top 3 Predictions Candidate Banner (KHUSUS AI MODE ONLY) */}
          {showAiScan && aiCandidates.length > 0 && (
            <div className="relative z-30 mx-4 mb-2 bg-black/80 backdrop-blur border border-white/15 rounded-2xl p-2.5 shadow-2xl animate-slide-up max-w-md mx-auto">
              <div className="flex items-center justify-between px-1 mb-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold truncate">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="truncate">Confidence rendah ({aiCandidates[0]?.match || 62}%). Pilih produk yang sesuai.</span>
                </div>
                <button onClick={() => setAiCandidates([])} className="text-gray-500 hover:text-white shrink-0 text-[10px] font-medium flex items-center gap-1 ml-2">
                  Top 3 prediksi <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white">
                {aiCandidates.slice(0, 3).map((cand, idx) => (
                  <React.Fragment key={`cand-${idx}-${cand.nama}`}>
                    {idx > 0 && <span className="text-gray-600 font-light mx-1">|</span>}
                    <button
                      onClick={() => handleSelectCandidate(cand)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-1 py-1 hover:bg-white/10 rounded-lg transition-colors min-w-0"
                    >
                      <span className="font-bold text-gray-500 text-[11px]">{idx + 1}</span>
                      <span className="font-semibold text-[11px] truncate">{cand.nama}</span>
                      <span className="font-bold text-[#15803D] text-[10px] shrink-0">{cand.match}%</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* 5. Floating Live Cart Drawer (Floating Card matching user mockup) */}
          {cart.length > 0 && (
            <div className="relative z-30 mx-4 mb-4 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-white/20 max-w-sm w-full mx-auto animate-slide-up">
              {/* Drawer Header Row */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#16A34A]" />
                  <h4 className="font-extrabold text-sm text-gray-900">Keranjang ({cartCount})</h4>
                </div>
                <button
                  onClick={() => setView('cart')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                >
                  Subtotal <span className="font-extrabold text-gray-900 text-sm ml-0.5">Rp {subtotal?.toLocaleString('id-ID')}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Item List (Vertical Stack) */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-2.5 transition-colors border border-emerald-100/50">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803D] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                        {item.nama?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-gray-900 truncate" title={item.nama}>{item.nama}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{item.qty} x Rp {item.harga?.toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-extrabold text-xs text-gray-900">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</p>
                      
                      {/* Stepper Controls: Minus (-), Qty Count, Plus (+) */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Kurangi Qty"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-gray-900 px-0.5 min-w-[14px] text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Tambah Qty"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        onClick={() => updateQty(item.id, -item.qty)}
                        className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                        title="Hapus barang"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SCREEN 3: AI CANDIDATES BOTTOM SHEET */}
      {showAiCandidates && (
        <>
          <div onClick={() => setShowAiCandidates(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-24 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Pilih Produk</h2>
              <button onClick={() => setShowAiCandidates(false)} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Kami menemukan beberapa pilihan produk yang mirip</p>

            <div className="space-y-3">
              {aiCandidates.map((cand, i) => (
                <button
                  key={cand.id || `cand-${i}`}
                  onClick={() => handleSelectCandidate(cand)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-[#16A34A] transition-all active:scale-[0.98]"
                >
                  <ProdukThumb nama={cand.nama} img={cand.foto_url} className="w-14 h-14 rounded-xl shrink-0 text-sm" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        cand.match >= 90 ? 'bg-emerald-100 text-[#15803D]'
                          : cand.match >= 70 ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {cand.match}% Match
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1">{cand.nama}</h4>
                    <p className="text-sm font-bold text-[#16A34A]">{formatRupiah(cand.harga)}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-2.5 text-center tracking-wider">Produk yang dicari tidak ada?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAiCandidates(false);
                    setShowBarcodeScan(true);
                  }}
                  className="flex-1 py-3 bg-[#16A34A] hover:bg-[#15803D] text-xs font-bold text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Scan Barcode</span>
                </button>
                <button
                  onClick={() => {
                    setShowAiCandidates(false);
                    // Simply focus the search field on main screen
                    const searchInput = document.querySelector('input[placeholder*="Cari produk"]');
                    if (searchInput) searchInput.focus();
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <PenLine className="w-4 h-4 text-gray-500" />
                  <span>Cari Manual</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {renderCustomerSheet()}
      {renderPaymentSheet()}
      {renderReceiptModal()}

      {/* Koreksi Feedback Toast */}
      {koreksiToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/30 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Koreksi tersimpan! Admin akan review untuk training AI.
        </div>
      )}

      {/* Already In Cart Toast */}
      {alreadyInCartToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/30 animate-fade-in flex items-center gap-2">
          <Info className="w-4 h-4" />
          {alreadyInCartToast.nama} sudah di keranjang. Tambah qty manual.
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
    </div>
  );

  function renderCustomerSheet() {
    if (!showCustomerSelect) return null;
    return (
      <>
        <div onClick={() => setShowCustomerSelect(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-24 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Pilih Pelanggan</h2>
            <button onClick={() => setShowCustomerSelect(false)} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input placeholder="Cari pelanggan" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#16A34A]" />
          </div>

          <div className="space-y-1.5">
            {pelangganList.map((c, idx) => (
              <button
                key={c.id || `cust-${idx}`}
                onClick={() => { setSelectedCustomer(c); setShowCustomerSelect(false); }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                  selectedCustomer?.id === c.id ? 'bg-[#ECFDF5] border border-[#16A34A]/20' : 'hover:bg-gray-50'
                )}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.nama}</p>
                  {c.no_hp && <p className="text-[11px] text-gray-500">{c.no_hp}</p>}
                </div>
              </button>
            ))}
          </div>

          <button className="w-full mt-4 flex items-center justify-between py-3 px-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Pelanggan Baru</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════════════════
     SCREEN 6: PEMBAYARAN (Bottom Sheet)
     ════════════════════════════════════════════════════ */
  function renderPaymentSheet() {
    if (!showPayment) return null;
    return (
      <>
        <div onClick={() => setShowPayment(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-32 animate-slide-up max-h-[90vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Pembayaran</h2>
            <button onClick={() => setShowPayment(false)} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          {/* Total */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">Total Bayar</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-0.5 font-[family-name:var(--font-poppins)]">{formatRupiah(total)}</h3>
          </div>

          {/* Metode Pembayaran */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Transfer Bank', icon: Building2 },
              ].map(m => {
                const Icon = m.icon;
                const active = metodeBayar === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetodeBayar(m.id)}
                    className={cn(
                      'flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all justify-center',
                      active ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Uang Diterima & Quick Chips (Tunai only) */}
          {metodeBayar === 'cash' && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Uang Diterima</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#16A34A]">Rp</span>
                  <input
                    type="number"
                    value={uangDiterima}
                    onChange={e => setUangDiterima(e.target.value)}
                    placeholder={String(total)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-lg font-bold text-[#16A34A] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/30"
                  />
                </div>
              </div>

              {/* Quick Nominal Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setUangDiterima(String(total))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-[#15803D] border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  Uang Pas
                </button>
                {[10000, 20000, 50000, 100000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setUangDiterima(String(nominal))}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {nominal >= 1000 ? `${nominal / 1000}rb` : nominal}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Kembalian</span>
                <span className="text-lg font-extrabold text-[#16A34A]">{formatRupiah(kembalian)}</span>
              </div>
            </div>
          )}

          {/* CTA Bayar */}
          <button
            onClick={handleBayar}
            disabled={isPaying || (metodeBayar === 'cash' && uangNum < total)}
            className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isPaying ? 'Memproses Pembayaran...' : 'Bayar Sekarang'}
          </button>
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════════════════
     SCREEN 7: STRUK BERHASIL (Full Modal)
     ════════════════════════════════════════════════════ */
  function renderReceiptModal() {
    if (!showReceipt || !completedTx) return null;
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-sm text-center space-y-5">
          {/* Checkmark */}
          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#16A34A]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-poppins)]">Transaksi Berhasil!</h2>
            <p className="text-xs text-gray-500 mt-1">No. Transaksi</p>
            <p className="text-sm font-bold text-gray-900 font-mono">{completedTx.nomor_transaksi}</p>
            <p className="text-xs text-gray-500 mt-0.5">{completedTx.tanggal} • {completedTx.waktu}</p>
          </div>

          {/* Rincian */}
          <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Bayar</span>
              <span className="font-semibold text-gray-900">{formatRupiah(completedTx.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uang Diterima</span>
              <span className="font-semibold text-gray-900">{formatRupiah(completedTx.uang_diterima)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">Kembalian</span>
              <span className="font-bold text-[#16A34A] text-base">{formatRupiah(completedTx.kembalian)}</span>
            </div>
          </div>

          {/* Actions */}
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4" />
            Bagikan Struk
          </button>

          <button
            onClick={handleNewTransaction}
            className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3.5 rounded-2xl transition-all shadow-sm"
          >
            Transaksi Baru
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleNewTransaction}
            className="text-xs font-semibold text-gray-500 hover:text-gray-600 transition-colors"
          >
            Kembali ke Home
          </button>
        </div>
      </div>

    );
  }
}
