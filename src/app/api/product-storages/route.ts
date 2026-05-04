import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const { product_id, storage_id, qty } = body as {
    product_id: string;
    storage_id: string;
    qty: number;
  };

  if (!product_id || !storage_id) {
    return NextResponse.json({ error: "product_id and storage_id are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("product_storages")
    .upsert(
      { product_id, storage_id, qty: qty ?? 0 },
      { onConflict: "product_id,storage_id" }
    )
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
