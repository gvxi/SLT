"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types";

type StockStatus = "all" | "in_stock" | "near_out" | "out_of_stock";

interface Props {
  products: Product[];
  activeFilter: StockStatus;
  onFilter: (status: StockStatus) => void;
}

export default function ProductSummaryCards({ products, activeFilter, onFilter }: Props) {
  const { t } = useTranslation();

  const counts = useMemo(() => {
    let inStock = 0;
    let nearOut = 0;
    let outOfStock = 0;
    for (const p of products) {
      if (p.stock_qty === 0) outOfStock++;
      else if (p.stock_qty <= p.warning_limit_stock) nearOut++;
      else inStock++;
    }
    return { inStock, nearOut, outOfStock };
  }, [products]);

  const tiles = [
    {
      key: "in_stock" as StockStatus,
      label: t("products.inStock"),
      count: counts.inStock,
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
      color: "success.main",
      activeBg: "success.main",
    },
    {
      key: "near_out" as StockStatus,
      label: t("products.nearOut"),
      count: counts.nearOut,
      icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
      color: "warning.main",
      activeBg: "warning.main",
    },
    {
      key: "out_of_stock" as StockStatus,
      label: t("products.outOfStock"),
      count: counts.outOfStock,
      icon: <RemoveShoppingCartIcon sx={{ fontSize: 18 }} />,
      color: "error.main",
      activeBg: "error.main",
    },
  ];

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
      {tiles.map((tile) => {
        const isActive = activeFilter === tile.key;
        return (
          <Box
            key={tile.key}
            onClick={() => onFilter(isActive ? "all" : tile.key)}
            sx={{
              flex: "1 1 100px",
              minWidth: 100,
              cursor: "pointer",
              border: "1px solid",
              borderColor: isActive ? tile.activeBg : "divider",
              borderRadius: 1.5,
              px: 1.75,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              bgcolor: isActive ? `${tile.activeBg}` : "background.paper",
              color: isActive ? "#fff" : "text.primary",
              transition: "border-color 0.15s, background-color 0.15s",
              userSelect: "none",
              "&:hover": {
                borderColor: isActive ? tile.activeBg : tile.color,
              },
            }}
          >
            <Box sx={{ color: isActive ? "rgba(255,255,255,0.85)" : tile.color, lineHeight: 0 }}>
              {tile.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: 15,
                  lineHeight: 1.2,
                  color: isActive ? "#fff" : "text.primary",
                }}
              >
                {tile.count}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11,
                  color: isActive ? "rgba(255,255,255,0.8)" : "text.secondary",
                  display: "block",
                  whiteSpace: "nowrap",
                }}
              >
                {tile.label}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
