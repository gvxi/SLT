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
  Tooltip,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/FileDownload";
import GavelIcon from "@mui/icons-material/Gavel";
import { useTranslation } from "react-i18next";
import type { Invoice } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export default function PdfPreviewDialog({ open, onClose, invoice }: Props) {
  const { t, i18n } = useTranslation();

  const [lang, setLang] = useState<"en" | "ar">((i18n.language?.startsWith("ar") ? "ar" : "en") as "en" | "ar");
  const [docType, setDocType] = useState<"invoice" | "quotation">("invoice");
  const [showRules, setShowRules] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prevUrlRef = useRef<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const [{ pdf }, ReactLib, { InvoicePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("react"),
        import("@/components/documents/InvoicePdf"),
      ]);
      const el = ReactLib.createElement(InvoicePdfDocument, {
        invoice,
        language: lang,
        docType,
        showRules,
      });
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      // revoke old
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  }, [invoice, lang, docType, showRules]);

  // Generate when dialog opens or options change
  useEffect(() => {
    if (open) {
      generate();
    } else {
      // cleanup on close
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
        setBlobUrl(null);
      }
    }
  }, [open, generate]);

  const handlePrint = () => {
    if (!blobUrl) return;
    const win = window.open(blobUrl, "_blank");
    win?.focus();
    // short delay to let PDF load in new tab
    setTimeout(() => win?.print(), 800);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${invoice.invoice_number}.pdf`;
    a.click();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { display: "flex", flexDirection: "column" } } }}
    >
      {/* ── Top bar: close + title only ── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
      >
        <Toolbar sx={{ gap: 1, minHeight: "52px !important", px: 2 }}>
          <IconButton size="small" edge="start" onClick={onClose} sx={{ color: "text.primary" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            {invoice.invoice_number}
          </Typography>
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
            title="PDF Preview"
          />
        ) : null}
      </Box>

      {/* ── Bottom bar: toggles + actions ── */}
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
          onChange={(_, v) => { if (v) setLang(v); }}
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.4, fontSize: 12, textTransform: "none" } }}
        >
          <ToggleButton value="en">{t("pdfPreview.langEn")}</ToggleButton>
          <ToggleButton value="ar">{t("pdfPreview.langAr")}</ToggleButton>
        </ToggleButtonGroup>

        {/* Doc type */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={docType}
          onChange={(_, v) => { if (v) setDocType(v); }}
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.4, fontSize: 12, textTransform: "none" } }}
        >
          <ToggleButton value="invoice">{t("pdfPreview.invoice")}</ToggleButton>
          <ToggleButton value="quotation">{t("pdfPreview.quotation")}</ToggleButton>
        </ToggleButtonGroup>

        {/* Rules */}
        <Tooltip title={showRules ? t("pdfPreview.rulesHide") : t("pdfPreview.rulesShow")}>
          <ToggleButton
            size="small"
            value="rules"
            selected={showRules}
            onChange={() => setShowRules((v) => !v)}
            sx={{ px: 1.5, py: 0.4, fontSize: 12, textTransform: "none" }}
          >
            <GavelIcon sx={{ fontSize: 14, mr: 0.5 }} />
            {t("pdfPreview.rules")}
          </ToggleButton>
        </Tooltip>

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

        {/* Download */}
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
      </Paper>
    </Dialog>
  );
}
