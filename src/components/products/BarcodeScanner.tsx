"use client";

/**
 * BarcodeScanner — uses the native BarcodeDetector API when available (Chrome 88+, Edge 88+, Safari 17.2+).
 * Falls back to @zxing/browser for Firefox and other browsers.
 *   - Single barcode detected → auto-fills and closes.
 *   - Multiple barcodes (native only) → freezes the frame, user taps to select.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

// ── Minimal BarcodeDetector type declarations ─────────────────────────────────
interface NativeBarcodeDetectorResult {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}
// ─────────────────────────────────────────────────────────────────────────────

type ScanEngine = "native" | "zxing";

interface FrozenBarcode {
  rawValue: string;
  rect: { left: number; top: number; width: number; height: number };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onDetect: (value: string) => void;
}

const NATIVE_FORMATS = [
  "ean_13", "ean_8", "code_128", "code_39", "code_93",
  "itf", "upc_a", "upc_e", "qr_code", "data_matrix",
];

function getNativeDetector(): { detector: unknown } | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BD = (window as any).BarcodeDetector;
  if (!BD) return null;
  try {
    return { detector: new BD({ formats: NATIVE_FORMATS }) };
  } catch {
    return null;
  }
}

export default function BarcodeScanner({ open, onClose, onDetect }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nativeDetectorRef = useRef<any>(null);
  // Stores the controls returned by ZXing decodeFromStream so we can stop() it
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const engineRef = useRef<ScanEngine>("zxing");
  // Guards against multiple detections firing after the first one
  const detectedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [frozen, setFrozen] = useState<FrozenBarcode[] | null>(null);
  const lastDetectionRef = useRef(0);

  // ── Stop everything ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    nativeDetectorRef.current = null;
    if (zxingControlsRef.current) {
      // stop() halts the ZXing internal decode loop
      try { zxingControlsRef.current.stop(); } catch { /* ignore */ }
      zxingControlsRef.current = null;
    }
    setReady(false);
    setFrozen(null);
  }, []);

  const playScanFeedback = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass =
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).webkitAudioContext as typeof AudioContext | undefined);

      if (AudioContextClass) {
        const ctx = new AudioContextClass();

        // Two-pulse scanner beep (like a real barcode reader)
        const playBeep = (startTime: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(1800, startTime);
          // Sharp attack, short sustain, fast decay
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.005);
          gain.gain.setValueAtTime(0.10, startTime + 0.055);
          gain.gain.linearRampToValueAtTime(0.001, startTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.09);
          return osc;
        };

        const osc1 = playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.12); // second beep 120ms later
        osc1.onended = () => {
          // Close context after both beeps finish
          setTimeout(() => void ctx.close().catch(() => undefined), 300);
        };
      }

      if ("vibrate" in navigator) {
        navigator.vibrate([30, 60, 30]); // double-pulse haptic
      }
    } catch {
      // Keep scanning flow resilient even if audio/haptics are unavailable.
    }
  }, []);

  const debouncedDetect = useCallback((value: string) => {
    // Guard: ignore if already detected (prevents ZXing callback firing multiple times)
    if (detectedRef.current) return;
    const now = Date.now();
    // Also debounce by time as a secondary guard
    if (now - lastDetectionRef.current < 500) return;
    
    detectedRef.current = true;
    lastDetectionRef.current = now;
    
    playScanFeedback();
    stopCamera();
    onDetect(value);
    onClose();
  }, [onClose, onDetect, playScanFeedback, stopCamera]);

  // ── Native scan loop ─────────────────────────────────────────────────────────
  const nativeScan = useCallback(async () => {
    if (!videoRef.current || !nativeDetectorRef.current) return;
    if (videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(nativeScan);
      return;
    }
    try {
      const results: NativeBarcodeDetectorResult[] = await nativeDetectorRef.current.detect(videoRef.current);

      if (results.length === 1) {
        debouncedDetect(results[0].rawValue);
        return;
      }

      if (results.length > 1) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        const toPercent = (b: DOMRectReadOnly): FrozenBarcode["rect"] => ({
          left: (b.x / video.videoWidth) * 100,
          top: (b.y / video.videoHeight) * 100,
          width: (b.width / video.videoWidth) * 100,
          height: (b.height / video.videoHeight) * 100,
        });

        setFrozen(results.map((r) => ({ rawValue: r.rawValue, rect: toPercent(r.boundingBox) })));
        stopCamera();
        return;
      }
    } catch {
      // keep scanning
    }
    rafRef.current = requestAnimationFrame(nativeScan);
    // Note: debouncedDetect and stopCamera are stable useCallbacks; omitting
    // onClose/onDetect/playScanFeedback to prevent RAF loop re-creation on every render
  }, [debouncedDetect, stopCamera]);

  // ── Start camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    setFrozen(null);
    // Reset the detection guard so subsequent opens work
    detectedRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch {
      setError(t("scanner.cameraError"));
      return;
    }
    streamRef.current = stream;

    // Try native BarcodeDetector first
    const native = getNativeDetector();
    if (native) {
      engineRef.current = "native";
      nativeDetectorRef.current = native.detector;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
      return;
    }

    // Fallback: ZXing (works in Firefox, older browsers, etc.)
    engineRef.current = "zxing";
    const reader = new BrowserMultiFormatReader();

    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setReady(true);

    try {
      // decodeFromStream returns controls; store them so we can stop() later
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          debouncedDetect(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          console.warn("[BarcodeScanner] ZXing error:", err);
        }
      });
      zxingControlsRef.current = controls;
    } catch {
      setError(t("scanner.cameraError"));
    }
  }, [debouncedDetect, stopCamera, t]);

  // Start native scan loop once ready (native engine only)
  useEffect(() => {
    if (ready && engineRef.current === "native") {
      rafRef.current = requestAnimationFrame(nativeScan);
    }
  }, [ready, nativeScan]);

  // Lifecycle: open/close — use a ref-based call to avoid startCamera in deps,
  // which would cause the effect to re-run (and re-start the camera) on every render.
  const startCameraRef = useRef(startCamera);
  useEffect(() => { startCameraRef.current = startCamera; }, [startCamera]);

  useEffect(() => {
    if (open) {
      detectedRef.current = false;
      startCameraRef.current();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stopCamera]);

  const handleSelectBarcode = (value: string) => {
    setFrozen(null);
    debouncedDetect(value);
  };

  const handleRescan = () => {
    setFrozen(null);
    startCamera();
  };

  return (
    <Dialog
      open={open}
      onClose={() => { stopCamera(); onClose(); }}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#000",
            overflow: "hidden",
            m: { xs: 0, sm: 2 },
            width: { xs: "100%", sm: undefined },
            maxHeight: { xs: "100dvh", sm: "80vh" },
            borderRadius: { xs: 0, sm: 1.5 },
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.25,
          bgcolor: "rgba(0,0,0,0.6)",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>
          {frozen ? t("scanner.selectBarcode") : t("scanner.pointCamera")}
        </Typography>
        <IconButton
          size="small"
          onClick={() => { stopCamera(); onClose(); }}
          sx={{ color: "#fff" }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Camera / Frozen frame area */}
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", bgcolor: "#000" }}>
        {/* Live video */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: frozen ? "none" : "block",
          }}
        />

        {/* Frozen canvas (native multi-barcode selection) */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: frozen ? "block" : "none",
          }}
        />

        {/* Barcode selection overlays on frozen frame */}
        {frozen &&
          frozen.map((b, i) => (
            <Box
              key={i}
              onClick={() => handleSelectBarcode(b.rawValue)}
              sx={{
                position: "absolute",
                left: `${b.rect.left}%`,
                top: `${b.rect.top}%`,
                width: `${b.rect.width}%`,
                height: `${b.rect.height}%`,
                border: "2px solid",
                borderColor: "primary.main",
                borderRadius: 0.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                "&:hover": { borderColor: "primary.light" },
              }}
            >
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: 11,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: "2px 2px 0 0",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.rawValue}
              </Box>
            </Box>
          ))}

        {/* Scanning crosshair guide */}
        {!frozen && ready && !error && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                width: "60%",
                height: "35%",
                border: "2px solid rgba(255,255,255,0.6)",
                borderRadius: 1,
              }}
            />
          </Box>
        )}

        {/* Loading spinner */}
        {!ready && !error && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} sx={{ color: "#fff" }} />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
            }}
          >
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          </Box>
        )}
      </Box>

      {/* Footer hint */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: "#111" }}>
        {frozen ? (
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", textAlign: "center" }}
          >
            {t("scanner.tapToSelect")}{" "}
            <Box
              component="span"
              onClick={handleRescan}
              sx={{ color: "primary.light", cursor: "pointer", textDecoration: "underline" }}
            >
              {t("scanner.rescan")}
            </Box>
          </Typography>
        ) : (
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "block", textAlign: "center" }}
          >
            {t("scanner.hint")}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}
