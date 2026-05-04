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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/FileDownload";
import { useTranslation } from "react-i18next";
import type { StorageTransfer } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  transfer: StorageTransfer;
}

export default function TransferPdfPreviewDialog({ open, onClose, transfer }: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<"en" | "ar">(
    (i18n.language?.startsWith("ar") ? "ar" : "en") as "en" | "ar"
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const [{ pdf }, ReactLib, { StorageTransferPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("react"),
        import("@/components/documents/StorageTransferPdf"),
      ]);
      const el = ReactLib.createElement(StorageTransferPdfDocument, {
        transfer,
        language: lang,
      });
      const blob = await pdf(el).toBlob();
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      console.error("Transfer PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  }, [transfer, lang]);

  useEffect(() => {
    if (open) {
      generate();
    } else {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
        setBlobUrl(null);
        blobRef.current = null;
      }
    }
  }, [open, generate]);

  const fileName = `${transfer.transfer_number}.pdf`;

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

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { display: "flex", flexDirection: "column" } } }}
    >
      {/* ── Top bar ── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: "52px !important", px: 2 }}>
          <IconButton size="small" edge="start" onClick={onClose} sx={{ color: "text.primary" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", flex: 1 }}>
            {transfer.transfer_number}
          </Typography>

          {/* Language toggle */}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={lang}
            onChange={(_, v) => {
              if (v) setLang(v);
            }}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.4,
                fontSize: 12,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value="en">{t("pdfPreview.langEn")}</ToggleButton>
            <ToggleButton value="ar">{t("pdfPreview.langAr")}</ToggleButton>
          </ToggleButtonGroup>

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

          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
            onClick={handleDownload}
            disabled={!blobUrl || loading}
            sx={{ fontSize: 12, textTransform: "none", py: 0.5 }}
          >
            {t("pdfPreview.download")}
          </Button>
        </Toolbar>
      </AppBar>

      {/* ── PDF preview ── */}
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
            title="Transfer PDF Preview"
          />
        ) : null}
      </Box>
    </Dialog>
  );
}
