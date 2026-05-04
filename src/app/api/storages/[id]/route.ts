import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/logActivity";

const updateStorageSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_ar: z.string().optional().nullable(),
  icon: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("storages")
    .select("*, product_storages(qty)")
    .eq("id", id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  const storage = {
    ...data,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item_count: (data.product_storages as any[]).reduce((sum: number, ps: { qty: number }) => sum + (ps.qty ?? 0), 0),
    product_storages: undefined,
  };

  return NextResponse.json(storage);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateStorageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("storages")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await logActivity({
    supabase,
    userId: user!.id,
    entityType: "storage",
    entityId: id,
    action: "updated",
    summary: `Updated storage: ${data.name_en}`,
  });

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // Guard: check if storage has any items
  const { data: items, error: checkError } = await supabase
    .from("product_storages")
    .select("id")
    .eq("storage_id", id)
    .gt("qty", 0)
    .limit(1);

  if (checkError) return NextResponse.json({ error: checkError.message }, { status: 500 });

  if (items && items.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete storage that contains items. Move or remove items first." },
      { status: 409 }
    );
  }

  // Remove zero-qty product_storages rows first
  await supabase.from("product_storages").delete().eq("storage_id", id);

  const { data: storage } = await supabase.from("storages").select("name_en").eq("id", id).single();
  const { error: delError } = await supabase.from("storages").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  await logActivity({
    supabase,
    userId: user!.id,
    entityType: "storage",
    entityId: id,
    action: "deleted",
    summary: `Deleted storage: ${storage?.name_en ?? id}`,
  });

  return NextResponse.json({ success: true });
}
