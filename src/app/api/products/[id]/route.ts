import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/logActivity";

const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  name_en: z.string().min(1).optional(),
  name_ar: z.string().optional(),
  category: z.string().optional(),
  unit_price: z.number().min(0).optional(),
  stock_qty: z.number().int().min(0).optional(),
  warning_limit_stock: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
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
    .from("products")
    .select("*")
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
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await logActivity({ supabase, userId: user!.id, entityType: "product", entityId: id, action: "updated", summary: `Updated product: ${data.name_en}` });

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: prod } = await supabase.from("products").select("name_en").eq("id", id).single();
  const { error: dbError } = await supabase.from("products").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (prod) await logActivity({ supabase, userId: user!.id, entityType: "product", entityId: id, action: "deleted", summary: `Deleted product: ${prod.name_en}` });

  return new NextResponse(null, { status: 204 });
}
