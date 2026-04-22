"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useTranslation } from "react-i18next";
import { useClient, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import LocationPicker from "./LocationPicker";
import { toast } from "@/store/toastStore";
import type { CustomerType } from "@/types";

const formSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  customer_type: z.enum(["customer", "company", "government"]).nullable().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export default function ClientDrawer({ open, onClose, clientId }: Props) {
  const { t } = useTranslation();
  const isEditing = !!clientId;

  const { data: client, isLoading } = useClient(clientId ?? "");
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState(isEditing);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      email: "",
      phone: "",
      address: "",
      customer_type: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setViewMode(isEditing);
    if (isEditing && client) {
      reset({
        name_en: client.name_en,
        name_ar: client.name_ar ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        customer_type: client.customer_type ?? null,
        notes: client.notes ?? "",
      });
      setLat(client.lat ?? null);
      setLng(client.lng ?? null);
    } else if (!isEditing) {
      reset({ name_en: "", name_ar: "", email: "", phone: "", address: "", customer_type: null, notes: "" });
      setLat(null);
      setLng(null);
    }
  }, [open, isEditing, client, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      name_ar: values.name_ar || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    };

    try {
      if (isEditing && clientId) {
        await updateClient.mutateAsync({ id: clientId, ...payload });
        toast(t("toast.saved"), "success");
      } else {
        await createClient.mutateAsync(payload);
        toast(t("toast.created"), "success");
      }
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toast.error"), "error");
    }
  };

  const handleDelete = async () => {
    if (!clientId) return;
    try {
      await deleteClient.mutateAsync(clientId);
      toast(t("toast.deleted"), "success");
      setConfirmDelete(false);
      onClose();
    } catch {
      toast(t("toast.error"), "error");
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 440 },
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
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
            flexShrink: 0,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 14 }}>
            {isEditing
              ? (viewMode ? t("common.view", { defaultValue: "View" }) : t("customers.editCustomer"))
              : t("customers.newCustomer")}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {isEditing && viewMode && (
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
            {isEditing && (
              <IconButton
                size="small"
                onClick={() => setConfirmDelete(true)}
                sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Body */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}
        >
          {viewMode && (
            <Box sx={{ position: "absolute", inset: 0, zIndex: 2, cursor: "default" }} onClick={() => {}} />
          )}
          {isEditing && isLoading ? (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>

              {/* Customer type */}
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12, display: "block", mb: 0.75 }}>
                  {t("customers.type")}
                </Typography>
                <Controller
                  name="customer_type"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      exclusive
                      value={field.value ?? null}
                      onChange={(_, v) => field.onChange(v)}
                      size="small"
                      sx={{ gap: 1 }}
                      disabled={viewMode}
                    >
                      {([["customer", <PersonOutlineIcon sx={{ fontSize: 15 }} />], ["company", <BusinessOutlinedIcon sx={{ fontSize: 15 }} />], ["government", <AccountBalanceOutlinedIcon sx={{ fontSize: 15 }} />]] as [CustomerType, React.ReactNode][]).map(([type, icon]) => (
                        <ToggleButton
                          key={type}
                          value={type}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            fontSize: 12,
                            gap: 0.5,
                            borderRadius: "6px !important",
                            border: "1px solid !important",
                            borderColor: "divider !important",
                            "&.Mui-selected": {
                              borderColor: "primary.main !important",
                              bgcolor: "primary.main",
                              color: "#fff",
                              "&:hover": { bgcolor: "primary.dark" },
                            },
                          }}
                        >
                          {icon}
                          {t(`customers.type_${type}`)}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  )}
                />
              </Box>

              <Divider />

              {/* Names */}
              <Controller
                name="name_en"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.nameEn")}
                    size="small"
                    fullWidth
                    required
                    error={!!errors.name_en}
                    helperText={errors.name_en?.message}
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />
              <Controller
                name="name_ar"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.nameAr")}
                    size="small"
                    fullWidth
                    dir="rtl"
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />

              <Divider />

              {/* Contact */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.phone")}
                    size="small"
                    fullWidth
                    type="tel"
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.email")}
                    size="small"
                    fullWidth
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.address")}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />

              <Divider />

              {/* Notes */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("customers.notes")}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    slotProps={{ input: { sx: { fontSize: 13 } }, inputLabel: { sx: { fontSize: 13 } } }}
                  />
                )}
              />

              <Divider />

              {/* Location */}
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12, display: "block", mb: 1 }}>
                  {t("customers.location")}
                </Typography>
                <LocationPicker
                  lat={lat}
                  lng={lng}
                  onChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Footer */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              mt: "auto",
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Button size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
              {t("common.cancel")}
            </Button>
            {!viewMode && (
            <Button
              type="submit"
              size="small"
              variant="contained"
              disableElevation
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              {isEditing ? t("common.save") : t("common.create")}
            </Button>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
          {t("common.confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            {t("customers.deleteConfirm", { name: client ? `${client.name_en}` : "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteClient.isPending}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
