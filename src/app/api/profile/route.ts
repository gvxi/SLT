import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
  lang_preference: z.enum(["en", "ar"]).optional(),
});

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user!.id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
