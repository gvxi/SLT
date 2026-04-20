"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useCreateInvoice } from "@/hooks/useInvoices";
import DocumentForm, { type DocumentFormSubmitData } from "@/components/documents/DocumentForm";

export default function InvoiceNewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const createInvoice = useCreateInvoice();

  const handleSubmit = async (data: DocumentFormSubmitData) => {
    const invoice = await createInvoice.mutateAsync({
      client_id: data.client_id ?? undefined,
      issue_date: data.issue_date,
      due_date: data.due_date!,
      tax_pct: data.tax_pct,
      discount: data.discount,
      notes_en: data.notes_en,
      notes_ar: data.notes_ar,
      status: data.status as "draft",
      items: data.items,
    });
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => router.push("/invoices")} sx={{ border: "1px solid", borderColor: "divider" }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("invoices.newInvoice")}
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 900 }}>
        <DocumentForm
          type="invoice"
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/invoices")}
        />
      </Box>
    </Box>
  );
}
