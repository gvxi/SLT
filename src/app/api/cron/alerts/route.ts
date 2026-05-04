import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/cron/alerts
// Called by Vercel cron (GET) or any scheduler (POST).
// Secured by Authorization: Bearer <CRON_SECRET>.
async function handleCron(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // ── Storages (empty) ─────────────────────────────────────────────────────────
    const { data: storages } = await supabase
      .from("storages")
      .select("id, name_en, product_storages(qty)");

    for (const storage of storages ?? []) {
      const totalQty = (storage.product_storages as { qty: number }[] ?? [])
        .reduce((sum, ps) => sum + (ps.qty ?? 0), 0);
      if (totalQty === 0) {
        newAlerts.push({
          type: "storage_empty",
          severity: "warning",
          title: `${storage.name_en} is empty`,
          body: `${storage.name_en} has no items. Add products or remove the storage.`,
          entity_type: "storage",
          entity_id: storage.id,
          link: `/storages/${storage.id}`,
        });
      }
    }

    let insertedCount = 0;

    if (newAlerts.length) {
      // Upsert on (entity_id, type): re-activates dismissed/read alerts when
      // the underlying condition is still true, rather than inserting duplicates.
      const toUpsert = newAlerts.map((a) => ({
        ...a,
        is_read: false,
        dismissed_at: null,
      }));

      const { error: upsertError, data: upserted } = await supabase
        .from("alerts")
        .upsert(toUpsert, {
          onConflict: "entity_id,type",
          ignoreDuplicates: false,
        })
        .select("id");

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
      insertedCount = upserted?.length ?? 0;
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !restApiKey) {
      return NextResponse.json({ error: "OneSignal environment variables are missing" }, { status: 500 });
    }

    const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["All"],
        headings: { en: "Daily Update" },
        contents: { en: "You have new updates. Tap to view." },
        url: "https://sltrad.vercel.app/dashboard",
      }),
    });

    const oneSignalPayload = (await oneSignalResponse.json().catch(() => null)) as
      | { errors?: string[]; id?: string }
      | null;

    if (!oneSignalResponse.ok) {
      const errorMessage = oneSignalPayload?.errors?.join(", ") || "Failed to send OneSignal notification";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ inserted: insertedCount, notificationId: oneSignalPayload?.id ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
