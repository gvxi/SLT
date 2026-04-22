"use client";

import { useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useTranslation } from "react-i18next";
import { useProducts, useCreateProduct } from "@/hooks/useProducts";
import { toast } from "@/store/toastStore";
import BatchBarcodeScanner from "@/components/products/BatchBarcodeScanner";
import ProductPickerDialog from "@/components/documents/ProductPickerDialog";
import type { LineItemDraft } from "@/types";

interface Props {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
}

export default function LineItemsTable({ items, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: products = [] } = useProducts();
  const createProduct = useCreateProduct();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Save-as-product dialog state
  const [saveDialogIndex, setSaveDialogIndex] = useState<number | null>(null);
  const [saveForm, setSaveForm] = useState({ name_en: "", sku: "", sale_price: "" });

  const activeProducts = products.filter((p) => p.status === "active");

  const update = (index: number, patch: Partial<LineItemDraft>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const handlePickerConfirm = (newItems: LineItemDraft[]) => {
    onChange([...items, ...newItems]);
  };

  const handleBarcodeDetectBatch = (newItems: LineItemDraft[]) => {
    onChange([...items, ...newItems]);
    setScannerOpen(false);
  };

  const addManualItem = () => {
    onChange([...items, { product_id: null, description: "", qty: 1, unit_price: 0 }]);
    setMenuAnchor(null);
  };

  const openSaveDialog = (index: number) => {
    const item = items[index];
    setSaveForm({ name_en: item.description, sku: "", sale_price: String(item.unit_price) });
    setSaveDialogIndex(index);
  };

  const handleSaveAsProduct = async () => {
    if (saveDialogIndex === null) return;
    try {
      const created = await createProduct.mutateAsync({
        name_en: saveForm.name_en.trim(),
        sku: saveForm.sku.trim() || undefined,
        unit_price: saveForm.sale_price ? Number(saveForm.sale_price) : 0,
        status: "active",
      });
      update(saveDialogIndex, { product_id: created.id });
      toast(t("products.savedAsProduct", { defaultValue: "Saved as product" }), "success");
      setSaveDialogIndex(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toast.error"), "error");
    }
  };

  return (
    <Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 440, "& td, & th": { px: 1, py: 0.75, fontSize: 13 } }}>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 600, color: "text.secondary", borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" } }}>
              <TableCell sx={{ width: 28, textAlign: "center" }}>#</TableCell>
              <TableCell>{t("invoices.description")}</TableCell>
              <TableCell sx={{ width: "12%", textAlign: "right" }}>{t("invoices.qty")}</TableCell>
              <TableCell sx={{ width: "18%", textAlign: "right" }}>{t("invoices.unitPrice")}</TableCell>
              <TableCell sx={{ width: "18%", textAlign: "right" }}>{t("invoices.lineTotal")}</TableCell>
              <TableCell sx={{ width: 36 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => {
              const linked = item.product_id
                ? activeProducts.find((p) => p.id === item.product_id)
                : null;
              return (
                <TableRow key={i} sx={{ "&:last-child td": { borderBottom: "none" } }}>
                  {/* # */}
                  <TableCell sx={{ textAlign: "center", color: "text.disabled", fontWeight: 600, fontSize: 11 }}>
                    {i + 1}
                  </TableCell>

                  {/* Description + optional product badge */}
                  <TableCell>
                    <TextField
                      value={item.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      size="small"
                      fullWidth
                      variant="standard"
                      slotProps={{ input: { disableUnderline: true, sx: { fontSize: 13 } } }}
                      placeholder={t("invoices.descriptionPlaceholder")}
                    />
                    {linked && (
                      <Typography sx={{ fontSize: 10, color: "text.disabled", mt: 0.25, lineHeight: 1 }}>
                        {linked.sku}
                      </Typography>
                    )}
                    {/* Save-as-product chip for manual items */}
                    {!item.product_id && item.description.trim() && (
                      <Chip
                        icon={<SaveOutlinedIcon sx={{ fontSize: 12 }} />}
                        label={t("products.saveAsProduct", { defaultValue: "Save as product" })}
                        size="small"
                        variant="outlined"
                        onClick={() => openSaveDialog(i)}
                        sx={{ mt: 0.5, fontSize: 10, height: 20, cursor: "pointer", color: "primary.main", borderColor: "primary.light", "& .MuiChip-icon": { color: "primary.main" } }}
                      />
                    )}
                  </TableCell>

                  {/* Qty */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.qty}
                      onChange={(e) => update(i, { qty: Math.max(0, Number(e.target.value)) })}
                      size="small"
                      variant="standard"
                      slotProps={{ input: { disableUnderline: true, sx: { fontSize: 13 } } }}
                      sx={{ width: 56, "& input": { textAlign: "right" } }}
                    />
                  </TableCell>

                  {/* Unit price */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => update(i, { unit_price: Math.max(0, Number(e.target.value)) })}
                      size="small"
                      variant="standard"
                      slotProps={{ input: { disableUnderline: true, sx: { fontSize: 13 } } }}
                      sx={{ width: 80, "& input": { textAlign: "right" } }}
                    />
                  </TableCell>

                  {/* Line total */}
                  <TableCell sx={{ textAlign: "right" }}>
                    <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                      {(item.qty * item.unit_price).toFixed(3)}
                    </Typography>
                  </TableCell>

                  {/* Delete */}
                  <TableCell sx={{ pr: 0 }}>
                    <IconButton size="small" onClick={() => remove(i)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Add item button — opens dropdown */}
      <Box
        component="button"
        type="button"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.25,
          py: 0.75,
          width: "100%",
          cursor: "pointer",
          color: "primary.main",
          fontSize: 13,
          fontFamily: "inherit",
          border: "none",
          bgcolor: "transparent",
          borderTop: "1px solid",
          borderColor: "divider",
          textAlign: "left",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <AddIcon sx={{ fontSize: 16 }} />
        {t("invoices.addItem")}
        <ArrowDropDownIcon sx={{ fontSize: 16, ml: "auto" }} />
      </Box>

      {/* Dropdown menu */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 190 } } }}
      >
        <MenuItem onClick={() => { setPickerOpen(true); setMenuAnchor(null); }} dense>
          <ListItemIcon><SearchIcon sx={{ fontSize: 17 }} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>{t("invoices.addBySearch")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setScannerOpen(true); setMenuAnchor(null); }} dense>
          <ListItemIcon><QrCodeScannerIcon sx={{ fontSize: 17 }} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>{t("invoices.addByScan")}</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={addManualItem} dense>
          <ListItemIcon><EditOutlinedIcon sx={{ fontSize: 17 }} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13 } } }}>{t("invoices.addManually", { defaultValue: "Add manually" })}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Barcode scanner dialog (batch mode) */}
      <BatchBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleBarcodeDetectBatch}
      />

      {/* Product picker dialog */}
      <ProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />

      {/* Save-as-product dialog */}
      <Dialog open={saveDialogIndex !== null} onClose={() => setSaveDialogIndex(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 600, pb: 1 }}>
          {t("products.saveAsProduct", { defaultValue: "Save as product" })}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
          <TextField
            label={t("products.nameEn")}
            size="small"
            fullWidth
            value={saveForm.name_en}
            onChange={(e) => setSaveForm((f) => ({ ...f, name_en: e.target.value }))}
            autoFocus
          />
          <TextField
            label={t("products.sku")}
            size="small"
            fullWidth
            value={saveForm.sku}
            onChange={(e) => setSaveForm((f) => ({ ...f, sku: e.target.value }))}
          />
          <TextField
            label={t("products.salePrice")}
            size="small"
            fullWidth
            type="number"
            value={saveForm.sale_price}
            onChange={(e) => setSaveForm((f) => ({ ...f, sale_price: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setSaveDialogIndex(null)}>{t("common.cancel")}</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSaveAsProduct}
            disabled={!saveForm.name_en.trim() || createProduct.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
