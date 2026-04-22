import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export type TaskMonthCount = { year: number; month: number; count: number };

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();

  // Fetch only id+created_at — light query for aggregation
  const { data, error: dbError } = await supabase
    .from("tasks")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const result: TaskMonthCount[] = Array.from(countMap.entries()).map(([key, count]) => {
    const [year, month] = key.split("-").map(Number);
    return { year, month, count };
  });

  // Already ordered newest-first by Supabase query, Map preserves insertion order
  return NextResponse.json(result);
}
