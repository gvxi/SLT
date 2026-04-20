"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  Box,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import type { Product } from "@/types";

type SortField = "sku" | "name_en" | "category" | "unit_price" | "stock_qty" | "status";
type SortDir = "asc" | "desc";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
}

interface InlineEditState {
  id: string;
  field: "unit_price" | "stock_qty";
  value: string;
}

export default function ProductTable({ products, onEdit }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [sortField, setSortField] = useState<SortField>("sku");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [editing, setEditing] = useState<InlineEditState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...products].sort((a, b) => {
    const av = a[sortField] ?? "";
    const bv = b[sortField] ?? "";
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const startEdit = useCallback((id: string, field: "unit_price" | "stock_qty", value: number) => {
    setEditing({ id, field, value: String(value) });
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editing) return;
    const num = parseFloat(editing.value);
    if (!isNaN(num)) {
      await updateProduct.mutateAsync({ id: editing.id, [editing.field]: num });
    }
    setEditing(null);
  }, [editing, updateProduct]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteProduct.mutateAsync(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const cols: { id: SortField; label: string; align?: "right" }[] = [
    { id: "sku", label: t("products.sku") },
    { id: "name_en", label: t("products.name") },
    { id: "category", label: t("products.category") },
    { id: "unit_price", label: t("products.unitPrice"), align: "right" },
    { id: "stock_qty", label: t("products.stockQty"), align: "right" },
    { id: "status", label: t("common.status") },
  ];

  return (
    <Box>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 13, py: 1 } }}>
            {cols.map((col) => (
              <TableCell key={col.id} align={col.align}>
                <TableSortLabel
                  active={sortField === col.id}
                  direction={sortField === col.id ? sortDir : "asc"}
                  onClick={() => handleSort(col.id)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell align="right" sx={{ width: 80 }}>
              {t("common.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ "& td": { fontSize: 13, py: 0.75 } }}
            >
              <TableCell sx={{ fontFamily: "monospace", fontSize: "12px !important", color: "text.secondary" }}>
                {row.sku}
              </TableCell>
              <TableCell>
                {isAr && row.name_ar ? row.name_ar : row.name_en}
                {row.name_ar && row.name_en && (
                  <Box component="span" sx={{ color: "text.disabled", ml: 1, fontSize: 11 }}>
                    {isAr ? row.name_en : row.name_ar}
                  </Box>
                )}
              </TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{row.category || "—"}</TableCell>
              <TableCell align="right">
                {editing?.id === row.id && editing.field === "unit_price" ? (
                  <TextField
                    autoFocus
                    size="small"
                    type="number"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                    slotProps={{ htmlInput: { style: { textAlign: "right", width: 80, padding: "2px 6px" } } }}
                    sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                  />
                ) : (
                  <Box
                    component="span"
                    sx={{ cursor: "text", "&:hover": { textDecoration: "underline dotted" } }}
                    onDoubleClick={() => startEdit(row.id, "unit_price", row.unit_price)}
                    title={t("products.doubleClickEdit")}
                  >
                    {row.unit_price.toFixed(2)}
                  </Box>
                )}
              </TableCell>
              <TableCell align="right">
                {editing?.id === row.id && editing.field === "stock_qty" ? (
                  <TextField
                    autoFocus
                    size="small"
                    type="number"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                    slotProps={{ htmlInput: { style: { textAlign: "right", width: 64, padding: "2px 6px" } } }}
                    sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                  />
                ) : (
                  <Box
                    component="span"
                    sx={{
                      cursor: "text",
                      color: row.stock_qty === 0 ? "error.main" : "inherit",
                      "&:hover": { textDecoration: "underline dotted" },
                    }}
                    onDoubleClick={() => startEdit(row.id, "stock_qty", row.stock_qty)}
                    title={t("products.doubleClickEdit")}
                  >
                    {row.stock_qty}
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={row.status === "active" ? t("products.active") : t("products.inactive")}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    borderRadius: 1,
                    bgcolor: row.status === "active" ? "success.100" : "action.selected",
                    color: row.status === "active" ? "success.dark" : "text.secondary",
                  }}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title={t("common.edit")}>
                  <IconButton size="small" onClick={() => onEdit(row)}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={deleteConfirm === row.id ? t("common.confirm") : t("common.delete")}>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(row.id)}
                    sx={{ color: deleteConfirm === row.id ? "error.main" : "inherit" }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {paginated.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.disabled" }}>
                {t("common.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
      />
    </Box>
  );
}
