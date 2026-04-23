/// <reference types="@cloudflare/workers-types" />

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ONESIGNAL_REST_API_KEY: string;
  ONESIGNAL_APP_ID: string;
}

async function runDailyPush(env: Env): Promise<{ recipients: number }> {
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

  const subscribers = (await subRes.json()) as Array<{ player_id: string }>;
  const playerIds = subscribers
    .map((row) => row.player_id)
    .filter((id): id is string => Boolean(id));

  if (playerIds.length === 0) {
    return { recipients: 0 };
  }

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

  return { recipients: playerIds.length };
}

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("onesignal cron worker", { status: 200 });
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await runDailyPush(env);
  },
} satisfies ExportedHandler<Env>;
