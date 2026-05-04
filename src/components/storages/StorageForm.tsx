"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useCreateStorage, useUpdateStorage } from "@/hooks/useStorages";
import { toast } from "@/store/toastStore";
import type { Storage } from "@/types";
import StorageIconPicker from "./StorageIconPicker";

const schema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().optional().nullable(),
  icon: z.string().min(1),
  description: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  storage?: Storage | null;
  onClose: () => void;
}

export default function StorageForm({ open, storage, onClose }: Props) {
  const { t } = useTranslation();
  const isEdit = !!storage;
  const createStorage = useCreateStorage();
  const updateStorage = useUpdateStorage(storage?.id ?? "");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name_en: "", name_ar: "", icon: "Warehouse", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        storage
          ? {
              name_en: storage.name_en,
              name_ar: storage.name_ar ?? "",
              icon: storage.icon ?? "Warehouse",
              description: storage.description ?? "",
            }
          : { name_en: "", name_ar: "", icon: "Warehouse", description: "" }
      );
    }
  }, [open, storage, reset]);

  const mutation = isEdit ? updateStorage : createStorage;
  const error = mutation.error;

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        name_ar: data.name_ar || null,
        description: data.description || null,
      };
      if (isEdit && storage) {
        await updateStorage.mutateAsync(payload);
        toast(t("storages.updated"), "success");
      } else {
        await createStorage.mutateAsync(payload);
        toast(t("storages.created"), "success");
      }
      onClose();
    } catch {
      // error shown via mutation.error
    }
  };

  const handleClose = () => {
    if (isDirty && !window.confirm(t("common.unsavedChanges"))) return;
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
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
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {isEdit ? t("storages.edit") : t("storages.add")}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ fontSize: 13 }}>
              {error instanceof Error ? error.message : t("common.error")}
            </Alert>
          )}

          <TextField
            label={t("storages.fields.nameEn")}
            {...register("name_en")}
            error={!!errors.name_en}
            helperText={errors.name_en?.message}
            fullWidth
            size="small"
            required
          />

          <TextField
            label={t("storages.fields.nameAr")}
            {...register("name_ar")}
            fullWidth
            size="small"
            dir="rtl"
            slotProps={{ input: { sx: { fontFamily: "inherit" } } }}
          />

          <TextField
            label={t("storages.fields.description")}
            {...register("description")}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />

          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
              {t("storages.fields.icon")}
            </Typography>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <StorageIconPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />
        <Divider />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isEdit ? t("common.save") : t("common.create")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
