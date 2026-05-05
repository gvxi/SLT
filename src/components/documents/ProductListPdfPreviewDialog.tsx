"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/FileDownload";
import ShareIcon from "@mui/icons-material/Share";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
}

export default function ProductListPdfPreviewDialog({ open, onClose, products }: Props) {
  const { t, i18n } = useTranslation();

  const [lang, setLang] = useState<"en" | "ar">((i18n.language?.startsWith("ar") ? "ar" : "en") as "en" | "ar");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const prevUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const [{ pdf }, ReactLib, { ProductListPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("react"),
        import("@/components/documents/ProductListPdf"),
      ]);
      const el = ReactLib.createElement(ProductListPdfDocument, { products, language: lang });
      const blob = await pdf(el).toBlob();
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  }, [products, lang]);

  useEffect(() => {
    if (open) {
      void generate();
    } else {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
        setBlobUrl(null);
        blobRef.current = null;
      }
    }
  }, [open, generate]);

  const fileName = `products-list-${new Date().toISOString().slice(0, 10)}.pdf`;

  const handlePrint = () => {
    if (!blobUrl) return;
    const win = window.open(blobUrl, "_blank");
    win?.focus();
    setTimeout(() => win?.print(), 800);
  };

  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.click();
  }, [blobUrl, fileName]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = blobRef.current;
      if (canNativeShare && blob) {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: fileName, files: [file] });
          return;
        }
      }
      handleDownload();
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        handleDownload();
      }
    } finally {
      setSharing(false);
    }
  }, [canNativeShare, fileName, handleDownload]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { display: "flex", flexDirection: "column" } } }}
    >
      {/* Top bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
      >
        <Toolbar sx={{ gap: 1, minHeight: "52px !important", px: 2 }}>
          <IconButton size="small" edge="start" onClick={onClose} sx={{ color: "text.primary" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", flex: 1 }}>
            {t("products.pdfTitle", { count: products.length, defaultValue: `Products List (${products.length})` })}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* PDF preview */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          bgcolor: "#e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <CircularProgress size={32} />
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="PDF Preview"
          />
        ) : null}
      </Box>

      {/* Bottom bar */}
      <Paper
        elevation={0}
        square
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        {/* Language */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={lang}
          onChange={(_, v) => { if (v) setLang(v as "en" | "ar"); }}
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.4, fontSize: 12, textTransform: "none" } }}
        >
          <ToggleButton value="en">{t("pdfPreview.langEn")}</ToggleButton>
          <ToggleButton value="ar">{t("pdfPreview.langAr")}</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        {/* Print */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
          onClick={handlePrint}
          disabled={!blobUrl || loading}
          sx={{ fontSize: 12, textTransform: "none", py: 0.5 }}
        >
          {t("pdfPreview.print")}
        </Button>

        {/* Share */}
        <Button
          size="small"
          variant="outlined"
          startIcon={sharing ? <CircularProgress size={12} color="inherit" /> : <ShareIcon sx={{ fontSize: 15 }} />}
          onClick={() => { void handleShare(); }}
          disabled={!blobUrl || loading}
          sx={{ fontSize: 12, textTransform: "none", py: 0.5 }}
        >
          {t("pdfPreview.share")}
        </Button>

        {/* Download */}
        <Button
          size="small"
          variant="contained"
          disableElevation
          startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
          onClick={handleDownload}
          disabled={!blobUrl || loading}
          sx={{ fontSize: 12, textTransform: "none", py: 0.5 }}
        >
          {t("pdfPreview.download")}
        </Button>
      </Paper>
    </Dialog>
  );
}
