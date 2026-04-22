import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

const taskItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().default(""),
  qty: z.number().min(0),
  unit_price: z.number().min(0),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  items: z.array(taskItemSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error: dbError } = await supabase
    .from("tasks")
    .select(
      "*, assignee:profiles!assignee_id(id, full_name, avatar_url), " +
      "product:products!product_id(id, name_en, name_ar, sku), " +
      "client:clients!client_id(id, name_en, name_ar, phone), " +
      "task_items(*, product:products(id, name_en, name_ar, sku))"
    )
    .eq("id", id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { items, ...taskFields } = parsed.data;

  const { data, error: dbError } = await supabase
    .from("tasks")
    .update(taskFields)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Replace items if provided
  if (items !== undefined) {
    await supabase.from("task_items").delete().eq("task_id", id);
    if (items.length > 0) {
      await supabase
        .from("task_items")
        .insert(items.map((item, i) => ({ ...item, task_id: id, sort_order: i })));
    }
  }

  const { data: full } = await supabase
    .from("tasks")
    .select(
      "*, assignee:profiles!assignee_id(id, full_name, avatar_url), " +
      "product:products!product_id(id, name_en, name_ar, sku), " +
      "client:clients!client_id(id, name_en, name_ar, phone), " +
      "task_items(*, product:products(id, name_en, name_ar, sku))"
    )
    .eq("id", id)
    .single();

  return NextResponse.json(full);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { error: dbError } = await supabase.from("tasks").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
