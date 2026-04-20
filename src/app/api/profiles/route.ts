import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .order("full_name");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}
