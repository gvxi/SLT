import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("tasks")
    .select("status");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const counts: Record<string, number> = {
    backlog: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };
  for (const row of data ?? []) {
    if (row.status in counts) counts[row.status]++;
  }

  return NextResponse.json(counts);
}
