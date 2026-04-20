import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase — uses @supabase/ssr so the session is stored in cookies
// which the middleware can read for server-side auth checks.
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
