"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Typography,
  IconButton,
  Divider,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CasinoIcon from "@mui/icons-material/Casino";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import BarcodeScanner from "./BarcodeScanner";
import { useTranslation } from "react-i18next";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import type { Product } from "@/types";

const schema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  name_en: z.string().min(1),
  name_ar: z.string(),
  category: z.string(),
  unit_price: z.number({ message: "Required" }).min(0),
  stock_qty: z.number({ message: "Required" }).int().min(0),
  warning_limit_stock: z.number({ message: "Required" }).int().min(0),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  allProducts?: Product[];
  initialViewMode?: boolean;
}

function generateEAN13(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const checksum = digits.reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (checksum % 10)) % 10;
  return [...digits, check].join("");
}

export default function ProductForm({ open, product, onClose, allProducts = [], initialViewMode }: Props) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useProductCategories();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode ?? false);

  useEffect(() => {
    if (open) setViewMode(initialViewMode ?? false);
  }, [open, initialViewMode]);

  const nextSku = useMemo(() => {
    const nums = allProducts
      .map((p) => parseInt(p.sku.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n) && n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return String(max + 1).padStart(6, "0");
  }, [allProducts]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      barcode: "",
      name_en: "",
      name_ar: "",
      category: "",
      unit_price: 0,
      stock_qty: 0,
      warning_limit_stock: 5,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              sku: product.sku,
              barcode: product.barcode ?? "",
              name_en: product.name_en,
              name_ar: product.name_ar ?? "",
              category: product.category ?? "",
              unit_price: product.unit_price,
              stock_qty: product.stock_qty,
              warning_limit_stock: product.warning_limit_stock ?? 5,
              status: product.status,
            }
          : {
              sku: nextSku,
              barcode: "",
              name_en: "",
              name_ar: "",
              category: "",
              unit_price: 0,
              stock_qty: 0,
              warning_limit_stock: 5,
              status: "active",
            }
      );
    }
  }, [open, product, nextSku, reset]);

  const handleGenerateBarcode = useCallback(() => {
    let barcode: string;
    let attempts = 0;
    do {
      barcode = generateEAN13();
      attempts++;
    } while (
      allProducts.some((p) => p.id !== product?.id && p.barcode === barcode) &&
      attempts < 20
    );
    setValue("barcode", barcode, { shouldValidate: true });
  }, [allProducts, product, setValue]);

  const mutation = isEdit ? updateProduct : createProduct;
  const error = mutation.error;

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, barcode: data.barcode || null };
      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onClose();
    } catch {
      // error shown via mutation.error
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 480 } } } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.75,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 15 }}>
          {isEdit
            ? (viewMode ? t("common.view", { defaultValue: "View" }) : t("common.edit"))
            : t("common.create")} — {t("nav.products")}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          {isEdit && viewMode && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setViewMode(false)}
              sx={{ fontSize: 12, textTransform: "none", px: 1.25 }}
            >
              {t("common.edit")}
            </Button>
          )}
          <IconButton size="small" onClick={onClose} edge="end">
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5, position: "relative" }}>
        {viewMode && (
          <Box sx={{ position: "absolute", inset: 0, zIndex: 2, cursor: "default" }} onClick={() => {}} />
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* SKU */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("products.sku")}
              fullWidth
              size="small"
              {...register("sku")}
              error={!!errors.sku}
              helperText={errors.sku?.message}
            />
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("products.category")}
                  fullWidth
                  size="small"
                  select
                  {...field}
                  error={!!errors.category}
                >
                  <MenuItem value="">{t("common.none")}</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Name EN */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t("products.name") + " (EN)"}
              fullWidth
              size="small"
              {...register("name_en")}
              error={!!errors.name_en}
              helperText={errors.name_en?.message}
            />
          </Grid>

          {/* Name AR */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t("products.name") + " (AR)"}
              fullWidth
              size="small"
              dir="rtl"
              {...register("name_ar")}
              error={!!errors.name_ar}
            />
          </Grid>

          {/* Barcode */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t("products.barcode")}
              fullWidth
              size="small"
              {...register("barcode", {
                validate: (value) => {
                  if (!value) return true;
                  const isDuplicate = allProducts.some(
                    (p) => p.id !== product?.id && p.barcode === value
                  );
                  return !isDuplicate || (t("products.barcodeNotUnique") as string);
                },
              })}
              error={!!errors.barcode}
              helperText={errors.barcode?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        title={t("products.scanBarcode")}
                        onClick={() => setScannerOpen(true)}
                      >
                        <CameraAltIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        edge="end"
                        title={t("products.generateBarcode")}
                        onClick={handleGenerateBarcode}
                      >
                        <CasinoIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Unit price */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("products.unitPrice")}
              fullWidth
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              {...register("unit_price", { valueAsNumber: true })}
              error={!!errors.unit_price}
              helperText={errors.unit_price?.message}
            />
          </Grid>

          {/* Stock qty */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("products.stockQty")}
              fullWidth
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              {...register("stock_qty", { valueAsNumber: true })}
              error={!!errors.stock_qty}
              helperText={errors.stock_qty?.message}
            />
          </Grid>

          {/* Warning limit stock */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("products.warningLimitStock")}
              fullWidth
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              {...register("warning_limit_stock", { valueAsNumber: true })}
              error={!!errors.warning_limit_stock}
              helperText={errors.warning_limit_stock?.message}
            />
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value === "active"}
                      onChange={(e) =>
                        field.onChange(e.target.checked ? "active" : "inactive")
                      }
                      size="small"
                    />
                  }
                  label={
                    field.value === "active"
                      ? t("products.active")
                      : t("products.inactive")
                  }
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button variant="text" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        {!viewMode && (
        <Button
          variant="contained"
          disabled={isSubmitting || mutation.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          {mutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
        )}
      </Box>
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetect={(value) => setValue("barcode", value, { shouldValidate: true })}
      />
    </Drawer>
  );
}
