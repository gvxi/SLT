"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import type { Product } from "@/types";

const schema = z.object({
  sku: z.string().min(1),
  name_en: z.string().min(1),
  name_ar: z.string(),
  category: z.string(),
  unit_price: z.number({ message: "Required" }).min(0),
  stock_qty: z.number({ message: "Required" }).int().min(0),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  allProducts?: Product[];
}

export default function ProductForm({ open, product, onClose, allProducts = [] }: Props) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useProductCategories();

  // Compute next SKU from all existing products
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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      name_en: "",
      name_ar: "",
      category: "",
      unit_price: 0,
      stock_qty: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              sku: product.sku,
              name_en: product.name_en,
              name_ar: product.name_ar ?? "",
              category: product.category ?? "",
              unit_price: product.unit_price,
              stock_qty: product.stock_qty,
              status: product.status,
            }
          : {
              sku: nextSku,
              name_en: "",
              name_ar: "",
              category: "",
              unit_price: 0,
              stock_qty: 0,
              status: "active",
            }
      );
    }
  }, [open, product, nextSku, reset]);

  const mutation = isEdit ? updateProduct : createProduct;
  const error = mutation.error;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, ...data });
      } else {
        await createProduct.mutateAsync(data);
      }
      onClose();
    } catch {
      // error shown via mutation.error
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: 16, pb: 1 }}>
        {isEdit ? t("common.edit") : t("common.create")} — {t("nav.products")}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0 }}>
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("products.category")}
              fullWidth
              size="small"
              select
              defaultValue=""
              {...register("category")}
              error={!!errors.category}
            >
              <MenuItem value="">{t("common.noData")}</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.name}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
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
          <Grid size={{ xs: 12 }}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value === "active"}
                      onChange={(e) => field.onChange(e.target.checked ? "active" : "inactive")}
                      size="small"
                    />
                  }
                  label={field.value === "active" ? t("products.active") : t("products.inactive")}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="text" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={isSubmitting || mutation.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          {mutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
