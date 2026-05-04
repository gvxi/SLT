"use client";

import { use, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/EditOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useStorage, useStorageProducts } from "@/hooks/useStorages";
import { StorageIconDisplay } from "@/components/storages/StorageIconPicker";
import StorageForm from "@/components/storages/StorageForm";
import TransferDialog from "@/components/storages/TransferDialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default function StorageDetailPage({ params }: Props) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();

  const { data: storage, isLoading: storageLoading } = useStorage(id);
  const { data: products = [], isLoading: productsLoading } = useStorageProducts(id);

  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  if (storageLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!storage) {
    return <Alert severity="error">{t("common.notFound")}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => router.push("/storages")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
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
          <StorageIconDisplay icon={storage.icon} size={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {storage.name_en}
          </Typography>
          {storage.name_ar && (
            <Typography variant="caption" sx={{ color: "text.secondary" }} dir="rtl">
              {storage.name_ar}
            </Typography>
          )}
        </Box>
        <Chip
          label={t("storages.itemCount", { count: storage.item_count ?? 0 })}
          size="small"
          color={(storage.item_count ?? 0) === 0 ? "warning" : "default"}
          variant="outlined"
        />
        <Button
          variant="outlined"
          startIcon={<SwapHorizIcon />}
          size="small"
          onClick={() => setTransferOpen(true)}
        >
          {t("transfers.moveItems")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          size="small"
          onClick={() => setEditOpen(true)}
        >
          {t("common.edit")}
        </Button>
      </Box>

      {storage.description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {storage.description}
        </Typography>
      )}

      {/* Products table */}
      {productsLoading ? (
        <CircularProgress size={24} />
      ) : products.length === 0 ? (
        <Alert severity="info">{t("storages.noProducts")}</Alert>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{t("products.sku")}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{t("products.name")}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{t("products.category")}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">
                  {t("storages.fields.qty")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">
                  {t("products.unitPrice")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((ps) => {
                const p = ps.product as {
                  id: string;
                  sku: string;
                  name_en: string;
                  name_ar?: string;
                  category?: string;
                  unit_price: number;
                  stock_qty: number;
                } | undefined;
                if (!p) return null;
                return (
                  <TableRow key={ps.id} hover>
                    <TableCell sx={{ fontSize: 12 }}>{p.sku}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500 }}>
                          {p.name_en}
                        </Typography>
                        {p.name_ar && (
                          <Typography variant="caption" sx={{ color: "text.secondary" }} dir="rtl">
                            {p.name_ar}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.category ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: 12 }} align="right">
                      <Tooltip title={t("storages.fields.qtyInStorage")}>
                        <span>{ps.qty}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }} align="right">
                      {p.unit_price.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <StorageForm open={editOpen} storage={storage} onClose={() => setEditOpen(false)} />
      <TransferDialog
        open={transferOpen}
        defaultFromStorageId={id}
        onClose={() => setTransferOpen(false)}
      />
    </Box>
  );
}
