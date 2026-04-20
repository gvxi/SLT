import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).default("backlog"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("tasks")
    .select("*, assignee:profiles!assignee_id(id, full_name, avatar_url), product:products!product_id(id, name_en, name_ar, sku)")
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignee_id = searchParams.get("assignee_id");

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (assignee_id) query = query.eq("assignee_id", assignee_id);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error: dbError } = await supabase
    .from("tasks")
    .insert({ ...parsed.data, created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
