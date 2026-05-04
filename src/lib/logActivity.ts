import type { SupabaseClient } from "@supabase/supabase-js";

export type EntityType = "task" | "invoice" | "quotation" | "product" | "client" | "storage" | "transfer";
export type ActionType = "created" | "updated" | "deleted";

interface LogParams {
  supabase: SupabaseClient;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  summary: string;
}

/**
 * Fire-and-forget activity log insertion. Errors are silently ignored so
 * they never break the main response.
 */
export async function logActivity({ supabase, userId, entityType, entityId, action, summary }: LogParams) {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    summary,
  });
}
