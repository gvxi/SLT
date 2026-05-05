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
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslation } from "react-i18next";
import type { RestockReport } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  report: RestockReport;
}

export default function RestockPdfPreviewDialog({ open, onClose, report }: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<"en" | "ar">(
    (i18n.language?.startsWith("ar") ? "ar" : "en") as "en" | "ar"
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<HTMLElement | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const [{ pdf }, ReactLib, { RestockPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("react"),
        import("@/components/documents/RestockPdf"),
      ]);
      const el = ReactLib.createElement(RestockPdfDocument, { report, language: lang });
      const blob = await pdf(el).toBlob();
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      console.error("Restock PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  }, [report, lang]);

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

  const fileName = `${report.report_number}.pdf`;

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

  const getShareFile = useCallback((): File | null => {
    if (!blobRef.current) return null;
    return new File([blobRef.current], fileName, { type: "application/pdf" });
  }, [fileName]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const file = getShareFile();
      if (canNativeShare && file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: report.report_number, files: [file] });
      } else {
        handleDownload();
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        handleDownload();
      }
    } finally {
      setSharing(false);
    }
  }, [canNativeShare, getShareFile, handleDownload, report.report_number]);

  const handleWhatsApp = useCallback(() => {
    setShareMenuAnchor(null);
    handleDownload();
    const wa = `https://wa.me/?text=${encodeURIComponent(
      t("pdfPreview.waMessage", { number: report.report_number, defaultValue: `Please find attached ${report.report_number}` })
    )}`;
    window.open(wa, "_blank", "noopener");
  }, [handleDownload, report.report_number, t]);

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
            {report.report_number}
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
        {/* Language toggle */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={lang}
          onChange={(_, v: "en" | "ar") => { if (v) setLang(v); }}
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

        {/* Share split button */}
        <ButtonGroup
          variant="contained"
          size="small"
          disableElevation
          disabled={!blobUrl || loading}
        >
          <Button
            startIcon={sharing ? <CircularProgress size={12} color="inherit" /> : <ShareIcon sx={{ fontSize: 15 }} />}
            onClick={handleShare}
            sx={{ fontSize: 12, textTransform: "none", py: 0.5, pl: 1.5 }}
          >
            {t("pdfPreview.share", { defaultValue: "Share" })}
          </Button>
          <Button size="small" sx={{ px: 0.5 }} onClick={(e) => setShareMenuAnchor(e.currentTarget)}>
            <ArrowDropDownIcon sx={{ fontSize: 18 }} />
          </Button>
        </ButtonGroup>

        {/* Download */}
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
          <ListItemIcon><WhatsAppIcon sx={{ fontSize: 17, color: "#25D366" }} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>
            {t("pdfPreview.sendWhatsApp", { defaultValue: "Download & Send via WhatsApp" })}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
}
