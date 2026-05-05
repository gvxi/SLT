"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  CircularProgress,
  Grid,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { useCreateRestockReport } from "@/hooks/useRestock";
import { useUIStore } from "@/store/uiStore";
import ProductPickerDialog from "@/components/documents/ProductPickerDialog";
import BatchBarcodeScanner from "@/components/products/BatchBarcodeScanner";
import DiscardChangesDialog from "@/components/documents/DiscardChangesDialog";
import RestockPdfPreviewDialog from "@/components/products/RestockPdfPreviewDialog";
import type { LineItemDraft, Product, RestockReport } from "@/types";

interface RestockRow {
  key: string;
  product: Product | null;
  barcode?: string;
  qtyBefore: number;
  qtyAfter: number;
  sortOrder: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RestockDialog({ open, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { language } = useUIStore();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateRestockReport();

  const [rows, setRows] = useState<RestockRow[]>([]);
  const [notes, setNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [createdReport, setCreatedReport] = useState<RestockReport | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // POS scan state
  const [qtyStr, setQtyStr] = useState("1");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Re-focus barcode field when dialog opens
  useEffect(() => {
    if (open && !createdReport) {
      setTimeout(() => barcodeRef.current?.focus(), 120);
    }
  }, [open, createdReport]);

  const isDirty = rows.length > 0 || notes.trim() !== "";
  const hasUnknown = rows.some((r) => r.product === null);

  const handleAttemptClose = () => {
    if (createdReport) {
      doClose();
    } else if (isDirty) {
      setConfirmCloseOpen(true);
    } else {
      doClose();
    }
  };

  const doClose = () => {
    setRows([]);
    setNotes("");
    setCreatedReport(null);
    setPdfOpen(false);
    setQtyStr("1");
    setBarcodeInput("");
    setScannerOpen(false);
    onClose();
  };

  // ── Numpad helpers ─────────────────────────────────────────────
  const numpadPress = useCallback((key: string) => {
    setQtyStr((prev) => {
      if (key === "⌫") return prev.length > 1 ? prev.slice(0, -1) : "1";
      if (key === "C") return "1";
      const next = prev === "1" && key !== "0" ? key : prev + key;
      const num = parseInt(next, 10);
      if (isNaN(num) || num < 1) return "1";
      if (num > 9999) return prev;
      return String(num);
    });
    barcodeRef.current?.focus();
  }, []);

  const qtyNum = Math.max(1, parseInt(qtyStr, 10) || 1);

  // ── Barcode/SKU scan logic ──────────────────────────────────────
  const commitScan = useCallback(() => {
    const raw = barcodeInput.trim();
    if (!raw) return;

    const qty = qtyNum;
    const product =
      products.find((p) => p.barcode === raw) ??
      products.find((p) => p.sku.toLowerCase() === raw.toLowerCase()) ??
      null;

    setRows((prev) => {
      const next = [...prev];
      if (product) {
        const idx = next.findIndex((r) => r.product?.id === product.id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], qtyAfter: next[idx].qtyAfter + qty };
          return next;
        }
      }
      next.push({
        key: product
          ? `${product.id}-${Date.now()}`
          : `unknown-${raw}-${Date.now()}`,
        product,
        barcode: product ? undefined : raw,
        qtyBefore: product?.stock_qty ?? 0,
        qtyAfter: (product?.stock_qty ?? 0) + (product ? qty : 0),
        sortOrder: next.length,
      });
      return next;
    });

    // Reset for next scan
    setBarcodeInput("");
    setQtyStr("1");
    barcodeRef.current?.focus();
  }, [barcodeInput, qtyNum, products]);

  const mergeLineItems = (lineItems: LineItemDraft[]) => {
    setRows((prev) => {
      const next = [...prev];
      lineItems.forEach((item, i) => {
        if (item.product_id) {
          const product = products.find((p) => p.id === item.product_id) ?? null;
          const existing = next.findIndex((r) => r.product?.id === item.product_id);
          if (existing >= 0) {
            next[existing] = {
              ...next[existing],
              qtyAfter: next[existing].qtyAfter + item.qty,
            };
          } else {
            next.push({
              key: `${item.product_id}-${Date.now()}-${i}`,
              product,
              qtyBefore: product?.stock_qty ?? 0,
              qtyAfter: (product?.stock_qty ?? 0) + item.qty,
              sortOrder: next.length,
            });
          }
        } else {
          next.push({
            key: `unknown-${item.description}-${Date.now()}-${i}`,
            product: null,
            barcode: item.description,
            qtyBefore: 0,
            qtyAfter: 0,
            sortOrder: next.length,
          });
        }
      });
      return next;
    });
  };

  const handlePickerConfirm = (lineItems: LineItemDraft[]) => {
    mergeLineItems(lineItems);
    setPickerOpen(false);
    setTimeout(() => barcodeRef.current?.focus(), 120);
  };

  const handleScannerConfirm = (lineItems: LineItemDraft[]) => {
    mergeLineItems(lineItems);
    setScannerOpen(false);
    setTimeout(() => barcodeRef.current?.focus(), 120);
  };

  const handleQtyAfterChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, qtyAfter: isNaN(num) ? 0 : num } : r))
    );
  };

  const handleRemoveRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.product !== null);
    try {
      const report = await createMutation.mutateAsync({
        notes: notes.trim() || null,
        items: validRows.map((r, idx) => ({
          product_id: r.product!.id,
          qty_before: r.qtyBefore,
          qty_after: r.qtyAfter,
          sort_order: idx,
        })),
      });
      setCreatedReport(report);
    } catch {
      // error handled by mutate
    }
  };

  const productName = (row: RestockRow) => {
    if (!row.product) return row.barcode ?? "?";
    return isAr && row.product.name_ar ? row.product.name_ar : row.product.name_en;
  };

  const deltaDisplay = (row: RestockRow) => {
    const delta = row.qtyAfter - row.qtyBefore;
    return delta >= 0 ? `+${delta}` : String(delta);
  };

  const submitDisabled =
    rows.length === 0 || hasUnknown || createMutation.isPending;

  const submitted = !!createdReport;

  // ── Numpad layout ──────────────────────────────────────────────
  const NUMPAD_KEYS = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["C", "0", "⌫"],
  ];
  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={handleAttemptClose}
        slotProps={{ paper: { sx: { display: "flex", flexDirection: "column" } } }}
      >
        {/* ── AppBar ── */}
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
            <IconButton
              size="small"
              edge="start"
              onClick={handleAttemptClose}
              sx={{ color: "text.primary" }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: "text.primary", flex: 1 }}
            >
              {t("restock.title")}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* ── Body ── */}
        <Box sx={{ flex: 1, overflow: "auto", p: { xs: 1.5, sm: 2 } }}>
          {/* ── POS Scan Station ── */}
          {!submitted && (
            <Paper
              variant="outlined"
              sx={{ mb: 2, p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}
            >
              <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
                {/* Left: numpad + qty display */}
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {/* Qty display */}
                    <Paper
                      variant="outlined"
                      sx={{
                        width: 160,
                        py: 1.5,
                        textAlign: "center",
                        borderRadius: 1.5,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 36,
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: 2,
                          fontFamily: "monospace",
                        }}
                      >
                        {qtyStr}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("restock.qty")}
                      </Typography>
                    </Paper>

                    {/* Numpad grid */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 0.75,
                        width: 160,
                      }}
                    >
                      {NUMPAD_KEYS.flat().map((key) => (
                        <Button
                          key={key}
                          variant={key === "C" ? "outlined" : "contained"}
                          color={key === "C" ? "warning" : key === "⌫" ? "error" : "primary"}
                          size="small"
                          onClick={() => numpadPress(key)}
                          sx={{
                            minWidth: 0,
                            height: 44,
                            fontSize: key === "⌫" ? 0 : 18,
                            fontWeight: 600,
                            fontFamily: "monospace",
                            p: 0,
                          }}
                        >
                          {key === "⌫" ? (
                            <BackspaceOutlinedIcon sx={{ fontSize: 20 }} />
                          ) : (
                            key
                          )}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Right: barcode input + add-by-picker */}
                <Grid size={{ xs: 12, sm: "grow" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      height: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ mb: -0.5 }}>
                      {t("restock.scanOrType")}
                    </Typography>
                    <TextField
                      inputRef={barcodeRef}
                      fullWidth
                      size="small"
                      placeholder={t("restock.barcodePlaceholder")}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitScan();
                        }
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <QrCodeScannerIcon
                              sx={{ fontSize: 18, color: "text.secondary", mr: 1 }}
                            />
                          ),
                        },
                      }}
                      sx={{ "& input": { fontFamily: "monospace", letterSpacing: 1 } }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={commitScan}
                      disabled={!barcodeInput.trim()}
                      sx={{ fontWeight: 700, fontSize: 16 }}
                    >
                      {t("restock.add")} ×{qtyStr}
                    </Button>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setPickerOpen(true)}
                      >
                        {t("restock.addProducts")}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<QrCodeScannerIcon />}
                        onClick={() => setScannerOpen(true)}
                      >
                        {t("restock.scanBarcodes")}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Items table */}
          {rows.length > 0 && (
            <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t("products.sku")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("products.name")}</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                      {t("restock.qtyBefore")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                      {t("restock.qtyAfter")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                      {t("restock.delta")}
                    </TableCell>
                    {!submitted && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                        {row.product?.sku ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {row.product === null && (
                            <WarningAmberIcon
                              sx={{ fontSize: 16, color: "warning.main" }}
                            />
                          )}
                          <span style={{ fontSize: 13 }}>{productName(row)}</span>
                          {row.product === null && (
                            <Chip
                              label={t("restock.unknownProduct")}
                              size="small"
                              color="warning"
                              sx={{ fontSize: 10, height: 18 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontSize: 13 }}>
                        {row.qtyBefore}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        {submitted ? (
                          <Typography variant="body2">{row.qtyAfter}</Typography>
                        ) : (
                          <TextField
                            type="number"
                            size="small"
                            value={row.qtyAfter}
                            onChange={(e) => handleQtyAfterChange(row.key, e.target.value)}
                            disabled={row.product === null}
                            slotProps={{
                              htmlInput: { min: 0, style: { textAlign: "right", width: 64 } },
                            }}
                            sx={{ "& input": { py: 0.5 } }}
                          />
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            row.qtyAfter - row.qtyBefore >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {deltaDisplay(row)}
                      </TableCell>
                      {!submitted && (
                        <TableCell sx={{ width: 36 }}>
                          <Tooltip title={t("common.remove")}>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRow(row.key)}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Unknown items warning banner */}
          {hasUnknown && (
            <Box
              sx={{
                bgcolor: "warning.light",
                color: "warning.contrastText",
                px: 2,
                py: 1,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                fontSize: 13,
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 18 }} />
              {t("restock.unknownWarning")}
            </Box>
          )}

          {/* Notes */}
          {!submitted && (
            <TextField
              label={t("common.notes")}
              multiline
              minRows={2}
              maxRows={5}
              fullWidth
              size="small"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
          {submitted && createdReport?.notes && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("common.notes")}
              </Typography>
              <Typography variant="body2">{createdReport.notes}</Typography>
            </Box>
          )}
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
            flexShrink: 0,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ flex: 1 }} />

          {submitted ? (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                onClick={() => setPdfOpen(true)}
                sx={{ textTransform: "none" }}
              >
                {t("restock.viewPdf")}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={doClose}
                sx={{ textTransform: "none" }}
              >
                {t("common.done")}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={submitDisabled}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
              sx={{ textTransform: "none" }}
            >
              {t("restock.submit")}
            </Button>
          )}
        </Paper>
      </Dialog>

      {/* Sub-dialogs */}
      <ProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />
      <BatchBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleScannerConfirm}
      />
      <DiscardChangesDialog
        open={confirmCloseOpen}
        onKeep={() => setConfirmCloseOpen(false)}
        onDiscard={() => {
          setConfirmCloseOpen(false);
          doClose();
        }}
      />
      {createdReport && (
        <RestockPdfPreviewDialog
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          report={createdReport}
        />
      )}
    </>
  );
}
