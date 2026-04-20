"use client";

/**
 * BarcodeScanner — uses the native BarcodeDetector API (Chrome 88+, Edge 88+, Safari 17.2+).
 * Opens the device back camera, scans continuously for barcodes.
 *   - Single barcode detected → auto-fills and closes.
 *   - Multiple barcodes → freezes the frame and lets the user tap to select one.
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

// ── Minimal BarcodeDetector type declarations ─────────────────────────────────
interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}
interface BarcodeDetectorClass {
  new (options?: { formats?: string[] }): {
    detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<BarcodeDetectorResult[]>;
  };
}
declare const BarcodeDetector: BarcodeDetectorClass | undefined;
// ─────────────────────────────────────────────────────────────────────────────

interface FrozenBarcode {
  rawValue: string;
  rect: { left: number; top: number; width: number; height: number }; // in %, relative to canvas display
}

interface Props {
  open: boolean;
  onClose: () => void;
  onDetect: (value: string) => void;
}

const SUPPORTED_FORMATS = [
  "ean_13", "ean_8", "code_128", "code_39", "code_93",
  "itf", "upc_a", "upc_e", "qr_code", "data_matrix",
];

export default function BarcodeScanner({ open, onClose, onDetect }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<ReturnType<BarcodeDetectorClass["prototype"]["constructor"]> | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [frozen, setFrozen] = useState<FrozenBarcode[] | null>(null); // non-null = frozen frame

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    setFrozen(null);

    if (typeof BarcodeDetector === "undefined") {
      setError(t("scanner.notSupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      detectorRef.current = new BarcodeDetector({ formats: SUPPORTED_FORMATS });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError(t("scanner.cameraError"));
    }
  }, [t]);

  // ── Stop camera ─────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setReady(false);
    setFrozen(null);
  }, []);

  // ── Scan loop ───────────────────────────────────────────────────────────────
  const scan = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return;
    if (videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(scan);
      return;
    }

    try {
      const results = await detectorRef.current.detect(videoRef.current);

      if (results.length === 1) {
        // Single barcode — fill and close immediately
        stopCamera();
        onDetect(results[0].rawValue);
        onClose();
        return;
      }

      if (results.length > 1) {
        // Multiple barcodes — freeze the current frame
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        // Convert absolute px coords to % of canvas natural size
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
      // detection error — keep scanning
    }

    rafRef.current = requestAnimationFrame(scan);
  }, [onClose, onDetect, stopCamera]);

  // Start scan loop when ready
  useEffect(() => {
    if (ready) {
      rafRef.current = requestAnimationFrame(scan);
    }
  }, [ready, scan]);

  // Lifecycle: start/stop with dialog open state
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
    onDetect(value);
    onClose();
  };

  const handleRescan = () => {
    setFrozen(null);
    startCamera().then(() => {
      // scan loop restarts via the `ready` effect
    });
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
        {/* Live video — hidden when frozen */}
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

        {/* Frozen canvas */}
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
