import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/logActivity";

const createStorageSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().optional().nullable(),
  icon: z.string().min(1).default("Warehouse"),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("storages")
    .select("*, product_storages(qty)")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const storages = (data ?? []).map((s) => ({
    ...s,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item_count: (s.product_storages as any[]).reduce((sum: number, ps: { qty: number }) => sum + (ps.qty ?? 0), 0),
    product_storages: undefined,
  }));

  return NextResponse.json(storages);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createStorageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("storages")
    .insert({ ...parsed.data, created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await logActivity({
    supabase,
    userId: user!.id,
    entityType: "storage",
    entityId: data.id,
    action: "created",
    summary: `Created storage: ${data.name_en}`,
  });

  return NextResponse.json(data, { status: 201 });
}
