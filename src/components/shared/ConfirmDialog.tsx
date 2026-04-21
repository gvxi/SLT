"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button size="small" onClick={onCancel} disabled={loading}>
          {cancelLabel ?? t("common.cancel")}
        </Button>
        <Button
          size="small"
          variant="contained"
          color={variant === "danger" ? "error" : "primary"}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : undefined}
        >
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
