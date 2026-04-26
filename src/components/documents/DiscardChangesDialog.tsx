"use client";

/**
 * DiscardChangesDialog — shown when the user tries to close a drawer
 * that has unsaved changes. Used by InvoiceDrawer and QuotationDrawer.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onDiscard: () => void;
  onKeep: () => void;
}

export default function DiscardChangesDialog({ open, onDiscard, onKeep }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onKeep} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
        {t("drawer.unsavedTitle", { defaultValue: "Unsaved Changes" })}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
          {t("drawer.unsavedBody", { defaultValue: "You have unsaved changes. Are you sure you want to discard them?" })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button size="small" variant="outlined" onClick={onKeep}>
          {t("drawer.keepEditing", { defaultValue: "Keep Editing" })}
        </Button>
        <Button size="small" variant="contained" color="error" onClick={onDiscard}>
          {t("drawer.discardChanges", { defaultValue: "Discard Changes" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
