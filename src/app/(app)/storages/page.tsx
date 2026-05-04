"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useStorages, useDeleteStorage } from "@/hooks/useStorages";
import { toast } from "@/store/toastStore";
import type { Storage } from "@/types";
import StorageForm from "@/components/storages/StorageForm";
import { StorageIconDisplay } from "@/components/storages/StorageIconPicker";

export default function StoragesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: storages = [], isLoading } = useStorages();
  const deleteStorage = useDeleteStorage();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Storage | null>(null);

  const handleEdit = (s: Storage) => {
    setEditTarget(s);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleDelete = async (s: Storage) => {
    if (!window.confirm(t("storages.deleteConfirm", { name: s.name_en }))) return;
    try {
      await deleteStorage.mutateAsync(s.id);
      toast(t("storages.deleted"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.storages")}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} size="small">
          {t("storages.add")}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : storages.length === 0 ? (
        <Alert severity="info">{t("storages.empty")}</Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 2,
          }}
        >
          {storages.map((s) => {
            const hasItems = (s.item_count ?? 0) > 0;
            return (
              <Card key={s.id} variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <StorageIconDisplay icon={s.icon} size={22} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                        {s.name_en}
                      </Typography>
                      {s.name_ar && (
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} dir="rtl" noWrap>
                          {s.name_ar}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {s.description && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {s.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={t("storages.itemCount", { count: s.item_count ?? 0 })}
                      size="small"
                      color={hasItems ? "default" : "warning"}
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => router.push(`/storages/${s.id}`)}
                  >
                    {t("common.view")}
                  </Button>
                  <IconButton size="small" onClick={() => handleEdit(s)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <Tooltip
                    title={hasItems ? t("storages.deleteBlocked") : ""}
                    placement="top"
                    disableHoverListener={!hasItems}
                  >
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(s)}
                        disabled={hasItems || deleteStorage.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      <StorageForm
        open={formOpen}
        storage={editTarget}
        onClose={() => setFormOpen(false)}
      />
    </Box>
  );
}
