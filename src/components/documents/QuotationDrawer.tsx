"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTranslation } from "react-i18next";
import {
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  useDeleteQuotation,
  useConvertQuotation,
} from "@/hooks/useQuotations";
import DocumentForm, { type DocumentFormSubmitData, type TotalsSnapshot } from "./DocumentForm";
import StatusChip from "./StatusChip";
import PdfPreviewDialog from "./PdfPreviewDialog";
import OmrSign from "@/components/OmrSign";
import type { QuotationStatus } from "@/types";

const FORM_ID = "quotation-drawer-form";

const NEXT_STATUS: Partial<Record<QuotationStatus, { label: string; status: QuotationStatus }>> = {
  draft: { label: "quotations.markSent", status: "sent" },
  sent:  { label: "quotations.markAccepted", status: "accepted" },
};

interface Props {
  open: boolean;
  quotationId: string | null;
  onClose: () => void;
}

export default function QuotationDrawer({ open, quotationId, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: quotation, isLoading } = useQuotation(quotationId ?? "");
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const convertQuotation = useConvertQuotation();

  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [convertConfirmOpen, setConvertConfirmOpen] = useState(false);
  const [moreAnchorEl, setMoreAnchorEl] = useState<HTMLElement | null>(null);
  const [totalsExpanded, setTotalsExpanded] = useState(false);
  const saveAsDraftRef = useRef(false);
  const [totals, setTotals] = useState<TotalsSnapshot>({
    subtotal: 0, taxAmount: 0, discount: 0, upfrontPayment: 0, total: 0, balance: 0,
  });

  const onTotalsChange = useCallback((t: TotalsSnapshot) => setTotals(t), []);

  const handleSaveAsDraft = () => {
    saveAsDraftRef.current = true;
    (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit();
  };

  const handleConvertToInvoice = async () => {
    if (!quotationId) return;
    setConverting(true);
    try {
      await convertQuotation.mutateAsync(quotationId);
      onClose();
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (data: DocumentFormSubmitData) => {
    setIsSaving(true);
    try {
      const effectiveStatus = saveAsDraftRef.current ? "draft" : data.status;
      saveAsDraftRef.current = false;
      if (quotationId) {
        await updateQuotation.mutateAsync({
          id: quotationId,
          client_id: data.client_id ?? undefined,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          tax_pct: data.tax_pct,
          discount: data.discount,
          notes_en: data.notes_en,
          notes_ar: data.notes_ar,
          status: effectiveStatus as QuotationStatus,
        } as Parameters<typeof updateQuotation.mutateAsync>[0]);
      } else {
        await createQuotation.mutateAsync({
          client_id: data.client_id ?? undefined,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date!,
          tax_pct: data.tax_pct,
          discount: data.discount,
          notes_en: data.notes_en,
          notes_ar: data.notes_ar,
          status: "draft",
          items: data.items,
        } as Parameters<typeof createQuotation.mutateAsync>[0]);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusAction = async (newStatus: QuotationStatus) => {
    if (!quotationId) return;
    await updateQuotation.mutateAsync({ id: quotationId, status: newStatus });
  };

  const handleDelete = async () => {
    if (!quotationId) return;
    await deleteQuotation.mutateAsync(quotationId);
    setDeleteOpen(false);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    setDuplicating(true);
    try {
      await createQuotation.mutateAsync({
        client_id: quotation.client_id ?? undefined,
        issue_date: new Date().toISOString().split("T")[0],
        expiry_date: quotation.expiry_date,
        tax_pct: quotation.tax_pct,
        discount: quotation.discount,
        notes_en: quotation.notes_en ?? undefined,
        notes_ar: quotation.notes_ar ?? undefined,
        status: "draft",
        items: quotation.quotation_items?.map((it) => ({
          product_id: it.product_id,
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
        })),
      } as Parameters<typeof createQuotation.mutateAsync>[0]);
      onClose();
    } finally {
      setDuplicating(false);
    }
  };

  const nextAction = quotation ? NEXT_STATUS[quotation.status] : undefined;
  const isEditMode = !!quotationId;
  const drawerWidth = isMobile ? "100%" : 680;
  const drawerHeight = isMobile ? "96dvh" : "100%";

  // Build a fake invoice-shape so PdfPreviewDialog can render it
  const pdfDoc = quotation
    ? {
        ...quotation,
        invoice_number: quotation.quotation_number,
        due_date: quotation.expiry_date,
        status: "draft" as const,
        upfront_payment: 0,
        location: null,
        phone_number: null,
        invoice_items: quotation.quotation_items?.map((it) => ({
          ...it,
          invoice_id: quotation.id,
        })),
      }
    : null;

  return (
    <>
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              height: drawerHeight,
              borderRadius: isMobile ? "16px 16px 0 0" : 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
          transition: { timeout: 280 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          {isMobile && (
            <Box sx={{ width: 36, height: 4, bgcolor: "divider", borderRadius: 2, mx: "auto", position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" }} />
          )}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, mt: isMobile ? 0.5 : 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
              {isEditMode
                ? quotation?.quotation_number ?? t("quotations.editQuotation")
                : t("quotations.newQuotation")}
            </Typography>
            {quotation && <StatusChip status={quotation.status} size="small" />}
          </Box>

          {isEditMode && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {isMobile ? (
                <>
                  <IconButton size="small" onClick={(e) => setMoreAnchorEl(e.currentTarget)} sx={{ color: "text.secondary" }}>
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Menu
                    anchorEl={moreAnchorEl}
                    open={Boolean(moreAnchorEl)}
                    onClose={() => setMoreAnchorEl(null)}
                    slotProps={{ paper: { sx: { minWidth: 200 } } }}
                  >
                    <MenuItem
                      onClick={() => { setMoreAnchorEl(null); setConvertConfirmOpen(true); }}
                      disabled={converting || isLoading || !!quotation?.converted_invoice_id}
                    >
                      <ListItemIcon><SwapHorizIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={t("quotations.convertToInvoice")} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                    </MenuItem>
                    <MenuItem onClick={() => { setMoreAnchorEl(null); handleDuplicate(); }} disabled={duplicating || isLoading}>
                      <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={t("invoices.duplicate")} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                    </MenuItem>
                    <MenuItem onClick={() => { setMoreAnchorEl(null); setPdfPreviewOpen(true); }} disabled={isLoading || !quotation}>
                      <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={t("invoices.exportPdf")} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setMoreAnchorEl(null); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
                      <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                      <ListItemText primary={t("common.delete")} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <IconButton
                    size="small"
                    onClick={() => setConvertConfirmOpen(true)}
                    disabled={converting || isLoading || !!quotation?.converted_invoice_id}
                    title={t("quotations.convertToInvoice")}
                    sx={{ color: "text.secondary" }}
                  >
                    {converting ? <CircularProgress size={14} /> : <SwapHorizIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleDuplicate}
                    disabled={duplicating || isLoading}
                    title={t("invoices.duplicate")}
                    sx={{ color: "text.secondary" }}
                  >
                    {duplicating ? <CircularProgress size={14} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={isLoading || !quotation}
                    title={t("invoices.exportPdf")}
                    sx={{ color: "text.secondary" }}
                    onClick={() => setPdfPreviewOpen(true)}
                  >
                    <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteOpen(true)}
                    title={t("common.delete")}
                    sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                  >
                    <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              )}
            </Box>
          )}

          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Status quick-actions */}
        {isEditMode && quotation && (
          <Box sx={{ px: 2.5, py: 1, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {nextAction && (
              <Button size="small" variant="outlined" onClick={() => handleStatusAction(nextAction.status)} disabled={updateQuotation.isPending} sx={{ fontSize: 12, py: 0.4 }}>
                {t(nextAction.label)}
              </Button>
            )}
            {quotation.status === "sent" && (
              <Button size="small" variant="outlined" color="error" onClick={() => handleStatusAction("rejected")} disabled={updateQuotation.isPending} sx={{ fontSize: 12, py: 0.4 }}>
                {t("quotations.markRejected")}
              </Button>
            )}
            {quotation.status === "sent" && (
              <Button size="small" variant="outlined" color="warning" onClick={() => handleStatusAction("expired")} disabled={updateQuotation.isPending} sx={{ fontSize: 12, py: 0.4 }}>
                {t("quotations.markExpired")}
              </Button>
            )}
            {(quotation.status === "rejected" || quotation.status === "expired") && (
              <Button size="small" variant="outlined" color="inherit" onClick={() => handleStatusAction("draft")} disabled={updateQuotation.isPending} sx={{ fontSize: 12, py: 0.4 }}>
                {t("quotations.revertToDraft")}
              </Button>
            )}
          </Box>
        )}

        {/* Scrollable body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5 }}>
          {isEditMode && isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <DocumentForm
              type="quotation"
              mode={isEditMode ? "edit" : "create"}
              initialData={quotation}
              onSubmit={handleSubmit}
              formId={FORM_ID}
              hideActions
              onTotalsChange={onTotalsChange}
            />
          )}
        </Box>

        {/* Sticky footer */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            px: 2.5,
            pt: 1.5,
            pb: isMobile ? 2.5 : 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {totalsExpanded && (
                <>
                  <TotalPill label={t("invoices.subtotal")} value={totals.subtotal} />
                  {totals.discount > 0 && <TotalPill label={t("invoices.discount")} value={-totals.discount} />}
                  {totals.taxAmount > 0 && <TotalPill label={t("invoices.tax")} value={totals.taxAmount} />}
                </>
              )}
              <TotalPill label={t("invoices.total")} value={totals.total} bold />
            </Box>
            <IconButton size="small" onClick={() => setTotalsExpanded((v) => !v)} sx={{ color: "text.disabled", mt: 0.25 }}>
              {totalsExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button size="small" variant="outlined" onClick={onClose} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleSaveAsDraft}
              disabled={isSaving}
              startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />}
              sx={{ borderColor: "divider" }}
            >
              {t("invoices.saveAsDraft")}
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              size="small"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              {isEditMode ? t("invoices.saveChanges") : t("common.create")}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Convert to Invoice confirm */}
      <Dialog open={convertConfirmOpen} onClose={() => setConvertConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>{t("quotations.convertToInvoice")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
            {t("quotations.convertConfirm", { number: quotation?.quotation_number })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setConvertConfirmOpen(false)}>{t("common.cancel")}</Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => { setConvertConfirmOpen(false); handleConvertToInvoice(); }}
            disabled={converting}
          >
            {converting ? <CircularProgress size={13} color="inherit" /> : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
            {t("quotations.deleteConfirm", { number: quotation?.quotation_number })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setDeleteOpen(false)}>{t("common.cancel")}</Button>
          <Button size="small" variant="contained" color="error" onClick={handleDelete} disabled={deleteQuotation.isPending}>
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {pdfDoc && (
        <PdfPreviewDialog
          open={pdfPreviewOpen}
          onClose={() => setPdfPreviewOpen(false)}
          invoice={pdfDoc as Parameters<typeof PdfPreviewDialog>[0]["invoice"]}
        />
      )}
    </>
  );
}

function TotalPill({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        px: 1.25,
        py: 0.6,
        borderRadius: 1,
        bgcolor: bold ? "primary.main" : "action.hover",
        color: bold ? "primary.contrastText" : "text.primary",
        minWidth: 72,
      }}
    >
      <Typography sx={{ fontSize: 10, opacity: 0.75, lineHeight: 1.2, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: bold ? 700 : 500, lineHeight: 1.3 }}>
        <OmrSign size="0.75em" />{Math.abs(value).toFixed(3)}
      </Typography>
    </Box>
  );
}
