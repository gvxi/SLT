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
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { useStorages, useStorageProducts } from "@/hooks/useStorages";
import type { LineItemDraft } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: LineItemDraft[]) => void;
  /** When set: only products from this storage are shown; no storage filter UI rendered */
  storageId?: string;
}

export default function ProductPickerDialog({ open, onClose, onConfirm, storageId }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: products = [] } = useProducts();
  const { data: storages = [] } = useStorages();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [filterStorage, setFilterStorage] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});

  // Effective storage for product filtering: locked prop OR user-selected pill
  const effectiveStorageId = storageId ?? filterStorage ?? undefined;
  const { data: storageProducts = [] } = useStorageProducts(effectiveStorageId);

  const storageProductIds = useMemo(
    () =>
      effectiveStorageId
        ? new Set(
            storageProducts
              .filter((sp) => (sp.qty ?? 0) > 0)
              .map((sp) => sp.product?.id)
              .filter(Boolean) as string[]
          )
        : null,
    [effectiveStorageId, storageProducts],
  );

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
      const matchStorage = !storageProductIds || storageProductIds.has(p.id);
      const matchCat = !category || p.category === category;
      const matchSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ar ?? "").includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q);
      return matchStorage && matchCat && matchSearch;
    });
  }, [activeProducts, storageProductIds, search, category]);

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
    setFilterStorage(null);
    setFiltersOpen(false);
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

      {/* Search + filters */}
      <Box sx={{ px: 2, pb: 1, pt: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
          {/* Filter toggle — only show when there are filters available */}
          {(categories.length > 0 || (!storageId && storages.length > 0)) && (
            <IconButton
              size="small"
              onClick={() => setFiltersOpen((v) => !v)}
              color={filtersOpen ? "primary" : "default"}
              sx={{ flexShrink: 0, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
            >
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>

        <Collapse in={filtersOpen}>
          <Box sx={{ pt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Category pills */}
            {categories.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  {t("products.category")}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
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
              </Box>
            )}

            {/* Storage pills — only when not locked by prop */}
            {!storageId && storages.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  {t("storages.fields.storage")}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  <Chip
                    label={t("common.all")}
                    size="small"
                    variant={filterStorage === null ? "filled" : "outlined"}
                    color={filterStorage === null ? "primary" : "default"}
                    onClick={() => setFilterStorage(null)}
                    sx={{ cursor: "pointer" }}
                  />
                  {storages.map((s) => (
                    <Chip
                      key={s.id}
                      label={(isAr && s.name_ar) ? s.name_ar : s.name_en}
                      size="small"
                      variant={filterStorage === s.id ? "filled" : "outlined"}
                      color={filterStorage === s.id ? "secondary" : "default"}
                      onClick={() => setFilterStorage(s.id === filterStorage ? null : s.id)}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Active filter summary chips (when filters are collapsed but active) */}
        {!filtersOpen && (category || filterStorage) && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.75 }}>
            {category && (
              <Chip
                label={category}
                size="small"
                color="primary"
                onDelete={() => setCategory(null)}
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
            {filterStorage && (
              <Chip
                label={(() => {
                  const s = storages.find((x) => x.id === filterStorage);
                  return s ? ((isAr && s.name_ar) ? s.name_ar : s.name_en) : filterStorage;
                })()}
                size="small"
                color="secondary"
                onDelete={() => setFilterStorage(null)}
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
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
