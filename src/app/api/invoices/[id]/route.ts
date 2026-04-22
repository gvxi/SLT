import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/logActivity";

const invoiceItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().default(""),
  qty: z.number().min(0),
  unit_price: z.number().min(0),
});

const updateInvoiceSchema = z.object({
  client_id: z.string().nullable().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  tax_pct: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  upfront_payment: z.number().min(0).optional(),
  location: z.string().optional(),
  phone_number: z.string().optional(),
  notes_en: z.string().optional(),
  notes_ar: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("invoices")
    .select("*, client:clients(*), invoice_items(*, product:products(id, name_en, name_ar, sku))")
    .eq("id", id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { items, ...invoiceFields } = parsed.data;

  const { data, error: dbError } = await supabase
    .from("invoices")
    .update(invoiceFields)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Replace items if provided
  if (items !== undefined) {
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(items.map((item, i) => ({ ...item, invoice_id: id, sort_order: i })));
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  const { data: full } = await supabase
    .from("invoices")
    .select("*, client:clients(*), invoice_items(*, product:products(id, name_en, name_ar, sku))")
    .eq("id", id)
    .single();

  if (full) await logActivity({ supabase, userId: user!.id, entityType: "invoice", entityId: id, action: "updated", summary: `Updated invoice: ${(full as { invoice_number?: string }).invoice_number ?? id}` });

  return NextResponse.json(full);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: inv } = await supabase.from("invoices").select("invoice_number").eq("id", id).single();
  const { error: dbError } = await supabase.from("invoices").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (inv) await logActivity({ supabase, userId: user!.id, entityType: "invoice", entityId: id, action: "deleted", summary: `Deleted invoice: ${inv.invoice_number ?? id}` });

  return new NextResponse(null, { status: 204 });
}
