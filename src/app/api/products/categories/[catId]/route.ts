import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const schema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ catId: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { catId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("product_categories")
    .update(parsed.data)
    .eq("id", catId)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ catId: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { catId } = await params;
  const supabase = createServerSupabaseClient();
  const { error: dbError } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", catId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
