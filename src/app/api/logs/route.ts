import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? String(PAGE_SIZE)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const entityType = searchParams.get("entity_type");
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("activity_logs")
    .select(
      "id, user_id, entity_type, entity_id, action, summary, created_at, profile:profiles!user_id(id, full_name, avatar_url)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (entityType) query = query.eq("entity_type", entityType);

  const { data, error: dbError, count } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    page_size: limit,
  });
}
