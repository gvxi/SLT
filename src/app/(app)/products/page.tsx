"use client";

export const dynamic = 'force-dynamic';

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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Paper,
  Slide,
  Menu,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import ProductMobileList from "@/components/products/ProductMobileList";
import CollapsibleFilters from "@/components/shared/CollapsibleFilters";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridViewIcon from "@mui/icons-material/GridView";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import FlipOutlinedIcon from "@mui/icons-material/FlipOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "react-i18next";
import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useStorages } from "@/hooks/useStorages";
import ProductTable from "@/components/products/ProductTable";
import ProductGrid from "@/components/products/ProductGrid";
import ProductForm from "@/components/products/ProductForm";
import ProductCategories from "@/components/products/ProductCategories";
import ProductSummaryCards from "@/components/products/ProductSummaryCards";
import { toast } from "@/store/toastStore";
import { apiFetch } from "@/lib/api";
import ProductListPdfPreviewDialog from "@/components/documents/ProductListPdfPreviewDialog";
import RestockDialog from "@/components/products/RestockDialog";
import RestockPdfPreviewDialog from "@/components/products/RestockPdfPreviewDialog";
import RestockReportsSection from "@/components/products/RestockReportsSection";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import type { Product, RestockReport } from "@/types";

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
  const [formViewMode, setFormViewMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectionIndex, setLastSelectionIndex] = useState<number | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchDuplicating, setBatchDuplicating] = useState(false);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [batchDeleteWarningOpen, setBatchDeleteWarningOpen] = useState(false);
  const [bulkActionsAnchor, setBulkActionsAnchor] = useState<HTMLElement | null>(null);
  const [batchStorageOpen, setBatchStorageOpen] = useState(false);
  const [batchStorageId, setBatchStorageId] = useState("");
  const [batchUpdatingStatus, setBatchUpdatingStatus] = useState(false);
  const [batchAssigningStorage, setBatchAssigningStorage] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewProducts, setPdfPreviewProducts] = useState<Product[]>([]);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockPdfReport, setRestockPdfReport] = useState<RestockReport | null>(null);

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
  const { data: storages = [] } = useStorages();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

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
    setFormViewMode(false);
    setFormOpen(true);
  };

  const handleView = (product: Product) => {
    setEditProduct(product);
    setFormViewMode(true);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditProduct(null);
    setFormViewMode(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggleSelect = (payload: {
    id: string;
    index: number;
    checked: boolean;
    shiftKey: boolean;
    orderedIds: string[];
  }) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (payload.checked) {
        if (payload.shiftKey && lastSelectionIndex !== null) {
          const start = Math.min(lastSelectionIndex, payload.index);
          const end = Math.max(lastSelectionIndex, payload.index);
          for (let i = start; i <= end; i++) {
            const id = payload.orderedIds[i];
            if (id) next.add(id);
          }
        } else {
          next.add(payload.id);
        }
      } else {
        next.delete(payload.id);
      }

      return Array.from(next);
    });
    setLastSelectionIndex(payload.index);
  };

  const handleToggleSelectAll = (orderedIds: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        orderedIds.forEach((id) => next.add(id));
      } else {
        orderedIds.forEach((id) => next.delete(id));
      }
      return Array.from(next);
    });
  };

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => products.some((p) => p.id === id)));
  }, [products]);

  const selectedProducts = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return selectedIds.map((id) => map.get(id)).filter((p): p is Product => !!p);
  }, [products, selectedIds]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const clearSelection = () => {
    setSelectedIds([]);
    setLastSelectionIndex(null);
  };

  const storageName = (nameEn: string, nameAr: string | null) =>
    (isAr && nameAr) ? nameAr : nameEn;

  const handleBatchDeleteClick = () => {
    if (selectedIds.length > 5) {
      setBatchDeleteWarningOpen(true);
      return;
    }
    setBatchDeleteConfirmOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct.mutateAsync(id)));
      clearSelection();
      setBatchDeleteConfirmOpen(false);
      setBatchDeleteWarningOpen(false);
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleBatchDuplicate = async () => {
    if (selectedProducts.length === 0) return;
    setBatchDuplicating(true);
    try {
      const numericSkus = products
        .map((p) => parseInt(p.sku.replace(/\D/g, ""), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      let nextSku = (numericSkus.length ? Math.max(...numericSkus) : 0) + 1;

      for (const p of selectedProducts) {
        await createProduct.mutateAsync({
          sku: String(nextSku).padStart(6, "0"),
          barcode: null,
          name_en: p.name_en,
          name_ar: p.name_ar ?? "",
          category: p.category ?? "",
          unit_price: p.unit_price,
          stock_qty: p.stock_qty,
          warning_limit_stock: p.warning_limit_stock,
          status: p.status,
        });
        nextSku += 1;
      }

      clearSelection();
    } finally {
      setBatchDuplicating(false);
    }
  };

  const handleBulkStatusUpdate = async (status: "active" | "inactive") => {
    if (selectedIds.length === 0) {
      toast(t("products.bulkSelectionRequired"), "error");
      return;
    }
    setBatchUpdatingStatus(true);
    try {
      await Promise.all(selectedIds.map((id) => updateProduct.mutateAsync({ id, status })));
      toast(t("products.bulkStatusUpdated", { count: selectedIds.length }), "success");
      clearSelection();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toast.error"), "error");
    } finally {
      setBatchUpdatingStatus(false);
    }
  };

  const handleOpenBatchStorage = () => {
    if (selectedIds.length === 0) {
      toast(t("products.bulkSelectionRequired"), "error");
      return;
    }
    setBulkActionsAnchor(null);
    setBatchStorageId("");
    setBatchStorageOpen(true);
  };

  const handleBatchAddToStorage = async () => {
    if (!batchStorageId || selectedProducts.length === 0) return;
    setBatchAssigningStorage(true);
    try {
      await Promise.all(
        selectedProducts.map((product) =>
          apiFetch("product-storages", {
            method: "POST",
            body: JSON.stringify({
              product_id: product.id,
              storage_id: batchStorageId,
              qty: product.stock_qty,
            }),
          })
        )
      );
      setBatchStorageOpen(false);
      toast(t("products.bulkStorageAssigned", { count: selectedProducts.length }), "success");
      clearSelection();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toast.error"), "error");
    } finally {
      setBatchAssigningStorage(false);
    }
  };

  const handleSelectAllToggle = () => {
    handleToggleSelectAll(filteredIds, !allFilteredSelected);
  };

  const handleInvertSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      });
      return Array.from(next);
    });
  };

  const handleToggleStatusQuick = async () => {
    if (selectedProducts.length === 0) {
      toast(t("products.bulkSelectionRequired"), "error");
      return;
    }
    const allActive = selectedProducts.every((p) => p.status === "active");
    await handleBulkStatusUpdate(allActive ? "inactive" : "active");
  };

  const handleExportSelectedPdf = () => {
    if (selectedProducts.length === 0) {
      toast(t("products.bulkSelectionRequired"), "error");
      return;
    }
    setPdfPreviewProducts(selectedProducts);
    setPdfPreviewOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.products")}
        </Typography>
        {tab === 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={t("products.restock")}>
              <IconButton
                size="small"
                onClick={() => setRestockOpen(true)}
                sx={{ border: 1, borderColor: "divider" }}
              >
                <SystemUpdateAltIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("products.bulkActions")}>
              <IconButton
                size="small"
                onClick={(e) => setBulkActionsAnchor(e.currentTarget)}
                sx={{ border: 1, borderColor: "divider" }}
              >
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setEditProduct(null); setFormOpen(true); }}
            >
              {t("products.newProduct")}
            </Button>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={bulkActionsAnchor}
        open={!!bulkActionsAnchor}
        onClose={() => setBulkActionsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={handleOpenBatchStorage}
          disabled={selectedIds.length === 0 || batchAssigningStorage || batchUpdatingStatus}
        >
          <ListItemIcon>
            <WarehouseOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t("products.bulkAddToStorage")}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setBulkActionsAnchor(null); void handleBulkStatusUpdate("active"); }}
          disabled={selectedIds.length === 0 || batchUpdatingStatus || batchAssigningStorage}
        >
          <ListItemIcon>
            <ToggleOnOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t("products.bulkActivate")}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setBulkActionsAnchor(null); void handleBulkStatusUpdate("inactive"); }}
          disabled={selectedIds.length === 0 || batchUpdatingStatus || batchAssigningStorage}
        >
          <ListItemIcon>
            <ToggleOffOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t("products.bulkDeactivate")}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={t("nav.products")} sx={{ textTransform: "none", fontSize: 13, minHeight: 40 }} />
        <Tab label={t("categories.title")} sx={{ textTransform: "none", fontSize: 13, minHeight: 40 }} />
        <Tab label={t("products.tabReports")} sx={{ textTransform: "none", fontSize: 13, minHeight: 40 }} />
      </Tabs>

      {tab === 1 ? (
        <ProductCategories />
      ) : tab === 2 ? (
        <RestockReportsSection onViewPdf={(r) => setRestockPdfReport(r)} />
      ) : (
        <>
          {/* Summary cards */}
          <ProductSummaryCards
            products={products}
            activeFilter={filterStock}
            onFilter={setFilterStock}
          />

          {/* Toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 180 }}
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

          {/* Collapsible filters */}
          <CollapsibleFilters activeCount={[(filterCategory !== "all" ? filterCategory : ""), (filterStatus !== "all" ? filterStatus : "")].filter(Boolean).length}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
              {/* Category filter */}
              <FormControl size="small" fullWidth>
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
              <FormControl size="small" fullWidth>
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
            </Box>
          </CollapsibleFilters>

          {/* Content */}
          {isLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          ) : isMobile ? (
            <ProductMobileList
              products={filtered}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ) : effectiveView === "grid" ? (
            <ProductGrid products={filtered} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ) : (
            <ProductTable
              products={filtered}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              compact={effectiveView === "compact"}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          )}
        </>
      )}

      <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 16,
            left: { xs: 12, sm: 24 },
            right: { xs: 12, sm: 24 },
            zIndex: (theme) => theme.zIndex.drawer + 2,
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("products.selectedCount", { count: selectedIds.length })}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
              onClick={clearSelection}
            >
              {t("products.bulkCancelSelection")}
            </Button>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="text"
              startIcon={<SelectAllIcon sx={{ fontSize: 16 }} />}
              onClick={handleSelectAllToggle}
            >
              {allFilteredSelected
                ? t("products.bulkUnselectAll")
                : t("products.bulkSelectAll")}
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<FlipOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleInvertSelection}
            >
              {t("products.bulkInvertSelection")}
            </Button>

            <Tooltip title={t("products.bulkDelete")}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleBatchDeleteClick}
                  disabled={batchDuplicating || batchDeleting || batchUpdatingStatus || batchAssigningStorage}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t("products.bulkDuplicate")}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleBatchDuplicate}
                  disabled={batchDuplicating || batchDeleting || batchUpdatingStatus || batchAssigningStorage}
                >
                  <ContentCopyIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={selectedProducts.every((p) => p.status === "active")
                ? t("products.bulkDeactivate")
                : t("products.bulkActivate")}
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => { void handleToggleStatusQuick(); }}
                  disabled={batchDuplicating || batchDeleting || batchUpdatingStatus || batchAssigningStorage}
                >
                  {selectedProducts.every((p) => p.status === "active")
                    ? <ToggleOffOutlinedIcon sx={{ fontSize: 18 }} />
                    : <ToggleOnOutlinedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t("products.bulkExportPdf")}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleExportSelectedPdf}
                  disabled={batchDuplicating || batchDeleting || batchUpdatingStatus || batchAssigningStorage}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Slide>

      {/* Form dialog */}
      <ProductForm
        open={formOpen}
        product={editProduct}
        onClose={handleCloseForm}
        allProducts={products}
        initialViewMode={formViewMode}
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

      <Dialog
        open={batchDeleteWarningOpen}
        onClose={() => setBatchDeleteWarningOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>
          {t("products.bulkDeleteWarningTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("products.bulkDeleteWarningBody", { count: selectedIds.length })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setBatchDeleteWarningOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setBatchDeleteWarningOpen(false);
              setBatchDeleteConfirmOpen(true);
            }}
          >
            {t("common.continue")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={batchDeleteConfirmOpen}
        onClose={() => setBatchDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>
          {t("common.confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("products.bulkDeleteConfirm", { count: selectedIds.length })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setBatchDeleteConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={batchDeleting}
            onClick={handleConfirmBatchDelete}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={batchStorageOpen}
        onClose={() => setBatchStorageOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>
          {t("products.bulkAddToStorage")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            {t("products.bulkStoragePrompt", { count: selectedIds.length })}
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("storages.fields.storage")}</InputLabel>
            <Select
              label={t("storages.fields.storage")}
              value={batchStorageId}
              onChange={(e) => setBatchStorageId(e.target.value)}
            >
              {storages.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {storageName(s.name_en, s.name_ar)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setBatchStorageOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!batchStorageId || batchAssigningStorage}
            onClick={handleBatchAddToStorage}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <ProductListPdfPreviewDialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        products={pdfPreviewProducts}
      />

      <RestockDialog
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
      />

      {restockPdfReport && (
        <RestockPdfPreviewDialog
          open={!!restockPdfReport}
          onClose={() => setRestockPdfReport(null)}
          report={restockPdfReport}
        />
      )}
    </Box>
  );
}


