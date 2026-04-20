import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const updateQuotationSchema = z.object({
  client_id: z.string().nullable().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  tax_pct: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  notes_en: z.string().optional(),
  notes_ar: z.string().optional(),
  converted_invoice_id: z.string().uuid().nullable().optional(),
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
    .from("quotations")
    .select("*, client:clients(*), quotation_items(*, product:products(id, name_en, name_ar, sku))")
    .eq("id", id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateQuotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("quotations")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { error: dbError } = await supabase.from("quotations").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
