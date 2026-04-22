import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/logActivity";

const PAGE_SIZE = 20;

const taskItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().default(""),
  qty: z.number().min(0),
  unit_price: z.number().min(0),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).default("backlog"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  items: z.array(taskItemSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const supabase = createServerSupabaseClient();

  const status     = searchParams.get("status");
  const priority   = searchParams.get("priority");
  const assigneeId = searchParams.get("assignee_id");
  const search     = searchParams.get("search");
  const sort       = searchParams.get("sort") ?? "desc";
  const month      = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year       = searchParams.get("year")  ? Number(searchParams.get("year"))  : null;
  const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const from       = (page - 1) * PAGE_SIZE;
  const to         = from + PAGE_SIZE - 1;

  const SELECT =
    "*, assignee:profiles!assignee_id(id, full_name, avatar_url), " +
    "product:products!product_id(id, name_en, name_ar, sku), " +
    "client:clients!client_id(id, name_en, name_ar, phone)";

  let query = supabase
    .from("tasks")
    .select(SELECT, { count: "exact" })
    .order("created_at", { ascending: sort === "asc" })
    .range(from, to);

  if (status)     query = query.eq("status", status);
  if (priority)   query = query.eq("priority", priority);
  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (search)     query = query.ilike("title", `%${search}%`);

  if (year && month) {
    const start = new Date(year, month - 1, 1).toISOString();
    const end   = new Date(year, month, 1).toISOString();
    query = query.gte("created_at", start).lt("created_at", end);
  } else if (year) {
    const start = new Date(year, 0, 1).toISOString();
    const end   = new Date(year + 1, 0, 1).toISOString();
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data, error: dbError, count } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { items, ...taskData } = parsed.data;

  const { data, error: dbError } = await supabase
    .from("tasks")
    .insert({ ...taskData, created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (items && items.length > 0) {
    await supabase
      .from("task_items")
      .insert(items.map((item, i) => ({ ...item, task_id: data.id, sort_order: i })));
  }

  await logActivity({ supabase, userId: user!.id, entityType: "task", entityId: data.id, action: "created", summary: `Created task: ${data.title}` });

  return NextResponse.json(data, { status: 201 });
}
