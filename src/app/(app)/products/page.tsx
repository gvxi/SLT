"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Typography,
  Skeleton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ProductMobileList from "@/components/products/ProductMobileList";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridViewIcon from "@mui/icons-material/GridView";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import ProductTable from "@/components/products/ProductTable";
import ProductGrid from "@/components/products/ProductGrid";
import ProductForm from "@/components/products/ProductForm";
import ProductCategories from "@/components/products/ProductCategories";
import ProductSummaryCards from "@/components/products/ProductSummaryCards";
import type { Product } from "@/types";

type ViewMode = "table" | "compact" | "grid";
type StockStatus = "all" | "in_stock" | "near_out" | "out_of_stock";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [tab, setTab] = useState(0);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterStock, setFilterStock] = useState<StockStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const searchParams = useSearchParams();
  const { replace: routerReplace } = useRouter();
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditProduct(null);
      setFormOpen(true);
      routerReplace("/products");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useProductCategories();
  const deleteProduct = useDeleteProduct();

  // Effective view: force grid on mobile
  const effectiveView: ViewMode = isMobile ? "grid" : view;

  const filtered = useMemo(() => {
    let result = products;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (filterCategory && filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (filterStock === "in_stock") {
      result = result.filter((p) => p.stock_qty > p.warning_limit_stock);
    } else if (filterStock === "near_out") {
      result = result.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.warning_limit_stock);
    } else if (filterStock === "out_of_stock") {
      result = result.filter((p) => p.stock_qty === 0);
    }
    return result;
  }, [products, search, filterCategory, filterStatus, filterStock]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditProduct(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.products")}
        </Typography>
        {tab === 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => { setEditProduct(null); setFormOpen(true); }}
          >
            {t("products.newProduct")}
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={t("nav.products")} sx={{ textTransform: "none", fontSize: 13, minHeight: 40 }} />
        <Tab label={t("categories.title")} sx={{ textTransform: "none", fontSize: 13, minHeight: 40 }} />
      </Tabs>

      {tab === 1 ? (
        <ProductCategories />
      ) : (
        <>
          {/* Summary cards */}
          <ProductSummaryCards
            products={products}
            activeFilter={filterStock}
            onFilter={setFilterStock}
          />

          {/* Toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 220 }}
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

            {/* Category filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: 13 }}>{t("products.category")}</InputLabel>
              <Select
                label={t("products.category")}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                sx={{ fontSize: 13 }}
              >
                <MenuItem value="all" sx={{ fontSize: 13 }}><em>{t("products.allCategories")}</em></MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.name} sx={{ fontSize: 13 }}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status filter */}
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: 13 }}>{t("products.filterStatus")}</InputLabel>
              <Select
                label={t("products.filterStatus")}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                sx={{ fontSize: 13 }}
              >
                <MenuItem value="all" sx={{ fontSize: 13 }}>{t("common.all")}</MenuItem>
                <MenuItem value="active" sx={{ fontSize: 13 }}>{t("products.active")}</MenuItem>
                <MenuItem value="inactive" sx={{ fontSize: 13 }}>{t("products.inactive")}</MenuItem>
              </Select>
            </FormControl>

            {/* View toggle — hidden on mobile (auto-grid) */}
            {!isMobile && (
              <ToggleButtonGroup
                value={view}
                exclusive
                size="small"
                onChange={(_, v) => { if (v) setView(v); }}
              >
                <ToggleButton value="table" sx={{ px: 1.5 }}>
                  <TableRowsIcon sx={{ fontSize: 18 }} />
                </ToggleButton>
                <ToggleButton value="compact" sx={{ px: 1.5 }}>
                  <DensitySmallIcon sx={{ fontSize: 18 }} />
                </ToggleButton>
                <ToggleButton value="grid" sx={{ px: 1.5 }}>
                  <GridViewIcon sx={{ fontSize: 18 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          {/* Content */}
          {isLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          ) : isMobile ? (
            <ProductMobileList products={filtered} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ) : effectiveView === "grid" ? (
            <ProductGrid products={filtered} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ) : (
            <ProductTable
              products={filtered}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              compact={effectiveView === "compact"}
            />
          )}
        </>
      )}

      {/* Form dialog */}
      <ProductForm
        open={formOpen}
        product={editProduct}
        onClose={handleCloseForm}
        allProducts={products}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15, pb: 1 }}>
          {t("common.confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("products.deleteConfirm", {
              name: deleteTarget
                ? (isAr && deleteTarget.name_ar ? deleteTarget.name_ar : deleteTarget.name_en)
                : "",
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setDeleteTarget(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteProduct.isPending}
            onClick={handleConfirmDelete}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


