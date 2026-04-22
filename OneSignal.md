You are a senior full-stack engineer. Your task is to integrate OneSignal push notifications into an existing Next.js (TypeScript) project that runs on Cloudflare Workers, with Supabase as the database.

## Your goals

1. Detect whether the project uses App Router or Pages Router and adapt accordingly.
2. Implement the full OneSignal integration end-to-end.
3. After each file change, verify correctness and check for errors.

---

## Step 1 — Explore the project

Before writing any code:
- Read the project structure to identify the router type (look for /app or /pages directory).
- Check if wrangler.toml exists and read its contents.
- Check if supabase is already installed (package.json).
- Check if react-onesignal is already installed.
- List any existing service worker files in /public.

---

## Step 2 — Install dependencies

Run the following if not already installed:

  npm install react-onesignal
  npm install @supabase/supabase-js (if not present)

After running, verify the install succeeded by checking package.json.

---

## Step 3 — Create the Supabase migration

Create the following SQL migration file at supabase/migrations/001_push_subscribers.sql:

  create table if not exists push_subscribers (
    id uuid default gen_random_uuid() primary key,
    player_id text not null unique,
    created_at timestamp with time zone default now()
  );

---

## Step 4 — Add OneSignal initialization

Detect the router type, then:

If App Router: edit app/layout.tsx to add a client component that initializes OneSignal.
If Pages Router: edit pages/_app.tsx to initialize OneSignal inside useEffect.

Use this initialization logic:

  OneSignal.init({
    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
    serviceWorkerParam: { scope: '/push/onesignal/' },
  });

  OneSignal.on('subscriptionChange', async (isSubscribed: boolean) => {
    if (isSubscribed) {
      const playerId = await OneSignal.getUserId();
      if (playerId) {
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: playerId }),
        });
      }
    }
  });

---

## Step 5 — Create the subscribe API route

If App Router: create app/api/subscribe/route.ts
If Pages Router: create pages/api/subscribe.ts

The route should:
- Accept POST with { player_id: string }
- Insert into push_subscribers table in Supabase
- Return 200 on success, 500 on error
- Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment variables

---

## Step 6 — Add the OneSignal service worker

Create the file: public/push/onesignal/OneSignalSDKWorker.js

Contents:
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

---

## Step 7 — Update the Cloudflare Worker (wrangler)

Edit wrangler.toml to add a daily cron trigger:
  [triggers]
  crons = ["0 9 * * *"]

Then create or update the Worker entry file (worker.ts or src/index.ts) with a scheduled handler:

  export default {
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/push_subscribers?select=player_id`, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });

      if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);

      const subscribers: { player_id: string }[] = await res.json();
      const playerIds = subscribers.map(s => s.player_id);

      if (playerIds.length === 0) return;

      const notifRes = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: env.ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings: { en: 'Daily Update' },
          contents: { en: 'You have a new update.' },
        }),
      });

      if (!notifRes.ok) throw new Error(`OneSignal API failed: ${notifRes.status}`);
    },
  };

---

## Step 8 — Environment variables

Add the following to .env.local (create if missing):
  NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

Remind the user to set these secrets in Cloudflare via wrangler:
  wrangler secret put SUPABASE_URL
  wrangler secret put SUPABASE_ANON_KEY
  wrangler secret put ONESIGNAL_REST_API_KEY
  wrangler secret put ONESIGNAL_APP_ID

---

## Step 9 — Error checking

After completing all steps, go through each file you created or modified and:
- Check for TypeScript errors (missing types, wrong imports, undefined variables).
- Verify all environment variables are referenced correctly.
- Confirm the Supabase client is initialized with the right keys.
- Confirm OneSignal is only initialized client-side (inside useEffect or a 'use client' component).
- Confirm the Worker scheduled handler has proper error handling with try/catch.
- If any issue is found, fix it and re-check.

Report a summary at the end: list every file changed, what was done, and confirm no errors remain.