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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { useUpdateProduct } from "@/hooks/useProducts";
import type { Product } from "@/types";

type SortField = "sku" | "name_en" | "category" | "unit_price" | "stock_qty" | "status";
type SortDir = "asc" | "desc";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  compact?: boolean;
}

interface InlineEditState {
  id: string;
  field: "unit_price" | "stock_qty";
  value: string;
}

export default function ProductTable({ products, onEdit, onDelete, compact = false }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const updateProduct = useUpdateProduct();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sortField, setSortField] = useState<SortField>("sku");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(compact ? 25 : 20);
  const [editing, setEditing] = useState<InlineEditState | null>(null);

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

  const cellPy = compact ? 0.5 : 0.75;
  const fontSize = compact ? 12 : 13;

  // Columns visible on mobile: SKU, Name, Actions only
  const showCategory = !isMobile && !compact;
  const showSecondaryName = !isMobile;
  const showStatus = !isMobile;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ tableLayout: "fixed", minWidth: isMobile ? 340 : "auto" }}>
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 600, fontSize: fontSize, py: cellPy } }}>
            <TableCell sx={{ width: isMobile ? 80 : compact ? 90 : 100 }}>
              <TableSortLabel
                active={sortField === "sku"}
                direction={sortField === "sku" ? sortDir : "asc"}
                onClick={() => handleSort("sku")}
              >
                {t("products.sku")}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === "name_en"}
                direction={sortField === "name_en" ? sortDir : "asc"}
                onClick={() => handleSort("name_en")}
              >
                {t("products.name")}
              </TableSortLabel>
            </TableCell>
            {showCategory && (
              <TableCell sx={{ width: 120 }}>
                <TableSortLabel
                  active={sortField === "category"}
                  direction={sortField === "category" ? sortDir : "asc"}
                  onClick={() => handleSort("category")}
                >
                  {t("products.category")}
                </TableSortLabel>
              </TableCell>
            )}
            <TableCell align="right" sx={{ width: isMobile ? 70 : 90 }}>
              <TableSortLabel
                active={sortField === "unit_price"}
                direction={sortField === "unit_price" ? sortDir : "asc"}
                onClick={() => handleSort("unit_price")}
              >
                {isMobile ? t("products.price") : t("products.unitPrice")}
              </TableSortLabel>
            </TableCell>
            {!isMobile && (
              <TableCell align="right" sx={{ width: 80 }}>
                <TableSortLabel
                  active={sortField === "stock_qty"}
                  direction={sortField === "stock_qty" ? sortDir : "asc"}
                  onClick={() => handleSort("stock_qty")}
                >
                  {t("products.stockQty")}
                </TableSortLabel>
              </TableCell>
            )}
            {showStatus && (
              <TableCell sx={{ width: compact ? 70 : 80 }}>
                {t("common.status")}
              </TableCell>
            )}
            <TableCell align="right" sx={{ width: 68 }}>
              {t("common.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ "& td": { fontSize, py: cellPy } }}
            >
              {/* SKU */}
              <TableCell
                sx={{
                  fontFamily: "monospace",
                  fontSize: `${fontSize - 1}px !important`,
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.sku}
              </TableCell>

              {/* Name */}
              <TableCell sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={isAr && row.name_ar ? row.name_ar : row.name_en}
                >
                  {isAr && row.name_ar ? row.name_ar : row.name_en}
                </Box>
                {showSecondaryName && row.name_ar && row.name_en && (
                  <Box
                    sx={{
                      color: "text.disabled",
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={isAr ? row.name_en : row.name_ar ?? ""}
                  >
                    {isAr ? row.name_en : row.name_ar}
                  </Box>
                )}
              </TableCell>

              {/* Category */}
              {showCategory && (
                <TableCell
                  sx={{
                    color: "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.category || "—"}
                </TableCell>
              )}

              {/* Unit price — inline editable */}
              <TableCell align="right">
                {editing?.id === row.id && editing.field === "unit_price" ? (
                  <TextField
                    autoFocus
                    size="small"
                    type="number"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    slotProps={{ htmlInput: { style: { textAlign: "right", width: 70, padding: "2px 6px" } } }}
                    sx={{ "& .MuiOutlinedInput-root": { fontSize } }}
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

              {/* Stock qty — inline editable */}
              {!isMobile && (
                <TableCell align="right">
                  {editing?.id === row.id && editing.field === "stock_qty" ? (
                    <TextField
                      autoFocus
                      size="small"
                      type="number"
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      slotProps={{ htmlInput: { style: { textAlign: "right", width: 56, padding: "2px 6px" } } }}
                      sx={{ "& .MuiOutlinedInput-root": { fontSize } }}
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
              )}

              {/* Status */}
              {showStatus && (
                <TableCell>
                  <Chip
                    label={row.status === "active" ? t("products.active") : t("products.inactive")}
                    size="small"
                    sx={{
                      height: compact ? 18 : 20,
                      fontSize: 11,
                      borderRadius: 1,
                      bgcolor: row.status === "active" ? "success.100" : "action.selected",
                      color: row.status === "active" ? "success.dark" : "text.secondary",
                    }}
                  />
                </TableCell>
              )}

              {/* Actions */}
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Tooltip title={t("common.edit")}>
                  <IconButton size="small" onClick={() => onEdit(row)}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <IconButton size="small" onClick={() => onDelete(row)}>
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {paginated.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.disabled" }}>
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
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 25, 50]}
      />
    </Box>
  );
}
