"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useTranslation } from "react-i18next";
import { useStorages } from "@/hooks/useStorages";
import { useCreateTransfer } from "@/hooks/useStorageTransfers";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "@/store/toastStore";
import type { Product, StorageTransfer } from "@/types";
import TransferPdfPreviewDialog from "@/components/storages/TransferPdfPreviewDialog";

interface TransferItem {
  product: Product | null;
  qty: number;
}

interface Props {
  open: boolean;
  defaultFromStorageId?: string;
  onClose: () => void;
}

export default function TransferDialog({ open, defaultFromStorageId, onClose }: Props) {
  const { t } = useTranslation();
  const { data: storages = [] } = useStorages();
  const { data: products = [] } = useProducts();
  const createTransfer = useCreateTransfer();

  const [fromId, setFromId] = useState(defaultFromStorageId ?? "");
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([{ product: null, qty: 1 }]);
  const [createdTransfer, setCreatedTransfer] = useState<StorageTransfer | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFromId(defaultFromStorageId ?? "");
      setToId("");
      setNotes("");
      setItems([{ product: null, qty: 1 }]);
      setCreatedTransfer(null);
    }
  }, [open, defaultFromStorageId]);

  const addRow = () => setItems((prev) => [...prev, { product: null, qty: 1 }]);

  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, patch: Partial<TransferItem>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const toStorages = storages.filter((s) => s.id !== fromId);
  const fromStorages = storages.filter((s) => s.id !== toId);

  const isValid =
    !!fromId &&
    !!toId &&
    fromId !== toId &&
    items.length > 0 &&
    items.every((it) => it.product && it.qty > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const result = await createTransfer.mutateAsync({
        from_storage_id: fromId,
        to_storage_id: toId,
        notes: notes || null,
        items: items.map((it, idx) => ({
          product_id: it.product!.id,
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
          product_id: it.product!.id,
          qty: it.qty,
          sort_order: idx,
          created_at: result.created_at,
          product: it.product
            ? {
                id: it.product.id,
                sku: it.product.sku,
                name_en: it.product.name_en,
                name_ar: it.product.name_ar,
                category: it.product.category,
                unit_price: it.product.unit_price,
              }
            : undefined,
        })),
      });
      toast(t("transfers.created"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t("transfers.title")}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
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
                {s.name_en}
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
                {s.name_en}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Items table */}
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
                  <Autocomplete
                    size="small"
                    options={products}
                    getOptionLabel={(p) => `${p.sku} – ${p.name_en}`}
                    value={item.product}
                    onChange={(_, val) => updateItem(i, { product: val })}
                    renderInput={(params) => (
                      <TextField {...params} placeholder={t("transfers.fields.selectProduct")} />
                    )}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    fullWidth
                  />
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

        <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ mb: 2 }}>
          {t("transfers.addItem")}
        </Button>

        <TextField
          label={t("transfers.fields.notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
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
      </DialogActions>

      {createdTransfer && (
        <TransferPdfPreviewDialog
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          transfer={createdTransfer}
        />
      )}
    </Dialog>
  );
}
