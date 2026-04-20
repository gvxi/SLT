"use client";

import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import OmrSign from "@/components/OmrSign";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductGrid({ products, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
        {t("common.noData")}
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {products.map((p) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={p.id}>
          <Card
            variant="outlined"
            sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 1.5 }}
          >
            <CardContent sx={{ flex: 1, pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: 11, color: "text.secondary", pt: 0.25 }}
                >
                  {p.sku}
                </Typography>
                <Chip
                  label={p.status === "active" ? t("products.active") : t("products.inactive")}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    borderRadius: 1,
                    bgcolor: p.status === "active" ? "success.100" : "action.selected",
                    color: p.status === "active" ? "success.dark" : "text.secondary",
                  }}
                />
              </Box>

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.3,
                  mb: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={isAr && p.name_ar ? p.name_ar : p.name_en}
              >
                {isAr && p.name_ar ? p.name_ar : p.name_en}
              </Typography>
              {((isAr && p.name_en) || (!isAr && p.name_ar)) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.disabled",
                    fontSize: 12,
                    mb: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={isAr ? p.name_en : (p.name_ar ?? "")}
                >
                  {isAr ? p.name_en : p.name_ar}
                </Typography>
              )}

              {p.category && (
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12, mb: 1.5 }}>
                  {p.category}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 3, mt: "auto" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
                    {t("products.unitPrice")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    <OmrSign />{p.unit_price.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
                    {t("products.stockQty")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: p.stock_qty === 0 ? "error.main" : "inherit" }}
                  >
                    {p.stock_qty}
                  </Typography>
                </Box>
              </Box>
            </CardContent>

            <CardActions sx={{ px: 1.5, pt: 0, justifyContent: "flex-end" }}>
              <Tooltip title={t("common.edit")}>
                <IconButton size="small" onClick={() => onEdit(p)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("common.delete")}>
                <IconButton size="small" onClick={() => onDelete(p)}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
