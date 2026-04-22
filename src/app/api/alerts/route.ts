import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

// GET /api/alerts  — list active (non-dismissed) alerts, newest first
export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const includeRead = searchParams.get("include_read") === "1";

  let query = supabase
    .from("alerts")
    .select("*", { count: "exact" })
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!includeRead) query = query.eq("is_read", false);

  const { data, error: dbError, count } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}

// DELETE /api/alerts  — dismiss all alerts
export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { error: dbError } = await supabase
    .from("alerts")
    .update({ dismissed_at: new Date().toISOString() })
    .is("dismissed_at", null);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
