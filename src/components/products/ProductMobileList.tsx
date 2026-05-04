"use client";

import { Box, Typography, IconButton, Chip, Divider, Checkbox } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import OmrSign from "@/components/OmrSign";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  selectedIds?: string[];
  onToggleSelect?: (payload: {
    id: string;
    index: number;
    checked: boolean;
    shiftKey: boolean;
    orderedIds: string[];
  }) => void;
  onToggleSelectAll?: (orderedIds: string[], checked: boolean) => void;
}

interface ProductRowProps {
  product: Product;
  index: number;
  orderedIds: string[];
  selected: boolean;
  onToggleSelect?: (payload: {
    id: string;
    index: number;
    checked: boolean;
    shiftKey: boolean;
    orderedIds: string[];
  }) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductRow({
  product,
  index,
  orderedIds,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: ProductRowProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const name = isAr && product.name_ar ? product.name_ar : product.name_en;

  return (
    <Box sx={{ px: 2, py: 1.25 }}>
      <Box
        onClick={onView}
        sx={{
          display: "grid",
          gridTemplateColumns: "36px 72px minmax(0,1fr) auto",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:active": { opacity: 0.85 },
        }}
      >
        <Box onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="small"
            checked={selected}
            onChange={(e) => {
              onToggleSelect?.({
                id: product.id,
                index,
                checked: e.target.checked,
                shiftKey: !!(e.nativeEvent as MouseEvent).shiftKey,
                orderedIds,
              });
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: 11 }}
        >
          {product.sku}
        </Typography>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.35 }}>
            <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary" }}>
              <OmrSign />{product.unit_price.toFixed(2)}
            </Typography>
            <Chip
              label={product.status === "active" ? t("products.active") : t("products.inactive")}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                borderRadius: 0.75,
                bgcolor: product.status === "active" ? "success.100" : "action.selected",
                color: product.status === "active" ? "success.dark" : "text.secondary",
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
      <Divider sx={{ mt: 1.25 }} />
    </Box>
  );
}

export default function ProductMobileList({
  products,
  onView,
  onEdit,
  onDelete,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const { t } = useTranslation();
  const orderedIds = products.map((p) => p.id);
  const selectedInView = orderedIds.filter((id) => selectedIds.includes(id)).length;
  const allInViewSelected = orderedIds.length > 0 && selectedInView === orderedIds.length;
  const someInViewSelected = selectedInView > 0 && !allInViewSelected;

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
        {t("common.noData")}
      </Box>
    );
  }

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "36px 72px minmax(0,1fr) auto",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 0.75,
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Checkbox
          size="small"
          checked={allInViewSelected}
          indeterminate={someInViewSelected}
          onChange={(e) => onToggleSelectAll?.(orderedIds, e.target.checked)}
        />
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
          {t("products.sku")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
          {t("products.name")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
          {t("common.actions")}
        </Typography>
      </Box>

      {products.map((p, index) => (
        <ProductRow
          key={p.id}
          product={p}
          index={index}
          orderedIds={orderedIds}
          selected={selectedIds.includes(p.id)}
          onToggleSelect={onToggleSelect}
          onView={() => onView(p)}
          onEdit={() => onEdit(p)}
          onDelete={() => onDelete(p)}
        />
      ))}
    </Box>
  );
}
