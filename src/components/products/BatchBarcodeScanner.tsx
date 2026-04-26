"use client";

/**
 * BatchBarcodeScanner — full-screen batch scanning mode.
 * Camera stays live between scans. Each detected barcode is added to a
 * running list; re-scanning the same barcode increments its quantity.
 * Pressing "Add X Items" merges the list into the parent via onConfirm.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Divider,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { useProducts } from "@/hooks/useProducts";
import type { LineItemDraft } from "@/types";

// ── Minimal BarcodeDetector type declarations ─────────────────────────────────
interface NativeBarcodeDetectorResult {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}
// ─────────────────────────────────────────────────────────────────────────────

type ScanEngine = "native" | "zxing";

interface ScannedRow extends LineItemDraft {
  barcode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: LineItemDraft[]) => void;
}

const NATIVE_FORMATS = [
  "ean_13", "ean_8", "code_128", "code_39", "code_93",
  "itf", "upc_a", "upc_e", "qr_code", "data_matrix",
];

/** How long (ms) to ignore re-scans of the same barcode to avoid duplicates. */
const SCAN_DEBOUNCE_MS = 2000;

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

export default function BatchBarcodeScanner({ open, onClose, onConfirm }: Props) {
  const { t, i18n } = useTranslation();
  const { data: products = [] } = useProducts();

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
        playBeep(ctx.currentTime + 0.12);
        osc1.onended = () => {
          setTimeout(() => void ctx.close().catch(() => undefined), 300);
        };
      }

      if ("vibrate" in navigator) {
        navigator.vibrate([30, 60, 30]);
      }
    } catch {
      // Keep scanning flow resilient even if audio/haptics are unavailable.
    }
  }, []);

  // Keep refs to latest products / lang to avoid stale closures in scan callbacks
  const activeProductsRef = useRef(products.filter((p) => p.status === "active"));
  useEffect(() => {
    activeProductsRef.current = products.filter((p) => p.status === "active");
  }, [products]);

  const isArRef = useRef(i18n.language === "ar");
  useEffect(() => { isArRef.current = i18n.language === "ar"; }, [i18n.language]);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nativeDetectorRef = useRef<any>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const engineRef = useRef<ScanEngine>("zxing");

  /** barcode → last-detected timestamp, used to debounce rapid re-detections */
  const lastScanRef = useRef<Map<string, number>>(new Map());

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scannedRows, setScannedRows] = useState<ScannedRow[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  // barcode → editing qty string (null = not editing)
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  // ── Stop camera ──────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    nativeDetectorRef.current = null;
    zxingReaderRef.current = null;
    setReady(false);
  }, []);

  // ── Handle a detected barcode value ─────────────────────────────────────────
  const handleDetected = useCallback((barcode: string) => {
    const now = Date.now();
    const last = lastScanRef.current.get(barcode) ?? 0;
    if (now - last < SCAN_DEBOUNCE_MS) return;
    lastScanRef.current.set(barcode, now);

    playScanFeedback();

    const found = activeProductsRef.current.find((p) => p.barcode === barcode);

    setScannedRows((prev) => {
      const existingIdx = prev.findIndex((r) => r.barcode === barcode);
      if (existingIdx !== -1) {
        return prev.map((r, i) =>
          i === existingIdx ? { ...r, qty: r.qty + 1 } : r
        );
      }
      const newRow: ScannedRow = found
        ? {
            barcode,
            product_id: found.id,
            description: (isArRef.current && found.name_ar) ? found.name_ar : found.name_en,
            qty: 1,
            unit_price: found.unit_price,
          }
        : {
            barcode,
            product_id: null,
            description: barcode,
            qty: 1,
            unit_price: 0,
          };
      return [...prev, newRow];
    });

    setLastAdded(barcode);
  }, [playScanFeedback]);

  // ── Native scan loop (keeps running between detections) ──────────────────────
  const nativeScan = useCallback(async () => {
    if (!videoRef.current || !nativeDetectorRef.current) return;
    if (videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(nativeScan);
      return;
    }
    try {
      const results: NativeBarcodeDetectorResult[] =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await nativeDetectorRef.current.detect(videoRef.current);
      for (const r of results) {
        handleDetected(r.rawValue);
      }
    } catch {
      // ignore detection errors; keep scanning
    }
    rafRef.current = requestAnimationFrame(nativeScan);
  }, [handleDetected]);

  // ── Start camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);

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

    // Fallback: ZXing
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
          handleDetected(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          console.warn("[BatchBarcodeScanner] ZXing:", err);
        }
      });
    } catch {
      setError(t("scanner.cameraError"));
    }
  }, [handleDetected, t]);

  // Start native RAF loop once camera is ready
  useEffect(() => {
    if (ready && engineRef.current === "native") {
      rafRef.current = requestAnimationFrame(nativeScan);
    }
  }, [ready, nativeScan]);

  // Lifecycle: reset state and start/stop camera on open change
  useEffect(() => {
    if (open) {
      setScannedRows([]);
      setLastAdded(null);
      lastScanRef.current.clear();
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // ── Qty helpers ──────────────────────────────────────────────────────────────
  const updateQty = (barcode: string, delta: number) => {
    setScannedRows((prev) =>
      prev
        .map((r) => r.barcode === barcode ? { ...r, qty: Math.max(1, r.qty + delta) } : r)
        .filter((r) => r.qty > 0)
    );
  };

  const setQtyDirect = (barcode: string, val: string) => {
    setEditingQty((prev) => ({ ...prev, [barcode]: val }));
  };

  const commitQty = (barcode: string) => {
    const raw = editingQty[barcode];
    if (raw !== undefined) {
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        setScannedRows((prev) => prev.map((r) => r.barcode === barcode ? { ...r, qty: num } : r));
      }
      setEditingQty((prev) => { const n = { ...prev }; delete n[barcode]; return n; });
    }
  };

  const removeRow = (barcode: string) => {
    setScannedRows((prev) => prev.filter((r) => r.barcode !== barcode));
  };

  // ── Confirm ──────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    stopCamera();
    onConfirm(
      scannedRows.map(({ product_id, description, qty, unit_price }) => ({
        product_id,
        description,
        qty,
        unit_price,
      }))
    );
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const totalQty = scannedRows.reduce((s, r) => s + r.qty, 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#000",
            m: { xs: 0, sm: 2 },
            width: { xs: "100%", sm: undefined },
            height: { xs: "100dvh", sm: "90vh" },
            maxHeight: { xs: "100dvh", sm: "90vh" },
            borderRadius: { xs: 0, sm: 1.5 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
      }}
    >
      {/* ── Camera area ─────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, position: "relative", overflow: "hidden", bgcolor: "#000", minHeight: 0 }}>

        {/* Header overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.25,
            bgcolor: "rgba(0,0,0,0.55)",
          }}
        >
          <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>
            {t("scanner.batchTitle")}
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: "#fff" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Live video */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Crosshair guide */}
        {ready && !error && (
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
                width: "65%",
                height: "30%",
                border: "2px solid rgba(255,255,255,0.55)",
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

        {/* Camera error */}
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
            <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
          </Box>
        )}

        {/* Running total badge */}
        {totalQty > 0 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "primary.main",
              color: "#fff",
              borderRadius: 1,
              px: 1.5,
              py: 0.35,
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t("scanner.itemsScanned", { count: totalQty })}
          </Box>
        )}
      </Box>

      {/* ── Bottom panel ────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: "background.paper", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <Divider />

        {/* Scanned list */}
        {scannedRows.length === 0 ? (
          <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 12 }}>
              {t("scanner.noItemsYet")}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: "auto", maxHeight: { xs: 200, sm: 240 } }}>
            {scannedRows.map((row, idx) => (
              <Box
                key={row.barcode}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 0.75,
                  gap: 1,
                  borderBottom: idx < scannedRows.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  bgcolor: lastAdded === row.barcode ? "action.selected" : "transparent",
                  transition: "background-color 150ms",
                }}
              >
                {/* Product name / barcode */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: row.product_id ? 500 : 400,
                      color: row.product_id ? "text.primary" : "text.secondary",
                    }}
                  >
                    {row.description}
                  </Typography>
                  {!row.product_id && (
                    <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
                      {t("scanner.unknownBarcode")}
                    </Typography>
                  )}
                </Box>

                {/* Qty stepper */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => updateQty(row.barcode, -1)}
                    sx={{ p: 0.5, color: "text.secondary" }}
                  >
                    <RemoveIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  {/* Tap the number to type a quantity directly */}
                  <TextField
                    value={editingQty[row.barcode] ?? String(row.qty)}
                    onChange={(e) => setQtyDirect(row.barcode, e.target.value)}
                    onFocus={(e) => {
                      setEditingQty((prev) => ({ ...prev, [row.barcode]: String(row.qty) }));
                      e.target.select();
                    }}
                    onBlur={() => commitQty(row.barcode)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitQty(row.barcode); }}
                    slotProps={{ htmlInput: { inputMode: "numeric" as const, style: { textAlign: "center" as const, fontSize: 13, fontWeight: 600, padding: "2px 0", width: 32 } } }}
                    variant="standard"
                    size="small"
                    sx={{ width: 32, "& .MuiInput-underline:before": { borderBottom: "1px solid transparent" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "1px solid" } }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => updateQty(row.barcode, 1)}
                    sx={{ p: 0.5, color: "text.secondary" }}
                  >
                    <AddIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>

                {/* Remove */}
                <IconButton
                  size="small"
                  onClick={() => removeRow(row.barcode)}
                  sx={{ p: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Divider />

        {/* Confirm button */}
        <Box sx={{ px: 2, py: 1.25 }}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            disableElevation
            onClick={handleConfirm}
            disabled={scannedRows.length === 0}
          >
            {scannedRows.length > 0
              ? t("scanner.addItems", { count: totalQty })
              : t("scanner.batchTitle")}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
