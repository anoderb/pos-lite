/**
 * Lazy TensorFlow.js loader.
 *
 * tfjs (~2MB) cuma di-download pas halaman yang beneran butuh inferensi dibuka
 * (POS kasir & admin model sandbox), bukan di initial bundle semua halaman.
 *
 * Usage:
 *   const tf = await getTf();
 *   await tf.ready();
 */
let tfPromise = null;

export function getTf() {
  if (!tfPromise) {
    tfPromise = import('@tensorflow/tfjs');
  }
  return tfPromise;
}
