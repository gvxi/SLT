import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("product_storages")
    .select("id, product_id, storage_id, qty, storage:storages(id, name_en, name_ar, icon)")
    .eq("product_id", productId)
    .order("qty", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const { product_id, storage_id, qty, replace_for_product } = body as {
    product_id: string;
    storage_id: string;
    qty: number;
    replace_for_product?: boolean;
  };

  if (!product_id || !storage_id) {
    return NextResponse.json({ error: "product_id and storage_id are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  if (replace_for_product) {
    const { error: replaceError } = await supabase
      .from("product_storages")
      .delete()
      .eq("product_id", product_id)
      .neq("storage_id", storage_id);

    if (replaceError) return NextResponse.json({ error: replaceError.message }, { status: 500 });
  }

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

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error: dbError } = await supabase
    .from("product_storages")
    .delete()
    .eq("product_id", productId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
