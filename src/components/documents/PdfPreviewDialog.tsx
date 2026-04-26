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
  ButtonGroup,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/FileDownload";
import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import GavelIcon from "@mui/icons-material/Gavel";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
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
  const [shareMenuAnchor, setShareMenuAnchor] = useState<HTMLElement | null>(null);
  const [sharing, setSharing] = useState(false);

  const prevUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

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
      blobRef.current = blob;
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
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
        setBlobUrl(null);
        blobRef.current = null;
      }
    }
  }, [open, generate]);

  const fileName = `${invoice.invoice_number}.pdf`;

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

  // ── Share Sheet ────────────────────────────────────────────────────────────
  const getShareFile = useCallback((): File | null => {
    if (!blobRef.current) return null;
    return new File([blobRef.current], fileName, { type: "application/pdf" });
  }, [fileName]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  /** Download the PDF and attempt to open the native share sheet */
  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const file = getShareFile();
      if (canNativeShare && file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: invoice.invoice_number,
          files: [file],
        });
      } else {
        // Fallback: just download
        handleDownload();
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.warn("Share failed, falling back to download", e);
        handleDownload();
      }
    } finally {
      setSharing(false);
    }
  }, [canNativeShare, getShareFile, handleDownload, invoice.invoice_number]);

  /** Download + open WhatsApp with customer phone number pre-filled */
  const handleWhatsApp = useCallback(async () => {
    setShareMenuAnchor(null);
    // First download the file so the user has it
    handleDownload();

    // Build WhatsApp URL
    const rawPhone = invoice.phone_number?.replace(/\D/g, "") ?? "";
    const wa = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(t("pdfPreview.waMessage", { number: invoice.invoice_number, defaultValue: `Please find attached ${invoice.invoice_number}` }))}`
      : `https://wa.me/?text=${encodeURIComponent(t("pdfPreview.waMessage", { number: invoice.invoice_number, defaultValue: `Please find attached ${invoice.invoice_number}` }))}`;

    window.open(wa, "_blank", "noopener");
  }, [handleDownload, invoice.invoice_number, invoice.phone_number, t]);

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
        sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
      >
        <Toolbar sx={{ gap: 1, minHeight: "52px !important", px: 2 }}>
          <IconButton size="small" edge="start" onClick={onClose} sx={{ color: "text.primary" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", flex: 1 }}>
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

      {/* ── Bottom bar ── */}
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

        {/* Download + Share split button */}
        <ButtonGroup
          variant="contained"
          size="small"
          disableElevation
          disabled={!blobUrl || loading}
        >
          {/* Primary: Download & Share */}
          <Button
            startIcon={sharing ? <CircularProgress size={12} color="inherit" /> : <ShareIcon sx={{ fontSize: 15 }} />}
            onClick={handleShare}
            sx={{ fontSize: 12, textTransform: "none", py: 0.5, pl: 1.5 }}
          >
            {t("pdfPreview.share", { defaultValue: "Share" })}
          </Button>
          {/* Dropdown */}
          <Button
            size="small"
            sx={{ px: 0.5 }}
            onClick={(e) => setShareMenuAnchor(e.currentTarget)}
          >
            <ArrowDropDownIcon sx={{ fontSize: 18 }} />
          </Button>
        </ButtonGroup>

        {/* Download only button */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
          onClick={handleDownload}
          disabled={!blobUrl || loading}
          sx={{ fontSize: 12, textTransform: "none", py: 0.5 }}
        >
          {t("pdfPreview.download")}
        </Button>
      </Paper>

      {/* Share options menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={() => setShareMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        <MenuItem onClick={() => { setShareMenuAnchor(null); void handleShare(); }} dense>
          <ListItemIcon><ShareIcon sx={{ fontSize: 17 }} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>
            {t("pdfPreview.shareSystem", { defaultValue: "Download & Share" })}
          </ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { void handleWhatsApp(); }} dense>
          <ListItemIcon>
            <WhatsAppIcon sx={{ fontSize: 17, color: "#25D366" }} />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>
            {t("pdfPreview.sendWhatsApp", { defaultValue: "Download & Send via WhatsApp" })}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
}
