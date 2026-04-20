import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const invoiceItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().default(""),
  qty: z.number().min(0),
  unit_price: z.number().min(0),
  sort_order: z.number().int().default(0),
});

const createInvoiceSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issue_date: z.string(),
  due_date: z.string(),
  tax_pct: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  notes_en: z.string().optional(),
  notes_ar: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("invoices")
    .select("*, client:clients(id, name_en, name_ar), invoice_items(*)")
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  const client_id = searchParams.get("client_id");
  if (status) query = query.eq("status", status);
  if (client_id) query = query.eq("client_id", client_id);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...invoiceData } = parsed.data;
  const supabase = createServerSupabaseClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ ...invoiceData, created_by: user!.id })
    .select()
    .single();

  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 });

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items.map((item, i) => ({ ...item, invoice_id: invoice.id, sort_order: i })));

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { data: full } = await supabase
    .from("invoices")
    .select("*, client:clients(id, name_en, name_ar), invoice_items(*)")
    .eq("id", invoice.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
