import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { error: insertError } = await supabase.from("alerts").insert({
    type: "test_alert",
    severity: "info",
    title: "Test alert",
    body: "This is a delayed test alert from settings.",
    entity_type: "settings",
    entity_id: crypto.randomUUID(),
    link: "/settings",
    is_read: false,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}