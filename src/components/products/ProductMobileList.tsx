"use client";

import { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Drawer,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeIcon from "@mui/icons-material/QrCode";
import OmrSign from "@/components/OmrSign";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ACTION_WIDTH = 80;

interface SwipeableRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

function SwipeableRow({ product, onEdit, onDelete, onPreview }: SwipeableRowProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const lastTouchX = useRef(0);
  const totalMovement = useRef(0);
  const wasSwipe = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchX.current = e.touches[0].clientX;
    totalMovement.current = 0;
    wasSwipe.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastTouchX.current;
    lastTouchX.current = e.touches[0].clientX;
    totalMovement.current += Math.abs(dx);
    if (totalMovement.current > 4) wasSwipe.current = true;
    setOffset((prev) => Math.max(-ACTION_WIDTH, Math.min(0, prev + dx)));
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setOffset((prev) => (Math.abs(prev) < ACTION_WIDTH / 2 ? 0 : -ACTION_WIDTH));
  }, []);

  const handleClick = () => {
    if (wasSwipe.current) return;
    if (offset !== 0) {
      setOffset(0);
    } else {
      onPreview();
    }
  };

  const name = isAr && product.name_ar ? product.name_ar : product.name_en;

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      {/* Revealed action buttons */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: ACTION_WIDTH,
          display: "flex",
        }}
      >
        <Box
          onClick={onEdit}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            cursor: "pointer",
            "&:active": { bgcolor: "primary.dark" },
          }}
        >
          <EditIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box
          onClick={onDelete}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "error.main",
            color: "error.contrastText",
            cursor: "pointer",
            "&:active": { bgcolor: "error.dark" },
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* Row content */}
      <Box
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 180ms ease",
          bgcolor: "background.paper",
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          position: "relative",
          zIndex: 1,
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: "pointer",
          "&:active": { bgcolor: "action.hover" },
        }}
      >
        {/* SKU */}
        <Typography
          variant="caption"
          sx={{
            fontFamily: "monospace",
            color: "text.disabled",
            fontSize: 11,
            minWidth: 52,
            flexShrink: 0,
          }}
        >
          {product.sku}
        </Typography>

        {/* Name */}
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 13,
          }}
        >
          {name}
        </Typography>

        {/* Price */}
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}
        >
          <OmrSign />{product.unit_price.toFixed(2)}
        </Typography>

        {/* Status chip */}
        <Chip
          label={
            product.status === "active"
              ? t("products.active")
              : t("products.inactive")
          }
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            borderRadius: 0.75,
            bgcolor:
              product.status === "active" ? "success.100" : "action.selected",
            color:
              product.status === "active" ? "success.dark" : "text.secondary",
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Divider */}
      <Divider sx={{ ml: 2 }} />
    </Box>
  );
}

// Product detail preview sheet
function ProductPreview({
  product,
  onClose,
  onEdit,
}: {
  product: Product | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <Drawer
      anchor="bottom"
      open={!!product}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "12px 12px 0 0",
            maxHeight: "70vh",
          },
        },
      }}
    >
      {product && (
        <Box>
          {/* Drag handle */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25, pb: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: "action.disabled",
              }}
            />
          </Box>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              pb: 1.5,
            }}
          >
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: 15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {isAr && product.name_ar ? product.name_ar : product.name_en}
              </Typography>
              {product.name_ar && product.name_en && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.disabled",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isAr ? product.name_en : product.name_ar}
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Divider />

          {/* Details */}
          <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Row label={t("products.sku")} value={product.sku} mono />

            {product.barcode && (
              <Row
                label={t("products.barcode")}
                value={product.barcode}
                mono
                icon={<QrCodeIcon sx={{ fontSize: 14, color: "text.disabled", mr: 0.5 }} />}
              />
            )}

            {product.category && (
              <Row label={t("products.category")} value={product.category} />
            )}

            <Row
              label={t("products.unitPrice")}
              value={product.unit_price.toFixed(2)}
            />

            <Row
              label={t("products.stockQty")}
              value={String(product.stock_qty)}
              valueColor={product.stock_qty === 0 ? "error.main" : undefined}
            />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
                {t("common.status")}
              </Typography>
              <Chip
                label={
                  product.status === "active"
                    ? t("products.active")
                    : t("products.inactive")
                }
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  borderRadius: 1,
                  bgcolor:
                    product.status === "active"
                      ? "success.100"
                      : "action.selected",
                  color:
                    product.status === "active"
                      ? "success.dark"
                      : "text.secondary",
                }}
              />
            </Box>
          </Box>

          {/* Edit button */}
          <Box sx={{ px: 2.5, pb: 3 }}>
            <Box
              onClick={onEdit}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                py: 1,
                textAlign: "center",
                cursor: "pointer",
                color: "text.secondary",
                fontSize: 13,
                "&:active": { bgcolor: "action.hover" },
              }}
            >
              {t("common.edit")}
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

function Row({
  label,
  value,
  mono,
  valueColor,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {icon}
        <Typography
          variant="body2"
          sx={{
            fontFamily: mono ? "monospace" : undefined,
            fontSize: mono ? 12 : 13,
            color: valueColor,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProductMobileList({ products, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<Product | null>(null);

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
        {t("common.noData")}
      </Box>
    );
  }

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
      {/* Column headers */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 0.75,
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled", minWidth: 52, fontSize: 11 }}>
          {t("products.sku")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled", flex: 1, fontSize: 11 }}>
          {t("products.name")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
          {t("products.price")}
        </Typography>
      </Box>

      {products.map((p) => (
        <SwipeableRow
          key={p.id}
          product={p}
          onEdit={() => onEdit(p)}
          onDelete={() => onDelete(p)}
          onPreview={() => setPreview(p)}
        />
      ))}

      <ProductPreview
        product={preview}
        onClose={() => setPreview(null)}
        onEdit={() => {
          if (preview) {
            onEdit(preview);
            setPreview(null);
          }
        }}
      />
    </Box>
  );
}
