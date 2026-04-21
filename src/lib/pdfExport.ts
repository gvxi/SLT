import React from "react";
import type { Invoice } from "@/types";

export async function downloadInvoicePdf(
  invoice: Invoice,
  language: "en" | "ar"
): Promise<void> {
  // Dynamic import — keeps @react-pdf/renderer out of the server bundle
  const [{ pdf }, { InvoicePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/documents/InvoicePdf"),
  ]);

  const element = React.createElement(InvoicePdfDocument, { invoice, language });
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
