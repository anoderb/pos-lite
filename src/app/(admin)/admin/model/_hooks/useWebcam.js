import { useState, useRef, useCallback, useEffect } from 'react';

export default function useWebcam(onFrame, onError) {
  const [active, setActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const processingRef = useRef(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      runningRef.current = true;
      setActive(true);

      // Loop scanning setiap 300ms
      const loop = async () => {
        if (!runningRef.current) return;
        if (videoRef.current?.readyState >= 2 && !processingRef.current) {
          processingRef.current = true;
          try { await onFrame?.(videoRef.current); } catch {}
          processingRef.current = false;
        }
        timerRef.current = setTimeout(loop, 300);
      };
      loop();
    } catch (err) {
      onError?.(err?.message || 'Gagal mengakses kamera');
    }
  }, [onFrame, onError]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, active, start, stop };
}
