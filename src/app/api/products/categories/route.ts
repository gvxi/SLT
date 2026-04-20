import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const schema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("product_categories")
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
