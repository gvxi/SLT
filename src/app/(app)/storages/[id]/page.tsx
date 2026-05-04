"use client";

import { use, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/EditOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useStorage, useStorageProducts } from "@/hooks/useStorages";
import { StorageIconDisplay } from "@/components/storages/StorageIconPicker";
import StorageForm from "@/components/storages/StorageForm";
import TransferDialog from "@/components/storages/TransferDialog";
import CollapsibleFilters from "@/components/shared/CollapsibleFilters";
import type { ProductStorage } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

type StockStatus = "all" | "in_stock" | "near_out" | "out_of_stock";
type SortField = "sku" | "name" | "category" | "qty" | "unit_price";
type SortDir = "asc" | "desc";

type StorageProductRow = {
  ps: ProductStorage;
  p: {
    id: string;
    sku: string;
    name_en: string;
    name_ar?: string | null;
    category?: string | null;
    unit_price: number;
    stock_qty: number;
    warning_limit_stock?: number;
    status?: "active" | "inactive";
  };
};

export default function StorageDetailPage({ params }: Props) {
  const { id } = use(params);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();

  const { data: storage, isLoading: storageLoading } = useStorage(id);
  const { data: products = [], isLoading: productsLoading } = useStorageProducts(id);

  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterStock, setFilterStock] = useState<StockStatus>("all");
  const [sortField, setSortField] = useState<SortField>("sku");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = useMemo<StorageProductRow[]>(() => {
    const mapped: StorageProductRow[] = [];
    for (const ps of products) {
      const p = ps.product as StorageProductRow["p"] | null | undefined;
      if (!p) continue;
      mapped.push({ ps, p });
    }
    return mapped;
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.p.category).filter(Boolean) as string[])).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(({ p }) => {
        const name = isAr && p.name_ar ? p.name_ar : p.name_en;
        return (
          p.sku.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      });
    }

    if (filterCategory !== "all") {
      list = list.filter(({ p }) => p.category === filterCategory);
    }

    if (filterStatus !== "all") {
      list = list.filter(({ p }) => p.status === filterStatus);
    }

    if (filterStock === "in_stock") {
      list = list.filter(({ p }) => p.stock_qty > (p.warning_limit_stock ?? 0));
    } else if (filterStock === "near_out") {
      list = list.filter(({ p }) => p.stock_qty > 0 && p.stock_qty <= (p.warning_limit_stock ?? 0));
    } else if (filterStock === "out_of_stock") {
      list = list.filter(({ p }) => p.stock_qty === 0);
    }

    return list;
  }, [rows, search, isAr, filterCategory, filterStatus, filterStock]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const nameA = isAr && a.p.name_ar ? a.p.name_ar : a.p.name_en;
      const nameB = isAr && b.p.name_ar ? b.p.name_ar : b.p.name_en;

      let cmp = 0;
      if (sortField === "qty") {
        cmp = a.ps.qty - b.ps.qty;
      } else if (sortField === "unit_price") {
        cmp = a.p.unit_price - b.p.unit_price;
      } else if (sortField === "name") {
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === "category") {
        cmp = (a.p.category ?? "").localeCompare(b.p.category ?? "");
      } else {
        cmp = a.p.sku.localeCompare(b.p.sku);
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRows, isAr, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDir("asc");
  };

  if (storageLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!storage) {
    return <Alert severity="error">{t("common.notFound")}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => router.push("/storages")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <StorageIconDisplay icon={storage.icon} size={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {storage.name_en}
          </Typography>
          {storage.name_ar && (
            <Typography variant="caption" sx={{ color: "text.secondary" }} dir="rtl">
              {storage.name_ar}
            </Typography>
          )}
        </Box>
        <Chip
          label={t("storages.itemCount", { count: storage.item_count ?? 0 })}
          size="small"
          color={(storage.item_count ?? 0) === 0 ? "warning" : "default"}
          variant="outlined"
        />
        <Button
          variant="outlined"
          startIcon={<SwapHorizIcon />}
          size="small"
          onClick={() => setTransferOpen(true)}
        >
          {t("transfers.moveItems")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          size="small"
          onClick={() => setEditOpen(true)}
        >
          {t("common.edit")}
        </Button>
      </Box>

      {storage.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {storage.description}
        </Typography>
      )}

      {/* Products table */}
      {productsLoading ? (
        <CircularProgress size={24} />
      ) : rows.length === 0 ? (
        <Alert severity="info">{t("storages.noProducts")}</Alert>
      ) : (
        <>
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
          </Box>

          <CollapsibleFilters
            activeCount={[
              filterCategory !== "all" ? filterCategory : "",
              filterStatus !== "all" ? filterStatus : "",
              filterStock !== "all" ? filterStock : "",
            ].filter(Boolean).length}
          >
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.25 }}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>{t("products.category")}</InputLabel>
                <Select
                  label={t("products.category")}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  sx={{ fontSize: 13 }}
                >
                  <MenuItem value="all" sx={{ fontSize: 13 }}>
                    <em>{t("products.allCategories")}</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category} sx={{ fontSize: 13 }}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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

              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>{t("products.stockQty")}</InputLabel>
                <Select
                  label={t("products.stockQty")}
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value as StockStatus)}
                  sx={{ fontSize: 13 }}
                >
                  <MenuItem value="all" sx={{ fontSize: 13 }}>{t("common.all")}</MenuItem>
                  <MenuItem value="in_stock" sx={{ fontSize: 13 }}>{t("products.inStock")}</MenuItem>
                  <MenuItem value="near_out" sx={{ fontSize: 13 }}>{t("products.nearOut")}</MenuItem>
                  <MenuItem value="out_of_stock" sx={{ fontSize: 13 }}>{t("products.outOfStock")}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CollapsibleFilters>

          {sortedRows.length === 0 ? (
            <Alert severity="info">{t("common.noData")}</Alert>
          ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                  <TableSortLabel
                    active={sortField === "sku"}
                    direction={sortField === "sku" ? sortDir : "asc"}
                    onClick={() => handleSort("sku")}
                  >
                    {t("products.sku")}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                  <TableSortLabel
                    active={sortField === "name"}
                    direction={sortField === "name" ? sortDir : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    {t("products.name")}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                  <TableSortLabel
                    active={sortField === "category"}
                    direction={sortField === "category" ? sortDir : "asc"}
                    onClick={() => handleSort("category")}
                  >
                    {t("products.category")}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">
                  <TableSortLabel
                    active={sortField === "qty"}
                    direction={sortField === "qty" ? sortDir : "asc"}
                    onClick={() => handleSort("qty")}
                  >
                    {t("storages.fields.qty")}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">
                  <TableSortLabel
                    active={sortField === "unit_price"}
                    direction={sortField === "unit_price" ? sortDir : "asc"}
                    onClick={() => handleSort("unit_price")}
                  >
                    {t("products.unitPrice")}
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map(({ ps, p }) => {
                return (
                  <TableRow key={ps.id} hover>
                    <TableCell sx={{ fontSize: 12 }}>{p.sku}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500 }}>
                          {isAr && p.name_ar ? p.name_ar : p.name_en}
                        </Typography>
                        {p.name_ar && !isAr && (
                          <Typography variant="caption" sx={{ color: "text.secondary" }} dir="rtl">
                            {p.name_ar}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.category ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: 12 }} align="right">
                      <Tooltip title={t("storages.fields.qtyInStorage")}>
                        <span>{ps.qty}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }} align="right">
                      {p.unit_price.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
          )}
        </>
      )}

      <StorageForm open={editOpen} storage={storage} onClose={() => setEditOpen(false)} />
      <TransferDialog
        open={transferOpen}
        defaultFromStorageId={id}
        onClose={() => setTransferOpen(false)}
      />
    </Box>
  );
}
