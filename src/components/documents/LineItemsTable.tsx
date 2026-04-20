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
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import BarcodeScanner from "@/components/products/BarcodeScanner";
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

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeProducts = products.filter((p) => p.status === "active");

  const update = (index: number, patch: Partial<LineItemDraft>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const handlePickerConfirm = (newItems: LineItemDraft[]) => {
    onChange([...items, ...newItems]);
  };

  const handleBarcodeDetect = (barcode: string) => {
    const found = activeProducts.find((p) => p.barcode === barcode);
    if (found) {
      onChange([...items, {
        product_id: found.id,
        description: (isAr && found.name_ar) ? found.name_ar : found.name_en,
        qty: 1,
        unit_price: found.unit_price,
      }]);
    } else {
      onChange([...items, { product_id: null, description: barcode, qty: 1, unit_price: 0 }]);
    }
    setScannerOpen(false);
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
      </Menu>

      {/* Barcode scanner dialog */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetect={handleBarcodeDetect}
      />

      {/* Product picker dialog */}
      <ProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />
    </Box>
  );
}
