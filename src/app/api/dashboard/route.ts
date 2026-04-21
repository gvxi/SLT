import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

function calcInvoiceTotal(inv: {
  tax_pct: number;
  discount: number;
  invoice_items: { qty: number; unit_price: number }[];
}): number {
  const subtotal = (inv.invoice_items ?? []).reduce(
    (s, item) => s + item.qty * item.unit_price,
    0
  );
  const afterDiscount = subtotal - (inv.discount ?? 0);
  return afterDiscount * (1 + (inv.tax_pct ?? 0) / 100);
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();

  const [tasks, products, invoices, quotations, recentTasks, recentInvoices] = await Promise.all([
    supabase.from("tasks").select("status"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("status, tax_pct, discount, issue_date, invoice_items(qty, unit_price)"),
    supabase.from("quotations").select("status"),
    supabase.from("tasks").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("invoices").select("id, invoice_number, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  // ── KPI: task counts ──
  const taskCounts = { backlog: 0, in_progress: 0, review: 0, done: 0 };
  for (const t of tasks.data ?? []) {
    if (t.status in taskCounts) taskCounts[t.status as keyof typeof taskCounts]++;
  }

  // ── KPI: invoice totals ──
  const unpaidInvoices = (invoices.data ?? []).filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  ).length;

  const pendingQuotations = (quotations.data ?? []).filter(
    (q) => q.status === "draft" || q.status === "sent"
  ).length;

  const paidInvoices = (invoices.data ?? []).filter((inv) => inv.status === "paid");
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + calcInvoiceTotal(inv), 0);

  // ── Monthly revenue: last 6 months ──
  const now = new Date();
  const months: { key: string; label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
    months.push({ key, label, revenue: 0 });
  }
  for (const inv of paidInvoices) {
    const monthKey = (inv.issue_date ?? "").slice(0, 7); // "YYYY-MM"
    const m = months.find((x) => x.key === monthKey);
    if (m) m.revenue += calcInvoiceTotal(inv);
  }
  const monthlyRevenue = months.map(({ label, revenue }) => ({
    month: label,
    revenue: Math.round(revenue * 100) / 100,
  }));

  // ── Recent activity ──
  const taskItems = (recentTasks.data ?? []).map((t) => ({
    id: `task-${t.id}`,
    type: "task" as const,
    label: t.title,
    sub: t.status,
    date: t.created_at,
  }));
  const invoiceItems = (recentInvoices.data ?? []).map((inv) => ({
    id: `inv-${inv.id}`,
    type: "invoice" as const,
    label: inv.invoice_number,
    sub: inv.status,
    date: inv.created_at,
  }));
  const recentActivity = [...taskItems, ...invoiceItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return NextResponse.json({
    tasks: taskCounts,
    openTasks: taskCounts.backlog + taskCounts.in_progress + taskCounts.review,
    totalProducts: products.count ?? 0,
    unpaidInvoices,
    pendingQuotations,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    monthlyRevenue,
    recentActivity,
  });
}
