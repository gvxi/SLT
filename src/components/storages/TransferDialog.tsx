"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { useTranslation } from "react-i18next";
import { useStorages } from "@/hooks/useStorages";
import { useCreateTransfer } from "@/hooks/useStorageTransfers";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "@/store/toastStore";
import type { Product, StorageTransfer, LineItemDraft } from "@/types";
import TransferPdfPreviewDialog from "@/components/storages/TransferPdfPreviewDialog";
import ProductPickerDialog from "@/components/documents/ProductPickerDialog";
import BatchBarcodeScanner from "@/components/products/BatchBarcodeScanner";

interface TransferItem {
  product: Product;
  qty: number;
}

interface Props {
  open: boolean;
  defaultFromStorageId?: string;
  onClose: () => void;
}

export default function TransferDialog({ open, defaultFromStorageId, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: storages = [] } = useStorages();
  const { data: products = [] } = useProducts();
  const createTransfer = useCreateTransfer();

  const [fromId, setFromId] = useState(defaultFromStorageId ?? "");
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  const [createdTransfer, setCreatedTransfer] = useState<StorageTransfer | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );

  useEffect(() => {
    if (open) {
      setFromId(defaultFromStorageId ?? "");
      setToId("");
      setNotes("");
      setItems([]);
      setCreatedTransfer(null);
      setMenuAnchor(null);
      setPickerOpen(false);
      setScannerOpen(false);
    }
  }, [open, defaultFromStorageId]);

  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, patch: Partial<TransferItem>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const appendFromLineItems = (newItems: LineItemDraft[]) => {
    setItems((prev) => {
      const next = [...prev];
      newItems.forEach((item) => {
        if (!item.product_id || item.qty <= 0) return;
        const product = activeProducts.find((p) => p.id === item.product_id);
        if (!product) return;
        const existingIndex = next.findIndex((row) => row.product.id === product.id);
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            qty: next[existingIndex].qty + item.qty,
          };
        } else {
          next.push({ product, qty: item.qty });
        }
      });
      return next;
    });
  };

  const handlePickerConfirm = (pickedItems: LineItemDraft[]) => {
    appendFromLineItems(pickedItems);
  };

  const handleScannerConfirm = (scannedItems: LineItemDraft[]) => {
    appendFromLineItems(scannedItems);
    setScannerOpen(false);
  };

  const toStorages = storages.filter((s) => s.id !== fromId);
  const fromStorages = storages.filter((s) => s.id !== toId);

  const storageName = (nameEn: string, nameAr: string | null) =>
    (isAr && nameAr) ? nameAr : nameEn;
  const productName = (product: Product) =>
    (isAr && product.name_ar) ? product.name_ar : product.name_en;

  const isValid =
    !!fromId &&
    !!toId &&
    fromId !== toId &&
    items.length > 0 &&
    items.every((it) => it.qty > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const result = await createTransfer.mutateAsync({
        from_storage_id: fromId,
        to_storage_id: toId,
        notes: notes || null,
        items: items.map((it, idx) => ({
          product_id: it.product.id,
          qty: it.qty,
          sort_order: idx,
        })),
      });
      // Enrich the transfer result with storage/product details for PDF
      const fromStorage = storages.find((s) => s.id === fromId);
      const toStorage = storages.find((s) => s.id === toId);
      setCreatedTransfer({
        ...result,
        from_storage: fromStorage
          ? { id: fromStorage.id, name_en: fromStorage.name_en, name_ar: fromStorage.name_ar, icon: fromStorage.icon }
          : null,
        to_storage: toStorage
          ? { id: toStorage.id, name_en: toStorage.name_en, name_ar: toStorage.name_ar, icon: toStorage.icon }
          : null,
        storage_transfer_items: items.map((it, idx) => ({
          id: `tmp-${idx}`,
          transfer_id: result.id,
          product_id: it.product.id,
          qty: it.qty,
          sort_order: idx,
          created_at: result.created_at,
          product: {
            id: it.product.id,
            sku: it.product.sku,
            name_en: it.product.name_en,
            name_ar: it.product.name_ar,
            category: it.product.category,
            unit_price: it.product.unit_price,
          },
        })),
      });
      toast(t("transfers.created"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
    }
  };

  return (
    <>
      <Drawer
        anchor={i18n.language === "ar" ? "left" : "right"}
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 680 },
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t("transfers.title")}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        {createTransfer.error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
            {createTransfer.error instanceof Error
              ? createTransfer.error.message
              : t("common.error")}
          </Alert>
        )}

        {/* From / To */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
          <TextField
            select
            label={t("transfers.fields.from")}
            value={fromId}
            onChange={(e) => {
              setFromId(e.target.value);
              if (toId === e.target.value) setToId("");
            }}
            size="small"
            fullWidth
            disabled={!!defaultFromStorageId}
          >
            {fromStorages.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {storageName(s.name_en, s.name_ar)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("transfers.fields.to")}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            size="small"
            fullWidth
          >
            {toStorages.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {storageName(s.name_en, s.name_ar)}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {t("transfers.items")}
          </Typography>
          <Chip
            size="small"
            color={items.length > 0 ? "primary" : "default"}
            label={t("invoices.countSelected", { count: items.length })}
          />
        </Box>

        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{t("transfers.fields.product")}</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 100 }} align="right">
                {t("transfers.fields.qty")}
              </TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                      {productName(item.product)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {item.product.sku}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    slotProps={{ input: { inputProps: { min: 1 }, sx: { textAlign: "right" } } }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeRow(i)}
                    disabled={items.length === 1}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          size="small"
          variant="outlined"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          endIcon={<ArrowDropDownIcon />}
          sx={{ mb: 2 }}
        >
          {t("transfers.addItem")}
        </Button>

        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{ paper: { sx: { minWidth: 190 } } }}
        >
          <MenuItem onClick={() => { setPickerOpen(true); setMenuAnchor(null); }} dense>
            <ListItemIcon><SearchIcon sx={{ fontSize: 17 }} /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>
              {t("invoices.addBySearch")}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setScannerOpen(true); setMenuAnchor(null); }} dense>
            <ListItemIcon><QrCodeScannerIcon sx={{ fontSize: 17 }} /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>
              {t("invoices.addByScan")}
            </ListItemText>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
        </Menu>

        <TextField
          label={t("transfers.fields.notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          px: 2,
          py: 1.75,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button variant="outlined" onClick={onClose} disabled={createTransfer.isPending}>
          {t("common.cancel")}
        </Button>
        {createdTransfer ? (
          <>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
              onClick={() => setPdfOpen(true)}
              sx={{ fontSize: 13 }}
            >
              {t("transfers.viewPdf")}
            </Button>
            <Button variant="contained" color="success" onClick={onClose} sx={{ fontSize: 13 }}>
              {t("common.done")}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid || createTransfer.isPending}
            startIcon={
              createTransfer.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : undefined
            }
          >
            {t("transfers.submit")}
          </Button>
        )}
      </Box>
      </Drawer>

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

      {createdTransfer && (
        <TransferPdfPreviewDialog
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          transfer={createdTransfer}
        />
      )}
    </>
  );
}
