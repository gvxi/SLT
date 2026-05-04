import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("product_storages")
    .select(
      `
      id,
      qty,
      product:products(
        id, sku, name_en, name_ar, category, unit_price, stock_qty, status
      )
    `
    )
    .eq("storage_id", id)
    .order("qty", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
