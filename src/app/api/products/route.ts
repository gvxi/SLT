import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const createProductSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  name_en: z.string().min(1),
  name_ar: z.string().optional(),
  category: z.string().optional(),
  unit_price: z.number().min(0),
  stock_qty: z.number().int().min(0).default(0),
  warning_limit_stock: z.number().int().min(0).default(5),
  warning_limit_stock: z.number().int().min(0).default(5),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  if (status) query = query.eq("status", status);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("products")
    .insert({ ...parsed.data, created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
