// worker.ts — Custom Cloudflare Worker entry
// Re-uses the opennext-generated fetch handler and adds a scheduled (cron) handler.
/// <reference types="@cloudflare/workers-types" />

// @ts-ignore .open-next/worker.js is generated at build time
import { default as handler } from "./.open-next/worker.js";

// @ts-ignore
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

interface Env {
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ONESIGNAL_REST_API_KEY: string;
  ONESIGNAL_APP_ID: string;
}

export default {
  fetch: handler.fetch,

  /**
   * Runs daily at 09:00 UTC (see wrangler.jsonc triggers.crons).
   * Fetches all push subscribers from Supabase and sends a OneSignal push notification.
   */
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext) {
    // 1. Fetch subscriber player IDs from Supabase
    const subRes = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/push_subscribers?select=player_id`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!subRes.ok) {
      throw new Error(`Supabase fetch failed: ${subRes.status} ${await subRes.text()}`);
    }

    const subscribers: { player_id: string }[] = await subRes.json();
    const playerIds = subscribers.map((s) => s.player_id);

    if (playerIds.length === 0) return;

    // 2. Send push notification via OneSignal
    const notifRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: env.ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: "Daily Update" },
        contents: { en: "You have a new update. Open the app to check what's new." },
      }),
    });

    if (!notifRes.ok) {
      throw new Error(`OneSignal API failed: ${notifRes.status} ${await notifRes.text()}`);
    }
  },
} satisfies ExportedHandler<Env>;
