import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/cron/alerts
// Called by Supabase pg_cron (or any scheduler) every hour.
// Secured by CRON_SECRET env variable.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in3Days = new Date(now.getTime() + 3 * 86400_000).toISOString().slice(0, 10);
  const in7Days = new Date(now.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const ago30Days = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);

  const newAlerts: {
    type: string;
    severity: string;
    title: string;
    body: string;
    entity_type: string;
    entity_id: string;
    link: string;
  }[] = [];

  // ── Invoices ────────────────────────────────────────────────────────────────
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, due_date, status")
    .in("status", ["draft", "sent", "overdue"]);

  for (const inv of invoices ?? []) {
    if (!inv.due_date) continue;
    const due = inv.due_date;
    if (due < today) {
      newAlerts.push({
        type: "invoice_overdue",
        severity: "error",
        title: `Invoice ${inv.invoice_number} is overdue`,
        body: `Due on ${due} — please follow up with the client.`,
        entity_type: "invoice",
        entity_id: inv.id,
        link: "/invoices",
      });
    } else if (due <= in3Days) {
      newAlerts.push({
        type: "invoice_due",
        severity: "warning",
        title: `Invoice ${inv.invoice_number} due soon`,
        body: `Due on ${due} — send or confirm payment.`,
        entity_type: "invoice",
        entity_id: inv.id,
        link: "/invoices",
      });
    }
  }

  // ── Quotations ───────────────────────────────────────────────────────────────
  const { data: quotations } = await supabase
    .from("quotations")
    .select("id, quotation_number, expiry_date, issue_date, status")
    .in("status", ["draft", "sent"]);

  for (const qt of quotations ?? []) {
    const expiry = qt.expiry_date;
    const issued = qt.issue_date;

    if (expiry) {
      if (expiry < today) {
        newAlerts.push({
          type: "quotation_expired",
          severity: "error",
          title: `Quotation ${qt.quotation_number} has expired`,
          body: `Expired on ${expiry}. Convert to invoice or follow up.`,
          entity_type: "quotation",
          entity_id: qt.id,
          link: "/quotations",
        });
      } else if (expiry <= in7Days) {
        newAlerts.push({
          type: "quotation_expiring",
          severity: "warning",
          title: `Quotation ${qt.quotation_number} expiring soon`,
          body: `Expires on ${expiry}. Follow up with the client.`,
          entity_type: "quotation",
          entity_id: qt.id,
          link: "/quotations",
        });
      }
    }

    // Stale quotations (issued > 30 days ago, still draft/sent)
    if (issued && issued < ago30Days) {
      newAlerts.push({
        type: "quotation_stale",
        severity: "info",
        title: `Quotation ${qt.quotation_number} is over 30 days old`,
        body: `Issued on ${issued}. Consider following up or closing.`,
        entity_type: "quotation",
        entity_id: qt.id,
        link: "/quotations",
      });
    }
  }

  // ── Products ─────────────────────────────────────────────────────────────────
  const { data: products } = await supabase
    .from("products")
    .select("id, name_en, stock_qty, warning_limit_stock, status")
    .eq("status", "active");

  for (const p of products ?? []) {
    if (p.stock_qty === 0) {
      newAlerts.push({
        type: "product_out_of_stock",
        severity: "error",
        title: `${p.name_en} is out of stock`,
        body: "Stock quantity is 0. Reorder immediately.",
        entity_type: "product",
        entity_id: p.id,
        link: "/products",
      });
    } else if (p.stock_qty <= (p.warning_limit_stock ?? 5)) {
      newAlerts.push({
        type: "product_low_stock",
        severity: "warning",
        title: `${p.name_en} is running low`,
        body: `Only ${p.stock_qty} units left (limit: ${p.warning_limit_stock ?? 5}).`,
        entity_type: "product",
        entity_id: p.id,
        link: "/products",
      });
    }
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status")
    .not("status", "eq", "done")
    .not("due_date", "is", null);

  for (const task of tasks ?? []) {
    if (!task.due_date) continue;
    if (task.due_date < today) {
      newAlerts.push({
        type: "task_overdue",
        severity: "error",
        title: `Task "${task.title}" is overdue`,
        body: `Was due on ${task.due_date}. Current status: ${task.status}.`,
        entity_type: "task",
        entity_id: task.id,
        link: "/tasks",
      });
    } else if (task.due_date <= in3Days) {
      newAlerts.push({
        type: "task_due",
        severity: "warning",
        title: `Task "${task.title}" due soon`,
        body: `Due on ${task.due_date}.`,
        entity_type: "task",
        entity_id: task.id,
        link: "/tasks",
      });
    }
  }

  if (!newAlerts.length) {
    return NextResponse.json({ inserted: 0 });
  }

  // De-duplicate: skip if an active (non-dismissed) alert for same entity+type already exists
  const { data: existing } = await supabase
    .from("alerts")
    .select("entity_id, type")
    .is("dismissed_at", null);

  const existingKeys = new Set((existing ?? []).map((a) => `${a.entity_id}::${a.type}`));
  const toInsert = newAlerts.filter(
    (a) => !existingKeys.has(`${a.entity_id}::${a.type}`)
  );

  if (!toInsert.length) return NextResponse.json({ inserted: 0 });

  const { error: insertError } = await supabase.from("alerts").insert(toInsert);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ inserted: toInsert.length });
}
