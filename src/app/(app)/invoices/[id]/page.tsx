"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useTranslation } from "react-i18next";
import { useInvoice, useUpdateInvoice, useDeleteInvoice, useCreateInvoice } from "@/hooks/useInvoices";
import { downloadInvoicePdf } from "@/lib/pdfExport";
import StatusChip from "@/components/documents/StatusChip";
import DocumentForm, { type DocumentFormSubmitData } from "@/components/documents/DocumentForm";
import type { InvoiceStatus } from "@/types";

// Status workflow: draft→sent→paid; any→overdue; any→cancelled
const NEXT_STATUS: Partial<Record<InvoiceStatus, { label: string; status: InvoiceStatus }>> = {
  draft:   { label: "invoices.markSent",      status: "sent" },
  sent:    { label: "invoices.markPaid",       status: "paid" },
  overdue: { label: "invoices.markPaid",       status: "paid" },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const createInvoice = useCreateInvoice();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      const lang = (i18n.language?.startsWith("ar") ? "ar" : "en") as "en" | "ar";
      await downloadInvoicePdf(invoice, lang);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async (data: DocumentFormSubmitData) => {
    await updateInvoice.mutateAsync({
      id,
      client_id: data.client_id ?? undefined,
      issue_date: data.issue_date,
      due_date: data.due_date!,
      tax_pct: data.tax_pct,
      discount: data.discount,
      notes_en: data.notes_en,
      notes_ar: data.notes_ar,
      status: data.status as InvoiceStatus,
      items: data.items,
    });
  };

  const handleStatusAction = async (newStatus: InvoiceStatus) => {
    await updateInvoice.mutateAsync({ id, status: newStatus });
  };

  const handleDelete = async () => {
    await deleteInvoice.mutateAsync(id);
    router.push("/invoices");
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    setDuplicating(true);
    try {
      const copy = await createInvoice.mutateAsync({
        client_id: invoice.client_id ?? undefined,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: invoice.due_date,
        tax_pct: invoice.tax_pct,
        discount: invoice.discount,
        notes_en: invoice.notes_en ?? undefined,
        notes_ar: invoice.notes_ar ?? undefined,
        status: "draft",
        items: invoice.invoice_items?.map((it) => ({
          product_id: it.product_id,
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
          sort_order: it.sort_order,
        })),
      });
      router.push(`/invoices/${copy.id}`);
    } finally {
      setDuplicating(false);
    }
  };

  if (isLoading || !invoice) {
    return (
      <Box>
        <Skeleton height={40} width={240} sx={{ borderRadius: 1, mb: 3 }} />
        <Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  const nextAction = NEXT_STATUS[invoice.status];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => router.push("/invoices")} sx={{ border: "1px solid", borderColor: "divider" }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {invoice.invoice_number}
          </Typography>
          <StatusChip status={invoice.status} size="medium" />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {nextAction && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleStatusAction(nextAction.status)}
              disabled={updateInvoice.isPending}
            >
              {t(nextAction.label)}
            </Button>
          )}
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => handleStatusAction("cancelled")}
              disabled={updateInvoice.isPending}
            >
              {t("invoices.markCancelled")}
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportPdf}
            disabled={pdfLoading}
          >
            {t("invoices.exportPdf")}
          </Button>
          <IconButton
            size="small"
            onClick={handleDuplicate}
            disabled={duplicating}
            title={t("invoices.duplicate")}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteOpen(true)}
            title={t("common.delete")}
            sx={{ border: "1px solid", borderColor: "divider", "&:hover": { borderColor: "error.main", color: "error.main" } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Form */}
      <Box sx={{ maxWidth: 900 }}>
        <DocumentForm
          type="invoice"
          mode="edit"
          initialData={invoice}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/invoices")}
        />
      </Box>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
            {t("invoices.deleteConfirm", { number: invoice.invoice_number })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setDeleteOpen(false)}>{t("common.cancel")}</Button>
          <Button size="small" variant="contained" color="error" onClick={handleDelete} disabled={deleteInvoice.isPending}>
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
