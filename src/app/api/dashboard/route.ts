import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const supabase = createServerSupabaseClient();

  const [tasks, products, invoices, quotations] = await Promise.all([
    supabase.from("tasks").select("status"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("status, tax_pct, discount, invoice_items(qty, unit_price)"),
    supabase.from("quotations").select("status"),
  ]);

  const taskCounts = {
    backlog: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };
  for (const t of tasks.data ?? []) {
    if (t.status in taskCounts) {
      taskCounts[t.status as keyof typeof taskCounts]++;
    }
  }

  const unpaidInvoices = (invoices.data ?? []).filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  ).length;

  const pendingQuotations = (quotations.data ?? []).filter(
    (q) => q.status === "draft" || q.status === "sent"
  ).length;

  const paidInvoices = (invoices.data ?? []).filter((inv) => inv.status === "paid");
  const totalRevenue = paidInvoices.reduce((sum, inv) => {
    const subtotal = (inv.invoice_items ?? []).reduce(
      (s: number, item: { qty: number; unit_price: number }) => s + item.qty * item.unit_price,
      0
    );
    const afterDiscount = subtotal - (inv.discount ?? 0);
    const withTax = afterDiscount * (1 + (inv.tax_pct ?? 0) / 100);
    return sum + withTax;
  }, 0);

  return NextResponse.json({
    tasks: taskCounts,
    openTasks: taskCounts.backlog + taskCounts.in_progress + taskCounts.review,
    totalProducts: products.count ?? 0,
    unpaidInvoices,
    pendingQuotations,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  });
}
