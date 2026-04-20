"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import type { LineItemDraft } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: LineItemDraft[]) => void;
}

export default function ProductPickerDialog({ open, onClose, onConfirm }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: products = [] } = useProducts();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );

  const categories = useMemo(() => {
    const cats = [...new Set(activeProducts.map((p) => p.category).filter(Boolean))];
    return cats.sort();
  }, [activeProducts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return activeProducts.filter((p) => {
      const matchCat = !category || p.category === category;
      const matchSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ar ?? "").includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeProducts, search, category]);

  const selectedCount = useMemo(
    () => Object.values(qty).filter((v) => v > 0).length,
    [qty],
  );

  const setItemQty = (id: string, value: number) =>
    setQty((prev) => ({ ...prev, [id]: Math.max(0, value) }));

  const handleConfirm = () => {
    const items: LineItemDraft[] = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = activeProducts.find((x) => x.id === id)!;
        return {
          product_id: p.id,
          description: (isAr && p.name_ar) ? p.name_ar : p.name_en,
          qty: q,
          unit_price: p.unit_price,
        };
      });
    onConfirm(items);
    reset();
  };

  const reset = () => {
    setSearch("");
    setCategory(null);
    setQty({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={reset}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { height: "80vh", display: "flex", flexDirection: "column", m: { xs: 1, sm: 2 } } } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 15 }}>
          {t("invoices.selectProducts")}
        </Typography>
        {selectedCount > 0 && (
          <Chip
            label={t("invoices.countSelected", { count: selectedCount })}
            color="primary"
            size="small"
          />
        )}
        <IconButton size="small" onClick={reset}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* Search + category filters */}
      <Box sx={{ px: 2, pb: 1.5, pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t("invoices.searchProducts")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        {categories.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1.25 }}>
            <Chip
              label={t("invoices.allCategories")}
              size="small"
              variant={category === null ? "filled" : "outlined"}
              color={category === null ? "primary" : "default"}
              onClick={() => setCategory(null)}
              sx={{ cursor: "pointer" }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                variant={category === cat ? "filled" : "outlined"}
                color={category === cat ? "primary" : "default"}
                onClick={() => setCategory(cat === category ? null : cat)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Product list */}
      <DialogContent dividers sx={{ p: 0, flex: 1, overflow: "auto" }}>
        {filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "text.disabled", fontSize: 13 }}>
            {t("invoices.noProductsFound")}
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((product) => {
              const q = qty[product.id] ?? 0;
              const isSelected = q > 0;
              return (
                <ListItem
                  key={product.id}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: isSelected ? "action.selected" : "transparent",
                    transition: "background 0.15s",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {(isAr && product.name_ar) ? product.name_ar : product.name_en}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", mt: 0.25, flexWrap: "wrap" }}>
                        <Typography component="span" sx={{ fontSize: 11, color: "text.disabled" }}>
                          {product.sku}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 11, color: "text.disabled" }}>·</Typography>
                        <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>
                          {product.unit_price.toFixed(3)}
                        </Typography>
                        {product.stock_qty <= product.warning_limit_stock && (
                          <Chip
                            label={`${product.stock_qty}`}
                            size="small"
                            color="warning"
                            sx={{ height: 16, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }}
                          />
                        )}
                      </Box>
                    }
                  />

                  {/* Qty stepper */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1, flexShrink: 0 }}>
                    {isSelected ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => setItemQty(product.id, q - 1)}
                          sx={{ width: 28, height: 28, border: "1px solid", borderColor: "divider" }}
                        >
                          <RemoveIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Typography sx={{ minWidth: 28, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
                          {q}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setItemQty(product.id, q + 1)}
                          sx={{ width: 28, height: 28, bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}
                        >
                          <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => setItemQty(product.id, 1)}
                        sx={{ width: 32, height: 32, border: "1px dashed", borderColor: "primary.main", color: "primary.main" }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={reset} variant="outlined" size="small" color="inherit">
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="small"
          disabled={selectedCount === 0}
        >
          {t("invoices.addSelected", { count: selectedCount })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
