"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";

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

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Office Supplies",
  "Tools",
  "Materials",
  "Other",
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
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
    if (product) {
      reset({
        sku: product.sku,
        name_en: product.name_en,
        name_ar: product.name_ar ?? "",
        category: product.category ?? "",
        unit_price: product.unit_price,
        stock_qty: product.stock_qty,
        status: product.status,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: FormData) => {
    await updateProduct.mutateAsync({ id, ...data });
    reset(data);
  };

  const handleDelete = async () => {
    await deleteProduct.mutateAsync(id);
    router.push("/products");
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 640 }}>
        <Skeleton height={32} width={120} sx={{ mb: 3 }} />
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={56} sx={{ mb: 2, borderRadius: 1 }} />)}
      </Box>
    );
  }

  if (!product) {
    return (
      <Alert severity="error">{t("common.noData")}</Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        onClick={() => router.push("/products")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        {t("common.back")}
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {product.name_en}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: 12 }}>
            {product.sku}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteOpen(true)}
        >
          {t("common.delete")}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {updateProduct.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateProduct.error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
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
              defaultValue={product.category ?? ""}
              {...register("category")}
            >
              <MenuItem value="">{t("common.noData")}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
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

        <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || isSubmitting || updateProduct.isPending}
          >
            {updateProduct.isPending ? t("common.loading") : t("common.save")}
          </Button>
          <Button variant="text" onClick={() => reset()} disabled={!isDirty}>
            {t("common.cancel")}
          </Button>
        </Box>
      </Box>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>
          {t("common.confirm")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("products.confirmDelete")} <strong>{product.name_en}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button variant="text" onClick={() => setDeleteOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteProduct.isPending}
            onClick={handleDelete}
          >
            {deleteProduct.isPending ? t("common.loading") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
