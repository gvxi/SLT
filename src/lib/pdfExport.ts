import React from "react";
import type { Invoice } from "@/types";

export async function downloadInvoicePdf(
  invoice: Invoice,
  language: "en" | "ar",
  docType: "invoice" | "quotation" = "invoice",
  showRules = false
): Promise<void> {
  const [{ pdf }, { InvoicePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/documents/InvoicePdf"),
  ]);

  const element = React.createElement(InvoicePdfDocument, { invoice, language, docType, showRules });
  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoice_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
