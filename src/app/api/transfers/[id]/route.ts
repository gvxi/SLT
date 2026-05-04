import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("storage_transfers")
    .select(
      `
      id, transfer_number, from_storage_id, to_storage_id, notes, created_by, created_at,
      from_storage:storages!storage_transfers_from_storage_id_fkey(id, name_en, name_ar, icon),
      to_storage:storages!storage_transfers_to_storage_id_fkey(id, name_en, name_ar, icon),
      creator:profiles!storage_transfers_created_by_fkey(id, full_name),
      storage_transfer_items(
        id, product_id, qty, sort_order, created_at,
        product:products(id, sku, name_en, name_ar, category, unit_price)
      )
    `
    )
    .eq("id", id)
    .order("sort_order", { referencedTable: "storage_transfer_items", ascending: true })
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  return NextResponse.json(data);
}
