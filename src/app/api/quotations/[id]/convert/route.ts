import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // Fetch quotation with items
  const { data: quotation, error: fetchError } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", id)
    .single();

  if (fetchError || !quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  // Create invoice from quotation data
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: quotation.client_id,
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: quotation.expiry_date,
      tax_pct: quotation.tax_pct,
      discount: quotation.discount,
      notes_en: quotation.notes_en,
      notes_ar: quotation.notes_ar,
      created_by: user!.id,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? "Failed to create invoice" }, { status: 500 });
  }

  // Copy line items
  if (quotation.quotation_items?.length) {
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      quotation.quotation_items.map(
        (it: { product_id: string | null; description: string; qty: number; unit_price: number; sort_order: number }, i: number) => ({
          invoice_id: invoice.id,
          product_id: it.product_id,
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
          sort_order: it.sort_order ?? i,
        })
      )
    );
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Mark quotation as converted
  await supabase.from("quotations").update({ converted_invoice_id: invoice.id }).eq("id", id);

  return NextResponse.json({ invoice_id: invoice.id }, { status: 201 });
}
