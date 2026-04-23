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
import { BrowserMultiFormatReader } from "@zxing/browser";
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
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const engineRef = useRef<ScanEngine>("zxing");

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [frozen, setFrozen] = useState<FrozenBarcode[] | null>(null);

  const playScanFeedback = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass =
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).webkitAudioContext as typeof AudioContext | undefined);

      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1046, ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        osc.onended = () => {
          void ctx.close().catch(() => undefined);
        };
      }

      if ("vibrate" in navigator) {
        navigator.vibrate(40);
      }
    } catch {
      // Keep scanning flow resilient even if audio/haptics are unavailable.
    }
  }, []);

  // ── Stop everything ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    nativeDetectorRef.current = null;
    if (zxingReaderRef.current) {
      zxingReaderRef.current = null;
    }
    setReady(false);
    setFrozen(null);
  }, []);

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
        playScanFeedback();
        stopCamera();
        onDetect(results[0].rawValue);
        onClose();
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
  }, [onClose, onDetect, playScanFeedback, stopCamera]);

  // ── Start camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    setFrozen(null);

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
    zxingReaderRef.current = reader;

    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setReady(true);

    try {
      reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          playScanFeedback();
          stopCamera();
          onDetect(result.getText());
          onClose();
        } else if (err && !(err instanceof NotFoundException)) {
          console.warn("[BarcodeScanner] ZXing error:", err);
        }
      });
    } catch {
      setError(t("scanner.cameraError"));
    }
  }, [onClose, onDetect, playScanFeedback, stopCamera, t]);

  // Start native scan loop once ready (native engine only)
  useEffect(() => {
    if (ready && engineRef.current === "native") {
      rafRef.current = requestAnimationFrame(nativeScan);
    }
  }, [ready, nativeScan]);

  // Lifecycle: open/close
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const handleSelectBarcode = (value: string) => {
    setFrozen(null);
    playScanFeedback();
    onDetect(value);
    onClose();
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
